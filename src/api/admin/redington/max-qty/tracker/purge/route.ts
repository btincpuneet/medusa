import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { redingtonConfig } from "~modules/redington-config"
import {
  purgeOrderQuantityTrackerBefore,
  purgeOrderQuantityTrackerByMonths,
} from "~modules/redington-max-qty"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body || {}) as {
    months?: number | string
    before?: string
  }

  if (body.before) {
    const cutoff = new Date(body.before)
    if (Number.isNaN(cutoff.getTime())) {
      return res.status(400).json({
        message: "Invalid 'before' date provided.",
      })
    }
    const deleted = await purgeOrderQuantityTrackerBefore(cutoff)
    return res.json({ deleted, before: cutoff.toISOString() })
  }

  let months: number | null = null
  if (body.months !== undefined) {
    const parsed = Number(body.months)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return res.status(400).json({
        message: "months must be a positive number",
      })
    }
    months = parsed
  } else if (redingtonConfig.product.maxOrderDurationMonths) {
    months = redingtonConfig.product.maxOrderDurationMonths
  }

  if (!months) {
    return res.status(400).json({
      message: "No retention window provided. Pass 'months' or configure REDINGTON_PRODUCT_MAX_ORDER_DURATION.",
    })
  }

  const deleted = await purgeOrderQuantityTrackerByMonths(months)

  res.json({
    deleted,
    months,
  })
}
