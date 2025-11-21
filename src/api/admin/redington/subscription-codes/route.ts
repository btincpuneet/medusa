import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonSubscriptionCodeTable,
  findSubscriptionCodeByCode,
  getPgPool,
  mapSubscriptionCodeRow,
  type SubscriptionCodeRow,
} from "../../../../lib/pg"

type CreateSubscriptionCodeBody = {
  subscription_code?: string
  company_code?: string
  access_id?: string
  first_name?: string
  last_name?: string
  email?: string
  status?: boolean | string
}

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : ""

const normalizeEmail = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : ""

const parseBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") {
    return value
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (["1", "true", "yes", "enable", "enabled"].includes(normalized)) {
      return true
    }
    if (["0", "false", "no", "disable", "disabled"].includes(normalized)) {
      return false
    }
  }
  return undefined
}

const parseLimit = (value: unknown, fallback = 20) => {
  const parsed = Number.parseInt(String(value || ""), 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return Math.min(parsed, 200)
}

const parseOffset = (value: unknown) => {
  const parsed = Number.parseInt(String(value || ""), 10)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }
  return parsed
}

const sanitizeAccessId = (value: string) =>
  value.replace(/[^0-9.]/g, "")

const buildSearchClause = (
  q: string,
  params: any[]
): { clause: string; params: any[] } => {
  if (!q) {
    return { clause: "", params }
  }

  const like = `%${q}%`
  params.push(like)
  const idx = `$${params.length}`
  const clause = `(
    subscription_code ILIKE ${idx}
    OR company_code ILIKE ${idx}
    OR access_id ILIKE ${idx}
    OR first_name ILIKE ${idx}
    OR last_name ILIKE ${idx}
    OR email ILIKE ${idx}
  )`

  return { clause, params }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonSubscriptionCodeTable()

  const limit = parseLimit(req.query.limit)
  const offset = parseOffset(req.query.offset)
  const q = normalizeString(req.query.q)
  const statusFilter = parseBoolean(req.query.status)

  const params: any[] = []
  const clauses: string[] = []

  if (q) {
    const { clause } = buildSearchClause(q, params)
    if (clause) {
      clauses.push(clause)
    }
  }

  if (typeof statusFilter === "boolean") {
    params.push(statusFilter)
    clauses.push(`status = $${params.length}`)
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""

  const countResult = await getPgPool().query(
    `
      SELECT COUNT(*) AS count
      FROM redington_subscription_code
      ${whereClause}
    `,
    params
  )

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_subscription_code
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `,
    [...params, limit, offset]
  )

  return res.json({
    subscription_codes: rows.map(mapSubscriptionCodeRow),
    count: Number(countResult.rows?.[0]?.count || 0),
    limit,
    offset,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonSubscriptionCodeTable()

  const body = (req.body || {}) as CreateSubscriptionCodeBody

  const subscriptionCode = normalizeString(body.subscription_code)
  if (!subscriptionCode) {
    return res.status(400).json({ message: "subscription_code is required" })
  }

  const companyCode = normalizeString(body.company_code)
  if (!companyCode) {
    return res.status(400).json({ message: "company_code is required" })
  }

  const accessId = sanitizeAccessId(normalizeString(body.access_id))
  if (!accessId) {
    return res.status(400).json({ message: "access_id is required" })
  }

  const firstName = normalizeString(body.first_name)
  const lastName = normalizeString(body.last_name)
  const email = normalizeEmail(body.email)

  if (!firstName || !lastName || !email) {
    return res.status(400).json({
      message: "first_name, last_name, and email are required",
    })
  }

  const existing = await findSubscriptionCodeByCode(subscriptionCode)
  if (existing) {
    return res.status(409).json({
      message: `Subscription code "${subscriptionCode}" already exists.`,
      subscription_code: existing,
    })
  }

  const status =
    typeof body.status === "boolean"
      ? body.status
      : parseBoolean(body.status) ?? true

  const { rows } = await getPgPool().query(
    `
      INSERT INTO redington_subscription_code (
        subscription_code,
        company_code,
        access_id,
        first_name,
        last_name,
        email,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [
      subscriptionCode,
      companyCode,
      accessId,
      firstName,
      lastName,
      email,
      status,
    ]
  )

  const payload: { subscription_code: SubscriptionCodeRow } = {
    subscription_code: mapSubscriptionCodeRow(rows[0]),
  }

  return res.status(201).json(payload)
}
