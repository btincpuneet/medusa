import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { parse } from "csv-parse/sync"

import {
  ensureRedingtonSubscriptionCodeTable,
  findSubscriptionCodeByCode,
  getPgPool,
  mapSubscriptionCodeRow,
  type SubscriptionCodeRow,
} from "../../../../../lib/pg"

type ImportBody = {
  csv?: string
}

type NormalizedRow = {
  subscription_code: string
  company_code: string
  access_id: string
  first_name: string
  last_name: string
  email: string
  status: boolean
}

const REQUIRED_COLUMNS = [
  "subscription_code",
  "access_id",
  "company_code",
  "first_name",
  "last_name",
  "email",
]

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : ""

const normalizeEmail = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : ""

const sanitizeAccessId = (value: string) =>
  value.replace(/[^0-9.]/g, "")

const parseStatus = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (["0", "false", "no", "disable", "disabled"].includes(normalized)) {
      return false
    }
  }
  if (typeof value === "number") {
    return value !== 0
  }
  return true
}

const normalizeRow = (row: Record<string, any>): { row?: NormalizedRow; error?: string } => {
  const subscriptionCode = normalizeString(row.subscription_code || row.code)
  const companyCode = normalizeString(row.company_code)
  const accessId = sanitizeAccessId(normalizeString(row.access_id))
  const firstName = normalizeString(row.first_name)
  const lastName = normalizeString(row.last_name)
  const email = normalizeEmail(row.email)
  const status = parseStatus(row.status)

  if (!subscriptionCode) {
    return { error: "Subscription Code is missing" }
  }
  if (!companyCode) {
    return { error: "Company Code is missing" }
  }
  if (!accessId) {
    return { error: "Access Id is missing" }
  }
  if (!firstName || !lastName || !email) {
    return { error: "First Name, Last Name, and Email are required" }
  }

  return {
    row: {
      subscription_code: subscriptionCode,
      company_code: companyCode,
      access_id: accessId,
      first_name: firstName,
      last_name: lastName,
      email,
      status,
    },
  }
}

const selectExistingId = async (
  normalized: NormalizedRow
): Promise<number | null> => {
  const client = getPgPool()

  // First try an exact combination match.
  const byCombo = await client.query(
    `
      SELECT id
      FROM redington_subscription_code
      WHERE LOWER(subscription_code) = LOWER($1)
        AND company_code = $2
        AND access_id = $3
      LIMIT 1
    `,
    [normalized.subscription_code, normalized.company_code, normalized.access_id]
  )

  if (byCombo.rows[0]?.id) {
    return Number(byCombo.rows[0].id)
  }

  // Fall back to subscription code uniqueness.
  const byCode = await client.query(
    `
      SELECT id
      FROM redington_subscription_code
      WHERE LOWER(subscription_code) = LOWER($1)
      LIMIT 1
    `,
    [normalized.subscription_code]
  )

  return byCode.rows[0]?.id ? Number(byCode.rows[0].id) : null
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonSubscriptionCodeTable()

  const body = (req.body || {}) as ImportBody
  const csv = typeof body.csv === "string" ? body.csv : ""

  if (!csv.trim()) {
    return res.status(400).json({ message: "csv payload is required" })
  }

  let records: Record<string, any>[] = []

  try {
    records = parse(csv, {
      columns: (header) =>
        header.map((entry: string) =>
          entry.trim().toLowerCase().replace(/\s+/g, "_")
        ),
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, any>[]
  } catch (error: any) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? `Unable to parse CSV: ${error.message}`
          : "Unable to parse CSV content",
    })
  }

  if (!records.length) {
    return res.status(400).json({ message: "CSV contained no data rows" })
  }

  const headerKeys = Object.keys(records[0] || {})
  const missingColumns = REQUIRED_COLUMNS.filter(
    (col) => !headerKeys.includes(col)
  )

  if (missingColumns.length) {
    return res.status(400).json({
      message: `CSV is missing required columns: ${missingColumns.join(", ")}`,
    })
  }

  const errors: string[] = []
  const created: SubscriptionCodeRow[] = []
  const updated: SubscriptionCodeRow[] = []

  for (let index = 0; index < records.length; index++) {
    const parsed = normalizeRow(records[index])
    const rowNumber = index + 2 // account for header row

    if (parsed.error || !parsed.row) {
      const message = parsed.error || "Row is missing required data"
      errors.push(`Row ${rowNumber}: ${message}`)
      continue
    }

    try {
      const existingId = await selectExistingId(parsed.row)

      if (existingId) {
        const { rows: updatedRows } = await getPgPool().query(
          `
            UPDATE redington_subscription_code
            SET
              company_code = $1,
              access_id = $2,
              first_name = $3,
              last_name = $4,
              email = $5,
              status = $6,
              updated_at = NOW()
            WHERE id = $7
            RETURNING *
          `,
          [
            parsed.row.company_code,
            parsed.row.access_id,
            parsed.row.first_name,
            parsed.row.last_name,
            parsed.row.email,
            parsed.row.status,
            existingId,
          ]
        )

        updated.push(mapSubscriptionCodeRow(updatedRows[0]))
      } else {
        const { rows: createdRows } = await getPgPool().query(
          `
            INSERT INTO redington_subscription_code (
              subscription_code,
              company_code,
              access_id,
              first_name,
              last_name,
              email,
              status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (subscription_code) DO NOTHING
            RETURNING *
          `,
          [
            parsed.row.subscription_code,
            parsed.row.company_code,
            parsed.row.access_id,
            parsed.row.first_name,
            parsed.row.last_name,
            parsed.row.email,
            parsed.row.status,
          ]
        )

        if (createdRows[0]) {
          created.push(mapSubscriptionCodeRow(createdRows[0]))
        } else {
          // If conflict occurred because of a race on subscription_code, try updating instead.
          const fallbackExisting = await findSubscriptionCodeByCode(
            parsed.row.subscription_code
          )
          if (fallbackExisting?.id) {
            const { rows: updatedRows } = await getPgPool().query(
              `
                UPDATE redington_subscription_code
                SET
                  company_code = $1,
                  access_id = $2,
                  first_name = $3,
                  last_name = $4,
                  email = $5,
                  status = $6,
                  updated_at = NOW()
                WHERE id = $7
                RETURNING *
              `,
              [
                parsed.row.company_code,
                parsed.row.access_id,
                parsed.row.first_name,
                parsed.row.last_name,
                parsed.row.email,
                parsed.row.status,
                fallbackExisting.id,
              ]
            )

            updated.push(mapSubscriptionCodeRow(updatedRows[0]))
          }
        }
      }
    } catch (error: any) {
      const message =
        error instanceof Error ? error.message : "Unexpected import error"
      errors.push(`Row ${rowNumber}: ${message}`)
    }
  }

  return res.json({
    created: created.length,
    updated: updated.length,
    errors,
    subscription_codes: {
      created,
      updated,
    },
  })
}
