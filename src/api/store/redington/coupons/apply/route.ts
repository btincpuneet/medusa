import { updateCartPromotionsWorkflowId } from "@medusajs/core-flows"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, PromotionActions } from "@medusajs/framework/utils"

import {
  ensureRedingtonAccessMappingTable,
  ensureRedingtonCouponRuleTable,
  getPgPool,
} from "../../../../../lib/pg"

type ApplyCouponBody = {
  cart_id?: string
  coupon_code?: string
  access_id?: number | string
}

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : ""

const parseNumeric = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string" && value.trim().length) {
    const parsed = Number.parseInt(value.trim(), 10)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await Promise.all([
    ensureRedingtonCouponRuleTable(),
    ensureRedingtonAccessMappingTable(),
  ])

  const body = (req.body || {}) as ApplyCouponBody

  const cartId = normalizeString(body.cart_id)
  if (!cartId) {
    return res.status(400).json({ message: "cart_id is required" })
  }

  const couponCode = normalizeString(body.coupon_code)
  if (!couponCode) {
    return res.status(400).json({ message: "coupon_code is required" })
  }

  const accessId = parseNumeric(body.access_id)
  if (!accessId) {
    return res.status(400).json({ message: "access_id is required" })
  }

  const { rows: accessRows } = await getPgPool().query(
    `
      SELECT
        id,
        company_code,
        domain_id,
        domain_extention_id
      FROM redington_access_mapping
      WHERE id = $1
      LIMIT 1
    `,
    [accessId]
  )

  const mapping = accessRows[0]
  if (!mapping) {
    return res.status(404).json({
      message: `Access mapping ${accessId} not found.`,
    })
  }

  const { rows: couponRows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_coupon_rule
      WHERE coupon_code = $1
        AND company_code = $2
        AND domain_id = $3
        AND (domain_extention_id IS NULL OR domain_extention_id = $4)
        AND is_active = TRUE
      LIMIT 1
    `,
    [
      couponCode,
      mapping.company_code,
      mapping.domain_id,
      mapping.domain_extention_id,
    ]
  )

  if (!couponRows[0]) {
    return res.status(404).json({
      message:
        "Invalid coupon code for the selected access mapping. Please verify the company and domain configuration.",
    })
  }

  const workflowEngine = req.scope.resolve(Modules.WORKFLOW_ENGINE)

  try {
    await workflowEngine.run(updateCartPromotionsWorkflowId, {
      input: {
        cart_id: cartId,
        promo_codes: [couponCode],
        action: PromotionActions.ADD,
      },
      transactionId: `redington-cart-apply-promo-${cartId}`,
    })

    return res.status(200).json({
      data: {
        success: true,
        message: "Coupon applied successfully.",
        cart_id: cartId,
        coupon_code: couponCode,
      },
    })
  } catch (error: any) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to apply coupon to the cart."

    return res.status(400).json({
      data: {
        success: false,
        message,
      },
    })
  }
}
