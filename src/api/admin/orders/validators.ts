import { z } from "zod"

import { AddressPayload } from "@medusajs/medusa/api/utils/common-validators"
import {
  createFindParams,
  createOperatorMap,
} from "@medusajs/medusa/api/utils/validators"

export {
  AdminGetOrdersOrderParams,
  AdminGetOrdersOrderItemsParams,
  AdminGetOrderShippingOptionList,
  AdminCompleteOrder,
  AdminOrderCreateFulfillment,
  OrderCreateFulfillment,
  AdminOrderCreateShipment,
  OrderCreateShipment,
  OrderCancelFulfillment,
  AdminOrderCancelFulfillment,
  AdminOrderChangesParams,
  AdminMarkOrderFulfillmentDelivered,
  AdminTransferOrder,
  AdminCancelOrderTransferRequest,
  AdminCreateOrderCreditLines,
} from "@medusajs/medusa/api/admin/orders/validators"

/**
 * Parameters used to filter and configure the pagination of the retrieved order.
 */
export const AdminGetOrdersParams = createFindParams({
  limit: 15,
  offset: 0,
}).merge(
  z.object({
    id: z
      .union([z.string(), z.array(z.string()), createOperatorMap()])
      .optional(),
    status: z
      .union([z.string(), z.array(z.string()), createOperatorMap()])
      .optional(),
    name: z.union([z.string(), z.array(z.string())]).optional(),
    sales_channel_id: z.array(z.string()).optional(),
    region_id: z.union([z.string(), z.array(z.string())]).optional(),
    customer_id: z.union([z.string(), z.array(z.string())]).optional(),
    q: z.string().optional(),
    magento_order_id: z
      .union([z.string(), z.array(z.string()), createOperatorMap()])
      .optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

export const AdminUpdateOrder = z.object({
  email: z.string().optional(),
  shipping_address: AddressPayload.optional(),
  billing_address: AddressPayload.optional(),
  metadata: z.record(z.unknown()).nullish(),
  magento_order_id: z.union([z.string(), z.null()]).optional(),
})
