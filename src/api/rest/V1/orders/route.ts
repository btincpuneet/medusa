import axios from "axios"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL
const MAGENTO_ADMIN_TOKEN = process.env.MAGENTO_ADMIN_TOKEN

const ensureMagentoConfig = () => {
  if (!MAGENTO_REST_BASE_URL || !MAGENTO_ADMIN_TOKEN) {
    throw new Error(
      "MAGENTO_REST_BASE_URL and MAGENTO_ADMIN_TOKEN are required to proxy Magento orders."
    )
  }
}

const buildBaseUrl = () => MAGENTO_REST_BASE_URL!.replace(/\/+$/, "") + "/"

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

  try {
    ensureMagentoConfig()
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Magento config missing.",
    })
  }

  const axiosConfig = {
    baseURL: buildBaseUrl(),
    url: "orders",
    method: "GET" as const,
    headers: {
      Authorization: `Bearer ${MAGENTO_ADMIN_TOKEN}`,
      "Content-Type": "application/json",
    },
    params: req.query,
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
      "Failed to load Magento orders."
    return res.status(status).json({ message })
  }
}
