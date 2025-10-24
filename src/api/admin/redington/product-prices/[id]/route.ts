import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonProductPriceTable,
  getPgPool,
  mapProductPriceRow,
} from "../../../../../lib/pg"

type NumericInput = number | string | null | undefined
type Nullable<T> = T | null | undefined

const normalizeString = (value: Nullable<string>) => (value ?? "").trim()
const normalizeUpper = (value: Nullable<string>) =>
  normalizeString(value).toUpperCase()

const parseBoolean = (value: Nullable<boolean | string>, fallback = false) => {
  if (typeof value === "boolean") {
    return value
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (["true", "1", "yes", "on", "active"].includes(normalized)) {
      return true
    }
    if (["false", "0", "no", "off", "inactive"].includes(normalized)) {
      return false
    }
  }
  return fallback
}

const parsePrice = (
  value: NumericInput,
  { allowNull = false }: { allowNull?: boolean } = {}
) => {
  if (value === null || value === undefined || value === "") {
    return allowNull ? null : undefined
  }
  const normalized =
    typeof value === "string" ? value.replace(/,/g, "").trim() : value
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) {
    return undefined
  }
  return Math.round(parsed * 10000) / 10000
}

const parseDate = (value: Nullable<string>) => {
  const trimmed = normalizeString(value)
  if (!trimmed) {
    return null
  }
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) {
    return undefined
  }
  return date.toISOString()
}

const parseDomainId = (value: Nullable<string | number>) => {
  if (value === null || value === undefined || value === "") {
    return null
  }
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? Math.trunc(value) : undefined
  }
  const normalized = value.trim().toLowerCase()
  if (["null", "global"].includes(normalized)) {
    return null
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined
  }
  return Math.trunc(parsed)
}

type UpdateProductPriceBody = {
  sku?: string
  country_code?: string
  company_code?: string
  brand_id?: string | null
  distribution_channel?: string
  domain_id?: string | number | null
  product_base_price?: NumericInput
  product_special_price?: NumericInput
  is_active?: boolean | string
  promotion_channel?: string | null
  from_date?: string | null
  to_date?: string | null
}

async function findProductPrice(id: number) {
  const { rows } = await getPgPool().query(
    `
      SELECT
        id,
        sku,
        country_code,
        company_code,
        brand_id,
        distribution_channel,
        domain_id,
        product_base_price,
        product_special_price,
        is_active,
        promotion_channel,
        from_date,
        to_date,
        created_at,
        updated_at
      FROM redington_product_price
      WHERE id = $1
    `,
    [id]
  )

  return rows[0]
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonProductPriceTable()

  const id = Number.parseInt(req.params.id, 10)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid product price id" })
  }

  const row = await findProductPrice(id)
  if (!row) {
    return res.status(404).json({ message: "Product price not found" })
  }

  return res.json({ product_price: mapProductPriceRow(row) })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonProductPriceTable()

  const id = Number.parseInt(req.params.id, 10)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid product price id" })
  }

  const existing = await findProductPrice(id)
  if (!existing) {
    return res.status(404).json({ message: "Product price not found" })
  }

  const body = (req.body || {}) as UpdateProductPriceBody

  const updates: string[] = []
  const params: any[] = []

  if (body.sku !== undefined) {
    const sku = normalizeString(body.sku)
    if (!sku) {
      return res.status(400).json({ message: "sku cannot be empty" })
    }
    updates.push(`sku = $${updates.length + 1}`)
    params.push(sku)
  }

  if (body.country_code !== undefined) {
    const countryCode = normalizeUpper(body.country_code)
    if (!countryCode) {
      return res.status(400).json({ message: "country_code cannot be empty" })
    }
    updates.push(`country_code = $${updates.length + 1}`)
    params.push(countryCode)
  }

  if (body.company_code !== undefined) {
    const companyCode = normalizeString(body.company_code)
    if (!companyCode) {
      return res.status(400).json({ message: "company_code cannot be empty" })
    }
    updates.push(`company_code = $${updates.length + 1}`)
    params.push(companyCode)
  }

  if (body.brand_id !== undefined) {
    const brandId = normalizeString(body.brand_id) || null
    updates.push(`brand_id = $${updates.length + 1}`)
    params.push(brandId)
  }

  if (body.distribution_channel !== undefined) {
    const channel = normalizeString(body.distribution_channel)
    if (!channel) {
      return res
        .status(400)
        .json({ message: "distribution_channel cannot be empty" })
    }
    updates.push(`distribution_channel = $${updates.length + 1}`)
    params.push(channel)
  }

  if (body.domain_id !== undefined) {
    const domainId = parseDomainId(body.domain_id)
    if (domainId === undefined) {
      return res.status(400).json({
        message:
          "domain_id must be a positive integer, 'global', 'null', or omitted",
      })
    }
    updates.push(`domain_id = $${updates.length + 1}`)
    params.push(domainId)
  }

  if (body.product_base_price !== undefined) {
    const basePrice = parsePrice(body.product_base_price, {
      allowNull: false,
    })
    if (basePrice === undefined) {
      return res.status(400).json({
        message: "product_base_price must be a valid number",
      })
    }
    updates.push(`product_base_price = $${updates.length + 1}`)
    params.push(basePrice)
  }

  if (body.product_special_price !== undefined) {
    const specialPrice = parsePrice(body.product_special_price, {
      allowNull: true,
    })
    if (specialPrice === undefined) {
      return res.status(400).json({
        message: "product_special_price must be a valid number",
      })
    }
    updates.push(`product_special_price = $${updates.length + 1}`)
    params.push(specialPrice)
  }

  if (body.is_active !== undefined) {
    updates.push(`is_active = $${updates.length + 1}`)
    params.push(parseBoolean(body.is_active, false))
  }

  if (body.promotion_channel !== undefined) {
    const promotion = normalizeString(body.promotion_channel) || null
    updates.push(`promotion_channel = $${updates.length + 1}`)
    params.push(promotion)
  }

  if (body.from_date !== undefined) {
    const fromDate = parseDate(body.from_date)
    if (fromDate === undefined) {
      return res
        .status(400)
        .json({ message: "from_date must be a valid ISO date-time string" })
    }
    updates.push(`from_date = $${updates.length + 1}`)
    params.push(fromDate)
  }

  if (body.to_date !== undefined) {
    const toDate = parseDate(body.to_date)
    if (toDate === undefined) {
      return res
        .status(400)
        .json({ message: "to_date must be a valid ISO date-time string" })
    }
    updates.push(`to_date = $${updates.length + 1}`)
    params.push(toDate)
  }

  if (!updates.length) {
    return res.status(400).json({ message: "No updatable fields provided" })
  }

  params.push(id)

  try {
    await getPgPool().query(
      `
        UPDATE redington_product_price
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE id = $${params.length}
      `,
      params
    )

    const updated = await findProductPrice(id)
    if (!updated) {
      return res.status(404).json({ message: "Product price not found" })
    }

    return res.json({ product_price: mapProductPriceRow(updated) })
  } catch (error: any) {
    if (error?.code === "23505") {
      return res.status(409).json({
        message:
          "A product price with the same sku, company_code, distribution_channel, and domain already exists",
      })
    }

    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Unexpected error updating product price",
    })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonProductPriceTable()

  const id = Number.parseInt(req.params.id, 10)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid product price id" })
  }

  const { rowCount } = await getPgPool().query(
    `DELETE FROM redington_product_price WHERE id = $1`,
    [id]
  )

  if (rowCount === 0) {
    return res.status(404).json({ message: "Product price not found" })
  }

  return res.status(204).send()
}
