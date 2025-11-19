import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonDomainAuthTable,
  ensureRedingtonDomainTable,
  getPgPool,
  listActiveDomainExtensionNames,
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

const parseBoolean = (value: any, fallback: boolean): boolean => {
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

const DEFAULT_AUTH_TYPE = (() => {
  const parsed = Number.parseInt(
    process.env.REDINGTON_DEFAULT_AUTH_TYPE ?? "",
    10
  )
  return parsed === 1 ? 1 : 2
})()

const DEFAULT_EMAIL_OTP = parseBoolean(
  process.env.REDINGTON_DEFAULT_EMAIL_OTP ?? "true",
  true
)
const DEFAULT_MOBILE_OTP = parseBoolean(
  process.env.REDINGTON_DEFAULT_MOBILE_OTP ?? "false",
  false
)

const buildBaseResponse = (overrides: Record<string, any>) => ({
  success: true,
  status: true,
  auth_type: String(DEFAULT_AUTH_TYPE),
  email_otp: DEFAULT_EMAIL_OTP,
  mobile_otp: DEFAULT_MOBILE_OTP,
  ...overrides,
})

const buildDomainNotFoundResponse = (message: string) =>
  buildBaseResponse({
    success: false,
    status: false,
    message,
  })

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

const buildDomainLookupValues = (
  domain: string,
  extensions: string[]
): string[] => {
  const normalized = domain.trim().toLowerCase()
  if (!normalized) {
    return []
  }

  const normalizedExtensions = extensions
    .map((entry) => (entry || "").trim().toLowerCase())
    .filter(Boolean)
    .map((entry) => (entry.startsWith(".") ? entry : `.${entry}`))
    .sort((a, b) => b.length - a.length)

  const values = new Set<string>()
  values.add(normalized)

  const firstDot = normalized.indexOf(".")
  if (firstDot !== -1) {
    values.add(normalized.slice(0, firstDot))
  }

  for (const ext of normalizedExtensions) {
    if (!normalized.endsWith(ext)) {
      continue
    }

    const withoutExt = normalized
      .slice(0, normalized.length - ext.length)
      .replace(/\.+$/, "")

    if (!withoutExt) {
      continue
    }

    values.add(withoutExt)

    const lastDot = withoutExt.lastIndexOf(".")
    if (lastDot !== -1) {
      values.add(withoutExt.slice(lastDot + 1))
      values.add(withoutExt.slice(0, lastDot))
    }
  }

  return Array.from(values).filter(Boolean)
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

  const extensions = await listActiveDomainExtensionNames()
  const lookupValues = buildDomainLookupValues(domain, extensions)
  if (!lookupValues.length) {
    return res.status(400).json({
      message: "A valid domain value is required.",
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
      WHERE LOWER(d.domain_name) = ANY($1::text[])
      ORDER BY array_position($1::text[], LOWER(d.domain_name))
      LIMIT 1
    `,
    [lookupValues]
  )

  if (!rows[0]) {
    return res.json(
      buildDomainNotFoundResponse(`Domain ${domain} is not registered.`)
    )
  }

  const record = rows[0]

  if (record.is_active === false) {
    return res.json(
      buildDomainNotFoundResponse(`Domain ${domain} is currently disabled.`)
    )
  }

  const authType = record.auth_type ?? 2

  return res.json(
    buildBaseResponse({
      success: true,
      message: `Domain ${domain} authentication policy loaded.`,
      domain_name: record.domain_name,
      auth_type: String(authType),
      email_otp: Boolean(record.email_otp ?? true),
      mobile_otp: Boolean(record.mobile_otp ?? false),
    })
  )
}
