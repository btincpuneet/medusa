import { Pool } from "pg"

let pool: Pool | null = null
let domainTableInitialized = false
let domainAuthTableInitialized = false
let domainExtentionTableInitialized = false
let companyCodeTableInitialized = false
let accessMappingTableInitialized = false
let currencyMappingTableInitialized = false
let adminRoleTableInitialized = false
let adminRoleAssignmentTableInitialized = false
let addBccTableInitialized = false
let cookiePolicyTableInitialized = false
let cmsPageTableInitialized = false
let domainOutOfStockTableInitialized = false
let customerNumberTableInitialized = false
let getInTouchTableInitialized = false
let couponRuleTableInitialized = false
let settingsTableInitialized = false
let guestTokenTableInitialized = false
let otpTableInitialized = false
let homeVideoTableInitialized = false
let orderReturnTableInitialized = false
let productEnquiryTableInitialized = false
let mpgsTransactionTableInitialized = false
let maxQtyRuleTableInitialized = false
let maxQtyCategoryTableInitialized = false
let orderQtyTrackerTableInitialized = false
let orderShipmentTableInitialized = false
let orderCcEmailTableInitialized = false
let productPriceTableInitialized = false
let guestUserAuditTableInitialized = false
let invoiceAuditTableInitialized = false
let customerSyncTableInitialized = false
let retainCartConfigTableInitialized = false
let bannerSliderTableInitialized = false
let directoryCountryTableInitialized = false
let directoryRegionTableInitialized = false
let productDescImportTableInitialized = false

export function getPgPool(): Pool {
  if (pool) {
    return pool
  }

  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL env variable is required for the Redington domain module."
    )
  }

  pool = new Pool({
    connectionString,
  })

  return pool
}

export async function ensureRedingtonDomainTable() {
  if (domainTableInitialized) {
    return
  }

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_domain (
      id SERIAL PRIMARY KEY,
      domain_name TEXT NOT NULL UNIQUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  domainTableInitialized = true
}

export async function ensureRedingtonDomainAuthTable() {
  if (domainAuthTableInitialized) {
    return
  }

  await ensureRedingtonDomainTable()

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_domain_auth (
      id SERIAL PRIMARY KEY,
      domain_id INTEGER NOT NULL REFERENCES redington_domain(id) ON DELETE CASCADE,
      auth_type INTEGER NOT NULL,
      email_otp BOOLEAN NOT NULL DEFAULT TRUE,
      mobile_otp BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT redington_domain_auth_domain_unique UNIQUE (domain_id)
    );
  `)

  domainAuthTableInitialized = true
}

export async function ensureRedingtonDomainExtentionTable() {
  if (domainExtentionTableInitialized) {
    return
  }

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_domain_extention (
      id SERIAL PRIMARY KEY,
      domain_extention_name TEXT NOT NULL UNIQUE,
      status BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  domainExtentionTableInitialized = true
}

export async function ensureRedingtonDirectoryCountryTable() {
  if (directoryCountryTableInitialized) {
    return
  }

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_directory_country (
      country_id TEXT PRIMARY KEY,
      iso2_code TEXT,
      iso3_code TEXT,
      name TEXT
    );
  `)

  directoryCountryTableInitialized = true
}

export async function ensureRedingtonDirectoryRegionTable() {
  if (directoryRegionTableInitialized) {
    return
  }

  await ensureRedingtonDirectoryCountryTable()

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_directory_country_region (
      region_id SERIAL PRIMARY KEY,
      country_id TEXT NOT NULL REFERENCES redington_directory_country(country_id) ON DELETE CASCADE,
      code TEXT,
      name TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  directoryRegionTableInitialized = true
}

export function mapDomainRow(row: any) {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  return {
    id: row.id,
    domain_name: row.domain_name,
    is_active: row.is_active,
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export async function findDomainById(id: number) {
  await ensureRedingtonDomainTable()

  const { rows } = await getPgPool().query(
    `
      SELECT id, domain_name, is_active, created_at, updated_at
      FROM redington_domain
      WHERE id = $1
    `,
    [id]
  )

  return rows[0] ? mapDomainRow(rows[0]) : null
}

const normalizeDomainName = (value: any): string | null => {
  if (typeof value !== "string") {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export async function listActiveDomainNames(): Promise<string[]> {
  await ensureRedingtonDomainTable()

  const { rows } = await getPgPool().query(
    `
      SELECT domain_name
      FROM redington_domain
      WHERE is_active = TRUE
      ORDER BY domain_name ASC
    `
  )

  return rows
    .map((row) => normalizeDomainName(row.domain_name))
    .filter((value): value is string => Boolean(value))
}

export function mapDomainAuthRow(row: any) {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  const parsedDomainId = Number(row.domain_id)

  return {
    id: row.id,
    domain_id: Number.isFinite(parsedDomainId) ? parsedDomainId : undefined,
    domain_name:
      typeof row.domain_name === "string" && row.domain_name.length
        ? row.domain_name
        : undefined,
    auth_type: Number.isFinite(Number(row.auth_type))
      ? Number(row.auth_type)
      : undefined,
    email_otp:
      typeof row.email_otp === "boolean"
        ? row.email_otp
        : Boolean(row.email_otp),
    mobile_otp:
      typeof row.mobile_otp === "boolean"
        ? row.mobile_otp
        : Boolean(row.mobile_otp),
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export function mapDomainExtentionRow(row: any) {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  return {
    id: row.id,
    domain_extention_name: row.domain_extention_name,
    status: typeof row.status === "boolean" ? row.status : Boolean(row.status),
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export async function listActiveDomainExtensionNames(): Promise<string[]> {
  await ensureRedingtonDomainExtentionTable()

  const { rows } = await getPgPool().query(
    `
      SELECT domain_extention_name
      FROM redington_domain_extention
      WHERE status = TRUE
      ORDER BY domain_extention_name ASC
    `
  )

  return rows
    .map((row) => normalizeDomainName(row.domain_extention_name))
    .filter((value): value is string => Boolean(value))
}

export type BannerSliderRow = {
  id: number
  identifier: string
  title: string
  status: boolean
  banners: Array<{
    id: number
    title: string
    image_url: string | null
    link_url: string | null
    sort_order: number
  }>
}

export async function ensureRedingtonBannerSliderTables() {
  if (bannerSliderTableInitialized) {
    return
  }

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_banner_slider (
      id SERIAL PRIMARY KEY,
      identifier TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      status BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await getPgPool().query(`
    ALTER TABLE redington_banner_slider
      ADD COLUMN IF NOT EXISTS identifier TEXT,
      ADD COLUMN IF NOT EXISTS title TEXT,
      ADD COLUMN IF NOT EXISTS status BOOLEAN;
  `)

  await getPgPool().query(`
    DO $convert$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'redington_banner_slider'
          AND column_name = 'status'
          AND udt_name <> 'bool'
      ) THEN
        EXECUTE '
          ALTER TABLE redington_banner_slider
          ALTER COLUMN status DROP DEFAULT
        ';
        EXECUTE '
          ALTER TABLE redington_banner_slider
          ALTER COLUMN status TYPE BOOLEAN
          USING (
            CASE
              WHEN status IS NULL THEN TRUE
              WHEN status::text IN (''1'', ''true'', ''t'', ''yes'', ''on'') THEN TRUE
              ELSE FALSE
            END
          )
        ';
      END IF;
    END
    $convert$;
  `)

  await getPgPool().query(`
    ALTER TABLE redington_banner_slider
      ALTER COLUMN status SET DEFAULT TRUE;
  `)

  await getPgPool().query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'redington_banner_slider_identifier_idx'
      ) THEN
        CREATE UNIQUE INDEX redington_banner_slider_identifier_idx
          ON redington_banner_slider (identifier)
          WHERE identifier IS NOT NULL;
      END IF;
    END $$;
  `)

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_banner (
      id SERIAL PRIMARY KEY,
      slider_id INTEGER,
      title TEXT NOT NULL,
      image_url TEXT,
      link_url TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      status BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await getPgPool().query(`
    ALTER TABLE redington_banner
      ADD COLUMN IF NOT EXISTS slider_id INTEGER;
  `)

  await getPgPool().query(`
    ALTER TABLE redington_banner
      ADD COLUMN IF NOT EXISTS image_url TEXT,
      ADD COLUMN IF NOT EXISTS link_url TEXT,
      ADD COLUMN IF NOT EXISTS sort_order INTEGER;
  `)

  await getPgPool().query(`
    ALTER TABLE redington_banner
      ALTER COLUMN sort_order SET DEFAULT 0;
  `)

  await getPgPool().query(`
    UPDATE redington_banner
       SET image_url = COALESCE(image_url, image),
           link_url = COALESCE(link_url, url_banner),
           sort_order = COALESCE(sort_order, 0)
     WHERE image_url IS NULL
        OR link_url IS NULL
        OR sort_order IS NULL;
  `)

  await getPgPool().query(`
    DO $convert$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'redington_banner'
          AND column_name = 'status'
          AND udt_name <> 'bool'
      ) THEN
        EXECUTE '
          ALTER TABLE redington_banner
          ALTER COLUMN status DROP DEFAULT
        ';
        EXECUTE '
          ALTER TABLE redington_banner
          ALTER COLUMN status TYPE BOOLEAN
          USING (
            CASE
              WHEN status IS NULL THEN TRUE
              WHEN status::text IN (''1'', ''true'', ''t'', ''yes'', ''on'') THEN TRUE
              ELSE FALSE
            END
          )
        ';
      END IF;
    END
    $convert$;
  `)

  await getPgPool().query(`
    ALTER TABLE redington_banner
      ALTER COLUMN status SET DEFAULT TRUE;
  `)

  await getPgPool().query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'redington_banner'
          AND constraint_name = 'redington_banner_slider_fk'
      ) THEN
        ALTER TABLE redington_banner
          DROP CONSTRAINT IF EXISTS redington_banner_slider_fk;
        ALTER TABLE redington_banner
          ADD CONSTRAINT redington_banner_slider_fk
          FOREIGN KEY (slider_id)
          REFERENCES redington_banner_slider(id)
          ON DELETE CASCADE;
      END IF;
    END $$;
  `)

  bannerSliderTableInitialized = true
}

export async function listActiveBannerSliders(): Promise<BannerSliderRow[]> {
  await ensureRedingtonBannerSliderTables()

  const { rows } = await getPgPool().query(
    `
      SELECT s.id,
             s.identifier,
             s.title,
             s.status,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', b.id,
                   'title', b.title,
                   'image_url', b.image_url,
                   'link_url', b.link_url,
                   'sort_order', b.sort_order
                 )
                 ORDER BY b.sort_order ASC, b.id ASC
               ) FILTER (WHERE b.id IS NOT NULL),
               '[]'::json
             ) AS banners
      FROM redington_banner_slider s
      LEFT JOIN redington_banner b
        ON b.slider_id = s.id
        AND COALESCE(b.status::text, 'true') NOT IN ('false', '0')
      WHERE COALESCE(s.status::text, 'true') NOT IN ('false', '0')
      GROUP BY s.id
      ORDER BY s.id ASC
    `
  )

  return rows.map((row) => ({
    id: Number(row.id),
    identifier: typeof row.identifier === "string" ? row.identifier : "",
    title: typeof row.title === "string" ? row.title : "",
    status: typeof row.status === "boolean" ? row.status : Boolean(row.status),
    banners: Array.isArray(row.banners)
      ? row.banners.map((banner: any) => ({
          id: Number(banner.id),
          title: typeof banner.title === "string" ? banner.title : "",
          image_url:
            typeof banner.image_url === "string" && banner.image_url.length
              ? banner.image_url
              : null,
          link_url:
            typeof banner.link_url === "string" && banner.link_url.length
              ? banner.link_url
              : null,
          sort_order: Number(banner.sort_order ?? 0),
        }))
      : [],
  }))
}

const normalizeCountryId = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length ? trimmed.toUpperCase() : null
}

export async function findDirectoryCountryWithRegions(countryId: string) {
  const normalized = normalizeCountryId(countryId)
  if (!normalized) {
    return null
  }

  await ensureRedingtonDirectoryCountryTable()
  await ensureRedingtonDirectoryRegionTable()

  const { rows } = await getPgPool().query(
    `
      SELECT country_id, iso2_code, iso3_code, name
      FROM redington_directory_country
      WHERE UPPER(country_id) = $1
      LIMIT 1
    `,
    [normalized]
  )

  if (!rows.length) {
    return null
  }

  const [country] = rows

  const { rows: regionRows } = await getPgPool().query(
    `
      SELECT region_id, country_id, code, name
      FROM redington_directory_country_region
      WHERE UPPER(country_id) = $1
      ORDER BY sort_order ASC, name ASC, region_id ASC
    `,
    [normalized]
  )

  return {
    country_id: country.country_id,
    iso2_code: country.iso2_code,
    iso3_code: country.iso3_code,
    name: country.name,
    regions: regionRows.map((region) => ({
      region_id: Number(region.region_id),
      country_id: region.country_id,
      code:
        typeof region.code === "string" && region.code.trim().length
          ? region.code
          : null,
      name:
        typeof region.name === "string" && region.name.trim().length
          ? region.name
          : null,
    })),
  }
}

export async function findDomainExtentionById(id: number) {
  await ensureRedingtonDomainExtentionTable()

  const { rows } = await getPgPool().query(
    `
      SELECT id, domain_extention_name, status, created_at, updated_at
      FROM redington_domain_extention
      WHERE id = $1
    `,
    [id]
  )

  return rows[0] ? mapDomainExtentionRow(rows[0]) : null
}

export async function ensureRedingtonCompanyCodeTable() {
  if (companyCodeTableInitialized) {
    return
  }

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_company_code (
      id SERIAL PRIMARY KEY,
      country_code TEXT NOT NULL UNIQUE,
      company_code TEXT NOT NULL,
      status BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  companyCodeTableInitialized = true
}

export function mapCompanyCodeRow(row: any) {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  return {
    id: row.id,
    country_code: typeof row.country_code === "string" ? row.country_code : "",
    company_code: typeof row.company_code === "string" ? row.company_code : "",
    status: typeof row.status === "boolean" ? row.status : Boolean(row.status),
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export async function findCompanyCodeByCode(companyCode: string) {
  await ensureRedingtonCompanyCodeTable()

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_company_code
      WHERE company_code = $1
      LIMIT 1
    `,
    [companyCode]
  )

  return rows[0] ? mapCompanyCodeRow(rows[0]) : null
}

function parseBrandIds(input: any): string[] {
  if (!input) {
    return []
  }

  if (Array.isArray(input)) {
    return input.map((entry) => String(entry)).filter(Boolean)
  }

  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input)
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => String(entry)).filter(Boolean)
      }
    } catch (err) {
      // fall back to comma separated values
      return input
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    }

    return input
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  return []
}

export async function ensureRedingtonAccessMappingTable() {
  if (accessMappingTableInitialized) {
    return
  }

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_access_mapping (
      id SERIAL PRIMARY KEY,
      access_id TEXT NOT NULL,
      country_code TEXT NOT NULL,
      mobile_ext TEXT NOT NULL,
      company_code TEXT NOT NULL,
      brand_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
      domain_id INTEGER NOT NULL,
      domain_extention_id INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await getPgPool().query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'redington_access_mapping'
          AND column_name = 'access_id'
      ) THEN
        ALTER TABLE redington_access_mapping
        ADD COLUMN access_id TEXT;
      END IF;
    END;
    $$;
  `)

  accessMappingTableInitialized = true
}

export function mapAccessMappingRow(row: any) {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  return {
    id: row.id,
    access_id: typeof row.access_id === "string" ? row.access_id : null,
    country_code: typeof row.country_code === "string" ? row.country_code : "",
    mobile_ext: typeof row.mobile_ext === "string" ? row.mobile_ext : "",
    company_code: typeof row.company_code === "string" ? row.company_code : "",
    brand_ids: parseBrandIds(row.brand_ids),
    domain_id: Number.isFinite(Number(row.domain_id))
      ? Number(row.domain_id)
      : undefined,
    domain_extention_id: Number.isFinite(Number(row.domain_extention_id))
      ? Number(row.domain_extention_id)
      : undefined,
    domain_name: typeof row.domain_name === "string" ? row.domain_name : undefined,
    domain_extention_name:
      typeof row.domain_extention_name === "string"
        ? row.domain_extention_name
        : undefined,
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export async function findAccessMappingByAccessId(
  accessId: string,
  options: { companyCode?: string } = {}
) {
  await ensureRedingtonAccessMappingTable()

  const params: any[] = [accessId]
  let where = "access_id = $1"

  if (options.companyCode) {
    params.push(options.companyCode)
    where += ` AND company_code = $${params.length}`
  }

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_access_mapping
      WHERE ${where}
      ORDER BY updated_at DESC
      LIMIT 1
    `,
    params
  )

  return rows[0] ? mapAccessMappingRow(rows[0]) : null
}

export type AddBccRow = {
  id: number
  domain_id: number | null
  bcc_emails: string[]
  created_at: string
  updated_at: string
}

export async function ensureRedingtonAddBccTable() {
  if (addBccTableInitialized) {
    return
  }

  await ensureRedingtonDomainTable()

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_add_bcc (
      id SERIAL PRIMARY KEY,
      domain_id INTEGER REFERENCES redington_domain(id) ON DELETE CASCADE,
      bcc_emails TEXT,
      CONSTRAINT redington_add_bcc_domain_unique UNIQUE (domain_id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  addBccTableInitialized = true
}

export type RetainCartConfigRow = {
  id: number
  domain_id: number | null
  retry_time: string
  add_bcc: string[]
  is_active: boolean
  created_at: string
  updated_at: string
  domain_name?: string | null
}

const formatRetryTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "00:00:00"
  }
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  return `${hrs.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

const parseRetryTimeInput = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value))
  }
  if (typeof value === "string" && value.trim().length) {
    const normalized = value.trim()
    const parts = normalized.split(":").map((part) => Number(part))
    if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
      const [h, m, s] = parts
      return Math.max(0, h * 3600 + m * 60 + s)
    }
    const numeric = Number(normalized)
    if (Number.isFinite(numeric)) {
      return Math.max(0, Math.floor(numeric))
    }
  }
  return 7200 // default 2 hours
}

export async function ensureRedingtonRetainCartConfigTable() {
  if (retainCartConfigTableInitialized) {
    return
  }

  await ensureRedingtonDomainTable()

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_retain_cart_config (
      id SERIAL PRIMARY KEY,
      domain_id INTEGER REFERENCES redington_domain(id) ON DELETE CASCADE,
      retry_time_seconds INTEGER NOT NULL DEFAULT 7200,
      add_bcc TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT redington_retain_cart_domain_unique UNIQUE (domain_id)
    );
  `)

  retainCartConfigTableInitialized = true
}

export function mapRetainCartConfigRow(row: any): RetainCartConfigRow {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  const domainId =
    row.domain_id !== null && row.domain_id !== undefined
      ? Number(row.domain_id)
      : null

  const retrySeconds = Number(row.retry_time_seconds)
  const addBcc =
    typeof row.add_bcc === "string" && row.add_bcc.length
      ? row.add_bcc.split(",").map((entry: string) => entry.trim()).filter(Boolean)
      : []

  return {
    id: Number(row.id),
    domain_id: Number.isFinite(domainId as number) ? domainId : null,
    retry_time: formatRetryTime(Number.isFinite(retrySeconds) ? retrySeconds : 7200),
    add_bcc: addBcc,
    is_active:
      typeof row.is_active === "boolean" ? row.is_active : Boolean(row.is_active),
    created_at: createdAt,
    updated_at: updatedAt,
    domain_name:
      typeof row.domain_name === "string" && row.domain_name.length
        ? row.domain_name
        : null,
  }
}

export async function listRetainCartConfigs(): Promise<RetainCartConfigRow[]> {
  await ensureRedingtonRetainCartConfigTable()
  const { rows } = await getPgPool().query(
    `
      SELECT rcc.*, d.domain_name
      FROM redington_retain_cart_config rcc
      LEFT JOIN redington_domain d ON d.id = rcc.domain_id
      ORDER BY rcc.updated_at DESC
    `
  )

  return rows.map((row) => mapRetainCartConfigRow(row))
}

export async function upsertRetainCartConfig(options: {
  id?: number
  domain_id?: number | null
  retry_time?: string | number
  add_bcc?: string[] | string | null
  is_active?: boolean
}): Promise<RetainCartConfigRow> {
  await ensureRedingtonRetainCartConfigTable()

  const domainId =
    options.domain_id === undefined || options.domain_id === null
      ? null
      : Number(options.domain_id)
  const retrySeconds = parseRetryTimeInput(options.retry_time ?? 7200)
  const addBccArray = Array.isArray(options.add_bcc)
    ? options.add_bcc
    : typeof options.add_bcc === "string"
      ? options.add_bcc
          .split(/[\n,]+/)
          .map((entry) => entry.trim())
          .filter(Boolean)
      : []
  const serializedBcc = addBccArray.join(",")
  const isActive =
    options.is_active === undefined ? true : Boolean(options.is_active)

  const params = [domainId, retrySeconds, serializedBcc, isActive]

  let query: string
  if (options.id) {
    query = `
      UPDATE redington_retain_cart_config
      SET domain_id = $1,
          retry_time_seconds = $2,
          add_bcc = $3,
          is_active = $4,
          updated_at = NOW()
      WHERE id = ${options.id}
      RETURNING *
    `
  } else {
    query = `
      INSERT INTO redington_retain_cart_config (domain_id, retry_time_seconds, add_bcc, is_active)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (domain_id) DO UPDATE
        SET retry_time_seconds = EXCLUDED.retry_time_seconds,
            add_bcc = EXCLUDED.add_bcc,
            is_active = EXCLUDED.is_active,
            updated_at = NOW()
      RETURNING *
    `
  }

  const { rows } = await getPgPool().query(query, params)
  return mapRetainCartConfigRow(rows[0])
}

export async function deleteRetainCartConfig(id: number) {
  await ensureRedingtonRetainCartConfigTable()
  await getPgPool().query(
    `
      DELETE FROM redington_retain_cart_config
      WHERE id = $1
    `,
    [id]
  )
}

export async function findRetainCartConfigByDomainId(
  domainId: number | null
): Promise<RetainCartConfigRow | null> {
  await ensureRedingtonRetainCartConfigTable()

  const params: any[] = []
  let where = "domain_id IS NULL"

  if (domainId !== null && domainId !== undefined) {
    where = "domain_id = $1"
    params.push(domainId)
  }

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_retain_cart_config
      WHERE ${where}
      ORDER BY updated_at DESC
      LIMIT 1
    `,
    params
  )

  return rows[0] ? mapRetainCartConfigRow(rows[0]) : null
}

export function mapAddBccRow(row: any): AddBccRow {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  const domainId =
    row.domain_id !== null && row.domain_id !== undefined
      ? Number(row.domain_id)
      : null

  const emailsRaw = typeof row.bcc_emails === "string" ? row.bcc_emails : ""
  const emails = emailsRaw
    ? emailsRaw
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    : []

  return {
    id: Number(row.id),
    domain_id: domainId && Number.isFinite(domainId) ? domainId : null,
    bcc_emails: emails,
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export async function ensureRedingtonCurrencyMappingTable() {
  if (currencyMappingTableInitialized) {
    return
  }

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_currency_mapping (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      company_code TEXT NOT NULL,
      country_name TEXT NOT NULL,
      country_code TEXT NOT NULL,
      currency_code TEXT NOT NULL,
      decimal_place INTEGER NOT NULL DEFAULT 2,
      payment_method TEXT NOT NULL,
      shipment_tracking_url TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  currencyMappingTableInitialized = true
}

export function mapCurrencyMappingRow(row: any) {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  return {
    id: row.id,
    name: typeof row.name === "string" ? row.name : "",
    company_code: typeof row.company_code === "string" ? row.company_code : "",
    country_name: typeof row.country_name === "string" ? row.country_name : "",
    country_code: typeof row.country_code === "string" ? row.country_code : "",
    currency_code: typeof row.currency_code === "string" ? row.currency_code : "",
    decimal_place: Number.isFinite(Number(row.decimal_place))
      ? Number(row.decimal_place)
      : 0,
    payment_method:
      typeof row.payment_method === "string" ? row.payment_method : "",
    shipment_tracking_url:
      typeof row.shipment_tracking_url === "string"
        ? row.shipment_tracking_url
        : "",
    is_active:
      typeof row.is_active === "boolean" ? row.is_active : Boolean(row.is_active),
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export type CookiePolicyRow = {
  id: number
  document_url: string | null
  status: string | null
  created_at: string
  updated_at: string
}

export async function ensureRedingtonCookiePolicyTable() {
  if (cookiePolicyTableInitialized) {
    return
  }

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_cookie_policy (
      id SERIAL PRIMARY KEY,
      document_url TEXT,
      status TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  cookiePolicyTableInitialized = true
}

export function mapCookiePolicyRow(row: any): CookiePolicyRow {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  return {
    id: Number(row.id),
    document_url:
      typeof row.document_url === "string" && row.document_url.length
        ? row.document_url
        : null,
    status:
      typeof row.status === "string" && row.status.length ? row.status : null,
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export type CmsPageRow = {
  id: number
  slug: string
  title: string
  content: string
  country_code: string | null
  domain_id: number | null
  access_id: string | null
  is_active: boolean
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export async function ensureRedingtonCmsPageTable() {
  if (cmsPageTableInitialized) {
    return
  }

  await ensureRedingtonDomainTable()

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_cms_page (
      id SERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      country_code TEXT,
      domain_id INTEGER REFERENCES redington_domain(id) ON DELETE SET NULL,
      access_id TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  cmsPageTableInitialized = true
}

export async function ensureRedingtonGuestTokenTable() {
  if (guestTokenTableInitialized) {
    return
  }

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_guest_token (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      token TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  guestTokenTableInitialized = true
}

export type GuestTokenRow = {
  id: number
  email: string
  token: string
  expires_at: string
}

export async function findActiveGuestToken(
  token: string
): Promise<GuestTokenRow | null> {
  await ensureRedingtonGuestTokenTable()

  const { rows } = await getPgPool().query(
    `
      SELECT id, email, token, expires_at
      FROM redington_guest_token
      WHERE token = $1
      LIMIT 1
    `,
    [token]
  )

  if (!rows[0]) {
    return null
  }

  const expiresAt =
    rows[0].expires_at instanceof Date
      ? rows[0].expires_at
      : new Date(rows[0].expires_at)

  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
    return null
  }

  return {
    id: Number(rows[0].id),
    email: typeof rows[0].email === "string" ? rows[0].email : "",
    token: typeof rows[0].token === "string" ? rows[0].token : "",
    expires_at: expiresAt.toISOString(),
  }
}

export async function ensureRedingtonOtpTable() {
  if (otpTableInitialized) {
    return
  }

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_otp (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      action TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT redington_otp_email_action_idx UNIQUE (email, action)
    );
  `)

  otpTableInitialized = true
}

export type OtpRow = {
  id: number
  email: string
  action: string
  code: string
  expires_at: string
  consumed_at: string | null
  created_at: string
  updated_at: string
}

export function mapOtpRow(row: any): OtpRow {
  const toIso = (value: any): string => {
    if (value instanceof Date) {
      return value.toISOString()
    }
    return String(value ?? "")
  }

  const toNullableIso = (value: any): string | null => {
    if (value === null || value === undefined) {
      return null
    }
    if (value instanceof Date) {
      return value.toISOString()
    }
    const str = String(value)
    return str.length ? str : null
  }

  return {
    id: Number(row.id),
    email: typeof row.email === "string" ? row.email : "",
    action: typeof row.action === "string" ? row.action : "",
    code: typeof row.code === "string" ? row.code : String(row.code ?? ""),
    expires_at: toIso(row.expires_at),
    consumed_at: toNullableIso(row.consumed_at),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  }
}

export function mapCmsPageRow(row: any): CmsPageRow {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  const metadata =
    typeof row.metadata === "object" && row.metadata !== null
      ? row.metadata
      : (() => {
          if (typeof row.metadata === "string" && row.metadata.length) {
            try {
              return JSON.parse(row.metadata)
            } catch {
              return {}
            }
          }
          return {}
        })()

  const domainId =
    row.domain_id !== null && row.domain_id !== undefined
      ? Number(row.domain_id)
      : null

  return {
    id: Number(row.id),
    slug: typeof row.slug === "string" ? row.slug : "",
    title: typeof row.title === "string" ? row.title : "",
    content: typeof row.content === "string" ? row.content : "",
    country_code:
      typeof row.country_code === "string" && row.country_code.length
        ? row.country_code
        : null,
    domain_id: domainId && Number.isFinite(domainId) ? domainId : null,
    access_id:
      typeof row.access_id === "string" && row.access_id.length
        ? row.access_id
        : null,
    is_active:
      typeof row.is_active === "boolean"
        ? row.is_active
        : Boolean(row.is_active),
    metadata: metadata as Record<string, unknown>,
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export type DomainOutOfStockRow = {
  id: number
  domain_id: number
  status: boolean
  created_at: string
  updated_at: string
}

export async function ensureRedingtonDomainOutOfStockTable() {
  if (domainOutOfStockTableInitialized) {
    return
  }

  await ensureRedingtonDomainTable()

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_domain_out_of_stock (
      id SERIAL PRIMARY KEY,
      domain_id INTEGER NOT NULL UNIQUE REFERENCES redington_domain(id) ON DELETE CASCADE,
      status BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  domainOutOfStockTableInitialized = true
}

export function mapDomainOutOfStockRow(row: any): DomainOutOfStockRow {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  return {
    id: Number(row.id),
    domain_id: Number(row.domain_id),
    status:
      typeof row.status === "boolean" ? row.status : Boolean(row.status),
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export type CustomerNumberRow = {
  id: number
  company_code: string
  distribution_channel: string
  brand_id: string
  domain_id: number
  customer_number: string
  created_at: string
  updated_at: string
}

export async function ensureRedingtonCustomerNumberTable() {
  if (customerNumberTableInitialized) {
    return
  }

  await ensureRedingtonDomainTable()

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_customer_number (
      id SERIAL PRIMARY KEY,
      company_code TEXT NOT NULL,
      distribution_channel TEXT NOT NULL,
      brand_id TEXT NOT NULL,
      domain_id INTEGER NOT NULL REFERENCES redington_domain(id) ON DELETE CASCADE,
      customer_number TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  customerNumberTableInitialized = true
}

export function mapCustomerNumberRow(row: any): CustomerNumberRow {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  return {
    id: Number(row.id),
    company_code: typeof row.company_code === "string" ? row.company_code : "",
    distribution_channel:
      typeof row.distribution_channel === "string"
        ? row.distribution_channel
        : "",
    brand_id: typeof row.brand_id === "string" ? row.brand_id : "",
    domain_id: Number(row.domain_id),
    customer_number:
      typeof row.customer_number === "string" ? row.customer_number : "",
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export type HomeVideoRow = {
  id: number
  title: string
  url: string
  status: boolean
  created_at: string
  updated_at: string
}

export async function ensureRedingtonHomeVideoTable() {
  if (homeVideoTableInitialized) {
    return
  }

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_home_video (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      status BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  homeVideoTableInitialized = true
}

export function mapHomeVideoRow(row: any): HomeVideoRow {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  return {
    id: Number(row.id),
    title: typeof row.title === "string" ? row.title : "",
    url: typeof row.url === "string" ? row.url : "",
    status: typeof row.status === "boolean" ? row.status : Boolean(row.status),
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export async function listHomeVideos(): Promise<HomeVideoRow[]> {
  await ensureRedingtonHomeVideoTable()

  const { rows } = await getPgPool().query(
    `
      SELECT id, title, url, status, created_at, updated_at
      FROM redington_home_video
      ORDER BY created_at DESC
    `
  )

  return rows.map(mapHomeVideoRow)
}

export async function findHomeVideoById(
  id: number
): Promise<HomeVideoRow | null> {
  await ensureRedingtonHomeVideoTable()

  const { rows } = await getPgPool().query(
    `
      SELECT id, title, url, status, created_at, updated_at
      FROM redington_home_video
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  )

  return rows[0] ? mapHomeVideoRow(rows[0]) : null
}

type CreateHomeVideoInput = {
  title: string
  url: string
  status?: boolean
}

export async function createHomeVideo(
  input: CreateHomeVideoInput
): Promise<HomeVideoRow> {
  await ensureRedingtonHomeVideoTable()

  const status =
    typeof input.status === "boolean" ? input.status : Boolean(input.status)

  const { rows } = await getPgPool().query(
    `
      INSERT INTO redington_home_video (title, url, status)
      VALUES ($1, $2, $3)
      RETURNING id, title, url, status, created_at, updated_at
    `,
    [input.title, input.url, status ?? true]
  )

  return mapHomeVideoRow(rows[0])
}

type UpdateHomeVideoInput = {
  title?: string
  url?: string
  status?: boolean
}

export async function updateHomeVideo(
  id: number,
  updates: UpdateHomeVideoInput
): Promise<HomeVideoRow> {
  await ensureRedingtonHomeVideoTable()

  const existing = await findHomeVideoById(id)
  if (!existing) {
    throw new Error("Home video not found")
  }

  const nextTitle =
    updates.title !== undefined ? updates.title : existing.title
  const nextUrl = updates.url !== undefined ? updates.url : existing.url
  const nextStatus =
    updates.status !== undefined ? updates.status : existing.status

  const { rows } = await getPgPool().query(
    `
      UPDATE redington_home_video
      SET title = $2,
          url = $3,
          status = $4,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, title, url, status, created_at, updated_at
    `,
    [id, nextTitle, nextUrl, nextStatus]
  )

  return mapHomeVideoRow(rows[0])
}

export async function deleteHomeVideo(id: number): Promise<void> {
  await ensureRedingtonHomeVideoTable()
  await getPgPool().query(
    `
      DELETE FROM redington_home_video
      WHERE id = $1
    `,
    [id]
  )
}

export type OrderReturnRow = {
  id: number
  order_id: string
  user_name: string
  user_email: string
  sku: string
  product_name: string
  qty: number
  price: number | null
  order_status: string | null
  return_status: string | null
  remarks: string | null
  created_at: string
  updated_at: string
}

export async function ensureRedingtonOrderReturnTable() {
  if (orderReturnTableInitialized) {
    return
  }

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_order_return (
      id SERIAL PRIMARY KEY,
      order_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      sku TEXT NOT NULL,
      product_name TEXT NOT NULL,
      qty INTEGER NOT NULL DEFAULT 1,
      price NUMERIC(12,4),
      order_status TEXT,
      return_status TEXT,
      remarks TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  orderReturnTableInitialized = true
}

export function mapOrderReturnRow(row: any): OrderReturnRow {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  const qty = Number(row.qty)
  const priceRaw =
    typeof row.price === "number" ? row.price : Number(row.price ?? NaN)

  return {
    id: Number(row.id),
    order_id: typeof row.order_id === "string" ? row.order_id : "",
    user_name: typeof row.user_name === "string" ? row.user_name : "",
    user_email: typeof row.user_email === "string" ? row.user_email : "",
    sku: typeof row.sku === "string" ? row.sku : "",
    product_name:
      typeof row.product_name === "string" ? row.product_name : "",
    qty: Number.isFinite(qty) ? qty : 0,
    price: Number.isFinite(priceRaw) ? priceRaw : null,
    order_status:
      typeof row.order_status === "string" && row.order_status.length
        ? row.order_status
        : null,
    return_status:
      typeof row.return_status === "string" && row.return_status.length
        ? row.return_status
        : null,
    remarks:
      typeof row.remarks === "string" && row.remarks.length
        ? row.remarks
        : null,
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export type CreateOrderReturnInput = {
  order_id: string
  user_name: string
  user_email: string
  sku: string
  product_name: string
  qty: number
  price: number | null
  order_status?: string | null
  return_status?: string | null
  remarks?: string | null
}

export async function listOrderReturnsByEmail(
  email: string
): Promise<OrderReturnRow[]> {
  await ensureRedingtonOrderReturnTable()

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_order_return
      WHERE LOWER(user_email) = LOWER($1)
      ORDER BY created_at DESC
    `,
    [email]
  )

  return rows.map(mapOrderReturnRow)
}

export async function listOrderReturnsByOrder(
  orderId: string,
  options?: { email?: string }
): Promise<OrderReturnRow[]> {
  await ensureRedingtonOrderReturnTable()

  const values: any[] = [orderId]
  let filter = ""
  if (options?.email) {
    values.push(options.email)
    filter = "AND LOWER(user_email) = LOWER($2)"
  }

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_order_return
      WHERE order_id = $1
        ${filter}
      ORDER BY created_at DESC
    `,
    values
  )

  return rows.map(mapOrderReturnRow)
}

export async function insertOrderReturnEntries(
  entries: CreateOrderReturnInput[]
): Promise<OrderReturnRow[]> {
  if (!entries.length) {
    return []
  }

  await ensureRedingtonOrderReturnTable()

  const inserted: OrderReturnRow[] = []

  for (const entry of entries) {
    const {
      order_id,
      user_name,
      user_email,
      sku,
      product_name,
      qty,
      price,
      order_status,
      return_status,
      remarks,
    } = entry

    const { rows } = await getPgPool().query(
      `
        INSERT INTO redington_order_return (
          order_id,
          user_name,
          user_email,
          sku,
          product_name,
          qty,
          price,
          order_status,
          return_status,
          remarks
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING *
      `,
      [
        order_id,
        user_name,
        user_email,
        sku,
        product_name,
        qty,
        price,
        order_status ?? null,
        return_status ?? null,
        remarks ?? null,
      ]
    )

    if (rows[0]) {
      inserted.push(mapOrderReturnRow(rows[0]))
    }
  }

  return inserted
}

export type ProductEnquiryRow = {
  id: number
  user_id: number | null
  access_id: number | null
  domain_id: number | null
  company_code: string | null
  product_id: number | null
  fullname: string | null
  email: string | null
  product_name: string | null
  domain_name: string | null
  country_name: string | null
  sku: string | null
  price: string | null
  comments: string | null
  status: string | null
  created_at: string
  updated_at: string
}

export async function ensureRedingtonProductEnquiryTable() {
  if (productEnquiryTableInitialized) {
    return
  }

  await ensureRedingtonDomainTable()

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_product_enquiry (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      access_id INTEGER,
      domain_id INTEGER REFERENCES redington_domain(id) ON DELETE SET NULL,
      company_code TEXT,
      product_id INTEGER,
      fullname TEXT,
      email TEXT,
      product_name TEXT,
      domain_name TEXT,
      country_name TEXT,
      sku TEXT,
      price TEXT,
      comments TEXT,
      status TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  productEnquiryTableInitialized = true
}

export function mapProductEnquiryRow(row: any): ProductEnquiryRow {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  const parseNullableNumber = (value: any): number | null => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  const normalizeString = (value: any): string | null => {
    if (typeof value === "string") {
      const trimmed = value.trim()
      return trimmed.length ? trimmed : null
    }
    return null
  }

  return {
    id: Number(row.id),
    user_id: parseNullableNumber(row.user_id),
    access_id: parseNullableNumber(row.access_id),
    domain_id: parseNullableNumber(row.domain_id),
    company_code: normalizeString(row.company_code),
    product_id: parseNullableNumber(row.product_id),
    fullname: normalizeString(row.fullname),
    email: normalizeString(row.email),
    product_name: normalizeString(row.product_name),
    domain_name: normalizeString(row.domain_name),
    country_name: normalizeString(row.country_name),
    sku: normalizeString(row.sku),
    price: normalizeString(row.price),
    comments: normalizeString(row.comments),
    status: normalizeString(row.status),
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export type ProductEnquiryFilters = {
  status?: string
  email?: string
  sku?: string
  product_id?: number
  access_id?: number
  user_id?: number
}

export type ProductEnquiryInput = {
  user_id?: number | null
  access_id?: number | null
  domain_id?: number | null
  company_code?: string | null
  product_id?: number | null
  fullname?: string | null
  email?: string | null
  product_name?: string | null
  domain_name?: string | null
  country_name?: string | null
  sku?: string | null
  price?: string | null
  comments?: string | null
  status?: string | null
}

const buildProductEnquiryWhere = (filters: Partial<ProductEnquiryFilters>) => {
  const conditions: string[] = []
  const params: Array<string | number> = []

  if (filters.status) {
    params.push(filters.status)
    conditions.push(`LOWER(status) = LOWER($${params.length})`)
  }

  if (filters.email) {
    params.push(filters.email)
    conditions.push(`LOWER(email) = LOWER($${params.length})`)
  }

  if (filters.sku) {
    params.push(filters.sku)
    conditions.push(`LOWER(sku) = LOWER($${params.length})`)
  }

  if (filters.product_id !== undefined) {
    params.push(filters.product_id)
    conditions.push(`product_id = $${params.length}`)
  }

  if (filters.access_id !== undefined) {
    params.push(filters.access_id)
    conditions.push(`access_id = $${params.length}`)
  }

  if (filters.user_id !== undefined) {
    params.push(filters.user_id)
    conditions.push(`user_id = $${params.length}`)
  }

  return { conditions, params }
}

const clampPagination = (
  limit: unknown,
  offset: unknown,
  maxLimit = 200,
  defaultLimit = 25
) => {
  const parsedLimit = Number(limit)
  const parsedOffset = Number(offset)

  const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.min(Math.trunc(parsedLimit), maxLimit)
    : defaultLimit

  const safeOffset = Number.isFinite(parsedOffset) && parsedOffset >= 0
    ? Math.trunc(parsedOffset)
    : 0

  return { limit: safeLimit, offset: safeOffset }
}

export async function listProductEnquiries(
  filters: Partial<ProductEnquiryFilters> = {},
  pagination: { limit?: number; offset?: number } = {}
): Promise<[ProductEnquiryRow[], number]> {
  await ensureRedingtonProductEnquiryTable()

  const { conditions, params } = buildProductEnquiryWhere(filters)
  const { limit, offset } = clampPagination(
    pagination.limit,
    pagination.offset
  )

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : ""

  const dataParams = [...params, limit, offset]

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_product_enquiry
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${dataParams.length - 1}
      OFFSET $${dataParams.length}
    `,
    dataParams
  )

  const countResult = await getPgPool().query(
    `
      SELECT COUNT(*) AS count
      FROM redington_product_enquiry
      ${whereClause}
    `,
    params
  )

  const count = Number(countResult.rows[0]?.count ?? 0)

  return [rows.map(mapProductEnquiryRow), count]
}

export async function createProductEnquiry(
  input: ProductEnquiryInput
): Promise<ProductEnquiryRow> {
  await ensureRedingtonProductEnquiryTable()

  const { rows } = await getPgPool().query(
    `
      INSERT INTO redington_product_enquiry (
        user_id,
        access_id,
        domain_id,
        company_code,
        product_id,
        fullname,
        email,
        product_name,
        domain_name,
        country_name,
        sku,
        price,
        comments,
        status
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
      )
      RETURNING *
    `,
    [
      input.user_id ?? null,
      input.access_id ?? null,
      input.domain_id ?? null,
      input.company_code ?? null,
      input.product_id ?? null,
      input.fullname ?? null,
      input.email ?? null,
      input.product_name ?? null,
      input.domain_name ?? null,
      input.country_name ?? null,
      input.sku ?? null,
      input.price ?? null,
      input.comments ?? null,
      input.status ?? null,
    ]
  )

  return mapProductEnquiryRow(rows[0])
}

export async function updateProductEnquiry(
  id: number,
  input: Partial<ProductEnquiryInput>
): Promise<ProductEnquiryRow | null> {
  await ensureRedingtonProductEnquiryTable()

  const fields: string[] = []
  const params: any[] = []

  const addField = (column: string, value: any) => {
    params.push(value)
    fields.push(`${column} = $${params.length}`)
  }

  if (input.user_id !== undefined) addField("user_id", input.user_id)
  if (input.access_id !== undefined) addField("access_id", input.access_id)
  if (input.domain_id !== undefined) addField("domain_id", input.domain_id)
  if (input.company_code !== undefined) addField("company_code", input.company_code)
  if (input.product_id !== undefined) addField("product_id", input.product_id)
  if (input.fullname !== undefined) addField("fullname", input.fullname)
  if (input.email !== undefined) addField("email", input.email)
  if (input.product_name !== undefined) addField("product_name", input.product_name)
  if (input.domain_name !== undefined) addField("domain_name", input.domain_name)
  if (input.country_name !== undefined) addField("country_name", input.country_name)
  if (input.sku !== undefined) addField("sku", input.sku)
  if (input.price !== undefined) addField("price", input.price)
  if (input.comments !== undefined) addField("comments", input.comments)
  if (input.status !== undefined) addField("status", input.status)

  if (!fields.length) {
    return retrieveProductEnquiry(id)
  }

  params.push(id)

  const { rows } = await getPgPool().query(
    `
      UPDATE redington_product_enquiry
      SET ${fields.join(", ")},
          updated_at = NOW()
      WHERE id = $${params.length}
      RETURNING *
    `,
    params
  )

  return rows[0] ? mapProductEnquiryRow(rows[0]) : null
}

export async function deleteProductEnquiry(id: number): Promise<boolean> {
  await ensureRedingtonProductEnquiryTable()

  const result = await getPgPool().query(
    `
      DELETE FROM redington_product_enquiry
      WHERE id = $1
    `,
    [id]
  )

  return result.rowCount > 0
}

export async function retrieveProductEnquiry(
  id: number
): Promise<ProductEnquiryRow | null> {
  await ensureRedingtonProductEnquiryTable()

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_product_enquiry
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  )

  return rows[0] ? mapProductEnquiryRow(rows[0]) : null
}

export type MaxQtyRuleRow = {
  id: number
  category_id: string
  brand_id: string
  company_code: string
  domain_id: number | null
  max_qty: number
  created_at: string
  updated_at: string
}

export async function ensureRedingtonMaxQtyRuleTable() {
  if (maxQtyRuleTableInitialized) {
    return
  }

  await ensureRedingtonDomainTable()

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_max_qty_rule (
      id SERIAL PRIMARY KEY,
      category_id TEXT NOT NULL,
      brand_id TEXT NOT NULL,
      company_code TEXT NOT NULL,
      domain_id INTEGER REFERENCES redington_domain(id) ON DELETE CASCADE,
      max_qty INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT redington_max_qty_rule_unique UNIQUE (category_id, brand_id, company_code, domain_id)
    );
  `)

  await getPgPool().query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'redington_max_qty_rule'
          AND column_name = 'domain_id'
          AND is_nullable = 'NO'
      ) THEN
        ALTER TABLE redington_max_qty_rule
        ALTER COLUMN domain_id DROP NOT NULL;
      END IF;
    END;
    $$;
  `)

  maxQtyRuleTableInitialized = true
}

export function mapMaxQtyRuleRow(row: any): MaxQtyRuleRow {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  const maxQty = Number(row.max_qty)

  return {
    id: Number(row.id),
    category_id: typeof row.category_id === "string" ? row.category_id : "",
    brand_id: typeof row.brand_id === "string" ? row.brand_id : "",
    company_code: typeof row.company_code === "string" ? row.company_code : "",
    domain_id:
      row.domain_id === null || row.domain_id === undefined
        ? null
        : Number(row.domain_id),
    max_qty: Number.isFinite(maxQty) ? maxQty : 0,
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export type MaxQtyCategoryRow = {
  id: number
  category_ids: string
  brand_id: string
  company_code: string
  domain_id: number | null
  max_qty: number
  created_at: string
  updated_at: string
}

export async function ensureRedingtonMaxQtyCategoryTable() {
  if (maxQtyCategoryTableInitialized) {
    return
  }

  await ensureRedingtonDomainTable()

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_max_qty_category (
      id SERIAL PRIMARY KEY,
      category_ids TEXT NOT NULL,
      brand_id TEXT NOT NULL,
      company_code TEXT NOT NULL,
      domain_id INTEGER REFERENCES redington_domain(id) ON DELETE CASCADE,
      max_qty INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT redington_max_qty_category_unique UNIQUE (category_ids, brand_id, company_code, domain_id)
    );
  `)

  await getPgPool().query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'redington_max_qty_category'
          AND column_name = 'domain_id'
          AND is_nullable = 'NO'
      ) THEN
        ALTER TABLE redington_max_qty_category
        ALTER COLUMN domain_id DROP NOT NULL;
      END IF;
    END;
    $$;
  `)

  maxQtyCategoryTableInitialized = true
}

export function mapMaxQtyCategoryRow(row: any): MaxQtyCategoryRow {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  const maxQty = Number(row.max_qty)

  return {
    id: Number(row.id),
    category_ids:
      typeof row.category_ids === "string" ? row.category_ids : "",
    brand_id: typeof row.brand_id === "string" ? row.brand_id : "",
    company_code: typeof row.company_code === "string" ? row.company_code : "",
    domain_id:
      row.domain_id === null || row.domain_id === undefined
        ? null
        : Number(row.domain_id),
    max_qty: Number.isFinite(maxQty) ? maxQty : 0,
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export type OrderQuantityTrackerRow = {
  id: number
  customer_id: number
  order_increment_id: string
  sku: string
  quantity: number
  brand_id: string | null
  created_at: string
  updated_at: string
}

export async function ensureRedingtonOrderQuantityTrackerTable() {
  if (orderQtyTrackerTableInitialized) {
    return
  }

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_order_quantity_tracker (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL,
      order_increment_id TEXT NOT NULL,
      sku TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      brand_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  orderQtyTrackerTableInitialized = true
}

export function mapOrderQuantityTrackerRow(row: any): OrderQuantityTrackerRow {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  const quantity = Number(row.quantity)

  return {
    id: Number(row.id),
    customer_id: Number(row.customer_id),
    order_increment_id:
      typeof row.order_increment_id === "string" ? row.order_increment_id : "",
    sku: typeof row.sku === "string" ? row.sku : "",
    quantity: Number.isFinite(quantity) ? quantity : 0,
    brand_id:
      typeof row.brand_id === "string" && row.brand_id.length
        ? row.brand_id
        : null,
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export type OrderShipmentRow = {
  id: number
  order_id: string | null
  order_increment_id: string
  order_status: string
  awb_number: string | null
  sap_order_numbers: string | null
  last_synced_at: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export async function ensureRedingtonOrderShipmentTable() {
  if (orderShipmentTableInitialized) {
    return
  }

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_order_shipment (
      id SERIAL PRIMARY KEY,
      order_id TEXT,
      order_increment_id TEXT NOT NULL UNIQUE,
      order_status TEXT NOT NULL,
      awb_number TEXT,
      sap_order_numbers TEXT,
      last_synced_at TIMESTAMPTZ,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  orderShipmentTableInitialized = true
}

export function mapOrderShipmentRow(row: any): OrderShipmentRow {
  const toIso = (value: any): string | null => {
    if (!value) {
      return null
    }
    if (value instanceof Date) {
      return value.toISOString()
    }
    const str = String(value)
    return str.length ? str : null
  }

  let metadata: Record<string, unknown> = {}
  if (row.metadata && typeof row.metadata === "object") {
    metadata = row.metadata as Record<string, unknown>
  } else if (typeof row.metadata === "string" && row.metadata.length) {
    try {
      metadata = JSON.parse(row.metadata)
    } catch {
      metadata = {}
    }
  }

  return {
    id: Number(row.id),
    order_id:
      typeof row.order_id === "string" && row.order_id.length
        ? row.order_id
        : null,
    order_increment_id:
      typeof row.order_increment_id === "string" ? row.order_increment_id : "",
    order_status:
      typeof row.order_status === "string" ? row.order_status : "",
    awb_number:
      typeof row.awb_number === "string" && row.awb_number.length
        ? row.awb_number
        : null,
    sap_order_numbers:
      typeof row.sap_order_numbers === "string" && row.sap_order_numbers.length
        ? row.sap_order_numbers
        : null,
    last_synced_at: toIso(row.last_synced_at),
    metadata,
    created_at: toIso(row.created_at) ?? new Date().toISOString(),
    updated_at: toIso(row.updated_at) ?? new Date().toISOString(),
  }
}

export type OrderCcEmailRow = {
  id: number
  company_code: string | null
  domain_id: number | null
  domain_extention_id: number | null
  brand_ids: string[]
  cc_emails: string[]
  created_at: string
  updated_at: string
}

const splitList = (value: any): string[] => {
  if (!value) {
    return []
  }
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean)
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
  return []
}

export async function ensureRedingtonOrderCcEmailTable() {
  if (orderCcEmailTableInitialized) {
    return
  }

  await ensureRedingtonDomainTable()
  await ensureRedingtonDomainExtentionTable()

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_order_cc_email (
      id SERIAL PRIMARY KEY,
      company_code TEXT,
      domain_id INTEGER REFERENCES redington_domain(id) ON DELETE SET NULL,
      domain_extention_id INTEGER REFERENCES redington_domain_extention(id) ON DELETE SET NULL,
      brand_ids TEXT,
      cc_emails TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  orderCcEmailTableInitialized = true
}

export function mapOrderCcEmailRow(row: any): OrderCcEmailRow {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  return {
    id: Number(row.id),
    company_code:
      typeof row.company_code === "string" && row.company_code.length
        ? row.company_code
        : null,
    domain_id:
      row.domain_id === null || row.domain_id === undefined
        ? null
        : Number(row.domain_id),
    domain_extention_id:
      row.domain_extention_id === null || row.domain_extention_id === undefined
        ? null
        : Number(row.domain_extention_id),
    brand_ids: splitList(row.brand_ids),
    cc_emails: splitList(row.cc_emails),
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export type MpgsTransactionRow = {
  id: number
  order_ref_id: string
  session_id: string
  transaction_reference: string
  order_increment_id: string
  payment_status: string | null
  session_version: string | null
  result_indicator: string | null
  order_status: string | null
  transaction_receipt: string | null
  created_at: string
  updated_at: string
}

export async function ensureRedingtonMpgsTransactionTable() {
  if (mpgsTransactionTableInitialized) {
    return
  }

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_mpgs_transaction (
      id SERIAL PRIMARY KEY,
      order_ref_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      transaction_reference TEXT NOT NULL,
      order_increment_id TEXT NOT NULL,
      payment_status TEXT,
      session_version TEXT,
      result_indicator TEXT,
      order_status TEXT,
      transaction_receipt TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT redington_mpgs_transaction_session_unique UNIQUE (session_id)
    );
  `)

  mpgsTransactionTableInitialized = true
}

export function mapMpgsTransactionRow(row: any): MpgsTransactionRow {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  const normalize = (value: any): string | null => {
    if (typeof value === "string") {
      const trimmed = value.trim()
      return trimmed.length ? trimmed : null
    }
    return null
  }

  return {
    id: Number(row.id),
    order_ref_id: typeof row.order_ref_id === "string" ? row.order_ref_id : "",
    session_id: typeof row.session_id === "string" ? row.session_id : "",
    transaction_reference:
      typeof row.transaction_reference === "string"
        ? row.transaction_reference
        : "",
    order_increment_id:
      typeof row.order_increment_id === "string"
        ? row.order_increment_id
        : "",
    payment_status: normalize(row.payment_status),
    session_version: normalize(row.session_version),
    result_indicator: normalize(row.result_indicator),
    order_status: normalize(row.order_status),
    transaction_receipt: normalize(row.transaction_receipt),
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export type ProductPriceRow = {
  id: number
  sku: string
  country_code: string
  company_code: string
  brand_id: string | null
  distribution_channel: string
  domain_id: number | null
  product_base_price: number
  product_special_price: number | null
  is_active: boolean
  promotion_channel: string | null
  from_date: string | null
  to_date: string | null
  created_at: string
  updated_at: string
}

export async function ensureRedingtonProductPriceTable() {
  if (productPriceTableInitialized) {
    return
  }

  await ensureRedingtonDomainTable()

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_product_price (
      id SERIAL PRIMARY KEY,
      sku TEXT NOT NULL,
      country_code TEXT NOT NULL,
      company_code TEXT NOT NULL,
      brand_id TEXT,
      distribution_channel TEXT NOT NULL,
      domain_id INTEGER REFERENCES redington_domain(id) ON DELETE CASCADE,
      product_base_price NUMERIC(14,4) NOT NULL DEFAULT 0,
      product_special_price NUMERIC(14,4),
      is_active BOOLEAN NOT NULL DEFAULT FALSE,
      promotion_channel TEXT,
      from_date TIMESTAMPTZ,
      to_date TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT redington_product_price_unique UNIQUE (sku, company_code, distribution_channel, domain_id)
    );
  `)

  await getPgPool().query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'redington_product_price'
          AND column_name = 'brand_id'
      ) THEN
        ALTER TABLE redington_product_price
        ADD COLUMN brand_id TEXT;
      END IF;
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'redington_product_price'
          AND column_name = 'domain_id'
          AND is_nullable = 'NO'
      ) THEN
        ALTER TABLE redington_product_price
        ALTER COLUMN domain_id DROP NOT NULL;
      END IF;
    END;
    $$;
  `)

  productPriceTableInitialized = true
}

export function mapProductPriceRow(row: any): ProductPriceRow {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  const toNumber = (value: any, fallback: number | null) => {
    if (value === null || value === undefined) {
      return fallback
    }
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) {
      return fallback
    }
    return parsed
  }

  const toIso = (value: any): string | null => {
    if (!value) {
      return null
    }
    if (value instanceof Date) {
      return value.toISOString()
    }
    const str = String(value)
    return str.length ? str : null
  }

  return {
    id: Number(row.id),
    sku: typeof row.sku === "string" ? row.sku : "",
    country_code:
      typeof row.country_code === "string" ? row.country_code : "",
    company_code:
      typeof row.company_code === "string" ? row.company_code : "",
    brand_id:
      typeof row.brand_id === "string" && row.brand_id.length
        ? row.brand_id
        : null,
    distribution_channel:
      typeof row.distribution_channel === "string"
        ? row.distribution_channel
        : "",
    domain_id:
      row.domain_id === null || row.domain_id === undefined
        ? null
        : Number(row.domain_id),
    product_base_price: toNumber(row.product_base_price, 0) ?? 0,
    product_special_price: toNumber(row.product_special_price, null),
    is_active:
      typeof row.is_active === "boolean"
        ? row.is_active
        : Boolean(row.is_active),
    promotion_channel:
      typeof row.promotion_channel === "string" && row.promotion_channel.length
        ? row.promotion_channel
        : null,
    from_date: toIso(row.from_date),
    to_date: toIso(row.to_date),
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export type ProductDescImportLogRow = {
  id: number
  file_name: string
  status: string
  notes: string | null
  initiated_by: string | null
  total_rows: number
  success_rows: number
  failed_rows: number
  log: any[] | null
  created_at: string
  updated_at: string
}

export async function ensureRedingtonProductDescImportTable() {
  if (productDescImportTableInitialized) {
    return
  }

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_product_desc_import (
      id SERIAL PRIMARY KEY,
      file_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      initiated_by TEXT,
      total_rows INTEGER NOT NULL DEFAULT 0,
      success_rows INTEGER NOT NULL DEFAULT 0,
      failed_rows INTEGER NOT NULL DEFAULT 0,
      log JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  productDescImportTableInitialized = true
}

export function mapProductDescImportRow(row: any): ProductDescImportLogRow {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  let parsedLog: any = null
  if (row.log && typeof row.log === "object") {
    parsedLog = row.log
  } else if (typeof row.log === "string" && row.log.length) {
    try {
      parsedLog = JSON.parse(row.log)
    } catch {
      parsedLog = row.log
    }
  }

  return {
    id: Number(row.id),
    file_name: row.file_name ?? "",
    status: row.status ?? "pending",
    notes: typeof row.notes === "string" ? row.notes : null,
    initiated_by:
      typeof row.initiated_by === "string" ? row.initiated_by : null,
    total_rows: Number(row.total_rows ?? 0),
    success_rows: Number(row.success_rows ?? 0),
    failed_rows: Number(row.failed_rows ?? 0),
    log: parsedLog,
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export async function insertProductDescImportLog(input: {
  file_name: string
  status?: string
  notes?: string | null
  initiated_by?: string | null
  total_rows?: number
}): Promise<ProductDescImportLogRow> {
  await ensureRedingtonProductDescImportTable()

  const { rows } = await getPgPool().query(
    `
      INSERT INTO redington_product_desc_import (
        file_name,
        status,
        notes,
        initiated_by,
        total_rows
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [
      input.file_name,
      input.status ?? "pending",
      input.notes ?? null,
      input.initiated_by ?? null,
      input.total_rows ?? 0,
    ]
  )

  return mapProductDescImportRow(rows[0])
}

export async function updateProductDescImportLog(
  id: number,
  updates: Partial<{
    status: string
    notes: string | null
    initiated_by: string | null
    total_rows: number
    success_rows: number
    failed_rows: number
    log: any
  }>
): Promise<ProductDescImportLogRow | null> {
  await ensureRedingtonProductDescImportTable()

  const fields: string[] = []
  const values: any[] = []

  const push = (column: string, value: any) => {
    values.push(value)
    fields.push(`${column} = $${values.length}`)
  }

  if (updates.status !== undefined) {
    push("status", updates.status)
  }
  if (updates.notes !== undefined) {
    push("notes", updates.notes)
  }
  if (updates.initiated_by !== undefined) {
    push("initiated_by", updates.initiated_by)
  }
  if (updates.total_rows !== undefined) {
    push("total_rows", updates.total_rows)
  }
  if (updates.success_rows !== undefined) {
    push("success_rows", updates.success_rows)
  }
  if (updates.failed_rows !== undefined) {
    push("failed_rows", updates.failed_rows)
  }
  if (updates.log !== undefined) {
    push("log", JSON.stringify(updates.log))
  }

  if (!fields.length) {
    return findProductDescImportLog(id)
  }

  values.push(id)

  const { rows } = await getPgPool().query(
    `
      UPDATE redington_product_desc_import
      SET ${fields.join(", ")},
          updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `,
    values
  )

  return rows[0] ? mapProductDescImportRow(rows[0]) : null
}

export async function listProductDescImportLogs(options?: {
  limit?: number
  offset?: number
}): Promise<{ logs: ProductDescImportLogRow[]; count: number }> {
  await ensureRedingtonProductDescImportTable()

  const limit =
    options?.limit && Number.isFinite(options.limit)
      ? Math.min(Math.max(Number(options.limit), 1), 100)
      : 20
  const offset =
    options?.offset && Number.isFinite(options.offset) && options.offset > 0
      ? Math.trunc(options.offset)
      : 0

  const { rows } = await getPgPool().query(
    `
      SELECT id,
             file_name,
             status,
             notes,
             initiated_by,
             total_rows,
             success_rows,
             failed_rows,
             created_at,
             updated_at
      FROM redington_product_desc_import
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  )

  const { rows: countRows } = await getPgPool().query(
    `SELECT COUNT(*)::int AS count FROM redington_product_desc_import`
  )

  return {
    logs: rows.map(mapProductDescImportRow),
    count: countRows[0]?.count ?? 0,
  }
}

export async function findProductDescImportLog(
  id: number
): Promise<ProductDescImportLogRow | null> {
  await ensureRedingtonProductDescImportTable()

  const { rows } = await getPgPool().query(
    `SELECT * FROM redington_product_desc_import WHERE id = $1`,
    [id]
  )

  return rows[0] ? mapProductDescImportRow(rows[0]) : null
}

export type GuestUserAuditRow = {
  id: number
  email: string
  success: boolean
  message: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export async function ensureRedingtonGuestUserAuditTable() {
  if (guestUserAuditTableInitialized) {
    return
  }

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_guest_user_audit (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      success BOOLEAN NOT NULL DEFAULT FALSE,
      message TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  guestUserAuditTableInitialized = true
}

export function mapGuestUserAuditRow(row: any): GuestUserAuditRow {
  const metadata =
    typeof row.metadata === "object" && row.metadata !== null
      ? row.metadata
      : (() => {
          if (typeof row.metadata === "string" && row.metadata.length) {
            try {
              return JSON.parse(row.metadata)
            } catch {
              return {}
            }
          }
          return {}
        })()

  return {
    id: Number(row.id),
    email: typeof row.email === "string" ? row.email : "",
    success:
      typeof row.success === "boolean" ? row.success : Boolean(row.success),
    message:
      typeof row.message === "string" && row.message.length
        ? row.message
        : null,
    metadata: metadata as Record<string, unknown>,
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  }
}

export async function recordGuestUserAudit(entry: {
  email: string
  success: boolean
  message?: string
  metadata?: Record<string, unknown> | null
}): Promise<GuestUserAuditRow> {
  await ensureRedingtonGuestUserAuditTable()

  const metadata = entry.metadata ? JSON.stringify(entry.metadata) : "{}"

  const { rows } = await getPgPool().query(
    `
      INSERT INTO redington_guest_user_audit (email, success, message, metadata)
      VALUES ($1, $2, $3, $4::jsonb)
      RETURNING *
    `,
    [entry.email.trim().toLowerCase(), entry.success, entry.message ?? null, metadata]
  )

  return mapGuestUserAuditRow(rows[0])
}

export async function listGuestUserAudits(options: {
  email?: string
  success?: boolean | null
  limit?: number
  offset?: number
}): Promise<[GuestUserAuditRow[], number]> {
  await ensureRedingtonGuestUserAuditTable()

  const filters: string[] = []
  const params: any[] = []

  if (options.email && options.email.trim().length) {
    params.push(`%${options.email.trim().toLowerCase()}%`)
    filters.push(`LOWER(email) LIKE $${params.length}`)
  }

  if (typeof options.success === "boolean") {
    params.push(options.success)
    filters.push(`success = $${params.length}`)
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : ""

  const limit =
    typeof options.limit === "number" && Number.isFinite(options.limit)
      ? Math.min(Math.max(1, Math.trunc(options.limit)), 100)
      : 25

  const offset =
    typeof options.offset === "number" && Number.isFinite(options.offset)
      ? Math.max(0, Math.trunc(options.offset))
      : 0

  const queryParams = [...params, limit, offset]

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_guest_user_audit
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `,
    queryParams
  )

  const countResult = await getPgPool().query(
    `
      SELECT COUNT(*) AS count
      FROM redington_guest_user_audit
      ${whereClause}
    `,
    params
  )

  const count = Number(countResult.rows[0]?.count ?? 0)

  return [rows.map(mapGuestUserAuditRow), count]
}

export type InvoiceAuditRow = {
  id: number
  order_id: string | null
  invoice_number: string | null
  company_code: string | null
  success: boolean
  message: string | null
  payload: Record<string, unknown>
  created_at: string
}

export async function ensureRedingtonInvoiceAuditTable() {
  if (invoiceAuditTableInitialized) {
    return
  }

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_invoice_audit (
      id SERIAL PRIMARY KEY,
      order_id TEXT,
      invoice_number TEXT,
      company_code TEXT,
      success BOOLEAN NOT NULL DEFAULT FALSE,
      message TEXT,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  invoiceAuditTableInitialized = true
}

export function mapInvoiceAuditRow(row: any): InvoiceAuditRow {
  const payload =
    typeof row.payload === "object" && row.payload !== null
      ? row.payload
      : (() => {
          if (typeof row.payload === "string" && row.payload.length) {
            try {
              return JSON.parse(row.payload)
            } catch {
              return {}
            }
          }
          return {}
        })()

  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)

  const normalizeString = (value: any): string | null => {
    if (typeof value === "string") {
      const trimmed = value.trim()
      return trimmed.length ? trimmed : null
    }
    return null
  }

  return {
    id: Number(row.id),
    order_id: normalizeString(row.order_id),
    invoice_number: normalizeString(row.invoice_number),
    company_code: normalizeString(row.company_code),
    success:
      typeof row.success === "boolean" ? row.success : Boolean(row.success),
    message: normalizeString(row.message),
    payload: payload as Record<string, unknown>,
    created_at: createdAt,
  }
}

export async function recordInvoiceAudit(entry: {
  order_id?: string | null
  invoice_number?: string | null
  company_code?: string | null
  success: boolean
  message?: string | null
  payload?: Record<string, unknown> | null
}): Promise<InvoiceAuditRow> {
  await ensureRedingtonInvoiceAuditTable()

  const payload = entry.payload ? JSON.stringify(entry.payload) : "{}"

  const { rows } = await getPgPool().query(
    `
      INSERT INTO redington_invoice_audit (
        order_id,
        invoice_number,
        company_code,
        success,
        message,
        payload
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      RETURNING *
    `,
    [
      entry.order_id ?? null,
      entry.invoice_number ?? null,
      entry.company_code ?? null,
      entry.success,
      entry.message ?? null,
      payload,
    ]
  )

  return mapInvoiceAuditRow(rows[0])
}

export type CustomerSyncRow = {
  id: number
  customer_email: string
  customer_id: string | null
  sap_sync: boolean
  sap_customer_code: string | null
  sap_synced_at: string | null
  created_at: string
  updated_at: string
}

export async function ensureRedingtonCustomerSyncTable() {
  if (customerSyncTableInitialized) {
    return
  }

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_customer_sync (
      id SERIAL PRIMARY KEY,
      customer_email TEXT NOT NULL UNIQUE,
      customer_id TEXT,
      sap_sync BOOLEAN NOT NULL DEFAULT FALSE,
      sap_customer_code TEXT,
      sap_synced_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  customerSyncTableInitialized = true
}

export function mapCustomerSyncRow(row: any): CustomerSyncRow {
  const parseTimestamp = (value: any): string | null => {
    if (!value) {
      return null
    }
    if (value instanceof Date) {
      return value.toISOString()
    }
    const str = String(value)
    return str.length ? str : null
  }

  return {
    id: Number(row.id),
    customer_email: typeof row.customer_email === "string" ? row.customer_email : "",
    customer_id:
      typeof row.customer_id === "string" && row.customer_id.length
        ? row.customer_id
        : null,
    sap_sync:
      typeof row.sap_sync === "boolean" ? row.sap_sync : Boolean(row.sap_sync),
    sap_customer_code:
      typeof row.sap_customer_code === "string" && row.sap_customer_code.length
        ? row.sap_customer_code
        : null,
    sap_synced_at: parseTimestamp(row.sap_synced_at),
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
    updated_at:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at),
  }
}

const lookupCustomerIdByEmail = async (email: string): Promise<string | null> => {
  const { rows } = await getPgPool().query(
    `
      SELECT id
      FROM "customer"
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [email]
  )

  return rows[0]?.id ? String(rows[0].id) : null
}

export async function upsertRedingtonCustomerSync(options: {
  email: string
  customerId?: string | null
  sapSync: boolean
  sapCustomerCode?: string | null
  sapSyncedAt?: string | Date | null
}): Promise<CustomerSyncRow> {
  await ensureRedingtonCustomerSyncTable()

  const email = options.email.trim().toLowerCase()
  let customerId = options.customerId ?? null
  if (!customerId) {
    customerId = await lookupCustomerIdByEmail(email)
  }

  const sapSyncedAtValue = options.sapSyncedAt
    ? options.sapSyncedAt instanceof Date
      ? options.sapSyncedAt.toISOString()
      : options.sapSyncedAt
    : options.sapSync
      ? new Date().toISOString()
      : null

  const { rows } = await getPgPool().query(
    `
      INSERT INTO redington_customer_sync (
        customer_email,
        customer_id,
        sap_sync,
        sap_customer_code,
        sap_synced_at
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (customer_email) DO UPDATE
        SET customer_id = COALESCE(EXCLUDED.customer_id, redington_customer_sync.customer_id),
            sap_sync = EXCLUDED.sap_sync,
            sap_customer_code = EXCLUDED.sap_customer_code,
            sap_synced_at = CASE
              WHEN EXCLUDED.sap_sync THEN COALESCE(EXCLUDED.sap_synced_at, NOW())
              ELSE redington_customer_sync.sap_synced_at
            END,
            updated_at = NOW()
      RETURNING *
    `,
    [email, customerId, options.sapSync, options.sapCustomerCode ?? null, sapSyncedAtValue]
  )

  const inserted = mapCustomerSyncRow(rows[0])

  if (customerId) {
    try {
      await getPgPool().query(
        `
          UPDATE "customer"
          SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
              updated_at = NOW()
          WHERE id = $1
        `,
        [
          customerId,
          JSON.stringify({
            sap_sync: inserted.sap_sync,
            sap_customer_code: inserted.sap_customer_code,
            sap_synced_at: inserted.sap_synced_at,
          }),
        ]
      )
    } catch (err) {
      console.warn("Failed to update customer metadata for SAP sync", err)
    }
  }

  return inserted
}

export async function listRedingtonCustomerSync(options: {
  email?: string
  sapSync?: boolean | null
  limit?: number
  offset?: number
}): Promise<[CustomerSyncRow[], number]> {
  await ensureRedingtonCustomerSyncTable()

  const filters: string[] = []
  const params: any[] = []

  if (options.email && options.email.trim().length) {
    params.push(`%${options.email.trim().toLowerCase()}%`)
    filters.push(`LOWER(customer_email) LIKE $${params.length}`)
  }

  if (typeof options.sapSync === "boolean") {
    params.push(options.sapSync)
    filters.push(`sap_sync = $${params.length}`)
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : ""

  const limit =
    typeof options.limit === "number" && Number.isFinite(options.limit)
      ? Math.min(Math.max(1, Math.trunc(options.limit)), 100)
      : 25

  const offset =
    typeof options.offset === "number" && Number.isFinite(options.offset)
      ? Math.max(0, Math.trunc(options.offset))
      : 0

  const queryParams = [...params, limit, offset]

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_customer_sync
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `,
    queryParams
  )

  const countResult = await getPgPool().query(
    `
      SELECT COUNT(*) AS count
      FROM redington_customer_sync
      ${whereClause}
    `,
    params
  )

  const count = Number(countResult.rows[0]?.count ?? 0)

  return [rows.map(mapCustomerSyncRow), count]
}

export type GetInTouchRow = {
  id: number
  name: string
  email: string
  mobile_number: string
  company_name: string | null
  enquiry_type: string | null
  enquiry_details: string | null
  created_at: string
  updated_at: string
}

export async function ensureRedingtonGetInTouchTable() {
  if (getInTouchTableInitialized) {
    return
  }

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_get_in_touch (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      mobile_number TEXT NOT NULL,
      company_name TEXT,
      enquiry_type TEXT,
      enquiry_details TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  getInTouchTableInitialized = true
}

export function mapGetInTouchRow(row: any): GetInTouchRow {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  return {
    id: Number(row.id),
    name: typeof row.name === "string" ? row.name : "",
    email: typeof row.email === "string" ? row.email : "",
    mobile_number:
      typeof row.mobile_number === "string" ? row.mobile_number : "",
    company_name:
      typeof row.company_name === "string" && row.company_name.length
        ? row.company_name
        : null,
    enquiry_type:
      typeof row.enquiry_type === "string" && row.enquiry_type.length
        ? row.enquiry_type
        : null,
    enquiry_details:
      typeof row.enquiry_details === "string" && row.enquiry_details.length
        ? row.enquiry_details
        : null,
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export type CouponRuleRow = {
  id: number
  coupon_code: string
  company_code: string
  domain_id: number
  domain_extention_id: number | null
  is_active: boolean
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export async function ensureRedingtonCouponRuleTable() {
  if (couponRuleTableInitialized) {
    return
  }

  await ensureRedingtonDomainTable()
  await ensureRedingtonDomainExtentionTable()

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_coupon_rule (
      id SERIAL PRIMARY KEY,
      coupon_code TEXT NOT NULL,
      company_code TEXT NOT NULL,
      domain_id INTEGER NOT NULL REFERENCES redington_domain(id) ON DELETE CASCADE,
      domain_extention_id INTEGER REFERENCES redington_domain_extention(id) ON DELETE SET NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT redington_coupon_rule_unique UNIQUE (coupon_code, company_code, domain_id, domain_extention_id)
    );
  `)

  couponRuleTableInitialized = true
}

export function mapCouponRuleRow(row: any): CouponRuleRow {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at)

  const metadata =
    typeof row.metadata === "object" && row.metadata !== null
      ? row.metadata
      : (() => {
          if (typeof row.metadata === "string" && row.metadata.length) {
            try {
              return JSON.parse(row.metadata)
            } catch {
              return {}
            }
          }
          return {}
        })()

  const extId =
    row.domain_extention_id !== null && row.domain_extention_id !== undefined
      ? Number(row.domain_extention_id)
      : null

  return {
    id: Number(row.id),
    coupon_code: typeof row.coupon_code === "string" ? row.coupon_code : "",
    company_code: typeof row.company_code === "string" ? row.company_code : "",
    domain_id: Number(row.domain_id),
    domain_extention_id:
      extId && Number.isFinite(extId) ? extId : null,
    is_active:
      typeof row.is_active === "boolean"
        ? row.is_active
        : Boolean(row.is_active),
    metadata: metadata as Record<string, unknown>,
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export type AdminRoleRow = {
  id: number
  role_key: string
  role_name: string
  description?: string
  can_login: boolean
  permissions: string[]
  domains: number[]
  created_at: string
  updated_at: string
}

export type AdminRoleAssignmentRow = {
  id: number
  user_id: string
  role_id: number
  domain_id?: number
  domain_name?: string
  created_at: string
  updated_at: string
  role?: AdminRoleRow
}

const normalizeRoleKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")

const parseTimestamp = (value: any) =>
  value instanceof Date ? value.toISOString() : String(value)

const parsePermissions = (value: any): string[] => {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter(Boolean)
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed
          .map((entry) => String(entry).trim())
          .filter(Boolean)
      }
    } catch (err) {
      return value
        .split(/[\s,]+/)
        .map((entry) => entry.trim())
        .filter(Boolean)
    }
  }

  if (typeof value === "object") {
    return Object.values(value)
      .map((entry) => String(entry).trim())
      .filter(Boolean)
  }

  return []
}

const parseDomains = (value: any): number[] => {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        const parsed =
          typeof entry === "string"
            ? Number.parseInt(entry, 10)
            : Number(entry)
        return Number.isFinite(parsed) ? parsed : null
      })
      .filter((entry): entry is number => entry !== null)
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return parseDomains(parsed)
    } catch {
      return value
        .split(/[\s,]+/)
        .map((entry) => Number.parseInt(entry.trim(), 10))
        .filter((entry) => Number.isFinite(entry))
    }
  }

  if (typeof value === "object") {
    return Object.values(value)
      .map((entry) => {
        const parsed =
          typeof entry === "string"
            ? Number.parseInt(entry, 10)
            : Number(entry)
        return Number.isFinite(parsed) ? parsed : null
      })
      .filter((entry): entry is number => entry !== null)
  }

  return []
}

export function mapAdminRoleRow(row: any): AdminRoleRow {
  return {
    id: Number(row.id),
    role_key: typeof row.role_key === "string" ? row.role_key : "",
    role_name: typeof row.role_name === "string" ? row.role_name : "",
    description:
      typeof row.description === "string" ? row.description : undefined,
    can_login: typeof row.can_login === "boolean"
      ? row.can_login
      : Boolean(row.can_login),
    permissions: parsePermissions(row.permissions),
    domains: parseDomains(row.domains),
    created_at: parseTimestamp(row.created_at),
    updated_at: parseTimestamp(row.updated_at),
  }
}

export function mapAdminRoleAssignmentRow(row: any): AdminRoleAssignmentRow {
  const assignment: AdminRoleAssignmentRow = {
    id: Number(row.id),
    user_id: typeof row.user_id === "string" ? row.user_id : "",
    role_id: Number(row.role_id),
    domain_id: Number.isFinite(Number(row.domain_id))
      ? Number(row.domain_id)
      : undefined,
    domain_name:
      typeof row.domain_name === "string" && row.domain_name.length
        ? row.domain_name
        : undefined,
    created_at: parseTimestamp(row.created_at),
    updated_at: parseTimestamp(row.updated_at),
  }

  if (typeof row.role_key === "string" && row.role_key) {
    assignment.role = mapAdminRoleRow({
      id: row.role_id,
      role_key: row.role_key,
      role_name: row.role_name,
      description: row.role_description,
      can_login: row.role_can_login,
      permissions: row.role_permissions,
      domains: row.role_domains,
      created_at: row.role_created_at,
      updated_at: row.role_updated_at,
    })
  }

  return assignment
}

export async function ensureRedingtonAdminRoleTable() {
  if (adminRoleTableInitialized) {
    return
  }

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_admin_role (
      id SERIAL PRIMARY KEY,
      role_key TEXT NOT NULL UNIQUE,
      role_name TEXT NOT NULL,
      description TEXT,
      can_login BOOLEAN NOT NULL DEFAULT TRUE,
      permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
      domains JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await getPgPool().query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'redington_admin_role'
          AND column_name = 'domains'
      ) THEN
        ALTER TABLE redington_admin_role
        ADD COLUMN domains JSONB NOT NULL DEFAULT '[]'::jsonb;
      END IF;
    END;
    $$;
  `)

  adminRoleTableInitialized = true
}

export async function ensureRedingtonAdminRoleAssignmentTable() {
  if (adminRoleAssignmentTableInitialized) {
    return
  }

  await ensureRedingtonAdminRoleTable()
  await ensureRedingtonDomainTable()

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_admin_role_assignment (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      role_id INTEGER NOT NULL REFERENCES redington_admin_role(id) ON DELETE CASCADE,
      domain_id INTEGER REFERENCES redington_domain(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT uq_role_assignment UNIQUE (user_id, role_id, domain_id)
    );
  `)

  await getPgPool().query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'redington_admin_role_assignment'
          AND column_name = 'domain_id'
      ) THEN
        ALTER TABLE redington_admin_role_assignment
        ADD COLUMN domain_id INTEGER REFERENCES redington_domain(id) ON DELETE SET NULL;
      END IF;
    END;
    $$;
  `)

  await getPgPool().query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'redington_admin_role_assignment'
          AND constraint_name = 'uq_role_assignment'
      ) THEN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.constraint_column_usage
          WHERE table_name = 'redington_admin_role_assignment'
            AND constraint_name = 'uq_role_assignment'
            AND column_name = 'domain_id'
        ) THEN
          ALTER TABLE redington_admin_role_assignment
          DROP CONSTRAINT uq_role_assignment;
        END IF;
      END IF;
    END;
    $$;
  `)

  await getPgPool().query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'redington_admin_role_assignment'
          AND constraint_name = 'uq_role_assignment'
      ) THEN
        ALTER TABLE redington_admin_role_assignment
        ADD CONSTRAINT uq_role_assignment UNIQUE (user_id, role_id, domain_id);
      END IF;
    END;
    $$;
  `)

  // Add a foreign key to the core user table when available. The table name is quoted because "user" is reserved.
  await getPgPool().query(`
    DO $$
    BEGIN
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'user'
        ) THEN
          IF NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE constraint_name = 'fk_role_assignment_user'
              AND table_name = 'redington_admin_role_assignment'
          ) THEN
            ALTER TABLE redington_admin_role_assignment
            ADD CONSTRAINT fk_role_assignment_user
            FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
          END IF;
        END IF;
      EXCEPTION
        WHEN undefined_table THEN
          NULL;
      END;
    END;
    $$;
  `)

  adminRoleAssignmentTableInitialized = true
}

export async function listAdminRoles(): Promise<AdminRoleRow[]> {
  await ensureRedingtonAdminRoleTable()

  const { rows } = await getPgPool().query(`
    SELECT
      id,
      role_key,
      role_name,
      description,
      can_login,
      permissions,
      domains,
      created_at,
      updated_at
    FROM redington_admin_role
    ORDER BY role_name ASC
  `)

  return rows.map(mapAdminRoleRow)
}

export async function createAdminRole(options: {
  role_name: string
  description?: string
  permissions?: string[] | string
  can_login?: boolean
  domains?: Array<number | string> | string | null
}): Promise<AdminRoleRow> {
  await ensureRedingtonAdminRoleTable()

  const name = (options.role_name || "").trim()
  if (!name) {
    throw new Error("role_name is required")
  }

  const roleKey = normalizeRoleKey(name)
  if (!roleKey) {
    throw new Error(
      "role_name must include at least one alphanumeric character"
    )
  }
  const permissions = JSON.stringify(parsePermissions(options.permissions))
  const domains = JSON.stringify(parseDomains(options.domains))
  const canLogin =
    typeof options.can_login === "boolean" ? options.can_login : true

  const { rows } = await getPgPool().query(
    `
      INSERT INTO redington_admin_role (role_key, role_name, description, can_login, permissions, domains)
      VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
      ON CONFLICT (role_key) DO UPDATE
        SET
          role_name = EXCLUDED.role_name,
          description = EXCLUDED.description,
          can_login = EXCLUDED.can_login,
          permissions = EXCLUDED.permissions,
          domains = EXCLUDED.domains,
          updated_at = NOW()
      RETURNING *
    `,
    [roleKey, name, options.description ?? null, canLogin, permissions, domains]
  )

  return mapAdminRoleRow(rows[0])
}

export async function updateAdminRole(
  id: number,
  options: {
    role_name?: string
    description?: string | null
    permissions?: string[] | string | null
    can_login?: boolean
    domains?: Array<number | string> | string | null
  }
): Promise<AdminRoleRow | null> {
  await ensureRedingtonAdminRoleTable()

  const updates: string[] = []
  const values: unknown[] = []

  if (typeof options.role_name === "string") {
    const name = options.role_name.trim()
    if (name) {
      updates.push(`role_name = $${updates.length + 2}`)
      values.push(name)
      updates.push(`role_key = $${updates.length + 2}`)
      values.push(normalizeRoleKey(name))
    }
  }

  if (options.description !== undefined) {
    updates.push(`description = $${updates.length + 2}`)
    values.push(options.description ?? null)
  }

  if (options.permissions !== undefined) {
    updates.push(`permissions = $${updates.length + 2}::jsonb`)
    values.push(JSON.stringify(parsePermissions(options.permissions)))
  }

  if (typeof options.can_login === "boolean") {
    updates.push(`can_login = $${updates.length + 2}`)
    values.push(options.can_login)
  }

  if (options.domains !== undefined) {
    updates.push(`domains = $${updates.length + 2}::jsonb`)
    values.push(JSON.stringify(parseDomains(options.domains)))
  }

  if (!updates.length) {
    const { rows } = await getPgPool().query(
      `SELECT * FROM redington_admin_role WHERE id = $1`,
      [id]
    )
    return rows[0] ? mapAdminRoleRow(rows[0]) : null
  }

  updates.push(`updated_at = NOW()`)

  const { rows } = await getPgPool().query(
    `
      UPDATE redington_admin_role
      SET ${updates.join(", ")}
      WHERE id = $1
      RETURNING *
    `,
    [id, ...values]
  )

  return rows[0] ? mapAdminRoleRow(rows[0]) : null
}

export async function deleteAdminRole(id: number) {
  await ensureRedingtonAdminRoleAssignmentTable()

  await getPgPool().query(
    `
      DELETE FROM redington_admin_role_assignment
      WHERE role_id = $1
    `,
    [id]
  )

  await getPgPool().query(
    `
      DELETE FROM redington_admin_role
      WHERE id = $1
    `,
    [id]
  )
}

export async function assignRoleToUser(options: {
  user_id: string
  role_id: number
  domain_id?: number | null
}): Promise<AdminRoleAssignmentRow> {
  await ensureRedingtonAdminRoleAssignmentTable()

  const userId = options.user_id.trim()
  if (!userId) {
    throw new Error("user_id is required to assign a role")
  }

  const maybeDomainId =
    options.domain_id !== undefined && options.domain_id !== null
      ? Number(options.domain_id)
      : null
  const domainId =
    maybeDomainId !== null && Number.isFinite(maybeDomainId)
      ? maybeDomainId
      : null

  const { rows } = await getPgPool().query(
    `
      INSERT INTO redington_admin_role_assignment (user_id, role_id, domain_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, role_id, domain_id) DO UPDATE
        SET updated_at = NOW()
      RETURNING *
    `,
    [userId, options.role_id, domainId]
  )

  const inserted = rows[0]
  const { rows: hydrated } = await getPgPool().query(
    `
      SELECT
        ra.*,
        d.domain_name,
        r.id AS role_id,
        r.role_key,
        r.role_name,
        r.description AS role_description,
        r.can_login AS role_can_login,
        r.permissions AS role_permissions,
        r.domains AS role_domains,
        r.created_at AS role_created_at,
        r.updated_at AS role_updated_at
      FROM redington_admin_role_assignment ra
      INNER JOIN redington_admin_role r ON r.id = ra.role_id
      LEFT JOIN redington_domain d ON d.id = ra.domain_id
      WHERE ra.id = $1
    `,
    [inserted.id]
  )

  return mapAdminRoleAssignmentRow(hydrated[0] ?? inserted)
}

export async function removeRoleAssignment(id: number) {
  await ensureRedingtonAdminRoleAssignmentTable()

  await getPgPool().query(
    `
      DELETE FROM redington_admin_role_assignment
      WHERE id = $1
    `,
    [id]
  )
}

export async function listRoleAssignments(options: {
  user_id?: string
} = {}): Promise<AdminRoleAssignmentRow[]> {
  await ensureRedingtonAdminRoleAssignmentTable()

  const conditions: string[] = []
  const params: unknown[] = []

  const userIdFilter = options.user_id?.trim()
  if (userIdFilter) {
    conditions.push(`ra.user_id = $${conditions.length + 1}`)
    params.push(userIdFilter)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

  const { rows } = await getPgPool().query(
    `
      SELECT
        ra.*,
        d.domain_name,
        r.id AS role_id,
        r.role_key,
        r.role_name,
        r.description AS role_description,
        r.can_login AS role_can_login,
        r.permissions AS role_permissions,
        r.domains AS role_domains,
        r.created_at AS role_created_at,
        r.updated_at AS role_updated_at
      FROM redington_admin_role_assignment ra
      INNER JOIN redington_admin_role r ON r.id = ra.role_id
      LEFT JOIN redington_domain d ON d.id = ra.domain_id
      ${whereClause}
      ORDER BY r.role_name ASC
    `,
    params
  )

  return rows.map(mapAdminRoleAssignmentRow)
}

export async function getRolesForUser(
  userId: string
): Promise<AdminRoleRow[]> {
  const assignments = await listRoleAssignments({ user_id: userId })
  return assignments
    .map((assignment) => assignment.role)
    .filter((role): role is AdminRoleRow => Boolean(role))
}

export async function countAdminRoles(): Promise<number> {
  await ensureRedingtonAdminRoleTable()

  const { rows } = await getPgPool().query(
    `SELECT COUNT(*)::int AS count FROM redington_admin_role`
  )

  const count = rows[0]?.count
  return typeof count === "number" ? count : Number(count ?? 0)
}

export async function findAdminRoleByKey(
  roleKey: string
): Promise<AdminRoleRow | null> {
  await ensureRedingtonAdminRoleTable()

  const normalized = normalizeRoleKey(roleKey)
  if (!normalized) {
    return null
  }

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_admin_role
      WHERE role_key = $1
      LIMIT 1
    `,
    [normalized]
  )

  return rows[0] ? mapAdminRoleRow(rows[0]) : null
}

export async function findAdminRoleById(
  id: number
): Promise<AdminRoleRow | null> {
  await ensureRedingtonAdminRoleTable()

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_admin_role
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  )

  return rows[0] ? mapAdminRoleRow(rows[0]) : null
}

export async function ensureSuperAdminRole(): Promise<AdminRoleRow> {
  const existing = await findAdminRoleByKey("super_admin")
  if (existing) {
    return existing
  }

  return await createAdminRole({
    role_name: "Super Admin",
    description: "Full access to all admin features",
    can_login: true,
    permissions: ["*"],
  })
}

export async function findRoleAssignmentById(
  id: number
): Promise<AdminRoleAssignmentRow | null> {
  await ensureRedingtonAdminRoleAssignmentTable()

  const { rows } = await getPgPool().query(
    `
      SELECT
        ra.*,
        r.id AS role_id,
        r.role_key,
        r.role_name,
        r.description AS role_description,
        r.can_login AS role_can_login,
        r.permissions AS role_permissions,
        r.created_at AS role_created_at,
        r.updated_at AS role_updated_at
      FROM redington_admin_role_assignment ra
      INNER JOIN redington_admin_role r ON r.id = ra.role_id
      WHERE ra.id = $1
      LIMIT 1
    `,
    [id]
  )

  return rows[0] ? mapAdminRoleAssignmentRow(rows[0]) : null
}

export type RedingtonSettingRow = {
  key: string
  value: Record<string, unknown>
  created_at: string
  updated_at: string
}

export async function ensureRedingtonSettingsTable() {
  if (settingsTableInitialized) {
    return
  }

  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_settings (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  settingsTableInitialized = true
}

export async function setRedingtonSetting(
  key: string,
  value: Record<string, unknown> | string | number | boolean | null
) {
  await ensureRedingtonSettingsTable()

  await getPgPool().query(
    `
      INSERT INTO redington_settings (key, value)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [key, JSON.stringify(value ?? {})]
  )
}

export async function getRedingtonSetting<T = Record<string, unknown>>(
  key: string
): Promise<T | null> {
  await ensureRedingtonSettingsTable()

  const { rows } = await getPgPool().query(
    `
      SELECT value
      FROM redington_settings
      WHERE key = $1
      LIMIT 1
    `,
    [key]
  )

  if (!rows[0]) {
    return null
  }

  const value = rows[0].value
  if (typeof value === "object" && value !== null) {
    return value as T
  }

  if (typeof value === "string" && value.length) {
    try {
      return JSON.parse(value) as T
    } catch {
      return (value as unknown) as T
    }
  }

  return null
}
