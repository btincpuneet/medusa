import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { adminFetch } from "../utils/admin-client"
import { requireCustomerSession } from "../utils/session"
import { sendErrorResponse } from "../utils/respond"

const DEFAULT_LIMIT = Number(process.env.REDINGTON_ORDERS_LIMIT || 20)
const MAX_LIMIT = Number(process.env.REDINGTON_ORDERS_MAX_LIMIT || 100)

type AdminCustomer = {
  id: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
}

type AdminAddress = {
  first_name?: string | null
  last_name?: string | null
}

type AdminOrder = {
  id: string
  display_id?: number | string | null
  created_at?: string
  email?: string | null
  customer?: AdminCustomer | null
  shipping_address?: AdminAddress | null
  billing_address?: AdminAddress | null
  total?: number | null
  subtotal?: number | null
  paid_total?: number | null
  payment_status?: string | null
  fulfillment_status?: string | null
  metadata?: Record<string, any>
}

const pickQueryValue = (
  query: MedusaRequest["query"],
  keys: string | string[]
): string | undefined => {
  const lookup = Array.isArray(keys) ? keys : [keys]
  for (const key of lookup) {
    const value = (query as Record<string, unknown> | undefined)?.[key]
    if (value === undefined || value === null) {
      continue
    }
    if (Array.isArray(value)) {
      const candidate = value[0]
      if (candidate !== undefined && candidate !== null) {
        return String(candidate)
      }
      continue
    }
    if (typeof value === "string") {
      if (value.trim().length === 0) {
        continue
      }
      return value
    }
    return String(value)
  }
  return undefined
}

const parseNumberParam = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return fallback
  }
  return parsed
}

const getOrderEmail = (order: AdminOrder) => {
  return (
    order.customer?.email ||
    order.email ||
    order.metadata?.customer_email ||
    order.metadata?.magento_customer_email ||
    ""
  ).trim()
}

const getCustomerName = (order: AdminOrder) => {
  const nameFromCustomer = `${order.customer?.first_name || ""} ${
    order.customer?.last_name || ""
  }`.trim()
  if (nameFromCustomer) {
    return nameFromCustomer
  }

  const nameFromShipping = `${order.shipping_address?.first_name || ""} ${
    order.shipping_address?.last_name || ""
  }`.trim()
  if (nameFromShipping) {
    return nameFromShipping
  }

  const nameFromBilling = `${order.billing_address?.first_name || ""} ${
    order.billing_address?.last_name || ""
  }`.trim()
  if (nameFromBilling) {
    return nameFromBilling
  }

  return ""
}

const resolveTotal = (order: AdminOrder) => {
  if (typeof order.total === "number") {
    return order.total
  }
  if (typeof order.paid_total === "number") {
    return order.paid_total
  }
  if (typeof order.subtotal === "number") {
    return order.subtotal
  }
  return null
}

const simplifyOrder = (order: AdminOrder) => {
  const metadata = order.metadata || {}
  return {
    id: order.id,
    display_id: order.display_id ?? null,
    magento_order_id:
      metadata.magento_order_id ||
      metadata.legacy_order_id ||
      metadata.increment_id ||
      null,
    created_at: order.created_at || null,
    customer_name: getCustomerName(order) || null,
    customer_email: getOrderEmail(order) || null,
    total: resolveTotal(order),
    payment_status: order.payment_status || "pending",
    fulfillment_status: order.fulfillment_status || "not_fulfilled",
    metadata,
  }
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const session = requireCustomerSession(req)

    const limitParam = pickQueryValue(req.query, "limit")
    const offsetParam = pickQueryValue(req.query, "offset")

    const limit = Math.min(
      Math.max(parseNumberParam(limitParam, DEFAULT_LIMIT), 1),
      MAX_LIMIT
    )
    const offset = Math.max(parseNumberParam(offsetParam, 0), 0)

    const forwarded = new URLSearchParams()
    forwarded.set("limit", limit.toString())
    forwarded.set("offset", offset.toString())
    forwarded.set("expand", "customer,shipping_address,billing_address")

    const adminPath = `/admin/orders?${forwarded.toString()}`
    const response = await adminFetch<{
      orders?: AdminOrder[]
      count?: number
      offset?: number
      limit?: number
    }>(adminPath)

    const orders = Array.isArray(response?.orders) ? response.orders : []

    const requestedEmail =
      pickQueryValue(req.query, ["customer_email", "email"])?.trim().toLowerCase() ||
      session.email.toLowerCase()

    const filtered = orders.filter((order) => {
      if (!requestedEmail) {
        return true
      }
      const normalizedEmail = getOrderEmail(order).toLowerCase()
      return normalizedEmail === requestedEmail
    })

    const simplified = filtered.map(simplifyOrder)

    return res.json({
      items: simplified,
      count: simplified.length,
      limit,
      offset,
    })
  } catch (error) {
    return sendErrorResponse(res, error, "Unable to load orders.")
  }
}
