import axios from "axios"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { authenticateWithLegacySupport } from "../../../../../utils/legacy-auth"
import { updateMagentoCustomerPassword } from "../../../../../utils/magento-customer"

type MagentoLoginBody = {
  username?: string
  password?: string
}

const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL

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
  res.header("Access-Control-Allow-Methods", "POST,OPTIONS")
  res.header("Access-Control-Allow-Credentials", "true")
}

const extractTokenString = (payload: any): string | null => {
  if (!payload) {
    return null
  }

  if (typeof payload === "string") {
    return payload
  }

  if (typeof payload === "object") {
    if (typeof payload.token === "string") {
      return payload.token
    }

    if (typeof payload.access_token === "string") {
      return payload.access_token
    }

    if (typeof payload.jwt === "string") {
      return payload.jwt
    }

    if (payload.token && typeof payload.token.token === "string") {
      return payload.token.token
    }
  }

  return null
}

const buildMagentoLoginUrl = () => {
  if (!MAGENTO_REST_BASE_URL) {
    throw new Error(
      "MAGENTO_REST_BASE_URL is not configured. Unable to authenticate customers against Magento."
    )
  }

  return `${MAGENTO_REST_BASE_URL.replace(/\/$/, "")}/integration/customer/token`
}

const exchangeMagentoToken = async (username: string, password: string) => {
  const url = buildMagentoLoginUrl()

  const response = await axios.post(
    url,
    { username, password },
    {
      headers: {
        "Content-Type": "application/json",
      },
      validateStatus: () => true,
      timeout: 10000,
    }
  )

  if (
    response.status === 200 &&
    typeof response.data === "string" &&
    response.data.trim().length
  ) {
    return response.data.trim()
  }

  const message =
    (response.data && response.data.message) ||
    (typeof response.data === "string" ? response.data : null) ||
    "Failed to authenticate with Magento."

  const error: any = new Error(message)
  error.status = response.status === 401 ? 401 : 502
  throw error
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const { username, password } = req.body as MagentoLoginBody

  if (!username || !password) {
    return res.status(400).json({ message: "username and password are required" })
  }

  const normalizedUsername = String(username).trim()
  if (!normalizedUsername.length) {
    return res.status(400).json({ message: "A valid username is required." })
  }

  const email = normalizedUsername.toLowerCase()

  let medusaToken: string | null = null
  try {
    const authPayload = await authenticateWithLegacySupport(req, email, password)
    medusaToken = extractTokenString(authPayload)
    if (medusaToken) {
      res.header("X-Medusa-Token", medusaToken)
    }
  } catch (error: any) {
    const isUnauthorized =
      error?.name === "UnauthorizedError" || error?.message === "Unauthorized"
    if (!isUnauthorized) {
      console.warn("Medusa authentication failed, attempting Magento fallback.", error)
    }
  }

  let magentoToken: string | null = null
  let magentoError: any = null

  try {
    magentoToken = await exchangeMagentoToken(normalizedUsername, password)
  } catch (error: any) {
    magentoError = error
    const unauthorized =
      error?.name === "UnauthorizedError" ||
      error?.message === "Unauthorized" ||
      error?.status === 401

    if (unauthorized) {
      await updateMagentoCustomerPassword(email, password).catch(() => undefined)
      try {
        magentoToken = await exchangeMagentoToken(normalizedUsername, password)
        magentoError = null
      } catch (retryError: any) {
        magentoError = retryError
      }
    }
  }

  if (magentoToken) {
    return res.status(200).json(magentoToken)
  }

  const unauthorized =
    magentoError?.name === "UnauthorizedError" ||
    magentoError?.message === "Unauthorized" ||
    magentoError?.status === 401
  const status = unauthorized ? 401 : magentoError?.status || 500

  const message =
    status === 401
      ? "The credentials provided are invalid."
      : magentoError?.message || "Unexpected error during authentication."

  return res.status(status).json({
    message,
    ...(medusaToken ? { medusa_token: medusaToken } : {}),
  })
}
