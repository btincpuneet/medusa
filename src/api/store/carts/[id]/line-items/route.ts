import { addToCartWorkflowId } from "@medusajs/core-flows"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { CartDTO } from "@medusajs/types"

import {
  buildValidationItemFromPayload,
  buildValidationItemsFromCart,
  mergeValidationItems,
  validateItemsAgainstMaxQty,
  type MaxQtyValidateItem,
} from "../../../../../modules/redington-max-qty"

const buildProspectiveItems = (
  cart: CartDTO,
  incoming: MaxQtyValidateItem | null
): MaxQtyValidateItem[] => {
  const base = buildValidationItemsFromCart(cart)
  if (!incoming) {
    return base
  }

  return mergeValidationItems(base, [incoming])
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const cartId = req.params.id

  const cartModule = req.scope.resolve(Modules.CART) as {
    retrieveCart: (id: string, config?: any) => Promise<CartDTO>
  }

  const existingCart = await cartModule.retrieveCart(cartId, {
    relations: ["items", "items.variant"],
  })

  const body = (req as any).validatedBody ?? req.body ?? {}

  const incomingItem = buildValidationItemFromPayload(body)

  if (incomingItem) {
    const prospectiveItems = buildProspectiveItems(existingCart, incomingItem)
    const validation = await validateItemsAgainstMaxQty(prospectiveItems)
    if (!validation.valid) {
      return res.status(422).json({
        message: "Cart violates maximum quantity rules.",
        violations: validation.violations,
      })
    }
  }

  const workflowEngine = req.scope.resolve(Modules.WORKFLOW_ENGINE)

  await workflowEngine.run(addToCartWorkflowId, {
    input: {
      cart_id: cartId,
      items: [body],
      additional_data: (body as any).additional_data,
    },
    transactionId: `cart-add-item-${cartId}`,
  })

  const updatedCart = await cartModule.retrieveCart(cartId, {
    relations: ["items", "items.variant"],
  })

  res.status(200).json({ cart: updatedCart })
}
