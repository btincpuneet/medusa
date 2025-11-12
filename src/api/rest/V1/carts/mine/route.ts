import axios from "axios"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { findActiveGuestToken } from "../../../../../lib/pg"

const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL

const ensureMagentoConfig = () => {
  if (!MAGENTO_REST_BASE_URL) {
    throw new Error("MAGENTO_REST_BASE_URL is required for cart proxy routes.")
  }
}

const ALLOWED_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS"

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
  res.header("Access-Control-Allow-Methods", ALLOWED_METHODS)
  res.header("Access-Control-Allow-Credentials", "true")
}

const buildGuestCartResponse = (
  method: string,
  token: string
): any => {
  const basePayload = {
    id: token,
    items_count: 0,
    items_qty: 0,
    customer: null,
    addresses: [],
    currency: {
      global_currency_code: "AED",
      base_currency_code: "AED",
      store_currency_code: "AED",
      quote_currency_code: "AED",
    },
    items: [],
  }

  switch (method) {
    case "POST":
      return token
    case "DELETE":
    case "PUT":
    case "PATCH":
      return { success: true }
    default:
      return basePayload
  }
}

const forwardToMagento = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  try {
    ensureMagentoConfig()
  } catch (error) {
    return res
      .status(500)
      .json({ message: (error as Error).message ?? "Magento config missing." })
  }

  const tokenHeader =
    req.headers.authorization || req.headers["x-auth-token"] || undefined

  if (!tokenHeader) {
    return res.status(401).json({ message: "Missing Authorization header." })
  }

  const method = (req.method || "GET").toUpperCase()
  const tokenValue = tokenHeader.replace(/^Bearer\s+/i, "").trim()

  if (tokenValue && !tokenValue.includes(".")) {
    const guestToken = await findActiveGuestToken(tokenValue)
    if (guestToken) {
      return res.json(buildGuestCartResponse(method, guestToken.token))
    }
  }

  const baseURL = MAGENTO_REST_BASE_URL!.replace(/\/$/, "")
  const axiosConfig = {
    baseURL,
    url: "carts/mine",
    method,
    headers: {
      Authorization: tokenHeader,
      "Content-Type": "application/json",
    },
    params: method === "GET" ? req.query : undefined,
    data:
      method === "POST" ||
      method === "PUT" ||
      method === "PATCH" ||
      method === "DELETE"
        ? req.body
        : undefined,
    validateStatus: () => true,
  }

  try {
    const response = await axios.request(axiosConfig)
    return res.status(response.status).json(response.data)
  } catch (error: any) {
    const status = error?.response?.status ?? 500
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to proxy Magento cart request."
    return res.status(status).json({ message })
  }
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

export const GET = forwardToMagento
export const POST = forwardToMagento
export const PUT = forwardToMagento
export const PATCH = forwardToMagento
export const DELETE = forwardToMagento
