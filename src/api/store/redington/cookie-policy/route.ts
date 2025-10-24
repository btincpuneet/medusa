import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonCookiePolicyTable,
  getPgPool,
  mapCookiePolicyRow,
} from "../../../../lib/pg"

const isTruthyStatus = (status: unknown) => {
  if (typeof status !== "string") {
    return false
  }

  const normalized = status.trim().toLowerCase()
  return ["1", "true", "yes", "active", "enabled"].includes(normalized)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCookiePolicyTable()

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_cookie_policy
      ORDER BY updated_at DESC
    `
  )

  const active = rows.find((row) => isTruthyStatus(row.status)) ?? rows[0]

  if (!active) {
    return res.status(404).json({ message: "No cookie policy configured." })
  }

  return res.json({
    cookie_policy: mapCookiePolicyRow(active),
  })
}
