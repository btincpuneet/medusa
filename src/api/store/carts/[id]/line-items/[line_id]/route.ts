import {
  deleteLineItemsWorkflowId,
  updateLineItemInCartWorkflowId,
} from "@medusajs/core-flows"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { CartDTO } from "@medusajs/types"

import {
  buildValidationItemsFromCart,
  validateItemsAgainstMaxQty,
} from "../../../../../../modules/redington-max-qty"

const adjustValidationItems = (
  cart: CartDTO,
  lineId: string,
  quantity?: number
) => {
  const items = buildValidationItemsFromCart(cart)
  const cartItems = Array.isArray(cart.items) ? cart.items : []
  const targetIndex = cartItems.findIndex((item) => item.id === lineId)

  if (
    targetIndex >= 0 &&
    typeof quantity === "number" &&
    Number.isFinite(quantity)
  ) {
    items[targetIndex].quantity = quantity
  }

  return items
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const cartId = req.params.id
  const lineId = req.params.line_id

  const cartModule = req.scope.resolve(Modules.CART) as {
    retrieveCart: (id: string, config?: any) => Promise<CartDTO>
  }

  const existingCart = await cartModule.retrieveCart(cartId, {
    relations: ["items", "items.variant"],
  })

  const body = (req as any).validatedBody ?? req.body ?? {}

  const nextQuantity =
    typeof body?.quantity === "number"
      ? body.quantity
      : Number(body?.quantity)

  if (Number.isFinite(nextQuantity)) {
    const prospective = adjustValidationItems(existingCart, lineId, nextQuantity)
    const validation = await validateItemsAgainstMaxQty(prospective)
    if (!validation.valid) {
      return res.status(422).json({
        message: "Cart violates maximum quantity rules.",
        violations: validation.violations,
      })
    }
  }

  const workflowEngine = req.scope.resolve(Modules.WORKFLOW_ENGINE)
  await workflowEngine.run(updateLineItemInCartWorkflowId, {
    input: {
      cart_id: cartId,
      item_id: lineId,
      update: body,
      additional_data: (body as any).additional_data,
    },
    transactionId: `cart-update-item-${cartId}`,
  })

  const updatedCart = await cartModule.retrieveCart(cartId, {
    relations: ["items", "items.variant"],
  })

  res.status(200).json({ cart: updatedCart })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const cartId = req.params.id
  const lineId = req.params.line_id

  const workflowEngine = req.scope.resolve(Modules.WORKFLOW_ENGINE)
  await workflowEngine.run(deleteLineItemsWorkflowId, {
    input: {
      cart_id: cartId,
      ids: [lineId],
    },
    transactionId: `cart-delete-item-${cartId}`,
  })

  const cartModule = req.scope.resolve(Modules.CART) as {
    retrieveCart: (id: string, config?: any) => Promise<CartDTO>
  }

  const updatedCart = await cartModule.retrieveCart(cartId, {
    relations: ["items", "items.variant"],
  })

  res.status(200).json({
    id: lineId,
    object: "line-item",
    deleted: true,
    parent: updatedCart,
  })
}
