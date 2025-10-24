// migrate.js
// Script: Migrate Magento 2 Products & Customers → Medusa (Node.js)
// Usage:
//   1. npm install axios
//   2. Configure Magento & Medusa credentials below
//   3. node migrate.js

const axios = require("axios")

// ----- Configuration -----
const MAGENTO_BASE_URL   = "http://local.b2c.com/admin"; // Local Magento URL
const MAGENTO_TOKEN      = "eyJraWQiOiIxIiwiYWxnIjoiSFMyNTYifQ..."; // Magento Admin JWT

const MEDUSA_BASE_URL    = "http://localhost:9000"; // Medusa server URL
const MEDUSA_ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // Medusa Secret API Key
const MEDUSA_PUB_KEY     = "pk_4493071dacc0b90cf72822c8a328a49b383da3b60bdce5964f5310223c245e49" // only if you use store API option

// Create axios instances
const magentoApi = axios.create({
  baseURL: `${MAGENTO_BASE_URL}/rest/`,
  headers: { Authorization: `Bearer ${MAGENTO_TOKEN}` },
})

const medusaAdminApi = axios.create({
  baseURL: `${MEDUSA_BASE_URL}/admin`,
  headers: {
    Authorization: `Bearer ${MEDUSA_ADMIN_TOKEN}`,
    "Content-Type": "application/json",
  },
})

const medusaStoreApi = axios.create({
  baseURL: `${MEDUSA_BASE_URL}/store`,
  headers: {
    "Content-Type": "application/json",
    "x-publishable-api-key": MEDUSA_PUB_KEY,
  },
})

// ----- ADDED: Magento Storefront Client & Helper -----
const magentoStoreApi = axios.create({
  baseURL: MAGENTO_BASE_URL.replace(/\/admin\/?$/, "") + "/rest/default/",
})

async function fetchMagentoStorefrontPaginated(path, criteria = {}) {
  let page = 1
  const perPage = criteria.pageSize || 100
  let allItems = []

  while (true) {
    const params = {
      ...criteria,
      "searchCriteria[pageSize]": perPage,
      "searchCriteria[currentPage]": page,
    }
    const resp = await magentoStoreApi.get(path, { params })
    const items = resp.data.items || []
    if (!items.length) break
    allItems = allItems.concat(items)
    page++
  }

  return allItems
}
// ----- END ADDED -----


// ----- Helper: Pagination fetch from Magento -----
async function fetchMagentoPaginated(path, criteria = {}) {
  let page = 1
  const perPage = criteria.pageSize || 100
  let allItems = []

  while (true) {
    const params = {
      ...criteria,
      "searchCriteria[pageSize]": perPage,
      "searchCriteria[currentPage]": page,
    }
    const resp = await magentoApi.get(path, { params })
    const items = resp.data.items || []
    if (!items.length) break
    allItems = allItems.concat(items)
    page++
  }

  return allItems
}

// ----- Migrate Products (NOW uses storefront API) -----
async function migrateProducts() {
  console.log("Starting product migration...")
  // ← CHANGED to use storefront endpoint
  const products = await fetchMagentoStorefrontPaginated("products")

  for (const item of products) {
    const descAttr = item.custom_attributes.find(
      (a) => a.attribute_code === "description"
    )
    const payload = {
      title: item.name,
      handle: item.sku,
      description: descAttr?.value || "",
      is_giftcard: false,
      status: item.status === 1 ? "published" : "draft",
      variants: [
        {
          sku: item.sku,
          manage_inventory: true,
          inventory_quantity: item.extension_attributes?.stock_item?.qty || 0,
          allow_backorder:
            item.extension_attributes?.stock_item?.backorders > 0,
          prices: [{ amount: item.price, currency_code: "USD" }],
        },
      ],
    }
    try {
      await medusaAdminApi.post("/products", payload)
      console.log(`✅ Created product ${item.sku}`)
    } catch (err) {
      console.error(
        `❌ Error creating product ${item.sku}:`,
        err.response?.data || err.message
      )
    }
  }

  console.log("Product migration complete.")
}

// ----- Migrate Customers (two-step Admin API) -----
async function migrateCustomers() {
  console.log("Starting customer migration...")
  const customers = await fetchMagentoPaginated("customers/search")

  for (const cust of customers) {
    const randomPassword = Math.random().toString(36).slice(-8)

    try {
      // 1) Create customer without password
      const createRes = await medusaAdminApi.post("/customers", {
        email:      cust.email,
        first_name: cust.firstname,
        last_name:  cust.lastname,
      })
      const customerId = createRes.data.customer.id
      console.log(`✅ Created ${cust.email} (id=${customerId})`)

      // 2) Update customer to set password
      await medusaAdminApi.post(`/customers/${customerId}`, {
        password: randomPassword,
      })
      console.log(`🔑 Set password for ${cust.email}`)
    } catch (err) {
      console.error(
        `❌ Error migrating customer ${cust.email}:`,
        err.response?.data || err.message
      )
    }
  }

  console.log("Customer migration complete.")
}

// ----- Main Runner -----
;(async () => {
  try {
    await migrateProducts()
    await migrateCustomers()
    console.log("🎉 Migration finished successfully.")
  } catch (err) {
    console.error("Migration failed:", err)
    process.exit(1)
  }
})()
