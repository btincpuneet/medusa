import type { ProductTypes } from "@medusajs/framework/types"
import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import {
  buildRedingtonProductSummary,
  type RedingtonProductSummary,
} from "../../../../modules/redington-product"

const clampLimit = (value: unknown, fallback = 20, max = 50) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return Math.min(Math.trunc(parsed), max)
}

const clampOffset = (value: unknown) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }
  return Math.trunc(parsed)
}

type ProductListQuery = {
  q?: string
  sku?: string
  handle?: string
  id?: string
  limit?: string
  offset?: string
}

type ProductListResponse = {
  products: RedingtonProductSummary[]
  count: number
  limit: number
  offset: number
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse<ProductListResponse>
) => {
  const productService = req.scope.resolve(
    "product"
  ) as ProductTypes.IProductModuleService

  const query = (req.query || {}) as ProductListQuery

  const filters: ProductTypes.FilterableProductProps = {}

  const search = (query.q ?? "").trim()
  if (search) {
    filters.q = search
  }

  const sku = (query.sku ?? "").trim()
  if (sku) {
    filters.sku = sku
  }

  const handle = (query.handle ?? "").trim()
  if (handle) {
    filters.handle = handle
  }

  const id = (query.id ?? "").trim()
  if (id) {
    filters.id = id
  }

  const limit = clampLimit(query.limit)
  const offset = clampOffset(query.offset)

  const [products, count] =
    await productService.listAndCountProducts(filters, {
      relations: ["variants", "options"],
      skip: offset,
      take: limit,
      order: {
        updated_at: "DESC",
      },
    })

  res.json({
    products: products.map(buildRedingtonProductSummary),
    count,
    limit,
    offset,
  })
}
