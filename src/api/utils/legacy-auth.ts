import type { MedusaRequest } from "@medusajs/framework/http"
import type { AwilixContainer } from "awilix"
import jwt from "jsonwebtoken"

import {
  ensureEmailPasswordIdentity,
  findRegisteredCustomerByEmail,
  getAuthModuleService,
  updateCustomerRecord,
} from "../../lib/customer-auth"

type LegacyMeta = {
  magento_password_hash?: string | null
  magento_hash_algo?: string | null
  legacy_password_hash?: string | null
  legacy_hash_algo?: string | null
  [key: string]: unknown
}

type AuthResult = any

const unauthorizedError = () => {
  const error = new Error("Unauthorized")
  error.name = "UnauthorizedError"
  return error
}

const EMAILPASS_PROVIDER = "emailpass"
const TOKEN_TTL = process.env.CUSTOMER_TOKEN_TTL || "1d"
const JWT_SECRET = process.env.JWT_SECRET || "supersecret"

const issueCustomerToken = (email: string, customerId?: string | null) => {
  const normalizedEmail = (email || "").trim().toLowerCase()
  if (!normalizedEmail) {
    throw unauthorizedError()
  }

  return jwt.sign(
    {
      email: normalizedEmail,
      actor_type: "customer",
      customer_id: customerId ?? null,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  )
}

const authenticateWithEmailPass = async (
  scope: AwilixContainer,
  email: string,
  password: string
) => {
  const authModule = getAuthModuleService(scope)
  const normalizedEmail = (email || "").trim().toLowerCase()

  const result = await authModule.authenticate(EMAILPASS_PROVIDER, {
    body: {
      email: normalizedEmail,
      password,
    },
  })

  if (!result?.success) {
    throw unauthorizedError()
  }

  let customerId =
    (result.authIdentity?.app_metadata?.customer_id as string | undefined) ||
    null

  if (!customerId) {
    const customer = await findRegisteredCustomerByEmail(scope, normalizedEmail)
    if (!customer?.id) {
      throw unauthorizedError()
    }

    customerId = customer.id
    await ensureEmailPasswordIdentity(scope, normalizedEmail, password, customerId)
  }

  return issueCustomerToken(normalizedEmail, customerId)
}

/**
 * Attempts to authenticate a Medusa customer. If the credential check fails,
 * the function falls back to validating legacy Magento hashes stored in
 * customer metadata. When a legacy hash succeeds, it is automatically
 * upgraded to a Medusa-native password hash for subsequent logins.
 */
export const authenticateWithLegacySupport = async (
  req: MedusaRequest,
  email: string,
  password: string
): Promise<AuthResult> => {
  const scope: AwilixContainer = req.scope

  const bcrypt = require("bcryptjs")
  const argon2 = require("argon2")

  // 1) Try native Medusa auth first.
  try {
    return await authenticateWithEmailPass(scope, email, password)
  } catch (_) {
    // continue with legacy path
  }

  // 2) Attempt legacy hash validation.
  const customer = await findRegisteredCustomerByEmail(scope, email)
  if (!customer) {
    throw unauthorizedError()
  }

  const metadata: LegacyMeta = (customer.metadata || {}) as LegacyMeta
  const legacyHash =
    metadata.magento_password_hash ??
    metadata.legacy_password_hash ??
    null
  const legacyAlgo =
    metadata.magento_hash_algo ??
    metadata.legacy_hash_algo ??
    null

  if (!legacyHash) {
    throw unauthorizedError()
  }

  let isValid = false
  try {
    const normalizedHash =
      typeof legacyHash === "string" ? legacyHash.trim() : ""

    if (!normalizedHash) {
      throw unauthorizedError()
    }

    if (
      legacyAlgo === "bcrypt" ||
      normalizedHash.startsWith("$2a$") ||
      normalizedHash.startsWith("$2b$") ||
      normalizedHash.startsWith("$2y$")
    ) {
      // Magento stores bcrypt hashes with $2y; Node's bcrypt expects $2b.
      const compatibleHash = normalizedHash.replace(/^\$2y\$/, "$2b$")
      isValid = await bcrypt.compare(password, compatibleHash)
    } else if (
      legacyAlgo === "argon2id" ||
      normalizedHash.startsWith("$argon2id$")
    ) {
      isValid = await argon2.verify(normalizedHash, password)
    }
  } catch (_) {
    // fall through to unauthorized
  }

  if (!isValid) {
    throw unauthorizedError()
  }

  // 3) Upgrade password to Medusa-native hash and clear legacy metadata.
  await updateCustomerRecord(scope, customer.id, {
    metadata: {
      ...metadata,
      magento_password_hash: null,
      magento_hash_algo: null,
      legacy_password_hash: null,
      legacy_hash_algo: null,
      magento_password_upgraded_at: new Date().toISOString(),
    },
  })

  await ensureEmailPasswordIdentity(scope, email, password, customer.id)

  // 4) Issue a Medusa JWT for downstream requests.
  return issueCustomerToken(email, customer.id)
}
