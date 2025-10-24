import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonCouponRuleTable,
  ensureRedingtonDomainExtentionTable,
  ensureRedingtonDomainTable,
  findDomainById,
  getPgPool,
  mapCouponRuleRow,
} from "../../../../lib/pg"

type CreateCouponRuleBody = {
  coupon_code?: string
  company_code?: string
  domain_id?: number | string
  domain_extention_id?: number | string | null
  is_active?: boolean | string
  metadata?: Record<string, unknown> | null
}

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : ""

const parseNumeric = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim().length) {
    const parsed = Number.parseInt(value.trim(), 10)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

const parseBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === "boolean") {
    return value
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true
    }
    if (["false", "0", "no", "off"].includes(normalized)) {
      return false
    }
  }
  return fallback
}

const ensureDomainExtentionExists = async (domainExtentionId: number) => {
  await ensureRedingtonDomainExtentionTable()

  const { rows } = await getPgPool().query(
    `
      SELECT id
      FROM redington_domain_extention
      WHERE id = $1
      LIMIT 1
    `,
    [domainExtentionId]
  )

  return rows[0]?.id ? Number(rows[0].id) : null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCouponRuleTable()

  const clauses: string[] = []
  const params: any[] = []

  if (req.query.company_code) {
    clauses.push(`company_code = $${clauses.length + 1}`)
    params.push(String(req.query.company_code).trim())
  }

  const domainId = parseNumeric(req.query.domain_id ?? req.query.domainId)
  if (domainId) {
    clauses.push(`domain_id = $${clauses.length + 1}`)
    params.push(domainId)
  }

  const isActive =
    req.query.is_active !== undefined
      ? parseBoolean(req.query.is_active, true)
      : undefined
  if (isActive !== undefined) {
    clauses.push(`is_active = $${clauses.length + 1}`)
    params.push(isActive)
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_coupon_rule
      ${whereClause}
      ORDER BY updated_at DESC
    `,
    params
  )

  return res.json({
    coupon_rules: rows.map(mapCouponRuleRow),
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await Promise.all([
    ensureRedingtonCouponRuleTable(),
    ensureRedingtonDomainTable(),
    ensureRedingtonDomainExtentionTable(),
  ])

  const body = (req.body || {}) as CreateCouponRuleBody

  const couponCode = normalizeString(body.coupon_code)
  if (!couponCode) {
    return res.status(400).json({ message: "coupon_code is required" })
  }

  const companyCode = normalizeString(body.company_code)
  if (!companyCode) {
    return res.status(400).json({ message: "company_code is required" })
  }

  const domainId = parseNumeric(body.domain_id)
  if (!domainId) {
    return res.status(400).json({ message: "domain_id is required" })
  }

  const domain = await findDomainById(domainId)
  if (!domain) {
    return res.status(404).json({
      message: `Domain with id ${domainId} not found`,
    })
  }

  let domainExtentionId: number | null = null
  if (body.domain_extention_id !== undefined && body.domain_extention_id !== null) {
    const parsed = parseNumeric(body.domain_extention_id)
    if (!parsed) {
      return res.status(400).json({
        message: "domain_extention_id must be a valid number",
      })
    }

    const existing = await ensureDomainExtentionExists(parsed)
    if (!existing) {
      return res.status(404).json({
        message: `Domain extension with id ${parsed} not found`,
      })
    }
    domainExtentionId = parsed
  }

  const metadata =
    typeof body.metadata === "object" && body.metadata !== null
      ? body.metadata
      : {}

  try {
    const { rows } = await getPgPool().query(
      `
        INSERT INTO redington_coupon_rule (
          coupon_code,
          company_code,
          domain_id,
          domain_extention_id,
          is_active,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
        RETURNING *
      `,
      [
        couponCode,
        companyCode,
        domainId,
        domainExtentionId,
        parseBoolean(body.is_active, true),
        JSON.stringify(metadata),
      ]
    )

    return res.status(201).json({
      coupon_rule: mapCouponRuleRow(rows[0]),
    })
  } catch (error: any) {
    if (error?.code === "23505") {
      return res.status(409).json({
        message:
          "Coupon rule already exists for this combination of company, domain, and extension.",
      })
    }

    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Unexpected error creating coupon rule",
    })
  }
}
