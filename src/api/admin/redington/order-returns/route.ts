import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonOrderReturnTable,
  mapOrderReturnRow,
  getPgPool,
} from "../../../../lib/pg"

const clampLimit = (value: unknown, fallback = 50, max = 200) => {
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

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  await ensureRedingtonOrderReturnTable()

  const query = req.query || {}
  const params: any[] = []
  const filters: string[] = []

  if (query.email) {
    params.push(String(query.email))
    filters.push(`LOWER(user_email) = LOWER($${params.length})`)
  }

  if (query.order_id) {
    params.push(String(query.order_id))
    filters.push(`order_id = $${params.length}`)
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : ""
  const limit = clampLimit(query.limit)
  const offset = clampOffset(query.offset)

  params.push(limit)
  params.push(offset)

  const pool = getPgPool()

  const [{ rows }, { rows: countRows }] = await Promise.all([
    pool.query(
      `
        SELECT *
        FROM redington_order_return
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${params.length - 1}
        OFFSET $${params.length}
      `,
      params
    ),
    pool.query(
      `
        SELECT COUNT(*)::int AS count
        FROM redington_order_return
        ${whereClause}
      `,
      params.slice(0, params.length - 2)
    ),
  ])

  return res.json({
    order_returns: rows.map(mapOrderReturnRow),
    count: countRows[0]?.count ?? 0,
    limit,
    offset,
  })
}
