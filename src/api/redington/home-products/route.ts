import type { ProductTypes } from "@medusajs/framework/types"
import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { sendErrorResponse } from "../utils/respond"

const DEFAULT_LIMIT = Number(process.env.REDINGTON_HOME_PRODUCTS_LIMIT || 20)
const MAX_LIMIT = Number(process.env.REDINGTON_HOME_PRODUCTS_MAX_LIMIT || 200)
const MAX_FETCH = Math.max(
  Number(process.env.REDINGTON_HOME_PRODUCTS_FETCH_LIMIT || 500),
  MAX_LIMIT
)

type ProductServices = {
  productModule?: ProductTypes.IProductModuleService | null
  legacyProductService?: any | null
}

const PRODUCT_RELATIONS = [
  "variants",
  "variants.prices",
  "variants.options",
  "images",
  "categories",
  "options",
]

const toMajorUnits = (value: unknown) => {
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount)) {
    return 0
  }
  return Number((amount / 100).toFixed(2))
}

const toBooleanFlag = (value: unknown) => {
  if (typeof value === "boolean") {
    return value
  }
  if (typeof value === "number") {
    return value !== 0
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (!normalized.length) {
      return false
    }
    return ["1", "true", "yes", "on", "enabled"].includes(normalized)
  }
  return false
}

const toFlagString = (value: unknown) => (toBooleanFlag(value) ? "1" : "0")

const toOptionalNumber = (value: unknown) => {
  if (value === null || value === undefined) {
    return null
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return null
  }
  return parsed
}

const ensureArray = <T>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : []

const normalizeMediaPath = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) {
    return ""
  }
  const raw = value.trim()
  try {
    const parsed = new URL(raw)
    return parsed.pathname || raw
  } catch (_) {
    return raw.startsWith("/") ? raw : `/${raw}`
  }
}

const buildMediaEntries = (images: any[]) =>
  images.map((image, index) => ({
    id: image.id ?? index + 1,
    media_type: "image",
    label: image.metadata?.label ?? null,
    position: index,
    disabled: false,
    file: normalizeMediaPath(image.url ?? image.metadata?.url ?? ""),
  }))

const pushAttribute = (
  attributes: { attribute_code: string; value: string }[],
  code: string,
  value: unknown,
  options: { allowEmpty?: boolean } = {}
) => {
  if (value === null || value === undefined) {
    return
  }
  const normalized =
    typeof value === "string"
      ? value
      : typeof value === "number"
        ? value.toString()
        : typeof value === "boolean"
          ? value ? "1" : "0"
          : ""

  if (!normalized && !options.allowEmpty) {
    return
  }

  attributes.push({ attribute_code: code, value: normalized })
}

const resolveCategoryIdentifier = (candidate: unknown): string | null => {
  if (candidate === null || candidate === undefined) {
    return null
  }
  if (typeof candidate === "number") {
    return String(candidate)
  }
  if (typeof candidate === "string") {
    const trimmed = candidate.trim()
    return trimmed.length ? trimmed : null
  }
  return null
}

const extractCategoryId = (category: any) => {
  const metadata = category?.metadata || {}
  const candidates = [
    metadata.magento_entity_id,
    metadata.magento_id,
    metadata.legacy_id,
    metadata.entity_id,
    metadata.external_id,
    category?.handle,
    category?.id,
  ]

  for (const candidate of candidates) {
    const resolved = resolveCategoryIdentifier(candidate)
    if (resolved) {
      return resolved
    }
  }

  return null
}

const buildCategoryLinks = (categories: any[] = []) => {
  return categories
    .map((category, index) => ({
      category_id: extractCategoryId(category),
      position: index,
    }))
    .filter((link) => !!link.category_id)
}

const resolveInventoryQuantity = (variant: any) => {
  if (typeof variant?.inventory_quantity === "number") {
    return variant.inventory_quantity
  }
  if (typeof variant?.metadata?.inventory_quantity === "number") {
    return variant.metadata.inventory_quantity
  }
  if (typeof variant?.metadata?.stock_qty === "number") {
    return variant.metadata.stock_qty
  }
  return 0
}

const buildConfigurableLinks = (variants: any[]) =>
  variants.length > 1
    ? variants
        .map((variant) =>
          resolveCategoryIdentifier(
            variant.metadata?.magento_id ?? variant.id
          )
        )
        .filter((id): id is string => Boolean(id))
    : []

const buildConfigurableOptions = (product: any) => {
  const options = ensureArray<any>(product.options).map((option: any) => ({
    attribute_id: option.id ?? option.option_id ?? option.title ?? "option",
    attribute_code:
      (option.handle || option.title || `option_${option.id || ""}`)
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "_") || "option",
    label: option.title || option.name || option.id || "",
    values: [] as { value_index: string | number; label: string }[],
  }))

  if (!options.length) {
    return []
  }

  const lookup = new Map(options.map((entry) => [entry.attribute_id, entry]))

  ensureArray<any>(product.variants).forEach((variant: any) => {
    ensureArray<any>(variant.options).forEach((variantOption: any) => {
      const optionId =
        variantOption.option_id ??
        variantOption.id ??
        variantOption.optionId ??
        variantOption.option?.id
      if (!lookup.has(optionId)) {
        return
      }

      const valueIndex =
        variantOption.value ??
        variantOption.option_value ??
        variantOption.id ??
        variant.sku ??
        variant.id

      if (!valueIndex && valueIndex !== 0) {
        return
      }

      const label =
        variantOption.label ??
        variantOption.value ??
        variantOption.option_value ??
        valueIndex

      const target = lookup.get(optionId)!
      if (
        !target.values.some(
          (entry) => String(entry.value_index) === String(valueIndex)
        )
      ) {
        target.values.push({ value_index: valueIndex, label: String(label) })
      }
    })
  })

  return options.filter((option) => option.values.length)
}

const buildCustomAttributes = (product: any, variant: any) => {
  const metadata = product.metadata || {}
  const variantMetadata = variant?.metadata || {}
  const attributes: { attribute_code: string; value: string }[] = []

  const mainImage = normalizeMediaPath(
    product.images?.[0]?.url || product.thumbnail || variantMetadata.image
  )
  const smallImage = normalizeMediaPath(
    variantMetadata.small_image || product.thumbnail || mainImage
  )

  pushAttribute(attributes, "small_image", smallImage, { allowEmpty: true })
  pushAttribute(attributes, "image", mainImage, { allowEmpty: true })
  pushAttribute(
    attributes,
    "on_home",
    toFlagString(variantMetadata.on_home ?? metadata.on_home)
  )
  pushAttribute(
    attributes,
    "product_delivery_tag",
    variantMetadata.product_delivery_tag ?? metadata.product_delivery_tag
  )
  pushAttribute(
    attributes,
    "product_delivery_tag_label",
    variantMetadata.product_delivery_tag_label ??
      metadata.product_delivery_tag_label
  )
  pushAttribute(
    attributes,
    "short_description",
    metadata.short_description ?? product.subtitle,
    { allowEmpty: true }
  )
  pushAttribute(
    attributes,
    "description",
    metadata.description_html ?? metadata.description ?? product.description,
    { allowEmpty: true }
  )

  return attributes
}

const buildExtensionAttributes = (product: any, variants: any[]) => {
  const metadata = product.metadata || {}
  const primaryVariant = variants[0] || {}
  const variantMetadata = primaryVariant.metadata || {}
  const categoryLinks = buildCategoryLinks(product.categories)

  return {
    stock_item: {
      qty: resolveInventoryQuantity(primaryVariant),
    },
    product_category: categoryLinks[0]?.category_id ?? null,
    category_links: categoryLinks,
    configurable_product_links: buildConfigurableLinks(variants),
    configurable_product_options: buildConfigurableOptions(product),
    floor_special_price:
      toOptionalNumber(
        variantMetadata.floor_special_price ?? metadata.floor_special_price
      ) ?? undefined,
    on_sale_product: toFlagString(
      variantMetadata.on_sale_product ?? metadata.on_sale_product
    ),
    on_home: toBooleanFlag(variantMetadata.on_home ?? metadata.on_home) ? 1 : 0,
  }
}

const mapProductToMagento = (product: any) => {
  const variants = ensureArray<any>(product.variants)
  const primaryVariant = variants[0] || {}
  const mediaEntries = buildMediaEntries(ensureArray(product.images))

  return {
    id: product.id,
    sku: primaryVariant.sku || product.handle || product.id,
    name: product.title || product.handle || "",
    attribute_set_id: 0,
    price: toMajorUnits(primaryVariant.prices?.[0]?.amount),
    status: product.status === "published" ? 1 : 0,
    visibility: 4,
    type_id: variants.length > 1 ? "configurable" : "simple",
    created_at: product.created_at,
    updated_at: product.updated_at,
    weight: primaryVariant.weight ?? 0,
    media_gallery_entries: mediaEntries,
    custom_attributes: buildCustomAttributes(product, primaryVariant),
    extension_attributes: buildExtensionAttributes(product, variants),
  }
}

const parsePagination = (query: Record<string, any>) => {
  const pageSizeKey = Object.keys(query).find((key) =>
    key.toLowerCase().endsWith("[pagesize]")
  )
  const currentPageKey = Object.keys(query).find((key) =>
    key.toLowerCase().endsWith("[currentpage]")
  )

  const requestedLimit = Number(
    (pageSizeKey ? query[pageSizeKey] : query.pageSize ?? query.page_size) ??
      DEFAULT_LIMIT
  )
  const limit = Math.min(
    Math.max(Number.isFinite(requestedLimit) ? requestedLimit : DEFAULT_LIMIT, 1),
    MAX_LIMIT
  )

  const requestedPage = Number(
    (currentPageKey
      ? query[currentPageKey]
      : query.currentPage ?? query.current_page) ?? 1
  )

  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0
    ? Math.floor(requestedPage)
    : 1

  const offset = (currentPage - 1) * limit

  return { limit, offset }
}

const parseFilters = (query: Record<string, any>) => {
  const filters: Record<string, string> = {}

  for (const [key, value] of Object.entries(query)) {
    const match = key.match(
      /searchCriteria\[filter_groups\]\[(\d+)\]\[filters\]\[(\d+)\]\[field\]/i
    )
    if (!match) {
      continue
    }
    const prefix = `searchCriteria[filter_groups][${match[1]}][filters][${match[2]}]`
    const filterValue = query[`${prefix}[value]`]
    if (filterValue === undefined || filterValue === null) {
      continue
    }
    const fieldName = String(value || "").trim()
    if (!fieldName) {
      continue
    }
    filters[fieldName] = Array.isArray(filterValue)
      ? String(filterValue[0])
      : String(filterValue)
  }

  if (query.on_home !== undefined) {
    filters.on_home = String(query.on_home)
  }

  if (query.category_id !== undefined) {
    filters.category_id = String(query.category_id)
  }

  if (query.sku !== undefined) {
    filters.sku = String(query.sku)
  }

  return filters
}

const resolveProductServices = (
  req: MedusaRequest
): ProductServices => {
  let productModule: ProductTypes.IProductModuleService | null = null
  let legacyProductService: any | null = null

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
  }

  return { productModule, legacyProductService }
}

const listProducts = async (
  services: ProductServices
): Promise<[any[], number]> => {
  const { productModule, legacyProductService } = services
  const selector: ProductTypes.FilterableProductProps = {}
  const take = Math.min(Math.max(DEFAULT_LIMIT, MAX_FETCH), MAX_FETCH)

  if (productModule) {
    return productModule.listAndCountProducts(selector, {
      relations: PRODUCT_RELATIONS,
      skip: 0,
      take,
    })
  }

  if (legacyProductService) {
    return legacyProductService.listAndCount(selector, {
      relations: PRODUCT_RELATIONS,
      skip: 0,
      take,
    })
  }

  return [[], 0]
}

const applyFilters = (products: any[], filters: Record<string, string>) => {
  if (!Object.keys(filters).length) {
    return products
  }

  return products.filter((product) => {
    if (filters.on_home !== undefined) {
      const flag = toFlagString(
        product.metadata?.on_home ?? product.variants?.[0]?.metadata?.on_home
      )
      if (flag !== filters.on_home) {
        return false
      }
    }

    if (filters.category_id !== undefined) {
      const categoryIds = buildCategoryLinks(product.categories).map(
        (link) => link.category_id
      )
      if (!categoryIds.includes(filters.category_id)) {
        return false
      }
    }

    if (filters.sku !== undefined) {
      const skuMatch = ensureArray<any>(product.variants)
        .map((variant) => String(variant.sku || variant.id || ""))
        .some((sku) => sku.toLowerCase() === filters.sku.toLowerCase())
      if (!skuMatch) {
        return false
      }
    }

    return true
  })
}

const buildSearchCriteria = (
  filters: Record<string, string>,
  limit: number,
  offset: number
) => {
  const filterGroups = Object.entries(filters).map(([field, value], index) => ({
    filters: [
      {
        field,
        value,
        condition_type: "eq",
      },
    ],
    group_index: index,
  }))

  const currentPage = limit ? Math.floor(offset / limit) + 1 : 1

  return {
    filter_groups: filterGroups,
    page_size: limit,
    current_page: currentPage,
  }
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { limit, offset } = parsePagination(req.query || {})
    const filters = parseFilters(req.query || {})

    const services = resolveProductServices(req)
    if (!services.productModule && !services.legacyProductService) {
      throw new Error("Product module/service is not available.")
    }

    const [products] = await listProducts(services)
    const filtered = applyFilters(products, filters)
    const items = filtered.slice(offset, offset + limit).map(mapProductToMagento)

    return res.json({
      items,
      total_count: filtered.length,
      search_criteria: buildSearchCriteria(filters, limit, offset),
    })
  } catch (error) {
    return sendErrorResponse(res, error, "Unable to load home products.")
  }
}

