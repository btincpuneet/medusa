import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

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
  res.header("Access-Control-Allow-Methods", "GET,OPTIONS")
  res.header("Access-Control-Allow-Credentials", "true")
}

const ensureMagentoConfig = () => {
  if (!MAGENTO_REST_BASE_URL || !MAGENTO_ADMIN_TOKEN) {
    throw new Error(
      "MAGENTO_REST_BASE_URL and MAGENTO_ADMIN_TOKEN are required to proxy Magento products."
    )
  }
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
      message:
        error instanceof Error
          ? error.message
          : "Magento configuration missing.",
    })
  }

  const sku = req.params?.sku || req.params?.id

  if (!sku) {
    return res.status(400).json({ message: "SKU is required." })
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
      url: `products/${encodeURIComponent(String(sku))}`,
      method: "GET",
      params: req.query,
    })

    return res.json(response.data)
  } catch (error: any) {
    const status = error?.response?.status ?? 502
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to load Magento product."

    return res.status(status).json({ message })
  }
}
