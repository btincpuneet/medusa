import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonCurrencyMappingTable,
  getPgPool,
  mapCurrencyMappingRow,
} from "../../../../lib/pg"

type Nullable<T> = T | null | undefined

const normalizeString = (value: Nullable<string>) => (value ?? "").trim()
const normalizeCountry = (value: Nullable<string>) =>
  (value ?? "").trim().toUpperCase()

const parseBoolean = (value: Nullable<boolean | string>, fallback = true) => {
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

type CreateCurrencyMappingBody = {
  name?: string
  company_code?: string
  country_name?: string
  country_code?: string
  currency_code?: string
  decimal_place?: number | string
  payment_method?: string
  shipment_tracking_url?: string
  is_active?: boolean | string
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCurrencyMappingTable()

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
      ORDER BY created_at DESC
    `
  )

  return res.json({
    currency_mappings: rows.map(mapCurrencyMappingRow),
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCurrencyMappingTable()

  const body = (req.body || {}) as CreateCurrencyMappingBody

  const name = normalizeString(body.name)
  const companyCode = normalizeString(body.company_code)
  const countryName = normalizeString(body.country_name)
  const countryCode = normalizeCountry(body.country_code)
  const currencyCode = normalizeString(body.currency_code).toUpperCase()
  const decimalPlace = Number(body.decimal_place ?? 2)
  const paymentMethod = normalizeString(body.payment_method)
  const shipmentTrackingUrl = normalizeString(body.shipment_tracking_url)
  const isActive = parseBoolean(body.is_active, true)

  if (!name) {
    return res.status(400).json({ message: "name is required" })
  }

  if (!companyCode) {
    return res.status(400).json({ message: "company_code is required" })
  }

  if (!countryName) {
    return res.status(400).json({ message: "country_name is required" })
  }

  if (!countryCode) {
    return res.status(400).json({ message: "country_code is required" })
  }

  if (!currencyCode) {
    return res.status(400).json({ message: "currency_code is required" })
  }

  if (!Number.isFinite(decimalPlace) || decimalPlace < 0) {
    return res
      .status(400)
      .json({ message: "decimal_place must be a non-negative number" })
  }

  if (!paymentMethod) {
    return res.status(400).json({ message: "payment_method is required" })
  }

  if (!shipmentTrackingUrl) {
    return res
      .status(400)
      .json({ message: "shipment_tracking_url is required" })
  }

  try {
    const { rows } = await getPgPool().query(
      `
        INSERT INTO redington_currency_mapping (
          name,
          company_code,
          country_name,
          country_code,
          currency_code,
          decimal_place,
          payment_method,
          shipment_tracking_url,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING
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
      `,
      [
        name,
        companyCode,
        countryName,
        countryCode,
        currencyCode,
        decimalPlace,
        paymentMethod,
        shipmentTrackingUrl,
        isActive,
      ]
    )

    return res.status(201).json({
      currency_mapping: mapCurrencyMappingRow(rows[0]),
    })
  } catch (error: any) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Unexpected error creating currency mapping",
    })
  }
}
