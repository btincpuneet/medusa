import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { getMaxOrderQtySummary } from "../../../../../modules/redington-max-qty"

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

  const body = (req.body || {}) as Record<string, any>
  const brandId =
    body.brand_id ??
    body.brandId ??
    body.category_id ??
    body.categoryId ??
    ""
  const accessId = body.accessId ?? body.access_id ?? ""
  const customerId = body.customer_id ?? body.customerId ?? null

  if (!String(brandId).trim().length || !String(accessId).trim().length) {
    return res.status(400).json({
      message: "brand_id and accessId are required.",
    })
  }

  try {
    const summary = await getMaxOrderQtySummary({
      brand_id: String(brandId),
      access_id: String(accessId),
      customer_id: customerId,
    })
    return res.json(summary)
  } catch (error: any) {
    const message =
      error?.message || "Failed to load max order quantity details."
    const status =
      message.toLowerCase().includes("access mapping not found") ||
      message.toLowerCase().includes("brand_id is required")
        ? 404
        : 500

    return res.status(status).json({ message })
  }
}
