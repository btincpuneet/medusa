const axios = require("axios")
require("dotenv").config()

async function main() {
  const base = (process.env.MAGENTO_REST_BASE_URL || "").trim().replace(/\/+$/, "")
  if (!base) {
    console.error("No MAGENTO_REST_BASE_URL configured.")
    process.exit(1)
  }

  const token = (process.env.MAGENTO_TOKEN || process.env.MAGENTO_ADMIN_TOKEN || "").trim()
  if (!token) {
    console.error("Missing MAGENTO_TOKEN / MAGENTO_ADMIN_TOKEN.")
    process.exit(1)
  }

  const params = {
    "searchCriteria[currentPage]": 1,
    "searchCriteria[pageSize]": 10,
    fields: "items[id,sku,name,type_id,price]"
  }

  const { data } = await axios.get(`${base}/products`, {
    headers: { Authorization: `Bearer ${token}` },
    params
  })

  console.log(`Response keys: ${Object.keys(data)}`)
  const items = Array.isArray(data) ? data : data.items
  console.log(`Total items in this page: ${items?.length ?? 0}`)
  console.log(items)
}

main().catch((err) => {
  console.error("Request failed:", err.response?.status, err.response?.data || err.message)
  process.exit(1)
})
