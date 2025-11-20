import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonOrderCcEmailTable,
  findDomainById,
  findDomainExtentionById,
  getPgPool,
  mapOrderCcEmailRow,
} from "../../../../lib/pg"

type OrderCcEmailQuery = {
  company_code?: string
  domain_id?: string
  domain_extention_id?: string
  email?: string
  limit?: string
  offset?: string
}

type OrderCcEmailBody = {
  company_code?: string
  domain_id?: number | string | null
  domain_extention_id?: number | string | null
  brand_ids?: string[] | string | null
  cc_emails?: string[] | string | null
}

const clampLimit = (value: unknown, fallback = 100, max = 200) => {
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

const parseNullableId = (
  value: unknown
): number | null | undefined => {
  if (value === undefined) {
    return undefined
  }
  if (value === null) {
    return null
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const normalized = Math.trunc(value)
    return normalized > 0 ? normalized : undefined
  }
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed.length || trimmed.toLowerCase() === "null") {
      return null
    }
    const parsed = Number.parseInt(trimmed, 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  }
  return undefined
}

const normalizeList = (
  value: unknown,
  { allowUndefined = false }: { allowUndefined?: boolean } = {}
): string[] | undefined => {
  if (value === undefined) {
    return allowUndefined ? undefined : []
  }
  if (value === null) {
    return []
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter(Boolean)
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
  return []
}

const serializeList = (values: string[] | undefined) =>
  values && values.length ? values.join(",") : null

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonOrderCcEmailTable()

  const query = (req.query || {}) as OrderCcEmailQuery
  const conditions: string[] = []
  const params: any[] = []

  const companyCode = (query.company_code || "").trim()
  if (companyCode) {
    conditions.push(`LOWER(company_code) = LOWER($${params.length + 1})`)
    params.push(companyCode)
  }

  const domainId = parseNullableId(query.domain_id)
  if (query.domain_id !== undefined) {
    if (domainId === undefined) {
      return res
        .status(400)
        .json({ message: "domain_id must be a number or null" })
    }
    if (domainId === null) {
      conditions.push("domain_id IS NULL")
    } else {
      conditions.push(`domain_id = $${params.length + 1}`)
      params.push(domainId)
    }
  }

  const domainExtentionId = parseNullableId(query.domain_extention_id)
  if (query.domain_extention_id !== undefined) {
    if (domainExtentionId === undefined) {
      return res.status(400).json({
        message: "domain_extention_id must be a number or null",
      })
    }
    if (domainExtentionId === null) {
      conditions.push("domain_extention_id IS NULL")
    } else {
      conditions.push(`domain_extention_id = $${params.length + 1}`)
      params.push(domainExtentionId)
    }
  }

  const emailSearch = (query.email || "").trim().toLowerCase()
  if (emailSearch) {
    conditions.push(`LOWER(COALESCE(cc_emails, '')) LIKE $${params.length + 1}`)
    params.push(`%${emailSearch}%`)
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : ""

  const limit = clampLimit(query.limit)
  const offset = clampOffset(query.offset)

  const { rows } = await getPgPool().query(
    `
      SELECT
        oce.*,
        d.domain_name,
        de.domain_extention_name,
        COUNT(*) OVER() AS total_count
      FROM redington_order_cc_email oce
      LEFT JOIN redington_domain d ON d.id = oce.domain_id
      LEFT JOIN redington_domain_extention de ON de.id = oce.domain_extention_id
      ${whereClause}
      ORDER BY oce.updated_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `,
    [...params, limit, offset]
  )

  const count =
    rows.length && rows[0].total_count !== undefined
      ? Number(rows[0].total_count)
      : 0

  return res.json({
    order_cc_emails: rows.map((row) => ({
      ...mapOrderCcEmailRow(row),
      domain_name:
        typeof row.domain_name === "string" && row.domain_name.length
          ? row.domain_name
          : null,
      domain_extention_name:
        typeof row.domain_extention_name === "string" &&
        row.domain_extention_name.length
          ? row.domain_extention_name
          : null,
    })),
    count,
    limit,
    offset,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonOrderCcEmailTable()

  const body = (req.body || {}) as OrderCcEmailBody

  const companyCode = (body.company_code || "").trim()
  if (!companyCode) {
    return res.status(400).json({
      message: "company_code is required",
    })
  }

  const domainId = parseNullableId(body.domain_id)
  if (body.domain_id !== undefined && domainId === undefined) {
    return res.status(400).json({
      message: "domain_id must be a number or null",
    })
  }

  const domainExtentionId = parseNullableId(body.domain_extention_id)
  if (body.domain_extention_id !== undefined && domainExtentionId === undefined) {
    return res.status(400).json({
      message: "domain_extention_id must be a number or null",
    })
  }

  const ccEmails = normalizeList(body.cc_emails)
  if (!ccEmails.length) {
    return res.status(400).json({
      message: "cc_emails is required",
    })
  }

  const brandIds = normalizeList(body.brand_ids)

  const [domain, domainExtension] = await Promise.all([
    domainId ? findDomainById(domainId) : Promise.resolve(null),
    domainExtentionId ? findDomainExtentionById(domainExtentionId) : Promise.resolve(null),
  ])

  if (domainId && !domain) {
    return res.status(404).json({
      message: `Domain with id ${domainId} not found`,
    })
  }

  if (domainExtentionId && !domainExtension) {
    return res.status(404).json({
      message: `Domain extension with id ${domainExtentionId} not found`,
    })
  }

  const { rows } = await getPgPool().query(
    `
      INSERT INTO redington_order_cc_email (
        company_code,
        domain_id,
        domain_extention_id,
        brand_ids,
        cc_emails
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [
      companyCode,
      domainId ?? null,
      domainExtentionId ?? null,
      serializeList(brandIds),
      serializeList(ccEmails),
    ]
  )

  const mapped = mapOrderCcEmailRow(rows[0])

  return res.status(201).json({
    order_cc_email: {
      ...mapped,
      domain_name: domain?.domain_name ?? null,
      domain_extention_name: domainExtension?.domain_extention_name ?? null,
    },
  })
}
