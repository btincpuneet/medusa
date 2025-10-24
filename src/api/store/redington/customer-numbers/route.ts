import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonAccessMappingTable,
  ensureRedingtonCustomerNumberTable,
  getPgPool,
  mapAccessMappingRow,
  mapCustomerNumberRow,
} from "../../../../lib/pg"

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
  await Promise.all([
    ensureRedingtonAccessMappingTable(),
    ensureRedingtonCustomerNumberTable(),
  ])

  const accessId = parseNumeric(
    req.query.access_id ?? req.query.accessId ?? req.query.access
  )

  if (!accessId) {
    return res.status(400).json({
      message: "access_id query parameter is required",
    })
  }

  const { rows: mappingRows } = await getPgPool().query(
    `
      SELECT
        am.*,
        d.domain_name,
        de.domain_extention_name
      FROM redington_access_mapping am
      LEFT JOIN redington_domain d ON d.id = am.domain_id
      LEFT JOIN redington_domain_extention de ON de.id = am.domain_extention_id
      WHERE am.id = $1
      LIMIT 1
    `,
    [accessId]
  )

  if (!mappingRows[0]) {
    return res.status(404).json({
      message: `Access mapping ${accessId} not found`,
    })
  }

  const mapping = mapAccessMappingRow(mappingRows[0])
  const brandFilter =
    typeof req.query.brand_id === "string"
      ? req.query.brand_id.trim()
      : undefined

  const brandIds = mapping.brand_ids.length
    ? mapping.brand_ids
    : [brandFilter].filter(Boolean) ?? []

  if (!brandIds.length) {
    return res.status(404).json({
      message:
        "No brand information is linked to this access mapping. Unable to resolve customer numbers.",
    })
  }

  if (brandFilter && !brandIds.includes(brandFilter)) {
    return res.status(404).json({
      message: `Brand ${brandFilter} is not associated with access ${accessId}.`,
    })
  }

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_customer_number
      WHERE company_code = $1
        AND domain_id = $2
        AND brand_id = ANY($3::text[])
      ORDER BY created_at DESC
    `,
    [mapping.company_code, mapping.domain_id, brandFilter ? [brandFilter] : brandIds]
  )

  if (!rows.length) {
    return res.status(404).json({
      message: "No customer numbers found for the given access and brands.",
    })
  }

  return res.json({
    access: {
      id: mapping.id,
      company_code: mapping.company_code,
      domain_id: mapping.domain_id,
      domain_name: mapping.domain_name,
      domain_extention_id: mapping.domain_extention_id,
      domain_extention_name: mapping.domain_extention_name,
      brand_ids: brandIds,
    },
    customer_numbers: rows.map(mapCustomerNumberRow),
  })
}
