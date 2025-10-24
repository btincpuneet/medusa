import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonCompanyCodeTable,
  getPgPool,
  mapCompanyCodeRow,
} from "../../../../lib/pg"

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

function normalizeCountryCode(code: string) {
  return code.trim().toUpperCase()
}

function normalizeCompanyCode(code: string) {
  return code.trim()
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCompanyCodeTable()

  const { rows } = await getPgPool().query(
    `
      SELECT id, country_code, company_code, status, created_at, updated_at
      FROM redington_company_code
      ORDER BY created_at DESC
    `
  )

  return res.json({
    company_codes: rows.map(mapCompanyCodeRow),
  })
}

type CreateCompanyCodeBody = {
  country_code?: string
  company_code?: string
  status?: boolean | string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCompanyCodeTable()

  const body = (req.body || {}) as CreateCompanyCodeBody

  const countryCode = normalizeCountryCode(body.country_code ?? "")
  if (!countryCode) {
    return res.status(400).json({
      message: "country_code is required",
    })
  }

  const companyCode = normalizeCompanyCode(body.company_code ?? "")
  if (!companyCode) {
    return res.status(400).json({
      message: "company_code is required",
    })
  }

  const isActive = parseBoolean(body.status, true)

  try {
    const { rows } = await getPgPool().query(
      `
        INSERT INTO redington_company_code (country_code, company_code, status)
        VALUES ($1, $2, $3)
        RETURNING id, country_code, company_code, status, created_at, updated_at
      `,
      [countryCode, companyCode, isActive]
    )

    return res.status(201).json({
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
          : "Unexpected error creating company code",
    })
  }
}
