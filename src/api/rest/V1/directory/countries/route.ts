import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { createMagentoB2CClient } from "../../../../magentoClient"

const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL

const ensureMagentoConfig = () => {
  if (!MAGENTO_REST_BASE_URL) {
    throw new Error(
      "MAGENTO_REST_BASE_URL is required to proxy Magento directory endpoints."
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
      message:
        error instanceof Error
          ? error.message
          : "Magento configuration missing.",
    })
  }

  const client = createMagentoB2CClient({
    baseUrl: MAGENTO_REST_BASE_URL!,
  })

  try {
    const response = await client.request({
      url: "directory/countries",
      method: "GET",
      params: req.query,
    })

    return res.status(response.status).json(response.data)
  } catch (error: any) {
    const status = error?.response?.status ?? 502
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to load country directory."
    return res.status(status).json({ message })
  }
}
