"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const pg_1 = require("pg");
const promise_1 = require("mysql2/promise");
const clients = require("../../scripts/clients");
const adminClient = clients.md;
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL is required for backfilling customer addresses.");
    process.exit(1);
}
const MYSQL_CONFIG = {
    host: process.env.MAGENTO_DB_HOST || "localhost",
    port: Number(process.env.MAGENTO_DB_PORT || "3306"),
    user: process.env.MAGENTO_DB_USER || "root",
    password: process.env.MAGENTO_DB_PASSWORD || "root",
    database: process.env.MAGENTO_DB_NAME || "radington",
    decimalNumbers: true,
};
const MAX_ADDRESSES_PER_CUSTOMER = Number(process.env.ADDRESS_BACKFILL_LIMIT || 3);
const pgPool = new pg_1.Pool({ connectionString: DATABASE_URL });
const mysqlPool = (0, promise_1.createPool)(MYSQL_CONFIG);
function splitStreet(street) {
    if (!street) {
        return { line1: "", line2: "" };
    }
    const parts = street
        .split(/\r?\n/)
        .map((p) => p.trim())
        .filter(Boolean);
    const [line1, ...rest] = parts;
    return {
        line1: line1 || "",
        line2: rest.join(", "),
    };
}
function normalizeCountry(code) {
    const normalized = (code || "").trim().toUpperCase();
    return normalized.length === 2 ? normalized : "";
}
function buildAddressPayload(row, customer, defaults) {
    const countryCode = normalizeCountry(row.country_id);
    if (!countryCode) {
        return null;
    }
    const { line1, line2 } = splitStreet(row.street);
    if (!line1 && !row.city && !row.postcode) {
        return null;
    }
    const firstName = row.firstname || customer.first_name || customer.email || "Customer";
    const lastName = row.lastname || customer.last_name || "";
    const type = (row.address_type || "").toLowerCase();
    const payload = {
        first_name: firstName,
        last_name: lastName,
        company: row.company || null,
        address_1: line1 || "",
        address_2: line2 || "",
        city: row.city || "",
        province: row.region || "",
        postal_code: row.postcode || "",
        country_code: countryCode,
        phone: row.telephone || "",
        is_default_shipping: false,
        is_default_billing: false,
        metadata: {
            source: "sales_order_address",
            magento_address_id: row.entity_id,
            magento_parent_id: row.parent_id,
            magento_address_type: row.address_type,
            magento_region_id: row.region_id,
            magento_region: row.region,
        },
    };
    if (type === "shipping" && !defaults.shipping) {
        payload.is_default_shipping = true;
        defaults.shipping = true;
    }
    if (type === "billing" && !defaults.billing) {
        payload.is_default_billing = true;
        defaults.billing = true;
    }
    return payload;
}
function makeAddressKey(payload) {
    return [
        (payload.first_name || "").toLowerCase(),
        (payload.last_name || "").toLowerCase(),
        (payload.address_1 || "").toLowerCase(),
        (payload.postal_code || "").toLowerCase(),
        (payload.city || "").toLowerCase(),
        payload.country_code,
    ].join("|");
}
async function fetchMagentoAddresses(email) {
    const [rows] = await mysqlPool.query(`
      SELECT
        entity_id,
        parent_id,
        address_type,
        firstname,
        lastname,
        company,
        street,
        city,
        region,
        region_id,
        postcode,
        country_id,
        telephone
      FROM sales_order_address
      WHERE email = ?
      ORDER BY entity_id DESC
      LIMIT 50
    `, [email]);
    return rows;
}
async function fetchCustomersWithoutAddresses() {
    const { rows } = await pgPool.query(`
      SELECT
        c.id,
        c.email,
        c.first_name,
        c.last_name
      FROM "customer" c
      LEFT JOIN customer_address ca
        ON ca.customer_id = c.id
        AND ca.deleted_at IS NULL
      WHERE ca.id IS NULL
        AND c.deleted_at IS NULL
        AND c.email IS NOT NULL
      ORDER BY c.created_at ASC
    `);
    return rows;
}
async function createAddress(customerId, payload) {
    await adminClient.post(`/customers/${customerId}/addresses`, payload);
}
async function main() {
    const customers = await fetchCustomersWithoutAddresses();
    if (!customers.length) {
        console.log("🎉 All customers already have at least one address.");
        return;
    }
    console.log(`📬 Customers missing addresses: ${customers.length}`);
    let processed = 0;
    let created = 0;
    for (const customer of customers) {
        processed++;
        const email = (customer.email || "").trim();
        if (!email) {
            console.warn(`⚠️ Skipping customer ${customer.id} — missing email.`);
            continue;
        }
        const magentoAddresses = await fetchMagentoAddresses(email);
        if (!magentoAddresses.length) {
            console.warn(`⚠️ No Magento order addresses found for ${email}.`);
            continue;
        }
        const defaults = { shipping: false, billing: false };
        const seen = new Set();
        const payloads = [];
        for (const row of magentoAddresses) {
            const payload = buildAddressPayload(row, customer, defaults);
            if (!payload) {
                continue;
            }
            const key = makeAddressKey(payload);
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            payloads.push(payload);
            if (payloads.length >= MAX_ADDRESSES_PER_CUSTOMER) {
                break;
            }
        }
        if (!payloads.length) {
            console.warn(`⚠️ No usable addresses for ${email}.`);
            continue;
        }
        for (const payload of payloads) {
            try {
                await createAddress(customer.id, payload);
                created++;
            }
            catch (error) {
                const message = error?.response?.data || error?.message || "unknown error";
                console.error(`❌ Failed to create address for ${email}:`, message);
            }
        }
    }
    console.log(`✅ Processed customers: ${processed}. Addresses created: ${created}.`);
}
main()
    .catch((error) => {
    console.error("Failed to backfill customer addresses:", error);
    process.exitCode = 1;
})
    .finally(async () => {
    await mysqlPool.end();
    await pgPool.end();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2ZpbGwtY3VzdG9tZXItYWRkcmVzc2VzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3NjcmlwdHMvYmFja2ZpbGwtY3VzdG9tZXItYWRkcmVzc2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEseUJBQXNCO0FBR3RCLDJCQUF5QjtBQUN6Qiw0Q0FBMEQ7QUFFMUQsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLHVCQUF1QixDQUEwQixDQUFBO0FBQ3pFLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUE7QUF5QzlCLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFBO0FBRTdDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUNsQixPQUFPLENBQUMsS0FBSyxDQUFDLGdFQUFnRSxDQUFDLENBQUE7SUFDL0UsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUNqQixDQUFDO0FBRUQsTUFBTSxZQUFZLEdBQUc7SUFDbkIsSUFBSSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxJQUFJLFdBQVc7SUFDaEQsSUFBSSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsSUFBSSxNQUFNLENBQUM7SUFDbkQsSUFBSSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxJQUFJLE1BQU07SUFDM0MsUUFBUSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLElBQUksTUFBTTtJQUNuRCxRQUFRLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLElBQUksV0FBVztJQUNwRCxjQUFjLEVBQUUsSUFBSTtDQUNyQixDQUFBO0FBRUQsTUFBTSwwQkFBMEIsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsSUFBSSxDQUFDLENBQUMsQ0FBQTtBQUVsRixNQUFNLE1BQU0sR0FBRyxJQUFJLFNB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