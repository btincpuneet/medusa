import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonCmsPageTable,
  getPgPool,
  mapCmsPageRow,
} from "../../../../lib/pg"

const parseNumeric = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim().length) {
    const parsed = Number.parseInt(value.trim(), 10)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

const parseBoolean = (value: unknown, fallback: boolean) => {
  if (value === undefined) {
    return fallback
  }

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
  await ensureRedingtonCmsPageTable()

  const slug = String(req.query.slug ?? "").trim().toLowerCase()
  if (!slug) {
    return res.status(400).json({ message: "slug query parameter is required" })
  }

  const domainId = parseNumeric(req.query.domain_id ?? req.query.domainId)
  const accessId =
    typeof req.query.access_id === "string"
      ? req.query.access_id.trim()
      : typeof req.query.accessId === "string"
      ? req.query.accessId.trim()
      : undefined
  const countryCode =
    typeof req.query.country_code === "string"
      ? req.query.country_code.trim()
      : typeof req.query.countryCode === "string"
      ? req.query.countryCode.trim()
      : undefined

  const onlyActive = parseBoolean(req.query.only_active, true)

  const conditions = [`LOWER(slug) = $1`]
  const params: any[] = [slug]

  if (domainId) {
    conditions.push(`domain_id = $${conditions.length + 1}`)
    params.push(domainId)
  }

  if (accessId) {
    conditions.push(`access_id = $${conditions.length + 1}`)
    params.push(accessId)
  }

  if (countryCode) {
    conditions.push(`country_code = $${conditions.length + 1}`)
    params.push(countryCode)
  }

  if (onlyActive) {
    conditions.push(`is_active = TRUE`)
  }

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_cms_page
      WHERE ${conditions.join(" AND ")}
      ORDER BY updated_at DESC
      LIMIT 1
    `,
    params
  )

  if (!rows[0]) {
    return res.status(404).json({
      message: "CMS page not found for the provided filters.",
    })
  }

  return res.json({
    cms_page: mapCmsPageRow(rows[0]),
  })
}
