"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const pg_1 = require("pg");
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL is required to mark customers as registered.");
    process.exit(1);
}
const pool = new pg_1.Pool({ connectionString: DATABASE_URL });
async function markCustomersAsRegistered() {
    const { rows } = await pool.query(`
      WITH stats AS (
        SELECT
          COUNT(*) FILTER (WHERE has_account = false AND deleted_at IS NULL) AS to_update,
          COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total_customers
        FROM "customer"
      ),
      updated AS (
        UPDATE "customer"
        SET has_account = true,
            updated_at = NOW()
        WHERE has_account = false
          AND deleted_at IS NULL
        RETURNING id
      )
      SELECT
        stats.total_customers::text AS total,
        (SELECT COUNT(*) FROM updated)::text AS updated
      FROM stats
      LIMIT 1
    `);
    const summary = rows[0] ?? { total: "0", updated: "0" };
    console.log(`✅ Customers processed: ${summary.total}. Marked registered: ${summary.updated}.`);
}
async function main() {
    try {
        await markCustomersAsRegistered();
    }
    catch (error) {
        console.error("Failed to mark customers as registered:", error);
        process.exitCode = 1;
    }
    finally {
        await pool.end();
    }
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFyay1jdXN0b21lcnMtcmVnaXN0ZXJlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zY3JpcHRzL21hcmstY3VzdG9tZXJzLXJlZ2lzdGVyZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5QkFBc0I7QUFFdEIsMkJBQXlCO0FBRXpCLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFBO0FBRTdDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUNsQixPQUFPLENBQUMsS0FBSyxDQUFDLDZEQUE2RCxDQUFDLENBQUE7SUFDNUUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUNqQixDQUFDO0FBRUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxTQUFJLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFBO0FBRXpELEtBQUssVUFBVSx5QkFBeUI7SUFDdEMsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FJL0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tBb0JDLENBQ0YsQ0FBQTtJQUVELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFBO0lBQ3ZELE9BQU8sQ0FBQyxHQUFHLENBQ1QsMEJBQTBCLE9BQU8sQ0FBQyxLQUFLLHdCQUF3QixPQUFPLENBQUMsT0FBTyxHQUFHLENBQ2xGLENBQUE7QUFDSCxDQUFDO0FBRUQsS0FBSyxVQUFVLElBQUk7SUFDakIsSUFBSSxDQUFDO1FBQ0gsTUFBTSx5QkFBeUIsRUFBRSxDQUFBO0lBQ25DLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyx5Q0FBeUMsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUMvRCxPQUFPLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQTtJQUN0QixDQUFDO1lBQVMsQ0FBQztRQUNULE1BQU0sSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFBO0lBQ2xCLENBQUM7QUFDSCxDQUFDO0FBRUQsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRSxDQUFDO0lBQzVCLElBQUksRUFBRSxDQUFBO0FBQ1IsQ0FBQyJ9