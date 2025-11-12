import "dotenv/config"

import { Pool } from "pg"

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is required to mark customers as registered.")
  process.exit(1)
}

const pool = new Pool({ connectionString: DATABASE_URL })

async function markCustomersAsRegistered() {
  const { rows } = await pool.query<{
    total: string
    updated: string
  }>(
    `
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
    `
  )

  const summary = rows[0] ?? { total: "0", updated: "0" }
  console.log(
    `✅ Customers processed: ${summary.total}. Marked registered: ${summary.updated}.`
  )
}

async function main() {
  try {
    await markCustomersAsRegistered()
  } catch (error) {
    console.error("Failed to mark customers as registered:", error)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  main()
}
