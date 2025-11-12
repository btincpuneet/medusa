import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonAccessMappingTable,
  ensureRedingtonDomainOutOfStockTable,
  ensureRedingtonDomainTable,
  getPgPool,
  mapDomainOutOfStockRow,
} from "../../../../lib/pg"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await Promise.all([
    ensureRedingtonDomainOutOfStockTable(),
    ensureRedingtonAccessMappingTable(),
    ensureRedingtonDomainTable(),
  ])

  const { rows: outOfStockRows } = await getPgPool().query(
    `
      SELECT dos.*, d.domain_name
      FROM redington_domain_out_of_stock dos
      LEFT JOIN redington_domain d ON d.id = dos.domain_id
    `
  )

  if (!outOfStockRows.length) {
    return res.json({ domain_out_of_stock: [] })
  }

  const { rows: accessRows } = await getPgPool().query(
    `
      SELECT
        id,
        access_id,
        domain_id,
        company_code,
        country_code
      FROM redington_access_mapping
    `
  )

  const accessByDomain = new Map<
    number,
    Array<{
      access_id: string | null
      company_code: string | null
      country_code: string | null
    }>
  >()

  for (const row of accessRows) {
    const domainId = Number(row.domain_id)
    if (!Number.isFinite(domainId)) {
      continue
    }

    const list =
      accessByDomain.get(domainId) ??
      accessByDomain.set(domainId, []).get(domainId)!

    list.push({
      access_id:
        typeof row.access_id === "string" && row.access_id.length
          ? row.access_id
          : Number.isFinite(Number(row.id))
          ? String(row.id)
          : null,
      company_code:
        typeof row.company_code === "string" ? row.company_code : null,
      country_code:
        typeof row.country_code === "string" ? row.country_code : null,
    })
  }

  const response = outOfStockRows.flatMap((row) => {
    const mapped = mapDomainOutOfStockRow(row)
    const domainAccess = accessByDomain.get(mapped.domain_id)

    if (!domainAccess || !domainAccess.length) {
      return [
        {
          ...mapped,
          domain_name:
            typeof row.domain_name === "string" ? row.domain_name : null,
          access_id: null,
          company_code: null,
          country_code: null,
        },
      ]
    }

    return domainAccess.map((access) => ({
      ...mapped,
      domain_name:
        typeof row.domain_name === "string" ? row.domain_name : null,
      access_id: access.access_id,
      company_code: access.company_code,
      country_code: access.country_code,
    }))
  })

  return res.json({
    domain_out_of_stock: response,
  })
}
