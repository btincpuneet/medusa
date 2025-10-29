import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonCurrencyMappingTable,
  getPgPool,
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
  res.header("Access-Control-Allow-Methods", "POST,OPTIONS")
  res.header("Access-Control-Allow-Credentials", "true")
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

type CustomerInfoBody = {
  countryCode?: string
  country_code?: string
  country?: string
}

const normalizeCountryCode = (body: CustomerInfoBody): string | null => {
  const value =
    body.countryCode ?? body.country_code ?? body.country ?? undefined

  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim().toUpperCase()
  return trimmed.length ? trimmed : null
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  await ensureRedingtonCurrencyMappingTable()

  const body = (req.body || {}) as CustomerInfoBody
  const countryCode = normalizeCountryCode(body)

  if (!countryCode) {
    return res.status(400).json({
      message: "countryCode is required",
    })
  }

  const { rows } = await getPgPool().query(
    `
      SELECT
        company_code,
        country_code,
        currency_code,
        decimal_place,
        payment_method,
        shipment_tracking_url
      FROM redington_currency_mapping
      WHERE UPPER(country_code) = $1
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [countryCode]
  )

  if (!rows[0]) {
    return res.status(404).json({
      message: `No currency mapping found for ${countryCode}`,
    })
  }

  const record = rows[0]

  return res.json([
    {
      currency_code: record.currency_code ?? null,
      shippment_tracking_url: record.shipment_tracking_url ?? null,
      payment_method_code: record.payment_method ?? null,
      company_code: record.company_code ?? null,
      country_code: record.country_code ?? null,
      decimal_place:
        record.decimal_place !== null && record.decimal_place !== undefined
          ? Number(record.decimal_place)
          : null,
    },
  ])
}
