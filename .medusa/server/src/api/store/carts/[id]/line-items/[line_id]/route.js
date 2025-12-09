"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELETE = exports.POST = void 0;
const core_flows_1 = require("@medusajs/core-flows");
const utils_1 = require("@medusajs/framework/utils");
const redington_max_qty_1 = require("../../../../../../modules/redington-max-qty");
const adjustValidationItems = (cart, lineId, quantity) => {
    const items = (0, redington_max_qty_1.buildValidationItemsFromCart)(cart);
    const cartItems = Array.isArray(cart.items) ? cart.items : [];
    const targetIndex = cartItems.findIndex((item) => item.id === lineId);
    if (targetIndex >= 0 &&
        typeof quantity === "number" &&
        Number.isFinite(quantity)) {
        items[targetIndex].quantity = quantity;
    }
    return items;
};
const POST = async (req, res) => {
    const cartId = req.params.id;
    const lineId = req.params.line_id;
    const cartModule = req.scope.resolve(utils_1.Modules.CART);
    const existingCart = await cartModule.retrieveCart(cartId, {
        relations: ["items"],
    });
    const body = req.validatedBody ?? req.body ?? {};
    const nextQuantity = typeof body?.quantity === "number"
        ? body.quantity
        : Number(body?.quantity);
    if (Number.isFinite(nextQuantity)) {
        const prospective = adjustValidationItems(existingCart, lineId, nextQuantity);
        const validation = await (0, redington_max_qty_1.validateItemsAgainstMaxQty)(prospective);
        if (!validation.valid) {
            return res.status(422).json({
                message: "Cart violates maximum quantity rules.",
                violations: validation.violations,
            });
        }
    }
    const workflowEngine = req.scope.resolve(utils_1.Modules.WORKFLOW_ENGINE);
    await workflowEngine.run(core_flows_1.updateLineItemInCartWorkflowId, {
        input: {
            cart_id: cartId,
            item_id: lineId,
            update: body,
            additional_data: body.additional_data,
        },
        transactionId: `cart-update-item-${cartId}`,
    });
    const updatedCart = await cartModule.retrieveCart(cartId, {
        relations: ["items"],
    });
    res.status(200).json({ cart: updatedCart });
};
exports.POST = POST;
const DELETE = async (req, res) => {
    const cartId = req.params.id;
    const lineId = req.params.line_id;
    const workflowEngine = req.scope.resolve(utils_1.Modules.WORKFLOW_ENGINE);
    await workflowEngine.run(core_flows_1.deleteLineItemsWorkflowId, {
        input: {
            cart_id: cartId,
            ids: [lineId],
        },
        transactionId: `cart-delete-item-${cartId}`,
    });
    const cartModule = req.scope.resolve(utils_1.Modules.CART);
    const updatedCart = await cartModule.retrieveCart(cartId, {
        relations: ["items"],
    });
    res.status(200).json({
        id: lineId,
        object: "line-item",
        deleted: true,
        parent: updatedCart,
    });
};
exports.DELETE = DELETE;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2NhcnRzL1tpZF0vbGluZS1pdGVtcy9bbGluZV9pZF0vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscURBRzZCO0FBRTdCLHFEQUFtRDtBQUduRCxtRkFHb0Q7QUFFcEQsTUFBTSxxQkFBcUIsR0FBRyxDQUM1QixJQUFhLEVBQ2IsTUFBYyxFQUNkLFFBQWlCLEVBQ2pCLEVBQUU7SUFDRixNQUFNLEtBQUssR0FBRyxJQUFBLGdEQUE0QixFQUFDLElBQUksQ0FBQyxDQUFBO0lBQ2hELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUE7SUFDN0QsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxNQUFNLENBQUMsQ0FBQTtJQUVyRSxJQUNFLFdBQVcsSUFBSSxDQUFDO1FBQ2hCLE9BQU8sUUFBUSxLQUFLLFFBQVE7UUFDNUIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFDekIsQ0FBQztRQUNELEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFBO0lBQ3hDLENBQUM7SUFFRCxPQUFPLEtBQUssQ0FBQTtBQUNkLENBQUMsQ0FBQTtBQUVNLE1BQU0sSUFBSSxHQUFHLEtBQUssRUFBRSxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUNwRSxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQTtJQUM1QixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQTtJQUVq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