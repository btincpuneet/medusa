import "dotenv/config"

import path from "path"
import { spawnSync } from "child_process"
import mysql from "mysql2/promise"

import {
  ensureRedingtonAddBccTable,
  ensureRedingtonCmsPageTable,
  ensureRedingtonCookiePolicyTable,
  ensureRedingtonCouponRuleTable,
  ensureRedingtonCustomerNumberTable,
  ensureRedingtonAccessMappingTable,
  ensureRedingtonDomainExtentionTable,
  ensureRedingtonDomainOutOfStockTable,
  ensureRedingtonDomainTable,
  ensureRedingtonGetInTouchTable,
  ensureRedingtonSettingsTable,
  getPgPool,
  setRedingtonSetting,
} from "../src/lib/pg"

type MagentoDbConfig = {
  host: string
  dbname: string
  username: string
  password: string
}

const MAGENTO_ENV_PATH = path.resolve(
  __dirname,
  "../../../B2C/app/etc/env.php"
)

const TABLES_WITH_SEQUENCES = [
  "redington_domain",
  "redington_domain_extention",
  "redington_add_bcc",
  "redington_cookie_policy",
  "redington_access_mapping",
  "redington_domain_out_of_stock",
  "redington_customer_number",
  "redington_cms_page",
  "redington_coupon_rule",
] as const

async function main() {
  const magentoDb = await readMagentoDbConfig()

  const mysqlConnection = await mysql.createConnection({
    host: magentoDb.host || "localhost",
    user: magentoDb.username,
    password: magentoDb.password,
    database: magentoDb.dbname,
    multipleStatements: false,
  })

  const pgPool = getPgPool()

  await ensureRedingtonDomainTable()
  await ensureRedingtonDomainExtentionTable()
  await ensureRedingtonAddBccTable()
  await ensureRedingtonCookiePolicyTable()
  await ensureRedingtonDomainOutOfStockTable()
  await ensureRedingtonCustomerNumberTable()
  await ensureRedingtonCmsPageTable()
  await ensureRedingtonCouponRuleTable()
  await ensureRedingtonSettingsTable()
  await ensureRedingtonGetInTouchTable()
  await ensureRedingtonAccessMappingTable()

  await resetTargetTables(pgPool)

  await seedDomains(mysqlConnection, pgPool)
  await seedDomainExtentions(mysqlConnection, pgPool)
  await seedAccessMappings(mysqlConnection, pgPool)
  await seedAddBcc(mysqlConnection, pgPool)
  await seedCookiePolicies(mysqlConnection, pgPool)
  await seedDomainOutOfStock(mysqlConnection, pgPool)
  await seedCustomerNumbers(mysqlConnection, pgPool)
  await seedCmsPages(mysqlConnection, pgPool)
  await seedCouponRules(mysqlConnection, pgPool)
  await seedSettings(mysqlConnection, pgPool)

  await syncSequences(pgPool)

  await mysqlConnection.end()
  await pgPool.end()

  console.log("✅ Redington data synced from Magento.")
}

async function seedDomains(
  mysqlConnection: mysql.Connection,
  pgPool: ReturnType<typeof getPgPool>
) {
  const [rows] = await mysqlConnection.query<mysql.RowDataPacket[]>(
    `SELECT domain_id, domain_name, status, created_at, updated_at
     FROM epp_domain
     ORDER BY updated_at DESC, domain_id DESC`
  )

  const seenNames = new Set<string>()

  for (const row of rows) {
    const id = Number(row.domain_id)
    if (!Number.isFinite(id)) {
      continue
    }

    const domainName =
      typeof row.domain_name === "string" ? row.domain_name.trim() : ""
    if (!domainName.length) {
      continue
    }

    if (seenNames.has(domainName.toLowerCase())) {
      continue
    }

    seenNames.add(domainName.toLowerCase())

    const createdAt = coerceDate(row.created_at)
    const updatedAt = coerceDate(row.updated_at)

    await pgPool.query(
      `
        INSERT INTO redington_domain (id, domain_name, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE
          SET domain_name = EXCLUDED.domain_name,
              is_active = EXCLUDED.is_active,
              updated_at = EXCLUDED.updated_at
      `,
      [id, domainName, parseBool(row.status), createdAt, updatedAt]
    )
  }

  console.log(`→ Imported ${seenNames.size} domains`)
}

async function seedDomainExtentions(
  mysqlConnection: mysql.Connection,
  pgPool: ReturnType<typeof getPgPool>
) {
  const [rows] = await mysqlConnection.query<mysql.RowDataPacket[]>(
    `SELECT domain_extention_id, domain_extention_name, status
     FROM domain_extention`
  )

  for (const row of rows) {
    const id = Number(row.domain_extention_id)
    if (!Number.isFinite(id)) {
      continue
    }

    await pgPool.query(
      `
        INSERT INTO redington_domain_extention (id, domain_extention_name, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE
          SET domain_extention_name = EXCLUDED.domain_extention_name,
              status = EXCLUDED.status,
              updated_at = EXCLUDED.updated_at
      `,
      [
        id,
        row.domain_extention_name,
        parseBool(row.status),
        new Date(),
        new Date(),
      ]
    )
  }

  console.log(`→ Imported ${rows.length} domain extensions`)
}

async function seedAccessMappings(
  mysqlConnection: mysql.Connection,
  pgPool: ReturnType<typeof getPgPool>
) {
  const [rows] = await mysqlConnection.query<mysql.RowDataPacket[]>(
    `SELECT
        access_id,
        country_code,
        mobile_ext,
        company_code,
        brand_ids,
        domain_id,
        domain_extention_id,
        created_at,
        updated_at
     FROM access_mapping`
  )

  for (const row of rows) {
    const id = Number(row.access_id)
    const domainId = Number(row.domain_id)
    const domainExtId = row.domain_extention_id
      ? Number(row.domain_extention_id)
      : null

    if (!Number.isFinite(id) || !Number.isFinite(domainId)) {
      continue
    }

    const brands = typeof row.brand_ids === "string"
      ? row.brand_ids
          .split(",")
          .map((entry: string) => entry.trim())
          .filter(Boolean)
      : []

    await pgPool.query(
      `
        INSERT INTO redington_access_mapping (
          id,
          country_code,
          mobile_ext,
          company_code,
          brand_ids,
          domain_id,
          domain_extention_id,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE
          SET country_code = EXCLUDED.country_code,
              mobile_ext = EXCLUDED.mobile_ext,
              company_code = EXCLUDED.company_code,
              brand_ids = EXCLUDED.brand_ids,
              domain_id = EXCLUDED.domain_id,
              domain_extention_id = EXCLUDED.domain_extention_id,
              updated_at = EXCLUDED.updated_at
      `,
      [
        id,
        row.country_code,
        row.mobile_ext,
        row.company_code,
        JSON.stringify(brands),
        domainId,
        domainExtId,
        coerceDate(row.created_at),
        coerceDate(row.updated_at),
      ]
    )
  }

  console.log(`→ Imported ${rows.length} access mappings`)
}

async function seedAddBcc(
  mysqlConnection: mysql.Connection,
  pgPool: ReturnType<typeof getPgPool>
) {
  const [rows] = await mysqlConnection.query<mysql.RowDataPacket[]>(
    `SELECT addbcc_id, domain_id, addbcc
     FROM redington_addbccvalue_addbcc`
  )

  let imported = 0

  for (const row of rows) {
    const id = Number(row.addbcc_id)
    const domainId = Number(row.domain_id)
    if (!Number.isFinite(id) || !Number.isFinite(domainId)) {
      continue
    }

    const bccRaw = typeof row.addbcc === "string" ? row.addbcc : ""
    const emails = bccRaw
      .split(",")
      .map((entry: string) => entry.trim())
      .filter(Boolean)
      .join(",")

    await pgPool.query(
      `
        INSERT INTO redington_add_bcc (id, domain_id, bcc_emails, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE
          SET domain_id = EXCLUDED.domain_id,
              bcc_emails = EXCLUDED.bcc_emails,
              updated_at = NOW()
      `,
      [id, domainId, emails]
    )
    imported += 1
  }

  console.log(`→ Imported ${imported} Add BCC rows`)
}

async function seedCookiePolicies(
  mysqlConnection: mysql.Connection,
  pgPool: ReturnType<typeof getPgPool>
) {
  const [rows] = await mysqlConnection.query<mysql.RowDataPacket[]>(
    `SELECT cookiepolicy_id, uploadpdf, status
     FROM cookiepolicy`
  )

  for (const row of rows) {
    const id = Number(row.cookiepolicy_id)
    if (!Number.isFinite(id)) {
      continue
    }

    await pgPool.query(
      `
        INSERT INTO redington_cookie_policy (id, document_url, status, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE
          SET document_url = EXCLUDED.document_url,
              status = EXCLUDED.status,
              updated_at = NOW()
      `,
      [id, row.uploadpdf ?? null, row.status ?? null]
    )
  }

  console.log(`→ Imported ${rows.length} cookie policies`)
}

async function seedDomainOutOfStock(
  mysqlConnection: mysql.Connection,
  pgPool: ReturnType<typeof getPgPool>
) {
  const [rows] = await mysqlConnection.query<mysql.RowDataPacket[]>(
    `SELECT domainbasedoutofstock_id, domain_id, enable_disable
     FROM redington_domainbasedoutofstockcontrol`
  )

  for (const row of rows) {
    const id = Number(row.domainbasedoutofstock_id)
    const domainId = Number(row.domain_id)
    if (!Number.isFinite(id) || !Number.isFinite(domainId)) {
      continue
    }

    await pgPool.query(
      `
        INSERT INTO redington_domain_out_of_stock (id, domain_id, status, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE
          SET domain_id = EXCLUDED.domain_id,
              status = EXCLUDED.status,
              updated_at = NOW()
      `,
      [id, domainId, parseBool(row.enable_disable)]
    )
  }

  console.log(`→ Imported ${rows.length} domain out-of-stock entries`)
}

async function seedCustomerNumbers(
  mysqlConnection: mysql.Connection,
  pgPool: ReturnType<typeof getPgPool>
) {
  const [rows] = await mysqlConnection.query<mysql.RowDataPacket[]>(
    `SELECT id, company_code, distribution_channel, brand_id, domain_id, customer_number, created_at, updated_at
     FROM epp_customer_number`
  )

  for (const row of rows) {
    const id = Number(row.id)
    const domainId = Number(row.domain_id)
    if (!Number.isFinite(id) || !Number.isFinite(domainId)) {
      continue
    }

    await pgPool.query(
      `
        INSERT INTO redington_customer_number (
          id,
          company_code,
          distribution_channel,
          brand_id,
          domain_id,
          customer_number,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE
          SET company_code = EXCLUDED.company_code,
              distribution_channel = EXCLUDED.distribution_channel,
              brand_id = EXCLUDED.brand_id,
              domain_id = EXCLUDED.domain_id,
              customer_number = EXCLUDED.customer_number,
              updated_at = EXCLUDED.updated_at
      `,
      [
        id,
        row.company_code,
        row.distribution_channel,
        row.brand_id !== undefined && row.brand_id !== null
          ? String(row.brand_id)
          : "",
        domainId,
        row.customer_number,
        coerceDate(row.created_at),
        coerceDate(row.updated_at),
      ]
    )
  }

  console.log(`→ Imported ${rows.length} customer numbers`)
}

async function seedCmsPages(
  mysqlConnection: mysql.Connection,
  pgPool: ReturnType<typeof getPgPool>
) {
  const [rows] = await mysqlConnection.query<mysql.RowDataPacket[]>(
    `SELECT
        page_id,
        identifier,
        title,
        content,
        country_id,
        domain_id,
        access_id,
        is_active,
        creation_time,
        update_time,
        content_heading
     FROM cms_page`
  )

  for (const row of rows) {
    const id = Number(row.page_id)
    if (!Number.isFinite(id)) {
      continue
    }

    const metadata = {
      magento_page_id: id,
      name: row.title,
      content_heading: row.content_heading ?? null,
    }

    await pgPool.query(
      `
        INSERT INTO redington_cms_page (
          id,
          slug,
          title,
          content,
          country_code,
          domain_id,
          access_id,
          is_active,
          metadata,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11)
        ON CONFLICT (id) DO UPDATE
          SET slug = EXCLUDED.slug,
              title = EXCLUDED.title,
              content = EXCLUDED.content,
              country_code = EXCLUDED.country_code,
              domain_id = EXCLUDED.domain_id,
              access_id = EXCLUDED.access_id,
              is_active = EXCLUDED.is_active,
              metadata = EXCLUDED.metadata,
              updated_at = EXCLUDED.updated_at
      `,
      [
        id,
        row.identifier,
        row.title,
        row.content,
        row.country_id ?? null,
        row.domain_id ? Number(row.domain_id) : null,
        row.access_id ?? null,
        parseBool(row.is_active),
        JSON.stringify(metadata),
        coerceDate(row.creation_time),
        coerceDate(row.update_time),
      ]
    )
  }

  console.log(`→ Imported ${rows.length} CMS pages`)
}

async function seedCouponRules(
  mysqlConnection: mysql.Connection,
  pgPool: ReturnType<typeof getPgPool>
) {
  const [rows] = await mysqlConnection.query<mysql.RowDataPacket[]>(
    `SELECT
        sr.rule_id,
        sr.is_active,
        sr.company_code,
        sr.domain_id,
        sr.domain_extention_id,
        sc.coupon_id,
        sc.code,
        sc.expiration_date
     FROM salesrule sr
     INNER JOIN salesrule_coupon sc ON sc.rule_id = sr.rule_id
     WHERE sc.code IS NOT NULL AND sc.code <> ''
       AND sr.company_code IS NOT NULL AND sr.company_code <> ''
     ORDER BY sc.coupon_id ASC`
  )

  let imported = 0

  for (const row of rows) {
    const couponId = Number(row.coupon_id)
    const domainId = Number(row.domain_id)
    if (!Number.isFinite(domainId)) {
      continue
    }

    const domainExtId =
      row.domain_extention_id !== null && row.domain_extention_id !== undefined
        ? Number(row.domain_extention_id)
        : null

    await pgPool.query(
      `
        INSERT INTO redington_coupon_rule (
          id,
          coupon_code,
          company_code,
          domain_id,
          domain_extention_id,
          is_active,
          metadata,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
        ON CONFLICT (id) DO UPDATE
          SET coupon_code = EXCLUDED.coupon_code,
              company_code = EXCLUDED.company_code,
              domain_id = EXCLUDED.domain_id,
              domain_extention_id = EXCLUDED.domain_extention_id,
              is_active = EXCLUDED.is_active,
              metadata = EXCLUDED.metadata,
              updated_at = EXCLUDED.updated_at
      `,
      [
        couponId,
        row.code,
        row.company_code,
        domainId,
        domainExtId,
        parseBool(row.is_active),
        JSON.stringify({
          rule_id: Number(row.rule_id),
          coupon_id: couponId,
          expiration_date: row.expiration_date ?? null,
        }),
        new Date(),
        new Date(),
      ]
    )

    imported += 1
  }

  console.log(`→ Imported ${imported} coupon rules`)
}

async function seedSettings(
  mysqlConnection: mysql.Connection,
  pgPool: ReturnType<typeof getPgPool>
) {
  const promotionRoot = await fetchCoreConfig(
    mysqlConnection,
    "category_section/company_code/category_dropdown"
  )

  if (promotionRoot) {
    await setRedingtonSetting("category_restriction_promotion_root", {
      promotion_root_category_id: promotionRoot,
    })
  }

  const getInTouchRecipients = await fetchCoreConfig(
    mysqlConnection,
    "redington_sms/get_in_touch_email_receiver/email"
  )

  if (getInTouchRecipients) {
    const recipients = getInTouchRecipients
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)

    await setRedingtonSetting("get_in_touch.email_recipients", {
      recipients,
    })
  }

  console.log("→ Synced Redington settings from Magento config")
}

async function fetchCoreConfig(
  mysqlConnection: mysql.Connection,
  pathValue: string
): Promise<string | null> {
  const [rows] = await mysqlConnection.query<mysql.RowDataPacket[]>(
    `SELECT value
     FROM core_config_data
     WHERE path = ?
     ORDER BY config_id DESC
     LIMIT 1`,
    [pathValue]
  )

  if (!rows.length) {
    return null
  }

  const value = rows[0]?.value
  return typeof value === "string" ? value : null
}

async function syncSequences(pgPool: ReturnType<typeof getPgPool>) {
  for (const table of TABLES_WITH_SEQUENCES) {
    const sequenceQuery = `
      SELECT setval(
        pg_get_serial_sequence('${table}', 'id'),
        GREATEST((SELECT COALESCE(MAX(id), 0) FROM ${table}), 1),
        true
      )
    `
    await pgPool.query(sequenceQuery)
  }
}

async function resetTargetTables(pgPool: ReturnType<typeof getPgPool>) {
  const tables = [
    "redington_add_bcc",
    "redington_domain_out_of_stock",
    "redington_customer_number",
    "redington_coupon_rule",
    "redington_cms_page",
    "redington_cookie_policy",
    "redington_access_mapping",
    "redington_domain_extention",
    "redington_domain",
  ]

  for (const table of tables) {
    await pgPool.query(`DELETE FROM ${table}`)
  }
}

function parseBool(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "number") {
    return value !== 0
  }

  if (typeof value === "string") {
    return ["1", "true", "yes", "on"].includes(value.toLowerCase())
  }

  return false
}

function coerceDate(value: unknown): Date {
  if (value instanceof Date) {
    return value
  }

  if (typeof value === "string" && value.length) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.valueOf())) {
      return parsed
    }
  }

  return new Date()
}

async function readMagentoDbConfig(): Promise<MagentoDbConfig> {
  const script = `
    $config = require '${MAGENTO_ENV_PATH.replace(/\\/g, "\\\\")}';
    echo json_encode($config["db"]["connection"]["default"]);
  `

  const result = spawnSync("php", ["-r", script], {
    encoding: "utf-8",
  })

  if (result.status !== 0 || !result.stdout) {
    throw new Error(
      `Failed to load Magento DB credentials: ${result.stderr || "unknown error"}`
    )
  }

  const parsed = JSON.parse(result.stdout.trim()) as MagentoDbConfig

  if (!parsed || !parsed.dbname) {
    throw new Error("Magento DB configuration is incomplete.")
  }

  return parsed
}

main().catch((error) => {
  console.error("❌ Failed to sync Redington data from Magento.")
  console.error(error)
  process.exit(1)
})
