import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonDomainAuthTable,
  ensureRedingtonDomainTable,
  getPgPool,
  mapDomainAuthRow,
} from "../../../../lib/pg"

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

function parseAuthType(value: unknown, fallback = 2): number | null {
  if (value === undefined || value === null) {
    return fallback
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
       ORDER BY a.created_at DESC
    `
  )

  return res.json({
    domain_auth_controls: rows.map(mapDomainAuthRow),
  })
}

type CreateDomainAuthBody = {
  domain_id?: number | string
  auth_type?: number | string
  email_otp?: boolean | string | number
  mobile_otp?: boolean | string | number
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonDomainTable()
  await ensureRedingtonDomainAuthTable()

  const body = (req.body || {}) as CreateDomainAuthBody
  const domainId = Number.parseInt(String(body.domain_id ?? "").trim(), 10)

  if (!Number.isFinite(domainId)) {
    return res.status(400).json({
      message: "domain_id is required",
    })
  }

  const domainExists = await ensureDomainExists(domainId)
  if (!domainExists) {
    return res.status(404).json({
      message: `Domain with id ${domainId} not found`,
    })
  }

  const authType = parseAuthType(body.auth_type, 2)
  if (authType === null) {
    return res.status(400).json({
      message: "auth_type must be 1 (OTP-only) or 2 (Password + OTP)",
    })
  }

  const emailOtp = parseBoolean(body.email_otp, true)
  const mobileOtp = parseBoolean(body.mobile_otp, true)

  try {
    const {
      rows,
    } = await getPgPool().query(
      `
        INSERT INTO redington_domain_auth (domain_id, auth_type, email_otp, mobile_otp)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
      [domainId, authType, emailOtp, mobileOtp]
    )

    const inserted = await loadDomainAuthRecord(rows[0].id)

    return res.status(201).json({
      domain_auth_control: inserted,
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
          : "Unexpected error creating domain authentication settings",
    })
  }
}
