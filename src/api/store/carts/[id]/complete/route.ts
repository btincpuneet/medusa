import { completeCartWorkflow } from "@medusajs/core-flows"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import type { CartDTO } from "@medusajs/types"

import {
  buildValidationItemsFromCart,
  validateItemsAgainstMaxQty,
  upsertOrderQuantityTracker,
} from "../../../../../modules/redington-max-qty"

const fetchCartForValidation = async (
  scope: MedusaRequest["scope"],
  cartId: string
): Promise<CartDTO> => {
  const cartModule = scope.resolve(Modules.CART) as {
    retrieveCart: (id: string, config?: any) => Promise<CartDTO>
  }

  return cartModule.retrieveCart(cartId, {
    relations: ["items", "items.variant"],
  })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const cartId = req.params.id

  const cart = await fetchCartForValidation(req.scope, cartId)
  const validationItems = buildValidationItemsFromCart(cart)
  const validation = await validateItemsAgainstMaxQty(validationItems)

  if (!validation.valid) {
    return res.status(422).json({
      message: "Cart violates maximum quantity rules.",
      violations: validation.violations,
    })
  }

  const { errors, result } = await completeCartWorkflow(req.scope).run({
    input: { id: cartId },
    context: { transactionId: cartId },
    throwOnError: false,
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  if (errors?.[0]) {
    const error = errors[0].error
    const statusOKErrors = [
      MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
      MedusaError.Types.PAYMENT_REQUIRES_MORE_ERROR,
    ]

    const currentCart = await fetchCartForValidation(req.scope, cartId)

    if (!statusOKErrors.includes(error.type)) {
      throw error
    }

    return res.status(200).json({
      type: "cart",
      cart: currentCart,
      error: {
        message: error.message,
        name: error.name,
        type: error.type,
      },
    })
  }

  const { data } = await query.graph({
    entity: "order",
    fields: req.queryConfig.fields,
    filters: { id: result.id },
  })

  const orderRecord = data[0]
  const orderInfo = (orderRecord ?? {}) as any

  const rawCustomerId =
    cart?.customer_id ??
    cart?.metadata?.magento_customer_id ??
    cart?.metadata?.customer_id ??
    null

  const numericCustomerId = Number(rawCustomerId)
  if (Number.isFinite(numericCustomerId) && Array.isArray(cart?.items)) {
    const orderIncrementId =
      orderInfo.display_id ??
      orderInfo.order_number ??
      orderInfo.order_no ??
      orderInfo.id ??
      result.id

    for (const [index, lineItem] of cart.items.entries()) {
      const validationItem = validationItems[index]
      if (!validationItem) {
        continue
      }
      await upsertOrderQuantityTracker({
        customer_id: numericCustomerId,
        order_increment_id: String(orderIncrementId),
        sku: validationItem.sku,
        quantity: Number(lineItem.quantity ?? validationItem.quantity ?? 0),
        brand_id: validationItem.brand_id ?? null,
      })
    }
  }

  res.status(200).json({
    type: "order",
    order: orderRecord,
  })
}
