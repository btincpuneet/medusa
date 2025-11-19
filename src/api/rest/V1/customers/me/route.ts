import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { generateEntityId } from "@medusajs/utils"

import {
  ensureEmailPasswordIdentity,
  updateCustomerRecord,
} from "../../../../../lib/customer-auth"
import { findActiveGuestToken, getPgPool } from "../../../../../lib/pg"

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

const formatDateTime = (value?: string | Date | null) => {
  const candidate = value ? new Date(value) : new Date()
  const date = Number.isNaN(candidate.getTime()) ? new Date() : candidate

  const pad = (num: number) => String(num).padStart(2, "0")

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`
}

const sanitizeString = (value: unknown, fallback = "") => {
  if (typeof value === "string") {
    return value.trim()
  }
  if (value === null || value === undefined) {
    return fallback
  }
  return String(value).trim()
}

const toNullableString = (value: unknown) => {
  const trimmed = sanitizeString(value)
  return trimmed.length ? trimmed : null
}

const coerceNumber = (value: unknown, fallback: number): number => {
  if (value === null || value === undefined || value === "") {
    return fallback
  }
  const parsed = Number(value)
  return Number.isNaN(parsed) ? fallback : parsed
}

const coerceNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null
  }
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const coerceBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") {
    return value
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (["true", "1"].includes(normalized)) {
      return true
    }
    if (["false", "0"].includes(normalized)) {
      return false
    }
  }
  if (typeof value === "number") {
    return value !== 0
  }
  return fallback
}

const parseMetadata = (value: unknown): Record<string, unknown> => {
  if (!value) {
    return {}
  }
  if (typeof value === "object") {
    return value as Record<string, unknown>
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value)
    } catch {
      return {}
    }
  }
  return {}
}

const mapAddressToMagento = (row: any, customerId: string) => {
  const metadata = parseMetadata(row.metadata)

  const regionCode = toNullableString(metadata.region_code)
  const regionLabel =
    toNullableString(metadata.region_label) ||
    toNullableString(metadata.region) ||
    toNullableString(row.province)
  const regionId = coerceNullableNumber(
    metadata.region_id ?? metadata.regionId
  )

  const street = [
    sanitizeString(row.address_1),
    sanitizeString(row.address_2),
  ]
  const country = sanitizeString(row.country_code)

  return {
    id: row.id,
    customer_id: customerId,
    region: {
      region_code: regionCode,
      region: regionLabel,
      region_id: regionId,
    },
    region_id: regionId,
    country_id: country ? country.toUpperCase() : "",
    street,
    telephone: sanitizeString(row.phone),
    postcode: sanitizeString(row.postal_code),
    city: sanitizeString(row.city),
    firstname: sanitizeString(row.first_name),
    lastname: sanitizeString(row.last_name),
    default_shipping: coerceBoolean(
      metadata.default_shipping ?? row.is_default_shipping,
      false
    ),
    default_billing: coerceBoolean(
      metadata.default_billing ?? row.is_default_billing,
      false
    ),
  }
}

const buildMagentoCustomerPayload = (row: any, addresses: any[]) => {
  const metadata = parseMetadata(row.metadata)
  const mappedAddresses = addresses.map((address) =>
    mapAddressToMagento(address, row.id)
  )

  const defaultBillingAddress = mappedAddresses.find(
    (address) => address.default_billing
  )
  const defaultShippingAddress = mappedAddresses.find(
    (address) => address.default_shipping
  )

  const attributeDefinitions = [
    { code: "mobile_verify", fallback: "0" },
    { code: "customer_approve", fallback: "0" },
    { code: "sap_sync", fallback: "0" },
    { code: "mobile_number", fallback: "" },
    { code: "sap_customer_code", fallback: "" },
    { code: "company_code", fallback: "" },
    { code: "access_id", fallback: "" },
  ]

  const customAttributes = attributeDefinitions.map(({ code, fallback }) => ({
    attribute_code: code,
    value: sanitizeString(metadata[code], fallback),
  }))

  return {
    id: row.id,
    group_id: coerceNumber(metadata.group_id, 1),
    default_billing: defaultBillingAddress
      ? String(defaultBillingAddress.id)
      : null,
    default_shipping: defaultShippingAddress
      ? String(defaultShippingAddress.id)
      : null,
    created_at: formatDateTime(row.created_at),
    updated_at: formatDateTime(row.updated_at),
    created_in: sanitizeString(metadata.created_in, "Default Store View"),
    email: sanitizeString(row.email),
    firstname: sanitizeString(row.first_name),
    lastname: sanitizeString(row.last_name),
    prefix: toNullableString(metadata.prefix),
    gender: coerceNumber(metadata.gender, 0),
    store_id: coerceNumber(metadata.store_id, 1),
    website_id: coerceNumber(metadata.website_id, 1),
    addresses: mappedAddresses,
    disable_auto_group_change: coerceNumber(
      metadata.disable_auto_group_change,
      0
    ),
    extension_attributes: {
      is_subscribed: coerceBoolean(metadata.is_subscribed, false),
    },
    custom_attributes: customAttributes,
  }
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

  if (email) {
    email = email.trim().toLowerCase()
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

  let context: { customer: any }
  try {
    context = await resolveCustomerContext(req)
  } catch (error) {
    return handleContextError(res, error)
  }

  try {
    const addresses = await fetchCustomerAddresses(context.customer.id)
    return res.json(buildMagentoCustomerPayload(context.customer, addresses))
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
