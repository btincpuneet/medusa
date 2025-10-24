import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonDomainTable,
  mapDomainRow,
  getPgPool,
} from "../../../../lib/pg"

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

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonDomainTable()

  const { rows } = await getPgPool().query(
    `
      SELECT id, domain_name, is_active, created_at, updated_at
      FROM redington_domain
      ORDER BY created_at DESC
    `
  )

  return res.json({
    domains: rows.map(mapDomainRow),
  })
}

type CreateDomainBody = {
  domain_name?: string
  is_active?: boolean | string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonDomainTable()

  const body = (req.body || {}) as CreateDomainBody
  const domainName = (body.domain_name || "").trim()

  if (!domainName) {
    return res.status(400).json({
      message: "domain_name is required",
    })
  }

  const isActive = parseBoolean(body.is_active, true)

  try {
    const { rows } = await getPgPool().query(
      `
        INSERT INTO redington_domain (domain_name, is_active)
        VALUES ($1, $2)
        RETURNING id, domain_name, is_active, created_at, updated_at
      `,
      [domainName, isActive]
    )

    return res.status(201).json({
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
          : "Unexpected error creating domain",
    })
  }
}
