import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonGetInTouchTable,
  getPgPool,
  mapGetInTouchRow,
} from "../../../../lib/pg"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonGetInTouchTable()

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_get_in_touch
      ORDER BY created_at DESC
    `
  )

  return res.json({
    enquiries: rows.map(mapGetInTouchRow),
  })
}
