import { getPgPool } from "../../../../lib/pg"

export const toMajorUnits = (value: any) => {
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount)) {
    return 0
  }
  return Number((amount / 100).toFixed(2))
}

export const normalizeSku = (value: any, fallback: string) => {
  if (typeof value === "string" && value.trim().length) {
    return value.trim()
  }
  return fallback
}

export const fetchOrderContext = async (orderId: string, email: string) => {
  const pool = getPgPool()

  const { rows: orderRows } = await pool.query(
    `
      SELECT id, email, status, billing_address_id, shipping_address_id
      FROM "order"
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [orderId]
  )

  const order = orderRows[0]
  if (!order) {
    throw {
      status: 404,
      message: "Order not found.",
    }
  }

  if (order.email && order.email.toLowerCase() !== email.toLowerCase()) {
    throw {
      status: 403,
      message: "Order does not belong to the supplied customer.",
    }
  }

  const { rows: itemRows } = await pool.query(
    `
      SELECT
        oi.order_id,
        oi.quantity,
        oli.id as line_item_id,
        oli.title,
        oli.thumbnail,
        oli.unit_price,
        COALESCE(oli.variant_sku, oli.product_id, oli.id::text) AS sku
      FROM order_item oi
      INNER JOIN order_line_item oli
        ON oi.item_id = oli.id
      WHERE oi.order_id = $1
        AND oi.deleted_at IS NULL
        AND oli.deleted_at IS NULL
      ORDER BY oli.title ASC, oli.id ASC
    `,
    [orderId]
  )

  let customerName: string | null = null
  const addressId = order.billing_address_id ?? order.shipping_address_id
  if (addressId) {
    const { rows: addressRows } = await pool.query(
      `
        SELECT first_name, last_name
        FROM order_address
        WHERE id = $1
        LIMIT 1
      `,
      [addressId]
    )
    if (addressRows[0]) {
      customerName = `${addressRows[0].first_name ?? ""} ${
        addressRows[0].last_name ?? ""
      }`.trim()
    }
  }

  return {
    order,
    items: itemRows,
    customerName: customerName && customerName.length ? customerName : order.email,
  }
}

export const buildReturnSummary = async (
  orderId: string,
  email: string
): Promise<Map<string, { qty: number; last_returned_at: string | null }>> => {
  const pool = getPgPool()
  const { rows } = await pool.query(
    `
      SELECT
        sku,
        SUM(qty) AS returned_qty,
        MAX(created_at) AS last_returned_at
      FROM redington_order_return
      WHERE order_id = $1
        AND LOWER(user_email) = LOWER($2)
      GROUP BY sku
    `,
    [orderId, email]
  )

  const summary = new Map<string, { qty: number; last_returned_at: string | null }>()
  rows.forEach((row) => {
    const qty = Number(row.returned_qty ?? 0)
    summary.set(row.sku, {
      qty: Number.isFinite(qty) ? qty : 0,
      last_returned_at:
        row.last_returned_at instanceof Date
          ? row.last_returned_at.toISOString()
          : row.last_returned_at ?? null,
    })
  })
  return summary
}
