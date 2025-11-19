import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { adminFetch } from "../utils/admin-client"
import { requireCustomerSession } from "../utils/session"
import { sendErrorResponse } from "../utils/respond"

const DEFAULT_LIMIT = Number(process.env.REDINGTON_PRODUCTS_LIMIT || 50)
const MAX_LIMIT = Number(process.env.REDINGTON_PRODUCTS_MAX_LIMIT || 200)

type AdminPrice = {
  amount?: number
  currency_code?: string
}

type AdminVariant = {
  id: string
  title?: string | null
  prices?: AdminPrice[]
  metadata?: Record<string, any>
}

type AdminProduct = {
  id: string
  handle?: string | null
  title?: string | null
  thumbnail?: string | null
  metadata?: Record<string, any>
  variants?: AdminVariant[]
}

const pickQueryValue = (
  query: MedusaRequest["query"],
  keys: string | string[]
): string | undefined => {
  const lookup = Array.isArray(keys) ? keys : [keys]
  for (const key of lookup) {
    const value = (query as Record<string, unknown> | undefined)?.[key]
    if (value === undefined || value === null) {
      continue
    }
    if (Array.isArray(value)) {
      const candidate = value[0]
      if (candidate !== undefined && candidate !== null) {
        return String(candidate)
      }
      continue
    }
    if (typeof value === "string") {
      if (value.trim().length === 0) {
        continue
      }
      return value
    }
    return String(value)
  }
  return undefined
}

const parseNumberParam = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return fallback
  }
  return parsed
}

const collectCategoryValues = (metadata?: Record<string, any>) => {
  if (!metadata) {
    return [] as string[]
  }

  const candidates =
    metadata.magento_category_ids ||
    metadata.category_ids ||
    metadata.category_id ||
    null

  if (!candidates) {
    return [] as string[]
  }

  if (Array.isArray(candidates)) {
    return candidates.map((candidate) => String(candidate).trim()).filter(Boolean)
  }

  if (typeof candidates === "string") {
    return candidates
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  }

  return [] as string[]
}

const simplifyProduct = (product: AdminProduct) => {
  const primaryVariant = product.variants?.[0]
  const primaryPrice = primaryVariant?.prices?.[0]

  return {
    id: product.id,
    sku: product.handle || product.id,
    name: product.title || product.handle || "",
    price:
      typeof primaryPrice?.amount === "number" ? primaryPrice.amount : null,
    currency_code: primaryPrice?.currency_code,
    thumbnail:
      product.thumbnail ||
      primaryVariant?.metadata?.thumbnail ||
      null,
    metadata: product.metadata || {},
  }
}

const filterProducts = (
  products: ReturnType<typeof simplifyProduct>[],
  query: MedusaRequest["query"]
) => {
  const categoryFilter =
    pickQueryValue(query, ["category_id", "categoryId", "category"])?.trim()
  const skuFilter = pickQueryValue(query, "sku")?.trim().toLowerCase()
  const search = pickQueryValue(query, ["q", "search"])?.trim().toLowerCase()

  return products.filter((product) => {
    if (categoryFilter) {
      const categories = collectCategoryValues(product.metadata as Record<string, any>)
      if (!categories.some((category) => category === categoryFilter)) {
        return false
      }
    }

    if (skuFilter && product.sku?.toLowerCase() !== skuFilter) {
      return false
    }

    if (search) {
      const haystacks = [product.name || "", product.sku || ""].map((value) =>
        value.toLowerCase()
      )
      if (!haystacks.some((value) => value.includes(search))) {
        return false
      }
    }

    return true
  })
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    requireCustomerSession(req)

    const limitParam = pickQueryValue(req.query, "limit")
    const offsetParam = pickQueryValue(req.query, "offset")

    const limit = Math.min(
      Math.max(parseNumberParam(limitParam, DEFAULT_LIMIT), 1),
      MAX_LIMIT
    )
    const offset = Math.max(parseNumberParam(offsetParam, 0), 0)

    const forwarded = new URLSearchParams()
    forwarded.set("limit", limit.toString())
    forwarded.set("offset", offset.toString())
    forwarded.set("expand", "variants,variants.prices")

    const search = pickQueryValue(req.query, ["q", "search"])
    if (search) {
      forwarded.set("q", search.trim())
    }

    const handleFilter = pickQueryValue(req.query, "sku")
    if (handleFilter) {
      forwarded.set("handle", handleFilter.trim())
    }

    const adminPath = `/admin/products?${forwarded.toString()}`
    const response = await adminFetch<{
      products?: AdminProduct[]
      count?: number
      offset?: number
      limit?: number
    }>(adminPath)

    const items = Array.isArray(response?.products) ? response.products : []
    const simplified = filterProducts(items.map(simplifyProduct), req.query)

    return res.json({
      items: simplified,
      count: simplified.length,
      limit,
      offset,
    })
  } catch (error) {
    return sendErrorResponse(res, error, "Unable to load products.")
  }
}
