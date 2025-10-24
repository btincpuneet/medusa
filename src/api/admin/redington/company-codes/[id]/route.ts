import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonCompanyCodeTable,
  getPgPool,
  mapCompanyCodeRow,
} from "../../../../../lib/pg"

type Nullable<T> = T | null | undefined

const truthyValues = ["true", "1", "yes", "on"]
const falsyValues = ["false", "0", "no", "off"]

function parseBoolean(value: Nullable<boolean | string>, fallback: boolean) {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (truthyValues.includes(normalized)) {
      return true
    }
    if (falsyValues.includes(normalized)) {
      return false
    }
  }

  return fallback
}

function normalizeCountryCode(code: string | undefined) {
  if (typeof code !== "string") {
    return undefined
  }

  const normalized = code.trim().toUpperCase()
  return normalized.length ? normalized : ""
}

function normalizeCompanyCode(code: string | undefined) {
  if (typeof code !== "string") {
    return undefined
  }

  const normalized = code.trim()
  return normalized.length ? normalized : ""
}

async function getCompanyCodeById(id: number) {
  const { rows } = await getPgPool().query(
    `
      SELECT id, country_code, company_code, status, created_at, updated_at
      FROM redington_company_code
      WHERE id = $1
    `,
    [id]
  )

  return rows[0] ? mapCompanyCodeRow(rows[0]) : null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCompanyCodeTable()

  const id = Number.parseInt(req.params.id, 10)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid company code id" })
  }

  const record = await getCompanyCodeById(id)
  if (!record) {
    return res.status(404).json({ message: "Company code not found" })
  }

  return res.json({ company_code: record })
}

type UpdateCompanyCodeBody = {
  country_code?: string
  company_code?: string
  status?: boolean | string
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCompanyCodeTable()

  const id = Number.parseInt(req.params.id, 10)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid company code id" })
  }

  const body = (req.body || {}) as UpdateCompanyCodeBody

  const countryCode = normalizeCountryCode(body.country_code)
  if (countryCode === "") {
    return res.status(400).json({
      message: "country_code cannot be empty",
    })
  }

  const companyCode = normalizeCompanyCode(body.company_code)
  if (companyCode === "") {
    return res.status(400).json({
      message: "company_code cannot be empty",
    })
  }

  const updates: string[] = []
  const params: any[] = []

  if (countryCode !== undefined) {
    updates.push(`country_code = $${updates.length + 1}`)
    params.push(countryCode)
  }

  if (companyCode !== undefined) {
    updates.push(`company_code = $${updates.length + 1}`)
    params.push(companyCode)
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
        UPDATE redington_company_code
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE id = $${params.length}
        RETURNING id, country_code, company_code, status, created_at, updated_at
      `,
      params
    )

    if (!rows[0]) {
      return res.status(404).json({ message: "Company code not found" })
    }

    return res.json({
      company_code: mapCompanyCodeRow(rows[0]),
    })
  } catch (error: any) {
    if (error?.code === "23505") {
      return res.status(409).json({
        message: `Country code "${countryCode}" already exists`,
      })
    }

    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Unexpected error updating company code",
    })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCompanyCodeTable()

  const id = Number.parseInt(req.params.id, 10)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid company code id" })
  }

  const { rowCount } = await getPgPool().query(
    `
      DELETE FROM redington_company_code
      WHERE id = $1
    `,
    [id]
  )

  if (rowCount === 0) {
    return res.status(404).json({ message: "Company code not found" })
  }

  return res.status(204).send()
}
