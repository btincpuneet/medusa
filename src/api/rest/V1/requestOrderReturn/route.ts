import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  insertOrderReturnEntries,
} from "../../../../lib/pg"
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

type ReturnProductInput = {
  skuId?: string
  sku?: string
  qty?: number
  quantity?: number
}

type RequestReturnBody = {
  customer_email?: string
  email?: string
  orderId?: string
  order_id?: string
  products?: ReturnProductInput[]
  remark?: string
}

const resolveSkuKey = (input: ReturnProductInput, fallback: string) => {
  return (
    normalizeSku(
      input.skuId ?? input.sku ?? (input as any).sku_id,
      fallback
    ) || fallback
  )
}

const resolveQty = (input: ReturnProductInput) => {
  const qty = Number(
    input.qty ?? input.quantity ?? (input as any).return_qty ?? 0
  )
  return Math.trunc(qty)
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const body = (req.body || {}) as RequestReturnBody
  const email = String(body.customer_email || body.email || "").trim()
  const orderId = String(body.orderId || body.order_id || "").trim()
  const remark =
    typeof body.remark === "string" && body.remark.trim().length
      ? body.remark.trim()
      : null

  if (!email.length || !orderId.length) {
    return res.status(400).json({
      message: "customer_email and orderId are required.",
    })
  }

  if (!Array.isArray(body.products) || !body.products.length) {
    return res.status(400).json({
      message: "products array is required.",
    })
  }

  try {
    const { order, items, customerName } = await fetchOrderContext(orderId, email)

    const orderStatus = (order.status || "").toLowerCase()
    if (orderStatus !== "invoiced") {
      return res.status(400).json({
        message: "Returns can only be requested for invoiced orders.",
      })
    }
    const itemMap = new Map<
      string,
      {
        title: string
        quantity: number
        unit_price: number
        thumbnail: string | null
      }
    >()

    items.forEach((item) => {
      const sku = normalizeSku(item.sku, `item_${item.line_item_id}`)
      itemMap.set(sku, {
        title: item.title ?? sku,
        quantity: Number(item.quantity ?? 0) || 0,
        unit_price: Number(item.unit_price ?? 0) || 0,
        thumbnail: item.thumbnail ?? null,
      })
    })

    if (!itemMap.size) {
      return res.status(400).json({
        message: "Order does not contain any shippable items.",
      })
    }

    const summaryMap = await buildReturnSummary(orderId, email)
    const entries = []

    for (const product of body.products) {
      const sku = resolveSkuKey(product, "")
      if (!sku.length) {
        return res.status(400).json({
          message: "Each product must include a sku.",
        })
      }

      const line = itemMap.get(sku)
      if (!line) {
        return res.status(400).json({
          message: `SKU ${sku} is not part of the order.`,
        })
      }

      const qtyRequested = resolveQty(product)
      if (!Number.isFinite(qtyRequested) || qtyRequested <= 0) {
        return res.status(400).json({
          message: `Invalid quantity for ${sku}.`,
        })
      }

      const previouslyReturned = summaryMap.get(sku)?.qty ?? 0
      const remainingQty = Math.max(0, line.quantity - previouslyReturned)
      if (qtyRequested > remainingQty) {
        return res.status(400).json({
          message: `Return quantity for ${sku} exceeds remaining items.`,
        })
      }

      summaryMap.set(sku, {
        qty: previouslyReturned + qtyRequested,
        last_returned_at: new Date().toISOString(),
      })

      entries.push({
        order_id: orderId,
        user_name: customerName ?? email,
        user_email: email,
        sku,
        product_name: line.title,
        qty: qtyRequested,
        price: toMajorUnits(line.unit_price),
        order_status: order.status ?? null,
        return_status: "Pending",
        remarks: remark,
      })
    }

    const inserted = await insertOrderReturnEntries(entries)

    return res.json({
      success: true,
      returns: inserted,
    })
  } catch (error: any) {
    if (error?.status) {
      return res.status(error.status).json({ message: error.message })
    }

    return res.status(500).json({
      message: error?.message || "Failed to submit return request.",
    })
  }
}
