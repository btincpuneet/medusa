// scripts/product.js
// Magento → Medusa migration with robust v2→v1→REST fallback.
// Fixes:
// - Invalid handle: always slugify (lowercase, a-z0-9-). If empty/unsafe, prefix "p-".
// - REST variant 400s: send prices on variant; omit inventory fields; keep options array.
// - Ensure product create (REST/v1) includes options with values.

const axios = require("axios")
const qs = require("querystring")
const fs = require("fs")
const path = require("path")
const fsp = fs.promises
const { linkProductsToSalesChannelWorkflow } = require("@medusajs/core-flows")

// --------- Utils ---------
function sanitiseBaseUrl(url) {
  if (!url) return ""
  return url
    .replace(/\/rest\/[^/]+\/v?\d+$/i, "")
    .replace(/\/rest\/v?\d+$/i, "")
    .replace(/\/+$/, "")
}

function parseExtraQuery(qsString) {
  if (!qsString) return {}
  return qs.parse(qsString)
}

function slugify(input, fallback = "product") {
  const s = String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  // If empty, or very short, or clearly unsafe, generate a safe fallback
  if (!s) return `${fallback}-${Date.now()}`
  // Some builds enforce starting with a letter. If needed, prefix.
  if (!/^[a-z]/.test(s)) return `p-${s}`
  return s
}

function toBool(value) {
  return value === true || value === 1 || value === "1" || value === "true"
}

async function fileExists(p) {
  try {
    await fsp.access(p)
    return true
  } catch {
    return false
  }
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true })
}

// --------- Main ---------
/**
 * @param {import('@medusajs/framework/types').ExecArgs} param0
 */
async function migrate({ container, logger }) {
  const log = logger || console

  const magentoMediaDir =
    process.env.MAGENTO_MEDIA_DIR ||
    path.resolve(__dirname, "../../../B2C/pub/media/catalog/product")
  const medusaStaticRoot =
    process.env.MEDUSA_STATIC_ROOT || path.resolve(__dirname, "../static")
  const staticCatalogRoot = path.join(medusaStaticRoot, "catalog", "product")
  const staticBaseUrl = (
    process.env.MEDUSA_STATIC_BASE_URL ||
    process.env.MEDUSA_BASE_URL ||
    process.env.MEDUSA_BACKEND_URL ||
    "http://localhost:9000"
  ).replace(/\/+$/, "")

  const hasMagentoMedia = fs.existsSync(magentoMediaDir)
  if (hasMagentoMedia) {
    log.info?.(`🖼️ Using Magento media directory: ${magentoMediaDir}`)
  } else {
    log.warn?.(
      `⚠️ Magento media directory not found at ${magentoMediaDir}. Product images will be skipped.`
    )
  }
  log.info?.(`📁 Medusa static image output: ${staticCatalogRoot}`)

  const copiedImageCache = new Map()
  const ensureMagentoImageUrl = async (rawPath) => {
    if (!hasMagentoMedia || !rawPath) {
      return null
    }
    const normalized = String(rawPath).replace(/^\/+/, "")
    if (!normalized) {
      return null
    }
    if (copiedImageCache.has(normalized)) {
      return copiedImageCache.get(normalized)
    }
    const sourcePath = path.join(magentoMediaDir, normalized)
    if (!(await fileExists(sourcePath))) {
      log.warn?.(
        `⚠️ Missing Magento image ${rawPath} (looked for ${sourcePath}).`
      )
      copiedImageCache.set(normalized, null)
      return null
    }
    const destinationDir = path.join(
      staticCatalogRoot,
      path.dirname(normalized)
    )
    await ensureDir(destinationDir)
    const destinationPath = path.join(
      destinationDir,
      path.basename(normalized)
    )
    try {
      await fsp.copyFile(sourcePath, destinationPath)
    } catch (err) {
      log.error?.(
        `❌ Failed to copy Magento image ${sourcePath} → ${destinationPath}: ${err.message}`
      )
      copiedImageCache.set(normalized, null)
      return null
    }
    const relativePath = path
      .relative(medusaStaticRoot, destinationPath)
      .split(path.sep)
      .join("/")
    const url = `${staticBaseUrl}/static/${relativePath}`
    copiedImageCache.set(normalized, url)
    return url
  }

  // ---------- Resolve Medusa APIs ----------
  let mode = null // "v2" | "v1" | "rest"
  let productModuleService = null
  let pricingModuleService = null
  let salesChannelModuleService = null
  let productService = null
  let productCategoryService = null
  let salesChannelService = null

  const forcedMode = (process.env.MEDUSA_MODE || "").trim().toLowerCase()
  if (["v2", "v1", "rest"].includes(forcedMode)) {
    log.warn?.(`⚠ MEDUSA_MODE is forced to "${forcedMode}".`)
  }

  async function tryResolveV2() {
    try {
      const { MedusaModule, Modules } = require("@medusajs/modules-sdk")
      productModuleService = await MedusaModule.getModuleInstance(Modules.PRODUCT)
      try {
        pricingModuleService = await MedusaModule.getModuleInstance(Modules.PRICING)
      } catch {
        pricingModuleService = null
      }
      try {
        salesChannelModuleService = await MedusaModule.getModuleInstance(Modules.SALES_CHANNEL)
      } catch {
        salesChannelModuleService = null
      }

      const ok =
        productModuleService &&
        typeof productModuleService.createProducts === "function" &&
        typeof productModuleService.listProducts === "function" &&
        typeof productModuleService.createProductVariants === "function" &&
        typeof productModuleService.listProductVariants === "function"

      if (!ok) throw new Error("Medusa v2 Product module missing required methods.")

      mode = "v2"
      log.info?.("Using Medusa v2 modules (Product, optional Pricing).")
      return true
    } catch (e) {
      log.warn?.(`v2 modules unavailable: ${e.message}`)
      productModuleService = null
      pricingModuleService = null
      salesChannelModuleService = null
      return false
    }
  }

  function tryResolveV1() {
    try {
      productService = container.resolve("productService")
    } catch {
      productService = null
    }
    try {
      productCategoryService = container.resolve("productCategoryService")
    } catch {
      productCategoryService = null
    }
    try {
      salesChannelService = container.resolve("salesChannelService")
    } catch {
      salesChannelService = null
    }

    const ok = productService && typeof productService.create === "function"
    if (!ok) {
      log.warn?.("v1 services unavailable or missing productService.create.")
      productService = null
      return false
    }
    mode = "v1"
    log.info?.("Using Medusa v1 services (productService / productCategoryService).")
    return true
  }

  function setREST() {
    mode = "rest"
    ;(log.warn || log.info)("Falling back to Admin REST (requires MEDUSA_SECRET_API_KEY).")
  }

  if (forcedMode === "v2") {
    const ok = await tryResolveV2()
    if (!ok) setREST()
  } else if (forcedMode === "v1") {
    const ok = tryResolveV1()
    if (!ok) setREST()
  } else if (forcedMode === "rest") {
    setREST()
  } else {
    if (!(await tryResolveV2())) {
      if (!tryResolveV1()) setREST()
    }
  }

  // ---------- Magento config ----------
  const magentoRestBase = (process.env.MAGENTO_REST_BASE_URL || "").trim().replace(/\/+$/, "")
  const magentoBaseUrlRaw = (process.env.MAGENTO_BASE_URL || "http://localhost").trim()
  const magentoBaseUrl = sanitiseBaseUrl(magentoBaseUrlRaw)
  const magentoScope = (process.env.MAGENTO_SCOPE || "").trim()
  const magentoApiVersion = (process.env.MAGENTO_API_VERSION || "V1").trim()
  const magentoToken = (process.env.MAGENTO_TOKEN || process.env.MAGENTO_ADMIN_TOKEN || "").trim()
  if (!magentoToken) throw new Error("Missing MAGENTO_TOKEN (or MAGENTO_ADMIN_TOKEN)")

  const restPrefix = magentoRestBase
    ? magentoRestBase
    : `${magentoBaseUrl}/rest/${magentoScope ? `${magentoScope}/` : ""}${magentoApiVersion}`

  const PAGE_SIZE = parseInt(
    process.env.PAGE_SIZE || process.env.MAGENTO_PAGE_SIZE || "100",
    10
  )
  const PRODUCTS_PATH = (process.env.MAGENTO_PRODUCTS_PATH || "products").replace(/^\/+/, "")
  const EXTRA_QUERY_RAW = (process.env.MAGENTO_EXTRA_QUERY || "").trim()
  const EXTRA_QUERY = parseExtraQuery(EXTRA_QUERY_RAW)

  log.info?.(`Using Magento REST prefix: ${restPrefix}`)
  if (EXTRA_QUERY_RAW) log.info?.(`Using MAGENTO_EXTRA_QUERY (products only): ${EXTRA_QUERY_RAW}`)

  // ---------- Admin REST auth (Medusa) ----------
  const resolveAdminSecretKey = () => {
    const candidates = [process.env.MEDUSA_ADMIN_API_KEY, process.env.MEDUSA_SECRET_API_KEY]
    const key = candidates.find(
      (candidate) => typeof candidate === "string" && candidate.trim().startsWith("sk_")
    )
    if (!key) throw new Error("REST: Missing MEDUSA_SECRET_API_KEY (must start with sk_)")
    return key.trim()
  }

  const buildAdminHeaders = (extra = {}) => {
    const key = resolveAdminSecretKey()
    const basic = Buffer.from(`${key}:`).toString("base64")
    return { Authorization: `Basic ${basic}`, ...extra }
  }
  const ADMIN_REST_BASE = (
    process.env.MEDUSA_BASE_URL ||
    process.env.MEDUSA_BACKEND_URL ||
    "http://localhost:9000"
  ).replace(/\/+$/, "")

  // ---------- Sales channel linking ----------
  let cachedSalesChannelId = (process.env.DEFAULT_SALES_CHANNEL_ID || "").trim()
  let attemptedModuleChannelLookup = false
  let attemptedServiceChannelLookup = false
  let attemptedAdminChannelLookup = false
  let warnedMissingSalesChannel = false

  async function resolveDefaultSalesChannelId() {
    if (cachedSalesChannelId) return cachedSalesChannelId

    if (!attemptedModuleChannelLookup && salesChannelModuleService?.listSalesChannels) {
      attemptedModuleChannelLookup = true
      try {
        const channels = await salesChannelModuleService.listSalesChannels({}, { take: 1 })
        const channel = Array.isArray(channels) ? channels[0] : null
        if (channel?.id) {
          cachedSalesChannelId = channel.id
          log.info?.(`Using sales channel ${cachedSalesChannelId} (modules).`)
          return cachedSalesChannelId
        }
      } catch (err) {
        log.warn?.(`⚠ Modules sales channel lookup failed: ${err.message}`)
      }
    }

    if (!cachedSalesChannelId && !attemptedServiceChannelLookup && salesChannelService?.list) {
      attemptedServiceChannelLookup = true
      try {
        const channels = await salesChannelService.list({}, { take: 1 })
        const channel = Array.isArray(channels) ? channels[0] : null
        if (channel?.id) {
          cachedSalesChannelId = channel.id
          log.info?.(`Using sales channel ${cachedSalesChannelId} (services).`)
          return cachedSalesChannelId
        }
      } catch (err) {
        log.warn?.(`⚠ Services sales channel lookup failed: ${err.message}`)
      }
    }

    if (!cachedSalesChannelId && !attemptedAdminChannelLookup) {
      attemptedAdminChannelLookup = true
      try {
        const { data } = await axios.get(`${ADMIN_REST_BASE}/admin/sales-channels`, {
          headers: buildAdminHeaders(),
          params: { limit: 1, fields: "id" },
        })
        const channel = data?.sales_channels?.[0]
        if (channel?.id) {
          cachedSalesChannelId = channel.id
          log.info?.(`Using sales channel ${cachedSalesChannelId} (Admin API).`)
          return cachedSalesChannelId
        }
      } catch (err) {
        log.warn?.(`⚠ Admin API sales channel lookup failed: ${err.message}`)
      }
    }

    return cachedSalesChannelId
  }

  async function linkProductsToDefaultSalesChannel(productIds) {
    const ids = (Array.isArray(productIds) ? productIds : [productIds]).filter(Boolean)
    if (!ids.length) return
    const channelId = await resolveDefaultSalesChannelId()
    if (!channelId) {
      if (!warnedMissingSalesChannel) {
        log.warn?.(
          "⚠ No sales channel resolved. Set DEFAULT_SALES_CHANNEL_ID or create one so products appear in storefronts."
        )
        warnedMissingSalesChannel = true
      }
      return
    }
    try {
      await linkProductsToSalesChannelWorkflow(container).run({
        input: { id: channelId, add: ids, remove: [] },
      })
      log.info?.(`↗ Linked ${ids.length} product(s) to sales channel ${channelId}`)
    } catch (err) {
      log.warn?.(`⚠ Linking failed: ${err.message}`)
    }
  }

  // ---------- Magento fetch ----------
  async function fetchMagento(path, page = 1) {
    const url = `${restPrefix}/${path}`
    const params = {
      "searchCriteria[pageSize]": PAGE_SIZE,
      "searchCriteria[currentPage]": page,
    }
    if (path === PRODUCTS_PATH && EXTRA_QUERY_RAW) Object.assign(params, EXTRA_QUERY)

    try {
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${magentoToken}` },
        params,
        paramsSerializer: (p) => qs.stringify(p),
      })
      if (Array.isArray(data?.items)) return data.items
      if (Array.isArray(data)) return data
      return data
    } catch (err) {
      const status = err?.response?.status
      const body = err?.response?.data
      log.warn?.(
        `⚠ Error fetching Magento path ${path}: ${err.message}${status ? ` (status ${status})` : ""}`
      )
      if (body) log.warn?.(`  ↳ response: ${typeof body === "string" ? body : JSON.stringify(body)}`)
      return []
    }
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

  // ---------- Categories ----------
  async function listCatsByHandle(handle) {
    if (
      mode === "v2" &&
      productModuleService &&
      typeof productModuleService.listProductCategories === "function"
    ) {
      return await productModuleService.listProductCategories({ handle }, { take: 1 })
    }
    if (mode !== "rest" && productCategoryService) {
      return await productCategoryService.list({ handle })
    }
    const { data } = await axios.get(`${ADMIN_REST_BASE}/admin/product-categories`, {
      headers: buildAdminHeaders(),
      params: { handle, limit: 1 },
    })
    return data?.product_categories || []
  }

  async function createCats(payloads) {
    if (
      mode === "v2" &&
      productModuleService &&
      typeof productModuleService.createProductCategories === "function"
    ) {
      return await productModuleService.createProductCategories(payloads)
    }
    if (mode !== "rest" && productCategoryService) {
      const created = []
      for (const p of payloads) {
        const c = await productCategoryService.create({
          name: p.name,
          handle: p.handle,
          parent_category_id: p.parent_category_id ?? null,
          metadata: p.metadata || null,
        })
        created.push(c)
      }
      return created
    }
    const created = []
    for (const p of payloads) {
      const { data } = await axios.post(`${ADMIN_REST_BASE}/admin/product-categories`, p, {
        headers: buildAdminHeaders({ "Content-Type": "application/json" }),
      })
      created.push(data?.product_category || data)
    }
    return created
  }

  // ---------- Products ----------
  async function listProductsByHandle(handle) {
    if (mode === "v2") {
      if (!productModuleService || typeof productModuleService.listProducts !== "function") {
        if (productService?.list) return await productService.list({ handle })
        const { data } = await axios.get(`${ADMIN_REST_BASE}/admin/products`, {
          headers: buildAdminHeaders(),
          params: { handle, limit: 1 },
        })
        return data?.products || []
      }
      return await productModuleService.listProducts({ handle }, { take: 1 })
  } else if (mode === "v1") {
    return await productService.list({ handle })
  } else {
    const { data } = await axios.get(`${ADMIN_REST_BASE}/admin/products`, {
      headers: buildAdminHeaders(),
      params: { handle, limit: 1 },
    })
    return data?.products || []
  }
  }

  const DEFAULT_OPTION_TITLE = process.env.DEFAULT_OPTION_TITLE || "Default"
  const DEFAULT_OPTION_VALUE = process.env.DEFAULT_OPTION_VALUE || "Default"

  const buildModuleImages = (localImages) =>
    localImages.map((img, index) => {
      const item = { url: img.url, rank: index }
      if (img.label) {
        item.metadata = { label: img.label }
      }
      return item
    })

  const buildRestImages = (localImages) => localImages.map((img) => ({ url: img.url }))

  async function updateExistingProduct(existingId, payload) {
    const localImages = Array.isArray(payload.__imageInfos) ? payload.__imageInfos : []
    if (!localImages.length) {
      return
    }

    const thumbnail = localImages[0]?.url

    if (mode === "v2" && productModuleService?.updateProducts) {
      await productModuleService.updateProducts(existingId, {
        thumbnail,
        images: buildModuleImages(localImages),
        metadata: payload.metadata || undefined,
      })
      return
    }

    if (mode === "v1" && productService?.update) {
      await productService.update(existingId, {
        thumbnail,
        images: buildModuleImages(localImages),
        metadata: payload.metadata || undefined,
      })
      return
    }

    const body = {
      thumbnail,
      images: buildRestImages(localImages),
    }

    if (payload.metadata) {
      body.metadata = payload.metadata
    }
    if (payload.description) {
      body.description = payload.description
    }
    if (Array.isArray(payload.categories) && payload.categories.length) {
      body.categories = payload.categories.map((c) =>
        typeof c === "string" ? { id: c } : { id: c.id || c }
      )
    }

    await axios.post(`${ADMIN_REST_BASE}/admin/products/${existingId}`, body, {
      headers: buildAdminHeaders({ "Content-Type": "application/json" }),
    })
  }

  async function fetchProductDetail(productId) {
    try {
      const { data } = await axios.get(`${ADMIN_REST_BASE}/admin/products/${productId}`, {
        headers: buildAdminHeaders(),
      })
      return data?.product || null
    } catch (err) {
      logger?.warn?.(
        `⚠️  Failed to fetch product detail for ${productId}: ${JSON.stringify(
          err.response?.data || err.message
        )}`
      )
      return null
    }
  }

  async function ensureVariantForExistingProduct(productId, variantPayload) {
    const sku = String(variantPayload?.sku || "").trim()
    if (!sku) return

    const detail = await fetchProductDetail(productId)
    if (!detail) return
    const existingVariants = Array.isArray(detail.variants) ? detail.variants : []
    const already = existingVariants.find(
      (v) => String(v?.sku || "").toLowerCase() === sku.toLowerCase()
    )
    if (already) {
      return
    }

    const body = {
      title: variantPayload.title || detail.title || "Default",
      sku,
      prices: Array.isArray(variantPayload.prices) ? variantPayload.prices : [],
    }

    try {
      const { data } = await axios.post(
        `${ADMIN_REST_BASE}/admin/products/${productId}/variants`,
        body,
        { headers: buildAdminHeaders({ "Content-Type": "application/json" }) }
      )
      const createdVariant = data?.variant || data
      logger?.info?.(`➕ Added missing variant ${sku} to product ${productId}`)
      return createdVariant
    } catch (err) {
      logger?.error?.(
        `✖ Failed to create variant ${sku} for product ${productId}: ${JSON.stringify(
          err.response?.data || err.message
        )}`
      )
    }
  }

  async function createProductsV2(payloads) {
    const created = []
    for (const p of payloads) {
      const localImages = Array.isArray(p.__imageInfos) ? p.__imageInfos : []
      const variantsBare = (p.variants || []).map(({ prices, ...rest }) => rest)

      // v2: values are provided on variants, not required at product create
      const [prod] = await productModuleService.createProducts([
        {
          title: p.title,
          handle: p.handle,
          description: p.description,
          status: p.status || "published",
          metadata: p.metadata || null,
          categories: Array.isArray(p.categories) ? p.categories.map((c) => ({ id: c.id || c })) : [],
          options: [{ title: DEFAULT_OPTION_TITLE }],
          thumbnail: localImages[0]?.url,
          images: localImages.map((img, index) => ({
            url: img.url,
            metadata: img.label ? { label: img.label } : null,
            rank: index,
          })),
        },
      ])

      const optionId = prod?.options?.[0]?.id

      if (variantsBare.length) {
        const vWithOption =
          optionId
            ? variantsBare.map((v) => ({
                ...v,
                product_id: prod.id,
                options: [{ option_id: optionId, value: DEFAULT_OPTION_VALUE }],
              }))
            : variantsBare.map((v) => ({ ...v, product_id: prod.id }))
        await productModuleService.createProductVariants(vWithOption)
      }

      // optional pricing (first variant)
      const firstVariant = (
        await productModuleService.listProductVariants({ product_id: prod.id }, { take: 1 })
      )?.[0]
      const priceCurrency = (process.env.DEFAULT_CURRENCY_CODE || "inr").toLowerCase()
      const firstAmount = p.variants?.[0]?.prices?.[0]?.amount ?? 0
      if (pricingModuleService && firstVariant && firstAmount > 0) {
        await pricingModuleService.createPriceLists([
          {
            title: `Base Prices ${new Date().toISOString()}`,
            status: "active",
            type: "sale",
            rules_count: 0,
            prices: [{ currency_code: priceCurrency, amount: firstAmount, variant_id: firstVariant.id }],
          },
        ])
      }

      created.push(prod)
    }
    return created
  }

  async function createProducts(payloads) {
    if (mode === "v2") {
      return await createProductsV2(payloads)
    } else if (mode === "v1") {
      const created = []
      for (const p of payloads) {
        const localImages = Array.isArray(p.__imageInfos) ? p.__imageInfos : []
        const v1Payload = {
          title: p.title,
          handle: p.handle,
          description: p.description,
          status: p.status || "published",
          metadata: p.metadata || null,
          options: [{ title: DEFAULT_OPTION_TITLE, values: [DEFAULT_OPTION_VALUE] }],
          categories: Array.isArray(p.categories) ? p.categories.map((c) => c.id || c) : [],
          variants: (p.variants || []).map((v) => ({
            title: v.title || p.title,
            sku: v.sku,
            prices: v.prices,
            // v1 often supports these, but if your instance rejects them, comment them out:
            inventory_quantity: v.inventory_quantity,
            manage_inventory: v.manage_inventory,
            options: [{ value: DEFAULT_OPTION_VALUE }],
          })),
        }
        if (localImages.length) {
          v1Payload.thumbnail = localImages[0].url
          v1Payload.images = localImages.map((img, index) => ({
            url: img.url,
            metadata: img.label ? { label: img.label } : null,
            rank: index,
          }))
        }
        const prod = await productService.create(v1Payload)
        created.push(prod)
      }
      return created
    } else {
      // REST
      const created = []

      for (const p of payloads) {
        const localImages = Array.isArray(p.__imageInfos) ? p.__imageInfos : []
        // 1) Create product WITH option values (required by many Admin REST builds)
        const { data: pRes } = await axios.post(
          `${ADMIN_REST_BASE}/admin/products`,
          {
            title: p.title,
            handle: p.handle,
            description: p.description,
            status: p.status || "published",
            metadata: p.metadata || null,
            categories: Array.isArray(p.categories) ? p.categories.map((c) => ({ id: c.id || c })) : [],
            sales_channels: process.env.DEFAULT_SALES_CHANNEL_ID
              ? [{ id: process.env.DEFAULT_SALES_CHANNEL_ID }]
              : undefined,
            options: [{ title: DEFAULT_OPTION_TITLE, values: [DEFAULT_OPTION_VALUE] }],
            thumbnail: localImages[0]?.url,
            images: localImages.map((img) => ({ url: img.url })),
          },
          { headers: buildAdminHeaders({ "Content-Type": "application/json" }) }
        )

        const createdProd = pRes?.product || pRes
        const productId = createdProd?.id
        const optionId = createdProd?.options?.[0]?.id

        // 2) Create a variant: include prices; omit inventory fields (these often 400 on Admin REST)
        if (productId && p.variants?.length) {
          const v = p.variants[0]
          const variantBody = {
            title: v.title || "Default",
            sku: v.sku || `SKU-${Date.now()}`,
            prices: Array.isArray(v.prices) ? v.prices : [],
          }

          await axios.post(`${ADMIN_REST_BASE}/admin/products/${productId}/variants`, variantBody, {
            headers: buildAdminHeaders({ "Content-Type": "application/json" }),
          })
        }

        created.push(createdProd)
      }

      return created
    }
  }

  // ---------- STEP 1: CATEGORIES ----------
  log.info?.("🗂️  Fetching Magento categories…")
  const magentoCategories = await fetchAll("categories/list")

  const medusaCatMap = {}
  if (Array.isArray(magentoCategories)) {
    magentoCategories.sort((a, b) => (a.parent_id || 0) - (b.parent_id || 0))
    for (const mc of magentoCategories) {
      if (mc.id === 1) continue
      const handle = slugify(mc.url_key || mc.name || `cat-${mc.id}`, "cat")
      const payload = {
        name: mc.name || `Category ${mc.id}`,
        handle,
        parent_category_id: mc.parent_id > 1 ? medusaCatMap[mc.parent_id] || null : null,
        metadata: { magento_id: mc.id },
      }
      try {
        const created = await createCats([payload])
        const cat = created?.[0]
        if (cat?.id) {
          medusaCatMap[mc.id] = cat.id
          log.info?.(`✔ Created category: ${cat.name}`)
        } else {
          log.warn?.(`⚠ Unable to read created category id for ${mc.name}`)
        }
      } catch (err) {
        const status = err?.response?.status
        const data = err?.response?.data
        log.error?.(
          `✖ Error creating category ${mc.name}: ${err.message}${status ? ` (status ${status})` : ""}`
        )
        if (data) log.error?.(`  ↳ response: ${JSON.stringify(data)}`)
        try {
          const existing = await listCatsByHandle(handle)
          const found = existing?.[0]
          if (found?.id) {
            medusaCatMap[mc.id] = found.id
            log.info?.(`↻ Using existing category for handle "${handle}"`)
          }
        } catch (e2) {
          const status2 = e2?.response?.status
          const data2 = e2?.response?.data
          log.error?.(
            `✖ Lookup failed for category "${handle}": ${e2.message}${
              status2 ? ` (status ${status2})` : ""
            }`
          )
          if (data2) log.error?.(`  ↳ response: ${JSON.stringify(data2)}`)
        }
      }
    }
  }

  // ---------- STEP 2: PRODUCTS ----------
  log.info?.("📦 Fetching Magento products…")
  const magentoProducts = await fetchAll(PRODUCTS_PATH)
  log.info?.(`Found ${Array.isArray(magentoProducts) ? magentoProducts.length : 0} Magento products.`)
  if (!Array.isArray(magentoProducts) || magentoProducts.length === 0) {
    log.warn?.(
      "⚠ Magento returned zero products. Check token/scope or set MAGENTO_EXTRA_QUERY (e.g. company_code, accessId, status)."
    )
  }

  const priceCurrency = (process.env.DEFAULT_CURRENCY_CODE || "inr").toLowerCase()

  for (const p of Array.isArray(magentoProducts) ? magentoProducts : []) {
    const descriptionAttr = (p.custom_attributes || []).find(
      (a) => a.attribute_code === "description"
    )
    const description = descriptionAttr?.value || ""

    const imageInfos = []
    if (Array.isArray(p.media_gallery_entries)) {
      for (const entry of p.media_gallery_entries) {
        if (!entry) continue
        if (entry.media_type && entry.media_type !== "image") continue
        if (toBool(entry.disabled)) continue
        const url = await ensureMagentoImageUrl(entry.file || entry.file_path)
        if (url && !imageInfos.some((img) => img.url === url)) {
          imageInfos.push({ url, label: entry.label })
        }
      }
    }

    const catIds =
      (p.extension_attributes?.category_links || [])
        .map((cl) => {
          const cid = parseInt(cl.category_id, 10)
          return medusaCatMap[cid]
        })
        .filter(Boolean) || []

    // Build a URL-safe handle (critical fix)
    const rawHandleSource = p.url_key || p.sku || p.name || `product-${p.id}`
    const safeHandle = slugify(rawHandleSource, "product")

    const variant = {
      sku: p.sku,
      title: p.name || "Default",
      prices: [
        {
          currency_code: priceCurrency,
          amount: Math.round(Number(p.price || 0) * 100),
        },
      ],
      // Keep inventory data OFF the Admin REST variant create (will 400 on many builds)
      inventory_quantity: 0,
      manage_inventory: true,
    }

    const categoriesForPayload = mode === "v2" ? catIds.map((id) => ({ id })) : catIds

    const prodPayload = {
      title: p.name || rawHandleSource,
      handle: safeHandle,
      description,
      variants: [variant],
      categories: categoriesForPayload,
      metadata: { magento_id: p.id },
      status: "published",
    }
    if (imageInfos.length) {
      prodPayload.thumbnail = imageInfos[0].url
      prodPayload.__imageInfos = imageInfos
    }

    try {
      const exists = await listProductsByHandle(prodPayload.handle)
      if (exists?.length) {
        const first = exists[0]?.product || exists[0]
        const existingId = first?.id || exists[0]?.id || exists[0]?.product?.id
        if (existingId) {
          if (imageInfos.length) {
            try {
              await updateExistingProduct(existingId, prodPayload)
              log.info?.(`↺ Updated product images: ${prodPayload.handle}`)
            } catch (updateErr) {
              log.error?.(
                `✖ Failed updating images for ${prodPayload.handle}: ${updateErr.message}`
              )
            }
          }
          if (Array.isArray(prodPayload.variants) && prodPayload.variants.length) {
            await ensureVariantForExistingProduct(existingId, prodPayload.variants[0])
          }
          await linkProductsToDefaultSalesChannel([existingId])
        }
        log.info?.(`↻ Product already exists, skipping creation: ${prodPayload.handle}`)
        continue
      }

      const created = await createProducts([prodPayload])
      const createdOne = created?.[0]
      const createdProductId = createdOne?.id || createdOne?.product?.id
      if (createdProductId) await linkProductsToDefaultSalesChannel([createdProductId])
      log.info?.(`✔ Created product: ${createdOne?.title || prodPayload.handle}`)
    } catch (err) {
      const status = err?.response?.status
      const data = err?.response?.data
      log.error?.(
        `✖ Error creating product ${p.sku}: ${err.message}${status ? ` (status ${status})` : ""}`
      )
      if (data) log.error?.(`  ↳ response: ${typeof data === "string" ? data : JSON.stringify(data)}`)
    }
  }

  log.info?.("✅ Product migration complete!")
}

if (require.main === module) {
  console.error("❌ Run via `npx medusa exec scripts/product.js` so Medusa services are available.")
  process.exit(1)
}

module.exports = { default: migrate }
