import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  buildReturnSummary,
  fetchOrderContext,
  normalizeSku,
  toMajorUnits,
} from "../order-return/helpers"

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

  const body = req.body || {}
  const email = String(body.customer_email || body.email || "").trim()
  const orderId = String(body.orderId || body.order_id || "").trim()

  if (!email.length || !orderId.length) {
    return res.status(400).json({
      message: "customer_email and orderId are required.",
    })
  }

  try {
    const { order, items } = await fetchOrderContext(orderId, email)

    const summaryMap = await buildReturnSummary(orderId, email)
    const orderStatus = (order.status || "").toLowerCase()
    const canReturnStatus = orderStatus === "invoiced"

    const response = items.map((item) => {
      const sku = normalizeSku(item.sku, `item_${item.line_item_id}`)
      const quantity = Number(item.quantity ?? 0) || 0
      const unitPrice = Number(item.unit_price ?? 0)
      const totalPriceMinor = unitPrice * quantity

      const summary = summaryMap.get(sku)
      const returnedQty = summary?.qty ?? 0
      const remainingQty = Math.max(0, quantity - returnedQty)

      return {
        sku,
        product_name: item.title ?? sku,
        image: item.thumbnail ?? null,
        qty: quantity,
        unit_price: toMajorUnits(unitPrice),
        total_price: toMajorUnits(totalPriceMinor),
        return_date: summary?.last_returned_at ?? null,
        can_return: canReturnStatus && remainingQty > 0 ? "yes" : "no",
        returned_qty: returnedQty,
      }
    })

    if (!response.length) {
      return res.json([])
    }

    return res.json(response)
  } catch (error: any) {
    if (error?.status) {
      return res.status(error.status).json({ message: error.message })
    }

    return res.status(500).json({
      message: error?.message || "Failed to evaluate order return eligibility.",
    })
  }
}
