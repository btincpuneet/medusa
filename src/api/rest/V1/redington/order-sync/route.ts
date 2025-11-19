import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { Modules } from "@medusajs/framework/utils"

import { createMagentoB2CClient } from "../../../../magentoClient"

const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL
const MAGENTO_ADMIN_TOKEN = process.env.MAGENTO_ADMIN_TOKEN

const ensureMagentoConfig = () => {
  if (!MAGENTO_REST_BASE_URL || !MAGENTO_ADMIN_TOKEN) {
    throw new Error(
      "MAGENTO_REST_BASE_URL and MAGENTO_ADMIN_TOKEN are required for order sync."
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

const toMinorUnits = (value: any) => {
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount)) {
    return 0
  }
  return Math.round(amount * 100)
}

const mapOrderStatus = (state?: string, status?: string) => {
  const normalized = (state || status || "").toLowerCase()
  if (normalized.includes("cancel")) {
    return "canceled"
  }
  if (normalized.includes("complete")) {
    return "completed"
  }
  return "pending"
}

const mapPaymentStatus = (order: Record<string, any>) => {
  const state = String(order.state || order.status || "").toLowerCase()
  if (state.includes("cancel")) {
    return "canceled"
  }
  const paid = Number(order.total_paid ?? order.base_total_paid ?? 0)
  if (Number.isFinite(paid) && paid > 0) {
    return "captured"
  }
  if (state.includes("pending")) {
    return "awaiting"
  }
  return "not_paid"
}

const mapFulfillmentStatus = (state?: string, status?: string) => {
  const normalized = (state || status || "").toLowerCase()
  return normalized.includes("complete") ? "fulfilled" : "not_fulfilled"
}

const loadMagentoOrder = async (identifier: string) => {
  ensureMagentoConfig()

  const client = createMagentoB2CClient({
    baseUrl: MAGENTO_REST_BASE_URL!,
    axiosConfig: {
      headers: {
        Authorization: `Bearer ${MAGENTO_ADMIN_TOKEN}`,
        "Content-Type": "application/json",
      },
      validateStatus: () => true,
    },
  })

  const numericId = Number(identifier)
  if (Number.isFinite(numericId)) {
    const response = await client.request({
      url: `orders/${numericId}`,
      method: "GET",
    })
    if (response.status >= 200 && response.status < 300) {
      return response.data
    }
  }

  const response = await client.request({
    url: "orders",
    method: "GET",
    params: {
      "searchCriteria[filter_groups][0][filters][0][field]": "increment_id",
      "searchCriteria[filter_groups][0][filters][0][value]": identifier,
      "searchCriteria[filter_groups][0][filters][0][condition_type]": "eq",
    },
  })

  if (response.status >= 200 && response.status < 300) {
    const items = Array.isArray(response.data?.items)
      ? response.data.items
      : []
    if (items.length) {
      return items[0]
    }
  }

  return null
}

type SyncOrderBody = {
  order_id?: string | number
  increment_id?: string | number
  customer_email?: string
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const body = (req.body || {}) as SyncOrderBody
  const identifier =
    body.order_id ?? body.increment_id ?? req.query.order_id ?? req.query.increment_id

  if (!identifier || !String(identifier).trim().length) {
    return res.status(400).json({
      message: "order_id (or increment_id) is required to sync an order.",
    })
  }

  let magentoOrder: any = null
  try {
    magentoOrder = await loadMagentoOrder(String(identifier).trim())
  } catch (error: any) {
    return res.status(502).json({
      message:
        error?.message ||
        "Failed to load Magento order. Verify the identifier and try again.",
    })
  }

  if (!magentoOrder) {
    return res.status(404).json({
      message: "Magento order not found.",
    })
  }

  const manager = req.scope.resolve("manager")
  const orderService = req.scope.resolve(Modules.ORDER)
  const lineItemService = req.scope.resolve("lineItemService")

  const magentoIdentifier = String(
    magentoOrder.increment_id ?? magentoOrder.entity_id
  )

  const [existingOrders] = await orderService.listAndCount(
    {
      magento_order_id: magentoIdentifier,
    },
    {
      take: 1,
    }
  )

  if (!existingOrders.length) {
    const [legacyOrders] = await orderService.listAndCount(
      {
        metadata: {
          magento_order_id: magentoIdentifier,
        },
      },
      {
        take: 1,
      }
    )

    if (legacyOrders.length) {
      existingOrders.push(legacyOrders[0])
    }
  }

  if (existingOrders.length) {
    return res.json({
      order_id: existingOrders[0].id,
      already_synced: true,
    })
  }

  const currency =
    (magentoOrder.order_currency_code ||
      magentoOrder.base_currency_code ||
      "AED")?.toLowerCase() || "aed"

  const email =
    magentoOrder.customer_email ||
    body.customer_email ||
    req.body?.email ||
    null

  if (!email) {
    return res.status(400).json({
      message: "customer_email is required when Magento order does not include it.",
    })
  }

  const orderPayload = {
    email,
    currency_code: currency,
    status: mapOrderStatus(magentoOrder.state, magentoOrder.status),
    fulfillment_status: mapFulfillmentStatus(
      magentoOrder.state,
      magentoOrder.status
    ),
    payment_status: mapPaymentStatus(magentoOrder),
    magento_order_id: magentoIdentifier,
    metadata: {
      magento_increment_id: magentoOrder.increment_id,
      magento_status: magentoOrder.status,
      payment_method: magentoOrder.payment?.method,
    },
    created_at: magentoOrder.created_at
      ? new Date(magentoOrder.created_at)
      : new Date(),
  }

  let medusaOrder

  await manager.transaction(async (trx) => {
    medusaOrder = await orderService.withTransaction(trx).create(orderPayload)

    const items: any[] = Array.isArray(magentoOrder.items)
      ? magentoOrder.items
      : []

    for (const item of items) {
      if (item.parent_item_id) {
        continue
      }

      await lineItemService.withTransaction(trx).create({
        order_id: medusaOrder.id,
        title: item.name || item.sku || "Item",
        quantity: Math.max(1, Number(item.qty_ordered || item.qty || 1)),
        unit_price: toMinorUnits(
          item.base_price_incl_tax ?? item.base_price ?? item.price ?? 0
        ),
        metadata: {
          sku: item.sku,
          magento_item_id: item.item_id,
        },
      })
    }

    await orderService.withTransaction(trx).update(medusaOrder.id, {
      subtotal:
        toMinorUnits(
          magentoOrder.base_subtotal_incl_tax ??
            magentoOrder.base_subtotal ??
            magentoOrder.subtotal
        ) || 0,
      tax_total: toMinorUnits(magentoOrder.base_tax_amount ?? 0),
      discount_total: Math.abs(
        toMinorUnits(magentoOrder.base_discount_amount ?? 0)
      ),
      shipping_total: toMinorUnits(magentoOrder.base_shipping_amount ?? 0),
      total:
        toMinorUnits(
          magentoOrder.base_grand_total ?? magentoOrder.grand_total ?? 0
        ) || 0,
    })
  })

  return res.json({
    order_id: medusaOrder.id,
    magento_order_id: magentoIdentifier,
  })
}
