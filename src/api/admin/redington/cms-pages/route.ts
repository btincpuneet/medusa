import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonCmsPageTable,
  ensureRedingtonDomainTable,
  findDomainById,
  getPgPool,
  mapCmsPageRow,
} from "../../../../lib/pg"

type CreateCmsPageBody = {
  slug?: string
  title?: string
  content?: string
  country_code?: string | null
  domain_id?: number | string | null
  access_id?: string | null
  is_active?: boolean | string
  metadata?: Record<string, unknown> | null
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

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCmsPageTable()

  const where: string[] = []
  const params: any[] = []

  const domainId = parseNumeric(req.query.domain_id ?? req.query.domainId)
  if (domainId) {
    where.push(`domain_id = $${where.length + 1}`)
    params.push(domainId)
  }

  const accessId =
    typeof req.query.access_id === "string"
      ? req.query.access_id.trim()
      : typeof req.query.accessId === "string"
      ? req.query.accessId.trim()
      : undefined
  if (accessId) {
    where.push(`access_id = $${where.length + 1}`)
    params.push(accessId)
  }

  if (req.query.is_active !== undefined) {
    where.push(`is_active = $${where.length + 1}`)
    params.push(parseBoolean(req.query.is_active, true))
  }

  if (req.query.slug) {
    const slug = String(req.query.slug).trim().toLowerCase()
    if (slug) {
      where.push(`LOWER(slug) = $${where.length + 1}`)
      params.push(slug)
    }
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : ""

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_cms_page
      ${whereClause}
      ORDER BY updated_at DESC
    `,
    params
  )

  return res.json({
    cms_pages: rows.map(mapCmsPageRow),
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await Promise.all([
    ensureRedingtonCmsPageTable(),
    ensureRedingtonDomainTable(),
  ])

  const body = (req.body || {}) as CreateCmsPageBody

  const slug = (body.slug || "").trim().toLowerCase()
  const title = (body.title || "").trim()
  const content = (body.content || "").trim()

  if (!slug) {
    return res.status(400).json({ message: "slug is required" })
  }

  if (!title) {
    return res.status(400).json({ message: "title is required" })
  }

  if (!content) {
    return res.status(400).json({ message: "content is required" })
  }

  let domainId: number | null = null
  if (body.domain_id !== undefined && body.domain_id !== null) {
    const parsed = parseNumeric(body.domain_id)
    if (!parsed) {
      return res
        .status(400)
        .json({ message: "domain_id must be a valid number" })
    }

    const domain = await findDomainById(parsed)
    if (!domain) {
      return res.status(404).json({
        message: `Domain with id ${parsed} not found`,
      })
    }
    domainId = parsed
  }

  const metadata =
    typeof body.metadata === "object" && body.metadata !== null
      ? body.metadata
      : {}

  const { rows } = await getPgPool().query(
    `
      INSERT INTO redington_cms_page (
        slug,
        title,
        content,
        country_code,
        domain_id,
        access_id,
        is_active,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
      RETURNING *
    `,
    [
      slug,
      title,
      content,
      body.country_code ?? null,
      domainId,
      body.access_id ?? null,
      parseBoolean(body.is_active, true),
      JSON.stringify(metadata),
    ]
  )

  return res.status(201).json({
    cms_page: mapCmsPageRow(rows[0]),
  })
}
