"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const promise_1 = require("mysql2/promise");
const pg_1 = require("../lib/pg");
const MYSQL_CONFIG = {
    host: process.env.MAGENTO_DB_HOST || "localhost",
    port: Number(process.env.MAGENTO_DB_PORT || "3306"),
    user: process.env.MAGENTO_DB_USER || "root",
    password: process.env.MAGENTO_DB_PASSWORD || "root",
    database: process.env.MAGENTO_DB_NAME || "radington",
    decimalNumbers: true,
};
const migrateCompanyCodes = async (mysql, pg) => {
    await (0, pg_1.ensureRedingtonCompanyCodeTable)();
    const [rows] = await mysql.query("SELECT id, country_code, company_code, status FROM epp_company_code");
    for (const row of rows) {
        const countryCode = row.country_code?.trim();
        const companyCode = row.company_code?.trim();
        if (!countryCode || !companyCode) {
            console.warn(`Skipping company code row ${row.id} due to missing country or company code`);
            continue;
        }
        await pg.query(`
        DELETE FROM redington_company_code
        WHERE country_code = $1
          AND id <> $2
      `, [countryCode, row.id]);
        await pg.query(`
        INSERT INTO redington_company_code (id, country_code, company_code, status)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE
          SET country_code = EXCLUDED.country_code,
              company_code = EXCLUDED.company_code,
              status = EXCLUDED.status,
              updated_at = NOW()
      `, [
            row.id,
            countryCode,
            companyCode,
            normalizeBoolean(row.status),
        ]);
    }
    await resetSequence(pg, "redington_company_code");
};
const truthyValues = new Set(["1", "true", "enabled", "yes", "on", "active"]);
const normalizeBoolean = (value) => {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "number") {
        return value > 0;
    }
    if (typeof value === "string") {
        return truthyValues.has(value.trim().toLowerCase());
    }
    return false;
};
const parseNumeric = (value) => {
    if (value === null || value === undefined) {
        return null;
    }
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }
    const normalized = value.replace(/,/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
};
const toDateString = (value) => {
    if (!value) {
        return null;
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    try {
        return date.toISOString();
    }
    catch {
        return null;
    }
};
const migrateCurrencyMappings = async (mysql, pg) => {
    await (0, pg_1.ensureRedingtonCurrencyMappingTable)();
    const [rows] = await mysql.query(`
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
    `);
    for (const row of rows) {
        const name = row.name?.trim();
        const companyCode = row.company_code?.trim();
        const countryName = row.country_name?.trim();
        const countryCode = row.country_code?.trim().toUpperCase();
        const currencyCode = row.currency_code?.trim().toUpperCase();
        const paymentMethod = row.payment_method?.trim();
        const shipmentTrackingUrl = row.shipment_tracking_url?.trim();
        const decimalPlaceRaw = typeof row.decimal_place === "string"
            ? Number(row.decimal_place.replace(/,/g, ""))
            : Number(row.decimal_place);
        const decimalPlace = Number.isFinite(decimalPlaceRaw)
            ? Math.max(0, Math.trunc(decimalPlaceRaw))
            : 2;
        if (!name ||
            !companyCode ||
            !countryName ||
            !countryCode ||
            !currencyCode ||
            !paymentMethod ||
            !shipmentTrackingUrl) {
            console.warn(`Skipping currency mapping ${row.id} due to missing required fields`);
            continue;
        }
        await pg.query(`
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
      `, [
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
        ]);
    }
    await resetSequence(pg, "redington_currency_mapping");
};
const migrateOtps = async (mysql, pg) => {
    await (0, pg_1.ensureRedingtonOtpTable)();
    const [rows] = await mysql.query(`
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
    `);
    for (const row of rows) {
        const email = row.email_id?.trim().toLowerCase();
        const action = row.action?.trim() || "default";
        const rawOtp = typeof row.otp === "number"
            ? Math.abs(row.otp)
            : typeof row.otp === "string"
                ? row.otp.replace(/\s+/g, "")
                : "";
        const code = String(rawOtp ?? "").trim();
        if (!email || !code) {
            console.warn(`Skipping OTP row ${row.id} due to missing email or code (email="${row.email_id}", otp="${row.otp}")`);
            continue;
        }
        const createdAt = toDateString(row.created_at) ?? new Date().toISOString();
        const updatedAt = toDateString(row.updated_at) ?? createdAt;
        const expiresAt = toDateString(row.expiry) ?? updatedAt;
        const isVerified = normalizeBoolean(row.email_verified);
        const consumedAt = isVerified ? updatedAt : null;
        await pg.query(`
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
      `, [
            row.id,
            email,
            action,
            code,
            expiresAt,
            consumedAt,
            createdAt,
            updatedAt,
        ]);
    }
    await resetSequence(pg, "redington_otp");
};
const migrateOrderShipments = async (mysql, pg) => {
    await (0, pg_1.ensureRedingtonOrderShipmentTable)();
    const [rows] = await mysql.query(`
      SELECT
        entity_id,
        increment_id,
        status,
        awb_number,
        sap_order_number,
        updated_at,
        created_at
      FROM sales_order
    `);
    for (const row of rows) {
        const incrementId = row.increment_id?.trim();
        if (!incrementId) {
            console.warn(`Skipping order shipment row ${row.entity_id} due to missing increment_id`);
            continue;
        }
        const status = row.status?.trim() || "unknown";
        const awbNumber = row.awb_number?.trim() || null;
        const sapNumbers = row.sap_order_number?.trim() || null;
        const createdAt = toDateString(row.created_at) ?? new Date().toISOString();
        const updatedAt = toDateString(row.updated_at) ?? createdAt;
        const metadata = {
            magento_entity_id: row.entity_id,
        };
        await pg.query(`
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
      `, [
            incrementId,
            status,
            awbNumber,
            sapNumbers,
            JSON.stringify(metadata),
            createdAt,
            updatedAt,
        ]);
    }
    await resetSequence(pg, "redington_order_shipment");
};
const migrateOrderCcEmails = async (mysql, pg) => {
    await (0, pg_1.ensureRedingtonOrderCcEmailTable)();
    const [rows] = await mysql.query(`SELECT
        ordercreationreturn_id,
        company_code,
        domain_id,
        brand_ids,
        ccemail,
        created_at,
        updated_at,
        domain_extention_id
      FROM order_cc_email`);
    for (const row of rows) {
        const id = row.ordercreationreturn_id;
        const companyCode = row.company_code?.trim() || null;
        const domainIdRaw = typeof row.domain_id === "string" ? Number(row.domain_id) : row.domain_id;
        const domainId = domainIdRaw !== null && domainIdRaw !== undefined && Number.isFinite(Number(domainIdRaw))
            ? Number(domainIdRaw)
            : null;
        const domainExtRaw = typeof row.domain_extention_id === "string"
            ? Number(row.domain_extention_id)
            : row.domain_extention_id;
        const domainExtentionId = domainExtRaw !== null && domainExtRaw !== undefined && Number.isFinite(Number(domainExtRaw))
            ? Number(domainExtRaw)
            : null;
        const brandIds = typeof row.brand_ids === "string" ? row.brand_ids.trim() : null;
        const ccEmails = typeof row.ccemail === "string" ? row.ccemail.trim() : null;
        const createdAt = toDateString(row.created_at) ?? new Date().toISOString();
        const updatedAt = toDateString(row.updated_at) ?? createdAt;
        await pg.query(`
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
      `, [
            id,
            companyCode,
            domainId,
            domainExtentionId,
            brandIds,
            ccEmails,
            createdAt,
            updatedAt,
        ]);
    }
    await resetSequence(pg, "redington_order_cc_email");
};
const resetSequence = async (pool, table) => {
    await pool.query(`
      SELECT setval(
        pg_get_serial_sequence($1, 'id'),
        COALESCE((SELECT MAX(id) FROM ${table}), 0),
        true
      );
    `, [table]);
};
const normalizeDomainId = (value) => {
    if (value === null || value === undefined) {
        return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};
const parseRetryTimeToSeconds = (value) => {
    if (!value) {
        return 7200;
    }
    const trimmed = value.trim();
    if (!trimmed.length) {
        return 7200;
    }
    const parts = trimmed.split(":").map((part) => Number(part));
    if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
        const [h, m, s] = parts;
        return Math.max(0, h * 3600 + m * 60 + s);
    }
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
        return Math.max(0, Math.floor(numeric));
    }
    return 7200;
};
const migrateHomeVideos = async (mysql, pg) => {
    await (0, pg_1.ensureRedingtonHomeVideoTable)();
    const [rows] = await mysql.query("SELECT homevideo_id, url, status, createdAt, updateAt, title FROM homevideo");
    for (const row of rows) {
        await pg.query(`
        INSERT INTO redington_home_video (id, title, url, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE
          SET title = EXCLUDED.title,
              url = EXCLUDED.url,
              status = EXCLUDED.status,
              updated_at = EXCLUDED.updated_at
      `, [
            row.homevideo_id,
            row.title ?? "",
            row.url ?? "",
            normalizeBoolean(row.status),
            toDateString(row.createdAt) ?? new Date().toISOString(),
            toDateString(row.updateAt) ?? toDateString(row.createdAt) ?? new Date().toISOString(),
        ]);
    }
    await resetSequence(pg, "redington_home_video");
};
const migrateOrderReturns = async (mysql, pg) => {
    await (0, pg_1.ensureRedingtonOrderReturnTable)();
    const [rows] = await mysql.query("SELECT id, order_id, user_name, user_email, sku, product_name, qty, price, order_status, return_status, remarks, created_at FROM order_returns");
    for (const row of rows) {
        await pg.query(`
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
      `, [
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
        ]);
    }
    await resetSequence(pg, "redington_order_return");
};
const migrateProductEnquiries = async (mysql, pg) => {
    await (0, pg_1.ensureRedingtonProductEnquiryTable)();
    const [rows] = await mysql.query(`SELECT
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
    FROM redington_outofstockproductenquiry_productenquiry`);
    for (const row of rows) {
        await pg.query(`
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
      `, [
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
        ]);
    }
    await resetSequence(pg, "redington_product_enquiry");
};
const migrateMaxQtyRules = async (mysql, pg) => {
    await (0, pg_1.ensureRedingtonMaxQtyRuleTable)();
    const [rows] = await mysql.query("SELECT id, brand_id, max_qty, created_at, updated_at, category_id, company_code, domain_id FROM epp_max_order_qty");
    const globalDomainIds = [];
    for (const row of rows) {
        const domainId = normalizeDomainId(row.domain_id);
        if (domainId === null &&
            typeof row.domain_id === "number" &&
            row.domain_id === 0) {
            globalDomainIds.push(row.id);
        }
        await pg.query(`
        DELETE FROM redington_max_qty_rule
        WHERE id = $1
           OR (
             category_id = $2 AND brand_id = $3 AND company_code = $4 AND
             ((domain_id IS NULL AND $5::INTEGER IS NULL) OR domain_id = $5::INTEGER)
           )
      `, [row.id, row.category_id, row.brand_id, row.company_code, domainId]);
        await pg.query(`
        INSERT INTO redington_max_qty_rule
          (id, category_id, brand_id, company_code, domain_id, max_qty, created_at, updated_at)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8)
      `, [
            row.id,
            row.category_id,
            row.brand_id,
            row.company_code,
            domainId,
            row.max_qty,
            toDateString(row.created_at) ?? new Date().toISOString(),
            toDateString(row.updated_at) ?? new Date().toISOString(),
        ]);
    }
    await resetSequence(pg, "redington_max_qty_rule");
    if (globalDomainIds.length) {
        const sample = globalDomainIds.slice(0, 10).join(", ");
        console.warn(`Mapped ${globalDomainIds.length} max qty rule(s) with domain_id=0 to NULL (global scope).${sample ? ` Sample ids: ${sample}` : ""}`);
    }
};
const migrateMaxQtyCategories = async (mysql, pg) => {
    await (0, pg_1.ensureRedingtonMaxQtyCategoryTable)();
    const [rows] = await mysql.query("SELECT id, category_id, brand_id, company_code, domain_id, max_qty, created_at, updated_at FROM epp_max_order_qty_category");
    const globalDomainIds = [];
    for (const row of rows) {
        const domainId = normalizeDomainId(row.domain_id);
        if (domainId === null &&
            typeof row.domain_id === "number" &&
            row.domain_id === 0) {
            globalDomainIds.push(row.id);
        }
        await pg.query(`
        DELETE FROM redington_max_qty_category
        WHERE id = $1
           OR (
             category_ids = $2 AND brand_id = $3 AND company_code = $4 AND
             ((domain_id IS NULL AND $5::INTEGER IS NULL) OR domain_id = $5::INTEGER)
           )
      `, [row.id, row.category_id, row.brand_id, row.company_code, domainId]);
        await pg.query(`
        INSERT INTO redington_max_qty_category
          (id, category_ids, brand_id, company_code, domain_id, max_qty, created_at, updated_at)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8)
      `, [
            row.id,
            row.category_id,
            row.brand_id,
            row.company_code,
            domainId,
            row.max_qty,
            toDateString(row.created_at) ?? new Date().toISOString(),
            toDateString(row.updated_at) ?? new Date().toISOString(),
        ]);
    }
    await resetSequence(pg, "redington_max_qty_category");
    if (globalDomainIds.length) {
        const sample = globalDomainIds.slice(0, 10).join(", ");
        console.warn(`Mapped ${globalDomainIds.length} max qty category record(s) with domain_id=0 to NULL (global scope).${sample ? ` Sample ids: ${sample}` : ""}`);
    }
};
const migrateOrderQuantityTracker = async (mysql, pg) => {
    await (0, pg_1.ensureRedingtonOrderQuantityTrackerTable)();
    const [rows] = await mysql.query("SELECT id, customer_id, order_increment_id, sku, quantity, brand_id, created_at, updated_at FROM epp_order_tracker");
    for (const row of rows) {
        await pg.query(`
        INSERT INTO redington_order_quantity_tracker
          (id, customer_id, order_increment_id, sku, quantity, brand_id, created_at, updated_at)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (id) DO UPDATE
          SET quantity = EXCLUDED.quantity,
              updated_at = EXCLUDED.updated_at
      `, [
            row.id,
            row.customer_id,
            row.order_increment_id,
            row.sku,
            row.quantity,
            row.brand_id,
            toDateString(row.created_at) ?? new Date().toISOString(),
            toDateString(row.updated_at) ?? new Date().toISOString(),
        ]);
    }
    await resetSequence(pg, "redington_order_quantity_tracker");
};
const migrateMpgsTransactions = async (mysql, pg) => {
    await (0, pg_1.ensureRedingtonMpgsTransactionTable)();
    const [rows] = await mysql.query("SELECT id, order_ref_id, session_id, transaction_reference, order_increment_id, payment_status, session_version, result_indicator, order_status, transaction_receipt, created_at FROM redington_mpgs_transaction_data");
    for (const row of rows) {
        await pg.query(`
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
      `, [
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
        ]);
    }
    await resetSequence(pg, "redington_mpgs_transaction");
};
const migrateProductPrices = async (mysql, pg) => {
    await (0, pg_1.ensureRedingtonProductPriceTable)();
    const [rows] = await mysql.query(`SELECT
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
    FROM epp_product_price`);
    const globalDomainIds = [];
    for (const row of rows) {
        const domainId = normalizeDomainId(row.domain_id);
        if (domainId === null &&
            typeof row.domain_id === "number" &&
            row.domain_id === 0) {
            globalDomainIds.push(row.id);
        }
        await pg.query(`
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
      `, [
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
        ]);
    }
    await resetSequence(pg, "redington_product_price");
    if (globalDomainIds.length) {
        const sample = globalDomainIds.slice(0, 10).join(", ");
        console.warn(`Mapped ${globalDomainIds.length} product price record(s) with domain_id=0 to NULL (global scope).${sample ? ` Sample ids: ${sample}` : ""}`);
    }
};
const migrateRetainCartConfigs = async (mysql, pg) => {
    await (0, pg_1.ensureRedingtonRetainCartConfigTable)();
    const [rows] = await mysql.query("SELECT retaincartpaymentime_id, retrytime, domain_id, enable_disable, addbcc FROM retaincartpaymentime");
    for (const row of rows) {
        const domainId = row.domain_id ? normalizeDomainId(Number(row.domain_id)) : null;
        const retrySeconds = parseRetryTimeToSeconds(row.retrytime);
        const isActive = row.enable_disable === null ? true : Boolean(row.enable_disable);
        const addBcc = row.addbcc ? row.addbcc : null;
        await pg.query(`
        INSERT INTO redington_retain_cart_config (id, domain_id, retry_time_seconds, add_bcc, is_active)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE
          SET domain_id = EXCLUDED.domain_id,
              retry_time_seconds = EXCLUDED.retry_time_seconds,
              add_bcc = EXCLUDED.add_bcc,
              is_active = EXCLUDED.is_active,
              updated_at = NOW()
      `, [
            row.retaincartpaymentime_id,
            domainId,
            retrySeconds,
            addBcc,
            isActive,
        ]);
    }
    await resetSequence(pg, "redington_retain_cart_config");
};
const main = async () => {
    const mysqlPool = (0, promise_1.createPool)(MYSQL_CONFIG);
    const pgPool = (0, pg_1.getPgPool)();
    try {
        await migrateHomeVideos(mysqlPool, pgPool);
        await migrateOrderReturns(mysqlPool, pgPool);
        await migrateProductEnquiries(mysqlPool, pgPool);
        await migrateCompanyCodes(mysqlPool, pgPool);
        await migrateCurrencyMappings(mysqlPool, pgPool);
        await migrateOtps(mysqlPool, pgPool);
        await migrateOrderShipments(mysqlPool, pgPool);
        await migrateOrderCcEmails(mysqlPool, pgPool);
        await migrateMaxQtyRules(mysqlPool, pgPool);
        await migrateMaxQtyCategories(mysqlPool, pgPool);
        await migrateOrderQuantityTracker(mysqlPool, pgPool);
        await migrateMpgsTransactions(mysqlPool, pgPool);
        await migrateRetainCartConfigs(mysqlPool, pgPool);
        await migrateProductPrices(mysqlPool, pgPool);
        console.log("Redington tables migrated successfully.");
    }
    catch (error) {
        console.error("Migration failed:", error);
        process.exitCode = 1;
    }
    finally {
        await mysqlPool.end();
        await pgPool.end();
    }
};
if (require.main === module) {
    main();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0ZS1yZWRpbmd0b24tdGFibGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3NjcmlwdHMvbWlncmF0ZS1yZWRpbmd0b24tdGFibGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEseUJBQXNCO0FBRXRCLDRDQUE4RDtBQUk5RCxrQ0FnQmtCO0FBNktsQixNQUFNLFlBQVksR0FBRztJQUNuQixJQUFJLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLElBQUksV0FBVztJQUNoRCxJQUFJLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxJQUFJLE1BQU0sQ0FBQztJQUNuRCxJQUFJLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLElBQUksTUFBTTtJQUMzQyxRQUFRLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsSUFBSSxNQUFNO0lBQ25ELFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsSUFBSSxXQUFXO0lBQ3BELGNBQWMsRUFBRSxJQUFJO0NBQ3JCLENBQUE7QUFFRCxNQUFNLG1CQUFtQixHQUFHLEtBQUssRUFDL0IsS0FBZ0IsRUFDaEIsRUFBVSxFQUNWLEVBQUU7SUFDRixNQUFNLElBQUEsb0NBQStCLEdBQUUsQ0FBQTtJQUN2QyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxLQUFLLENBQUMsS0FBSyxDQUM5QixxRUFBcUUsQ0FDdEUsQ0FBQTtJQUVELEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7UUFDdkIsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsQ0FBQTtRQUM1QyxNQUFNLFdBQVcsR0FBRyxHQUFHLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxDQUFBO1FBRTVDLElBQUksQ0FBQyxXQUFXLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNqQyxPQUFPLENB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