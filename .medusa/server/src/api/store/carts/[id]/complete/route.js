"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const core_flows_1 = require("@medusajs/core-flows");
const utils_1 = require("@medusajs/framework/utils");
const redington_max_qty_1 = require("../../../../../modules/redington-max-qty");
const fetchCartForValidation = async (scope, cartId) => {
    const cartModule = scope.resolve(utils_1.Modules.CART);
    return cartModule.retrieveCart(cartId, {
        relations: ["items"],
    });
};
const POST = async (req, res) => {
    const cartId = req.params.id;
    const cart = await fetchCartForValidation(req.scope, cartId);
    const validationItems = (0, redington_max_qty_1.buildValidationItemsFromCart)(cart);
    const validation = await (0, redington_max_qty_1.validateItemsAgainstMaxQty)(validationItems);
    if (!validation.valid) {
        return res.status(422).json({
            message: "Cart violates maximum quantity rules.",
            violations: validation.violations,
        });
    }
    const { errors, result } = await (0, core_flows_1.completeCartWorkflow)(req.scope).run({
        input: { id: cartId },
        context: { transactionId: cartId },
        throwOnError: false,
    });
    const query = req.scope.resolve(utils_1.ContainerRegistrationKeys.QUERY);
    if (errors?.[0]) {
        const error = errors[0].error;
        const statusOKErrors = [
            utils_1.MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
            utils_1.MedusaError.Types.PAYMENT_REQUIRES_MORE_ERROR,
        ];
        const currentCart = await fetchCartForValidation(req.scope, cartId);
        if (!statusOKErrors.includes(error.type)) {
            throw error;
        }
        return res.status(200).json({
            type: "cart",
            cart: currentCart,
            error: {
                message: error.message,
                name: error.name,
                type: error.type,
            },
        });
    }
    const { data } = await query.graph({
        entity: "order",
        fields: req.queryConfig.fields,
        filters: { id: result.id },
    });
    const orderRecord = data[0];
    const orderInfo = (orderRecord ?? {});
    const rawCustomerId = cart?.customer_id ??
        cart?.metadata?.magento_customer_id ??
        cart?.metadata?.customer_id ??
        null;
    const numericCustomerId = Number(rawCustomerId);
    if (Number.isFinite(numericCustomerId) && Array.isArray(cart?.items)) {
        const orderIncrementId = orderInfo.display_id ??
            orderInfo.order_number ??
            orderInfo.order_no ??
            orderInfo.id ??
            result.id;
        for (const [index, lineItem] of cart.items.entries()) {
            const validationItem = validationItems[index];
            if (!validationItem) {
                continue;
            }
            await (0, redington_max_qty_1.upsertOrderQuantityTracker)({
                customer_id: numericCustomerId,
                order_increment_id: String(orderIncrementId),
                sku: validationItem.sku,
                quantity: Number(lineItem.quantity ?? validationItem.quantity ?? 0),
                brand_id: validationItem.brand_id ?? null,
            });
        }
    }
    res.status(200).json({
        type: "order",
        order: orderRecord,
    });
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2NhcnRzL1tpZF0vY29tcGxldGUvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscURBQTJEO0FBRTNELHFEQUlrQztBQUdsQyxnRkFJaUQ7QUFFakQsTUFBTSxzQkFBc0IsR0FBRyxLQUFLLEVBQ2xDLEtBQTZCLEVBQzdCLE1BQWMsRUFDSSxFQUFFO0lBQ3BCLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLElBQUksQ0FFNUMsQ0FBQTtJQUVELE9BQU8sVUFBVSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUU7UUFDckMsU0FBUyxFQUFFLENBQUMsT0FBTyxDQUFDO0tBQ3JCLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQTtBQUVNLE1BQU0sSUFBSSxHQUFHLEtBQUssRUFBRSxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUNwRSxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQTtJQUU1QixNQUFNLElBQUksR0FBRyxNQUFNLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUE7SUFDNUQsTUFBTSxlQUFlLEdBQUcsSUFBQSxnREFBNEIsRUFBQyxJQUFJLENBQUMsQ0FBQTtJQUMxRCxNQUFNLFVBQVUsR0FBRyxNQUFNLElBQUEsOENBQTBCLEVBQUMsZUFBZSxDQUFDLENBQUE7SUFFcEUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN0QixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFBRSx1Q0FBdUM7WUFDaEQsVUFBVSxFQUFFLFVBQVUsQ0FBQyxVQUFVO1NBQ2xDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRCxNQUFN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