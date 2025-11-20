import axios from "axios"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL
const MAGENTO_ADMIN_TOKEN = process.env.MAGENTO_ADMIN_TOKEN

const buildUrl = (id: string) => {
  if (!MAGENTO_REST_BASE_URL) {
    throw new Error("MAGENTO_REST_BASE_URL is not configured.")
  }
  const base = MAGENTO_REST_BASE_URL.replace(/\/$/, "")
  return `${base}/rest/V1/products/attributes/${id}/options`
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
  res.header("Access-Control-Allow-Methods", "GET,OPTIONS")
  res.header("Access-Control-Allow-Credentials", "true")
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  const attributeId = req.params.id
  if (!attributeId) {
    return res.status(400).json({ message: "Attribute id is required" })
  }

  try {
    const url = buildUrl(attributeId)
    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.authorization || `Bearer ${MAGENTO_ADMIN_TOKEN ?? ""}`,
      },
      validateStatus: () => true,
    })

    if (response.status >= 200 && response.status < 300) {
      return res.json(response.data)
    }

    return res.status(response.status || 502).json({
      message:
        (response.data && response.data.message) ||
        "Failed to fetch attribute options from Magento.",
    })
  } catch (error: any) {
    const status = error?.response?.status ?? 500
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Unexpected error fetching attribute options."
    return res.status(status).json({ message })
  }
}
