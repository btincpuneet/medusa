import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonCookiePolicyTable,
  getPgPool,
  mapCookiePolicyRow,
} from "../../../../../lib/pg"

type UpdateCookiePolicyBody = {
  document_url?: string | null
  status?: string | null
}

const parseId = (value: string) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCookiePolicyTable()

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid cookie policy id" })
  }

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_cookie_policy
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  )

  if (!rows[0]) {
    return res.status(404).json({ message: "Cookie policy not found" })
  }

  return res.json({
    cookie_policy: mapCookiePolicyRow(rows[0]),
  })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCookiePolicyTable()

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid cookie policy id" })
  }

  const body = (req.body || {}) as UpdateCookiePolicyBody
  const updates: string[] = []
  const params: any[] = []

  if (body.document_url !== undefined) {
    updates.push(`document_url = $${updates.length + 1}`)
    params.push(
      typeof body.document_url === "string" ? body.document_url.trim() : null
    )
  }

  if (body.status !== undefined) {
    updates.push(`status = $${updates.length + 1}`)
    params.push(typeof body.status === "string" ? body.status.trim() : null)
  }

  if (!updates.length) {
    return res.status(400).json({ message: "No updatable fields provided" })
  }

  params.push(id)

  const { rows } = await getPgPool().query(
    `
      UPDATE redington_cookie_policy
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${params.length}
      RETURNING *
    `,
    params
  )

  if (!rows[0]) {
    return res.status(404).json({ message: "Cookie policy not found" })
  }

  return res.json({
    cookie_policy: mapCookiePolicyRow(rows[0]),
  })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCookiePolicyTable()

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid cookie policy id" })
  }

  const { rowCount } = await getPgPool().query(
    `
      DELETE FROM redington_cookie_policy
      WHERE id = $1
    `,
    [id]
  )

  if (!rowCount) {
    return res.status(404).json({ message: "Cookie policy not found" })
  }

  return res.status(204).send()
}
