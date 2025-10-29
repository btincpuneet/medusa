import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonHomeVideoTable,
  getPgPool,
  mapHomeVideoRow,
} from "../../../../lib/pg"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonHomeVideoTable()

  const { rows } = await getPgPool().query(
    `
      SELECT id, title, url, status, created_at, updated_at
      FROM redington_home_video
      WHERE status = TRUE
      ORDER BY created_at DESC
    `
  )

  return res.json({
    videos: rows.map(mapHomeVideoRow),
  })
}

