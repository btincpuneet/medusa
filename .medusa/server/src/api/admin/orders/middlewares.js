"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOrderRoutesMiddlewares = void 0;
const framework_1 = require("@medusajs/framework");
const QueryConfig = __importStar(require("./query-config"));
const validators_1 = require("./validators");
exports.adminOrderRoutesMiddlewares = [
    {
        method: ["GET"],
        matcher: "/admin/orders",
        middlewares: [
            (0, framework_1.validateAndTransformQuery)(validators_1.AdminGetOrdersParams, QueryConfig.listTransformQueryConfig),
        ],
    },
    {
        method: ["GET"],
        matcher: "/admin/orders/:id",
        middlewares: [
            (0, framework_1.validateAndTransformQuery)(validators_1.AdminGetOrdersOrderParams, QueryConfig.retrieveTransformQueryConfig),
        ],
    },
    {
        method: ["POST"],
        matcher: "/admin/orders/:id",
        middlewares: [
            (0, framework_1.validateAndTransformBody)(validators_1.AdminUpdateOrder),
            (0, framework_1.validateAndTransformQuery)(validators_1.AdminGetOrdersOrderParams, QueryConfig.retrieveTransformQueryConfig),
        ],
    },
    {
        method: ["GET"],
        matcher: "/admin/orders/:id/line-items",
        middlewares: [
            (0, framework_1.validateAndTransformQuery)(validators_1.AdminGetOrdersOrderItemsParams, QueryConfig.listOrderItemsQueryConfig),
        ],
    },
    {
        method: ["GET"],
        matcher: "/admin/orders/:id/shipping-options",
        middlewares: [
            (0, framework_1.validateAndTransformQuery)(validators_1.AdminGetOrderShippingOptionList, QueryConfig.listShippingOptionsQueryConfig),
        ],
    },
    {
        method: ["GET"],
        matcher: "/admin/orders/:id/changes",
        middlewares: [
            (0, framework_1.validateAndTransformQuery)(validators_1.AdminOrderChangesParams, QueryConfig.retrieveOrderChangesTransformQueryConfig),
        ],
    },
    {
        method: ["GET"],
        matcher: "/admin/orders/:id/preview",
        middlewares: [
            (0, framework_1.validateAndTransformQuery)(validators_1.AdminGetOrdersOrderParams, QueryConfig.retrieveTransformQueryConfig),
        ],
    },
    {
        method: ["POST"],
        matcher: "/admin/orders/:id/archive",
        middlewares: [
            (0, framework_1.validateAndTransformQuery)(validators_1.AdminGetOrdersOrderParams, QueryConfig.retrieveTransformQueryConfig),
        ],
    },
    {
        method: ["POST"],
        matcher: "/admin/orders/:id/cancel",
        middlewares: [
            (0, framework_1.validateAndTransformQuery)(validators_1.AdminGetOrdersOrderParams, QueryConfig.retrieveTransformQueryConfig),
        ],
    },
    {
        method: ["POST"],
        matcher: "/admin/orders/:id/complete",
        middlewares: [
            (0, framework_1.validateAndTransformBody)(validators_1.AdminCompleteOrder),
            (0, framework_1.validateAndTransformQuery)(validators_1.AdminGetOrdersOrderParams, QueryConfig.retrieveTransformQueryConfig),
        ],
    },
    {
        method: ["POST"],
        matcher: "/admin/orders/:id/credit-lines",
        middlewares: [
            (0, framework_1.validateAndTransformBody)(validators_1.AdminCreateOrderCreditLines),
            (0, framework_1.validateAndTransformQuery)(validators_1.AdminGetOrdersOrderParams, QueryConfig.retrieveTransformQueryConfig),
        ],
    },
    {
        method: ["POST"],
        matcher: "/admin/orders/:id/fulfillments",
        middlewares: [
            (0, framework_1.validateAndTransformBody)(validators_1.AdminOrderCreateFulfillment),
            (0, framework_1.validateAndTransformQuery)(validators_1.AdminGetOrdersOrderParams, QueryConfig.retrieveTransformQueryConfig),
        ],
    },
    {
        method: ["POST"],
        matcher: "/admin/orders/:id/fulfillments/:fulfillment_id/cancel",
        middlewares: [
            (0, framework_1.validateAndTransformBody)(validators_1.AdminOrderCancelFulfillment),
            (0, framework_1.validateAndTransformQuery)(validators_1.AdminGetOrdersOrderParams, QueryConfig.retrieveTransformQueryConfig),
        ],
    },
    {
        method: ["POST"],
        matcher: "/admin/orders/:id/fulfillments/:fulfillment_id/shipments",
        middlewares: [
            (0, framework_1.validateAndTransformBody)(validators_1.AdminOrderCreateShipment),
            (0, framework_1.validateAndTransformQuery)(validators_1.AdminGetOrdersOrderParams, QueryConfig.retrieveTransformQueryConfig),
        ],
    },
    {
        method: ["POST"],
        matcher: "/admin/orders/:id/fulfillments/:fulfillment_id/mark-as-delivered",
        middlewares: [
            (0, framework_1.validateAndTransformBody)(validators_1.AdminMarkOrderFulfillmentDelivered),
            (0, framework_1.validateAndTransformQuery)(validators_1.AdminGetOrdersOrderParams, QueryConfig.retrieveTransformQueryConfig),
        ],
    },
    {
        method: ["POST"],
        matcher: "/admin/orders/:id/transfer",
        middlewares: [
            (0, framework_1.validateAndTransformBody)(validators_1.AdminTransferOrder),
            (0, framework_1.validateAndTransformQuery)(validators_1.AdminGetOrdersOrderParams, QueryConfig.retrieveTransformQueryConfig),
        ],
    },
    {
        method: ["POST"],
        matcher: "/admin/orders/:id/transfer/cancel",
        middlewares: [
            (0, framework_1.validateAndTransformBody)(validators_1.AdminCancelOrderTransferRequest),
            (0, framework_1.validateAndTransformQuery)(validators_1.AdminGetOrdersOrderParams, QueryConfig.retrieveTransformQueryConfig),
        ],
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlkZGxld2FyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL29yZGVycy9taWRkbGV3YXJlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxtREFHNEI7QUFFNUIsNERBQTZDO0FBQzdDLDZDQWVxQjtBQUVSLFFBQUEsMkJBQTJCLEdBQUc7SUFDekM7UUFDRSxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUM7UUFDZixPQUFPLEVBQUUsZUFBZTtRQUN4QixXQUFXLEVBQUU7WUFDWCxJQUFBLHFDQUF5QixFQUN2QixpQ0FBb0IsRUFDcEIsV0FBVyxDQUFDLHdCQUF3QixDQUNyQztTQUNGO0tBQ0Y7SUFDRDtRQUNFLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FBQztRQUNmLE9BQU8sRUFBRSxtQkFBbUI7UUFDNUIsV0FBVyxFQUFFO1lBQ1gsSUFBQSxxQ0FBeUIsRUFDdkIsc0NBQXlCLEVBQ3pCLFdBQVcsQ0FBQyw0QkFBNEIsQ0FDekM7U0FDRjtLQUNGO0lBQ0Q7UUFDRSxNQUFNLEVBQUUsQ0FBQyxNQUFNLENBQUM7UUFDaEIsT0FBTyxFQUFFLG1CQUFtQjtRQUM1QixXQUFXLEVBQUU7WUFDWCxJQUFBLG9DQUF3QixFQUFDLDZCQUFnQixDQUFDO1lBQzFDLElBQUEscUNBQXlCLEVBQ3ZCLHNDQUF5QixFQUN6QixXQUFXLENBQUMsNEJBQTRCLENBQ3pDO1NBQ0Y7S0FDRjtJQUNEO1FBQ0UsTUFBTSxFQUFFLENBQUMsS0FBSyxDQUFDO1FBQ2YsT0FBTyxFQUFFLDhCQUE4QjtRQUN2QyxXQUFXLEVBQUU7WUFDWCxJQUFBLHFDQUF5QixFQUN2QiwyQ0FBOEIsRUFDOUIsV0FBVyxDQUFDLHlCQUF5QixDQUN0QztTQUNGO0tBQ0Y7SUFDRDtRQUNFLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FBQztRQUNmLE9BQU8sRUFBRSxvQ0FBb0M7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