import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonOrderShipmentTable,
  getPgPool,
  mapOrderShipmentRow,
} from "../../../../lib/pg"

type Nullable<T> = T | null | undefined

const normalize = (value: Nullable<string>) => (value ?? "").trim()
const normalizeLower = (value: Nullable<string>) => normalize(value).toLowerCase()

const clampLimit = (value: Nullable<string>, fallback: number) => {
  if (!value) {
    return fallback
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return Math.min(Math.trunc(parsed), 200)
}

const clampOffset = (value: Nullable<string>) => {
  if (!value) {
    return 0
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }
  return Math.trunc(parsed)
}

type OrderShipmentQuery = {
  order_increment_id?: string
  awb_number?: string
  status?: string
  limit?: string
  offset?: string
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonOrderShipmentTable()

  const query = (req.query || {}) as OrderShipmentQuery

  const conditions: string[] = []
  const params: any[] = []

  const orderIncrementId = normalize(query.order_increment_id)
  if (orderIncrementId) {
    conditions.push(`LOWER(order_increment_id) LIKE $${params.length + 1}`)
    params.push(`%${orderIncrementId.toLowerCase()}%`)
  }

  const awbNumber = normalize(query.awb_number)
  if (awbNumber) {
    conditions.push(`LOWER(COALESCE(awb_number, '')) LIKE $${params.length + 1}`)
    params.push(`%${awbNumber.toLowerCase()}%`)
  }

  const status = normalizeLower(query.status)
  if (status && status !== "all") {
    conditions.push(`LOWER(order_status) = $${params.length + 1}`)
    params.push(status)
  }

  const limit = clampLimit(query.limit, 100)
  const offset = clampOffset(query.offset)

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : ""

  const { rows } = await getPgPool().query(
    `
      SELECT
        id,
        order_id,
        order_increment_id,
        order_status,
        awb_number,
        sap_order_numbers,
        last_synced_at,
        metadata,
        created_at,
        updated_at,
        COUNT(*) OVER() AS total_count
      FROM redington_order_shipment
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `,
    [...params, limit, offset]
  )

  const total =
    rows.length && rows[0].total_count !== undefined
      ? Number(rows[0].total_count)
      : 0

  return res.json({
    order_shipments: rows.map(mapOrderShipmentRow),
    count: total,
    limit,
    offset,
  })
}
