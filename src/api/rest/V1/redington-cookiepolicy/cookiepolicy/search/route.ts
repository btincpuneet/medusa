import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonCookiePolicyTable,
  getPgPool,
  mapCookiePolicyRow,
} from "../../../../../../lib/pg"

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

const isTruthy = (value: string | null | undefined) => {
  if (!value) {
    return false
  }
  const normalized = value.trim().toLowerCase()
  return ["1", "true", "yes", "active", "enabled"].includes(normalized)
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  await ensureRedingtonCookiePolicyTable()

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_cookie_policy
      ORDER BY updated_at DESC
    `
  )

  if (!rows.length) {
    return res.json({
      items: [],
      total_count: 0,
      search_criteria: req.query ?? {},
    })
  }

  const mapped = rows.map(mapCookiePolicyRow)

  const activeRows = mapped.filter((row) => isTruthy(row.status ?? undefined))
  const itemsSource = activeRows.length ? activeRows : mapped

  const items = itemsSource.map((row) => ({
    id: row.id,
    uploadpdf: row.document_url,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))

  return res.json({
    items,
    total_count: items.length,
    search_criteria: req.query ?? {},
  })
}
