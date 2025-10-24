import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonDomainExtentionTable,
  getPgPool,
  mapDomainExtentionRow,
} from "../../../../../lib/pg"

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

function normalizeExtentionName(value: string | undefined) {
  if (!value) {
    return undefined
  }

  let normalized = value.trim()

  if (!normalized.length) {
    return ""
  }

  if (!normalized.startsWith(".")) {
    normalized = `.${normalized}`
  }

  return normalized.toLowerCase()
}

async function findById(id: number) {
  const { rows } = await getPgPool().query(
    `
      SELECT id, domain_extention_name, status, created_at, updated_at
      FROM redington_domain_extention
      WHERE id = $1
    `,
    [id]
  )

  return rows[0] ? mapDomainExtentionRow(rows[0]) : null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonDomainExtentionTable()

  const id = Number.parseInt(req.params.id, 10)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid domain extention id" })
  }

  const record = await findById(id)
  if (!record) {
    return res.status(404).json({ message: "Domain extention not found" })
  }

  return res.json({ domain_extention: record })
}

type UpdateDomainExtentionBody = {
  domain_extention_name?: string
  status?: boolean | string
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonDomainExtentionTable()

  const id = Number.parseInt(req.params.id, 10)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid domain extention id" })
  }

  const body = (req.body || {}) as UpdateDomainExtentionBody
  const normalizedName = normalizeExtentionName(body.domain_extention_name)

  if (normalizedName === "") {
    return res.status(400).json({
      message: "domain_extention_name cannot be empty",
    })
  }

  const updates: string[] = []
  const params: any[] = []

  if (normalizedName !== undefined) {
    updates.push(`domain_extention_name = $${updates.length + 1}`)
    params.push(normalizedName)
  }

  if (body.status !== undefined) {
    updates.push(`status = $${updates.length + 1}`)
    params.push(parseBoolean(body.status, true))
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
        UPDATE redington_domain_extention
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE id = $${params.length}
        RETURNING id, domain_extention_name, status, created_at, updated_at
      `,
      params
    )

    if (!rows[0]) {
      return res.status(404).json({ message: "Domain extention not found" })
    }

    return res.json({
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
          : "Unexpected error updating domain extention",
    })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonDomainExtentionTable()

  const id = Number.parseInt(req.params.id, 10)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid domain extention id" })
  }

  const { rowCount } = await getPgPool().query(
    `
      DELETE FROM redington_domain_extention
      WHERE id = $1
    `,
    [id]
  )

  if (rowCount === 0) {
    return res.status(404).json({ message: "Domain extention not found" })
  }

  return res.status(204).send()
}
