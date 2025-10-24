import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonAccessMappingTable,
  ensureRedingtonAddBccTable,
  ensureRedingtonDomainTable,
  getPgPool,
  mapAddBccRow,
} from "../../../../lib/pg"

const parseNumeric = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim().length) {
    const parsed = Number.parseInt(value.trim(), 10)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await Promise.all([
    ensureRedingtonAddBccTable(),
    ensureRedingtonAccessMappingTable(),
    ensureRedingtonDomainTable(),
  ])

  const accessId = parseNumeric(
    req.query.access_id ?? req.query.accessId ?? req.query.access
  )
  const domainIdQuery = parseNumeric(req.query.domain_id ?? req.query.domainId)

  let domainId = domainIdQuery

  if (!domainId && accessId) {
    const { rows } = await getPgPool().query(
      `
        SELECT domain_id
        FROM redington_access_mapping
        WHERE id = $1
        LIMIT 1
      `,
      [accessId]
    )

    if (rows[0]?.domain_id) {
      domainId = Number(rows[0].domain_id)
    }
  }

  if (!domainId) {
    return res.status(400).json({
      message:
        "domain_id or access_id query parameter is required to resolve a BCC entry",
    })
  }

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_add_bcc
      WHERE domain_id = $1
      LIMIT 1
    `,
    [domainId]
  )

  if (!rows[0]) {
    return res.status(404).json({
      message: `No BCC configuration found for domain ${domainId}`,
    })
  }

  return res.json({
    add_bcc: mapAddBccRow(rows[0]),
  })
}
