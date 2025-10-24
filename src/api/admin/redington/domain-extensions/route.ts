import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonDomainExtentionTable,
  getPgPool,
  mapDomainExtentionRow,
} from "../../../../lib/pg"

type Nullable<T> = T | null | undefined

function parseBoolean(value: Nullable<boolean | string>, fallback: boolean) {
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

function normalizeExtentionName(value: string) {
  let normalized = value.trim()

  if (!normalized.length) {
    return ""
  }

  if (!normalized.startsWith(".")) {
    normalized = `.${normalized}`
  }

  return normalized.toLowerCase()
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonDomainExtentionTable()

  const { rows } = await getPgPool().query(
    `
      SELECT id, domain_extention_name, status, created_at, updated_at
      FROM redington_domain_extention
      ORDER BY created_at DESC
    `
  )

  return res.json({
    domain_extentions: rows.map(mapDomainExtentionRow),
  })
}

type CreateDomainExtentionBody = {
  domain_extention_name?: string
  status?: boolean | string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonDomainExtentionTable()

  const body = (req.body || {}) as CreateDomainExtentionBody
  const rawName = body.domain_extention_name ?? ""
  const normalizedName = normalizeExtentionName(rawName)

  if (!normalizedName) {
    return res.status(400).json({
      message: "domain_extention_name is required",
    })
  }

  const isActive = parseBoolean(body.status, true)

  try {
    const { rows } = await getPgPool().query(
      `
        INSERT INTO redington_domain_extention (domain_extention_name, status)
        VALUES ($1, $2)
        RETURNING id, domain_extention_name, status, created_at, updated_at
      `,
      [normalizedName, isActive]
    )

    return res.status(201).json({
      domain_extention: mapDomainExtentionRow(rows[0]),
    })
  } catch (error: any) {
    if (error?.code === "23505") {
      return res.status(409).json({
        message: `Domain extention "${normalizedName}" already exists`,
      })
    }

    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Unexpected error creating domain extention",
    })
  }
}
