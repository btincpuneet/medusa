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
import "dotenv/config"
import { Pool } from "pg"

type OrderLinkRow = {
  display_id: number
  email: string | null
  customer_id: string
}

type CustomerSyncRow = {
  customer_email: string
  customer_id: string
}

const logPreview = <T>(rows: T[], formatter: (row: T) => string, label: string) => {
  if (!rows.length) {
    return
  }

  console.log(label)
  rows.slice(0, 5).forEach((row) => {
    console.log(`  - ${formatter(row)}`)
  })

  if (rows.length > 5) {
    console.log(`  …and ${rows.length - 5} more`)
  }
}

async function linkOrders(pool: Pool): Promise<OrderLinkRow[]> {
  const { rows } = await pool.query<OrderLinkRow>(
    `
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
    `
  )

  return rows
}

async function syncCustomerTable(pool: Pool): Promise<CustomerSyncRow[]> {
  const { rows } = await pool.query<CustomerSyncRow>(
    `
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
    `
  )

  return rows
}

async function reportRemaining(pool: Pool) {
  const { rows } = await pool.query<{ display_id: number; email: string | null }>(
    `
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
    `
  )

  if (!rows.length) {
    console.log("No orphaned orders remain without a matching customer email.")
    return
  }

  console.warn("Orders still missing a resolvable customer (email mismatch):")
  rows.forEach((row) => {
    const email = row.email || "<no email>"
    console.warn(`  - Order #${row.display_id ?? "?"} (${email})`)
  })
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL env variable is required to repair customer/order links.")
  }

  const pool = new Pool({ connectionString: databaseUrl })

  try {
    const repairedOrders = await linkOrders(pool)
    console.log(`[orders] Updated ${repairedOrders.length} rows.`)
    logPreview(
      repairedOrders,
      (row) => `#${row.display_id ?? "?"} → ${row.customer_id} (${row.email ?? "no email"})`,
      "Sample order updates:"
    )

    const repairedSync = await syncCustomerTable(pool)
    console.log(`[customer_sync] Updated ${repairedSync.length} rows.`)
    logPreview(
      repairedSync,
      (row) => `${row.customer_email} → ${row.customer_id}`,
      "Sample customer sync updates:"
    )

    await reportRemaining(pool)
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error("Failed to repair customer/order links.")
  console.error(err)
  process.exit(1)
})
