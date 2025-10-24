import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonProductPriceTable,
  getPgPool,
  mapProductPriceRow,
} from "../../../../lib/pg"

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

const clampLimit = (value: NumericInput, fallback: number) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return Math.min(Math.trunc(parsed), 500)
}

const clampOffset = (value: NumericInput) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }
  return Math.trunc(parsed)
}

type ProductPriceQuery = {
  sku?: string
  country_code?: string
  company_code?: string
  distribution_channel?: string
  brand_id?: string
  domain_id?: string
  is_active?: string
  limit?: string
  offset?: string
}

type CreateProductPriceBody = {
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

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonProductPriceTable()

  const query = (req.query || {}) as ProductPriceQuery

  const conditions: string[] = []
  const params: any[] = []

  const sku = normalizeString(query.sku)
  if (sku) {
    conditions.push(`LOWER(sku) LIKE $${params.length + 1}`)
    params.push(`%${sku.toLowerCase()}%`)
  }

  const countryCode = normalizeUpper(query.country_code)
  if (countryCode) {
    conditions.push(`country_code = $${params.length + 1}`)
    params.push(countryCode)
  }

  const companyCode = normalizeString(query.company_code)
  if (companyCode) {
    conditions.push(`company_code = $${params.length + 1}`)
    params.push(companyCode)
  }

  const distributionChannel = normalizeString(query.distribution_channel)
  if (distributionChannel) {
    conditions.push(`distribution_channel = $${params.length + 1}`)
    params.push(distributionChannel)
  }

  const brandId = normalizeString(query.brand_id)
  if (brandId) {
    conditions.push(`brand_id = $${params.length + 1}`)
    params.push(brandId)
  }

  const domainParam = query.domain_id
  if (domainParam !== undefined) {
    if (domainParam === "" || domainParam === null) {
      // ignore
    } else if (["global", "null"].includes(domainParam.toLowerCase())) {
      conditions.push(`domain_id IS NULL`)
    } else {
      const parsedDomain = parseDomainId(domainParam)
      if (parsedDomain === undefined) {
        return res.status(400).json({
          message:
            "domain_id must be a positive integer, 'global', 'null', or omitted",
        })
      }
      conditions.push(`domain_id = $${params.length + 1}`)
      params.push(parsedDomain)
    }
  }

  const isActiveParam = query.is_active?.trim().toLowerCase()
  if (isActiveParam && !["all", ""].includes(isActiveParam)) {
    conditions.push(`is_active = $${params.length + 1}`)
    params.push(parseBoolean(isActiveParam, false))
  }

  const limit = clampLimit(query.limit, 100)
  const offset = clampOffset(query.offset)

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : ""

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
        updated_at,
        COUNT(*) OVER() AS total_count
      FROM redington_product_price
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `,
    [...params, limit, offset]
  )

  const count =
    rows.length && rows[0].total_count !== undefined
      ? Number(rows[0].total_count)
      : 0

  return res.json({
    product_prices: rows.map(mapProductPriceRow),
    count,
    limit,
    offset,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonProductPriceTable()

  const body = (req.body || {}) as CreateProductPriceBody

  const sku = normalizeString(body.sku)
  if (!sku) {
    return res.status(400).json({ message: "sku is required" })
  }

  const countryCode = normalizeUpper(body.country_code)
  if (!countryCode) {
    return res.status(400).json({ message: "country_code is required" })
  }

  const companyCode = normalizeString(body.company_code)
  if (!companyCode) {
    return res.status(400).json({ message: "company_code is required" })
  }

  const distributionChannel = normalizeString(body.distribution_channel)
  if (!distributionChannel) {
    return res
      .status(400)
      .json({ message: "distribution_channel is required" })
  }

  const basePrice = parsePrice(body.product_base_price, { allowNull: false })
  if (basePrice === undefined) {
    return res.status(400).json({
      message: "product_base_price must be a valid number",
    })
  }

  const specialPrice = parsePrice(body.product_special_price, {
    allowNull: true,
  })
  if (specialPrice === undefined) {
    return res.status(400).json({
      message: "product_special_price must be a valid number",
    })
  }

  const domainId = parseDomainId(body.domain_id ?? null)
  if (domainId === undefined) {
    return res.status(400).json({
      message:
        "domain_id must be a positive integer, 'global', 'null', or omitted",
    })
  }

  const brandId = normalizeString(body.brand_id) || null
  const promotionChannel = normalizeString(body.promotion_channel) || null
  const isActive = parseBoolean(body.is_active, false)

  const fromDate = parseDate(body.from_date)
  if (fromDate === undefined) {
    return res
      .status(400)
      .json({ message: "from_date must be a valid ISO date-time string" })
  }

  const toDate = parseDate(body.to_date)
  if (toDate === undefined) {
    return res
      .status(400)
      .json({ message: "to_date must be a valid ISO date-time string" })
  }

  try {
    const { rows } = await getPgPool().query(
      `
        INSERT INTO redington_product_price (
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
          to_date
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING
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
      `,
      [
        sku,
        countryCode,
        companyCode,
        brandId,
        distributionChannel,
        domainId,
        basePrice,
        specialPrice,
        isActive,
        promotionChannel,
        fromDate,
        toDate,
      ]
    )

    return res.status(201).json({
      product_price: mapProductPriceRow(rows[0]),
    })
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
          : "Unexpected error creating product price",
    })
  }
}
