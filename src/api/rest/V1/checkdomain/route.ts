import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonDomainAuthTable,
  ensureRedingtonDomainTable,
  getPgPool,
} from "../../../../lib/pg"

const setCors = (req: MedusaRequest, res: MedusaResponse) => {
  const origin = req.headers.origin
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin)
    res.header("Vary", "Origin")
  } else {
    res.header("Access-Control-Allow-Origin", "*")
  }

  res.header(
    "Access-Control-Allow-Headers",
    req.headers["access-control-request-headers"] ||
      "Content-Type, Authorization"
  )
  res.header("Access-Control-Allow-Methods", "POST,OPTIONS")
  res.header("Access-Control-Allow-Credentials", "true")
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

type CheckDomainRequest = {
  email?: string
  domain?: string
}

const extractDomain = (body: CheckDomainRequest): string | null => {
  if (body.domain) {
    const normalized = body.domain.trim().toLowerCase()
    return normalized.length ? normalized : null
  }

  const email = (body.email || "").trim().toLowerCase()
  const atIndex = email.lastIndexOf("@")
  if (atIndex === -1 || atIndex === email.length - 1) {
    return null
  }

  return email.slice(atIndex + 1)
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  await ensureRedingtonDomainTable()
  await ensureRedingtonDomainAuthTable()

  const body = (req.body || {}) as CheckDomainRequest
  const domain = extractDomain(body)

  if (!domain) {
    return res.status(400).json({
      message: "A valid email or domain value is required.",
    })
  }

  const { rows } = await getPgPool().query(
    `
      SELECT
        d.id,
        d.domain_name,
        d.is_active,
        da.auth_type,
        da.email_otp,
        da.mobile_otp
      FROM redington_domain d
      LEFT JOIN redington_domain_auth da ON da.domain_id = d.id
      WHERE LOWER(d.domain_name) = LOWER($1)
      LIMIT 1
    `,
    [domain]
  )

  if (!rows[0]) {
    return res.json({
      success: false,
      message: `Domain ${domain} is not registered.`,
    })
  }

  const record = rows[0]

  if (record.is_active === false) {
    return res.json({
      success: false,
      message: `Domain ${domain} is currently disabled.`,
    })
  }

  const authType = record.auth_type ?? 2

  return res.json({
    success: true,
    domain_name: record.domain_name,
    auth_type: String(authType),
    email_otp: Boolean(record.email_otp ?? true),
    mobile_otp: Boolean(record.mobile_otp ?? false),
  })
}
