import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonCompanyCodeTable,
  getPgPool,
  mapCompanyCodeRow,
} from "../../../../lib/pg"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCompanyCodeTable()

  const countryCodeRaw = (req.query.country_code ||
    req.query.countryCode ||
    req.query.country) as string | undefined

  const params: any[] = []
  let whereClause = ""

  if (countryCodeRaw) {
    whereClause = "AND country_code = $1"
    params.push(countryCodeRaw.trim().toUpperCase())
  }

  const { rows } = await getPgPool().query(
    `
      SELECT id, country_code, company_code, status, created_at, updated_at
      FROM redington_company_code
      WHERE status = TRUE ${whereClause}
      ORDER BY country_code ASC
    `,
    params
  )

  return res.json({
    company_codes: rows.map(mapCompanyCodeRow),
  })
}
