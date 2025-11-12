import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  listOrderReturnsByEmail,
  mapOrderReturnRow,
} from "../../../../lib/pg"
import { getPgPool } from "../../../../lib/pg"

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

const buildImageMap = async (returns: ReturnViewRow[]) => {
  const orderIds = Array.from(
    new Set(
      returns
        .map((r) => r.order_id)
        .filter((id): id is string => typeof id === "string" && id.length)
    )
  )

  if (!orderIds.length) {
    return new Map<string, string | null>()
  }

  const { rows } = await getPgPool().query(
    `
      SELECT
        oi.order_id,
        COALESCE(oli.variant_sku, oli.product_id, oli.id::text) AS sku,
        oli.thumbnail
      FROM order_item oi
      INNER JOIN order_line_item oli
        ON oi.item_id = oli.id
      WHERE oi.order_id = ANY($1::text[])
        AND oi.deleted_at IS NULL
        AND oli.deleted_at IS NULL
    `,
    [orderIds]
  )

  const map = new Map<string, string | null>()
  for (const row of rows) {
    const key = `${row.order_id}::${row.sku}`
    map.set(key, typeof row.thumbnail === "string" ? row.thumbnail : null)
  }
  return map
}

type ReturnViewRow = ReturnType<typeof mapOrderReturnRow>

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const email =
    (req.query.customer_email ||
      req.query.email ||
      req.query.user_email ||
      "")?.toString().trim() ?? ""

  if (!email.length) {
    return res.status(400).json({ message: "customer_email is required" })
  }

  try {
    const returns = await listOrderReturnsByEmail(email)
    if (!returns.length) {
      return res.json([])
    }

    const imageMap = await buildImageMap(returns)

    const payload = returns.map((entry) => {
      const key = `${entry.order_id}::${entry.sku}`
      return {
        id: entry.id,
        order_id: entry.order_id,
        user_name: entry.user_name,
        user_email: entry.user_email,
        sku: entry.sku,
        product_name: entry.product_name,
        qty: entry.qty,
        price: entry.price,
        order_status: entry.order_status,
        return_status: entry.return_status,
        remarks: entry.remarks,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        image: imageMap.get(key) ?? null,
      }
    })

    return res.json(payload)
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to load return requests.",
    })
  }
}
