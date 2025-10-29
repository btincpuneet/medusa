import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import {
  listOrderQuantityTracker,
  type OrderTrackerFilters,
} from "../../../../../modules/redington-max-qty"

const parseFilters = (query: Record<string, unknown>) => {
  const filters: Partial<OrderTrackerFilters> = {}

  if (query.customer_id !== undefined) {
    const parsed = Number(query.customer_id)
    if (Number.isFinite(parsed)) {
      filters.customer_id = Math.trunc(parsed)
    }
  }

  if (typeof query.order_increment_id === "string" && query.order_increment_id.trim()) {
    filters.order_increment_id = query.order_increment_id.trim()
  }

  if (typeof query.sku === "string" && query.sku.trim()) {
    filters.sku = query.sku.trim()
  }

  if (typeof query.brand_id === "string" && query.brand_id.trim()) {
    filters.brand_id = query.brand_id.trim()
  }

  return filters
}

const parsePagination = (query: Record<string, unknown>) => {
  const result: { limit?: number; offset?: number } = {}

  if (query.limit !== undefined) {
    const parsed = Number(query.limit)
    if (Number.isFinite(parsed) && parsed > 0) {
      result.limit = Math.trunc(parsed)
    }
  }

  if (query.offset !== undefined) {
    const parsed = Number(query.offset)
    if (Number.isFinite(parsed) && parsed >= 0) {
      result.offset = Math.trunc(parsed)
    }
  }

  return result
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = (req.query || {}) as Record<string, unknown>
  const filters = parseFilters(query)
  const pagination = parsePagination(query)

  const [records, count] = await listOrderQuantityTracker(filters, pagination)

  res.json({
    records,
    count,
    limit: pagination.limit ?? 25,
    offset: pagination.offset ?? 0,
  })
}

