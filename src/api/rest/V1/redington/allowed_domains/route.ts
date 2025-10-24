import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { redingtonConfig } from "../../../../../modules/redington-config"
import {
  ensureRedingtonDomainTable,
  getPgPool,
} from "../../../../../lib/pg"

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
  res.header("Access-Control-Allow-Methods", "GET,OPTIONS")
  res.header("Access-Control-Allow-Credentials", "true")
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

const normalize = (value: string): string | null => {
  if (!value) {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const configDomains =
    redingtonConfig.guestUsers.allowedDomains?.map((item) => item.trim()) ?? []

  await ensureRedingtonDomainTable()

  const { rows } = await getPgPool().query(
    `
      SELECT domain_name, is_active
      FROM redington_domain
    `
  )

  const dbDomains = rows
    .map((row) =>
      typeof row.domain_name === "string" ? row.domain_name.trim() : ""
    )
    .filter(Boolean)

  const merged = new Set<string>()
  configDomains
    .map((entry) => normalize(entry)?.toLowerCase())
    .filter(Boolean)
    .forEach((entry) => merged.add(entry!))
  dbDomains
    .map((entry) => normalize(entry)?.toLowerCase())
    .filter(Boolean)
    .forEach((entry) => merged.add(entry!))

  const domains = Array.from(merged).sort()

  return res.json([
    {
      status: "success",
      message: domains.length
        ? "Allowed domains retrieved successfully."
        : "No allowed domains configured.",
      data: domains,
      sources: {
        config: configDomains,
        database: dbDomains,
      },
    },
  ])
}
