import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonSubscriptionCodeTable,
  getPgPool,
} from "../../../../../lib/pg"

type BulkBody = {
  ids?: Array<number | string>
  action?: "enable" | "disable" | "delete" | string
}

const normalizeIds = (input: BulkBody["ids"]) => {
  const unique = new Set<number>()

  if (Array.isArray(input)) {
    for (const value of input) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) {
        unique.add(parsed)
      }
    }
  }

  return Array.from(unique.values())
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonSubscriptionCodeTable()

  const body = (req.body || {}) as BulkBody
  const ids = normalizeIds(body.ids)

  if (!ids.length) {
    return res.status(400).json({ message: "ids array is required" })
  }

  const action = (body.action || "").toLowerCase()

  if (!["enable", "disable", "delete"].includes(action)) {
    return res.status(400).json({
      message: "action must be one of enable, disable, or delete",
    })
  }

  if (action === "delete") {
    const result = await getPgPool().query(
      `
        DELETE FROM redington_subscription_code
        WHERE id = ANY($1::int[])
      `,
      [ids]
    )

    return res.json({ deleted: result.rowCount || 0 })
  }

  const nextStatus = action === "enable"

  const result = await getPgPool().query(
    `
      UPDATE redington_subscription_code
      SET status = $1, updated_at = NOW()
      WHERE id = ANY($2::int[])
    `,
    [nextStatus, ids]
  )

  return res.json({ updated: result.rowCount || 0, status: nextStatus })
}
