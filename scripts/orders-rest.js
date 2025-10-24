// scripts/orders-rest.js
// Magento → Medusa orders via Admin REST (Draft Order -> Mark Paid)
// Usage:
//   # Dry run
//   DRY_RUN=true npx medusa exec scripts/orders-rest.js
//   # Real import (needs admin key)
//   MEDUSA_ADMIN_API_KEY=sk_xxx npx medusa exec scripts/orders-rest.js

const axios = require("axios")

/** @param {import('@medusajs/framework/types').ExecArgs} param0 */
module.exports.default = async function migrate({ logger }) {
  const log = logger || console

  // ---------- REQUIRED ENV ----------
  const MAGENTO_TOKEN =
    (process.env.MAGENTO_TOKEN || process.env.MAGENTO_ADMIN_TOKEN || "").trim()
  if (!MAGENTO_TOKEN) throw new Error("Missing MAGENTO_TOKEN / MAGENTO_ADMIN_TOKEN")

  // Admin key: secret key created in Admin → Settings → Developer → Secret API Keys
  const ADMIN_KEY =
    (process.env.MEDUSA_ADMIN_API_KEY ||
      process.env.MEDUSA_SECRET_API_KEY ||
      process.env.MEDUSA_ADMIN_TOKEN ||
      process.env.MEDUSA_TOKEN ||
      process.env.MEDUSA_API_KEY ||
      "").trim()

  if (!ADMIN_KEY) {
    throw new Error(
      "Missing MEDUSA_ADMIN_API_KEY (or MEDUSA_SECRET_API_KEY / MEDUSA_ADMIN_TOKEN / MEDUSA_TOKEN / MEDUSA_API_KEY) for Admin REST."
    )
  }

  // ---------- CONFIG ----------
  const DRY_RUN = String(process.env.DRY_RUN || "").toLowerCase() === "true"
  const PAGE_SIZE = parseInt(process.env.PAGE_SIZE || "100", 10)
  const DEFAULT_CURRENCY = (process.env.DEFAULT_CURRENCY_CODE || "inr").toLowerCase()
  const DEFAULT_REGION_ID = (process.env.DEFAULT_REGION_ID || "").trim()

  const medusaBase = (process.env.MEDUSA_BASE_URL || "http://localhost:9000").replace(/\/+$/, "")
  const magentoRestBase = (process.env.MAGENTO_REST_BASE_URL || "").trim().replace(/\/+$/, "")
  const magentoBaseUrl = (process.env.MAGENTO_BASE_URL || "http://localhost").trim().replace(/\/+$/, "")
  const magentoScope = (process.env.MAGENTO_SCOPE || "").trim()
  const magentoApiVersion = (process.env.MAGENTO_API_VERSION || "V1").trim()

  const mgPrefix = magentoRestBase
    ? magentoRestBase
    : `${magentoBaseUrl}/rest/${magentoScope ? `${magentoScope}/` : ""}${magentoApiVersion}`

  log.info?.(`Magento REST: ${mgPrefix}`)
  log.info?.(`Medusa Admin: ${medusaBase}`)

  // ---------- HELPERS ----------
  const toInt = (v) => {
    const n = Number(v || 0)
    return Math.round(isFinite(n) ? n : 0)
  }
  const toMinor = (v) => Math.round(Number(v || 0) * 100)

  async function fetchMagento(path, page = 1) {
    const url = `${mgPrefix}/${path}`
    const params = {
      "searchCriteria[pageSize]": PAGE_SIZE,
      "searchCriteria[currentPage]": page,
    }
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${MAGENTO_TOKEN}` },
      params,
    })
    if (Array.isArray(data)) return data
    if (Array.isArray(data.items)) return data.items
    return data
  }

  async function fetchAll(path) {
    const out = []
    let page = 1
    for (;;) {
      const batch = await fetchMagento(path, page)
      if (!Array.isArray(batch) || batch.length === 0) break
      out.push(...batch)
      page++
    }
    return out
  }

  // ---- Medusa Admin REST wrappers ----
  // Your server accepts Admin API keys via HTTP Basic auth (same as your curl):
  // Authorization: Basic base64("sk_...:")
  const basicAuth = Buffer.from(`${ADMIN_KEY}:`).toString("base64")

  const admin = axios.create({
    baseURL: medusaBase,
    headers: {
      // Primary (proven working in your curl)
      Authorization: `Basic ${basicAuth}`,
      // Also send x-medusa-api-key for compatibility across setups
      "x-medusa-api-key": ADMIN_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    timeout: 15000,
  })

  // Helpful interceptor to print clearer errors for 401s
  admin.interceptors.response.use(
    (r) => r,
    (err) => {
      const status = err?.response?.status
      if (status === 401) {
        log.error?.(
          "401 Unauthorized from /admin/* — likely using a non-admin key, revoked/expired key, or missing Basic auth. " +
            "Ensure MEDUSA_ADMIN_API_KEY is an **Admin** secret key and Basic auth is applied."
        )
      }
      return Promise.reject(err)
    }
  )

  async function getDefaultRegionId() {
    if (DEFAULT_REGION_ID) return DEFAULT_REGION_ID
    const { data } = await admin.get("/admin/regions", { params: { limit: 1, fields: "id" } })
    const id = data?.regions?.[0]?.id
    if (!id) throw new Error("No regions found. Create a Region in Admin → Settings → Regions.")
    return id
  }

  async function findOrderByMagentoIncrementId(incId) {
    // We don’t have a direct metadata filter, so lightly scan a few pages.
    const { data } = await admin.get("/admin/orders", { params: { limit: 50 } })
    const hit = (data?.orders || []).find((o) => o?.metadata?.magento_increment_id == incId)
    return hit || null
  }

  function mapAddress(addr) {
    if (!addr) return undefined
    const lines = Array.isArray(addr.street) ? addr.street : [addr.street].filter(Boolean)
    return {
      first_name: addr.firstname || addr.first_name || "",
      last_name: addr.lastname || addr.last_name || "",
      company: addr.company || undefined,
      address_1: lines[0] || "",
      address_2: lines[1] || "",
      city: addr.city || "",
      postal_code: addr.postcode || addr.postal_code || "",
      province: addr.region || addr.region_code || "",
      country_code: (addr.country_id || addr.country_code || "").toLowerCase(),
      phone: addr.telephone || addr.phone || "",
    }
  }

  function extractShippingAddress(order) {
    const ea = order.extension_attributes || {}
    const sa = Array.isArray(ea.shipping_assignments) ? ea.shipping_assignments[0] : null
    return mapAddress(sa?.shipping?.address || order.shipping_address)
  }

  function extractBillingAddress(order) {
    return mapAddress(order.billing_address)
  }

  function mapItems(order) {
    const currency = (order.order_currency_code || order.base_currency_code || DEFAULT_CURRENCY).toLowerCase()
    const rawItems = Array.isArray(order.items) ? order.items : []
    const items = rawItems
      .filter((it) => !it.parent_item_id) // skip parents of configurables/bundles
      .map((it) => ({
        title: it.name || it.sku || "Item",
        quantity: toInt(it.qty_ordered || it.qty || 1),
        unit_price: toMinor(it.price || it.base_price || 0),
      }))
      .filter((it) => it.quantity > 0)

    return { items, currency }
  }

  async function createDraftOrder(payload) {
    const { data } = await admin.post("/admin/draft-orders", payload)
    return data?.draft_order
  }

  async function convertDraftToOrder(draftId) {
    const { data } = await admin.post(`/admin/draft-orders/${draftId}/convert-to-order`)
    return data?.order
  }

  // ---------- FETCH MAGENTO ORDERS ----------
  log.info?.("🧾 Fetching Magento orders…")
  const magentoOrders = await fetchAll("orders")
  log.info?.(`Found ${magentoOrders.length} orders in Magento.`)

  const regionId = await getDefaultRegionId()
  let createdCount = 0

  for (const o of magentoOrders) {
    const inc = o.increment_id || o.entity_id
    const { items, currency } = mapItems(o)

    if (!items.length) {
      log.warn?.(`Skipping ${inc}: no items`)
      continue
    }

    // skip if already imported
    const exists = await findOrderByMagentoIncrementId(inc)
    if (exists) {
      log.info?.(`↻ Skipping already imported ${inc}`)
      continue
    }

    const billing_address = extractBillingAddress(o)
    const shipping_address = extractShippingAddress(o)

    const totals = {
      subtotal: toMinor(o.subtotal || o.base_subtotal),
      discount_total: toMinor(Math.abs(o.discount_amount || 0)),
      tax_total: toMinor(o.tax_amount || 0),
      shipping_total: toMinor(o.shipping_incl_tax ?? o.shipping_amount ?? 0),
      grand_total: toMinor(o.grand_total || o.base_grand_total),
    }

    const metadata = {
      magento_id: o.entity_id,
      magento_increment_id: o.increment_id,
      magento_status: o.status,
      totals,
      created_at_src: o.created_at,
      updated_at_src: o.updated_at,
      payment: {
        method: o.payment?.method || o.payment?.additional_information?.[0] || null,
      },
    }

    if (DRY_RUN) {
      log.info?.(
        `[DRY_RUN] Would create draft for ${inc} with ${items.length} items (currency=${currency})`
      )
      continue
    }

    try {
      // 1) create draft
      const draft = await createDraftOrder({
        email: o.customer_email || undefined,
        region_id: regionId,
        currency_code: currency || DEFAULT_CURRENCY,
        metadata,
        shipping_address,
        billing_address,
        items,
      })

      // 2) convert draft into a final order
      const finalOrder = await convertDraftToOrder(draft.id)

      // 3) sanity metadata on order (optional patch)
      if (finalOrder?.id) {
        await admin.post(`/admin/orders/${finalOrder.id}`, { metadata })
      }

      log.info?.(`✔ Created order ${inc} -> ${finalOrder?.id || "OK"}`)
      createdCount++
    } catch (err) {
      const msg = err?.response?.data || err.message
      log.error?.(`✖ Error creating order ${inc}: ${JSON.stringify(msg)}`)
    }
  }

  log.info?.(`✅ Orders migration complete! Created: ${createdCount}`)
}
