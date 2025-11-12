import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { getPgPool } from "../../../../../lib/pg"

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

const formatDateTime = (value: Date | string | null | undefined) => {
  const date =
    value instanceof Date
      ? value
      : (() => {
          if (!value) {
            return new Date()
          }
          const parsed = new Date(value)
          return Number.isNaN(parsed.getTime()) ? new Date() : parsed
        })()

  const iso = date.toISOString()
  return iso.replace("T", " ").slice(0, 19)
}

const toMajorUnits = (value: any) => {
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount)) {
    return 0
  }
  return Number((amount / 100).toFixed(2))
}

const mapOrderRow = (
  row: any,
  totals: {
    subtotal: number
    shipping: number
    tax: number
    discount: number
    grand: number
  }
) => {
  const metadata =
    row && typeof row.metadata === "object" && row.metadata !== null
      ? row.metadata
      : {}

  return {
    entity_id: row.id,
    increment_id:
      metadata.magento_increment_id ?? row.display_id ?? row.id ?? "",
    state: row.status ?? "pending",
    status: row.status ?? "pending",
    created_at: formatDateTime(row.created_at),
    grand_total: toMajorUnits(totals.grand),
    subtotal: toMajorUnits(totals.subtotal),
    shipping_amount: toMajorUnits(totals.shipping),
    tax_amount: toMajorUnits(totals.tax),
    discount_amount: toMajorUnits(totals.discount) * -1,
    customer_email: row.email,
    billing_address: row.billing_address,
    payment: {
      method: metadata.payment?.method ?? "manual",
      additional_information: [],
    },
  }
}

const mapItems = (rows: any[]) => {
  const grouped = new Map<
    string,
    { items: any[]; subtotal: number }
  >()
  for (const row of rows) {
    const key = row.order_id
    if (!grouped.has(key)) {
      grouped.set(key, { items: [], subtotal: 0 })
    }
    const qty = Number(row.quantity ?? 0)
    const unitPrice = Number(row.unit_price ?? 0)
    const rowTotal = qty * unitPrice

    grouped.get(key)!.items.push({
      item_id: row.line_item_id,
      sku: row.sku,
      name: row.title,
      qty_ordered: qty,
      price: toMajorUnits(unitPrice),
      price_incl_tax: toMajorUnits(unitPrice),
      row_total: toMajorUnits(rowTotal),
      row_total_incl_tax: toMajorUnits(rowTotal),
    })
    grouped.get(key)!.subtotal += rowTotal
  }
  return grouped
}

const toMinorNumber = (value: any): number | null => {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

const buildTotals = (
  row: any,
  computedSubtotal: number
): {
  subtotal: number
  shipping: number
  tax: number
  discount: number
  grand: number
} => {
  const metadata =
    row && typeof row.metadata === "object" && row.metadata !== null
      ? row.metadata
      : {}
  const metadataTotals = metadata.totals || {}
  const summaryTotals =
    row && typeof row.summary_totals === "object" && row.summary_totals !== null
      ? row.summary_totals
      : {}

  const subtotal =
    toMinorNumber(metadataTotals.subtotal) ?? computedSubtotal ?? 0
  const shipping = toMinorNumber(metadataTotals.shipping_total) ?? 0
  const tax = toMinorNumber(metadataTotals.tax_total) ?? 0
  const discount = toMinorNumber(metadataTotals.discount_total) ?? 0
  const grand =
    toMinorNumber(metadataTotals.grand_total) ??
    toMinorNumber(summaryTotals.current_order_total) ??
    subtotal + shipping + tax - discount

  return {
    subtotal,
    shipping,
    tax,
    discount,
    grand,
  }
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const customerEmail =
    (req.query.customer_email ||
      req.query.customerEmail ||
      req.query.email) as string | undefined

  if (!customerEmail || !customerEmail.trim().length) {
    return res.status(400).json({
      message: "customer_email query parameter is required",
    })
  }

  const pool = getPgPool()

  const { rows: orderRows } = await pool.query(
    `
      SELECT
        o.id,
        o.display_id,
        o.email,
        o.status,
        o.created_at,
        o.metadata,
        o.currency_code,
        summary.totals AS summary_totals
      FROM "order" o
      LEFT JOIN LATERAL (
        SELECT totals
        FROM order_summary os
        WHERE os.order_id = o.id
          AND os.deleted_at IS NULL
        ORDER BY os.version DESC
        LIMIT 1
      ) summary ON TRUE
      WHERE o.deleted_at IS NULL
        AND LOWER(o.email) = LOWER($1)
      ORDER BY o.created_at DESC
    `,
    [customerEmail.trim()]
  )

  if (!orderRows.length) {
    return res.json({
      items: [],
      total_count: 0,
    })
  }

  const orderIds = orderRows.map((row) => row.id)

  const { rows: itemRows } = await pool.query(
    `
      SELECT
        oi.order_id,
        oli.id AS line_item_id,
        oli.title,
        COALESCE(oli.variant_sku, oli.product_id, oli.id) AS sku,
        oi.quantity,
        oli.unit_price
      FROM order_item oi
      INNER JOIN order_line_item oli
        ON oi.item_id = oli.id
      WHERE oi.deleted_at IS NULL
        AND oi.order_id = ANY($1::text[])
        AND oli.deleted_at IS NULL
    `,
    [orderIds]
  )

  const itemMap = mapItems(itemRows)

  const items = orderRows.map((row) => {
    const summary = itemMap.get(row.id) ?? { items: [], subtotal: 0 }
    const totals = buildTotals(row, summary.subtotal ?? 0)

    return {
      ...mapOrderRow(
        {
          id: row.id,
          display_id: row.display_id,
          status: row.status,
          created_at: row.created_at,
          email: row.email,
          billing_address: null,
          metadata: row.metadata,
        },
        totals
      ),
      items: summary.items,
    }
  })

  return res.json({
    items,
    total_count: items.length,
  })
}
