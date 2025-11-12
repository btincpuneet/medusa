import axios from "axios"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL

const ensureMagentoConfig = () => {
  if (!MAGENTO_REST_BASE_URL) {
    throw new Error(
      "MAGENTO_REST_BASE_URL is required for CC Avenue payment proxy routes."
    )
  }
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

  const axiosConfig = {
    baseURL: MAGENTO_REST_BASE_URL!.replace(/\/+$/, "") + "/",
    url: "carts/mine/cc-avenuepayment-information",
    method: "POST" as const,
    headers: {
      Authorization: tokenHeader,
      "Content-Type": "application/json",
    },
    params: req.query,
    data: req.body,
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
      "Failed to proxy Magento CC Avenue payment request."
    return res.status(status).json({ message })
  }
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

export const POST = forwardToMagento
