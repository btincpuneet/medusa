import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonCurrencyMappingTable,
  getPgPool,
  mapCurrencyMappingRow,
} from "../../../../../lib/pg"

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

type UpdateCurrencyMappingBody = {
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

async function findMapping(id: number) {
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
      WHERE id = $1
    `,
    [id]
  )

  return rows[0]
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCurrencyMappingTable()

  const id = Number.parseInt(req.params.id, 10)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid currency mapping id" })
  }

  const row = await findMapping(id)
  if (!row) {
    return res.status(404).json({ message: "Currency mapping not found" })
  }

  return res.json({ currency_mapping: mapCurrencyMappingRow(row) })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCurrencyMappingTable()

  const id = Number.parseInt(req.params.id, 10)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid currency mapping id" })
  }

  const existing = await findMapping(id)
  if (!existing) {
    return res.status(404).json({ message: "Currency mapping not found" })
  }

  const body = (req.body || {}) as UpdateCurrencyMappingBody

  const updates: string[] = []
  const params: any[] = []

  if (body.name !== undefined) {
    const name = normalizeString(body.name)
    if (!name) {
      return res.status(400).json({ message: "name cannot be empty" })
    }
    updates.push(`name = $${updates.length + 1}`)
    params.push(name)
  }

  if (body.company_code !== undefined) {
    const company = normalizeString(body.company_code)
    if (!company) {
      return res.status(400).json({ message: "company_code cannot be empty" })
    }
    updates.push(`company_code = $${updates.length + 1}`)
    params.push(company)
  }

  if (body.country_name !== undefined) {
    const countryName = normalizeString(body.country_name)
    if (!countryName) {
      return res.status(400).json({ message: "country_name cannot be empty" })
    }
    updates.push(`country_name = $${updates.length + 1}`)
    params.push(countryName)
  }

  if (body.country_code !== undefined) {
    const code = normalizeCountry(body.country_code)
    if (!code) {
      return res.status(400).json({ message: "country_code cannot be empty" })
    }
    updates.push(`country_code = $${updates.length + 1}`)
    params.push(code)
  }

  if (body.currency_code !== undefined) {
    const currency = normalizeString(body.currency_code).toUpperCase()
    if (!currency) {
      return res.status(400).json({ message: "currency_code cannot be empty" })
    }
    updates.push(`currency_code = $${updates.length + 1}`)
    params.push(currency)
  }

  if (body.decimal_place !== undefined) {
    const decimalPlace = Number(body.decimal_place)
    if (!Number.isFinite(decimalPlace) || decimalPlace < 0) {
      return res
        .status(400)
        .json({ message: "decimal_place must be a non-negative number" })
    }
    updates.push(`decimal_place = $${updates.length + 1}`)
    params.push(decimalPlace)
  }

  if (body.payment_method !== undefined) {
    const payment = normalizeString(body.payment_method)
    if (!payment) {
      return res.status(400).json({ message: "payment_method cannot be empty" })
    }
    updates.push(`payment_method = $${updates.length + 1}`)
    params.push(payment)
  }

  if (body.shipment_tracking_url !== undefined) {
    const url = normalizeString(body.shipment_tracking_url)
    if (!url) {
      return res
        .status(400)
        .json({ message: "shipment_tracking_url cannot be empty" })
    }
    updates.push(`shipment_tracking_url = $${updates.length + 1}`)
    params.push(url)
  }

  if (body.is_active !== undefined) {
    updates.push(`is_active = $${updates.length + 1}`)
    params.push(parseBoolean(body.is_active, true))
  }

  if (!updates.length) {
    return res.status(400).json({ message: "No updatable fields provided" })
  }

  params.push(id)

  try {
    await getPgPool().query(
      `
        UPDATE redington_currency_mapping
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE id = $${params.length}
      `,
      params
    )

    const updated = await findMapping(id)
    if (!updated) {
      return res.status(404).json({ message: "Currency mapping not found" })
    }

    return res.json({ currency_mapping: mapCurrencyMappingRow(updated) })
  } catch (error: any) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Unexpected error updating currency mapping",
    })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCurrencyMappingTable()

  const id = Number.parseInt(req.params.id, 10)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid currency mapping id" })
  }

  const { rowCount } = await getPgPool().query(
    `DELETE FROM redington_currency_mapping WHERE id = $1`,
    [id]
  )

  if (rowCount === 0) {
    return res.status(404).json({ message: "Currency mapping not found" })
  }

  return res.status(204).send()
}
