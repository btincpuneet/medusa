import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonHomeVideoTable,
  getPgPool,
  mapHomeVideoRow,
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

const parseStatusFilter = (req: MedusaRequest): boolean | undefined => {
  const value =
    req.query?.["searchCriteria[filter_groups][0][filters][0][value]"] ??
    req.query?.["searchCriteria[filter_groups][0][filters][0][value]".toLowerCase()]

  if (typeof value !== "string") {
    return undefined
  }

  const normalized = value.trim().toLowerCase()

  if (["1", "true", "yes", "active", "enabled"].includes(normalized)) {
    return true
  }

  if (["0", "false", "no", "inactive", "disabled"].includes(normalized)) {
    return false
  }

  return undefined
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  await ensureRedingtonHomeVideoTable()

  const statusFilter = parseStatusFilter(req)

  const { rows } = await getPgPool().query(
    `
      SELECT id, title, url, status, created_at, updated_at
      FROM redington_home_video
      ${statusFilter === undefined ? "" : "WHERE status = $1"}
      ORDER BY created_at DESC
    `,
    statusFilter === undefined ? [] : [statusFilter]
  )

  const items = rows.map((row) => {
    const mapped = mapHomeVideoRow(row)
    return {
      homevideo_id: mapped.id,
      title: mapped.title,
      url: mapped.url,
      status: mapped.status ? "yes" : "no",
      created_at: mapped.created_at,
      updateAt: mapped.updated_at,
    }
  })

  return res.json({
    items,
    total_count: items.length,
    search_criteria: req.query ?? {},
  })
}
