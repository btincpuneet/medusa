// migrate.js
// Usage: put credentials in .env, then: node migrate.js
// Required .env keys:
// MAGENTO_REST_BASE_URL=http://local.b2c.com/rest/all/V1   # (or /rest/default/V1)
// MAGENTO_ADMIN_TOKEN=xxxxx
// MEDUSA_BASE_URL=http://localhost:9000
// MEDUSA_ADMIN_TOKEN=sk_xxx
// DEFAULT_CURRENCY=inr

const fs = require("fs")
const path = require("path")
const axios = require("axios")

// -------------------- .ENV LOADER (works from / or /scripts) --------------------
const envCandidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../.env"),
]
const envPath = envCandidates.find((p) => fs.existsSync(p))
require("dotenv").config({ path: envPath })
console.log("🔧 Loaded .env from:", envPath || "(none)")

// -------------------- ENV & VALIDATION --------------------
const MAGENTO_REST_BASE_URL = (process.env.MAGENTO_REST_BASE_URL || "").trim().replace(/\/+$/,"")
const MAGENTO_ADMIN_TOKEN   = (process.env.MAGENTO_ADMIN_TOKEN   || "").trim()

const MEDUSA_BASE_URL       = (process.env.MEDUSA_BASE_URL       || "http://localhost:9000").trim().replace(/\/+$/,"")
const MEDUSA_ADMIN_TOKEN    = (process.env.MEDUSA_ADMIN_TOKEN    || "").trim()
const DEFAULT_CURRENCY      = (process.env.DEFAULT_CURRENCY      || "inr").toLowerCase()

const missing = []
if (!MAGENTO_REST_BASE_URL) missing.push("MAGENTO_REST_BASE_URL (e.g. http://local.b2c.com/rest/all/V1)")
if (!MAGENTO_ADMIN_TOKEN)   missing.push("MAGENTO_ADMIN_TOKEN")
if (!MEDUSA_BASE_URL)       missing.push("MEDUSA_BASE_URL")
if (!MEDUSA_ADMIN_TOKEN)    missing.push("MEDUSA_ADMIN_TOKEN")
if (missing.length) {
  console.error("❌ Missing required env:", missing.join(", "))
  process.exit(1)
}

// -------------------- CLIENTS --------------------
const magento = axios.create({
  baseURL: MAGENTO_REST_BASE_URL, // already includes /rest/(all|default)/V1
  headers: { Authorization: `Bearer ${MAGENTO_ADMIN_TOKEN}` },
  timeout: 90000,
})

const medusaAdmin = axios.create({
  baseURL: `${MEDUSA_BASE_URL}/admin`,
  headers: {
    Authorization: `Bearer ${MEDUSA_ADMIN_TOKEN}`,
    "x-medusa-access-token": MEDUSA_ADMIN_TOKEN,
    "Content-Type": "application/json",
  },
  timeout: 90000,
})

// -------------------- UTILS --------------------
const cents = (x) => {
  const n = parseFloat(x)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}
const toHandle = (s) =>
  (s || "").toString().trim().toLowerCase()
    .replace(/[^a-z0-9\-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
const attr = (ent, code, fb=null) =>
  (ent.custom_attributes || []).find(a => a.attribute_code === code)?.value ?? fb

async function* paginateMagento(pathStr, pageSize = 150, extra = {}) {
  let page = 1, got = 0, total = Infinity
  while (got < total) {
    const { data } = await magento.get(pathStr, {
      params: {
        "searchCriteria[currentPage]": page,
        "searchCriteria[pageSize]": pageSize,
        // harmless filter fixes some installs
        "searchCriteria[filter_groups][0][filters][0][field]": "entity_id",
        "searchCriteria[filter_groups][0][filters][0][condition_type]": "gt",
        "searchCriteria[filter_groups][0][filters][0][value]": "0",
        ...extra,
      },
    })
    if (page === 1 && typeof data.total_count !== "undefined") {
      console.log(`🔎 ${pathStr} total_count=${data.total_count}`)
      total = data.total_count || 0
    }
    const items = data.items || []
    if (!items.length) break
    yield items
    got += items.length
    page++
  }
}

// -------------------- PRODUCTS --------------------
async function migrateProducts() {
  console.log("▶ Products: fetching from Magento...")
  for await (const page of paginateMagento(
    "/products?fields=items[id,sku,name,type_id,price,status,custom_attributes,extension_attributes,media_gallery_entries],search_criteria,total_count"
  )) {
    for (const p of page) {
      const description = attr(p, "description", "")
      const handle = toHandle(attr(p, "url_key", p.sku || p.name))
      const status = p.status === 1 ? "published" : "draft"

      try {
        // 1) base product
        const { data: base } = await medusaAdmin.post("/products", {
          title: p.name,
          handle,
          description,
          status,
          metadata: { magento_id: p.id, type: p.type_id }
        })
        const productId = base.product.id

        // 2) variant (simple). For configurables, add options + children after.
        const price = cents(p.price)
        await medusaAdmin.post(`/products/${productId}/variants`, {
          title: p.name,
          sku: p.sku,
          prices: [{ amount: price, currency_code: DEFAULT_CURRENCY }],
        }).catch(e => console.error("❌ variant", p.sku, e.response?.data || e.message))

        // 3) images (reference Magento media URLs)
        for (const img of (p.media_gallery_entries || [])) {
          const url = MAGENTO_REST_BASE_URL.replace(/\/rest\/(all|default)?\/V1$/,"")
                    + `/pub/media/catalog/product${img.file}`
          await medusaAdmin.post(`/products/${productId}/images`, { url }).catch(()=>{})
        }

        console.log(`✔ product ${p.sku}`)
      } catch (e) {
        console.error("❌ product base", p.sku, e.response?.data || e.message)
      }
    }
  }
  console.log("✅ Products done.\n")
}

// -------------------- CUSTOMERS --------------------
const genderMap = { 1: "Male", 2: "Female", 3: "Not Specified" }

async function migrateCustomers() {
  console.log("▶ Customers: fetching from Magento...")
  for await (const page of paginateMagento(
    "/customers/search?fields=items[id,firstname,lastname,email,created_at,website_id,group_id,confirmation,created_in,dob,taxvat,gender,addresses[firstname,lastname,telephone,postcode,country_id,region[region,region_code],city,street],custom_attributes]"
  )) {
    for (const c of page) {
      const addr = (c.addresses && c.addresses[0]) || {}
      const phone = addr.telephone || null
      const region = addr.region || {}
      const state = region.region || region.region_code || null
      const postcode = addr.postcode || null
      const country = addr.country_id || null

      // custom attributes shown in your grid (adjust codes if different)
      const company_code     = attr(c, "company_code", null)
      const access_id        = attr(c, "access_id", null)
      const approve_customer = attr(c, "approve_customer", null)

      const confirmed_email  = c.confirmation ? "Confirmation Required" : "Confirmation Not Required"
      const gender_label     = genderMap[c.gender] || null

      try {
        const { data } = await medusaAdmin.post("/customers", {
          email: c.email,
          first_name: c.firstname,
          last_name: c.lastname,
          metadata: {
            magento_id: c.id,
            group_id: c.group_id ?? null,
            website_id: c.website_id ?? null,
            created_at: c.created_at,
            created_in: c.created_in || null,
            confirmed_email,
            dob: c.dob || null,
            tax_vat_number: c.taxvat || null,
            gender: gender_label,
            phone,
            zip: postcode,
            country,
            state,
            city: addr.city || null,
            street: Array.isArray(addr.street) ? addr.street.join(", ") : (addr.street || null),
            company_code,
            access_id,
            approve_customer,
          }
        })
        const customerId = data.customer.id
        console.log(`✔ customer ${c.email} (id=${customerId})`)

        // address
        if (country || postcode || phone) {
          await medusaAdmin.post(`/customers/${customerId}/addresses`, {
            first_name: c.firstname,
            last_name:  c.lastname,
            address_1:  Array.isArray(addr.street) ? addr.street[0] : (addr.street || ""),
            address_2:  Array.isArray(addr.street) && addr.street[1] ? addr.street.slice(1).join(", ") : "",
            city:       addr.city || "",
            province:   state || "",
            postal_code: postcode || "",
            country_code: (country || "").toLowerCase(),
            phone:      phone || "",
          }).catch(e => console.warn("⚠️ address", c.email, e.response?.data || e.message))
        }

        // temp password (optional)
        const pw = Math.random().toString(36).slice(-10)
        await medusaAdmin.post(`/customers/${customerId}`, { password: pw })
          .catch(e => console.warn("⚠️ password", c.email, e.response?.data || e.message))

      } catch (e) {
        console.error(`❌ customer ${c.email}`, e.response?.data || e.message)
      }
    }
  }
  console.log("✅ Customers done.\n")
}

// -------------------- RUN --------------------
;(async () => {
  try {
    await migrateProducts()
    await migrateCustomers()
    console.log("🎉 Migration finished.")
  } catch (err) {
    console.error("Migration failed:", err)
    process.exit(1)
  }
})()
