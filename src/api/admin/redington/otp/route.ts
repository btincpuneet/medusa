import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonOtpTable,
  getPgPool,
  mapOtpRow,
} from "../../../../lib/pg"

type Nullable<T> = T | null | undefined

const normalizeString = (value: Nullable<string>) => (value ?? "").trim()
const normalizeLower = (value: Nullable<string>) =>
  normalizeString(value).toLowerCase()

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

type OtpQuery = {
  email?: string
  action?: string
  status?: string
  limit?: string
  offset?: string
}

const STATUS_CASE = `
  CASE
    WHEN consumed_at IS NOT NULL THEN 'consumed'
    WHEN expires_at < NOW() THEN 'expired'
    ELSE 'pending'
  END
`

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonOtpTable()

  const query = (req.query || {}) as OtpQuery

  const conditions: string[] = []
  const params: any[] = []

  const email = normalizeLower(query.email)
  if (email) {
    conditions.push(`LOWER(email) LIKE $${params.length + 1}`)
    params.push(`%${email}%`)
  }

  const action = normalizeString(query.action)
  if (action) {
    conditions.push(`LOWER(action) = $${params.length + 1}`)
    params.push(action.toLowerCase())
  }

  const status = normalizeLower(query.status)
  if (status && !["all", ""].includes(status)) {
    if (!["pending", "expired", "consumed"].includes(status)) {
      return res.status(400).json({
        message: "status must be one of pending, expired, consumed, or omitted",
      })
    }
    conditions.push(`${STATUS_CASE} = $${params.length + 1}`)
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
        email,
        action,
        code,
        expires_at,
        consumed_at,
        created_at,
        updated_at,
        ${STATUS_CASE} AS status,
        (consumed_at IS NOT NULL) AS is_consumed,
        (expires_at < NOW()) AS is_expired,
        GREATEST(updated_at, created_at, expires_at) AS activity_at,
        COUNT(*) OVER() AS total_count
      FROM redington_otp
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

  const mapped = rows.map((row) => {
    const record = mapOtpRow(row)
    const activityAt =
      row.activity_at instanceof Date
        ? row.activity_at.toISOString()
        : String(row.activity_at ?? record.updated_at)

    return {
      ...record,
      status:
        typeof row.status === "string" ? (row.status as string) : "pending",
      is_expired: Boolean(row.is_expired),
      is_consumed: Boolean(row.is_consumed),
      activity_at: activityAt,
    }
  })

  const { rows: statsRows } = await getPgPool().query(
    `
      SELECT
        COUNT(*) FILTER (WHERE consumed_at IS NOT NULL) AS consumed,
        COUNT(*) FILTER (WHERE consumed_at IS NULL AND expires_at < NOW()) AS expired,
        COUNT(*) FILTER (WHERE consumed_at IS NULL AND expires_at >= NOW()) AS pending,
        MAX(created_at) AS last_created_at,
        MAX(consumed_at) AS last_consumed_at
      FROM redington_otp
    `
  )

  const statsRow = statsRows[0] ?? {}

  const pending = Number(statsRow.pending ?? 0)
  const expired = Number(statsRow.expired ?? 0)
  const consumed = Number(statsRow.consumed ?? 0)

  return res.json({
    otps: mapped,
    count: total,
    limit,
    offset,
    stats: {
      pending,
      expired,
      consumed,
      total: pending + expired + consumed,
      last_created_at:
        statsRow.last_created_at instanceof Date
          ? statsRow.last_created_at.toISOString()
          : statsRow.last_created_at ?? null,
      last_consumed_at:
        statsRow.last_consumed_at instanceof Date
          ? statsRow.last_consumed_at.toISOString()
          : statsRow.last_consumed_at ?? null,
    },
  })
}
