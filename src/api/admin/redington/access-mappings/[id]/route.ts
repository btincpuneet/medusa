import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonAccessMappingTable,
  ensureRedingtonDomainExtentionTable,
  ensureRedingtonDomainTable,
  getPgPool,
  mapAccessMappingRow,
} from "../../../../../lib/pg"

type Nullable<T> = T | null | undefined

const normalizeBrands = (value: Nullable<string[] | string>): string[] => {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean)
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

const normalizeString = (value: Nullable<string>) => (value ?? "").trim()

const normalizeId = (value: Nullable<number | string>) => {
  const parsed =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

type UpdateAccessMappingBody = {
  country_code?: string
  mobile_ext?: string
  company_code?: string
  brand_ids?: string[] | string
  domain_id?: number | string
  domain_extention_id?: number | string
}

async function getMappingById(id: number) {
  const { rows } = await getPgPool().query(
    `
      SELECT
        am.id,
        am.country_code,
        am.mobile_ext,
        am.company_code,
        am.brand_ids,
        am.domain_id,
        am.domain_extention_id,
        d.domain_name,
        de.domain_extention_name,
        am.created_at,
        am.updated_at
      FROM redington_access_mapping am
      LEFT JOIN redington_domain d ON d.id = am.domain_id
      LEFT JOIN redington_domain_extention de ON de.id = am.domain_extention_id
      WHERE am.id = $1
    `,
    [id]
  )

  return rows[0]
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await Promise.all([
    ensureRedingtonAccessMappingTable(),
    ensureRedingtonDomainTable(),
    ensureRedingtonDomainExtentionTable(),
  ])

  const id = Number.parseInt(req.params.id, 10)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid access mapping id" })
  }

  const row = await getMappingById(id)
  if (!row) {
    return res.status(404).json({ message: "Access mapping not found" })
  }

  return res.json({ access_mapping: mapAccessMappingRow(row) })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  await Promise.all([
    ensureRedingtonAccessMappingTable(),
    ensureRedingtonDomainTable(),
    ensureRedingtonDomainExtentionTable(),
  ])

  const id = Number.parseInt(req.params.id, 10)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid access mapping id" })
  }

  const existing = await getMappingById(id)
  if (!existing) {
    return res.status(404).json({ message: "Access mapping not found" })
  }

  const body = (req.body || {}) as UpdateAccessMappingBody

  const updates: string[] = []
  const params: any[] = []

  if (body.country_code !== undefined) {
    const code = normalizeString(body.country_code).toUpperCase()
    if (!code) {
      return res
        .status(400)
        .json({ message: "country_code cannot be empty" })
    }
    updates.push(`country_code = $${updates.length + 1}`)
    params.push(code)
  }

  if (body.mobile_ext !== undefined) {
    const ext = normalizeString(body.mobile_ext)
    if (!ext) {
      return res.status(400).json({ message: "mobile_ext cannot be empty" })
    }
    updates.push(`mobile_ext = $${updates.length + 1}`)
    params.push(ext)
  }

  if (body.company_code !== undefined) {
    const company = normalizeString(body.company_code)
    if (!company) {
      return res.status(400).json({ message: "company_code cannot be empty" })
    }
    updates.push(`company_code = $${updates.length + 1}`)
    params.push(company)
  }

  if (body.brand_ids !== undefined) {
    const brands = normalizeBrands(body.brand_ids)
    updates.push(`brand_ids = $${updates.length + 1}::jsonb`)
    params.push(JSON.stringify(brands))
  }

  if (body.domain_id !== undefined) {
    const domainId = normalizeId(body.domain_id)
    if (!domainId) {
      return res.status(400).json({ message: "domain_id must be a number" })
    }
    updates.push(`domain_id = $${updates.length + 1}`)
    params.push(domainId)
  }

  if (body.domain_extention_id !== undefined) {
    const domainExtId = normalizeId(body.domain_extention_id)
    if (!domainExtId) {
      return res
        .status(400)
        .json({ message: "domain_extention_id must be a number" })
    }
    updates.push(`domain_extention_id = $${updates.length + 1}`)
    params.push(domainExtId)
  }

  if (!updates.length) {
    return res.status(400).json({ message: "No updatable fields provided" })
  }

  params.push(id)

  try {
    await getPgPool().query(
      `
        UPDATE redington_access_mapping
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE id = $${params.length}
      `,
      params
    )

    const row = await getMappingById(id)
    if (!row) {
      return res.status(404).json({ message: "Access mapping not found" })
    }

    return res.json({ access_mapping: mapAccessMappingRow(row) })
  } catch (error: any) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Unexpected error updating access mapping",
    })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonAccessMappingTable()

  const id = Number.parseInt(req.params.id, 10)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid access mapping id" })
  }

  const { rowCount } = await getPgPool().query(
    `DELETE FROM redington_access_mapping WHERE id = $1`,
    [id]
  )

  if (rowCount === 0) {
    return res.status(404).json({ message: "Access mapping not found" })
  }

  return res.status(204).send()
}
