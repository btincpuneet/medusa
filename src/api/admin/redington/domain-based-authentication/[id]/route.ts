import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonDomainAuthTable,
  ensureRedingtonDomainTable,
  getPgPool,
  mapDomainAuthRow,
} from "../../../../../lib/pg"

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "number") {
    return value !== 0
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

function parseAuthType(value: unknown): number | null {
  if (value === undefined || value === null) {
    return null
  }

  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value).trim(), 10)

  if (!Number.isFinite(parsed)) {
    return null
  }

  if (parsed === 1 || parsed === 2) {
    return parsed
  }

  return null
}

async function ensureDomainExists(domainId: number) {
  const { rows } = await getPgPool().query(
    `
      SELECT id
      FROM redington_domain
      WHERE id = $1
    `,
    [domainId]
  )

  return rows[0] ? rows[0].id : null
}

async function loadDomainAuthRecord(id: number) {
  const { rows } = await getPgPool().query(
    `
      SELECT a.id,
             a.domain_id,
             a.auth_type,
             a.email_otp,
             a.mobile_otp,
             a.created_at,
             a.updated_at,
             d.domain_name
        FROM redington_domain_auth a
        LEFT JOIN redington_domain d ON d.id = a.domain_id
       WHERE a.id = $1
    `,
    [id]
  )

  return rows[0] ? mapDomainAuthRow(rows[0]) : null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonDomainTable()
  await ensureRedingtonDomainAuthTable()

  const id = Number.parseInt(req.params.id, 10)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid authentication id" })
  }

  const record = await loadDomainAuthRecord(id)
  if (!record) {
    return res.status(404).json({ message: "Authentication settings not found" })
  }

  return res.json({ domain_auth_control: record })
}

type UpdateDomainAuthBody = {
  domain_id?: number | string
  auth_type?: number | string
  email_otp?: boolean | string | number
  mobile_otp?: boolean | string | number
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonDomainTable()
  await ensureRedingtonDomainAuthTable()

  const id = Number.parseInt(req.params.id, 10)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid authentication id" })
  }

  const body = (req.body || {}) as UpdateDomainAuthBody
  const updates: string[] = []
  const params: any[] = []

  if (body.domain_id !== undefined) {
    const domainId = Number.parseInt(String(body.domain_id).trim(), 10)
    if (!Number.isFinite(domainId)) {
      return res.status(400).json({
        message: "domain_id must be a valid number",
      })
    }

    const domainExists = await ensureDomainExists(domainId)
    if (!domainExists) {
      return res.status(404).json({
        message: `Domain with id ${domainId} not found`,
      })
    }

    updates.push(`domain_id = $${updates.length + 1}`)
    params.push(domainId)
  }

  if (body.auth_type !== undefined) {
    const authType = parseAuthType(body.auth_type)
    if (authType === null) {
      return res.status(400).json({
        message: "auth_type must be 1 (OTP-only) or 2 (Password + OTP)",
      })
    }
    updates.push(`auth_type = $${updates.length + 1}`)
    params.push(authType)
  }

  if (body.email_otp !== undefined) {
    updates.push(`email_otp = $${updates.length + 1}`)
    params.push(parseBoolean(body.email_otp, true))
  }

  if (body.mobile_otp !== undefined) {
    updates.push(`mobile_otp = $${updates.length + 1}`)
    params.push(parseBoolean(body.mobile_otp, true))
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
        UPDATE redington_domain_auth
           SET ${updates.join(", ")}, updated_at = NOW()
         WHERE id = $${params.length}
         RETURNING id
      `,
      params
    )

    if (!rows[0]) {
      return res.status(404).json({
        message: "Authentication settings not found",
      })
    }

    const record = await loadDomainAuthRecord(rows[0].id)

    return res.json({
      domain_auth_control: record,
    })
  } catch (error: any) {
    if (error?.code === "23505") {
      return res.status(409).json({
        message: "Authentication settings already exist for this domain.",
      })
    }

    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Unexpected error updating authentication settings",
    })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonDomainTable()
  await ensureRedingtonDomainAuthTable()

  const id = Number.parseInt(req.params.id, 10)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid authentication id" })
  }

  const { rowCount } = await getPgPool().query(
    `
      DELETE FROM redington_domain_auth
      WHERE id = $1
    `,
    [id]
  )

  if (rowCount === 0) {
    return res.status(404).json({ message: "Authentication settings not found" })
  }

  return res.status(204).send()
}
