import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { createMagentoB2CClient } from "../../../../magentoClient"

const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL
const MAGENTO_ADMIN_TOKEN = process.env.MAGENTO_ADMIN_TOKEN

const ensureMagentoConfig = () => {
  if (!MAGENTO_REST_BASE_URL || !MAGENTO_ADMIN_TOKEN) {
    throw new Error(
      "MAGENTO_REST_BASE_URL and MAGENTO_ADMIN_TOKEN are required for stock validation."
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

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  try {
    ensureMagentoConfig()
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Magento configuration missing.",
    })
  }

  const magentoClient = createMagentoB2CClient({
    baseUrl: MAGENTO_REST_BASE_URL!,
    axiosConfig: {
      headers: {
        Authorization: `Bearer ${MAGENTO_ADMIN_TOKEN}`,
        "Content-Type": "application/json",
      },
    },
  })

  try {
    const response = await magentoClient.request({
      url: "checkout/check-stock-data",
      method: "POST",
      params: req.query,
      data: req.body,
    })

    return res.status(response.status).json(response.data)
  } catch (error: any) {
    const status = error?.response?.status ?? 502
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to verify Magento stock."

    return res.status(status).json({ message })
  }
}
