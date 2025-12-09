"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Utility script to repair the relationship between Medusa customers and orders.
 * Some migrated orders carried over Magento identifiers that no longer match any
 * row in the `customer` table, which prevents the Admin "Orders" section on the
 * customer profile from returning results. We fix this by:
 *   1. Matching orders to customers via their email (case-insensitive).
 *   2. Assigning the correct `customer_id` to each affected order.
 *   3. Updating `redington_customer_sync` so SAP flags stay aligned.
 *
 * Run with:  npx ts-node src/scripts/link-orders-to-customers.ts
 */
require("dotenv/config");
const pg_1 = require("pg");
const logPreview = (rows, formatter, label) => {
    if (!rows.length) {
        return;
    }
    console.log(label);
    rows.slice(0, 5).forEach((row) => {
        console.log(`  - ${formatter(row)}`);
    });
    if (rows.length > 5) {
        console.log(`  …and ${rows.length - 5} more`);
    }
};
async function linkOrders(pool) {
    const { rows } = await pool.query(`
      WITH candidates AS (
        SELECT
          o.id,
          o.display_id,
          o.email,
          c.id AS customer_id
        FROM "order" o
        INNER JOIN "customer" c
          ON LOWER(c.email) = LOWER(o.email)
        WHERE c.id IS DISTINCT FROM o.customer_id
      )
      UPDATE "order" o
      SET customer_id = candidates.customer_id,
          updated_at = NOW()
      FROM candidates
      WHERE o.id = candidates.id
      RETURNING o.display_id, o.email, o.customer_id
    `);
    return rows;
}
async function syncCustomerTable(pool) {
    const { rows } = await pool.query(`
      WITH candidates AS (
        SELECT
          r.id,
          r.customer_email,
          c.id AS customer_id
        FROM redington_customer_sync r
        INNER JOIN "customer" c
          ON LOWER(c.email) = LOWER(r.customer_email)
        WHERE c.id IS DISTINCT FROM r.customer_id
      )
      UPDATE redington_customer_sync r
      SET customer_id = candidates.customer_id,
          updated_at = NOW()
      FROM candidates
      WHERE r.id = candidates.id
      RETURNING r.customer_email, r.customer_id
    `);
    return rows;
}
async function reportRemaining(pool) {
    const { rows } = await pool.query(`
      SELECT o.display_id, o.email
      FROM "order" o
      WHERE (
        o.customer_id IS NULL
        OR NOT EXISTS (
          SELECT 1 FROM "customer" c WHERE c.id = o.customer_id
        )
      )
      AND NOT EXISTS (
        SELECT 1 FROM "customer" c WHERE LOWER(c.email) = LOWER(o.email)
      )
      ORDER BY o.created_at DESC
      LIMIT 10
    `);
    if (!rows.length) {
        console.log("No orphaned orders remain without a matching customer email.");
        return;
    }
    console.warn("Orders still missing a resolvable customer (email mismatch):");
    rows.forEach((row) => {
        const email = row.email || "<no email>";
        console.warn(`  - Order #${row.display_id ?? "?"} (${email})`);
    });
}
async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error("DATABASE_URL env variable is required to repair customer/order links.");
    }
    const pool = new pg_1.Pool({ connectionString: databaseUrl });
    try {
        const repairedOrders = await linkOrders(pool);
        console.log(`[orders] Updated ${repairedOrders.length} rows.`);
        logPreview(repairedOrders, (row) => `#${row.display_id ?? "?"} → ${row.customer_id} (${row.email ?? "no email"})`, "Sample order updates:");
        const repairedSync = await syncCustomerTable(pool);
        console.log(`[customer_sync] Updated ${repairedSync.length} rows.`);
        logPreview(repairedSync, (row) => `${row.customer_email} → ${row.customer_id}`, "Sample customer sync updates:");
        await reportRemaining(pool);
    }
    finally {
        await pool.end();
    }
}
main().catch((err) => {
    console.error("Failed to repair customer/order links.");
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluay1vcmRlcnMtdG8tY3VzdG9tZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3NjcmlwdHMvbGluay1vcmRlcnMtdG8tY3VzdG9tZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7Ozs7R0FVRztBQUNILHlCQUFzQjtBQUN0QiwyQkFBeUI7QUFhekIsTUFBTSxVQUFVLEdBQUcsQ0FBSSxJQUFTLEVBQUUsU0FBNkIsRUFBRSxLQUFhLEVBQUUsRUFBRTtJQUNoRixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2pCLE9BQU07SUFDUixDQUFDO0lBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUNsQixJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtRQUMvQixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUN0QyxDQUFDLENBQUMsQ0FBQTtJQUVGLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUNwQixPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQy9DLENBQUM7QUFDSCxDQUFDLENBQUE7QUFFRCxLQUFLLFVBQVUsVUFBVSxDQUFDLElBQVU7SUFDbEMsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FDL0I7Ozs7Ozs7Ozs7Ozs7Ozs7OztLQWtCQyxDQUNGLENBQUE7SUFFRCxPQUFPLElBQUksQ0FBQTtBQUNiLENBQUM7QUFFRCxLQUFLLFVBQVUsaUJBQWlCLENBQUMsSUFBVTtJQUN6QyxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxJQUFJLENB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