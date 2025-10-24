import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonDomainExtentionTable,
  getPgPool,
  mapDomainExtentionRow,
} from "../../../../lib/pg"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonDomainExtentionTable()

  const { rows } = await getPgPool().query(
    `
      SELECT id, domain_extention_name, status, created_at, updated_at
      FROM redington_domain_extention
      WHERE status = TRUE
      ORDER BY domain_extention_name ASC
    `
  )

  return res.json({
    domain_extentions: rows.map(mapDomainExtentionRow),
  })
}
