import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonAccessMappingTable,
  ensureRedingtonDomainExtentionTable,
  ensureRedingtonDomainTable,
  getPgPool,
  mapAccessMappingRow,
} from "../../../../../lib/pg"

const setCors = (req: MedusaRequest, res: MedusaResponse) => {
  const origin = req.headers.origin
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin)
    res.header("Vary", "Origin")
  } else {
    res.header("Access-Control-Allow-Origin", "*")
  }

  res.header(
    "Access-Control-Allow-Headers",
    req.headers["access-control-request-headers"] ||
      "Content-Type, Authorization"
  )
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  res.header("Access-Control-Allow-Credentials", "true")
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

type DomainDetailsRequest = {
  countryCode?: string
  country_code?: string
  country?: string
}

const normalizeCountryCode = (body: DomainDetailsRequest): string | null => {
  const raw =
    body.countryCode || body.country_code || body.country || ""
  const trimmed = raw.trim().toUpperCase()
  return trimmed.length ? trimmed : null
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  await Promise.all([
    ensureRedingtonAccessMappingTable(),
    ensureRedingtonDomainTable(),
    ensureRedingtonDomainExtentionTable(),
  ])

  const body = (req.body || {}) as DomainDetailsRequest
  const countryCode = normalizeCountryCode(body)

  if (!countryCode) {
    return res
      .status(400)
      .json({ message: "countryCode is required" })
  }

  const params: any[] = []
  let whereClause = ""

  if (countryCode !== "ALL") {
    whereClause = "WHERE am.country_code = $1"
    params.push(countryCode)
  }

  const { rows } = await getPgPool().query(
    `
      SELECT
        am.*,
        d.domain_name,
        de.domain_extention_name
      FROM redington_access_mapping am
      LEFT JOIN redington_domain d ON d.id = am.domain_id
      LEFT JOIN redington_domain_extention de ON de.id = am.domain_extention_id
      ${whereClause}
      ORDER BY am.created_at DESC
    `,
    params
  )

  if (!rows.length) {
    return res.status(404).json({
      message:
        countryCode === "ALL"
          ? "No access mappings found."
          : `No access mapping found for country ${countryCode}.`,
    })
  }

  const mapped = rows.map(mapAccessMappingRow)

  if (countryCode === "ALL") {
    return res.json({
      domain_names: mapped.map((entry) => ({
        access_id: entry.access_id ?? entry.id,
        domain_name: entry.domain_name,
        domain_extention_name: entry.domain_extention_name,
        company_code: entry.company_code,
        country_code: entry.country_code,
        mobile_ext: entry.mobile_ext,
        brand_ids: entry.brand_ids,
      })),
    })
  }

  const mobileExtension = mapped[0]?.mobile_ext ?? ""

  return res.json({
    country_code: countryCode,
    mobile_extension: mobileExtension,
    domain_names: mapped.map((entry) => ({
      access_id: entry.access_id ?? entry.id,
      domain_name: entry.domain_name,
      domain_extention_name: entry.domain_extention_name,
      company_code: entry.company_code,
      brand_ids: entry.brand_ids,
      mobile_ext: entry.mobile_ext,
    })),
  })
}
