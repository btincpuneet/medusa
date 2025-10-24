import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonCurrencyMappingTable,
  getPgPool,
  mapCurrencyMappingRow,
} from "../../../../lib/pg"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCurrencyMappingTable()

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

  const { rows } = await getPgPool().query(
    `
      SELECT
        id,
        name,
        company_code,
        country_name,
        country_code,
        currency_code,
        decimal_place,
        payment_method,
        shipment_tracking_url,
        is_active,
        created_at,
        updated_at
      FROM redington_currency_mapping
      WHERE country_code = $1
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [countryCode]
  )

  if (!rows.length) {
    return res.status(404).json({
      message: `No currency mapping found for country code ${countryCode}`,
    })
  }

  return res.json({
    mapping: mapCurrencyMappingRow(rows[0]),
  })
}
