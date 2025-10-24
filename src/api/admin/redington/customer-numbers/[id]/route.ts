import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonCustomerNumberTable,
  ensureRedingtonDomainTable,
  findDomainById,
  getPgPool,
  mapCustomerNumberRow,
} from "../../../../../lib/pg"

type UpdateCustomerNumberBody = {
  company_code?: string
  distribution_channel?: string
  brand_id?: string
  domain_id?: number | string
  customer_number?: string
}

const parseId = (value: string) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : undefined
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

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid customer number id" })
  }

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_customer_number
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  )

  if (!rows[0]) {
    return res.status(404).json({ message: "Customer number not found" })
  }

  return res.json({
    customer_number: mapCustomerNumberRow(rows[0]),
  })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  await Promise.all([
    ensureRedingtonCustomerNumberTable(),
    ensureRedingtonDomainTable(),
  ])

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid customer number id" })
  }

  const body = (req.body || {}) as UpdateCustomerNumberBody
  const updates: string[] = []
  const params: any[] = []

  if (body.company_code !== undefined) {
    const company = normalizeString(body.company_code)
    if (!company) {
      return res
        .status(400)
        .json({ message: "company_code cannot be empty" })
    }
    updates.push(`company_code = $${updates.length + 1}`)
    params.push(company)
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

  if (body.brand_id !== undefined) {
    const brand = normalizeString(body.brand_id)
    if (!brand) {
      return res.status(400).json({ message: "brand_id cannot be empty" })
    }
    updates.push(`brand_id = $${updates.length + 1}`)
    params.push(brand)
  }

  if (body.domain_id !== undefined) {
    const domainId = parseNumeric(body.domain_id)
    if (!domainId) {
      return res
        .status(400)
        .json({ message: "domain_id must be a valid number" })
    }

    const domain = await findDomainById(domainId)
    if (!domain) {
      return res
        .status(404)
        .json({ message: `Domain with id ${domainId} not found` })
    }

    updates.push(`domain_id = $${updates.length + 1}`)
    params.push(domainId)
  }

  if (body.customer_number !== undefined) {
    const customer = normalizeString(body.customer_number)
    if (!customer) {
      return res
        .status(400)
        .json({ message: "customer_number cannot be empty" })
    }
    updates.push(`customer_number = $${updates.length + 1}`)
    params.push(customer)
  }

  if (!updates.length) {
    return res.status(400).json({ message: "No updatable fields provided" })
  }

  params.push(id)

  const { rows } = await getPgPool().query(
    `
      UPDATE redington_customer_number
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${params.length}
      RETURNING *
    `,
    params
  )

  if (!rows[0]) {
    return res.status(404).json({ message: "Customer number not found" })
  }

  return res.json({
    customer_number: mapCustomerNumberRow(rows[0]),
  })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCustomerNumberTable()

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid customer number id" })
  }

  const { rowCount } = await getPgPool().query(
    `
      DELETE FROM redington_customer_number
      WHERE id = $1
    `,
    [id]
  )

  if (!rowCount) {
    return res.status(404).json({ message: "Customer number not found" })
  }

  return res.status(204).send()
}
