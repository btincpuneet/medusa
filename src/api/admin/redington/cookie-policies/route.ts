import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonCookiePolicyTable,
  getPgPool,
  mapCookiePolicyRow,
} from "../../../../lib/pg"

type CreateCookiePolicyBody = {
  document_url?: string | null
  status?: string | null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCookiePolicyTable()

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_cookie_policy
      ORDER BY created_at DESC
    `
  )

  return res.json({
    cookie_policies: rows.map(mapCookiePolicyRow),
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCookiePolicyTable()

  const body = (req.body || {}) as CreateCookiePolicyBody

  const documentUrl =
    typeof body.document_url === "string" ? body.document_url.trim() : null
  const status =
    typeof body.status === "string" ? body.status.trim() : null

  const { rows } = await getPgPool().query(
    `
      INSERT INTO redington_cookie_policy (document_url, status)
      VALUES ($1, $2)
      RETURNING *
    `,
    [documentUrl, status]
  )

  return res.status(201).json({
    cookie_policy: mapCookiePolicyRow(rows[0]),
  })
}
