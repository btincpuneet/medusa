import "dotenv/config"

import { createPool, Pool as MySqlPool } from "mysql2/promise"
import type { RowDataPacket } from "mysql2"
import { Pool as PgPool } from "pg"

import {
  ensureRedingtonCompanyCodeTable,
  ensureRedingtonCurrencyMappingTable,
  ensureRedingtonHomeVideoTable,
  ensureRedingtonOrderReturnTable,
  ensureRedingtonOrderShipmentTable,
  ensureRedingtonOrderCcEmailTable,
  ensureRedingtonOtpTable,
  ensureRedingtonProductEnquiryTable,
  ensureRedingtonMaxQtyRuleTable,
  ensureRedingtonMaxQtyCategoryTable,
  ensureRedingtonOrderQuantityTrackerTable,
  ensureRedingtonMpgsTransactionTable,
  ensureRedingtonProductPriceTable,
  ensureRedingtonRetainCartConfigTable,
  getPgPool,
} from "../lib/pg"

type HomeVideoRow = {
  homevideo_id: number
  url: string | null
  status: string | null
  createdAt: Date | null
  updateAt: Date | null
  title: string | null
} & RowDataPacket

type OrderReturnRow = {
  id: number
  order_id: string
  user_name: string
  user_email: string
  sku: string
  product_name: string
  qty: number
  price: string
  order_status: string
  return_status: string
  remarks: string
  created_at: Date
} & RowDataPacket

type ProductEnquiryRow = {
  productenquiry_id: number
  user_id: number | null
  access_id: number | null
  domain_id: number | null
  company_code: number | null
  product_id: number | null
  comments: string | null
  status: string | null
  created_at: Date | null
  updated_at: Date | null
  fullname: string | null
  email: string | null
  productname: string | null
  domainname: string | null
  countryname: string | null
  sku: string | null
  price: string | null
} & RowDataPacket

type MaxQtyRuleRow = {
  id: number
  brand_id: string
  max_qty: number
  created_at: Date
  updated_at: Date
  category_id: string
  company_code: string
  domain_id: number
} & RowDataPacket

type MaxQtyCategoryRow = {
  id: number
  category_id: string
  brand_id: string
  company_code: string
  domain_id: number
  max_qty: number
  created_at: Date
  updated_at: Date
} & RowDataPacket

type OrderTrackerRow = {
  id: number
  customer_id: number
  order_increment_id: string
  sku: string
  quantity: number
  brand_id: string
  created_at: Date
  updated_at: Date
} & RowDataPacket

type MpgsTransactionRow = {
  id: number
  order_ref_id: string
  session_id: string
  transaction_reference: string
  order_increment_id: string
  payment_status: string
  session_version: string
  result_indicator: string
  order_status: string
  transaction_receipt: string
  created_at: Date
} & RowDataPacket

type ProductPriceRow = {
  id: number
  sku: string
  country_code: string
  company_code: string
  brand_id: string
  distribution_channel: string
  product_base_price: number
  product_special_price: number | null
  from_date: Date | null
  to_date: Date | null
  created_at: Date
  updated_at: Date
  domain_id: number
  status: number
  promotion_channel: string | null
} & RowDataPacket

type CurrencyMappingRow = {
  id: number
  name: string | null
  company_code: string | null
  country_name: string | null
  country_code: string | null
  currency_code: string | null
  decimal_place: number | string | null
  payment_method: string | null
  shipment_tracking_url: string | null
  is_active: number | string | boolean | null
  created_at: Date | string | null
  updated_at: Date | string | null
} & RowDataPacket

type CompanyCodeRow = {
  id: number
  country_code: string | null
  company_code: string | null
  status: number | string | boolean | null
} & RowDataPacket

type EmailOtpRow = {
  id: number
  email_id: string | null
  otp: number | string | null
  email_verified: number | string | boolean | null
  expiry: Date | string | null
  created_at: Date | string | null
  updated_at: Date | string | null
  action: string | null
} & RowDataPacket

type OrderShipmentRow = {
  entity_id: number
  increment_id: string | null
  status: string | null
  awb_number: string | null
  sap_order_number: string | null
  updated_at: Date | string | null
  created_at: Date | string | null
} & RowDataPacket

type OrderCcEmailRow = {
  ordercreationreturn_id: number
  company_code: string | null
  domain_id: number | string | null
  brand_ids: string | null
  ccemail: string | null
  created_at: Date | string | null
  updated_at: Date | string | null
  domain_extention_id: number | string | null
} & RowDataPacket

type RetainCartConfig = {
  retaincartpaymentime_id: number
  retrytime: string | null
  domain_id: string | null
  enable_disable: number | null
  addbcc: string | null
} & RowDataPacket

const MYSQL_CONFIG = {
  host: process.env.MAGENTO_DB_HOST || "localhost",
  port: Number(process.env.MAGENTO_DB_PORT || "3306"),
  user: process.env.MAGENTO_DB_USER || "root",
  password: process.env.MAGENTO_DB_PASSWORD || "root",
  database: process.env.MAGENTO_DB_NAME || "radington",
  decimalNumbers: true,
}

const migrateCompanyCodes = async (
  mysql: MySqlPool,
  pg: PgPool
) => {
  await ensureRedingtonCompanyCodeTable()
  const [rows] = await mysql.query<CompanyCodeRow[]>(
    "SELECT id, country_code, company_code, status FROM epp_company_code"
  )

  for (const row of rows) {
    const countryCode = row.country_code?.trim()
    const companyCode = row.company_code?.trim()

    if (!countryCode || !companyCode) {
      console.warn(
        `Skipping company code row ${row.id} due to missing country or company code`
      )
      continue
    }

    await pg.query(
      `
        DELETE FROM redington_company_code
        WHERE country_code = $1
          AND id <> $2
      `,
      [countryCode, row.id]
    )

    await pg.query(
      `
        INSERT INTO redington_company_code (id, country_code, company_code, status)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE
          SET country_code = EXCLUDED.country_code,
              company_code = EXCLUDED.company_code,
              status = EXCLUDED.status,
              updated_at = NOW()
      `,
      [
        row.id,
        countryCode,
        companyCode,
        normalizeBoolean(row.status),
      ]
    )
  }

  await resetSequence(pg, "redington_company_code")
}

const truthyValues = new Set(["1", "true", "enabled", "yes", "on", "active"])

const normalizeBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value
  }
  if (typeof value === "number") {
    return value > 0
  }
  if (typeof value === "string") {
    return truthyValues.has(value.trim().toLowerCase())
  }
  return false
}

const parseNumeric = (
  value: string | number | null | undefined
): number | null => {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }
  const normalized = value.replace(/,/g, "")
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

const toDateString = (
  value: Date | string | null | undefined
): string | null => {
  if (!value) {
    return null
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  try {
    return date.toISOString()
  } catch {
    return null
  }
}

const migrateCurrencyMappings = async (
  mysql: MySqlPool,
  pg: PgPool
) => {
  await ensureRedingtonCurrencyMappingTable()
  const [rows] = await mysql.query<CurrencyMappingRow[]>(
    `
      SELECT
        id,
        name,
        company_code,
        country_name,
        country_code,
        currency_code,
        decimal_place,
        payment_method,
        shipment_tracking_url,
        is_active,
        created_at,
        updated_at
      FROM epp_currency_mapping
    `
  )

  for (const row of rows) {
    const name = row.name?.trim()
    const companyCode = row.company_code?.trim()
    const countryName = row.country_name?.trim()
    const countryCode = row.country_code?.trim().toUpperCase()
    const currencyCode = row.currency_code?.trim().toUpperCase()
    const paymentMethod = row.payment_method?.trim()
    const shipmentTrackingUrl = row.shipment_tracking_url?.trim()
    const decimalPlaceRaw =
      typeof row.decimal_place === "string"
        ? Number(row.decimal_place.replace(/,/g, ""))
        : Number(row.decimal_place)
    const decimalPlace = Number.isFinite(decimalPlaceRaw)
      ? Math.max(0, Math.trunc(decimalPlaceRaw))
      : 2

    if (
      !name ||
      !companyCode ||
      !countryName ||
      !countryCode ||
      !currencyCode ||
      !paymentMethod ||
      !shipmentTrackingUrl
    ) {
      console.warn(
        `Skipping currency mapping ${row.id} due to missing required fields`
      )
      continue
    }

    await pg.query(
      `
        INSERT INTO redington_currency_mapping (
          id,
          name,
          company_code,
          country_name,
          country_code,
          currency_code,
          decimal_place,
          payment_method,
          shipment_tracking_url,
          is_active,
          created_at,
          updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (id) DO UPDATE
          SET name = EXCLUDED.name,
              company_code = EXCLUDED.company_code,
              country_name = EXCLUDED.country_name,
              country_code = EXCLUDED.country_code,
              currency_code = EXCLUDED.currency_code,
              decimal_place = EXCLUDED.decimal_place,
              payment_method = EXCLUDED.payment_method,
              shipment_tracking_url = EXCLUDED.shipment_tracking_url,
              is_active = EXCLUDED.is_active,
              created_at = LEAST(redington_currency_mapping.created_at, EXCLUDED.created_at),
              updated_at = EXCLUDED.updated_at
      `,
      [
        row.id,
        name,
        companyCode,
        countryName,
        countryCode,
        currencyCode,
        decimalPlace,
        paymentMethod,
        shipmentTrackingUrl,
        normalizeBoolean(row.is_active),
        toDateString(row.created_at) ?? new Date().toISOString(),
        toDateString(row.updated_at) ??
          toDateString(row.created_at) ??
          new Date().toISOString(),
      ]
    )
  }

  await resetSequence(pg, "redington_currency_mapping")
}

const migrateOtps = async (mysql: MySqlPool, pg: PgPool) => {
  await ensureRedingtonOtpTable()

  const [rows] = await mysql.query<EmailOtpRow[]>(
    `
      SELECT
        id,
        email_id,
        otp,
        email_verified,
        expiry,
        created_at,
        updated_at,
        action
      FROM customer_email_otp
    `
  )

  for (const row of rows) {
    const email = row.email_id?.trim().toLowerCase()
    const action = row.action?.trim() || "default"

    const rawOtp =
      typeof row.otp === "number"
        ? Math.abs(row.otp)
        : typeof row.otp === "string"
        ? row.otp.replace(/\s+/g, "")
        : ""
    const code = String(rawOtp ?? "").trim()

    if (!email || !code) {
      console.warn(
        `Skipping OTP row ${row.id} due to missing email or code (email="${row.email_id}", otp="${row.otp}")`
      )
      continue
    }

    const createdAt =
      toDateString(row.created_at) ?? new Date().toISOString()
    const updatedAt =
      toDateString(row.updated_at) ?? createdAt
    const expiresAt =
      toDateString(row.expiry) ?? updatedAt

    const isVerified = normalizeBoolean(row.email_verified)
    const consumedAt = isVerified ? updatedAt : null

    await pg.query(
      `
        INSERT INTO redington_otp (
          id,
          email,
          action,
          code,
          expires_at,
          consumed_at,
          created_at,
          updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (email, action) DO UPDATE
          SET code = EXCLUDED.code,
              expires_at = EXCLUDED.expires_at,
              consumed_at = COALESCE(EXCLUDED.consumed_at, redington_otp.consumed_at),
              created_at = LEAST(redington_otp.created_at, EXCLUDED.created_at),
              updated_at = GREATEST(redington_otp.updated_at, EXCLUDED.updated_at)
      `,
      [
        row.id,
        email,
        action,
        code,
        expiresAt,
        consumedAt,
        createdAt,
        updatedAt,
      ]
    )
  }

  await resetSequence(pg, "redington_otp")
}

const migrateOrderShipments = async (
  mysql: MySqlPool,
  pg: PgPool
) => {
  await ensureRedingtonOrderShipmentTable()

  const [rows] = await mysql.query<OrderShipmentRow[]>(
    `
      SELECT
        entity_id,
        increment_id,
        status,
        awb_number,
        sap_order_number,
        updated_at,
        created_at
      FROM sales_order
    `
  )

  for (const row of rows) {
    const incrementId = row.increment_id?.trim()
    if (!incrementId) {
      console.warn(
        `Skipping order shipment row ${row.entity_id} due to missing increment_id`
      )
      continue
    }

    const status = row.status?.trim() || "unknown"
    const awbNumber = row.awb_number?.trim() || null
    const sapNumbers = row.sap_order_number?.trim() || null
    const createdAt =
      toDateString(row.created_at) ?? new Date().toISOString()
    const updatedAt =
      toDateString(row.updated_at) ?? createdAt

    const metadata = {
      magento_entity_id: row.entity_id,
    }

    await pg.query(
      `
        INSERT INTO redington_order_shipment (
          order_id,
          order_increment_id,
          order_status,
          awb_number,
          sap_order_numbers,
          last_synced_at,
          metadata,
          created_at,
          updated_at
        )
        VALUES (NULL, $1, $2, $3, $4, NOW(), $5::jsonb, $6, $7)
        ON CONFLICT (order_increment_id) DO UPDATE
          SET order_status = EXCLUDED.order_status,
              awb_number = EXCLUDED.awb_number,
              sap_order_numbers = EXCLUDED.sap_order_numbers,
              last_synced_at = NOW(),
              metadata = EXCLUDED.metadata,
              updated_at = EXCLUDED.updated_at
      `,
      [
        incrementId,
        status,
        awbNumber,
        sapNumbers,
        JSON.stringify(metadata),
        createdAt,
        updatedAt,
      ]
    )
  }

  await resetSequence(pg, "redington_order_shipment")
}

const migrateOrderCcEmails = async (
  mysql: MySqlPool,
  pg: PgPool
) => {
  await ensureRedingtonOrderCcEmailTable()

  const [rows] = await mysql.query<OrderCcEmailRow[]>(
    `SELECT
        ordercreationreturn_id,
        company_code,
        domain_id,
        brand_ids,
        ccemail,
        created_at,
        updated_at,
        domain_extention_id
      FROM order_cc_email`
  )

  for (const row of rows) {
    const id = row.ordercreationreturn_id
    const companyCode = row.company_code?.trim() || null
    const domainIdRaw =
      typeof row.domain_id === "string" ? Number(row.domain_id) : row.domain_id
    const domainId =
      domainIdRaw !== null && domainIdRaw !== undefined && Number.isFinite(Number(domainIdRaw))
        ? Number(domainIdRaw)
        : null

    const domainExtRaw =
      typeof row.domain_extention_id === "string"
        ? Number(row.domain_extention_id)
        : row.domain_extention_id
    const domainExtentionId =
      domainExtRaw !== null && domainExtRaw !== undefined && Number.isFinite(Number(domainExtRaw))
        ? Number(domainExtRaw)
        : null

    const brandIds = typeof row.brand_ids === "string" ? row.brand_ids.trim() : null
    const ccEmails = typeof row.ccemail === "string" ? row.ccemail.trim() : null

    const createdAt =
      toDateString(row.created_at) ?? new Date().toISOString()
    const updatedAt =
      toDateString(row.updated_at) ?? createdAt

    await pg.query(
      `
        INSERT INTO redington_order_cc_email (
          id,
          company_code,
          domain_id,
          domain_extention_id,
          brand_ids,
          cc_emails,
          created_at,
          updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (id) DO UPDATE
          SET company_code = EXCLUDED.company_code,
              domain_id = EXCLUDED.domain_id,
              domain_extention_id = EXCLUDED.domain_extention_id,
              brand_ids = EXCLUDED.brand_ids,
              cc_emails = EXCLUDED.cc_emails,
              updated_at = EXCLUDED.updated_at
      `,
      [
        id,
        companyCode,
        domainId,
        domainExtentionId,
        brandIds,
        ccEmails,
        createdAt,
        updatedAt,
      ]
    )
  }

  await resetSequence(pg, "redington_order_cc_email")
}

const resetSequence = async (pool: PgPool, table: string) => {
  await pool.query(
    `
      SELECT setval(
        pg_get_serial_sequence($1, 'id'),
        COALESCE((SELECT MAX(id) FROM ${table}), 0),
        true
      );
    `,
    [table]
  )
}

const normalizeDomainId = (value: number | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

const parseRetryTimeToSeconds = (value: string | null): number => {
  if (!value) {
    return 7200
  }
  const trimmed = value.trim()
  if (!trimmed.length) {
    return 7200
  }

  const parts = trimmed.split(":").map((part) => Number(part))
  if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
    const [h, m, s] = parts
    return Math.max(0, h * 3600 + m * 60 + s)
  }

  const numeric = Number(trimmed)
  if (Number.isFinite(numeric)) {
    return Math.max(0, Math.floor(numeric))
  }

  return 7200
}

const migrateHomeVideos = async (
  mysql: MySqlPool,
  pg: PgPool
) => {
  await ensureRedingtonHomeVideoTable()
  const [rows] = await mysql.query<HomeVideoRow[]>(
    "SELECT homevideo_id, url, status, createdAt, updateAt, title FROM homevideo"
  )

  for (const row of rows) {
    await pg.query(
      `
        INSERT INTO redington_home_video (id, title, url, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE
          SET title = EXCLUDED.title,
              url = EXCLUDED.url,
              status = EXCLUDED.status,
              updated_at = EXCLUDED.updated_at
      `,
      [
        row.homevideo_id,
        row.title ?? "",
        row.url ?? "",
        normalizeBoolean(row.status),
        toDateString(row.createdAt) ?? new Date().toISOString(),
        toDateString(row.updateAt) ?? toDateString(row.createdAt) ?? new Date().toISOString(),
      ]
    )
  }

  await resetSequence(pg, "redington_home_video")
}

const migrateOrderReturns = async (
  mysql: MySqlPool,
  pg: PgPool
) => {
  await ensureRedingtonOrderReturnTable()
  const [rows] = await mysql.query<OrderReturnRow[]>(
    "SELECT id, order_id, user_name, user_email, sku, product_name, qty, price, order_status, return_status, remarks, created_at FROM order_returns"
  )

  for (const row of rows) {
    await pg.query(
      `
        INSERT INTO redington_order_return (id, order_id, user_name, user_email, sku, product_name, qty, price, order_status, return_status, remarks, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE
          SET user_name = EXCLUDED.user_name,
              user_email = EXCLUDED.user_email,
              price = EXCLUDED.price,
              order_status = EXCLUDED.order_status,
              return_status = EXCLUDED.return_status,
              remarks = EXCLUDED.remarks,
              updated_at = EXCLUDED.updated_at
      `,
      [
        row.id,
        row.order_id,
        row.user_name,
        row.user_email,
        row.sku,
        row.product_name,
        row.qty,
        parseNumeric(row.price),
        row.order_status,
        row.return_status,
        row.remarks,
        toDateString(row.created_at) ?? new Date().toISOString(),
        new Date().toISOString(),
      ]
    )
  }

  await resetSequence(pg, "redington_order_return")
}

const migrateProductEnquiries = async (
  mysql: MySqlPool,
  pg: PgPool
) => {
  await ensureRedingtonProductEnquiryTable()
  const [rows] = await mysql.query<ProductEnquiryRow[]>(
    `SELECT
      productenquiry_id,
      user_id,
      access_id,
      domain_id,
      company_code,
      product_id,
      comments,
      status,
      created_at,
      updated_at,
      fullname,
      email,
      productname,
      domainname,
      countryname,
      sku,
      price
    FROM redington_outofstockproductenquiry_productenquiry`
  )

  for (const row of rows) {
    await pg.query(
      `
        INSERT INTO redington_product_enquiry
          (id, user_id, access_id, domain_id, company_code, product_id, comments, status, created_at, updated_at, fullname, email, product_name, domain_name, country_name, sku, price)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        ON CONFLICT (id) DO UPDATE
          SET access_id = EXCLUDED.access_id,
              domain_id = EXCLUDED.domain_id,
              company_code = EXCLUDED.company_code,
              comments = EXCLUDED.comments,
              status = EXCLUDED.status,
              updated_at = EXCLUDED.updated_at,
              fullname = EXCLUDED.fullname,
              email = EXCLUDED.email,
              product_name = EXCLUDED.product_name,
              domain_name = EXCLUDED.domain_name,
              country_name = EXCLUDED.country_name,
              sku = EXCLUDED.sku,
              price = EXCLUDED.price
      `,
      [
        row.productenquiry_id,
        row.user_id,
        row.access_id,
        row.domain_id,
        row.company_code?.toString() ?? null,
        row.product_id,
        row.comments,
        row.status,
        toDateString(row.created_at) ?? new Date().toISOString(),
        toDateString(row.updated_at) ?? toDateString(row.created_at) ?? new Date().toISOString(),
        row.fullname,
        row.email,
        row.productname,
        row.domainname,
        row.countryname,
        row.sku,
        row.price,
      ]
    )
  }

  await resetSequence(pg, "redington_product_enquiry")
}

const migrateMaxQtyRules = async (
  mysql: MySqlPool,
  pg: PgPool
) => {
  await ensureRedingtonMaxQtyRuleTable()
  const [rows] = await mysql.query<MaxQtyRuleRow[]>(
    "SELECT id, brand_id, max_qty, created_at, updated_at, category_id, company_code, domain_id FROM epp_max_order_qty"
  )

  const globalDomainIds: number[] = []

  for (const row of rows) {
    const domainId = normalizeDomainId(row.domain_id)
    if (
      domainId === null &&
      typeof row.domain_id === "number" &&
      row.domain_id === 0
    ) {
      globalDomainIds.push(row.id)
    }

    await pg.query(
      `
        DELETE FROM redington_max_qty_rule
        WHERE id = $1
           OR (
             category_id = $2 AND brand_id = $3 AND company_code = $4 AND
             ((domain_id IS NULL AND $5::INTEGER IS NULL) OR domain_id = $5::INTEGER)
           )
      `,
      [row.id, row.category_id, row.brand_id, row.company_code, domainId]
    )

    await pg.query(
      `
        INSERT INTO redington_max_qty_rule
          (id, category_id, brand_id, company_code, domain_id, max_qty, created_at, updated_at)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8)
      `,
      [
        row.id,
        row.category_id,
        row.brand_id,
        row.company_code,
        domainId,
        row.max_qty,
        toDateString(row.created_at) ?? new Date().toISOString(),
        toDateString(row.updated_at) ?? new Date().toISOString(),
      ]
    )
  }

  await resetSequence(pg, "redington_max_qty_rule")

  if (globalDomainIds.length) {
    const sample = globalDomainIds.slice(0, 10).join(", ")
    console.warn(
      `Mapped ${globalDomainIds.length} max qty rule(s) with domain_id=0 to NULL (global scope).${sample ? ` Sample ids: ${sample}` : ""}`
    )
  }
}

const migrateMaxQtyCategories = async (
  mysql: MySqlPool,
  pg: PgPool
) => {
  await ensureRedingtonMaxQtyCategoryTable()
  const [rows] = await mysql.query<MaxQtyCategoryRow[]>(
    "SELECT id, category_id, brand_id, company_code, domain_id, max_qty, created_at, updated_at FROM epp_max_order_qty_category"
  )

  const globalDomainIds: number[] = []

  for (const row of rows) {
    const domainId = normalizeDomainId(row.domain_id)
    if (
      domainId === null &&
      typeof row.domain_id === "number" &&
      row.domain_id === 0
    ) {
      globalDomainIds.push(row.id)
    }

    await pg.query(
      `
        DELETE FROM redington_max_qty_category
        WHERE id = $1
           OR (
             category_ids = $2 AND brand_id = $3 AND company_code = $4 AND
             ((domain_id IS NULL AND $5::INTEGER IS NULL) OR domain_id = $5::INTEGER)
           )
      `,
      [row.id, row.category_id, row.brand_id, row.company_code, domainId]
    )

    await pg.query(
      `
        INSERT INTO redington_max_qty_category
          (id, category_ids, brand_id, company_code, domain_id, max_qty, created_at, updated_at)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8)
      `,
      [
        row.id,
        row.category_id,
        row.brand_id,
        row.company_code,
        domainId,
        row.max_qty,
        toDateString(row.created_at) ?? new Date().toISOString(),
        toDateString(row.updated_at) ?? new Date().toISOString(),
      ]
    )
  }

  await resetSequence(pg, "redington_max_qty_category")

  if (globalDomainIds.length) {
    const sample = globalDomainIds.slice(0, 10).join(", ")
    console.warn(
      `Mapped ${globalDomainIds.length} max qty category record(s) with domain_id=0 to NULL (global scope).${sample ? ` Sample ids: ${sample}` : ""}`
    )
  }
}

const migrateOrderQuantityTracker = async (
  mysql: MySqlPool,
  pg: PgPool
) => {
  await ensureRedingtonOrderQuantityTrackerTable()
  const [rows] = await mysql.query<OrderTrackerRow[]>(
    "SELECT id, customer_id, order_increment_id, sku, quantity, brand_id, created_at, updated_at FROM epp_order_tracker"
  )

  for (const row of rows) {
    await pg.query(
      `
        INSERT INTO redington_order_quantity_tracker
          (id, customer_id, order_increment_id, sku, quantity, brand_id, created_at, updated_at)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (id) DO UPDATE
          SET quantity = EXCLUDED.quantity,
              updated_at = EXCLUDED.updated_at
      `,
      [
        row.id,
        row.customer_id,
        row.order_increment_id,
        row.sku,
        row.quantity,
        row.brand_id,
        toDateString(row.created_at) ?? new Date().toISOString(),
        toDateString(row.updated_at) ?? new Date().toISOString(),
      ]
    )
  }

  await resetSequence(pg, "redington_order_quantity_tracker")
}

const migrateMpgsTransactions = async (
  mysql: MySqlPool,
  pg: PgPool
) => {
  await ensureRedingtonMpgsTransactionTable()
  const [rows] = await mysql.query<MpgsTransactionRow[]>(
    "SELECT id, order_ref_id, session_id, transaction_reference, order_increment_id, payment_status, session_version, result_indicator, order_status, transaction_receipt, created_at FROM redington_mpgs_transaction_data"
  )

  for (const row of rows) {
    await pg.query(
      `
        INSERT INTO redington_mpgs_transaction
          (id, order_ref_id, session_id, transaction_reference, order_increment_id, payment_status, session_version, result_indicator, order_status, transaction_receipt, created_at, updated_at)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (id) DO UPDATE
          SET payment_status = EXCLUDED.payment_status,
              session_version = EXCLUDED.session_version,
              result_indicator = EXCLUDED.result_indicator,
              order_status = EXCLUDED.order_status,
              transaction_receipt = EXCLUDED.transaction_receipt,
              updated_at = EXCLUDED.updated_at
      `,
      [
        row.id,
        row.order_ref_id,
        row.session_id,
        row.transaction_reference,
        row.order_increment_id,
        row.payment_status,
        row.session_version,
        row.result_indicator,
        row.order_status,
        row.transaction_receipt,
        toDateString(row.created_at) ?? new Date().toISOString(),
        new Date().toISOString(),
      ]
    )
  }

  await resetSequence(pg, "redington_mpgs_transaction")
}

const migrateProductPrices = async (
  mysql: MySqlPool,
  pg: PgPool
) => {
  await ensureRedingtonProductPriceTable()
  const [rows] = await mysql.query<ProductPriceRow[]>(
    `SELECT
      id,
      sku,
      country_code,
      company_code,
      brand_id,
      distribution_channel,
      product_base_price,
      product_special_price,
      from_date,
      to_date,
      created_at,
      updated_at,
      domain_id,
      status,
      promotion_channel
    FROM epp_product_price`
  )

  const globalDomainIds: number[] = []

  for (const row of rows) {
    const domainId = normalizeDomainId(row.domain_id)
    if (
      domainId === null &&
      typeof row.domain_id === "number" &&
      row.domain_id === 0
    ) {
      globalDomainIds.push(row.id)
    }

    await pg.query(
      `
        INSERT INTO redington_product_price
          (id, sku, country_code, company_code, brand_id, distribution_channel, domain_id, product_base_price, product_special_price, is_active, promotion_channel, from_date, to_date, created_at, updated_at)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        ON CONFLICT (id) DO UPDATE
          SET sku = EXCLUDED.sku,
              country_code = EXCLUDED.country_code,
              company_code = EXCLUDED.company_code,
              brand_id = EXCLUDED.brand_id,
              distribution_channel = EXCLUDED.distribution_channel,
              domain_id = EXCLUDED.domain_id,
              product_base_price = EXCLUDED.product_base_price,
              product_special_price = EXCLUDED.product_special_price,
              is_active = EXCLUDED.is_active,
              promotion_channel = EXCLUDED.promotion_channel,
              from_date = EXCLUDED.from_date,
              to_date = EXCLUDED.to_date,
              updated_at = EXCLUDED.updated_at
      `,
      [
        row.id,
        row.sku,
        row.country_code,
        row.company_code,
        row.brand_id,
        row.distribution_channel,
        domainId,
        row.product_base_price,
        row.product_special_price,
        normalizeBoolean(row.status),
        row.promotion_channel,
        toDateString(row.from_date),
        toDateString(row.to_date),
        toDateString(row.created_at) ?? new Date().toISOString(),
        toDateString(row.updated_at) ?? new Date().toISOString(),
      ]
    )
  }

  await resetSequence(pg, "redington_product_price")

  if (globalDomainIds.length) {
    const sample = globalDomainIds.slice(0, 10).join(", ")
    console.warn(
      `Mapped ${globalDomainIds.length} product price record(s) with domain_id=0 to NULL (global scope).${sample ? ` Sample ids: ${sample}` : ""}`
    )
  }
}

const migrateRetainCartConfigs = async (
  mysql: MySqlPool,
  pg: PgPool
) => {
  await ensureRedingtonRetainCartConfigTable()

  const [rows] = await mysql.query<RetainCartConfig[]>(
    "SELECT retaincartpaymentime_id, retrytime, domain_id, enable_disable, addbcc FROM retaincartpaymentime"
  )

  for (const row of rows) {
    const domainId = row.domain_id ? normalizeDomainId(Number(row.domain_id)) : null
    const retrySeconds = parseRetryTimeToSeconds(row.retrytime)
    const isActive = row.enable_disable === null ? true : Boolean(row.enable_disable)
    const addBcc = row.addbcc ? row.addbcc : null

    await pg.query(
      `
        INSERT INTO redington_retain_cart_config (id, domain_id, retry_time_seconds, add_bcc, is_active)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE
          SET domain_id = EXCLUDED.domain_id,
              retry_time_seconds = EXCLUDED.retry_time_seconds,
              add_bcc = EXCLUDED.add_bcc,
              is_active = EXCLUDED.is_active,
              updated_at = NOW()
      `,
      [
        row.retaincartpaymentime_id,
        domainId,
        retrySeconds,
        addBcc,
        isActive,
      ]
    )
  }

  await resetSequence(pg, "redington_retain_cart_config")
}

const main = async () => {
  const mysqlPool = createPool(MYSQL_CONFIG)
  const pgPool = getPgPool()

  try {
    await migrateHomeVideos(mysqlPool, pgPool)
    await migrateOrderReturns(mysqlPool, pgPool)
    await migrateProductEnquiries(mysqlPool, pgPool)
    await migrateCompanyCodes(mysqlPool, pgPool)
    await migrateCurrencyMappings(mysqlPool, pgPool)
    await migrateOtps(mysqlPool, pgPool)
    await migrateOrderShipments(mysqlPool, pgPool)
    await migrateOrderCcEmails(mysqlPool, pgPool)
    await migrateMaxQtyRules(mysqlPool, pgPool)
    await migrateMaxQtyCategories(mysqlPool, pgPool)
    await migrateOrderQuantityTracker(mysqlPool, pgPool)
    await migrateMpgsTransactions(mysqlPool, pgPool)
    await migrateRetainCartConfigs(mysqlPool, pgPool)
    await migrateProductPrices(mysqlPool, pgPool)
    console.log("Redington tables migrated successfully.")
  } catch (error) {
    console.error("Migration failed:", error)
    process.exitCode = 1
  } finally {
    await mysqlPool.end()
    await pgPool.end()
  }
}

if (require.main === module) {
  main()
}
