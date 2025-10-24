import path from "node:path"
import fs from "node:fs"
import dotenv from "dotenv"
import axios from "axios"

import {
  ensureRedingtonDomainTable,
  getPgPool,
} from "../src/lib/pg"

const ENV_PATHS = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../.env"),
  path.resolve(process.cwd(), "../../.env"),
]

for (const envPath of ENV_PATHS) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
    break
  }
}

const magentoBaseUrl = (process.env.MAGENTO_REST_BASE_URL || "").replace(
  /\/$/,
  ""
)

async function fetchMagentoDomains(): Promise<
  Array<{
    access_id?: number
    domain_name: string
    domain_extention_name?: string
    company_code?: string
  }>
> {
  if (!magentoBaseUrl) {
    throw new Error(
      "MAGENTO_REST_BASE_URL env variable is required to pull Magento domains."
    )
  }

  const url = `${magentoBaseUrl}/access-mapping/getDomainDetails/`

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (process.env.MAGENTO_ADMIN_TOKEN) {
    headers.Authorization = `Bearer ${process.env.MAGENTO_ADMIN_TOKEN}`
  }

  const { data } = await axios.post(
    url,
    { countryCode: "ALL" },
    { headers }
  )

  if (!Array.isArray(data) || data.length === 0) {
    return []
  }

  const domains = data[0]?.domain_names ?? data
  if (!Array.isArray(domains)) {
    return []
  }

  return domains
}

async function upsertDomains() {
  await ensureRedingtonDomainTable()

  const domains = await fetchMagentoDomains()
  if (!domains.length) {
    console.log("⚠️  No domain data returned from Magento.")
    return
  }

  const pool = getPgPool()
  let created = 0
  let updated = 0

  for (const entry of domains) {
    const domainName = String(entry.domain_name || "").trim()
    if (!domainName) {
      continue
    }

    const { rowCount, rows } = await pool.query(
      `
        INSERT INTO redington_domain (domain_name, is_active)
        VALUES ($1, TRUE)
        ON CONFLICT (domain_name)
        DO UPDATE SET is_active = TRUE, updated_at = NOW()
        RETURNING id, created_at, updated_at
      `,
      [domainName]
    )

    if (rowCount && rows[0]?.created_at === rows[0]?.updated_at) {
      created += 1
    } else {
      updated += 1
    }
  }

  console.log(
    `✅ Domain migration complete. Created: ${created}, updated: ${updated}`
  )
}

async function main() {
  try {
    await upsertDomains()
  } catch (error) {
    console.error("❌ Failed to migrate domains:", error)
    process.exitCode = 1
  } finally {
    const pool = getPgPool()
    await pool.end().catch(() => void 0)
  }
}

main()

