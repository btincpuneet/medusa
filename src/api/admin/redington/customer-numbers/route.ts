import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonCustomerNumberTable,
  ensureRedingtonDomainTable,
  findDomainById,
  getPgPool,
  mapCustomerNumberRow,
} from "../../../../lib/pg"

type CreateCustomerNumberBody = {
  company_code?: string
  distribution_channel?: string
  brand_id?: string
  domain_id?: number | string
  customer_number?: string
}

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : ""

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
  await ensureRedingtonCustomerNumberTable()

  const clauses: string[] = []
  const params: any[] = []

  if (req.query.company_code) {
    clauses.push(`company_code = $${clauses.length + 1}`)
    params.push(String(req.query.company_code).trim())
  }

  if (req.query.distribution_channel) {
    clauses.push(`distribution_channel = $${clauses.length + 1}`)
    params.push(String(req.query.distribution_channel).trim())
  }

  if (req.query.brand_id) {
    clauses.push(`brand_id = $${clauses.length + 1}`)
    params.push(String(req.query.brand_id).trim())
  }

  const domainId = parseNumeric(req.query.domain_id ?? req.query.domainId)
  if (domainId) {
    clauses.push(`domain_id = $${clauses.length + 1}`)
    params.push(domainId)
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_customer_number
      ${whereClause}
      ORDER BY updated_at DESC
    `,
    params
  )

  return res.json({
    customer_numbers: rows.map(mapCustomerNumberRow),
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await Promise.all([
    ensureRedingtonCustomerNumberTable(),
    ensureRedingtonDomainTable(),
  ])

  const body = (req.body || {}) as CreateCustomerNumberBody

  const companyCode = normalizeString(body.company_code)
  if (!companyCode) {
    return res.status(400).json({ message: "company_code is required" })
  }

  const distribution = normalizeString(body.distribution_channel)
  if (!distribution) {
    return res
      .status(400)
      .json({ message: "distribution_channel is required" })
  }

  const brandId = normalizeString(body.brand_id)
  if (!brandId) {
    return res.status(400).json({ message: "brand_id is required" })
  }

  const domainId = parseNumeric(body.domain_id)
  if (!domainId) {
    return res.status(400).json({ message: "domain_id is required" })
  }

  const domain = await findDomainById(domainId)
  if (!domain) {
    return res.status(404).json({
      message: `Domain with id ${domainId} not found`,
    })
  }

  const customerNumber = normalizeString(body.customer_number)
  if (!customerNumber) {
    return res.status(400).json({ message: "customer_number is required" })
  }

  const { rows } = await getPgPool().query(
    `
      INSERT INTO redington_customer_number (
        company_code,
        distribution_channel,
        brand_id,
        domain_id,
        customer_number
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [companyCode, distribution, brandId, domainId, customerNumber]
  )

  return res.status(201).json({
    customer_number: mapCustomerNumberRow(rows[0]),
  })
}
