import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import {
  createMaxQtyRule,
  listMaxQtyRules,
  type RuleInput,
} from "../../../../../modules/redington-max-qty"

const parseRuleFilters = (query: Record<string, unknown>) => {
  const filters: Record<string, any> = {}

  if (typeof query.category_id === "string" && query.category_id.trim()) {
    filters.category_id = query.category_id.trim()
  }

  if (typeof query.brand_id === "string" && query.brand_id.trim()) {
    filters.brand_id = query.brand_id.trim()
  }

  if (typeof query.company_code === "string" && query.company_code.trim()) {
    filters.company_code = query.company_code.trim()
  }

  if (query.domain_id !== undefined) {
    const raw = String(query.domain_id).trim()
    if (!raw.length || raw.toLowerCase() === "null") {
      filters.domain_id = null
    } else {
      const parsed = Number(raw)
      if (Number.isFinite(parsed)) {
        filters.domain_id = Math.trunc(parsed)
      }
    }
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
  const filters = parseRuleFilters(query)
  const pagination = parsePagination(query)

  const [rules, count] = await listMaxQtyRules(filters, pagination)

  res.json({
    rules,
    count,
    limit: pagination.limit ?? 25,
    offset: pagination.offset ?? 0,
  })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body || {}) as Partial<RuleInput>

  if (!body.category_id || !body.brand_id || !body.company_code) {
    return res.status(400).json({
      message: "category_id, brand_id, and company_code are required",
    })
  }

  if (body.max_qty === undefined || body.max_qty === null) {
    return res.status(400).json({
      message: "max_qty is required",
    })
  }

  const rule = await createMaxQtyRule({
    category_id: String(body.category_id),
    brand_id: String(body.brand_id),
    company_code: String(body.company_code),
    domain_id:
      body.domain_id === null || body.domain_id === undefined
        ? null
        : Number(body.domain_id),
    max_qty: Number(body.max_qty),
  })

  res.status(201).json({ rule })
}

