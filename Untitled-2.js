// scripts/product.js
// Magento → Medusa migration (v2 modules → v1 services → Admin REST)
const axios = require("axios")

/**
 * @param {import('@medusajs/framework/types').ExecArgs} param0
 */
async function migrate({ container, logger }) {
  const log = logger || console

  // ---------- Resolve Medusa product APIs (v2 first, then v1; else REST) ----------
  let mode = null // "v2" | "v1" | "rest"
  let productModuleService = null
  let pricingModuleService = null
  let productService = null
  let productCategoryService = null

  async function resolveV2() {
    const { MedusaModule, Modules } = require("@medusajs/modules-sdk")
    productModuleService = await MedusaModule.getModuleInstance(Modules.PRODUCT) // throws if missing
    try {
      pricingModuleService = await MedusaModule.getModuleInstance(Modules.PRICING)
    } catch {
      pricingModuleService = null
    }
    mode = "v2"
    log.info?.("Using Medusa v2 modules (Product, optional Pricing).")
  }

  function resolveV1() {
    productService = container.resolve("productService")
    try {
      productCategoryService = container.resolve("productCategoryService")
    } catch {
      productCategoryService = null
    }
    mode = "v1"
    log.info?.("Using Medusa v1 services (productService / productCategoryService).")
  }

  function resolveREST() {
    mode = "rest"
    ;(log.warn || log.info)("Falling back to Admin REST (x-medusa-api-key).")
  }

  try {
    await resolveV2()
  } catch {
    try {
      resolveV1()
    } catch {
      resolveREST()
    }
  }

  // ---------- Magento config ----------
  const magentoRestBase = (process.env.MAGENTO_REST_BASE_URL || "").trim().replace(/\/+$/, "")
  const magentoBaseUrl = (process.env.MAGENTO_BASE_URL || "http://localhost").trim().replace(/\/+$/, "")
  const magentoScope = (process.env.MAGENTO_SCOPE || "").trim()
  const magentoApiVersion = (process.env.MAGENTO_API_VERSION || "V1").trim()
  const magentoToken = (process.env.MAGENTO_TOKEN || process.env.MAGENTO_ADMIN_TOKEN || "").trim()
  if (!magentoToken) throw new Error("Missing MAGENTO_TOKEN (or MAGENTO_ADMIN_TOKEN) environment variable")

  const restPrefix = magentoRestBase
    ? magentoRestBase
    : `${magentoBaseUrl}/rest/${magentoScope ? `${magentoScope}/` : ""}${magentoApiVersion}`

  const PAGE_SIZE = parseInt(process.env.PAGE_SIZE || "100", 10)

  async function fetchMagento(path, page = 1) {
    const url = `${restPrefix}/${path}`
    const params = {
      "searchCriteria[pageSize]": PAGE_SIZE,
      "searchCriteria[currentPage]": page,
    }
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${magentoToken}` },
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

  const toHandle = (name) =>
    String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

  log.info?.(`Using Magento REST prefix: ${restPrefix}`)

  // ---------- Helpers: v2/v1/REST for Categories (with soft-fallback when v2 methods missing) ----------
  async function listCatsByHandle(handle) {
    // v2 path only if method exists
    if (
      mode === "v2" &&
      productModuleService &&
      typeof productModuleService.listProductCategories === "function"
    ) {
      return await productModuleService.listProductCategories({ handle }, { take: 1 })
    }

    // v1 fallback
    if (mode !== "rest" && productCategoryService) {
      return await productCategoryService.list({ handle })
    }

    // REST fallback
    const base = process.env.MEDUSA_BASE_URL || "http://localhost:9000"
    const key =
      process.env.MEDUSA_ADMIN_API_KEY ||
      process.env.MEDUSA_SECRET_API_KEY ||
      process.env.MEDUSA_ADMIN_TOKEN
    if (!key) throw new Error("REST: Missing MEDUSA_ADMIN_API_KEY (or SECRET/API token).")

    const { data } = await axios.get(`${base}/admin/product-categories`, {
      headers: { "x-medusa-api-key": key },
      params: { handle, limit: 1 },
    })
    return data?.product_categories || []
  }

  async function createCats(payloads) {
    // v2 path only if method exists
    if (
      mode === "v2" &&
      productModuleService &&
      typeof productModuleService.createProductCategories === "function"
    ) {
      return await productModuleService.createProductCategories(payloads)
    }

    // v1 fallback
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

    // REST fallback
    const base = process.env.MEDUSA_BASE_URL || "http://localhost:9000"
    const key =
      process.env.MEDUSA_ADMIN_API_KEY ||
      process.env.MEDUSA_SECRET_API_KEY ||
      process.env.MEDUSA_ADMIN_TOKEN
    if (!key) throw new Error("REST: Missing MEDUSA_ADMIN_API_KEY (or SECRET/API token).")

    const created = []
    for (const p of payloads) {
      const { data } = await axios.post(
        `${base}/admin/product-categories`,
        p,
        { headers: { "x-medusa-api-key": key, "Content-Type": "application/json" } }
      )
      created.push(data?.product_category || data)
    }
    return created
  }

  // ---------- Helpers: v2/v1/REST for Products ----------
  async function listProductsByHandle(handle) {
    if (mode === "v2") {
      return await productModuleService.listProducts({ handle }, { take: 1 })
    } else if (mode === "v1") {
      return await productService.list({ handle })
    } else {
      const base = process.env.MEDUSA_BASE_URL || "http://localhost:9000"
      const key =
        process.env.MEDUSA_ADMIN_API_KEY ||
        process.env.MEDUSA_SECRET_API_KEY ||
        process.env.MEDUSA_ADMIN_TOKEN
      if (!key) throw new Error("REST: Missing MEDUSA_ADMIN_API_KEY (or SECRET/API token).")
      const { data } = await axios.get(`${base}/admin/products`, {
        headers: { "x-medusa-api-key": key },
        params: { handle, limit: 1 },
      })
      return data?.products || []
    }
  }

  async function createProductsV2(payloads) {
    const created = []
    for (const p of payloads) {
      // strip prices for v2 create (pricing handled separately)
      const variants = (p.variants || []).map(({ prices, ...rest }) => rest)

      const [prod] = await productModuleService.createProducts([
        {
          title: p.title,
          handle: p.handle,
          description: p.description,
          status: p.status || "published",
          metadata: p.metadata || null,
          categories: Array.isArray(p.categories) ? p.categories.map((c) => ({ id: c.id || c })) : [],
        },
      ])

      if (variants.length) {
        await productModuleService.createProductVariants(
          variants.map((v) => ({ ...v, product_id: prod.id }))
        )
      }

      // pricing (optional)
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
            prices: [
              {
                currency_code: priceCurrency,
                amount: firstAmount,
                variant_id: firstVariant.id,
              },
            ],
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
        const v1Payload = {
          title: p.title,
          handle: p.handle,
          description: p.description,
          variants: p.variants,
          categories: Array.isArray(p.categories) ? p.categories.map((c) => c.id || c) : [],
          metadata: p.metadata || null,
          status: p.status || "published",
        }
        const prod = await productService.create(v1Payload)
        created.push(prod)
      }
      return created
    } else {
      const base = process.env.MEDUSA_BASE_URL || "http://localhost:9000"
      const key =
        process.env.MEDUSA_ADMIN_API_KEY ||
        process.env.MEDUSA_SECRET_API_KEY ||
        process.env.MEDUSA_ADMIN_TOKEN
      if (!key) throw new Error("REST: Missing MEDUSA_ADMIN_API_KEY (or SECRET/API token).")

      const created = []
      for (const p of payloads) {
        const { data: pRes } = await axios.post(
          `${base}/admin/products`,
          {
            title: p.title,
            handle: p.handle,
            description: p.description,
            status: p.status || "published",
            metadata: p.metadata || null,
            sales_channels: process.env.DEFAULT_SALES_CHANNEL_ID
              ? [{ id: process.env.DEFAULT_SALES_CHANNEL_ID }]
              : undefined,
            categories: Array.isArray(p.categories) ? p.categories.map((c) => ({ id: c.id || c })) : [],
          },
          { headers: { "x-medusa-api-key": key, "Content-Type": "application/json" } }
        )
        const createdProd = pRes?.product

        if (createdProd && p.variants?.length) {
          const v = p.variants[0]
          await axios.post(
            `${base}/admin/products/${createdProd.id}/variants`,
            { title: v.title || "Default", sku: v.sku || `SKU-${Date.now()}` },
            { headers: { "x-medusa-api-key": key, "Content-Type": "application/json" } }
          )
        }
        created.push(createdProd || pRes)
      }
      return created
    }
  }

  // ---------- STEP 1: CATEGORIES ----------
  log.info?.("🗂️  Fetching Magento categories…")
  const magentoCategories = await fetchAll("categories/list")

  const medusaCatMap = {}
  magentoCategories.sort((a, b) => a.parent_id - b.parent_id) // parents first
  for (const mc of magentoCategories) {
    if (mc.id === 1) continue
    const handle = mc.url_key || toHandle(mc.name)
    const payload = {
      name: mc.name,
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
      log.error?.(`✖ Error creating category ${mc.name}: ${err.message}`)
      try {
        const existing = await listCatsByHandle(handle)
        const found = existing?.[0]
        if (found?.id) {
          medusaCatMap[mc.id] = found.id
          log.info?.(`↻ Using existing category for handle "${handle}"`)
        }
      } catch (e2) {
        log.error?.(`✖ Lookup failed for category "${handle}": ${e2.message}`)
      }
    }
  }

  // ---------- STEP 2: PRODUCTS ----------
  log.info?.("📦 Fetching Magento products…")
  const magentoProducts = await fetchAll("products")

  for (const p of magentoProducts) {
    const rawQty = p.extension_attributes?.stock_item?.qty ?? 0
    const qty = typeof rawQty === "number" ? rawQty : Number(rawQty) || 0

    const descriptionAttr = p.custom_attributes?.find((a) => a.attribute_code === "description")
    const description = descriptionAttr?.value || ""

    const catIds =
      (p.extension_attributes?.category_links || [])
        .map((cl) => medusaCatMap[parseInt(cl.category_id, 10)])
        .filter(Boolean) || []

    const priceCurrency = (process.env.DEFAULT_CURRENCY_CODE || "inr").toLowerCase()
    const variant = {
      sku: p.sku,
      title: p.name,
      prices: [
        {
          currency_code: priceCurrency,
          amount: Math.round(Number(p.price || 0) * 100),
        },
      ],
      inventory_quantity: qty,
      manage_inventory: true,
    }

    const categoriesForPayload =
      mode === "v2" ? catIds.map((id) => ({ id })) : catIds

    const prodPayload = {
      title: p.name,
      handle: p.url_key || p.sku || toHandle(p.name),
      description,
      variants: [variant],
      categories: categoriesForPayload,
      metadata: { magento_id: p.id },
      status: "published",
    }

    try {
      const exists = await listProductsByHandle(prodPayload.handle)
      if (exists?.length) {
        log.info?.(`↻ Skipping existing product: ${prodPayload.handle}`)
        continue
      }
      const created = await createProducts([prodPayload])
      const createdOne = created?.[0]
      log.info?.(`✔ Created product: ${createdOne?.title || prodPayload.handle}`)
    } catch (err) {
      log.error?.(`✖ Error creating product ${p.sku}: ${err.message}`)
    }
  }

  log.info?.("✅ Product migration complete!")
}

if (require.main === module) {
  console.error("❌ Run via `npx medusa exec scripts/product.js` so Medusa services are available.")
  process.exit(1)
}

module.exports = { default: migrate }
