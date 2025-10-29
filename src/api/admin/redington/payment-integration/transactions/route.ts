import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import {
  listMpgsTransactions,
  type MpgsTransactionFilters,
} from "~modules/redington-mpgs"

const parseFilters = (query: Record<string, unknown>) => {
  const filters: Partial<MpgsTransactionFilters> = {}

  const assign = (key: keyof MpgsTransactionFilters) => {
    const value = query[key]
    if (typeof value === "string" && value.trim()) {
      filters[key] = value.trim()
    }
  }

  assign("order_ref_id")
  assign("order_increment_id")
  assign("session_id")
  assign("transaction_reference")
  assign("result_indicator")
  assign("payment_status")

  return filters
}

const parsePagination = (query: Record<string, unknown>) => {
  const pagination: { limit?: number; offset?: number } = {}

  if (query.limit !== undefined) {
    const parsed = Number(query.limit)
    if (Number.isFinite(parsed) && parsed > 0) {
      pagination.limit = Math.trunc(parsed)
    }
  }

  if (query.offset !== undefined) {
    const parsed = Number(query.offset)
    if (Number.isFinite(parsed) && parsed >= 0) {
      pagination.offset = Math.trunc(parsed)
    }
  }

  return pagination
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = (req.query || {}) as Record<string, unknown>
  const filters = parseFilters(query)
  const pagination = parsePagination(query)

  const [transactions, count] = await listMpgsTransactions(
    filters,
    pagination
  )

  res.json({
    transactions,
    count,
    limit: pagination.limit ?? 25,
    offset: pagination.offset ?? 0,
  })
}
