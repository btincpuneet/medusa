import "dotenv/config"

import { createPool, RowDataPacket } from "mysql2/promise"

import {
  ensureRedingtonAccessMappingTable,
  getPgPool,
} from "../lib/pg"

const MYSQL_CONFIG = {
  host: process.env.MAGENTO_DB_HOST || "localhost",
  port: Number(process.env.MAGENTO_DB_PORT || "3306"),
  user: process.env.MAGENTO_DB_USER || "root",
  password: process.env.MAGENTO_DB_PASSWORD || "root",
  database: process.env.MAGENTO_DB_NAME || "radington",
  decimalNumbers: true,
}

type AccessMappingRow = RowDataPacket & {
  access_id: number
  country_code: string
  mobile_ext: string
  company_code: string
  brand_ids: string | null
  domain_id: number | null
  domain_extention_id: number | null
  created_at: Date | null
  updated_at: Date | null
}

const normalizeBrandIds = (value: string | null): string[] => {
  if (!value) {
    return []
  }
  return value
    .split(/[,\s]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

async function main() {
  const mysql = await createPool(MYSQL_CONFIG)
  const pg = getPgPool()
  await ensureRedingtonAccessMappingTable()

  try {
    const [rows] = await mysql.query<AccessMappingRow[]>(
      `SELECT access_id, country_code, mobile_ext, company_code, brand_ids, domain_id, domain_extention_id, created_at, updated_at FROM access_mapping`
    )

    for (const row of rows) {
      const accessId = String(row.access_id)
      const brandIds = normalizeBrandIds(row.brand_ids)
      const domainId = row.domain_id ?? null
      const domainExtentionId = row.domain_extention_id ?? null

      await pg.query(`DELETE FROM redington_access_mapping WHERE access_id = $1`, [accessId])

      await pg.query(
        `INSERT INTO redington_access_mapping (
            access_id,
            country_code,
            mobile_ext,
            company_code,
            brand_ids,
            domain_id,
            domain_extention_id,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, NOW(), NOW())
        `,
        [
          accessId,
          row.country_code?.trim() || "",
          row.mobile_ext?.trim() || "",
          row.company_code?.trim() || "",
          JSON.stringify(brandIds),
          domainId,
          domainExtentionId,
        ]
      )
    }

    console.log(`Synced ${rows.length} access mapping records.`)
  } finally {
    await mysql.end()
    await pg.end()
  }
}

main().catch((err) => {
  console.error("Failed to sync access mappings", err)
  process.exit(1)
})
