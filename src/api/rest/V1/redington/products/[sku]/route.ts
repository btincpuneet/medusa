import type { ProductTypes } from "@medusajs/framework/types"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { createMagentoB2CClient } from "../../../../../magentoClient"

const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL
const MAGENTO_ADMIN_TOKEN = process.env.MAGENTO_ADMIN_TOKEN

const setCors = (req: MedusaRequest, res: MedusaResponse) => {
  const origin = req.headers.origin
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin)
    res.header("Vary", "Origin")
  } else {
    res.header("Access-Control-Allow-Origin", "*")
  }

  res.header(
    "Access-Control-Allow-Headers",
    req.headers["access-control-request-headers"] ||
      "Content-Type, Authorization"
  )
  res.header("Access-Control-Allow-Methods", "GET,OPTIONS")
  res.header("Access-Control-Allow-Credentials", "true")
}

const toMajorUnits = (amount: any) => {
  const value = Number(amount ?? 0)
  if (!Number.isFinite(value)) {
    return 0
  }
  return Number((value / 100).toFixed(2))
}

const buildMediaEntries = (images: any[] = []) =>
  images.map((image, index) => ({
    id: image.id ?? index + 1,
    media_type: "image",
    label: image.metadata?.label ?? null,
    position: index,
    disabled: false,
    file: image.url ?? "",
  }))

const buildProductResponse = (product: any, variantSku?: string) => {
  const variants = Array.isArray(product.variants) ? product.variants : []
  const variant =
    variants.find((entry) => entry.sku === variantSku) ?? variants[0] ?? null

  if (!variant) {
    throw new Error("Variant not found")
  }

  const prices = variant.prices ?? []
  const price = prices.length ? prices[0].amount : 0

  return {
    id: product.id,
    variant_id: variant.id ?? null,
    sku: variant.sku ?? product.handle ?? product.id,
    name: product.title,
    attribute_set_id: 0,
    price: toMajorUnits(price),
    status: product.status === "published" ? 1 : 0,
    visibility: 4,
    type_id: variants.length > 1 ? "configurable" : "simple",
    created_at: product.created_at,
    updated_at: product.updated_at,
    weight: variant.weight ?? 0,
    custom_attributes: [
      {
        attribute_code: "small_image",
        value: product.thumbnail ?? product.images?.[0]?.url ?? "",
      },
      {
        attribute_code: "image",
        value: product.images?.[0]?.url ?? product.thumbnail ?? "",
      },
    ],
    media_gallery_entries: buildMediaEntries(product.images),
    extension_attributes: {
      stock_item: {
        qty: variant.inventory_quantity ?? 0,
      },
      product_category: product.categories?.[0]?.id ?? null,
      category_links: (product.categories ?? []).map((category: any) => ({
        category_id: category.id,
        position: 0,
      })),
      on_home: product.metadata?.on_home ?? 0,
    },
  }
}

const fetchMagentoProduct = async (sku: string) => {
  if (!MAGENTO_REST_BASE_URL || !MAGENTO_ADMIN_TOKEN) {
    throw new Error("Magento configuration missing.")
  }

  const client = createMagentoB2CClient({
    baseUrl: MAGENTO_REST_BASE_URL,
    axiosConfig: {
      headers: {
        Authorization: `Bearer ${MAGENTO_ADMIN_TOKEN}`,
        "Content-Type": "application/json",
      },
    },
  })

  const response = await client.request({
    url: `products/${encodeURIComponent(sku)}`,
    method: "GET",
  })

  return response.data
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const sku = req.params?.sku || req.params?.id

  if (!sku) {
    return res.status(400).json({ message: "SKU is required." })
  }

  let productModule: ProductTypes.IProductModuleService | null = null
  let legacyProductService: any | null = null
  let legacyVariantService: any | null = null

  try {
    productModule = req.scope.resolve(
      "product"
    ) as ProductTypes.IProductModuleService
  } catch {
    productModule = null
  }

  if (!productModule) {
    try {
      legacyProductService = req.scope.resolve("productService")
    } catch {
      legacyProductService = null
    }
    try {
      legacyVariantService = req.scope.resolve("productVariantService")
    } catch {
      legacyVariantService = null
    }
  }

  const ensureLegacyServices = () => {
    if (!legacyProductService || !legacyVariantService) {
      throw new Error("Product services are not available.")
    }
  }

  try {
    if (productModule) {
      const [variants] = await productModule.listAndCountProductVariants(
        { sku },
        {
          relations: [
            "product",
            "product.variants",
            "product.variants.prices",
            "product.images",
            "product.categories",
          ],
          take: 1,
        }
      )

      const variant = variants[0]
      if (!variant) {
        throw new Error("Variant not found")
      }

      const productId = variant.product_id ?? variant.product?.id
      if (!productId && !variant.product) {
        throw new Error("Variant missing product reference")
      }

      const product =
        variant.product ??
        (await productModule.retrieveProduct(productId!, {
          relations: [
            "variants",
            "variants.prices",
            "images",
            "categories",
          ],
        }))

      if (product.variants?.length > 1) {
        const magentoProduct = await fetchMagentoProduct(sku)
        return res.json(magentoProduct)
      }

      const payload = buildProductResponse(product, sku)
      return res.json(payload)
    }

    ensureLegacyServices()

    const variant = await legacyVariantService.retrieveBySKU(sku, {})

    const product = await legacyProductService.retrieve(variant.product_id, {
      relations: ["variants", "variants.prices", "images", "categories"],
    })

    if (product.variants?.length > 1) {
      const magentoProduct = await fetchMagentoProduct(sku)
      return res.json(magentoProduct)
    }

    const payload = buildProductResponse(product, sku)
    return res.json(payload)
  } catch (error: any) {
    try {
      const magentoProduct = await fetchMagentoProduct(sku)
      return res.json(magentoProduct)
    } catch (magentoError: any) {
      const status = magentoError?.response?.status ?? 502
      const message =
        magentoError?.response?.data?.message ||
        magentoError?.message ||
        "Failed to load product."
      return res.status(status).json({ message })
    }
  }
}
