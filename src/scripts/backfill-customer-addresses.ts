import "dotenv/config"

import type { AxiosInstance } from "axios"
import { Pool } from "pg"
import { createPool, RowDataPacket } from "mysql2/promise"

const clients = require("../../scripts/clients") as { md: AxiosInstance }
const adminClient = clients.md

type CustomerRow = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
}

type MagentoAddressRow = RowDataPacket & {
  entity_id: number
  parent_id: number
  address_type: string | null
  firstname: string | null
  lastname: string | null
  company: string | null
  street: string | null
  city: string | null
  region: string | null
  region_id: number | null
  postcode: string | null
  country_id: string | null
  telephone: string | null
}

type MedusaAddressPayload = {
  first_name: string
  last_name: string
  company?: string | null
  address_1: string
  address_2?: string
  city?: string
  province?: string
  postal_code?: string
  country_code: string
  phone?: string
  is_default_shipping: boolean
  is_default_billing: boolean
  metadata: Record<string, unknown>
}

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is required for backfilling customer addresses.")
  process.exit(1)
}

const MYSQL_CONFIG = {
  host: process.env.MAGENTO_DB_HOST || "localhost",
  port: Number(process.env.MAGENTO_DB_PORT || "3306"),
  user: process.env.MAGENTO_DB_USER || "root",
  password: process.env.MAGENTO_DB_PASSWORD || "root",
  database: process.env.MAGENTO_DB_NAME || "radington",
  decimalNumbers: true,
}

const MAX_ADDRESSES_PER_CUSTOMER = Number(process.env.ADDRESS_BACKFILL_LIMIT || 3)

const pgPool = new Pool({ connectionString: DATABASE_URL })
const mysqlPool = createPool(MYSQL_CONFIG)

function splitStreet(street: string | null): { line1: string; line2: string } {
  if (!street) {
    return { line1: "", line2: "" }
  }
  const parts = street
    .split(/\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  const [line1, ...rest] = parts
  return {
    line1: line1 || "",
    line2: rest.join(", "),
  }
}

function normalizeCountry(code: string | null): string {
  const normalized = (code || "").trim().toUpperCase()
  return normalized.length === 2 ? normalized : ""
}

function buildAddressPayload(
  row: MagentoAddressRow,
  customer: CustomerRow,
  defaults: { shipping: boolean; billing: boolean }
): MedusaAddressPayload | null {
  const countryCode = normalizeCountry(row.country_id)
  if (!countryCode) {
    return null
  }

  const { line1, line2 } = splitStreet(row.street)
  if (!line1 && !row.city && !row.postcode) {
    return null
  }

  const firstName = row.firstname || customer.first_name || customer.email || "Customer"
  const lastName = row.lastname || customer.last_name || ""
  const type = (row.address_type || "").toLowerCase()

  const payload: MedusaAddressPayload = {
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
  }

  if (type === "shipping" && !defaults.shipping) {
    payload.is_default_shipping = true
    defaults.shipping = true
  }

  if (type === "billing" && !defaults.billing) {
    payload.is_default_billing = true
    defaults.billing = true
  }

  return payload
}

function makeAddressKey(payload: MedusaAddressPayload): string {
  return [
    (payload.first_name || "").toLowerCase(),
    (payload.last_name || "").toLowerCase(),
    (payload.address_1 || "").toLowerCase(),
    (payload.postal_code || "").toLowerCase(),
    (payload.city || "").toLowerCase(),
    payload.country_code,
  ].join("|")
}

async function fetchMagentoAddresses(email: string): Promise<MagentoAddressRow[]> {
  const [rows] = await mysqlPool.query<MagentoAddressRow[]>(
    `
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
    `,
    [email]
  )

  return rows
}

async function fetchCustomersWithoutAddresses(): Promise<CustomerRow[]> {
  const { rows } = await pgPool.query<CustomerRow>(
    `
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
    `
  )

  return rows
}

async function createAddress(customerId: string, payload: MedusaAddressPayload) {
  await adminClient.post(`/customers/${customerId}/addresses`, payload)
}

async function main() {
  const customers = await fetchCustomersWithoutAddresses()
  if (!customers.length) {
    console.log("🎉 All customers already have at least one address.")
    return
  }

  console.log(`📬 Customers missing addresses: ${customers.length}`)

  let processed = 0
  let created = 0

  for (const customer of customers) {
    processed++
    const email = (customer.email || "").trim()
    if (!email) {
      console.warn(`⚠️ Skipping customer ${customer.id} — missing email.`)
      continue
    }

    const magentoAddresses = await fetchMagentoAddresses(email)
    if (!magentoAddresses.length) {
      console.warn(`⚠️ No Magento order addresses found for ${email}.`)
      continue
    }

    const defaults = { shipping: false, billing: false }
    const seen = new Set<string>()
    const payloads: MedusaAddressPayload[] = []

    for (const row of magentoAddresses) {
      const payload = buildAddressPayload(row, customer, defaults)
      if (!payload) {
        continue
      }

      const key = makeAddressKey(payload)
      if (seen.has(key)) {
        continue
      }

      seen.add(key)
      payloads.push(payload)

      if (payloads.length >= MAX_ADDRESSES_PER_CUSTOMER) {
        break
      }
    }

    if (!payloads.length) {
      console.warn(`⚠️ No usable addresses for ${email}.`)
      continue
    }

    for (const payload of payloads) {
      try {
        await createAddress(customer.id, payload)
        created++
      } catch (error: any) {
        const message = error?.response?.data || error?.message || "unknown error"
        console.error(`❌ Failed to create address for ${email}:`, message)
      }
    }
  }

  console.log(`✅ Processed customers: ${processed}. Addresses created: ${created}.`)
}

main()
  .catch((error) => {
    console.error("Failed to backfill customer addresses:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mysqlPool.end()
    await pgPool.end()
  })
