import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonDomainOutOfStockTable,
  ensureRedingtonDomainTable,
  findDomainById,
  getPgPool,
  mapDomainOutOfStockRow,
} from "../../../../lib/pg"

type CreateOutOfStockBody = {
  domain_id?: number | string
  status?: boolean | string
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

const parseBoolean = (value: unknown, fallback: boolean) => {
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

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonDomainOutOfStockTable()

  const { rows } = await getPgPool().query(
    `
      SELECT dos.*, d.domain_name
      FROM redington_domain_out_of_stock dos
      LEFT JOIN redington_domain d ON d.id = dos.domain_id
      ORDER BY dos.updated_at DESC
    `
  )

  return res.json({
    domain_out_of_stock: rows.map((row) => ({
      ...mapDomainOutOfStockRow(row),
      domain_name:
        typeof row.domain_name === "string" && row.domain_name.length
          ? row.domain_name
          : null,
    })),
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await Promise.all([
    ensureRedingtonDomainOutOfStockTable(),
    ensureRedingtonDomainTable(),
  ])

  const body = (req.body || {}) as CreateOutOfStockBody

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

  const status = parseBoolean(body.status, false)

  const { rows } = await getPgPool().query(
    `
      INSERT INTO redington_domain_out_of_stock (domain_id, status)
      VALUES ($1, $2)
      ON CONFLICT (domain_id) DO UPDATE
        SET status = EXCLUDED.status,
            updated_at = NOW()
      RETURNING *
    `,
    [domainId, status]
  )

  return res.status(201).json({
    domain_out_of_stock: {
      ...mapDomainOutOfStockRow(rows[0]),
      domain_name: domain.domain_name,
    },
  })
}
