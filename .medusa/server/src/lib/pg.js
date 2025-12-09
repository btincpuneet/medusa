"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapCustomerOtpRow = void 0;
exports.getPgPool = getPgPool;
exports.ensureRedingtonDomainTable = ensureRedingtonDomainTable;
exports.ensureRedingtonDomainAuthTable = ensureRedingtonDomainAuthTable;
exports.ensureRedingtonDomainExtentionTable = ensureRedingtonDomainExtentionTable;
exports.ensureRedingtonDirectoryCountryTable = ensureRedingtonDirectoryCountryTable;
exports.ensureRedingtonDirectoryRegionTable = ensureRedingtonDirectoryRegionTable;
exports.mapDomainRow = mapDomainRow;
exports.findDomainById = findDomainById;
exports.listActiveDomainNames = listActiveDomainNames;
exports.mapDomainAuthRow = mapDomainAuthRow;
exports.mapDomainExtentionRow = mapDomainExtentionRow;
exports.listActiveDomainExtensionNames = listActiveDomainExtensionNames;
exports.ensureRedingtonEmailTemplateTable = ensureRedingtonEmailTemplateTable;
exports.mapEmailTemplateRow = mapEmailTemplateRow;
exports.listEmailTemplates = listEmailTemplates;
exports.createEmailTemplate = createEmailTemplate;
exports.findEmailTemplateById = findEmailTemplateById;
exports.updateEmailTemplate = updateEmailTemplate;
exports.deleteEmailTemplate = deleteEmailTemplate;
exports.ensureRedingtonBannerSliderTables = ensureRedingtonBannerSliderTables;
exports.listActiveBannerSliders = listActiveBannerSliders;
exports.listBannerSliders = listBannerSliders;
exports.findBannerSliderById = findBannerSliderById;
exports.createBannerSlider = createBannerSlider;
exports.updateBannerSlider = updateBannerSlider;
exports.deleteBannerSlider = deleteBannerSlider;
exports.listBannersBySlider = listBannersBySlider;
exports.findBannerById = findBannerById;
exports.createBanner = createBanner;
exports.updateBanner = updateBanner;
exports.deleteBanner = deleteBanner;
exports.findDirectoryCountryWithRegions = findDirectoryCountryWithRegions;
exports.findDomainExtentionById = findDomainExtentionById;
exports.ensureRedingtonCompanyCodeTable = ensureRedingtonCompanyCodeTable;
exports.mapCompanyCodeRow = mapCompanyCodeRow;
exports.findCompanyCodeByCode = findCompanyCodeByCode;
exports.ensureRedingtonAccessMappingTable = ensureRedingtonAccessMappingTable;
exports.mapAccessMappingRow = mapAccessMappingRow;
exports.findAccessMappingByAccessId = findAccessMappingByAccessId;
exports.ensureRedingtonSubscriptionCodeTable = ensureRedingtonSubscriptionCodeTable;
exports.mapSubscriptionCodeRow = mapSubscriptionCodeRow;
exports.findSubscriptionCodeByCode = findSubscriptionCodeByCode;
exports.findSubscriptionCodeById = findSubscriptionCodeById;
exports.findActiveSubscriptionCode = findActiveSubscriptionCode;
exports.ensureRedingtonAddBccTable = ensureRedingtonAddBccTable;
exports.ensureRedingtonRetainCartConfigTable = ensureRedingtonRetainCartConfigTable;
exports.mapRetainCartConfigRow = mapRetainCartConfigRow;
exports.listRetainCartConfigs = listRetainCartConfigs;
exports.upsertRetainCartConfig = upsertRetainCartConfig;
exports.deleteRetainCartConfig = deleteRetainCartConfig;
exports.findRetainCartConfigByDomainId = findRetainCartConfigByDomainId;
exports.mapAddBccRow = mapAddBccRow;
exports.ensureRedingtonCurrencyMappingTable = ensureRedingtonCurrencyMappingTable;
exports.mapCurrencyMappingRow = mapCurrencyMappingRow;
exports.ensureRedingtonCookiePolicyTable = ensureRedingtonCookiePolicyTable;
exports.mapCookiePolicyRow = mapCookiePolicyRow;
exports.ensureRedingtonCmsPageTable = ensureRedingtonCmsPageTable;
exports.ensureRedingtonGuestTokenTable = ensureRedingtonGuestTokenTable;
exports.findActiveGuestToken = findActiveGuestToken;
exports.ensureRedingtonOtpTable = ensureRedingtonOtpTable;
exports.ensureCustomerOtpTable = ensureCustomerOtpTable;
exports.upsertCustomerOtpRecord = upsertCustomerOtpRecord;
exports.fetchCustomerOtpByEmail = fetchCustomerOtpByEmail;
exports.incrementCustomerOtpAttempts = incrementCustomerOtpAttempts;
exports.markCustomerOtpConsumed = markCustomerOtpConsumed;
exports.mapOtpRow = mapOtpRow;
exports.mapCmsPageRow = mapCmsPageRow;
exports.ensureRedingtonDomainOutOfStockTable = ensureRedingtonDomainOutOfStockTable;
exports.mapDomainOutOfStockRow = mapDomainOutOfStockRow;
exports.ensureRedingtonCustomerNumberTable = ensureRedingtonCustomerNumberTable;
exports.mapCustomerNumberRow = mapCustomerNumberRow;
exports.ensureRedingtonHomeVideoTable = ensureRedingtonHomeVideoTable;
exports.mapHomeVideoRow = mapHomeVideoRow;
exports.listHomeVideos = listHomeVideos;
exports.findHomeVideoById = findHomeVideoById;
exports.createHomeVideo = createHomeVideo;
exports.updateHomeVideo = updateHomeVideo;
exports.deleteHomeVideo = deleteHomeVideo;
exports.ensureRedingtonOrderReturnTable = ensureRedingtonOrderReturnTable;
exports.mapOrderReturnRow = mapOrderReturnRow;
exports.listOrderReturnsByEmail = listOrderReturnsByEmail;
exports.listOrderReturnsByOrder = listOrderReturnsByOrder;
exports.insertOrderReturnEntries = insertOrderReturnEntries;
exports.ensureRedingtonProductEnquiryTable = ensureRedingtonProductEnquiryTable;
exports.mapProductEnquiryRow = mapProductEnquiryRow;
exports.listProductEnquiries = listProductEnquiries;
exports.createProductEnquiry = createProductEnquiry;
exports.updateProductEnquiry = updateProductEnquiry;
exports.deleteProductEnquiry = deleteProductEnquiry;
exports.retrieveProductEnquiry = retrieveProductEnquiry;
exports.ensureRedingtonMaxQtyRuleTable = ensureRedingtonMaxQtyRuleTable;
exports.mapMaxQtyRuleRow = mapMaxQtyRuleRow;
exports.ensureRedingtonMaxQtyCategoryTable = ensureRedingtonMaxQtyCategoryTable;
exports.mapMaxQtyCategoryRow = mapMaxQtyCategoryRow;
exports.ensureRedingtonOrderQuantityTrackerTable = ensureRedingtonOrderQuantityTrackerTable;
exports.mapOrderQuantityTrackerRow = mapOrderQuantityTrackerRow;
exports.ensureRedingtonOrderShipmentTable = ensureRedingtonOrderShipmentTable;
exports.mapOrderShipmentRow = mapOrderShipmentRow;
exports.ensureRedingtonOrderCcEmailTable = ensureRedingtonOrderCcEmailTable;
exports.mapOrderCcEmailRow = mapOrderCcEmailRow;
exports.ensureRedingtonMpgsTransactionTable = ensureRedingtonMpgsTransactionTable;
exports.mapMpgsTransactionRow = mapMpgsTransactionRow;
exports.ensureRedingtonProductPriceTable = ensureRedingtonProductPriceTable;
exports.mapProductPriceRow = mapProductPriceRow;
exports.ensureRedingtonProductDescImportTable = ensureRedingtonProductDescImportTable;
exports.mapProductDescImportRow = mapProductDescImportRow;
exports.insertProductDescImportLog = insertProductDescImportLog;
exports.updateProductDescImportLog = updateProductDescImportLog;
exports.listProductDescImportLogs = listProductDescImportLogs;
exports.findProductDescImportLog = findProductDescImportLog;
exports.ensureRedingtonGuestUserAuditTable = ensureRedingtonGuestUserAuditTable;
exports.mapGuestUserAuditRow = mapGuestUserAuditRow;
exports.recordGuestUserAudit = recordGuestUserAudit;
exports.listGuestUserAudits = listGuestUserAudits;
exports.ensureRedingtonInvoiceAuditTable = ensureRedingtonInvoiceAuditTable;
exports.mapInvoiceAuditRow = mapInvoiceAuditRow;
exports.recordInvoiceAudit = recordInvoiceAudit;
exports.ensureRedingtonCustomerSyncTable = ensureRedingtonCustomerSyncTable;
exports.mapCustomerSyncRow = mapCustomerSyncRow;
exports.upsertRedingtonCustomerSync = upsertRedingtonCustomerSync;
exports.listRedingtonCustomerSync = listRedingtonCustomerSync;
exports.ensureRedingtonGetInTouchTable = ensureRedingtonGetInTouchTable;
exports.mapGetInTouchRow = mapGetInTouchRow;
exports.ensureRedingtonCouponRuleTable = ensureRedingtonCouponRuleTable;
exports.mapCouponRuleRow = mapCouponRuleRow;
exports.mapAdminRoleRow = mapAdminRoleRow;
exports.mapAdminRoleAssignmentRow = mapAdminRoleAssignmentRow;
exports.ensureRedingtonAdminRoleTable = ensureRedingtonAdminRoleTable;
exports.ensureRedingtonAdminRoleAssignmentTable = ensureRedingtonAdminRoleAssignmentTable;
exports.listAdminRoles = listAdminRoles;
exports.createAdminRole = createAdminRole;
exports.updateAdminRole = updateAdminRole;
exports.deleteAdminRole = deleteAdminRole;
exports.assignRoleToUser = assignRoleToUser;
exports.removeRoleAssignment = removeRoleAssignment;
exports.listRoleAssignments = listRoleAssignments;
exports.getRolesForUser = getRolesForUser;
exports.countAdminRoles = countAdminRoles;
exports.findAdminRoleByKey = findAdminRoleByKey;
exports.findAdminRoleById = findAdminRoleById;
exports.ensureSuperAdminRole = ensureSuperAdminRole;
exports.findRoleAssignmentById = findRoleAssignmentById;
exports.ensureRedingtonSettingsTable = ensureRedingtonSettingsTable;
exports.setRedingtonSetting = setRedingtonSetting;
exports.getRedingtonSetting = getRedingtonSetting;
const pg_1 = require("pg");
let pool = null;
let domainTableInitialized = false;
let domainAuthTableInitialized = false;
let domainExtentionTableInitialized = false;
let companyCodeTableInitialized = false;
let accessMappingTableInitialized = false;
let subscriptionCodeTableInitialized = false;
let currencyMappingTableInitialized = false;
let adminRoleTableInitialized = false;
let adminRoleAssignmentTableInitialized = false;
let addBccTableInitialized = false;
let cookiePolicyTableInitialized = false;
let cmsPageTableInitialized = false;
let domainOutOfStockTableInitialized = false;
let customerNumberTableInitialized = false;
let getInTouchTableInitialized = false;
let couponRuleTableInitialized = false;
let settingsTableInitialized = false;
let guestTokenTableInitialized = false;
let otpTableInitialized = false;
let customerOtpTableInitialized = false;
let homeVideoTableInitialized = false;
let orderReturnTableInitialized = false;
let productEnquiryTableInitialized = false;
let mpgsTransactionTableInitialized = false;
let maxQtyRuleTableInitialized = false;
let maxQtyCategoryTableInitialized = false;
let orderQtyTrackerTableInitialized = false;
let orderShipmentTableInitialized = false;
let orderCcEmailTableInitialized = false;
let productPriceTableInitialized = false;
let guestUserAuditTableInitialized = false;
let invoiceAuditTableInitialized = false;
let customerSyncTableInitialized = false;
let retainCartConfigTableInitialized = false;
let bannerSliderTableInitialized = false;
let directoryCountryTableInitialized = false;
let directoryRegionTableInitialized = false;
let productDescImportTableInitialized = false;
let emailTemplateTableInitialized = false;
function getPgPool() {
    if (pool) {
        return pool;
    }
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL env variable is required for the Redington domain module.");
    }
    pool = new pg_1.Pool({
        connectionString,
    });
    return pool;
}
async function ensureRedingtonDomainTable() {
    if (domainTableInitialized) {
        return;
    }
    await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_domain (
      id SERIAL PRIMARY KEY,
      domain_name TEXT NOT NULL UNIQUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
    domainTableInitialized = true;
}
async function ensureRedingtonDomainAuthTable() {
    if (domainAuthTableInitialized) {
        return;
    }
    await ensureRedingtonDomainTable();
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
  `);
    domainAuthTableInitialized = true;
}
async function ensureRedingtonDomainExtentionTable() {
    if (domainExtentionTableInitialized) {
        return;
    }
    await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_domain_extention (
      id SERIAL PRIMARY KEY,
      domain_extention_name TEXT NOT NULL UNIQUE,
      status BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
    domainExtentionTableInitialized = true;
}
async function ensureRedingtonDirectoryCountryTable() {
    if (directoryCountryTableInitialized) {
        return;
    }
    await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_directory_country (
      country_id TEXT PRIMARY KEY,
      iso2_code TEXT,
      iso3_code TEXT,
      name TEXT
    );
  `);
    directoryCountryTableInitialized = true;
}
async function ensureRedingtonDirectoryRegionTable() {
    if (directoryRegionTableInitialized) {
        return;
    }
    await ensureRedingtonDirectoryCountryTable();
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
  `);
    directoryRegionTableInitialized = true;
}
function mapDomainRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
    return {
        id: row.id,
        domain_name: row.domain_name,
        is_active: row.is_active,
        created_at: createdAt,
        updated_at: updatedAt,
    };
}
async function findDomainById(id) {
    await ensureRedingtonDomainTable();
    const { rows } = await getPgPool().query(`
      SELECT id, domain_name, is_active, created_at, updated_at
      FROM redington_domain
      WHERE id = $1
    `, [id]);
    return rows[0] ? mapDomainRow(rows[0]) : null;
}
const normalizeDomainName = (value) => {
    if (typeof value !== "string") {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
};
async function listActiveDomainNames() {
    await ensureRedingtonDomainTable();
    const { rows } = await getPgPool().query(`
      SELECT domain_name
      FROM redington_domain
      WHERE is_active = TRUE
      ORDER BY domain_name ASC
    `);
    return rows
        .map((row) => normalizeDomainName(row.domain_name))
        .filter((value) => Boolean(value));
}
function mapDomainAuthRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
    const parsedDomainId = Number(row.domain_id);
    return {
        id: row.id,
        domain_id: Number.isFinite(parsedDomainId) ? parsedDomainId : undefined,
        domain_name: typeof row.domain_name === "string" && row.domain_name.length
            ? row.domain_name
            : undefined,
        auth_type: Number.isFinite(Number(row.auth_type))
            ? Number(row.auth_type)
            : undefined,
        email_otp: typeof row.email_otp === "boolean"
            ? row.email_otp
            : Boolean(row.email_otp),
        mobile_otp: typeof row.mobile_otp === "boolean"
            ? row.mobile_otp
            : Boolean(row.mobile_otp),
        created_at: createdAt,
        updated_at: updatedAt,
    };
}
function mapDomainExtentionRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
    return {
        id: row.id,
        domain_extention_name: row.domain_extention_name,
        status: typeof row.status === "boolean" ? row.status : Boolean(row.status),
        created_at: createdAt,
        updated_at: updatedAt,
    };
}
async function listActiveDomainExtensionNames() {
    await ensureRedingtonDomainExtentionTable();
    const { rows } = await getPgPool().query(`
      SELECT domain_extention_name
      FROM redington_domain_extention
      WHERE status = TRUE
      ORDER BY domain_extention_name ASC
    `);
    return rows
        .map((row) => normalizeDomainName(row.domain_extention_name))
        .filter((value) => Boolean(value));
}
async function ensureRedingtonEmailTemplateTable() {
    if (emailTemplateTableInitialized) {
        return;
    }
    await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_email_template (
      id SERIAL PRIMARY KEY,
      template_code TEXT NOT NULL UNIQUE,
      template_subject TEXT,
      template_text TEXT NOT NULL,
      template_style TEXT,
      template_type INTEGER NOT NULL DEFAULT 2,
      sender_name TEXT,
      sender_email TEXT,
      orig_template_code TEXT,
      orig_template_variables JSONB,
      is_system BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
    emailTemplateTableInitialized = true;
}
function mapEmailTemplateRow(row) {
    const toIso = (value) => {
        if (value instanceof Date) {
            return value.toISOString();
        }
        return String(value);
    };
    const parseJson = (value) => {
        if (!value) {
            return null;
        }
        if (typeof value === "object") {
            return value;
        }
        try {
            return JSON.parse(String(value));
        }
        catch {
            return { raw: value };
        }
    };
    return {
        id: Number(row.id),
        template_code: typeof row.template_code === "string" ? row.template_code : "",
        template_subject: typeof row.template_subject === "string" && row.template_subject.length
            ? row.template_subject
            : null,
        template_text: typeof row.template_text === "string" ? row.template_text : "",
        template_style: typeof row.template_style === "string" && row.template_style.length
            ? row.template_style
            : null,
        template_type: Number.isFinite(Number(row.template_type))
            ? Number(row.template_type)
            : 2,
        sender_name: typeof row.sender_name === "string" && row.sender_name.length
            ? row.sender_name
            : null,
        sender_email: typeof row.sender_email === "string" && row.sender_email.length
            ? row.sender_email
            : null,
        orig_template_code: typeof row.orig_template_code === "string" && row.orig_template_code.length
            ? row.orig_template_code
            : null,
        orig_template_variables: parseJson(row.orig_template_variables),
        is_system: typeof row.is_system === "boolean" ? row.is_system : Boolean(row.is_system),
        created_at: toIso(row.created_at),
        updated_at: toIso(row.updated_at),
    };
}
async function listEmailTemplates({ search, limit = 100, offset = 0, }) {
    await ensureRedingtonEmailTemplateTable();
    const conditions = [];
    const params = [];
    const normalizedSearch = (search ?? "").trim();
    if (normalizedSearch) {
        conditions.push(`(LOWER(template_code) LIKE $${params.length + 1} OR LOWER(template_subject) LIKE $${params.length + 1})`);
        params.push(`%${normalizedSearch.toLowerCase()}%`);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await getPgPool().query(`
      SELECT *,
        COUNT(*) OVER() AS total_count
      FROM redington_email_template
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `, [...params, limit, offset]);
    const count = rows.length && rows[0].total_count !== undefined
        ? Number(rows[0].total_count)
        : 0;
    return {
        templates: rows.map(mapEmailTemplateRow),
        count,
    };
}
async function createEmailTemplate(input) {
    await ensureRedingtonEmailTemplateTable();
    const { rows } = await getPgPool().query(`
      INSERT INTO redington_email_template (
        template_code,
        template_subject,
        template_text,
        template_style,
        template_type,
        sender_name,
        sender_email,
        orig_template_code,
        orig_template_variables,
        is_system
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (template_code) DO UPDATE
        SET template_subject = EXCLUDED.template_subject,
            template_text = EXCLUDED.template_text,
            template_style = EXCLUDED.template_style,
            template_type = EXCLUDED.template_type,
            sender_name = EXCLUDED.sender_name,
            sender_email = EXCLUDED.sender_email,
            orig_template_code = EXCLUDED.orig_template_code,
            orig_template_variables = EXCLUDED.orig_template_variables,
            is_system = EXCLUDED.is_system,
            updated_at = NOW()
      RETURNING *
    `, [
        input.template_code,
        input.template_subject,
        input.template_text,
        input.template_style,
        input.template_type,
        input.sender_name,
        input.sender_email,
        input.orig_template_code,
        input.orig_template_variables,
        input.is_system,
    ]);
    return mapEmailTemplateRow(rows[0]);
}
async function findEmailTemplateById(id) {
    await ensureRedingtonEmailTemplateTable();
    const { rows } = await getPgPool().query(`
      SELECT *
      FROM redington_email_template
      WHERE id = $1
      LIMIT 1
    `, [id]);
    return rows[0] ? mapEmailTemplateRow(rows[0]) : null;
}
async function updateEmailTemplate(id, updates) {
    await ensureRedingtonEmailTemplateTable();
    const setClauses = [];
    const params = [];
    const entries = Object.entries(updates);
    for (const [key, value] of entries) {
        if (value === undefined) {
            continue;
        }
        setClauses.push(`${key} = $${params.length + 1}`);
        params.push(value);
    }
    if (!setClauses.length) {
        return findEmailTemplateById(id);
    }
    params.push(id);
    const { rows } = await getPgPool().query(`
      UPDATE redington_email_template
      SET ${setClauses.join(", ")},
          updated_at = NOW()
      WHERE id = $${params.length}
      RETURNING *
    `, params);
    return rows[0] ? mapEmailTemplateRow(rows[0]) : null;
}
async function deleteEmailTemplate(id) {
    await ensureRedingtonEmailTemplateTable();
    await getPgPool().query(`
      DELETE FROM redington_email_template
      WHERE id = $1
    `, [id]);
}
const toIsoString = (value) => {
    if (!value) {
        return undefined;
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    try {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
    }
    catch {
        return undefined;
    }
};
const parseBoolean = (value, fallback = true) => {
    if (typeof value === "boolean") {
        return value;
    }
    if (value === undefined || value === null) {
        return fallback;
    }
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["1", "true", "yes", "on"].includes(normalized)) {
            return true;
        }
        if (["0", "false", "no", "off"].includes(normalized)) {
            return false;
        }
    }
    return Boolean(value);
};
const slugifyIdentifier = (value) => value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
const mapBannerRow = (row) => ({
    id: Number(row.id),
    slider_id: Number(row.slider_id ?? row.sliderId ?? 0),
    title: typeof row.title === "string" ? row.title : "",
    image_url: typeof row.image_url === "string" && row.image_url.trim().length
        ? row.image_url
        : null,
    link_url: typeof row.link_url === "string" && row.link_url.trim().length
        ? row.link_url
        : null,
    sort_order: Number(row.sort_order ?? 0),
    status: parseBoolean(row.status, true),
    created_at: toIsoString(row.created_at),
    updated_at: toIsoString(row.updated_at),
});
const mapBannerSliderRow = (row) => ({
    id: Number(row.id),
    identifier: typeof row.identifier === "string" ? row.identifier : "",
    title: typeof row.title === "string" ? row.title : "",
    status: parseBoolean(row.status, true),
    created_at: toIsoString(row.created_at),
    updated_at: toIsoString(row.updated_at),
    banners: Array.isArray(row.banners)
        ? row.banners.map(mapBannerRow)
        : [],
});
async function ensureRedingtonBannerSliderTables() {
    if (bannerSliderTableInitialized) {
        return;
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
  `);
    await getPgPool().query(`
    ALTER TABLE redington_banner_slider
      ADD COLUMN IF NOT EXISTS identifier TEXT,
      ADD COLUMN IF NOT EXISTS title TEXT,
      ADD COLUMN IF NOT EXISTS status BOOLEAN;
  `);
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
  `);
    await getPgPool().query(`
    ALTER TABLE redington_banner_slider
      ALTER COLUMN status SET DEFAULT TRUE;
  `);
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
  `);
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
  `);
    await getPgPool().query(`
    ALTER TABLE redington_banner
      ADD COLUMN IF NOT EXISTS slider_id INTEGER;
  `);
    await getPgPool().query(`
    ALTER TABLE redington_banner
      ADD COLUMN IF NOT EXISTS image_url TEXT,
      ADD COLUMN IF NOT EXISTS link_url TEXT,
      ADD COLUMN IF NOT EXISTS sort_order INTEGER;
  `);
    await getPgPool().query(`
    ALTER TABLE redington_banner
      ALTER COLUMN sort_order SET DEFAULT 0;
  `);
    await getPgPool().query(`
    UPDATE redington_banner
       SET image_url = COALESCE(image_url, image),
           link_url = COALESCE(link_url, url_banner),
           sort_order = COALESCE(sort_order, 0)
     WHERE image_url IS NULL
        OR link_url IS NULL
        OR sort_order IS NULL;
  `);
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
  `);
    await getPgPool().query(`
    ALTER TABLE redington_banner
      ALTER COLUMN status SET DEFAULT TRUE;
  `);
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
  `);
    bannerSliderTableInitialized = true;
}
const buildBannerSliderQuery = (options = {}) => {
    const params = [];
    const { sliderId, activeOnly } = options;
    if (typeof sliderId === "number") {
        params.push(sliderId);
    }
    const whereClauses = [];
    if (typeof sliderId === "number") {
        whereClauses.push(`s.id = $${params.length}`);
    }
    if (activeOnly) {
        whereClauses.push(`COALESCE(s.status::text, 'true') NOT IN ('false', '0')`);
    }
    const where = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const bannerStatusFilter = activeOnly
        ? `AND COALESCE(b.status::text, 'true') NOT IN ('false', '0')`
        : "";
    const joinFilter = `
    LEFT JOIN redington_banner_slider_link l
      ON l.slider_id = s.id
    LEFT JOIN redington_banner b
      ON (
        b.slider_id = s.id
        OR (l.banner_id IS NOT NULL AND b.id = l.banner_id)
      )
      ${bannerStatusFilter}
  `;
    const query = `
      SELECT s.id,
             s.identifier,
             s.title,
             s.status,
             s.created_at,
             s.updated_at,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', b.id,
                   'slider_id', b.slider_id,
                   'title', b.title,
                   'image_url', b.image_url,
                   'link_url', b.link_url,
                   'sort_order', b.sort_order,
                   'status', b.status,
                   'created_at', b.created_at,
                   'updated_at', b.updated_at
                 )
                 ORDER BY b.sort_order ASC, b.id ASC
               ) FILTER (WHERE b.id IS NOT NULL),
               '[]'::json
             ) AS banners
      FROM redington_banner_slider s
      ${joinFilter}
      ${where}
      GROUP BY s.id
      ORDER BY s.id ASC
    `;
    return { query, params };
};
async function listActiveBannerSliders() {
    await ensureRedingtonBannerSliderTables();
    const { query, params } = buildBannerSliderQuery({ activeOnly: true });
    const { rows } = await getPgPool().query(query, params);
    return rows.map(mapBannerSliderRow);
}
async function listBannerSliders() {
    await ensureRedingtonBannerSliderTables();
    const { query, params } = buildBannerSliderQuery();
    const { rows } = await getPgPool().query(query, params);
    return rows.map(mapBannerSliderRow);
}
async function findBannerSliderById(id, options = {}) {
    if (!Number.isFinite(id)) {
        return null;
    }
    await ensureRedingtonBannerSliderTables();
    const { query, params } = buildBannerSliderQuery({
        sliderId: id,
        activeOnly: options.activeOnly,
    });
    const { rows } = await getPgPool().query(query, params);
    return rows[0] ? mapBannerSliderRow(rows[0]) : null;
}
async function createBannerSlider(input) {
    await ensureRedingtonBannerSliderTables();
    const title = (input.title || "").trim();
    if (!title.length) {
        throw new Error("title is required");
    }
    const baseIdentifier = (input.identifier || title).trim();
    let identifier = slugifyIdentifier(baseIdentifier);
    if (!identifier.length) {
        identifier = `slider-${Date.now()}`;
    }
    const status = parseBoolean(input.status, true);
    const { rows } = await getPgPool().query(`
      INSERT INTO redington_banner_slider (identifier, title, status)
      VALUES ($1, $2, $3)
      RETURNING id, identifier, title, status, created_at, updated_at,
        '[]'::json AS banners
    `, [identifier, title, status]);
    return mapBannerSliderRow(rows[0]);
}
async function updateBannerSlider(id, updates) {
    await ensureRedingtonBannerSliderTables();
    const existing = await findBannerSliderById(id);
    if (!existing) {
        throw new Error("Banner slider not found");
    }
    const nextTitle = updates.title !== undefined ? updates.title.trim() : existing.title;
    const identifierSource = updates.identifier !== undefined && updates.identifier.trim().length
        ? updates.identifier.trim()
        : existing.identifier;
    const nextIdentifier = slugifyIdentifier(identifierSource) || existing.identifier;
    const nextStatus = updates.status !== undefined ? parseBoolean(updates.status) : existing.status;
    await getPgPool().query(`
      UPDATE redington_banner_slider
      SET title = $2,
          identifier = $3,
          status = $4,
          updated_at = NOW()
      WHERE id = $1
    `, [id, nextTitle, nextIdentifier, nextStatus]);
    const refreshed = await findBannerSliderById(id);
    if (!refreshed) {
        throw new Error("Unable to load updated slider");
    }
    return refreshed;
}
async function deleteBannerSlider(id) {
    await ensureRedingtonBannerSliderTables();
    await getPgPool().query(`
      DELETE FROM redington_banner_slider
      WHERE id = $1
    `, [id]);
}
async function listBannersBySlider(sliderId) {
    await ensureRedingtonBannerSliderTables();
    const { rows } = await getPgPool().query(`
      SELECT b.id, b.slider_id, b.title, b.image_url, b.link_url, b.sort_order, b.status,
             b.created_at, b.updated_at
      FROM redington_banner b
      LEFT JOIN redington_banner_slider_link l
        ON l.banner_id = b.id
      WHERE (l.slider_id = $1 OR b.slider_id = $1)
      ORDER BY b.sort_order ASC, b.id ASC
    `, [sliderId]);
    return rows.map(mapBannerRow);
}
async function findBannerById(id) {
    await ensureRedingtonBannerSliderTables();
    const { rows } = await getPgPool().query(`
      SELECT id, slider_id, title, image_url, link_url, sort_order, status,
             created_at, updated_at
      FROM redington_banner
      WHERE id = $1
      LIMIT 1
    `, [id]);
    return rows[0] ? mapBannerRow(rows[0]) : null;
}
async function createBanner(sliderId, input) {
    await ensureRedingtonBannerSliderTables();
    const title = (input.title || "").trim();
    if (!title.length) {
        throw new Error("title is required");
    }
    const { rows } = await getPgPool().query(`
      INSERT INTO redington_banner (slider_id, title, image_url, link_url, sort_order, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, slider_id, title, image_url, link_url, sort_order, status,
                created_at, updated_at
    `, [
        sliderId,
        title,
        input.image_url || null,
        input.link_url || null,
        Number(input.sort_order ?? 0),
        parseBoolean(input.status, true),
    ]);
    await getPgPool().query(`
      INSERT INTO redington_banner_slider_link (slider_id, banner_id, position)
      VALUES ($1, $2, $3)
      ON CONFLICT (slider_id, banner_id) DO UPDATE
        SET position = EXCLUDED.position
    `, [sliderId, rows[0].id, Number(input.sort_order ?? 0)]);
    return mapBannerRow(rows[0]);
}
async function updateBanner(bannerId, updates) {
    await ensureRedingtonBannerSliderTables();
    const existing = await findBannerById(bannerId);
    if (!existing) {
        throw new Error("Banner not found");
    }
    const nextTitle = updates.title !== undefined ? updates.title.trim() : existing.title;
    const nextImage = updates.image_url !== undefined ? updates.image_url : existing.image_url;
    const nextLink = updates.link_url !== undefined ? updates.link_url : existing.link_url;
    const nextSortOrder = updates.sort_order !== undefined ? Number(updates.sort_order) : existing.sort_order;
    const nextStatus = updates.status !== undefined ? parseBoolean(updates.status) : existing.status;
    const { rows } = await getPgPool().query(`
      UPDATE redington_banner
      SET title = $2,
          image_url = $3,
          link_url = $4,
          sort_order = $5,
          status = $6,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, slider_id, title, image_url, link_url, sort_order, status,
                created_at, updated_at
    `, [bannerId, nextTitle, nextImage || null, nextLink || null, nextSortOrder, nextStatus]);
    return mapBannerRow(rows[0]);
}
async function deleteBanner(bannerId) {
    await ensureRedingtonBannerSliderTables();
    await getPgPool().query(`
      DELETE FROM redington_banner
      WHERE id = $1
    `, [bannerId]);
}
const normalizeCountryId = (value) => {
    if (typeof value !== "string") {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed.toUpperCase() : null;
};
async function findDirectoryCountryWithRegions(countryId) {
    const normalized = normalizeCountryId(countryId);
    if (!normalized) {
        return null;
    }
    await ensureRedingtonDirectoryCountryTable();
    await ensureRedingtonDirectoryRegionTable();
    const { rows } = await getPgPool().query(`
      SELECT country_id, iso2_code, iso3_code, name
      FROM redington_directory_country
      WHERE UPPER(country_id) = $1
      LIMIT 1
    `, [normalized]);
    if (!rows.length) {
        return null;
    }
    const [country] = rows;
    const { rows: regionRows } = await getPgPool().query(`
      SELECT region_id, country_id, code, name
      FROM redington_directory_country_region
      WHERE UPPER(country_id) = $1
      ORDER BY sort_order ASC, name ASC, region_id ASC
    `, [normalized]);
    return {
        country_id: country.country_id,
        iso2_code: country.iso2_code,
        iso3_code: country.iso3_code,
        name: country.name,
        regions: regionRows.map((region) => ({
            region_id: Number(region.region_id),
            country_id: region.country_id,
            code: typeof region.code === "string" && region.code.trim().length
                ? region.code
                : null,
            name: typeof region.name === "string" && region.name.trim().length
                ? region.name
                : null,
        })),
    };
}
async function findDomainExtentionById(id) {
    await ensureRedingtonDomainExtentionTable();
    const { rows } = await getPgPool().query(`
      SELECT id, domain_extention_name, status, created_at, updated_at
      FROM redington_domain_extention
      WHERE id = $1
    `, [id]);
    return rows[0] ? mapDomainExtentionRow(rows[0]) : null;
}
async function ensureRedingtonCompanyCodeTable() {
    if (companyCodeTableInitialized) {
        return;
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
  `);
    companyCodeTableInitialized = true;
}
function mapCompanyCodeRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
    return {
        id: row.id,
        country_code: typeof row.country_code === "string" ? row.country_code : "",
        company_code: typeof row.company_code === "string" ? row.company_code : "",
        status: typeof row.status === "boolean" ? row.status : Boolean(row.status),
        created_at: createdAt,
        updated_at: updatedAt,
    };
}
async function findCompanyCodeByCode(companyCode) {
    await ensureRedingtonCompanyCodeTable();
    const { rows } = await getPgPool().query(`
      SELECT *
      FROM redington_company_code
      WHERE company_code = $1
      LIMIT 1
    `, [companyCode]);
    return rows[0] ? mapCompanyCodeRow(rows[0]) : null;
}
function parseBrandIds(input) {
    if (!input) {
        return [];
    }
    if (Array.isArray(input)) {
        return input.map((entry) => String(entry)).filter(Boolean);
    }
    if (typeof input === "string") {
        try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed)) {
                return parsed.map((entry) => String(entry)).filter(Boolean);
            }
        }
        catch (err) {
            // fall back to comma separated values
            return input
                .split(",")
                .map((entry) => entry.trim())
                .filter(Boolean);
        }
        return input
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean);
    }
    return [];
}
async function ensureRedingtonAccessMappingTable() {
    if (accessMappingTableInitialized) {
        return;
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
  `);
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
  `);
    accessMappingTableInitialized = true;
}
function mapAccessMappingRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
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
        domain_extention_name: typeof row.domain_extention_name === "string"
            ? row.domain_extention_name
            : undefined,
        created_at: createdAt,
        updated_at: updatedAt,
    };
}
async function findAccessMappingByAccessId(accessId, options = {}) {
    await ensureRedingtonAccessMappingTable();
    const params = [accessId];
    let where = "access_id = $1";
    if (options.companyCode) {
        params.push(options.companyCode);
        where += ` AND company_code = $${params.length}`;
    }
    const { rows } = await getPgPool().query(`
      SELECT *
      FROM redington_access_mapping
      WHERE ${where}
      ORDER BY updated_at DESC
      LIMIT 1
    `, params);
    return rows[0] ? mapAccessMappingRow(rows[0]) : null;
}
async function ensureRedingtonSubscriptionCodeTable() {
    if (subscriptionCodeTableInitialized) {
        return;
    }
    await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_subscription_code (
      id SERIAL PRIMARY KEY,
      subscription_code TEXT NOT NULL,
      company_code TEXT NOT NULL,
      access_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      status BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
    await getPgPool().query(`
    CREATE UNIQUE INDEX IF NOT EXISTS redington_subscription_code_code_unique_idx
    ON redington_subscription_code (LOWER(subscription_code));
  `);
    await getPgPool().query(`
    CREATE INDEX IF NOT EXISTS redington_subscription_code_email_idx
    ON redington_subscription_code (LOWER(email));
  `);
    await getPgPool().query(`
    CREATE INDEX IF NOT EXISTS redington_subscription_code_access_idx
    ON redington_subscription_code (access_id);
  `);
    subscriptionCodeTableInitialized = true;
}
function mapSubscriptionCodeRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
    return {
        id: Number(row.id),
        subscription_code: typeof row.subscription_code === "string"
            ? row.subscription_code
            : String(row.subscription_code || ""),
        company_code: typeof row.company_code === "string" ? row.company_code : "",
        access_id: typeof row.access_id === "string" ? row.access_id : "",
        first_name: typeof row.first_name === "string" ? row.first_name : "",
        last_name: typeof row.last_name === "string" ? row.last_name : "",
        email: typeof row.email === "string" ? row.email : "",
        status: Boolean(row.status),
        created_at: createdAt,
        updated_at: updatedAt,
    };
}
const normalizeEmail = (value) => value.trim().toLowerCase();
async function findSubscriptionCodeByCode(subscriptionCode) {
    await ensureRedingtonSubscriptionCodeTable();
    const trimmed = subscriptionCode.trim();
    if (!trimmed) {
        return null;
    }
    const { rows } = await getPgPool().query(`
      SELECT *
      FROM redington_subscription_code
      WHERE LOWER(subscription_code) = LOWER($1)
      LIMIT 1
    `, [trimmed]);
    return rows[0] ? mapSubscriptionCodeRow(rows[0]) : null;
}
async function findSubscriptionCodeById(id) {
    await ensureRedingtonSubscriptionCodeTable();
    const { rows } = await getPgPool().query(`
      SELECT *
      FROM redington_subscription_code
      WHERE id = $1
      LIMIT 1
    `, [id]);
    return rows[0] ? mapSubscriptionCodeRow(rows[0]) : null;
}
async function findActiveSubscriptionCode(options) {
    await ensureRedingtonSubscriptionCodeTable();
    const email = normalizeEmail(options.email || "");
    const subscriptionCode = (options.subscriptionCode || "").trim();
    if (!email || !subscriptionCode) {
        return null;
    }
    const { rows } = await getPgPool().query(`
      SELECT *
      FROM redington_subscription_code
      WHERE LOWER(email) = LOWER($1)
        AND LOWER(subscription_code) = LOWER($2)
        AND status = TRUE
      ORDER BY updated_at DESC
      LIMIT 1
    `, [email, subscriptionCode]);
    return rows[0] ? mapSubscriptionCodeRow(rows[0]) : null;
}
async function ensureRedingtonAddBccTable() {
    if (addBccTableInitialized) {
        return;
    }
    await ensureRedingtonDomainTable();
    await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_add_bcc (
      id SERIAL PRIMARY KEY,
      domain_id INTEGER REFERENCES redington_domain(id) ON DELETE CASCADE,
      bcc_emails TEXT,
      CONSTRAINT redington_add_bcc_domain_unique UNIQUE (domain_id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
    addBccTableInitialized = true;
}
const formatRetryTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return "00:00:00";
    }
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};
const parseRetryTimeInput = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return Math.max(0, Math.floor(value));
    }
    if (typeof value === "string" && value.trim().length) {
        const normalized = value.trim();
        const parts = normalized.split(":").map((part) => Number(part));
        if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
            const [h, m, s] = parts;
            return Math.max(0, h * 3600 + m * 60 + s);
        }
        const numeric = Number(normalized);
        if (Number.isFinite(numeric)) {
            return Math.max(0, Math.floor(numeric));
        }
    }
    return 7200; // default 2 hours
};
async function ensureRedingtonRetainCartConfigTable() {
    if (retainCartConfigTableInitialized) {
        return;
    }
    await ensureRedingtonDomainTable();
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
  `);
    retainCartConfigTableInitialized = true;
}
function mapRetainCartConfigRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
    const domainId = row.domain_id !== null && row.domain_id !== undefined
        ? Number(row.domain_id)
        : null;
    const retrySeconds = Number(row.retry_time_seconds);
    const addBcc = typeof row.add_bcc === "string" && row.add_bcc.length
        ? row.add_bcc.split(",").map((entry) => entry.trim()).filter(Boolean)
        : [];
    return {
        id: Number(row.id),
        domain_id: Number.isFinite(domainId) ? domainId : null,
        retry_time: formatRetryTime(Number.isFinite(retrySeconds) ? retrySeconds : 7200),
        add_bcc: addBcc,
        is_active: typeof row.is_active === "boolean" ? row.is_active : Boolean(row.is_active),
        created_at: createdAt,
        updated_at: updatedAt,
        domain_name: typeof row.domain_name === "string" && row.domain_name.length
            ? row.domain_name
            : null,
    };
}
async function listRetainCartConfigs() {
    await ensureRedingtonRetainCartConfigTable();
    const { rows } = await getPgPool().query(`
      SELECT rcc.*, d.domain_name
      FROM redington_retain_cart_config rcc
      LEFT JOIN redington_domain d ON d.id = rcc.domain_id
      ORDER BY rcc.updated_at DESC
    `);
    return rows.map((row) => mapRetainCartConfigRow(row));
}
async function upsertRetainCartConfig(options) {
    await ensureRedingtonRetainCartConfigTable();
    const domainId = options.domain_id === undefined || options.domain_id === null
        ? null
        : Number(options.domain_id);
    const retrySeconds = parseRetryTimeInput(options.retry_time ?? 7200);
    const addBccArray = Array.isArray(options.add_bcc)
        ? options.add_bcc
        : typeof options.add_bcc === "string"
            ? options.add_bcc
                .split(/[\n,]+/)
                .map((entry) => entry.trim())
                .filter(Boolean)
            : [];
    const serializedBcc = addBccArray.join(",");
    const isActive = options.is_active === undefined ? true : Boolean(options.is_active);
    const params = [domainId, retrySeconds, serializedBcc, isActive];
    let query;
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
    `;
    }
    else {
        query = `
      INSERT INTO redington_retain_cart_config (domain_id, retry_time_seconds, add_bcc, is_active)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (domain_id) DO UPDATE
        SET retry_time_seconds = EXCLUDED.retry_time_seconds,
            add_bcc = EXCLUDED.add_bcc,
            is_active = EXCLUDED.is_active,
            updated_at = NOW()
      RETURNING *
    `;
    }
    const { rows } = await getPgPool().query(query, params);
    return mapRetainCartConfigRow(rows[0]);
}
async function deleteRetainCartConfig(id) {
    await ensureRedingtonRetainCartConfigTable();
    await getPgPool().query(`
      DELETE FROM redington_retain_cart_config
      WHERE id = $1
    `, [id]);
}
async function findRetainCartConfigByDomainId(domainId) {
    await ensureRedingtonRetainCartConfigTable();
    const params = [];
    let where = "domain_id IS NULL";
    if (domainId !== null && domainId !== undefined) {
        where = "domain_id = $1";
        params.push(domainId);
    }
    const { rows } = await getPgPool().query(`
      SELECT *
      FROM redington_retain_cart_config
      WHERE ${where}
      ORDER BY updated_at DESC
      LIMIT 1
    `, params);
    return rows[0] ? mapRetainCartConfigRow(rows[0]) : null;
}
function mapAddBccRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
    const domainId = row.domain_id !== null && row.domain_id !== undefined
        ? Number(row.domain_id)
        : null;
    const emailsRaw = typeof row.bcc_emails === "string" ? row.bcc_emails : "";
    const emails = emailsRaw
        ? emailsRaw
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean)
        : [];
    return {
        id: Number(row.id),
        domain_id: domainId && Number.isFinite(domainId) ? domainId : null,
        bcc_emails: emails,
        created_at: createdAt,
        updated_at: updatedAt,
    };
}
async function ensureRedingtonCurrencyMappingTable() {
    if (currencyMappingTableInitialized) {
        return;
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
  `);
    currencyMappingTableInitialized = true;
}
function mapCurrencyMappingRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
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
        payment_method: typeof row.payment_method === "string" ? row.payment_method : "",
        shipment_tracking_url: typeof row.shipment_tracking_url === "string"
            ? row.shipment_tracking_url
            : "",
        is_active: typeof row.is_active === "boolean" ? row.is_active : Boolean(row.is_active),
        created_at: createdAt,
        updated_at: updatedAt,
    };
}
async function ensureRedingtonCookiePolicyTable() {
    if (cookiePolicyTableInitialized) {
        return;
    }
    await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_cookie_policy (
      id SERIAL PRIMARY KEY,
      document_url TEXT,
      status TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
    cookiePolicyTableInitialized = true;
}
function mapCookiePolicyRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
    return {
        id: Number(row.id),
        document_url: typeof row.document_url === "string" && row.document_url.length
            ? row.document_url
            : null,
        status: typeof row.status === "string" && row.status.length ? row.status : null,
        created_at: createdAt,
        updated_at: updatedAt,
    };
}
async function ensureRedingtonCmsPageTable() {
    if (cmsPageTableInitialized) {
        return;
    }
    await ensureRedingtonDomainTable();
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
  `);
    cmsPageTableInitialized = true;
}
async function ensureRedingtonGuestTokenTable() {
    if (guestTokenTableInitialized) {
        return;
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
  `);
    guestTokenTableInitialized = true;
}
async function findActiveGuestToken(token) {
    await ensureRedingtonGuestTokenTable();
    const { rows } = await getPgPool().query(`
      SELECT id, email, token, expires_at
      FROM redington_guest_token
      WHERE token = $1
      LIMIT 1
    `, [token]);
    if (!rows[0]) {
        return null;
    }
    const expiresAt = rows[0].expires_at instanceof Date
        ? rows[0].expires_at
        : new Date(rows[0].expires_at);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
        return null;
    }
    return {
        id: Number(rows[0].id),
        email: typeof rows[0].email === "string" ? rows[0].email : "",
        token: typeof rows[0].token === "string" ? rows[0].token : "",
        expires_at: expiresAt.toISOString(),
    };
}
async function ensureRedingtonOtpTable() {
    if (otpTableInitialized) {
        return;
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
  `);
    otpTableInitialized = true;
}
async function ensureCustomerOtpTable() {
    if (customerOtpTableInitialized) {
        return;
    }
    await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS store_customer_otp (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      code_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
    await getPgPool().query(`
    CREATE INDEX IF NOT EXISTS store_customer_otp_email_idx
      ON store_customer_otp (email);
  `);
    customerOtpTableInitialized = true;
}
const mapCustomerOtpRow = (row) => ({
    id: Number(row.id),
    email: typeof row.email === "string" ? row.email : "",
    code_hash: typeof row.code_hash === "string" ? row.code_hash : "",
    attempts: Number(row.attempts ?? 0),
    expires_at: row.expires_at instanceof Date
        ? row.expires_at.toISOString()
        : String(row.expires_at ?? ""),
    consumed_at: row.consumed_at instanceof Date
        ? row.consumed_at.toISOString()
        : row.consumed_at
            ? String(row.consumed_at)
            : null,
    created_at: row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at ?? ""),
    updated_at: row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at ?? ""),
});
exports.mapCustomerOtpRow = mapCustomerOtpRow;
async function upsertCustomerOtpRecord(email, codeHash, expiresAt) {
    await ensureCustomerOtpTable();
    await getPgPool().query(`
      INSERT INTO store_customer_otp (email, code_hash, attempts, expires_at)
      VALUES ($1, $2, 0, $3)
      ON CONFLICT (email) DO UPDATE
        SET code_hash = EXCLUDED.code_hash,
            attempts = 0,
            expires_at = EXCLUDED.expires_at,
            consumed_at = NULL,
            updated_at = NOW()
    `, [email, codeHash, expiresAt]);
}
async function fetchCustomerOtpByEmail(email) {
    await ensureCustomerOtpTable();
    const { rows } = await getPgPool().query(`
      SELECT *
      FROM store_customer_otp
      WHERE email = $1
      LIMIT 1
    `, [email]);
    return rows[0] ? (0, exports.mapCustomerOtpRow)(rows[0]) : null;
}
async function incrementCustomerOtpAttempts(id) {
    await ensureCustomerOtpTable();
    await getPgPool().query(`
      UPDATE store_customer_otp
      SET attempts = attempts + 1,
          updated_at = NOW()
      WHERE id = $1
    `, [id]);
}
async function markCustomerOtpConsumed(id) {
    await ensureCustomerOtpTable();
    await getPgPool().query(`
      UPDATE store_customer_otp
      SET consumed_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
    `, [id]);
}
function mapOtpRow(row) {
    const toIso = (value) => {
        if (value instanceof Date) {
            return value.toISOString();
        }
        return String(value ?? "");
    };
    const toNullableIso = (value) => {
        if (value === null || value === undefined) {
            return null;
        }
        if (value instanceof Date) {
            return value.toISOString();
        }
        const str = String(value);
        return str.length ? str : null;
    };
    return {
        id: Number(row.id),
        email: typeof row.email === "string" ? row.email : "",
        action: typeof row.action === "string" ? row.action : "",
        code: typeof row.code === "string" ? row.code : String(row.code ?? ""),
        expires_at: toIso(row.expires_at),
        consumed_at: toNullableIso(row.consumed_at),
        created_at: toIso(row.created_at),
        updated_at: toIso(row.updated_at),
    };
}
function mapCmsPageRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
    const metadata = typeof row.metadata === "object" && row.metadata !== null
        ? row.metadata
        : (() => {
            if (typeof row.metadata === "string" && row.metadata.length) {
                try {
                    return JSON.parse(row.metadata);
                }
                catch {
                    return {};
                }
            }
            return {};
        })();
    const domainId = row.domain_id !== null && row.domain_id !== undefined
        ? Number(row.domain_id)
        : null;
    return {
        id: Number(row.id),
        slug: typeof row.slug === "string" ? row.slug : "",
        title: typeof row.title === "string" ? row.title : "",
        content: typeof row.content === "string" ? row.content : "",
        country_code: typeof row.country_code === "string" && row.country_code.length
            ? row.country_code
            : null,
        domain_id: domainId && Number.isFinite(domainId) ? domainId : null,
        access_id: typeof row.access_id === "string" && row.access_id.length
            ? row.access_id
            : null,
        is_active: typeof row.is_active === "boolean"
            ? row.is_active
            : Boolean(row.is_active),
        metadata: metadata,
        created_at: createdAt,
        updated_at: updatedAt,
    };
}
async function ensureRedingtonDomainOutOfStockTable() {
    if (domainOutOfStockTableInitialized) {
        return;
    }
    await ensureRedingtonDomainTable();
    await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_domain_out_of_stock (
      id SERIAL PRIMARY KEY,
      domain_id INTEGER NOT NULL UNIQUE REFERENCES redington_domain(id) ON DELETE CASCADE,
      status BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
    domainOutOfStockTableInitialized = true;
}
function mapDomainOutOfStockRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
    return {
        id: Number(row.id),
        domain_id: Number(row.domain_id),
        status: typeof row.status === "boolean" ? row.status : Boolean(row.status),
        created_at: createdAt,
        updated_at: updatedAt,
    };
}
async function ensureRedingtonCustomerNumberTable() {
    if (customerNumberTableInitialized) {
        return;
    }
    await ensureRedingtonDomainTable();
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
  `);
    customerNumberTableInitialized = true;
}
function mapCustomerNumberRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
    return {
        id: Number(row.id),
        company_code: typeof row.company_code === "string" ? row.company_code : "",
        distribution_channel: typeof row.distribution_channel === "string"
            ? row.distribution_channel
            : "",
        brand_id: typeof row.brand_id === "string" ? row.brand_id : "",
        domain_id: Number(row.domain_id),
        customer_number: typeof row.customer_number === "string" ? row.customer_number : "",
        created_at: createdAt,
        updated_at: updatedAt,
    };
}
async function ensureRedingtonHomeVideoTable() {
    if (homeVideoTableInitialized) {
        return;
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
  `);
    homeVideoTableInitialized = true;
}
function mapHomeVideoRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
    return {
        id: Number(row.id),
        title: typeof row.title === "string" ? row.title : "",
        url: typeof row.url === "string" ? row.url : "",
        status: typeof row.status === "boolean" ? row.status : Boolean(row.status),
        created_at: createdAt,
        updated_at: updatedAt,
    };
}
async function listHomeVideos() {
    await ensureRedingtonHomeVideoTable();
    const { rows } = await getPgPool().query(`
      SELECT id, title, url, status, created_at, updated_at
      FROM redington_home_video
      ORDER BY created_at DESC
    `);
    return rows.map(mapHomeVideoRow);
}
async function findHomeVideoById(id) {
    await ensureRedingtonHomeVideoTable();
    const { rows } = await getPgPool().query(`
      SELECT id, title, url, status, created_at, updated_at
      FROM redington_home_video
      WHERE id = $1
      LIMIT 1
    `, [id]);
    return rows[0] ? mapHomeVideoRow(rows[0]) : null;
}
async function createHomeVideo(input) {
    await ensureRedingtonHomeVideoTable();
    const status = typeof input.status === "boolean" ? input.status : Boolean(input.status);
    const { rows } = await getPgPool().query(`
      INSERT INTO redington_home_video (title, url, status)
      VALUES ($1, $2, $3)
      RETURNING id, title, url, status, created_at, updated_at
    `, [input.title, input.url, status ?? true]);
    return mapHomeVideoRow(rows[0]);
}
async function updateHomeVideo(id, updates) {
    await ensureRedingtonHomeVideoTable();
    const existing = await findHomeVideoById(id);
    if (!existing) {
        throw new Error("Home video not found");
    }
    const nextTitle = updates.title !== undefined ? updates.title : existing.title;
    const nextUrl = updates.url !== undefined ? updates.url : existing.url;
    const nextStatus = updates.status !== undefined ? updates.status : existing.status;
    const { rows } = await getPgPool().query(`
      UPDATE redington_home_video
      SET title = $2,
          url = $3,
          status = $4,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, title, url, status, created_at, updated_at
    `, [id, nextTitle, nextUrl, nextStatus]);
    return mapHomeVideoRow(rows[0]);
}
async function deleteHomeVideo(id) {
    await ensureRedingtonHomeVideoTable();
    await getPgPool().query(`
      DELETE FROM redington_home_video
      WHERE id = $1
    `, [id]);
}
async function ensureRedingtonOrderReturnTable() {
    if (orderReturnTableInitialized) {
        return;
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
  `);
    orderReturnTableInitialized = true;
}
function mapOrderReturnRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
    const qty = Number(row.qty);
    const priceRaw = typeof row.price === "number" ? row.price : Number(row.price ?? NaN);
    return {
        id: Number(row.id),
        order_id: typeof row.order_id === "string" ? row.order_id : "",
        user_name: typeof row.user_name === "string" ? row.user_name : "",
        user_email: typeof row.user_email === "string" ? row.user_email : "",
        sku: typeof row.sku === "string" ? row.sku : "",
        product_name: typeof row.product_name === "string" ? row.product_name : "",
        qty: Number.isFinite(qty) ? qty : 0,
        price: Number.isFinite(priceRaw) ? priceRaw : null,
        order_status: typeof row.order_status === "string" && row.order_status.length
            ? row.order_status
            : null,
        return_status: typeof row.return_status === "string" && row.return_status.length
            ? row.return_status
            : null,
        remarks: typeof row.remarks === "string" && row.remarks.length
            ? row.remarks
            : null,
        created_at: createdAt,
        updated_at: updatedAt,
    };
}
async function listOrderReturnsByEmail(email) {
    await ensureRedingtonOrderReturnTable();
    const { rows } = await getPgPool().query(`
      SELECT *
      FROM redington_order_return
      WHERE LOWER(user_email) = LOWER($1)
      ORDER BY created_at DESC
    `, [email]);
    return rows.map(mapOrderReturnRow);
}
async function listOrderReturnsByOrder(orderId, options) {
    await ensureRedingtonOrderReturnTable();
    const values = [orderId];
    let filter = "";
    if (options?.email) {
        values.push(options.email);
        filter = "AND LOWER(user_email) = LOWER($2)";
    }
    const { rows } = await getPgPool().query(`
      SELECT *
      FROM redington_order_return
      WHERE order_id = $1
        ${filter}
      ORDER BY created_at DESC
    `, values);
    return rows.map(mapOrderReturnRow);
}
async function insertOrderReturnEntries(entries) {
    if (!entries.length) {
        return [];
    }
    await ensureRedingtonOrderReturnTable();
    const inserted = [];
    for (const entry of entries) {
        const { order_id, user_name, user_email, sku, product_name, qty, price, order_status, return_status, remarks, } = entry;
        const { rows } = await getPgPool().query(`
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
      `, [
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
        ]);
        if (rows[0]) {
            inserted.push(mapOrderReturnRow(rows[0]));
        }
    }
    return inserted;
}
async function ensureRedingtonProductEnquiryTable() {
    if (productEnquiryTableInitialized) {
        return;
    }
    await ensureRedingtonDomainTable();
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
  `);
    productEnquiryTableInitialized = true;
}
function mapProductEnquiryRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
    const parseNullableNumber = (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    };
    const normalizeString = (value) => {
        if (typeof value === "string") {
            const trimmed = value.trim();
            return trimmed.length ? trimmed : null;
        }
        return null;
    };
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
    };
}
const buildProductEnquiryWhere = (filters) => {
    const conditions = [];
    const params = [];
    if (filters.status) {
        params.push(filters.status);
        conditions.push(`LOWER(status) = LOWER($${params.length})`);
    }
    if (filters.email) {
        params.push(filters.email);
        conditions.push(`LOWER(email) = LOWER($${params.length})`);
    }
    if (filters.sku) {
        params.push(filters.sku);
        conditions.push(`LOWER(sku) = LOWER($${params.length})`);
    }
    if (filters.product_id !== undefined) {
        params.push(filters.product_id);
        conditions.push(`product_id = $${params.length}`);
    }
    if (filters.access_id !== undefined) {
        params.push(filters.access_id);
        conditions.push(`access_id = $${params.length}`);
    }
    if (filters.user_id !== undefined) {
        params.push(filters.user_id);
        conditions.push(`user_id = $${params.length}`);
    }
    return { conditions, params };
};
const clampPagination = (limit, offset, maxLimit = 200, defaultLimit = 25) => {
    const parsedLimit = Number(limit);
    const parsedOffset = Number(offset);
    const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(Math.trunc(parsedLimit), maxLimit)
        : defaultLimit;
    const safeOffset = Number.isFinite(parsedOffset) && parsedOffset >= 0
        ? Math.trunc(parsedOffset)
        : 0;
    return { limit: safeLimit, offset: safeOffset };
};
async function listProductEnquiries(filters = {}, pagination = {}) {
    await ensureRedingtonProductEnquiryTable();
    const { conditions, params } = buildProductEnquiryWhere(filters);
    const { limit, offset } = clampPagination(pagination.limit, pagination.offset);
    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";
    const dataParams = [...params, limit, offset];
    const { rows } = await getPgPool().query(`
      SELECT *
      FROM redington_product_enquiry
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${dataParams.length - 1}
      OFFSET $${dataParams.length}
    `, dataParams);
    const countResult = await getPgPool().query(`
      SELECT COUNT(*) AS count
      FROM redington_product_enquiry
      ${whereClause}
    `, params);
    const count = Number(countResult.rows[0]?.count ?? 0);
    return [rows.map(mapProductEnquiryRow), count];
}
async function createProductEnquiry(input) {
    await ensureRedingtonProductEnquiryTable();
    const { rows } = await getPgPool().query(`
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
    `, [
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
    ]);
    return mapProductEnquiryRow(rows[0]);
}
async function updateProductEnquiry(id, input) {
    await ensureRedingtonProductEnquiryTable();
    const fields = [];
    const params = [];
    const addField = (column, value) => {
        params.push(value);
        fields.push(`${column} = $${params.length}`);
    };
    if (input.user_id !== undefined)
        addField("user_id", input.user_id);
    if (input.access_id !== undefined)
        addField("access_id", input.access_id);
    if (input.domain_id !== undefined)
        addField("domain_id", input.domain_id);
    if (input.company_code !== undefined)
        addField("company_code", input.company_code);
    if (input.product_id !== undefined)
        addField("product_id", input.product_id);
    if (input.fullname !== undefined)
        addField("fullname", input.fullname);
    if (input.email !== undefined)
        addField("email", input.email);
    if (input.product_name !== undefined)
        addField("product_name", input.product_name);
    if (input.domain_name !== undefined)
        addField("domain_name", input.domain_name);
    if (input.country_name !== undefined)
        addField("country_name", input.country_name);
    if (input.sku !== undefined)
        addField("sku", input.sku);
    if (input.price !== undefined)
        addField("price", input.price);
    if (input.comments !== undefined)
        addField("comments", input.comments);
    if (input.status !== undefined)
        addField("status", input.status);
    if (!fields.length) {
        return retrieveProductEnquiry(id);
    }
    params.push(id);
    const { rows } = await getPgPool().query(`
      UPDATE redington_product_enquiry
      SET ${fields.join(", ")},
          updated_at = NOW()
      WHERE id = $${params.length}
      RETURNING *
    `, params);
    return rows[0] ? mapProductEnquiryRow(rows[0]) : null;
}
async function deleteProductEnquiry(id) {
    await ensureRedingtonProductEnquiryTable();
    const result = await getPgPool().query(`
      DELETE FROM redington_product_enquiry
      WHERE id = $1
    `, [id]);
    return result.rowCount > 0;
}
async function retrieveProductEnquiry(id) {
    await ensureRedingtonProductEnquiryTable();
    const { rows } = await getPgPool().query(`
      SELECT *
      FROM redington_product_enquiry
      WHERE id = $1
      LIMIT 1
    `, [id]);
    return rows[0] ? mapProductEnquiryRow(rows[0]) : null;
}
async function ensureRedingtonMaxQtyRuleTable() {
    if (maxQtyRuleTableInitialized) {
        return;
    }
    await ensureRedingtonDomainTable();
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
  `);
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
  `);
    maxQtyRuleTableInitialized = true;
}
function mapMaxQtyRuleRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
    const maxQty = Number(row.max_qty);
    return {
        id: Number(row.id),
        category_id: typeof row.category_id === "string" ? row.category_id : "",
        brand_id: typeof row.brand_id === "string" ? row.brand_id : "",
        company_code: typeof row.company_code === "string" ? row.company_code : "",
        domain_id: row.domain_id === null || row.domain_id === undefined
            ? null
            : Number(row.domain_id),
        max_qty: Number.isFinite(maxQty) ? maxQty : 0,
        created_at: createdAt,
        updated_at: updatedAt,
    };
}
async function ensureRedingtonMaxQtyCategoryTable() {
    if (maxQtyCategoryTableInitialized) {
        return;
    }
    await ensureRedingtonDomainTable();
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
  `);
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
  `);
    maxQtyCategoryTableInitialized = true;
}
function mapMaxQtyCategoryRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
    const maxQty = Number(row.max_qty);
    return {
        id: Number(row.id),
        category_ids: typeof row.category_ids === "string" ? row.category_ids : "",
        brand_id: typeof row.brand_id === "string" ? row.brand_id : "",
        company_code: typeof row.company_code === "string" ? row.company_code : "",
        domain_id: row.domain_id === null || row.domain_id === undefined
            ? null
            : Number(row.domain_id),
        max_qty: Number.isFinite(maxQty) ? maxQty : 0,
        created_at: createdAt,
        updated_at: updatedAt,
    };
}
async function ensureRedingtonOrderQuantityTrackerTable() {
    if (orderQtyTrackerTableInitialized) {
        return;
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
  `);
    orderQtyTrackerTableInitialized = true;
}
function mapOrderQuantityTrackerRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
    const quantity = Number(row.quantity);
    return {
        id: Number(row.id),
        customer_id: Number(row.customer_id),
        order_increment_id: typeof row.order_increment_id === "string" ? row.order_increment_id : "",
        sku: typeof row.sku === "string" ? row.sku : "",
        quantity: Number.isFinite(quantity) ? quantity : 0,
        brand_id: typeof row.brand_id === "string" && row.brand_id.length
            ? row.brand_id
            : null,
        created_at: createdAt,
        updated_at: updatedAt,
    };
}
async function ensureRedingtonOrderShipmentTable() {
    if (orderShipmentTableInitialized) {
        return;
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
  `);
    orderShipmentTableInitialized = true;
}
function mapOrderShipmentRow(row) {
    const toIso = (value) => {
        if (!value) {
            return null;
        }
        if (value instanceof Date) {
            return value.toISOString();
        }
        const str = String(value);
        return str.length ? str : null;
    };
    let metadata = {};
    if (row.metadata && typeof row.metadata === "object") {
        metadata = row.metadata;
    }
    else if (typeof row.metadata === "string" && row.metadata.length) {
        try {
            metadata = JSON.parse(row.metadata);
        }
        catch {
            metadata = {};
        }
    }
    return {
        id: Number(row.id),
        order_id: typeof row.order_id === "string" && row.order_id.length
            ? row.order_id
            : null,
        order_increment_id: typeof row.order_increment_id === "string" ? row.order_increment_id : "",
        order_status: typeof row.order_status === "string" ? row.order_status : "",
        awb_number: typeof row.awb_number === "string" && row.awb_number.length
            ? row.awb_number
            : null,
        sap_order_numbers: typeof row.sap_order_numbers === "string" && row.sap_order_numbers.length
            ? row.sap_order_numbers
            : null,
        last_synced_at: toIso(row.last_synced_at),
        metadata,
        created_at: toIso(row.created_at) ?? new Date().toISOString(),
        updated_at: toIso(row.updated_at) ?? new Date().toISOString(),
    };
}
const splitList = (value) => {
    if (!value) {
        return [];
    }
    if (Array.isArray(value)) {
        return value.map((entry) => String(entry).trim()).filter(Boolean);
    }
    if (typeof value === "string") {
        return value
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean);
    }
    return [];
};
async function ensureRedingtonOrderCcEmailTable() {
    if (orderCcEmailTableInitialized) {
        return;
    }
    await ensureRedingtonDomainTable();
    await ensureRedingtonDomainExtentionTable();
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
  `);
    orderCcEmailTableInitialized = true;
}
function mapOrderCcEmailRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
    return {
        id: Number(row.id),
        company_code: typeof row.company_code === "string" && row.company_code.length
            ? row.company_code
            : null,
        domain_id: row.domain_id === null || row.domain_id === undefined
            ? null
            : Number(row.domain_id),
        domain_extention_id: row.domain_extention_id === null || row.domain_extention_id === undefined
            ? null
            : Number(row.domain_extention_id),
        brand_ids: splitList(row.brand_ids),
        cc_emails: splitList(row.cc_emails),
        created_at: createdAt,
        updated_at: updatedAt,
    };
}
async function ensureRedingtonMpgsTransactionTable() {
    if (mpgsTransactionTableInitialized) {
        return;
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
  `);
    mpgsTransactionTableInitialized = true;
}
function mapMpgsTransactionRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
    const normalize = (value) => {
        if (typeof value === "string") {
            const trimmed = value.trim();
            return trimmed.length ? trimmed : null;
        }
        return null;
    };
    return {
        id: Number(row.id),
        order_ref_id: typeof row.order_ref_id === "string" ? row.order_ref_id : "",
        session_id: typeof row.session_id === "string" ? row.session_id : "",
        transaction_reference: typeof row.transaction_reference === "string"
            ? row.transaction_reference
            : "",
        order_increment_id: typeof row.order_increment_id === "string"
            ? row.order_increment_id
            : "",
        payment_status: normalize(row.payment_status),
        session_version: normalize(row.session_version),
        result_indicator: normalize(row.result_indicator),
        order_status: normalize(row.order_status),
        transaction_receipt: normalize(row.transaction_receipt),
        created_at: createdAt,
        updated_at: updatedAt,
    };
}
async function ensureRedingtonProductPriceTable() {
    if (productPriceTableInitialized) {
        return;
    }
    await ensureRedingtonDomainTable();
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
  `);
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
  `);
    productPriceTableInitialized = true;
}
function mapProductPriceRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
    const toNumber = (value, fallback) => {
        if (value === null || value === undefined) {
            return fallback;
        }
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            return fallback;
        }
        return parsed;
    };
    const toIso = (value) => {
        if (!value) {
            return null;
        }
        if (value instanceof Date) {
            return value.toISOString();
        }
        const str = String(value);
        return str.length ? str : null;
    };
    return {
        id: Number(row.id),
        sku: typeof row.sku === "string" ? row.sku : "",
        country_code: typeof row.country_code === "string" ? row.country_code : "",
        company_code: typeof row.company_code === "string" ? row.company_code : "",
        brand_id: typeof row.brand_id === "string" && row.brand_id.length
            ? row.brand_id
            : null,
        distribution_channel: typeof row.distribution_channel === "string"
            ? row.distribution_channel
            : "",
        domain_id: row.domain_id === null || row.domain_id === undefined
            ? null
            : Number(row.domain_id),
        product_base_price: toNumber(row.product_base_price, 0) ?? 0,
        product_special_price: toNumber(row.product_special_price, null),
        is_active: typeof row.is_active === "boolean"
            ? row.is_active
            : Boolean(row.is_active),
        promotion_channel: typeof row.promotion_channel === "string" && row.promotion_channel.length
            ? row.promotion_channel
            : null,
        from_date: toIso(row.from_date),
        to_date: toIso(row.to_date),
        created_at: createdAt,
        updated_at: updatedAt,
    };
}
async function ensureRedingtonProductDescImportTable() {
    if (productDescImportTableInitialized) {
        return;
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
  `);
    productDescImportTableInitialized = true;
}
function mapProductDescImportRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
    let parsedLog = null;
    if (row.log && typeof row.log === "object") {
        parsedLog = row.log;
    }
    else if (typeof row.log === "string" && row.log.length) {
        try {
            parsedLog = JSON.parse(row.log);
        }
        catch {
            parsedLog = row.log;
        }
    }
    return {
        id: Number(row.id),
        file_name: row.file_name ?? "",
        status: row.status ?? "pending",
        notes: typeof row.notes === "string" ? row.notes : null,
        initiated_by: typeof row.initiated_by === "string" ? row.initiated_by : null,
        total_rows: Number(row.total_rows ?? 0),
        success_rows: Number(row.success_rows ?? 0),
        failed_rows: Number(row.failed_rows ?? 0),
        log: parsedLog,
        created_at: createdAt,
        updated_at: updatedAt,
    };
}
async function insertProductDescImportLog(input) {
    await ensureRedingtonProductDescImportTable();
    const { rows } = await getPgPool().query(`
      INSERT INTO redington_product_desc_import (
        file_name,
        status,
        notes,
        initiated_by,
        total_rows
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
        input.file_name,
        input.status ?? "pending",
        input.notes ?? null,
        input.initiated_by ?? null,
        input.total_rows ?? 0,
    ]);
    return mapProductDescImportRow(rows[0]);
}
async function updateProductDescImportLog(id, updates) {
    await ensureRedingtonProductDescImportTable();
    const fields = [];
    const values = [];
    const push = (column, value) => {
        values.push(value);
        fields.push(`${column} = $${values.length}`);
    };
    if (updates.status !== undefined) {
        push("status", updates.status);
    }
    if (updates.notes !== undefined) {
        push("notes", updates.notes);
    }
    if (updates.initiated_by !== undefined) {
        push("initiated_by", updates.initiated_by);
    }
    if (updates.total_rows !== undefined) {
        push("total_rows", updates.total_rows);
    }
    if (updates.success_rows !== undefined) {
        push("success_rows", updates.success_rows);
    }
    if (updates.failed_rows !== undefined) {
        push("failed_rows", updates.failed_rows);
    }
    if (updates.log !== undefined) {
        push("log", JSON.stringify(updates.log));
    }
    if (!fields.length) {
        return findProductDescImportLog(id);
    }
    values.push(id);
    const { rows } = await getPgPool().query(`
      UPDATE redington_product_desc_import
      SET ${fields.join(", ")},
          updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `, values);
    return rows[0] ? mapProductDescImportRow(rows[0]) : null;
}
async function listProductDescImportLogs(options) {
    await ensureRedingtonProductDescImportTable();
    const limit = options?.limit && Number.isFinite(options.limit)
        ? Math.min(Math.max(Number(options.limit), 1), 100)
        : 20;
    const offset = options?.offset && Number.isFinite(options.offset) && options.offset > 0
        ? Math.trunc(options.offset)
        : 0;
    const { rows } = await getPgPool().query(`
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
    `, [limit, offset]);
    const { rows: countRows } = await getPgPool().query(`SELECT COUNT(*)::int AS count FROM redington_product_desc_import`);
    return {
        logs: rows.map(mapProductDescImportRow),
        count: countRows[0]?.count ?? 0,
    };
}
async function findProductDescImportLog(id) {
    await ensureRedingtonProductDescImportTable();
    const { rows } = await getPgPool().query(`SELECT * FROM redington_product_desc_import WHERE id = $1`, [id]);
    return rows[0] ? mapProductDescImportRow(rows[0]) : null;
}
async function ensureRedingtonGuestUserAuditTable() {
    if (guestUserAuditTableInitialized) {
        return;
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
  `);
    guestUserAuditTableInitialized = true;
}
function mapGuestUserAuditRow(row) {
    const metadata = typeof row.metadata === "object" && row.metadata !== null
        ? row.metadata
        : (() => {
            if (typeof row.metadata === "string" && row.metadata.length) {
                try {
                    return JSON.parse(row.metadata);
                }
                catch {
                    return {};
                }
            }
            return {};
        })();
    return {
        id: Number(row.id),
        email: typeof row.email === "string" ? row.email : "",
        success: typeof row.success === "boolean" ? row.success : Boolean(row.success),
        message: typeof row.message === "string" && row.message.length
            ? row.message
            : null,
        metadata: metadata,
        created_at: row.created_at instanceof Date
            ? row.created_at.toISOString()
            : String(row.created_at),
    };
}
async function recordGuestUserAudit(entry) {
    await ensureRedingtonGuestUserAuditTable();
    const metadata = entry.metadata ? JSON.stringify(entry.metadata) : "{}";
    const { rows } = await getPgPool().query(`
      INSERT INTO redington_guest_user_audit (email, success, message, metadata)
      VALUES ($1, $2, $3, $4::jsonb)
      RETURNING *
    `, [entry.email.trim().toLowerCase(), entry.success, entry.message ?? null, metadata]);
    return mapGuestUserAuditRow(rows[0]);
}
async function listGuestUserAudits(options) {
    await ensureRedingtonGuestUserAuditTable();
    const filters = [];
    const params = [];
    if (options.email && options.email.trim().length) {
        params.push(`%${options.email.trim().toLowerCase()}%`);
        filters.push(`LOWER(email) LIKE $${params.length}`);
    }
    if (typeof options.success === "boolean") {
        params.push(options.success);
        filters.push(`success = $${params.length}`);
    }
    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const limit = typeof options.limit === "number" && Number.isFinite(options.limit)
        ? Math.min(Math.max(1, Math.trunc(options.limit)), 100)
        : 25;
    const offset = typeof options.offset === "number" && Number.isFinite(options.offset)
        ? Math.max(0, Math.trunc(options.offset))
        : 0;
    const queryParams = [...params, limit, offset];
    const { rows } = await getPgPool().query(`
      SELECT *
      FROM redington_guest_user_audit
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `, queryParams);
    const countResult = await getPgPool().query(`
      SELECT COUNT(*) AS count
      FROM redington_guest_user_audit
      ${whereClause}
    `, params);
    const count = Number(countResult.rows[0]?.count ?? 0);
    return [rows.map(mapGuestUserAuditRow), count];
}
async function ensureRedingtonInvoiceAuditTable() {
    if (invoiceAuditTableInitialized) {
        return;
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
  `);
    invoiceAuditTableInitialized = true;
}
function mapInvoiceAuditRow(row) {
    const payload = typeof row.payload === "object" && row.payload !== null
        ? row.payload
        : (() => {
            if (typeof row.payload === "string" && row.payload.length) {
                try {
                    return JSON.parse(row.payload);
                }
                catch {
                    return {};
                }
            }
            return {};
        })();
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const normalizeString = (value) => {
        if (typeof value === "string") {
            const trimmed = value.trim();
            return trimmed.length ? trimmed : null;
        }
        return null;
    };
    return {
        id: Number(row.id),
        order_id: normalizeString(row.order_id),
        invoice_number: normalizeString(row.invoice_number),
        company_code: normalizeString(row.company_code),
        success: typeof row.success === "boolean" ? row.success : Boolean(row.success),
        message: normalizeString(row.message),
        payload: payload,
        created_at: createdAt,
    };
}
async function recordInvoiceAudit(entry) {
    await ensureRedingtonInvoiceAuditTable();
    const payload = entry.payload ? JSON.stringify(entry.payload) : "{}";
    const { rows } = await getPgPool().query(`
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
    `, [
        entry.order_id ?? null,
        entry.invoice_number ?? null,
        entry.company_code ?? null,
        entry.success,
        entry.message ?? null,
        payload,
    ]);
    return mapInvoiceAuditRow(rows[0]);
}
async function ensureRedingtonCustomerSyncTable() {
    if (customerSyncTableInitialized) {
        return;
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
  `);
    customerSyncTableInitialized = true;
}
function mapCustomerSyncRow(row) {
    const parseTimestamp = (value) => {
        if (!value) {
            return null;
        }
        if (value instanceof Date) {
            return value.toISOString();
        }
        const str = String(value);
        return str.length ? str : null;
    };
    return {
        id: Number(row.id),
        customer_email: typeof row.customer_email === "string" ? row.customer_email : "",
        customer_id: typeof row.customer_id === "string" && row.customer_id.length
            ? row.customer_id
            : null,
        sap_sync: typeof row.sap_sync === "boolean" ? row.sap_sync : Boolean(row.sap_sync),
        sap_customer_code: typeof row.sap_customer_code === "string" && row.sap_customer_code.length
            ? row.sap_customer_code
            : null,
        sap_synced_at: parseTimestamp(row.sap_synced_at),
        created_at: row.created_at instanceof Date
            ? row.created_at.toISOString()
            : String(row.created_at),
        updated_at: row.updated_at instanceof Date
            ? row.updated_at.toISOString()
            : String(row.updated_at),
    };
}
const lookupCustomerIdByEmail = async (email) => {
    const { rows } = await getPgPool().query(`
      SELECT id
      FROM "customer"
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `, [email]);
    return rows[0]?.id ? String(rows[0].id) : null;
};
async function upsertRedingtonCustomerSync(options) {
    await ensureRedingtonCustomerSyncTable();
    const email = options.email.trim().toLowerCase();
    let customerId = options.customerId ?? null;
    if (!customerId) {
        customerId = await lookupCustomerIdByEmail(email);
    }
    const sapSyncedAtValue = options.sapSyncedAt
        ? options.sapSyncedAt instanceof Date
            ? options.sapSyncedAt.toISOString()
            : options.sapSyncedAt
        : options.sapSync
            ? new Date().toISOString()
            : null;
    const { rows } = await getPgPool().query(`
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
    `, [email, customerId, options.sapSync, options.sapCustomerCode ?? null, sapSyncedAtValue]);
    const inserted = mapCustomerSyncRow(rows[0]);
    if (customerId) {
        try {
            await getPgPool().query(`
          UPDATE "customer"
          SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
              updated_at = NOW()
          WHERE id = $1
        `, [
                customerId,
                JSON.stringify({
                    sap_sync: inserted.sap_sync,
                    sap_customer_code: inserted.sap_customer_code,
                    sap_synced_at: inserted.sap_synced_at,
                }),
            ]);
        }
        catch (err) {
            console.warn("Failed to update customer metadata for SAP sync", err);
        }
    }
    return inserted;
}
async function listRedingtonCustomerSync(options) {
    await ensureRedingtonCustomerSyncTable();
    const filters = [];
    const params = [];
    if (options.email && options.email.trim().length) {
        params.push(`%${options.email.trim().toLowerCase()}%`);
        filters.push(`LOWER(customer_email) LIKE $${params.length}`);
    }
    if (typeof options.sapSync === "boolean") {
        params.push(options.sapSync);
        filters.push(`sap_sync = $${params.length}`);
    }
    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const limit = typeof options.limit === "number" && Number.isFinite(options.limit)
        ? Math.min(Math.max(1, Math.trunc(options.limit)), 100)
        : 25;
    const offset = typeof options.offset === "number" && Number.isFinite(options.offset)
        ? Math.max(0, Math.trunc(options.offset))
        : 0;
    const queryParams = [...params, limit, offset];
    const { rows } = await getPgPool().query(`
      SELECT *
      FROM redington_customer_sync
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `, queryParams);
    const countResult = await getPgPool().query(`
      SELECT COUNT(*) AS count
      FROM redington_customer_sync
      ${whereClause}
    `, params);
    const count = Number(countResult.rows[0]?.count ?? 0);
    return [rows.map(mapCustomerSyncRow), count];
}
async function ensureRedingtonGetInTouchTable() {
    if (getInTouchTableInitialized) {
        return;
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
  `);
    getInTouchTableInitialized = true;
}
function mapGetInTouchRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
    return {
        id: Number(row.id),
        name: typeof row.name === "string" ? row.name : "",
        email: typeof row.email === "string" ? row.email : "",
        mobile_number: typeof row.mobile_number === "string" ? row.mobile_number : "",
        company_name: typeof row.company_name === "string" && row.company_name.length
            ? row.company_name
            : null,
        enquiry_type: typeof row.enquiry_type === "string" && row.enquiry_type.length
            ? row.enquiry_type
            : null,
        enquiry_details: typeof row.enquiry_details === "string" && row.enquiry_details.length
            ? row.enquiry_details
            : null,
        created_at: createdAt,
        updated_at: updatedAt,
    };
}
async function ensureRedingtonCouponRuleTable() {
    if (couponRuleTableInitialized) {
        return;
    }
    await ensureRedingtonDomainTable();
    await ensureRedingtonDomainExtentionTable();
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
  `);
    couponRuleTableInitialized = true;
}
function mapCouponRuleRow(row) {
    const createdAt = row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    const updatedAt = row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at);
    const metadata = typeof row.metadata === "object" && row.metadata !== null
        ? row.metadata
        : (() => {
            if (typeof row.metadata === "string" && row.metadata.length) {
                try {
                    return JSON.parse(row.metadata);
                }
                catch {
                    return {};
                }
            }
            return {};
        })();
    const extId = row.domain_extention_id !== null && row.domain_extention_id !== undefined
        ? Number(row.domain_extention_id)
        : null;
    return {
        id: Number(row.id),
        coupon_code: typeof row.coupon_code === "string" ? row.coupon_code : "",
        company_code: typeof row.company_code === "string" ? row.company_code : "",
        domain_id: Number(row.domain_id),
        domain_extention_id: extId && Number.isFinite(extId) ? extId : null,
        is_active: typeof row.is_active === "boolean"
            ? row.is_active
            : Boolean(row.is_active),
        metadata: metadata,
        created_at: createdAt,
        updated_at: updatedAt,
    };
}
const normalizeRoleKey = (value) => value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
const parseTimestamp = (value) => value instanceof Date ? value.toISOString() : String(value);
const parsePermissions = (value) => {
    if (!value) {
        return [];
    }
    if (Array.isArray(value)) {
        return value
            .map((entry) => String(entry).trim())
            .filter(Boolean);
    }
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed
                    .map((entry) => String(entry).trim())
                    .filter(Boolean);
            }
        }
        catch (err) {
            return value
                .split(/[\s,]+/)
                .map((entry) => entry.trim())
                .filter(Boolean);
        }
    }
    if (typeof value === "object") {
        return Object.values(value)
            .map((entry) => String(entry).trim())
            .filter(Boolean);
    }
    return [];
};
const parseDomains = (value) => {
    if (!value) {
        return [];
    }
    if (Array.isArray(value)) {
        return value
            .map((entry) => {
            const parsed = typeof entry === "string"
                ? Number.parseInt(entry, 10)
                : Number(entry);
            return Number.isFinite(parsed) ? parsed : null;
        })
            .filter((entry) => entry !== null);
    }
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return parseDomains(parsed);
        }
        catch {
            return value
                .split(/[\s,]+/)
                .map((entry) => Number.parseInt(entry.trim(), 10))
                .filter((entry) => Number.isFinite(entry));
        }
    }
    if (typeof value === "object") {
        return Object.values(value)
            .map((entry) => {
            const parsed = typeof entry === "string"
                ? Number.parseInt(entry, 10)
                : Number(entry);
            return Number.isFinite(parsed) ? parsed : null;
        })
            .filter((entry) => entry !== null);
    }
    return [];
};
function mapAdminRoleRow(row) {
    return {
        id: Number(row.id),
        role_key: typeof row.role_key === "string" ? row.role_key : "",
        role_name: typeof row.role_name === "string" ? row.role_name : "",
        description: typeof row.description === "string" ? row.description : undefined,
        can_login: typeof row.can_login === "boolean"
            ? row.can_login
            : Boolean(row.can_login),
        permissions: parsePermissions(row.permissions),
        domains: parseDomains(row.domains),
        created_at: parseTimestamp(row.created_at),
        updated_at: parseTimestamp(row.updated_at),
    };
}
function mapAdminRoleAssignmentRow(row) {
    const assignment = {
        id: Number(row.id),
        user_id: typeof row.user_id === "string" ? row.user_id : "",
        role_id: Number(row.role_id),
        domain_id: Number.isFinite(Number(row.domain_id))
            ? Number(row.domain_id)
            : undefined,
        domain_name: typeof row.domain_name === "string" && row.domain_name.length
            ? row.domain_name
            : undefined,
        created_at: parseTimestamp(row.created_at),
        updated_at: parseTimestamp(row.updated_at),
    };
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
        });
    }
    return assignment;
}
async function ensureRedingtonAdminRoleTable() {
    if (adminRoleTableInitialized) {
        return;
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
  `);
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
  `);
    adminRoleTableInitialized = true;
}
async function ensureRedingtonAdminRoleAssignmentTable() {
    if (adminRoleAssignmentTableInitialized) {
        return;
    }
    await ensureRedingtonAdminRoleTable();
    await ensureRedingtonDomainTable();
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
  `);
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
  `);
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
  `);
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
  `);
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
  `);
    adminRoleAssignmentTableInitialized = true;
}
async function listAdminRoles() {
    await ensureRedingtonAdminRoleTable();
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
  `);
    return rows.map(mapAdminRoleRow);
}
async function createAdminRole(options) {
    await ensureRedingtonAdminRoleTable();
    const name = (options.role_name || "").trim();
    if (!name) {
        throw new Error("role_name is required");
    }
    const roleKey = normalizeRoleKey(name);
    if (!roleKey) {
        throw new Error("role_name must include at least one alphanumeric character");
    }
    const permissions = JSON.stringify(parsePermissions(options.permissions));
    const domains = JSON.stringify(parseDomains(options.domains));
    const canLogin = typeof options.can_login === "boolean" ? options.can_login : true;
    const { rows } = await getPgPool().query(`
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
    `, [roleKey, name, options.description ?? null, canLogin, permissions, domains]);
    return mapAdminRoleRow(rows[0]);
}
async function updateAdminRole(id, options) {
    await ensureRedingtonAdminRoleTable();
    const updates = [];
    const values = [];
    if (typeof options.role_name === "string") {
        const name = options.role_name.trim();
        if (name) {
            updates.push(`role_name = $${updates.length + 2}`);
            values.push(name);
            updates.push(`role_key = $${updates.length + 2}`);
            values.push(normalizeRoleKey(name));
        }
    }
    if (options.description !== undefined) {
        updates.push(`description = $${updates.length + 2}`);
        values.push(options.description ?? null);
    }
    if (options.permissions !== undefined) {
        updates.push(`permissions = $${updates.length + 2}::jsonb`);
        values.push(JSON.stringify(parsePermissions(options.permissions)));
    }
    if (typeof options.can_login === "boolean") {
        updates.push(`can_login = $${updates.length + 2}`);
        values.push(options.can_login);
    }
    if (options.domains !== undefined) {
        updates.push(`domains = $${updates.length + 2}::jsonb`);
        values.push(JSON.stringify(parseDomains(options.domains)));
    }
    if (!updates.length) {
        const { rows } = await getPgPool().query(`SELECT * FROM redington_admin_role WHERE id = $1`, [id]);
        return rows[0] ? mapAdminRoleRow(rows[0]) : null;
    }
    updates.push(`updated_at = NOW()`);
    const { rows } = await getPgPool().query(`
      UPDATE redington_admin_role
      SET ${updates.join(", ")}
      WHERE id = $1
      RETURNING *
    `, [id, ...values]);
    return rows[0] ? mapAdminRoleRow(rows[0]) : null;
}
async function deleteAdminRole(id) {
    await ensureRedingtonAdminRoleAssignmentTable();
    await getPgPool().query(`
      DELETE FROM redington_admin_role_assignment
      WHERE role_id = $1
    `, [id]);
    await getPgPool().query(`
      DELETE FROM redington_admin_role
      WHERE id = $1
    `, [id]);
}
async function assignRoleToUser(options) {
    await ensureRedingtonAdminRoleAssignmentTable();
    const userId = options.user_id.trim();
    if (!userId) {
        throw new Error("user_id is required to assign a role");
    }
    const maybeDomainId = options.domain_id !== undefined && options.domain_id !== null
        ? Number(options.domain_id)
        : null;
    const domainId = maybeDomainId !== null && Number.isFinite(maybeDomainId)
        ? maybeDomainId
        : null;
    const { rows } = await getPgPool().query(`
      INSERT INTO redington_admin_role_assignment (user_id, role_id, domain_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, role_id, domain_id) DO UPDATE
        SET updated_at = NOW()
      RETURNING *
    `, [userId, options.role_id, domainId]);
    const inserted = rows[0];
    const { rows: hydrated } = await getPgPool().query(`
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
    `, [inserted.id]);
    return mapAdminRoleAssignmentRow(hydrated[0] ?? inserted);
}
async function removeRoleAssignment(id) {
    await ensureRedingtonAdminRoleAssignmentTable();
    await getPgPool().query(`
      DELETE FROM redington_admin_role_assignment
      WHERE id = $1
    `, [id]);
}
async function listRoleAssignments(options = {}) {
    await ensureRedingtonAdminRoleAssignmentTable();
    const conditions = [];
    const params = [];
    const userIdFilter = options.user_id?.trim();
    if (userIdFilter) {
        conditions.push(`ra.user_id = $${conditions.length + 1}`);
        params.push(userIdFilter);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await getPgPool().query(`
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
    `, params);
    return rows.map(mapAdminRoleAssignmentRow);
}
async function getRolesForUser(userId) {
    const assignments = await listRoleAssignments({ user_id: userId });
    return assignments
        .map((assignment) => assignment.role)
        .filter((role) => Boolean(role));
}
async function countAdminRoles() {
    await ensureRedingtonAdminRoleTable();
    const { rows } = await getPgPool().query(`SELECT COUNT(*)::int AS count FROM redington_admin_role`);
    const count = rows[0]?.count;
    return typeof count === "number" ? count : Number(count ?? 0);
}
async function findAdminRoleByKey(roleKey) {
    await ensureRedingtonAdminRoleTable();
    const normalized = normalizeRoleKey(roleKey);
    if (!normalized) {
        return null;
    }
    const { rows } = await getPgPool().query(`
      SELECT *
      FROM redington_admin_role
      WHERE role_key = $1
      LIMIT 1
    `, [normalized]);
    return rows[0] ? mapAdminRoleRow(rows[0]) : null;
}
async function findAdminRoleById(id) {
    await ensureRedingtonAdminRoleTable();
    const { rows } = await getPgPool().query(`
      SELECT *
      FROM redington_admin_role
      WHERE id = $1
      LIMIT 1
    `, [id]);
    return rows[0] ? mapAdminRoleRow(rows[0]) : null;
}
async function ensureSuperAdminRole() {
    const existing = await findAdminRoleByKey("super_admin");
    if (existing) {
        return existing;
    }
    return await createAdminRole({
        role_name: "Super Admin",
        description: "Full access to all admin features",
        can_login: true,
        permissions: ["*"],
    });
}
async function findRoleAssignmentById(id) {
    await ensureRedingtonAdminRoleAssignmentTable();
    const { rows } = await getPgPool().query(`
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
    `, [id]);
    return rows[0] ? mapAdminRoleAssignmentRow(rows[0]) : null;
}
async function ensureRedingtonSettingsTable() {
    if (settingsTableInitialized) {
        return;
    }
    await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS redington_settings (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
    settingsTableInitialized = true;
}
async function setRedingtonSetting(key, value) {
    await ensureRedingtonSettingsTable();
    await getPgPool().query(`
      INSERT INTO redington_settings (key, value)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `, [key, JSON.stringify(value ?? {})]);
}
async function getRedingtonSetting(key) {
    await ensureRedingtonSettingsTable();
    const { rows } = await getPgPool().query(`
      SELECT value
      FROM redington_settings
      WHERE key = $1
      LIMIT 1
    `, [key]);
    if (!rows[0]) {
        return null;
    }
    const value = rows[0].value;
    if (typeof value === "object" && value !== null) {
        return value;
    }
    if (typeof value === "string" && value.length) {
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }
    return null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL3BnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQTJDQSw4QkFrQkM7QUFFRCxnRUFnQkM7QUFFRCx3RUFxQkM7QUFFRCxrRkFnQkM7QUFFRCxvRkFlQztBQUVELGtGQW9CQztBQUVELG9DQWlCQztBQUVELHdDQWFDO0FBVUQsc0RBZUM7QUFFRCw0Q0FpQ0M7QUFFRCxzREFpQkM7QUFFRCx3RUFlQztBQWtCRCw4RUF3QkM7QUFFRCxrREFzREM7QUFRRCxnREEwQ0M7QUFlRCxrREE4Q0M7QUFFRCxzREFjQztBQUVELGtEQXFDQztBQUVELGtEQVVDO0FBZ0dELDhFQTJLQztBQXlFRCwwREFPQztBQUVELDhDQU9DO0FBRUQsb0RBZ0JDO0FBUUQsZ0RBNkJDO0FBUUQsZ0RBc0NDO0FBRUQsZ0RBU0M7QUFFRCxrREFtQkM7QUFFRCx3Q0FlQztBQVVELG9DQXVDQztBQVVELG9DQXVDQztBQUVELG9DQVNDO0FBVUQsMEVBcURDO0FBRUQsMERBYUM7QUFFRCwwRUFpQkM7QUFFRCw4Q0FrQkM7QUFFRCxzREFjQztBQWtDRCw4RUFxQ0M7QUFFRCxrREErQkM7QUFFRCxrRUEwQkM7QUFlRCxvRkFvQ0M7QUFFRCx3REEwQkM7QUFLRCxnRUFtQkM7QUFFRCw0REFjQztBQUVELGdFQTJCQztBQVVELGdFQW1CQztBQTRDRCxvRkFxQkM7QUFFRCx3REFtQ0M7QUFFRCxzREFZQztBQUVELHdEQXVEQztBQUVELHdEQVNDO0FBRUQsd0VBeUJDO0FBRUQsb0NBOEJDO0FBRUQsa0ZBdUJDO0FBRUQsc0RBK0JDO0FBVUQsNEVBZ0JDO0FBRUQsZ0RBcUJDO0FBZ0JELGtFQXdCQztBQUVELHdFQWlCQztBQVNELG9EQWtDQztBQUVELDBEQW9CQztBQUVELHdEQXdCQztBQXNDRCwwREFtQkM7QUFFRCwwREFjQztBQUVELG9FQVdDO0FBRUQsMERBV0M7QUFhRCw4QkE2QkM7QUFFRCxzQ0Ft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QkFBOEIsRUFBRSxDQUFBO0lBRXRDLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxNQUFNLFNBQVMsRUFBRSxDQUFDLEtBQUssQ0FDdEM7Ozs7O0tBS0MsRUFDRCxDQUFDLEtBQUssQ0FBQyxDQUNSLENBQUE7SUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDYixPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFRCxNQUFNLFNBQVMsR0FDYixJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxZQUFZLElBQUk7UUFDaEMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVO1FBQ3BCLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUE7SUFFbEMsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztRQUMxRSxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFRCxPQUFPO1FBQ0wsRUFBRSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ3RCLEtBQUssRUFBRSxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO1FBQzdELEtBQUssRUFBRSxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO1FBQzdELFVBQVUsRUFBRSxTQUFTLENBQUMsV0FBVyxFQUFFO0tBQ3BDLENBQUE7QUFDSCxDQUFDO0FBRU0s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