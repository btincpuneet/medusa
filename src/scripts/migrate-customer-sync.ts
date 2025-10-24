import "dotenv/config"

import { createPool, RowDataPacket } from "mysql2/promise"

import {
  ensureRedingtonCustomerSyncTable,
  getPgPool,
  upsertRedingtonCustomerSync,
} from "../lib/pg"

const MYSQL_CONFIG = {
  host: process.env.MAGENTO_DB_HOST || "localhost",
  port: Number(process.env.MAGENTO_DB_PORT || "3306"),
  user: process.env.MAGENTO_DB_USER || "root",
  password: process.env.MAGENTO_DB_PASSWORD || "root",
  database: process.env.MAGENTO_DB_NAME || "radington",
  decimalNumbers: true,
}

type CustomerSyncRow = RowDataPacket & {
  entity_id: number
  email: string
  sap_sync: number | null
  sap_customer_code: string | null
  updated_at: Date
}

const fetchMagentoCustomers = async () => {
  const mysql = createPool(MYSQL_CONFIG)

  const [rows] = await mysql.query<CustomerSyncRow[]>(
    `
      SELECT ce.entity_id,
             ce.email,
             cei.value AS sap_sync,
             cev.value AS sap_customer_code,
             ce.updated_at
      FROM customer_entity ce
      LEFT JOIN customer_entity_int cei
        ON cei.entity_id = ce.entity_id AND cei.attribute_id = 190
      LEFT JOIN customer_entity_varchar cev
        ON cev.entity_id = ce.entity_id AND cev.attribute_id = 192
      WHERE cei.value IS NOT NULL OR cev.value IS NOT NULL
    `
  )

  await mysql.end()

  return rows
}

const main = async () => {
  const pgPool = getPgPool()
  await ensureRedingtonCustomerSyncTable()

  try {
    const customers = await fetchMagentoCustomers()
    if (!customers.length) {
      console.log("No Magento customers with SAP sync metadata found.")
      return
    }

    for (const customer of customers) {
      const email = (customer.email || "").trim()
      if (!email) {
        continue
      }

      const sapSync = Boolean(customer.sap_sync && Number(customer.sap_sync) > 0)
      const sapCustomerCode = customer.sap_customer_code?.trim() || null
      const sapSyncedAt = sapSync
        ? customer.updated_at instanceof Date
          ? customer.updated_at.toISOString()
          : null
        : null

      const inserted = await upsertRedingtonCustomerSync({
        email,
        sapSync,
        sapCustomerCode,
        sapSyncedAt,
      })

      console.log(
        `Synced SAP flags for ${inserted.customer_email} (sap_sync=${inserted.sap_sync}, code=${inserted.sap_customer_code ?? ""})`
      )
    }

    const { rows } = await pgPool.query(`
      SELECT COUNT(*) AS count
      FROM redington_customer_sync
    `)

    console.log(
      `Completed SAP sync migration. Total records in redington_customer_sync: ${rows[0]?.count ?? 0}`
    )
  } catch (error) {
    console.error("Failed to migrate SAP customer sync flags:", error)
    process.exitCode = 1
  } finally {
    await pgPool.end()
  }
}

if (require.main === module) {
  main()
}
