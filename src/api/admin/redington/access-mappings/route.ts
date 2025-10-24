import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonAccessMappingTable,
  ensureRedingtonDomainExtentionTable,
  ensureRedingtonDomainTable,
  getPgPool,
  mapAccessMappingRow,
} from "../../../../lib/pg"

type Nullable<T> = T | null | undefined

type CreateAccessMappingBody = {
  country_code?: string
  mobile_ext?: string
  company_code?: string
  brand_ids?: string[] | string
  domain_id?: number | string
  domain_extention_id?: number | string
}

const normalizeCountryCode = (value: Nullable<string>) =>
  (value ?? "").trim().toUpperCase()

const normalizeMobileExt = (value: Nullable<string>) => (value ?? "").trim()

const normalizeCompanyCode = (value: Nullable<string>) => (value ?? "").trim()

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

const normalizeId = (value: Nullable<number | string>) => {
  const parsed =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await Promise.all([
    ensureRedingtonAccessMappingTable(),
    ensureRedingtonDomainTable(),
    ensureRedingtonDomainExtentionTable(),
  ])

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
      ORDER BY am.created_at DESC
    `
  )

  return res.json({
    access_mappings: rows.map(mapAccessMappingRow),
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await Promise.all([
    ensureRedingtonAccessMappingTable(),
    ensureRedingtonDomainTable(),
    ensureRedingtonDomainExtentionTable(),
  ])

  const body = (req.body || {}) as CreateAccessMappingBody

  const countryCode = normalizeCountryCode(body.country_code)
  const mobileExt = normalizeMobileExt(body.mobile_ext)
  const companyCode = normalizeCompanyCode(body.company_code)
  const brandIds = normalizeBrands(body.brand_ids)
  const domainId = normalizeId(body.domain_id)
  const domainExtentionId = normalizeId(body.domain_extention_id)

  if (!countryCode) {
    return res.status(400).json({ message: "country_code is required" })
  }

  if (!mobileExt) {
    return res.status(400).json({ message: "mobile_ext is required" })
  }

  if (!companyCode) {
    return res.status(400).json({ message: "company_code is required" })
  }

  if (!domainId) {
    return res.status(400).json({ message: "domain_id is required" })
  }

  if (!domainExtentionId) {
    return res.status(400).json({ message: "domain_extention_id is required" })
  }

  const brandIdsJson = JSON.stringify(brandIds)

  try {
    const { rows } = await getPgPool().query(
      `
        INSERT INTO redington_access_mapping
          (country_code, mobile_ext, company_code, brand_ids, domain_id, domain_extention_id)
        VALUES ($1, $2, $3, $4::jsonb, $5, $6)
        RETURNING
          id,
          country_code,
          mobile_ext,
          company_code,
          brand_ids,
          domain_id,
          domain_extention_id,
          created_at,
          updated_at
      `,
      [countryCode, mobileExt, companyCode, brandIdsJson, domainId, domainExtentionId]
    )

    const created = rows[0]

    const { rows: hydrated } = await getPgPool().query(
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
      [created.id]
    )

    return res.status(201).json({
      access_mapping: mapAccessMappingRow(hydrated[0] ?? created),
    })
  } catch (error: any) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Unexpected error creating access mapping",
    })
  }
}
