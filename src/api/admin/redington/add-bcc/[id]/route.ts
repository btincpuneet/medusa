import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonAddBccTable,
  ensureRedingtonDomainTable,
  findDomainById,
  getPgPool,
  mapAddBccRow,
} from "../../../../../lib/pg"

type UpdateAddBccBody = {
  domain_id?: number | string
  bcc_emails?: string[] | string | null
}

const normalizeEmails = (value: UpdateAddBccBody["bcc_emails"]): string[] => {
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

const parseId = (value: string) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonAddBccTable()

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid add-bcc id" })
  }

  const { rows } = await getPgPool().query(
    `
      SELECT
        ab.*,
        d.domain_name
      FROM redington_add_bcc ab
      LEFT JOIN redington_domain d ON d.id = ab.domain_id
      WHERE ab.id = $1
      LIMIT 1
    `,
    [id]
  )

  if (!rows[0]) {
    return res.status(404).json({ message: "Add BCC entry not found" })
  }

  return res.json({
    add_bcc: {
      ...mapAddBccRow(rows[0]),
      domain_name:
        typeof rows[0].domain_name === "string" && rows[0].domain_name.length
          ? rows[0].domain_name
          : null,
    },
  })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  await Promise.all([
    ensureRedingtonAddBccTable(),
    ensureRedingtonDomainTable(),
  ])

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid add-bcc id" })
  }

  const body = (req.body || {}) as UpdateAddBccBody
  const updates: string[] = []
  const params: any[] = []

  if (body.domain_id !== undefined) {
    const domainId =
      typeof body.domain_id === "string"
        ? Number.parseInt(body.domain_id, 10)
        : Number(body.domain_id)

    if (!Number.isFinite(domainId)) {
      return res
        .status(400)
        .json({ message: "domain_id must be a valid number" })
    }

    const domain = await findDomainById(domainId)
    if (!domain) {
      return res
        .status(404)
        .json({ message: `Domain with id ${domainId} not found` })
    }

    updates.push(`domain_id = $${updates.length + 1}`)
    params.push(domainId)
  }

  if (body.bcc_emails !== undefined) {
    const emails = normalizeEmails(body.bcc_emails)
    updates.push(`bcc_emails = $${updates.length + 1}`)
    params.push(emails.join(","))
  }

  if (!updates.length) {
    return res.status(400).json({ message: "No updatable fields provided" })
  }

  params.push(id)

  const { rows } = await getPgPool().query(
    `
      UPDATE redington_add_bcc
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${params.length}
      RETURNING *
    `,
    params
  )

  if (!rows[0]) {
    return res.status(404).json({ message: "Add BCC entry not found" })
  }

  const mapped = mapAddBccRow(rows[0])
  const domain = mapped.domain_id ? await findDomainById(mapped.domain_id) : null

  return res.json({
    add_bcc: {
      ...mapped,
      domain_name: domain?.domain_name ?? null,
    },
  })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonAddBccTable()

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid add-bcc id" })
  }

  const { rowCount } = await getPgPool().query(
    `
      DELETE FROM redington_add_bcc
      WHERE id = $1
    `,
    [id]
  )

  if (!rowCount) {
    return res.status(404).json({ message: "Add BCC entry not found" })
  }

  return res.status(204).send()
}
