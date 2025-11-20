import axios from "axios"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL
const buildUrl = () => {
  if (!MAGENTO_REST_BASE_URL) {
    throw new Error("MAGENTO_REST_BASE_URL is not configured.")
  }
  const base = MAGENTO_REST_BASE_URL.replace(/\/$/, "")
  return `${base}/rest/V1/carts/mine/coupons/apply`
}

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

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  try {
    const url = buildUrl()
    const response = await axios.post(url, req.body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.authorization || "",
      },
      validateStatus: () => true,
    })

    if (response.status >= 200 && response.status < 300) {
      return res.json(response.data)
    }

    return res.status(response.status || 502).json({
      message:
        (response.data && response.data.message) ||
        "Failed to apply coupon.",
    })
  } catch (error: any) {
    const status = error?.response?.status ?? 500
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Unexpected error applying coupon."
    return res.status(status).json({ message })
  }
}
