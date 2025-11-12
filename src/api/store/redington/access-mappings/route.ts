import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonAccessMappingTable,
  ensureRedingtonDomainExtentionTable,
  ensureRedingtonDomainTable,
  getPgPool,
  mapAccessMappingRow,
} from "../../../../lib/pg"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await Promise.all([
    ensureRedingtonAccessMappingTable(),
    ensureRedingtonDomainTable(),
    ensureRedingtonDomainExtentionTable(),
  ])

  const rawCountry =
    (req.query.country_code ||
      req.query.countryCode ||
      req.query.country) as string | undefined

  if (!rawCountry) {
    return res
      .status(400)
      .json({ message: "country_code query parameter is required" })
  }

  const countryCode = rawCountry.trim().toUpperCase()

  const baseQuery = `
    SELECT
      am.id,
      am.access_id,
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
  `

  const params: any[] = []
  let whereClause = ""

  if (countryCode !== "ALL") {
    whereClause = "WHERE am.country_code = $1"
    params.push(countryCode)
  }

  const { rows } = await getPgPool().query(
    `${baseQuery} ${whereClause} ORDER BY am.created_at DESC`,
    params
  )

  if (!rows.length) {
    return res.status(404).json({
      message:
        countryCode === "ALL"
          ? "No access mappings found"
          : `No access mappings found for country code ${countryCode}`,
    })
  }

  const mapped = rows.map(mapAccessMappingRow)

  if (countryCode === "ALL") {
    return res.json({
      domain_names: mapped.map((entry) => ({
        access_id: entry.access_id ?? entry.id,
        domain_name: entry.domain_name,
        company_code: entry.company_code,
        domain_extention_name: entry.domain_extention_name,
        brand_ids: entry.brand_ids,
        mobile_ext: entry.mobile_ext,
        country_code: entry.country_code,
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
      company_code: entry.company_code,
      domain_extention_name: entry.domain_extention_name,
      brand_ids: entry.brand_ids,
      mobile_ext: entry.mobile_ext,
    })),
  })
}
