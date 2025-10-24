import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonDomainOutOfStockTable,
  ensureRedingtonDomainTable,
  findDomainById,
  getPgPool,
  mapDomainOutOfStockRow,
} from "../../../../../lib/pg"

type UpdateOutOfStockBody = {
  domain_id?: number | string
  status?: boolean | string
}

const parseId = (value: string) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

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

const parseBoolean = (value: unknown) => {
  if (value === undefined) {
    return undefined
  }
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
  return undefined
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonDomainOutOfStockTable()

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid out-of-stock id" })
  }

  const { rows } = await getPgPool().query(
    `
      SELECT dos.*, d.domain_name
      FROM redington_domain_out_of_stock dos
      LEFT JOIN redington_domain d ON d.id = dos.domain_id
      WHERE dos.id = $1
      LIMIT 1
    `,
    [id]
  )

  if (!rows[0]) {
    return res.status(404).json({ message: "Out-of-stock entry not found" })
  }

  return res.json({
    domain_out_of_stock: {
      ...mapDomainOutOfStockRow(rows[0]),
      domain_name:
        typeof rows[0].domain_name === "string" && rows[0].domain_name.length
          ? rows[0].domain_name
          : null,
    },
  })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  await Promise.all([
    ensureRedingtonDomainOutOfStockTable(),
    ensureRedingtonDomainTable(),
  ])

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid out-of-stock id" })
  }

  const body = (req.body || {}) as UpdateOutOfStockBody
  const updates: string[] = []
  const params: any[] = []

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

  const status = parseBoolean(body.status)
  if (status !== undefined) {
    updates.push(`status = $${updates.length + 1}`)
    params.push(status)
  }

  if (!updates.length) {
    return res.status(400).json({ message: "No updatable fields provided" })
  }

  params.push(id)

  const { rows } = await getPgPool().query(
    `
      UPDATE redington_domain_out_of_stock
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${params.length}
      RETURNING *
    `,
    params
  )

  if (!rows[0]) {
    return res.status(404).json({ message: "Out-of-stock entry not found" })
  }

  const domain =
    rows[0].domain_id !== null ? await findDomainById(Number(rows[0].domain_id)) : null

  return res.json({
    domain_out_of_stock: {
      ...mapDomainOutOfStockRow(rows[0]),
      domain_name: domain?.domain_name ?? null,
    },
  })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonDomainOutOfStockTable()

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid out-of-stock id" })
  }

  const { rowCount } = await getPgPool().query(
    `
      DELETE FROM redington_domain_out_of_stock
      WHERE id = $1
    `,
    [id]
  )

  if (!rowCount) {
    return res.status(404).json({ message: "Out-of-stock entry not found" })
  }

  return res.status(204).send()
}
