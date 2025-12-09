"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUpdateOrder = exports.AdminGetOrdersParams = exports.AdminCreateOrderCreditLines = exports.AdminCancelOrderTransferRequest = exports.AdminTransferOrder = exports.AdminMarkOrderFulfillmentDelivered = exports.AdminOrderChangesParams = exports.AdminOrderCancelFulfillment = exports.OrderCancelFulfillment = exports.OrderCreateShipment = exports.AdminOrderCreateShipment = exports.OrderCreateFulfillment = exports.AdminOrderCreateFulfillment = exports.AdminCompleteOrder = exports.AdminGetOrderShippingOptionList = exports.AdminGetOrdersOrderItemsParams = exports.AdminGetOrdersOrderParams = void 0;
const zod_1 = require("zod");
const validators_1 = require("@medusajs/medusa/api/utils/validators");
var validators_2 = require("@medusajs/medusa/api/admin/orders/validators");
Object.defineProperty(exports, "AdminGetOrdersOrderParams", { enumerable: true, get: function () { return validators_2.AdminGetOrdersOrderParams; } });
Object.defineProperty(exports, "AdminGetOrdersOrderItemsParams", { enumerable: true, get: function () { return validators_2.AdminGetOrdersOrderItemsParams; } });
Object.defineProperty(exports, "AdminGetOrderShippingOptionList", { enumerable: true, get: function () { return validators_2.AdminGetOrderShippingOptionList; } });
Object.defineProperty(exports, "AdminCompleteOrder", { enumerable: true, get: function () { return validators_2.AdminCompleteOrder; } });
Object.defineProperty(exports, "AdminOrderCreateFulfillment", { enumerable: true, get: function () { return validators_2.AdminOrderCreateFulfillment; } });
Object.defineProperty(exports, "OrderCreateFulfillment", { enumerable: true, get: function () { return validators_2.OrderCreateFulfillment; } });
Object.defineProperty(exports, "AdminOrderCreateShipment", { enumerable: true, get: function () { return validators_2.AdminOrderCreateShipment; } });
Object.defineProperty(exports, "OrderCreateShipment", { enumerable: true, get: function () { return validators_2.OrderCreateShipment; } });
Object.defineProperty(exports, "OrderCancelFulfillment", { enumerable: true, get: function () { return validators_2.OrderCancelFulfillment; } });
Object.defineProperty(exports, "AdminOrderCancelFulfillment", { enumerable: true, get: function () { return validators_2.AdminOrderCancelFulfillment; } });
Object.defineProperty(exports, "AdminOrderChangesParams", { enumerable: true, get: function () { return validators_2.AdminOrderChangesParams; } });
Object.defineProperty(exports, "AdminMarkOrderFulfillmentDelivered", { enumerable: true, get: function () { return validators_2.AdminMarkOrderFulfillmentDelivered; } });
Object.defineProperty(exports, "AdminTransferOrder", { enumerable: true, get: function () { return validators_2.AdminTransferOrder; } });
Object.defineProperty(exports, "AdminCancelOrderTransferRequest", { enumerable: true, get: function () { return validators_2.AdminCancelOrderTransferRequest; } });
Object.defineProperty(exports, "AdminCreateOrderCreditLines", { enumerable: true, get: function () { return validators_2.AdminCreateOrderCreditLines; } });
/**
 * Parameters used to filter and configure the pagination of the retrieved order.
 */
exports.AdminGetOrdersParams = (0, validators_1.createFindParams)({
    limit: 15,
    offset: 0,
}).merge(zod_1.z.object({
    id: zod_1.z
        .union([zod_1.z.string(), zod_1.z.array(zod_1.z.string()), (0, validators_1.createOperatorMap)()])
        .optional(),
    status: zod_1.z
        .union([zod_1.z.string(), zod_1.z.array(zod_1.z.string()), (0, validators_1.createOperatorMap)()])
        .optional(),
    name: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]).optional(),
    sales_channel_id: zod_1.z.array(zod_1.z.string()).optional(),
    region_id: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]).optional(),
    customer_id: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]).optional(),
    q: zod_1.z.string().optional(),
    magento_order_id: zod_1.z
        .union([zod_1.z.string(), zod_1.z.array(zod_1.z.string()), (0, validators_1.createOperatorMap)()])
        .optional(),
    created_at: (0, validators_1.createOperatorMap)().optional(),
    updated_at: (0, validators_1.createOperatorMap)().optional(),
}));
exports.AdminUpdateOrder = zod_1.z.object({
    email: zod_1.z.string().optional(),
    shipping_address: zod_1.z.any().optional(),
    billing_address: zod_1.z.any().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).nullish(),
    magento_order_id: zod_1.z.union([zod_1.z.string(), zod_1.z.null()]).optional(),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9hcGkvYWRtaW4vb3JkZXJzL3ZhbGlkYXRvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkJBQXVCO0FBRXZCLHNFQUc4QztBQUU5QywyRUFnQnFEO0FBZm5ELHVIQUFBLHlCQUF5QixPQUFBO0FBQ3pCLDRIQUFBLDhCQUE4QixPQUFBO0FBQzlCLDZIQUFBLCtCQUErQixPQUFBO0FBQy9CLGdIQUFBLGtCQUFrQixPQUFBO0FBQ2xCLHlIQUFBLDJCQUEyQixPQUFBO0FBQzNCLG9IQUFBLHNCQUFzQixPQUFBO0FBQ3RCLHNIQUFBLHdCQUF3QixPQUFBO0FBQ3hCLGlIQUFBLG1CQUFtQixPQUFBO0FBQ25CLG9IQUFBLHNCQUFzQixPQUFBO0FBQ3RCLHlIQUFBLDJCQUEyQixPQUFBO0FBQzNCLHFIQUFBLHVCQUF1QixPQUFBO0FBQ3ZCLGdJQUFBLGtDQUFrQyxPQUFBO0FBQ2xDLGdIQUFBLGtCQUFrQixPQUFBO0FBQ2xCLDZIQUFBLCtCQUErQixPQUFBO0FBQy9CLHlIQUFBLDJCQUEyQixPQUFBO0FBRzdCOztHQUVHO0FBQ1UsUUFBQSxvQkFBb0IsR0FBRyxJQUFBLDZCQUFnQixFQUFDO0lBQ25ELEtBQUssRUFBRSxFQUFFO0lBQ1QsTUFBTSxFQUFFLENBQUM7Q0FDVixDQUFDLENBQUMsS0FBSyxDQUNOLE9BQUMsQ0FBQyxNQUFNLENBQUM7SUFDUCxFQUFFLEVBQUUsT0FBQztTQUNGLEtBQUssQ0FBQyxDQUFDLE9BQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxPQUFDLENBQUMsS0FBSyxDQUFDLE9BQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLElBQUEsOEJBQWlCLEdBQUUsQ0FBQyxDQUFDO1NBQzdELFFBQVEsRUFBRTtJQUNiLE1BQU0sRUFBRSxPQUFDO1NBQ04sS0FBSyxDQUFDLENBQUMsT0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLE9BQUMsQ0FBQyxLQUFLLENBQUMsT0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsSUFBQSw4QkFBaUIsR0FBRSxDQUFDLENBQUM7U0FDN0QsUUFBUSxFQUFFO0lBQ2IsSUFBSSxFQUFFLE9BQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsT0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFO0lBQzNELGdCQUFnQixFQUFFLE9BQUMsQ0FBQyxLQUFLLENBQUMsT0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFO0lBQ2hELFNBQVMsRUFBRSxPQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLE9BQUMsQ0FBQyxLQUFLLENBQUMsT0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRTtJQUNoRSxXQUFXLEVBQUUsT0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxPQUFDLENBQUMsS0FBSyxDQUFDLE9BQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUU7SUFDbEUsQ0FBQyxFQUFFLE9BQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDeEIsZ0JBQWdCLEVBQUUsT0FBQztTQUNoQixLQUFLLENBQUMsQ0FBQyxPQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsT0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFBLDhCQUFpQixHQUFFLENBQUMsQ0FBQztTQUM3RCxRQUFRLEVBQUU7SUFDYixVQUFVLEVBQUUsSUFBQSw4QkFBaUIsR0FBRSxDQUFDLFFBQVEsRUFBRTtJQUMxQyxVQUFVLEVBQUUsSUFBQSw4QkFBaUIsR0FBRSxDQUFDLFFBQVEsRUFBRTtDQUMzQyxDQUFDLENBQ0gsQ0FBQTtBQUVZLFFBQUEsZ0JBQWdCLEdBQUcsT0FBQyxDQUFDLE1BQU0sQ0FBQztJQUN2QyxLQUFLLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUM1QixnQkFBZ0IsRUFBRSxPQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQ3BDLGVBQWUsRUFBRSxPQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQ25DLFFBQVEsRUFBRSxPQUFDLENBQUMsTUFBTSxDQUFDLE9BQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLE9BQU8sRUFBRTtJQUN6QyxnQkFBZ0IsRUFBRSxPQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLE9BQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFO0NBQzdELENBQUMsQ0FBQSJ9