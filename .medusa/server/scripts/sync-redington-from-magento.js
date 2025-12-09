"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const promise_1 = __importDefault(require("mysql2/promise"));
const pg_1 = require("../src/lib/pg");
const MAGENTO_ENV_PATH = path_1.default.resolve(__dirname, "../../../B2C/app/etc/env.php");
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
];
async function main() {
    const magentoDb = await readMagentoDbConfig();
    const mysqlConnection = await promise_1.default.createConnection({
        host: magentoDb.host || "localhost",
        user: magentoDb.username,
        password: magentoDb.password,
        database: magentoDb.dbname,
        multipleStatements: false,
    });
    const pgPool = (0, pg_1.getPgPool)();
    await (0, pg_1.ensureRedingtonDomainTable)();
    await (0, pg_1.ensureRedingtonDomainExtentionTable)();
    await (0, pg_1.ensureRedingtonAddBccTable)();
    await (0, pg_1.ensureRedingtonCookiePolicyTable)();
    await (0, pg_1.ensureRedingtonDomainOutOfStockTable)();
    await (0, pg_1.ensureRedingtonCustomerNumberTable)();
    await (0, pg_1.ensureRedingtonCmsPageTable)();
    await (0, pg_1.ensureRedingtonCouponRuleTable)();
    await (0, pg_1.ensureRedingtonSettingsTable)();
    await (0, pg_1.ensureRedingtonGetInTouchTable)();
    await (0, pg_1.ensureRedingtonAccessMappingTable)();
    await resetTargetTables(pgPool);
    await seedDomains(mysqlConnection, pgPool);
    await seedDomainExtentions(mysqlConnection, pgPool);
    await seedAccessMappings(mysqlConnection, pgPool);
    await seedAddBcc(mysqlConnection, pgPool);
    await seedCookiePolicies(mysqlConnection, pgPool);
    await seedDomainOutOfStock(mysqlConnection, pgPool);
    await seedCustomerNumbers(mysqlConnection, pgPool);
    await seedCmsPages(mysqlConnection, pgPool);
    await seedCouponRules(mysqlConnection, pgPool);
    await seedSettings(mysqlConnection, pgPool);
    await syncSequences(pgPool);
    await mysqlConnection.end();
    await pgPool.end();
    console.log("✅ Redington data synced from Magento.");
}
async function seedDomains(mysqlConnection, pgPool) {
    const [rows] = await mysqlConnection.query(`SELECT domain_id, domain_name, status, created_at, updated_at
     FROM epp_domain
     ORDER BY updated_at DESC, domain_id DESC`);
    const seenNames = new Set();
    for (const row of rows) {
        const id = Number(row.domain_id);
        if (!Number.isFinite(id)) {
            continue;
        }
        const domainName = typeof row.domain_name === "string" ? row.domain_name.trim() : "";
        if (!domainName.length) {
            continue;
        }
        if (seenNames.has(domainName.toLowerCase())) {
            continue;
        }
        seenNames.add(domainName.toLowerCase());
        const createdAt = coerceDate(row.created_at);
        const updatedAt = coerceDate(row.updated_at);
        await pgPool.query(`
        INSERT INTO redington_domain (id, domain_name, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE
          SET domain_name = EXCLUDED.domain_name,
              is_active = EXCLUDED.is_active,
              updated_at = EXCLUDED.updated_at
      `, [id, domainName, parseBool(row.status), createdAt, updatedAt]);
    }
    console.log(`→ Imported ${seenNames.size} domains`);
}
async function seedDomainExtentions(mysqlConnection, pgPool) {
    const [rows] = await mysqlConnection.query(`SELECT domain_extention_id, domain_extention_name, status
     FROM domain_extention`);
    for (const row of rows) {
        const id = Number(row.domain_extention_id);
        if (!Number.isFinite(id)) {
            continue;
        }
        await pgPool.query(`
        INSERT INTO redington_domain_extention (id, domain_extention_name, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE
          SET domain_extention_name = EXCLUDED.domain_extention_name,
              status = EXCLUDED.status,
              updated_at = EXCLUDED.updated_at
      `, [
            id,
            row.domain_extention_name,
            parseBool(row.status),
            new Date(),
            new Date(),
        ]);
    }
    console.log(`→ Imported ${rows.length} domain extensions`);
}
async function seedAccessMappings(mysqlConnection, pgPool) {
    const [rows] = await mysqlConnection.query(`SELECT
        access_id,
        country_code,
        mobile_ext,
        company_code,
        brand_ids,
        domain_id,
        domain_extention_id,
        created_at,
        updated_at
     FROM access_mapping`);
    for (const row of rows) {
        const id = Number(row.access_id);
        const domainId = Number(row.domain_id);
        const domainExtId = row.domain_extention_id
            ? Number(row.domain_extention_id)
            : null;
        if (!Number.isFinite(id) || !Number.isFinite(domainId)) {
            continue;
        }
        const brands = typeof row.brand_ids === "string"
            ? row.brand_ids
                .split(",")
                .map((entry) => entry.trim())
                .filter(Boolean)
            : [];
        await pgPool.query(`
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
      `, [
            id,
            row.country_code,
            row.mobile_ext,
            row.company_code,
            JSON.stringify(brands),
            domainId,
            domainExtId,
            coerceDate(row.created_at),
            coerceDate(row.updated_at),
        ]);
    }
    console.log(`→ Imported ${rows.length} access mappings`);
}
async function seedAddBcc(mysqlConnection, pgPool) {
    const [rows] = await mysqlConnection.query(`SELECT addbcc_id, domain_id, addbcc
     FROM redington_addbccvalue_addbcc`);
    let imported = 0;
    for (const row of rows) {
        const id = Number(row.addbcc_id);
        const domainId = Number(row.domain_id);
        if (!Number.isFinite(id) || !Number.isFinite(domainId)) {
            continue;
        }
        const bccRaw = typeof row.addbcc === "string" ? row.addbcc : "";
        const emails = bccRaw
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean)
            .join(",");
        await pgPool.query(`
        INSERT INTO redington_add_bcc (id, domain_id, bcc_emails, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE
          SET domain_id = EXCLUDED.domain_id,
              bcc_emails = EXCLUDED.bcc_emails,
              updated_at = NOW()
      `, [id, domainId, emails]);
        imported += 1;
    }
    console.log(`→ Imported ${imported} Add BCC rows`);
}
async function seedCookiePolicies(mysqlConnection, pgPool) {
    const [rows] = await mysqlConnection.query(`SELECT cookiepolicy_id, uploadpdf, status
     FROM cookiepolicy`);
    for (const row of rows) {
        const id = Number(row.cookiepolicy_id);
        if (!Number.isFinite(id)) {
            continue;
        }
        await pgPool.query(`
        INSERT INTO redington_cookie_policy (id, document_url, status, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE
          SET document_url = EXCLUDED.document_url,
              status = EXCLUDED.status,
              updated_at = NOW()
      `, [id, row.uploadpdf ?? null, row.status ?? null]);
    }
    console.log(`→ Imported ${rows.length} cookie policies`);
}
async function seedDomainOutOfStock(mysqlConnection, pgPool) {
    const [rows] = await mysqlConnection.query(`SELECT domainbasedoutofstock_id, domain_id, enable_disable
     FROM redington_domainbasedoutofstockcontrol`);
    for (const row of rows) {
        const id = Number(row.domainbasedoutofstock_id);
        const domainId = Number(row.domain_id);
        if (!Number.isFinite(id) || !Number.isFinite(domainId)) {
            continue;
        }
        await pgPool.query(`
        INSERT INTO redington_domain_out_of_stock (id, domain_id, status, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE
          SET domain_id = EXCLUDED.domain_id,
              status = EXCLUDED.status,
              updated_at = NOW()
      `, [id, domainId, parseBool(row.enable_disable)]);
    }
    console.log(`→ Imported ${rows.length} domain out-of-stock entries`);
}
async function seedCustomerNumbers(mysqlConnection, pgPool) {
    const [rows] = await mysqlConnection.query(`SELECT id, company_code, distribution_channel, brand_id, domain_id, customer_number, created_at, updated_at
     FROM epp_customer_number`);
    for (const row of rows) {
        const id = Number(row.id);
        const domainId = Number(row.domain_id);
        if (!Number.isFinite(id) || !Number.isFinite(domainId)) {
            continue;
        }
        await pgPool.query(`
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
      `, [
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
        ]);
    }
    console.log(`→ Imported ${rows.length} customer numbers`);
}
async function seedCmsPages(mysqlConnection, pgPool) {
    const [rows] = await mysqlConnection.query(`SELECT
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
     FROM cms_page`);
    for (const row of rows) {
        const id = Number(row.page_id);
        if (!Number.isFinite(id)) {
            continue;
        }
        const metadata = {
            magento_page_id: id,
            name: row.title,
            content_heading: row.content_heading ?? null,
        };
        await pgPool.query(`
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
      `, [
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
        ]);
    }
    console.log(`→ Imported ${rows.length} CMS pages`);
}
async function seedCouponRules(mysqlConnection, pgPool) {
    const [rows] = await mysqlConnection.query(`SELECT
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
     ORDER BY sc.coupon_id ASC`);
    let imported = 0;
    for (const row of rows) {
        const couponId = Number(row.coupon_id);
        const domainId = Number(row.domain_id);
        if (!Number.isFinite(domainId)) {
            continue;
        }
        const domainExtId = row.domain_extention_id !== null && row.domain_extention_id !== undefined
            ? Number(row.domain_extention_id)
            : null;
        await pgPool.query(`
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
      `, [
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
        ]);
        imported += 1;
    }
    console.log(`→ Imported ${imported} coupon rules`);
}
async function seedSettings(mysqlConnection, pgPool) {
    const promotionRoot = await fetchCoreConfig(mysqlConnection, "category_section/company_code/category_dropdown");
    if (promotionRoot) {
        await (0, pg_1.setRedingtonSetting)("category_restriction_promotion_root", {
            promotion_root_category_id: promotionRoot,
        });
    }
    const getInTouchRecipients = await fetchCoreConfig(mysqlConnection, "redington_sms/get_in_touch_email_receiver/email");
    if (getInTouchRecipients) {
        const recipients = getInTouchRecipients
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean);
        await (0, pg_1.setRedingtonSetting)("get_in_touch.email_recipients", {
            recipients,
        });
    }
    console.log("→ Synced Redington settings from Magento config");
}
async function fetchCoreConfig(mysqlConnection, pathValue) {
    const [rows] = await mysqlConnection.query(`SELECT value
     FROM core_config_data
     WHERE path = ?
     ORDER BY config_id DESC
     LIMIT 1`, [pathValue]);
    if (!rows.length) {
        return null;
    }
    const value = rows[0]?.value;
    return typeof value === "string" ? value : null;
}
async function syncSequences(pgPool) {
    for (const table of TABLES_WITH_SEQUENCES) {
        const sequenceQuery = `
      SELECT setval(
        pg_get_serial_sequence('${table}', 'id'),
        GREATEST((SELECT COALESCE(MAX(id), 0) FROM ${table}), 1),
        true
      )
    `;
        await pgPool.query(sequenceQuery);
    }
}
async function resetTargetTables(pgPool) {
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
    ];
    for (const table of tables) {
        await pgPool.query(`DELETE FROM ${table}`);
    }
}
function parseBool(value) {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "number") {
        return value !== 0;
    }
    if (typeof value === "string") {
        return ["1", "true", "yes", "on"].includes(value.toLowerCase());
    }
    return false;
}
function coerceDate(value) {
    if (value instanceof Date) {
        return value;
    }
    if (typeof value === "string" && value.length) {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.valueOf())) {
            return parsed;
        }
    }
    return new Date();
}
async function readMagentoDbConfig() {
    const script = `
    $config = require '${MAGENTO_ENV_PATH.replace(/\\/g, "\\\\")}';
    echo json_encode($config["db"]["connection"]["default"]);
  `;
    const result = (0, child_process_1.spawnSync)("php", ["-r", script], {
        encoding: "utf-8",
    });
    if (result.status !== 0 || !result.stdout) {
        throw new Error(`Failed to load Magento DB credentials: ${result.stderr || "unknown error"}`);
    }
    const parsed = JSON.parse(result.stdout.trim());
    if (!parsed || !parsed.dbname) {
        throw new Error("Magento DB configuration is incomplete.");
    }
    return parsed;
}
main().catch((error) => {
    console.error("❌ Failed to sync Redington data from Magento.");
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3luYy1yZWRpbmd0b24tZnJvbS1tYWdlbnRvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc2NyaXB0cy9zeW5jLXJlZGluZ3Rvbi1mcm9tLW1hZ2VudG8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSx5QkFBc0I7QUFFdEIsZ0RBQXVCO0FBQ3ZCLGlEQUF5QztBQUN6Qyw2REFBa0M7QUFFbEMsc0NBY3NCO0FBU3RCLE1BQU0sZ0JBQWdCLEdBQUcsY0FBSSxDQUFDLE9BQU8sQ0FDbkMsU0FBUyxFQUNULDhCQUE4QixDQUMvQixDQUFBO0FBRUQsTUFBTSxxQkFBcUIsR0FBRztJQUM1QixrQkFBa0I7SUFDbEIsNEJBQTRCO0lBQzVCLG1CQUFtQjtJQUNuQix5QkFBeUI7SUFDekIsMEJBQTBCO0lBQzFCLCtCQUErQjtJQUMvQiwyQkFBMkI7SUFDM0Isb0JBQW9CO0lBQ3BCLHVCQUF1QjtDQUNmLENBQUE7QUFFVixLQUFLLFVBQVUsSUFBSTtJQUNqQixNQUFNLFNBQVMsR0FBRyxNQUFNLG1CQUFtQixFQUFFLENBQUE7SUFFN0MsTUFBTSxlQUFlLEdBQUcsTUFBTSxpQkFBSyxDQUFDLGdCQUFnQixDQUFDO1FBQ25ELElBQUksRUFBRSxTQUFTLENBQUMsSUFBSSxJQUFJLFdBQVc7UUFDbkMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxRQUFRO1FBQ3hCLFFBQVEsRUFBRSxTQUFTLENBQUMsUUFBUTtRQUM1QixRQUFRLEVBQUUsU0FBUyxDQUFDLE1BQU07UUFDMUIsa0JBQWtCLEVBQUUsS0FBSztLQUMxQixDQUFDLENBQUE7SUFFRixNQUFNLE1BQU0sR0FBRyxJQUFBLGNBQVMsR0FBRSxDQUFBO0lBRTFCLE1BQU0sSUFBQSwrQkFBMEIsR0FBRSxDQUFBO0lBQ2xDLE1BQU0sSUFBQSx3Q0FBbUMsR0FBRSxDQUFBO0lBQzNDLE1BQU0sSUFBQSwrQkFBMEIsR0FBRSxDQUFBO0lBQ2xDLE1BQU0sSUFBQSxxQ0FBZ0MsR0FBRSxDQUFB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