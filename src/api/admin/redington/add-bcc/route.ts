import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonAddBccTable,
  ensureRedingtonDomainTable,
  findDomainById,
  getPgPool,
  mapAddBccRow,
} from "../../../../lib/pg"

type CreateAddBccBody = {
  domain_id?: number | string
  bcc_emails?: string[] | string | null
}

const normalizeEmails = (value: CreateAddBccBody["bcc_emails"]): string[] => {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter(Boolean)
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await Promise.all([
    ensureRedingtonAddBccTable(),
    ensureRedingtonDomainTable(),
  ])

  const { rows } = await getPgPool().query(
    `
      SELECT
        ab.*,
        d.domain_name
      FROM redington_add_bcc ab
      LEFT JOIN redington_domain d ON d.id = ab.domain_id
      ORDER BY ab.updated_at DESC
    `
  )

  return res.json({
    add_bcc_entries: rows.map((row) => ({
      ...mapAddBccRow(row),
      domain_name:
        typeof row.domain_name === "string" && row.domain_name.length
          ? row.domain_name
          : null,
    })),
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await Promise.all([
    ensureRedingtonAddBccTable(),
    ensureRedingtonDomainTable(),
  ])

  const body = (req.body || {}) as CreateAddBccBody

  const domainIdRaw = body.domain_id
  const domainId =
    typeof domainIdRaw === "string"
      ? Number.parseInt(domainIdRaw, 10)
      : Number(domainIdRaw)

  if (!Number.isFinite(domainId)) {
    return res.status(400).json({
      message: "domain_id must be a valid number",
    })
  }

  const domain = await findDomainById(domainId)
  if (!domain) {
    return res.status(404).json({
      message: `Domain with id ${domainId} not found`,
    })
  }

  const emails = normalizeEmails(body.bcc_emails)
  const serialized = emails.join(",")

  const { rows } = await getPgPool().query(
    `
      INSERT INTO redington_add_bcc (domain_id, bcc_emails)
      VALUES ($1, $2)
      ON CONFLICT (domain_id) DO UPDATE
        SET bcc_emails = EXCLUDED.bcc_emails,
            updated_at = NOW()
      RETURNING *
    `,
    [domainId, serialized]
  )

  const mapped = mapAddBccRow(rows[0])

  return res.status(201).json({
    add_bcc: {
      ...mapped,
      domain_name: domain.domain_name,
    },
  })
}
