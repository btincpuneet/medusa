// scripts/customers.js
const fs = require("fs")
const path = require("path")
const readline = require("readline")
const { paginateMagento, md } = require("./clients")
const { loadMap, saveMap } = require("./id-map")
const { limiter } = require("./utils")

// tiny helper for Magento custom attributes
const attr = (ent, code, fb = null) =>
  (ent.custom_attributes || []).find((a) => a.attribute_code === code)?.value ?? fb

const genderMap = { 1: "Male", 2: "Female", 3: "Not Specified" }
const FORCE_BACKFILL = process.env.FORCE_BACKFILL_HASH === "1"

// --- CSV loader (email,password_hash) with quotes/space cleanup
async function loadPasswordMap() {
  const tryPaths = [
    process.env.MAGENTO_PASSWORD_CSV, // explicit override
    "./customers.csv",                // repo root (your file)
    "./data/customers.csv",
    "./data/customer_passwords.csv",
  ].filter(Boolean)

  let found = null
  for (const p of tryPaths) {
    const abs = path.resolve(p)
    if (fs.existsSync(abs)) { found = abs; break }
  }

  if (!found) {
    console.warn("⚠️ No password CSV found. Checked:", tryPaths.join(", "))
    return {}
  }

  console.log("📄 using password CSV:", found)

  const map = {}
  const rl = readline.createInterface({
    input: fs.createReadStream(found),
    crlfDelay: Infinity,
  })

  let header = []
  for await (const rawLine of rl) {
    const line = rawLine.replace(/^\uFEFF/, "") // strip BOM
    if (!line.trim()) continue
    const row = line.split(",") // simple split; no commas expected inside fields

    if (!header.length) {
      header = row.map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""))
      continue
    }

    const data = {}
    header.forEach((h, i) => {
      const v = (row[i] || "").trim().replace(/^"|"$/g, "")
      data[h] = v
    })

    const email = (data.email || "").trim().toLowerCase()
    const hash = (data.password_hash || "").trim()
    if (email && hash) {
      map[email] = hash
    }
  }
  return map
}

function detectAlgo(hash) {
  if (!hash) return null
  if (hash.startsWith("$2y$") || hash.startsWith("$2a$") || hash.startsWith("$2b$")) return "bcrypt"
  if (hash.startsWith("$argon2id$")) return "argon2id"
  return "unknown"
}

// (kept for 409 email-collision fallback only)
async function getCustomerByEmail(email) {
  try {
    const { data } = await md.get("/customers", { params: { q: email, limit: 1 } })
    const found = (data?.customers || [])[0]
    return found || null
  } catch (_) {
    return null
  }
}

function hasLegacyHash(meta) {
  return !!(meta && (meta.magento_password_hash || meta.magento_hash_algo))
}

async function patchCustomerAddLegacyHashById(id, hash) {
  const algo = detectAlgo(hash)
  try {
    await md.post(`/customers/${id}`, {
      metadata: {
        magento_password_hash: hash,
        magento_hash_algo: algo,
      },
    })
    return true
  } catch (e) {
    console.warn("⚠️ patch failed", id, e.response?.data || e.message)
    return false
  }
}

async function run() {
  const map = loadMap()
  const pwMap = await loadPasswordMap()

  console.log(`🔐 loaded Magento password hashes = ${Object.keys(pwMap).length}`)
  console.log(`🗺️ mapped customers in id-map = ${Object.keys(map.customers || {}).length}`)

  const limit = limiter(6) // a bit of parallelism
  let created = 0,
    reused = 0,
    skipped = 0,
    backfilled = 0,
    noHashInCsv = 0,
    triedBackfill = 0

  // Ask Magento for exactly what we need (faster + fewer 413s)
  const pathQ =
    '/customers/search?fields=' +
    'items[' +
    'id,firstname,lastname,email,created_at,website_id,group_id,confirmation,' +
    'created_in,dob,taxvat,gender,' +
    'addresses[firstname,lastname,telephone,postcode,country_id,region[region,region_code],city,street],' +
    'custom_attributes' +
    '],' +
    'search_criteria,total_count'

  for await (const page of paginateMagento(pathQ)) {
    const tasks = page.map((c) =>
      limit(async () => {
        const key = String(c.id)
        const emailLc = (c.email || "").trim().toLowerCase()
        const legacyHash = pwMap[emailLc] || null

        // If already mapped → PATCH DIRECTLY BY ID (no GET)
        if (map.customers[key]) {
          const existingId = map.customers[key]

          if (legacyHash) {
            triedBackfill++
            const ok = await patchCustomerAddLegacyHashById(existingId, legacyHash)
            if (ok) {
              backfilled++
              console.log(`🔁 backfilled hash for ${c.email} → ${existingId}`)
            }
          } else {
            noHashInCsv++
          }

          skipped++
          if (!FORCE_BACKFILL) return
          return
        }

        // Not mapped yet → create
        const addresses = Array.isArray(c.addresses) ? c.addresses : []
        const primaryAddress =
          addresses.find((address) => address?.default_billing) ||
          addresses.find((address) => address?.default_shipping) ||
          addresses[0] ||
          {}

        const phone =
          primaryAddress.telephone ||
          attr(c, "telephone") ||
          addresses.map((address) => address?.telephone).find(Boolean) ||
          null
        const region = primaryAddress.region || {}
        const state = region.region || region.region_code || null
        const postcode = primaryAddress.postcode || null
        const country = primaryAddress.country_id || null
        const company = primaryAddress.company || attr(c, "company") || null

        const company_code = attr(c, "company_code", null)
        const access_id = attr(c, "access_id", null)
        const approve_customer = attr(c, "approve_customer", null)
        const website_name = attr(c, "created_in", c.created_in || null)

        const confirmed_email = c.confirmation ? "Confirmation Required" : "Confirmation Not Required"
        const gender_label = genderMap[c.gender] || null

        const payload = {
          email: c.email,
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
            phone,
            zip: postcode,
            country,
            state,
            city: primaryAddress.city || null,
            street: Array.isArray(primaryAddress.street)
              ? primaryAddress.street.join(", ")
              : primaryAddress.street || null,
            company_code,
            access_id,
            approve_customer,
            ...(legacyHash
              ? {
                  magento_password_hash: legacyHash,
                  magento_hash_algo: detectAlgo(legacyHash),
                }
              : {}),
          },
        }

        try {
          const { data } = await md.post("/customers", payload)
          const customerId = data.customer.id
          map.customers[key] = customerId
          saveMap(map)
          created++
          console.log(`✔ customer ${c.email} → ${customerId}`)

          // addresses
          const addressPayloads = addresses
            .map((address) => {
              if (!address) return null
              const addressRegion = address.region || {}
              const streetLines = Array.isArray(address.street)
                ? address.street.filter(Boolean)
                : address.street
                ? [address.street]
                : []
              const [line1, ...rest] = streetLines
              const addressPhone =
                address.telephone || phone || attr(c, "telephone") || ""
              const addressCompany =
                address.company || company || attr(c, "company") || ""

              const hasContent =
                Boolean(line1) ||
                rest.length > 0 ||
                address.city ||
                address.postcode ||
                addressPhone ||
                address.country_id
              if (!hasContent) return null

              return {
                first_name: address.firstname || c.firstname || "",
                last_name: address.lastname || c.lastname || "",
                address_name:
                  [address.firstname || c.firstname, address.lastname || c.lastname]
                    .filter(Boolean)
                    .join(" ") || null,
                address_1: line1 || "",
                address_2: rest.join(", "),
                city: address.city || "",
                province: addressRegion.region || addressRegion.region_code || state || "",
                postal_code: address.postcode || postcode || "",
                country_code: (address.country_id || country || "").toLowerCase(),
                phone: addressPhone,
                company: addressCompany,
                is_default_shipping: Boolean(address.default_shipping),
                is_default_billing: Boolean(address.default_billing),
                metadata: {
                  magento_address_id: address.id ?? null,
                  magento_customer_id: c.id,
                  magento_country_id: address.country_id || country,
                  magento_region_id: addressRegion.region_id ?? region.region_id ?? null,
                  magento_region_code:
                    addressRegion.region_code ?? region.region_code ?? null,
                },
              }
            })
            .filter(Boolean)

          for (const ap of addressPayloads) {
            await md.post(`/customers/${customerId}/addresses`, ap).catch((e) =>
              console.warn("⚠️ address", c.email, e.response?.data || e.message)
            )
          }

          // Only set temp password if no legacy hash
          if (!legacyHash) {
            const tempPw = Math.random().toString(36).slice(-10)
            await md.post(`/customers/${customerId}`, { password: tempPw }).catch((e) =>
              console.warn("⚠️ password", c.email, e.response?.data || e.message)
            )
          }
        } catch (e) {
          if (e.response?.status === 409) {
            // Email collision → map and try to backfill by Medusa ID
            let existingId = map.customers[key]
            if (!existingId) {
              const existing = await getCustomerByEmail(c.email)
              if (existing?.id) {
                existingId = existing.id
                map.customers[key] = existingId
                saveMap(map)
              }
            }

            if (existingId) {
              reused++
              console.log(`↺ reused customer ${c.email} → ${existingId}`)

              if (legacyHash) {
                triedBackfill++
                const ok = await patchCustomerAddLegacyHashById(existingId, legacyHash)
                if (ok) {
                  backfilled++
                  console.log(`🔁 backfilled hash for ${c.email} → ${existingId}`)
                }
              } else {
                noHashInCsv++
              }
              return
            }
          }
          console.error("❌ customer", c.email, e.response?.data || e.message)
        }
      })
    )

    await Promise.all(tasks)
  }

  console.log(
    `\n✅ Customers done. created=${created}, reused=${reused}, skipped=${skipped}, backfilled_hash=${backfilled}, tried_backfill=${triedBackfill}, no_hash_in_csv=${noHashInCsv}`
  )
}

if (require.main === module) {
  run().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}

module.exports = run
