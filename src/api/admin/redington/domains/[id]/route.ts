import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonDomainTable,
  mapDomainRow,
  getPgPool,
} from "../../../../../lib/pg"

function parseBoolean(value: unknown, fallback: boolean): boolean {
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

async function getDomain(id: number) {
  const { rows } = await getPgPool().query(
    `
      SELECT id, domain_name, is_active, created_at, updated_at
      FROM redington_domain
      WHERE id = $1
    `,
    [id]
  )

  return rows[0] ? mapDomainRow(rows[0]) : null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonDomainTable()

  const id = Number.parseInt(req.params.id, 10)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid domain id" })
  }

  const domain = await getDomain(id)
  if (!domain) {
    return res.status(404).json({ message: "Domain not found" })
  }

  return res.json({ domain })
}

type UpdateDomainBody = {
  domain_name?: string
  is_active?: boolean | string
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonDomainTable()

  const id = Number.parseInt(req.params.id, 10)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid domain id" })
  }

  const body = (req.body || {}) as UpdateDomainBody
  const domainName = body.domain_name?.trim()

  if (domainName !== undefined && domainName.length === 0) {
    return res.status(400).json({
      message: "domain_name cannot be empty",
    })
  }

  const updates: string[] = []
  const params: any[] = []

  if (domainName !== undefined) {
    updates.push(`domain_name = $${updates.length + 1}`)
    params.push(domainName)
  }

  if (body.is_active !== undefined) {
    updates.push(`is_active = $${updates.length + 1}`)
    params.push(parseBoolean(body.is_active, true))
  }

  if (!updates.length) {
    return res.status(400).json({
      message: "No updatable fields provided",
    })
  }

  params.push(id)

  try {
    const { rows } = await getPgPool().query(
      `
        UPDATE redington_domain
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE id = $${params.length}
        RETURNING id, domain_name, is_active, created_at, updated_at
      `,
      params
    )

    if (!rows[0]) {
      return res.status(404).json({ message: "Domain not found" })
    }

    return res.json({
      domain: mapDomainRow(rows[0]),
    })
  } catch (error: any) {
    if (error?.code === "23505") {
      return res.status(409).json({
        message: `Domain "${domainName}" already exists`,
      })
    }

    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Unexpected error updating domain",
    })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonDomainTable()

  const id = Number.parseInt(req.params.id, 10)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid domain id" })
  }

  const { rowCount } = await getPgPool().query(
    `
      DELETE FROM redington_domain
      WHERE id = $1
    `,
    [id]
  )

  if (rowCount === 0) {
    return res.status(404).json({ message: "Domain not found" })
  }

  return res.status(204).send()
}
