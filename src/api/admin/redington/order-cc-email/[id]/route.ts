import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonOrderCcEmailTable,
  findDomainById,
  findDomainExtentionById,
  getPgPool,
  mapOrderCcEmailRow,
} from "../../../../../lib/pg"

type OrderCcEmailBody = {
  company_code?: string
  domain_id?: number | string | null
  domain_extention_id?: number | string | null
  brand_ids?: string[] | string | null
  cc_emails?: string[] | string | null
}

const parseId = (value: string) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : undefined
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
  value: unknown
): string[] | undefined => {
  if (value === undefined) {
    return undefined
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

const hasField = (body: Record<string, any>, key: string) =>
  Object.prototype.hasOwnProperty.call(body, key)

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonOrderCcEmailTable()

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid order-cc-email id" })
  }

  const { rows } = await getPgPool().query(
    `
      SELECT
        oce.*,
        d.domain_name,
        de.domain_extention_name
      FROM redington_order_cc_email oce
      LEFT JOIN redington_domain d ON d.id = oce.domain_id
      LEFT JOIN redington_domain_extention de ON de.id = oce.domain_extention_id
      WHERE oce.id = $1
      LIMIT 1
    `,
    [id]
  )

  if (!rows[0]) {
    return res.status(404).json({ message: "Order CC email entry not found" })
  }

  return res.json({
    order_cc_email: {
      ...mapOrderCcEmailRow(rows[0]),
      domain_name:
        typeof rows[0].domain_name === "string" && rows[0].domain_name.length
          ? rows[0].domain_name
          : null,
      domain_extention_name:
        typeof rows[0].domain_extention_name === "string" &&
        rows[0].domain_extention_name.length
          ? rows[0].domain_extention_name
          : null,
    },
  })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonOrderCcEmailTable()

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid order-cc-email id" })
  }

  const body = (req.body || {}) as OrderCcEmailBody
  const updates: string[] = []
  const params: any[] = []

  if (hasField(body, "company_code")) {
    const companyCode = (body.company_code || "").trim()
    if (!companyCode) {
      return res.status(400).json({
        message: "company_code cannot be empty",
      })
    }
    updates.push(`company_code = $${params.length + 1}`)
    params.push(companyCode)
  }

  if (hasField(body, "domain_id")) {
    const domainId = parseNullableId(body.domain_id)
    if (domainId === undefined) {
      return res
        .status(400)
        .json({ message: "domain_id must be a number or null" })
    }

    if (domainId) {
      const domain = await findDomainById(domainId)
      if (!domain) {
        return res
          .status(404)
          .json({ message: `Domain with id ${domainId} not found` })
      }
    }

    updates.push(`domain_id = $${params.length + 1}`)
    params.push(domainId ?? null)
  }

  if (hasField(body, "domain_extention_id")) {
    const domainExtentionId = parseNullableId(body.domain_extention_id)
    if (domainExtentionId === undefined) {
      return res.status(400).json({
        message: "domain_extention_id must be a number or null",
      })
    }

    if (domainExtentionId) {
      const domainExtension = await findDomainExtentionById(domainExtentionId)
      if (!domainExtension) {
        return res.status(404).json({
          message: `Domain extension with id ${domainExtentionId} not found`,
        })
      }
    }

    updates.push(`domain_extention_id = $${params.length + 1}`)
    params.push(domainExtentionId ?? null)
  }

  if (hasField(body, "brand_ids")) {
    const brandIds = normalizeList(body.brand_ids)
    updates.push(`brand_ids = $${params.length + 1}`)
    params.push(serializeList(brandIds))
  }

  if (hasField(body, "cc_emails")) {
    const emails = normalizeList(body.cc_emails)
    if (!emails?.length) {
      return res.status(400).json({
        message: "cc_emails is required",
      })
    }

    updates.push(`cc_emails = $${params.length + 1}`)
    params.push(serializeList(emails))
  }

  if (!updates.length) {
    return res.status(400).json({ message: "No updatable fields provided" })
  }

  updates.push(`updated_at = NOW()`)
  params.push(id)

  const { rows } = await getPgPool().query(
    `
      UPDATE redington_order_cc_email
      SET ${updates.join(", ")}
      WHERE id = $${params.length}
      RETURNING *
    `,
    params
  )

  if (!rows[0]) {
    return res.status(404).json({ message: "Order CC email entry not found" })
  }

  const mapped = mapOrderCcEmailRow(rows[0])
  const [domain, domainExtension] = await Promise.all([
    mapped.domain_id ? findDomainById(mapped.domain_id) : Promise.resolve(null),
    mapped.domain_extention_id
      ? findDomainExtentionById(mapped.domain_extention_id)
      : Promise.resolve(null),
  ])

  return res.json({
    order_cc_email: {
      ...mapped,
      domain_name: domain?.domain_name ?? null,
      domain_extention_name: domainExtension?.domain_extention_name ?? null,
    },
  })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonOrderCcEmailTable()

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid order-cc-email id" })
  }

  const { rowCount } = await getPgPool().query(
    `
      DELETE FROM redington_order_cc_email
      WHERE id = $1
    `,
    [id]
  )

  if (!rowCount) {
    return res.status(404).json({ message: "Order CC email entry not found" })
  }

  return res.status(204).send()
}
