import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { generateEntityId } from "@medusajs/utils"

import {
  ensureEmailPasswordIdentity,
  updateCustomerRecord,
} from "../../../../../lib/customer-auth"
import { findActiveGuestToken, getPgPool } from "../../../../../lib/pg"
import { createMagentoB2CClient } from "../../../../../api/magentoClient"

const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL
const MAGENTO_ADMIN_TOKEN = process.env.MAGENTO_ADMIN_TOKEN

const setCors = (req: MedusaRequest, res: MedusaResponse) => {
  const origin = req.headers.origin
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin)
    res.header("Vary", "Origin")
  } else {
    res.header("Access-Control-Allow-Origin", "*")
  }

  res.header(
    "Access-Control-Allow-Headers",
    req.headers["access-control-request-headers"] ||
      "Content-Type, Authorization"
  )
  res.header("Access-Control-Allow-Methods", "GET,PUT,DELETE,OPTIONS")
  res.header("Access-Control-Allow-Credentials", "true")
}

const decodeJwtPayload = (token: string): Record<string, any> | null => {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) {
      return null
    }

    const normalizeBase64 = (value: string) => {
      let normalized = value.replace(/-/g, "+").replace(/_/g, "/")
      while (normalized.length % 4 !== 0) {
        normalized += "="
      }
      return normalized
    }

    const payload = Buffer.from(
      normalizeBase64(parts[1]),
      "base64"
    ).toString("utf8")
    return JSON.parse(payload)
  } catch {
    return null
  }
}

const fetchCustomerByEmail = async (email: string) => {
  const { rows } = await getPgPool().query(
    `
      SELECT id, email, first_name, last_name, metadata, created_at, updated_at
      FROM "customer"
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [email]
  )

  return rows[0] ?? null
}

const fetchCustomerAddresses = async (customerId: string) => {
  const { rows } = await getPgPool().query(
    `
      SELECT
        id,
        customer_id,
        first_name,
        last_name,
        address_1,
        address_2,
        city,
        country_code,
        province,
        postal_code,
        phone,
        metadata,
        is_default_shipping,
        is_default_billing
      FROM customer_address
      WHERE customer_id = $1
        AND deleted_at IS NULL
      ORDER BY created_at ASC, id ASC
    `,
    [customerId]
  )

  return rows
}

type CustomAttribute = {
  attribute_code: string
  value: unknown
}

const coerceAttributeValue = (value: any): string | number | boolean => {
  if (value === null || value === undefined) {
    return ""
  }

  return typeof value === "string" ? value : String(value)
}

const appendMetadataAttribute = (
  attributes: CustomAttribute[],
  code: string,
  value: any
) => {
  if (value === null || value === undefined || value === "") {
    return
  }

  const existing = attributes.find(
    (attr) =>
      attr &&
      typeof attr.attribute_code === "string" &&
      attr.attribute_code.toLowerCase() === code.toLowerCase()
  )

  if (existing) {
    if (
      existing.value === undefined ||
      existing.value === null ||
      existing.value === ""
    ) {
      existing.value = coerceAttributeValue(value)
    }
    return
  }

  attributes.push({
    attribute_code: code,
    value: coerceAttributeValue(value),
  })
}

const toCustomAttributeArray = (
  metadata: Record<string, any> | null | undefined
) => {
  if (!metadata) {
    return []
  }

  const rawAttributes =
    metadata.magento_custom_attributes ?? metadata.custom_attributes

  let attributes: CustomAttribute[] = []

  if (Array.isArray(rawAttributes)) {
    attributes = rawAttributes
      .filter((attr) => attr && typeof attr.attribute_code === "string")
      .map((attr) => ({
        attribute_code: attr.attribute_code,
        value: attr.value ?? attr.attribute_value ?? "",
      }))
  } else if (rawAttributes && typeof rawAttributes === "object") {
    attributes = Object.entries(rawAttributes).map(
      ([attribute_code, value]) => ({
        attribute_code,
        value,
      })
    )
  }

  appendMetadataAttribute(
    attributes,
    "access_id",
    metadata.access_id ?? metadata.magento_access_id
  )
  appendMetadataAttribute(
    attributes,
    "company_code",
    metadata.company_code ?? metadata.magento_company_code
  )

  return attributes
}

const normalizeStreetLines = (line1?: string | null, line2?: string | null) => {
  const lines = []
  if (typeof line1 === "string" && line1.trim().length) {
    lines.push(line1.trim())
  }
  if (typeof line2 === "string" && line2.trim().length) {
    lines.push(line2.trim())
  }
  return lines.length ? lines : [""]
}

const buildMagentoAddress = (row: any) => {
  const metadata =
    row && typeof row.metadata === "object" && row.metadata !== null
      ? row.metadata
      : {}

  const regionObject =
    (metadata.magento_region_object &&
      typeof metadata.magento_region_object === "object") ||
    null

  const region = {
    region_code:
      regionObject?.region_code ??
      metadata.magento_region_code ??
      metadata.magento_region ??
      null,
    region:
      regionObject?.region ??
      metadata.magento_region ??
      row.province ??
      null,
    region_id:
      regionObject?.region_id ??
      metadata.magento_region_id ??
      null,
  }

  return {
    id: row.id,
    customer_id: row.customer_id,
    region,
    region_id: region.region_id,
    country_id: row.country_code ?? "",
    street: normalizeStreetLines(row.address_1, row.address_2),
    telephone: row.phone ?? "",
    postcode: row.postal_code ?? "",
    city: row.city ?? "",
    firstname: row.first_name ?? "",
    lastname: row.last_name ?? "",
    company: metadata.company ?? null,
    default_shipping: Boolean(row.is_default_shipping),
    default_billing: Boolean(row.is_default_billing),
  }
}

const buildMagentoCustomerPayload = (
  row: any,
  addresses: any[]
) => {
  const metadata =
    row && typeof row.metadata === "object" && row.metadata !== null
      ? row.metadata
      : {}

  return {
    id: row.id,
    group_id: metadata.group_id ?? 1,
    default_billing: metadata.default_billing ?? null,
    default_shipping: metadata.default_shipping ?? null,
    confirmation: metadata.confirmation ?? null,
    created_at: row.created_at
      ? new Date(row.created_at).toISOString()
      : new Date().toISOString(),
    updated_at: row.updated_at
      ? new Date(row.updated_at).toISOString()
      : new Date().toISOString(),
    created_in: metadata.created_in ?? "Medusa",
    dob: metadata.dob ?? null,
    email: row.email,
    firstname: row.first_name ?? "",
    lastname: row.last_name ?? "",
    middlename: metadata.middlename ?? null,
    prefix: metadata.prefix ?? null,
    suffix: metadata.suffix ?? null,
    gender: metadata.gender ?? null,
    store_id: metadata.store_id ?? 1,
    website_id: metadata.website_id ?? 1,
    addresses: addresses.map(buildMagentoAddress),
    disable_auto_group_change: metadata.disable_auto_group_change ?? 0,
    extension_attributes: {
      is_subscribed: metadata.is_subscribed ?? false,
    },
    custom_attributes: toCustomAttributeArray(metadata),
  }
}

const fetchMagentoCustomerWithToken = async (
  token: string
): Promise<any | null> => {
  if (!MAGENTO_REST_BASE_URL) {
    return null
  }

  try {
    const client = createMagentoB2CClient({
      baseUrl: MAGENTO_REST_BASE_URL,
      axiosConfig: {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    })

    const response = await client.request({
      url: "customers/me",
      method: "GET",
    })

    if (response?.status >= 200 && response.status < 300) {
      return response.data
    }
  } catch (error: any) {
    const status = error?.response?.status
    if (!status || (status !== 401 && status !== 403)) {
      console.warn(
        "Failed to fetch Magento customer via customer token.",
        error?.message ?? error
      )
    }
  }

  return null
}

const fetchMagentoCustomerByEmail = async (email: string) => {
  if (!MAGENTO_REST_BASE_URL || !MAGENTO_ADMIN_TOKEN) {
    return null
  }

  try {
    const client = createMagentoB2CClient({
      baseUrl: MAGENTO_REST_BASE_URL,
      axiosConfig: {
        headers: {
          Authorization: `Bearer ${MAGENTO_ADMIN_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    })

    const response = await client.request({
      url: "customers/search",
      method: "GET",
      params: {
        "searchCriteria[filter_groups][0][filters][0][field]": "email",
        "searchCriteria[filter_groups][0][filters][0][value]": email,
        "searchCriteria[filter_groups][0][filters][0][condition_type]": "eq",
      },
    })

    const items = response?.data?.items
    if (Array.isArray(items) && items.length > 0) {
      return items[0]
    }
  } catch (error) {
    console.warn("Failed to fetch Magento customer by email.", error)
  }

  return null
}

const extractToken = (req: MedusaRequest) =>
  req.headers.authorization || req.headers["x-auth-token"] || ""

const resolveCustomerContext = async (
  req: MedusaRequest,
  { requireExisting = true }: { requireExisting?: boolean } = {}
) => {
  const tokenHeader = extractToken(req)
  if (!tokenHeader) {
    throw {
      status: 401,
      message: "Missing Authorization header.",
    }
  }

  const token = tokenHeader.replace(/^Bearer\s+/i, "").trim()
  if (!token.length) {
    throw {
      status: 401,
      message: "Invalid Authorization header.",
    }
  }

  const guestToken = await findActiveGuestToken(token).catch(() => null)

  let email: string | null = null
  if (guestToken?.email) {
    email = guestToken.email
  } else {
    const payload = decodeJwtPayload(token)
    if (payload?.email) {
      email = payload.email
    }
  }

  if (!email) {
    throw {
      status: 401,
      message: "Invalid or expired token.",
    }
  }

  const customer = await fetchCustomerByEmail(email)
  if (requireExisting && !customer) {
    throw {
      status: 404,
      message: "Customer not found.",
    }
  }

  return {
    token,
    email,
    customer,
  }
}

const normalizeCustomAttributesInput = (value: any) => {
  if (!value) {
    return {}
  }

  if (Array.isArray(value)) {
    return value.reduce<Record<string, unknown>>((acc, attr) => {
      if (
        attr &&
        typeof attr.attribute_code === "string" &&
        attr.attribute_code.length
      ) {
        acc[attr.attribute_code] = attr.value
      }
      return acc
    }, {})
  }

  if (typeof value === "object") {
    return value as Record<string, unknown>
  }

  return {}
}

const normalizeAddressInput = (address: any) => {
  if (!address || typeof address !== "object") {
    return null
  }

  const streetArray = Array.isArray(address.street)
    ? address.street
        .map((line: any) =>
          typeof line === "string" ? line.trim() : String(line || "")
        )
        .filter((line: string) => line.length)
    : typeof address.street === "string" && address.street.trim().length
    ? [address.street.trim()]
    : []

  const regionObject =
    (address.region && typeof address.region === "object") || null

  const regionName =
    regionObject?.region ??
    regionObject?.region_name ??
    (typeof address.region === "string" ? address.region : null)

  const regionCode =
    regionObject?.region_code ??
    regionObject?.code ??
    (typeof address.region_code === "string" ? address.region_code : null) ??
    null

  const regionId =
    regionObject?.region_id ??
    address.region_id ??
    (typeof address.regionId === "number" ? address.regionId : null)

  return {
    id: address.id ? String(address.id) : undefined,
    first_name: address.firstname ?? address.first_name ?? "",
    last_name: address.lastname ?? address.last_name ?? "",
    phone: address.telephone ?? address.phone ?? "",
    address_1: streetArray[0] ?? "",
    address_2: streetArray.slice(1).join(", ") || null,
    city: address.city ?? "",
    country_code: (address.country_id ?? address.country_code ?? "")
      .toString()
      .toUpperCase(),
    postal_code: address.postcode ?? address.post_code ?? "",
    province: regionName ?? null,
    is_default_shipping: Boolean(address.default_shipping),
    is_default_billing: Boolean(address.default_billing),
    metadata: {
      magento_region: regionName,
      magento_region_code: regionCode,
      magento_region_id: regionId,
      magento_region_object: regionObject,
      magento_street: streetArray,
    },
  }
}

const syncCustomerAddresses = async (
  customerId: string,
  addresses: any[]
) => {
  const pool = getPgPool()
  const { rows: existingRows } = await pool.query(
    `
      SELECT id, metadata
      FROM customer_address
      WHERE customer_id = $1
    `,
    [customerId]
  )

  const existingMap = new Map<string, any>(
    existingRows.map((row) => [row.id, row])
  )
  const keepIds = new Set<string>()

  for (const address of addresses) {
    const normalized = normalizeAddressInput(address)
    if (!normalized) {
      continue
    }

    const baseId = normalized.id && existingMap.has(normalized.id)
      ? normalized.id
      : generateEntityId(undefined, "cuaddr")

    keepIds.add(baseId)

    const existingMetadata =
      (existingMap.get(baseId)?.metadata &&
        typeof existingMap.get(baseId).metadata === "object" &&
        existingMap.get(baseId).metadata !== null
          ? existingMap.get(baseId).metadata
          : {}) ?? {}

    const metadata = {
      ...existingMetadata,
      ...normalized.metadata,
      company:
        typeof address.company === "string" ? address.company : existingMetadata.company,
    }

    if (existingMap.has(baseId)) {
      await pool.query(
        `
          UPDATE customer_address
          SET
            first_name = $1,
            last_name = $2,
            address_1 = $3,
            address_2 = $4,
            city = $5,
            country_code = $6,
            province = $7,
            postal_code = $8,
            phone = $9,
            is_default_shipping = $10,
            is_default_billing = $11,
            metadata = $12,
            updated_at = NOW(),
            deleted_at = NULL
          WHERE id = $13
            AND customer_id = $14
        `,
        [
          normalized.first_name,
          normalized.last_name,
          normalized.address_1,
          normalized.address_2,
          normalized.city,
          normalized.country_code || null,
          normalized.province,
          normalized.postal_code,
          normalized.phone,
          normalized.is_default_shipping,
          normalized.is_default_billing,
          metadata,
          baseId,
          customerId,
        ]
      )
    } else {
      await pool.query(
        `
          INSERT INTO customer_address (
            id,
            customer_id,
            address_name,
            first_name,
            last_name,
            address_1,
            address_2,
            city,
            country_code,
            province,
            postal_code,
            phone,
            metadata,
            is_default_shipping,
            is_default_billing
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
          )
        `,
        [
          baseId,
          customerId,
          `${normalized.first_name ?? ""} ${normalized.last_name ?? ""}`.trim() ||
            null,
          normalized.first_name,
          normalized.last_name,
          normalized.address_1,
          normalized.address_2,
          normalized.city,
          normalized.country_code || null,
          normalized.province,
          normalized.postal_code,
          normalized.phone,
          metadata,
          normalized.is_default_shipping,
          normalized.is_default_billing,
        ]
      )
    }
  }

  for (const row of existingRows) {
    if (!keepIds.has(row.id)) {
      await pool.query(
        `
          UPDATE customer_address
          SET deleted_at = NOW(), updated_at = NOW()
          WHERE id = $1
            AND customer_id = $2
        `,
        [row.id, customerId]
      )
    }
  }
}

const softDeleteCustomer = async (customerId: string) => {
  await getPgPool().query(
    `
      UPDATE "customer"
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `,
    [customerId]
  )

  await getPgPool().query(
    `
      UPDATE customer_address
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE customer_id = $1
    `,
    [customerId]
  )
}

const handleContextError = (res: MedusaResponse, error: any) => {
  if (error?.status) {
    return res.status(error.status).json({ message: error.message })
  }
  return res
    .status(500)
    .json({ message: error?.message ?? "Unexpected customer error." })
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const tokenHeader = extractToken(req)
  if (!tokenHeader) {
    return res.status(401).json({ message: "Missing Authorization header." })
  }

  const token = tokenHeader.replace(/^Bearer\s+/i, "").trim()
  if (!token.length) {
    return res.status(401).json({ message: "Invalid Authorization header." })
  }

  let guestToken: any = null
  try {
    guestToken = await findActiveGuestToken(token).catch(() => null)
  } catch {
    guestToken = null
  }

  if (!guestToken) {
    const magentoMe = await fetchMagentoCustomerWithToken(token)
    if (magentoMe) {
      return res.json(magentoMe)
    }
  }

  let email: string | null = guestToken?.email ?? null
  if (!email) {
    const payload = decodeJwtPayload(token)
    if (payload?.email) {
      email = payload.email
    }
  }

  if (!email) {
    return res.status(401).json({ message: "Invalid or expired token." })
  }

  try {
    const customer = await fetchCustomerByEmail(email)

    if (!customer) {
      const magentoCustomer = await fetchMagentoCustomerByEmail(email)
      if (magentoCustomer) {
        return res.json(magentoCustomer)
      }
      return res.status(404).json({ message: "Customer not found." })
    }

    const addresses = await fetchCustomerAddresses(customer.id)
    return res.json(buildMagentoCustomerPayload(customer, addresses))
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message ?? "Failed to load customer profile.",
    })
  }
}

type MagentoCustomer = {
  email?: string
  firstname?: string
  lastname?: string
  middlename?: string
  prefix?: string
  suffix?: string
  store_id?: number
  website_id?: number
  custom_attributes?: any
  addresses?: any[]
  [key: string]: any
}

type MagentoCustomerUpdateBody = {
  customer?: MagentoCustomer
  password?: string
}

export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  let context: { email: string; customer: any }
  try {
    context = await resolveCustomerContext(req)
  } catch (error) {
    return handleContextError(res, error)
  }

  const body = (req.body || {}) as MagentoCustomerUpdateBody
  const payload = (body.customer || {}) as MagentoCustomer
  const customAttributes = normalizeCustomAttributesInput(
    payload.custom_attributes
  )

  const updateData: Record<string, any> = {}
  const metadataUpdates: Record<string, any> = {}
  let passwordUpdate: string | undefined

  if (typeof payload.firstname === "string") {
    updateData.first_name = payload.firstname
  }
  if (typeof payload.lastname === "string") {
    updateData.last_name = payload.lastname
  }
  if (typeof payload.middlename === "string") {
    metadataUpdates.middlename = payload.middlename
  }

  if (Object.keys(customAttributes).length) {
    metadataUpdates.magento_custom_attributes = {
      ...((context.customer.metadata || {}).magento_custom_attributes || {}),
      ...customAttributes,
    }
  }

  if (
    typeof payload.store_id === "number" ||
    typeof payload.website_id === "number"
  ) {
    metadataUpdates.store_id =
      typeof payload.store_id === "number"
        ? payload.store_id
        : context.customer.metadata?.store_id

    metadataUpdates.website_id =
      typeof payload.website_id === "number"
        ? payload.website_id
        : context.customer.metadata?.website_id
  }

  if (Object.keys(metadataUpdates).length) {
    updateData.metadata = {
      ...(context.customer.metadata || {}),
      ...metadataUpdates,
    }
  }

  if (typeof body.password === "string" && body.password.trim().length) {
    passwordUpdate = body.password.trim()
  }

  const hasAddressesField = Object.prototype.hasOwnProperty.call(
    payload,
    "addresses"
  )

  if (
    !Object.keys(updateData).length &&
    !hasAddressesField
  ) {
    return res.status(400).json({
      message: "Provide customer fields or addresses to update.",
    })
  }

  try {
    if (Object.keys(updateData).length) {
      await updateCustomerRecord(req.scope, context.customer.id, updateData)
    }

    if (passwordUpdate) {
      await ensureEmailPasswordIdentity(
        req.scope,
        context.email,
        passwordUpdate,
        context.customer.id
      )
    }

    if (hasAddressesField) {
      const addressesArray = Array.isArray(payload.addresses)
        ? payload.addresses
        : []
      await syncCustomerAddresses(context.customer.id, addressesArray)
    }

    const updatedCustomer = await fetchCustomerByEmail(context.email)
    if (!updatedCustomer) {
      throw new Error("Updated customer could not be reloaded.")
    }
    const addresses = await fetchCustomerAddresses(context.customer.id)
    return res.json(buildMagentoCustomerPayload(updatedCustomer, addresses))
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to update customer profile.",
    })
  }
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  let context: { customer: any }
  try {
    context = await resolveCustomerContext(req)
  } catch (error) {
    return handleContextError(res, error)
  }

  try {
    await softDeleteCustomer(context.customer.id)
    return res.json(true)
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to delete customer.",
    })
  }
}
