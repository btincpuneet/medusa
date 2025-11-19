// scripts/orders-rest.js
// Magento → Medusa orders via Admin REST (Draft Order -> Mark Paid)
// Usage:
//   # Dry run
//   DRY_RUN=true npx medusa exec scripts/orders-rest.js
//   # Real import (needs admin key)
//   MEDUSA_ADMIN_API_KEY=sk_xxx npx medusa exec scripts/orders-rest.js

const axios = require("axios")
const { md } = require("./clients")

/** @param {import('@medusajs/framework/types').ExecArgs} param0 */
module.exports.default = async function migrate({ logger }) {
  const log = logger || console
  const variantCache = new Map()
  const missingVariantLog = new Set()
  const thumbnailCache = new Map()

  const normalizeSku = (sku) => String(sku || "").trim()

  const fetchVariantForSku = async (sku) => {
    const normalized = normalizeSku(sku)
    if (!normalized) return null
    const cacheKey = normalized.toLowerCase()
    if (variantCache.has(cacheKey)) return variantCache.get(cacheKey)

    try {
      const { data } = await md.get("/product-variants", {
        params: {
          q: normalized,
          limit: 1,
        },
      })
      const variant = data?.variants?.[0] || null
      variantCache.set(cacheKey, variant)
      return variant
    } catch (err) {
      if (!missingVariantLog.has(normalized)) {
        missingVariantLog.add(normalized)
        log.warn?.(
          `⚠️  Failed to resolve variant for SKU ${normalized}: ${JSON.stringify(
            err.response?.data || err.message
          )}`
        )
      }
      variantCache.set(cacheKey, null)
      return null
    }
  }

  const fetchThumbnailForSku = async (sku) => {
    const normalized = normalizeSku(sku)
    if (!normalized) return null
    if (thumbnailCache.has(normalized)) return thumbnailCache.get(normalized)

    let thumbnail = null
    const variant = await fetchVariantForSku(normalized)
    if (variant?.product?.thumbnail) {
      thumbnail = variant.product.thumbnail
    } else if (variant?.thumbnail) {
      thumbnail = variant.thumbnail
    } else if (variant?.product_id) {
      try {
        const { data } = await md.get(`/products/${variant.product_id}`)
        thumbnail = data?.product?.thumbnail || null
      } catch (err) {
        log.warn?.(
          `⚠️  Failed to resolve product thumbnail for SKU ${normalized}: ${
            err.response?.data || err.message
          }`
        )
      }
    }

    thumbnailCache.set(normalized, thumbnail || null)
    return thumbnail || null
  }

  // ---------- REQUIRED ENV ----------
  const MAGENTO_TOKEN =
    (process.env.MAGENTO_TOKEN || process.env.MAGENTO_ADMIN_TOKEN || "").trim()
  if (!MAGENTO_TOKEN) throw new Error("Missing MAGENTO_TOKEN / MAGENTO_ADMIN_TOKEN")

  // Admin key: secret key created in Admin → Settings → Developer → Secret API Keys
  const ADMIN_KEY = (
    process.env.MEDUSA_ADMIN_API_KEY ||
    process.env.MEDUSA_SECRET_API_KEY ||
    process.env.MEDUSA_ADMIN_TOKEN ||
    process.env.MEDUSA_TOKEN ||
    process.env.MEDUSA_API_KEY ||
    ""
  ).trim()

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
  // Use Basic auth like your successful curl: Authorization: Basic base64("sk_...:")
  const basicAuth = Buffer.from(`${ADMIN_KEY}:`).toString("base64")

  const admin = axios.create({
    baseURL: medusaBase,
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "x-medusa-api-key": ADMIN_KEY, // keep for compatibility
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    timeout: 15000,
  })

  // Clearer message when a 401 appears
  admin.interceptors.response.use(
    (r) => r,
    (err) => {
      if (err?.response?.status === 401) {
        log.error?.(
          "401 from /admin/* – check that your key is an **Admin** secret key and Basic auth is applied."
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

  const ORDER_SCAN_LIMIT = parseInt(process.env.MEDUSA_ORDER_SCAN_LIMIT || "100", 10)

  async function loadImportedIncrementIds() {
    const ids = new Set()
    let offset = 0

    for (;;) {
      const { data } = await admin.get("/admin/orders", {
        params: {
          limit: ORDER_SCAN_LIMIT,
          offset,
          fields: "id,metadata,magento_order_id",
        },
      })

      const batch = data?.orders || []
      for (const order of batch) {
        const inc = order?.magento_order_id || order?.metadata?.magento_increment_id
        if (inc) {
          ids.add(String(inc))
        }
      }

      if (batch.length < ORDER_SCAN_LIMIT) {
        break
      }
      offset += batch.length
    }

    return ids
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

  async function mapItems(order) {
    const currency = (order.order_currency_code || order.base_currency_code || DEFAULT_CURRENCY).toLowerCase()
    const rawItems = Array.isArray(order.items) ? order.items : []

    const itemPromises = rawItems
      .filter((it) => !it.parent_item_id)
      .map(async (it) => {
        const quantity = toInt(it.qty_ordered || it.qty || 1)
        if (quantity <= 0) return null

        const sku = normalizeSku(it.sku)
        const base = {
          title: it.name || sku || "Item",
          quantity,
          unit_price: toMinor(it.price || it.base_price || 0),
          metadata: {
            magento_item_id: it.item_id || null,
            sku: sku || null,
          },
        }

        const thumbnail = sku ? await fetchThumbnailForSku(sku) : null
        if (thumbnail) {
          base.thumbnail = thumbnail
        }

        return base
      })

    const items = (await Promise.all(itemPromises)).filter(Boolean)
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

  const importedIncrements = await loadImportedIncrementIds()
  let skippedExisting = 0

  for (const o of magentoOrders) {
    const inc = o.increment_id || o.entity_id
    if (importedIncrements.has(String(inc))) {
      log.info?.(`↻ Skipping already imported ${inc}`)
      skippedExisting++
      continue
    }

    const { items, currency } = await mapItems(o)

    if (!items.length) {
      log.warn?.(`Skipping ${inc}: no items`)
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
        await admin.post(`/admin/orders/${finalOrder.id}`, {
          metadata,
          magento_order_id: String(inc),
        })
        importedIncrements.add(String(inc))
      }

      log.info?.(`✔ Created order ${inc} -> ${finalOrder?.id || "OK"}`)
      createdCount++
    } catch (err) {
      const msg = err?.response?.data || err.message
      log.error?.(`✖ Error creating order ${inc}: ${JSON.stringify(msg)}`)
    }
  }

  log.info?.(
    `✅ Orders migration complete! Created: ${createdCount}, Skipped existing: ${skippedExisting}`
  )
}
