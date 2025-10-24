import { updateCartPromotionsWorkflowId } from "@medusajs/core-flows"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, PromotionActions } from "@medusajs/framework/utils"

type RemoveCouponBody = {
  cart_id?: string
  coupon_code?: string
}

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : ""

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as RemoveCouponBody

  const cartId = normalizeString(body.cart_id)
  if (!cartId) {
    return res.status(400).json({ message: "cart_id is required" })
  }

  const couponCode = normalizeString(body.coupon_code)
  if (!couponCode) {
    return res.status(400).json({ message: "coupon_code is required" })
  }

  const workflowEngine = req.scope.resolve(Modules.WORKFLOW_ENGINE)

  try {
    await workflowEngine.run(updateCartPromotionsWorkflowId, {
      input: {
        cart_id: cartId,
        promo_codes: [couponCode],
        action: PromotionActions.REMOVE,
      },
      transactionId: `redington-cart-remove-promo-${cartId}`,
    })

    return res.status(200).json({
      data: {
        success: true,
        message: "Coupon removed successfully.",
        cart_id: cartId,
        coupon_code: couponCode,
      },
    })
  } catch (error: any) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to remove coupon from the cart."

    return res.status(400).json({
      data: {
        success: false,
        message,
      },
    })
  }
}
