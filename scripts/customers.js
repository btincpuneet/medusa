// scripts/upsert-customers-admin.js
// Upsert Magento customers into Medusa using ADMIN endpoints.
// - Updates existing customers by email (full field sync)
// - Reconciles addresses: update existing (matched by magento_address_id), create missing,
//   and optional delete of orphans not found in Magento
//
// ENV toggles:
//   UPSERT_CREATE_MISSING=1 (default 1)
//   UPSERT_UPDATE_EXISTING=1 (default 1)
//   UPSERT_DELETE_ORPHANS=0 (default 0)
//   FORCE_BACKFILL_HASH=1 (default 0)

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { Pool } = require("pg");
const { paginateMagento, md, mgGet } = require("./clients");
const { loadMap, saveMap } = require("./id-map");
const { limiter } = require("./utils");

const CREATE_MISSING = process.env.UPSERT_CREATE_MISSING !== "0";
const UPDATE_EXISTING = process.env.UPSERT_UPDATE_EXISTING !== "0";
const DELETE_ORPHANS = process.env.UPSERT_DELETE_ORPHANS === "1";
const FORCE_BACKFILL = process.env.FORCE_BACKFILL_HASH === "1";

const DATABASE_URL = process.env.DATABASE_URL || null;
let pgPool = null;
let warnedMissingDatabase = false;

function getPgPool() {
  if (pgPool) return pgPool;
  if (!DATABASE_URL) {
    if (!warnedMissingDatabase) {
      console.warn(
        "⚠️ DATABASE_URL is not set. Imported customers will remain guests (has_account=false)."
      );
      warnedMissingDatabase = true;
    }
    return null;
  }
  pgPool = new Pool({ connectionString: DATABASE_URL });
  return pgPool;
}

async function closePgPool() {
  if (pgPool) {
    await pgPool.end().catch(() => {});
    pgPool = null;
  }
}

const attr = (ent, code, fb = null) =>
  (ent.custom_attributes || []).find((a) => a.attribute_code === code)?.value ?? fb;

const genderMap = { 0: "Not Specified", 1: "Male", 2: "Female", 3: "Not Specified" };

const magentoGroupCache = new Map(); // Magento group id -> Magento group payload
const medusaGroupByMagentoId = new Map(); // Magento group id -> Medusa group
const medusaGroupByName = new Map(); // lower-case name -> Medusa group
const medusaGroupCreationLocks = new Map(); // Magento group id -> inflight creation promise
let medusaGroupsPrimed = false;
let medusaGroupsPrimePromise = null;

const groupKey = (id) => {
  if (id === null || typeof id === "undefined") return null;
  return String(id);
};

function recordMedusaGroup(group) {
  if (!group) return;
  if (group.name) {
    medusaGroupByName.set(group.name.toLowerCase(), group);
  }
  const metaId = group?.metadata?.magento_group_id;
  const key = groupKey(metaId);
  if (key) {
    medusaGroupByMagentoId.set(key, group);
  }
}

async function fetchMagentoCustomerGroup(magentoGroupId) {
  const key = groupKey(magentoGroupId);
  if (!key) return null;
  if (magentoGroupCache.has(key)) return magentoGroupCache.get(key);
  try {
    const { data } = await mgGet(`/customerGroups/${magentoGroupId}`);
    magentoGroupCache.set(key, data);
    return data;
  } catch (e) {
    console.warn("⚠️ getMagentoCustomerGroup", magentoGroupId, e.response?.data || e.message);
    magentoGroupCache.set(key, null);
    return null;
  }
}

async function primeMedusaCustomerGroups() {
  if (medusaGroupsPrimed) return;
  if (medusaGroupsPrimePromise) {
    await medusaGroupsPrimePromise;
    return;
  }
  medusaGroupsPrimePromise = (async () => {
    try {
      const limit = 100;
      let offset = 0;
      while (true) {
        const { data } = await md.get("/customer-groups", {
          params: { limit, offset, fields: "id,name,metadata" },
        });
        const groups = data?.customer_groups || [];
        for (const group of groups) {
          recordMedusaGroup(group);
        }
        if (groups.length < limit) break;
        offset += groups.length;
      }
      medusaGroupsPrimed = true;
    } catch (e) {
      console.warn("⚠️ list customer groups", e.response?.data || e.message);
    } finally {
      medusaGroupsPrimePromise = null;
    }
  })();
  await medusaGroupsPrimePromise;
}

async function ensureMedusaCustomerGroup(magentoGroupId) {
  const key = groupKey(magentoGroupId);
  if (!key) return null;

  await primeMedusaCustomerGroups();
  if (medusaGroupByMagentoId.has(key)) return medusaGroupByMagentoId.get(key);

  const magentoGroup = await fetchMagentoCustomerGroup(magentoGroupId);
  if (!magentoGroup) return null;

  const magName = (magentoGroup.code || "").toLowerCase();
  if (magName && medusaGroupByName.has(magName)) {
    const group = medusaGroupByName.get(magName);
    medusaGroupByMagentoId.set(key, group);
    return group;
  }

  if (!medusaGroupCreationLocks.has(key)) {
    const promise = (async () => {
      try {
        const payload = {
          name: magentoGroup.code || `Magento Group ${magentoGroupId}`,
          metadata: {
            magento_group_id: magentoGroupId,
            magento_group_code: magentoGroup.code || null,
          },
        };
        const { data } = await md.post("/customer-groups", payload);
        const group = data?.customer_group || null;
        if (group) {
          recordMedusaGroup(group);
          groupsCreated++;
        }
        return group;
      } catch (e) {
        console.error("❌ create customer group", magentoGroupId, e.response?.data || e.message);
        throw e;
      } finally {
        medusaGroupCreationLocks.delete(key);
      }
    })();
    medusaGroupCreationLocks.set(key, promise);
  }
  return medusaGroupCreationLocks.get(key);
}

async function syncCustomerGroupMembership(customer, magentoGroupId, currentGroups) {
  const key = groupKey(magentoGroupId);
  if (!key) return;

  const medusaGroup = await ensureMedusaCustomerGroup(magentoGroupId);
  if (!medusaGroup) return;

  const groupId = medusaGroup.id;
  const current = Array.isArray(currentGroups) ? currentGroups : [];
  const alreadyLinked = current.some((g) => g?.id === groupId);
  if (alreadyLinked) return;

  try {
    await md.post(`/customer-groups/${groupId}/customers`, { add: [customer.id] });
    groupsLinked++;
  } catch (e) {
    if (e.response?.status === 409) return;
    console.warn("⚠️ link customer group", customer.email, e.response?.data || e.message);
  }
}

let groupsLinked = 0;
let groupsCreated = 0;

// ---------------- Password CSV (email,password_hash) ------------------------
async function loadPasswordMap() {
  const tryPaths = [
    process.env.MAGENTO_PASSWORD_CSV,
    "./customers.csv",
    "./data/customers.csv",
    "./data/customer_passwords.csv",
  ].filter(Boolean);

  let found = null;
  for (const p of tryPaths) {
    const abs = path.resolve(p);
    if (fs.existsSync(abs)) { found = abs; break; }
  }
  if (!found) {
    console.warn("⚠️ No password CSV found. Checked:", tryPaths.join(", "));
    return {};
  }

  console.log("📄 Using password CSV:", found);

  const map = {};
  const rl = readline.createInterface({
    input: fs.createReadStream(found),
    crlfDelay: Infinity,
  });

  let header = [];
  for await (const rawLine of rl) {
    const line = rawLine.replace(/^\uFEFF/, "");
    if (!line.trim()) continue;
    const row = line.split(",");

    if (!header.length) {
      header = row.map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
      continue;
    }
    const data = {};
    header.forEach((h, i) => {
      const v = (row[i] || "").trim().replace(/^"|"$/g, "");
      data[h] = v;
    });

    const email = (data.email || "").trim().toLowerCase();
    const hash = (data.password_hash || "").trim();
    if (email && hash) map[email] = hash;
  }
  return map;
}

function detectAlgo(hash) {
  if (!hash) return null;
  if (hash.startsWith("$2y$") || hash.startsWith("$2a$") || hash.startsWith("$2b$")) return "bcrypt";
  if (hash.startsWith("$argon2id$")) return "argon2id";
  return "unknown";
}

// ---------------- Admin helpers --------------------------------------------
async function getAdminCustomerByEmail(email) {
  try {
    const { data } = await md.get("/customers", { params: { q: email, limit: 20 } });
    const emailLc = (email || "").toLowerCase();
    const match = (data?.customers || []).find(
      (c) => (c.email || "").toLowerCase() === emailLc
    );
    return match || null;
  } catch (e) {
    console.warn("⚠️ getAdminCustomerByEmail", email, e.response?.data || e.message);
    return null;
  }
}

async function getAdminCustomerWithAddresses(id) {
  try {
    const [customerRes, addrRes] = await Promise.all([
      md.get(`/customers/${id}`, {
        params: {
          fields:
            "id,company_name,first_name,last_name,email,phone,metadata,has_account,created_by,created_at,updated_at,deleted_at,groups",
        },
      }),
      md.get(`/customers/${id}/addresses`, { params: { limit: 100 } }),
    ]);
    const customer = customerRes.data?.customer || null;
    if (customer) {
      customer.addresses = addrRes.data?.addresses || [];
    }
    return customer;
  } catch (e) {
    console.warn("⚠️ getAdminCustomerWithAddresses", id, e.response?.data || e.message);
    return null;
  }
}

async function patchCustomerMeta(id, patch) {
  try {
    await md.post(`/customers/${id}`, patch);
    return true;
  } catch (e) {
    console.warn("⚠️ patchCustomerMeta", id, e.response?.data || e.message);
    return false;
  }
}

async function markCustomerAsRegistered(customerId) {
  if (!customerId) return false;
  const pool = getPgPool();
  if (!pool) return false;
  try {
    const { rowCount } = await pool.query(
      `
        UPDATE "customer"
        SET has_account = true,
            updated_at = NOW()
        WHERE id = $1
          AND deleted_at IS NULL
          AND has_account = false
      `,
      [customerId]
    );
    return rowCount > 0;
  } catch (e) {
    console.warn("⚠️ mark customer registered", customerId, e.message);
    return false;
  }
}

async function upsertCustomerBase(existing, payload) {
  if (existing) {
    // UPDATE
    try {
      const { data } = await md.post(`/customers/${existing.id}`, payload);
      return data.customer;
    } catch (e) {
      console.error("❌ update customer", existing.email, e.response?.data || e.message);
      throw e;
    }
  } else {
    // CREATE
    try {
      const { data } = await md.post("/customers", payload);
      return data.customer;
    } catch (e) {
      if (e.response?.status === 409) {
        // race or prior import; fetch and continue
        const found = await getAdminCustomerByEmail(payload.email);
        if (found) return found;
      }
      console.error("❌ create customer", payload.email, e.response?.data || e.message);
      throw e;
    }
  }
}

// ---------------- Address mapping ------------------------------------------
function toMedusaAddressPayload(customer, fallback, address) {
  if (!address) return null;

  const region = address.region || {};
  const streetLines = Array.isArray(address.street)
    ? address.street.filter(Boolean)
    : address.street
    ? [address.street]
    : [];
  const [line1, ...rest] = streetLines;

  const hasContent =
    Boolean(line1) ||
    rest.length > 0 ||
    address.city ||
    address.postcode ||
    address.country_id ||
    address.telephone;
  if (!hasContent) return null;

  const country_code = (address.country_id || fallback.country || "").toUpperCase();
  if (!country_code || country_code.length !== 2) {
    console.warn(`⚠️ Skipping address for ${customer.email} — invalid country_code`, address.country_id);
    return null;
  }

  const province = region.region || region.region_code || fallback.state || "";

  return {
    first_name: address.firstname || customer.firstname || "",
    last_name: address.lastname || customer.lastname || "",
    address_1: line1 || "",
    address_2: rest.join(", "),
    city: address.city || "",
    province,
    postal_code: address.postcode || fallback.postcode || "",
    country_code,
    phone: address.telephone || fallback.phone || "",
    company: address.company || fallback.company || "",
    is_default_shipping: !!address.default_shipping,
    is_default_billing: !!address.default_billing,
    metadata: {
      magento_address_id: address.id ?? null,
      magento_customer_id: customer.id,
      magento_country_id: address.country_id || fallback.country || null,
      magento_region_id: region.region_id ?? fallback.region_id ?? null,
      magento_region_code: region.region_code ?? fallback.region_code ?? null,
    },
  };
}

// Match by metadata.magento_address_id if present, else fuzzy hash
function keyFromMagentoAddress(a) {
  const idKey = a?.metadata?.magento_address_id ?? a?.metadata?.magento_addressId ?? null;
  if (idKey) return `magento:${idKey}`;
  const k = [
    (a.first_name || "").toLowerCase(),
    (a.last_name || "").toLowerCase(),
    (a.address_1 || "").toLowerCase(),
    (a.postal_code || "").toLowerCase(),
    (a.city || "").toLowerCase(),
    (a.country_code || "").toUpperCase(),
  ].join("|");
  return `hash:${k}`;
}

function keyFromMagentoSource(address, fallback, customer) {
  const region = address.region || {};
  const streetLines = Array.isArray(address.street)
    ? address.street.filter(Boolean)
    : address.street
    ? [address.street]
    : [];
  const [line1, ...rest] = streetLines;
  const country_code = (address.country_id || fallback.country || "").toUpperCase();

  const k = [
    (address.firstname || customer.firstname || "").toLowerCase(),
    (address.lastname || customer.lastname || "").toLowerCase(),
    (line1 || "").toLowerCase(),
    (address.postcode || fallback.postcode || "").toLowerCase(),
    (address.city || "").toLowerCase(),
    country_code,
  ].join("|");

  const idKey = address.id ? `magento:${address.id}` : null;
  return idKey || `hash:${k}`;
}

// ---------------- Main ------------------------------------------------------
async function run() {
  const map = loadMap();
  const pwMap = await loadPasswordMap();

  console.log(`🔐 Loaded Magento password hashes = ${Object.keys(pwMap).length}`);
  groupsLinked = 0;
  groupsCreated = 0;

  const limit = limiter(6);
  let created = 0,
    updated = 0,
    addressesCreated = 0,
    addressesUpdated = 0,
    addressesDeleted = 0,
    backfilled = 0,
    noHash = 0,
    registeredMarked = 0;

  const pathQ =
    '/customers/search?fields=' +
    'items[' +
    'id,firstname,lastname,email,created_at,website_id,group_id,confirmation,' +
    'created_in,dob,taxvat,gender,' +
    'addresses[id,firstname,lastname,telephone,postcode,country_id,region[region,region_code,region_id],city,street,default_billing,default_shipping,company],' +
    'custom_attributes' +
    '],' +
    'search_criteria,total_count';

  try {
    for await (const page of paginateMagento(pathQ)) {
      const tasks = page.map((c) =>
        limit(async () => {
          const email = (c.email || "").trim();
          const emailLc = email.toLowerCase();
          const legacyHash = pwMap[emailLc] || null;

          // Build fallback from a primary address
          const addresses = Array.isArray(c.addresses) ? c.addresses : [];
          const primary =
            addresses.find((a) => a?.default_billing) ||
            addresses.find((a) => a?.default_shipping) ||
            addresses[0] ||
            {};

          const phone =
            primary.telephone ||
            attr(c, "telephone") ||
            addresses.map((a) => a?.telephone).find(Boolean) ||
            null;
          const region = primary.region || {};
          const state = region.region || region.region_code || null;
          const postcode = primary.postcode || null;
          const country = primary.country_id || null;
          const company = primary.company || attr(c, "company") || null;

          const company_code = attr(c, "company_code", null);
          const access_id = attr(c, "access_id", null);
          const approve_customer = attr(c, "approve_customer", null);
          const website_name = attr(c, "created_in", c.created_in || null);
          const confirmed_email = c.confirmation ? "Confirmation Required" : "Confirmation Not Required";
          const gender_label = genderMap[c.gender] || null;

          const basePayload = {
            email,
            first_name: c.firstname,
            last_name: c.lastname,
            phone,
            company_name: company,
            metadata: {
              magento_id: c.id,
              group_id: c.group_id ?? null,
              website_id: c.website_id ?? null,
              created_at: c.created_at,
              created_in: website_name,
              confirmed_email,
              dob: c.dob || null,
              tax_vat_number: c.taxvat || null,
              gender: gender_label,
              // legacy snapshot (optional)
              phone, zip: postcode, country, state, city: primary.city || null,
              street: Array.isArray(primary.street) ? primary.street.join(", ") : primary.street || null,
              company_code, access_id, approve_customer,
              ...(legacyHash && {
                magento_password_hash: legacyHash,
                magento_hash_algo: detectAlgo(legacyHash),
              }),
            },
          };

          // Create or Update customer base
          const existing = await getAdminCustomerByEmail(email);
          const customer = await upsertCustomerBase(existing, basePayload);
          if (existing) updated++; else created++;

          if (await markCustomerAsRegistered(customer.id)) {
            registeredMarked++;
          }

          // Password: set temp if no legacy hash and customer lacks one
          if (legacyHash && FORCE_BACKFILL) {
            await patchCustomerMeta(customer.id, {
              metadata: {
                magento_password_hash: legacyHash,
                magento_hash_algo: detectAlgo(legacyHash),
              },
            }).then((ok) => ok && backfilled++);
          } else if (!legacyHash) {
            noHash++;
          }

          // Refresh with addresses
          const fresh = await getAdminCustomerWithAddresses(customer.id);
          const magentoGroupId = c.group_id;
          const customerForGroup = fresh || customer;
          const currentGroups = fresh?.groups || customer.groups || [];
          if (magentoGroupId !== null && typeof magentoGroupId !== "undefined") {
            await syncCustomerGroupMembership(customerForGroup, magentoGroupId, currentGroups);
          }
          const existingAddrs = Array.isArray(fresh?.addresses) ? fresh.addresses : [];

          // Build maps for matching
          const fallback = {
            phone, company, postcode, country, state,
            region_id: region.region_id ?? null, region_code: region.region_code ?? null,
          };

          // Map existing by key
          const existingMap = new Map();
          for (const a of existingAddrs) {
            const k = keyFromMagentoAddress(a);
            existingMap.set(k, a);
          }

          // Upsert each Magento address
          const seenKeys = new Set();
          for (const mAddr of addresses) {
            const ap = toMedusaAddressPayload(c, fallback, mAddr);
            if (!ap) continue;

            const k = keyFromMagentoSource(mAddr, fallback, c);
            seenKeys.add(k);

            const match = existingMap.get(k);

            if (match) {
              if (UPDATE_EXISTING) {
                // Update existing address
                try {
                  await md.post(`/customers/${customer.id}/addresses/${match.id}`, ap);
                  addressesUpdated++;
                } catch (e) {
                  console.warn("⚠️ update address", email, e.response?.data || e.message);
                }
              }
            } else if (CREATE_MISSING) {
              // Create new address
              try {
                await md.post(`/customers/${customer.id}/addresses`, ap);
                addressesCreated++;
              } catch (e) {
                console.warn("⚠️ create address", email, e.response?.data || e.message);
              }
            }
          }

          // Delete orphans (Medusa addresses not present in Magento)
          if (DELETE_ORPHANS && existingAddrs.length) {
            for (const a of existingAddrs) {
              const k = keyFromMagentoAddress(a);
              if (!seenKeys.has(k)) {
                try {
                  await md.delete(`/customers/${customer.id}/addresses/${a.id}`);
                  addressesDeleted++;
                } catch (e) {
                  console.warn("⚠️ delete address", email, e.response?.data || e.message);
                }
              }
            }
          }
        })
      );

      await Promise.all(tasks);
    }

    console.log(
      `\n✅ Upsert done. created=${created}, updated=${updated}, ` +
      `addr_created=${addressesCreated}, addr_updated=${addressesUpdated}, ` +
      `addr_deleted=${addressesDeleted}, legacy_backfilled=${backfilled}, no_hash=${noHash}, ` +
      `groups_created=${groupsCreated}, groups_linked=${groupsLinked}, registered_marked=${registeredMarked}`
    );
  } finally {
    await closePgPool();
  }
}

if (require.main === module) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = run;
