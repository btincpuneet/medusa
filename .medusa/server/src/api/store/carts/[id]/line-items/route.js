"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const core_flows_1 = require("@medusajs/core-flows");
const utils_1 = require("@medusajs/framework/utils");
const redington_max_qty_1 = require("../../../../../modules/redington-max-qty");
const buildProspectiveItems = (cart, incoming) => {
    const base = (0, redington_max_qty_1.buildValidationItemsFromCart)(cart);
    if (!incoming) {
        return base;
    }
    return (0, redington_max_qty_1.mergeValidationItems)(base, [incoming]);
};
const POST = async (req, res) => {
    const cartId = req.params.id;
    const cartModule = req.scope.resolve(utils_1.Modules.CART);
    const existingCart = await cartModule.retrieveCart(cartId, {
        relations: ["items"],
    });
    const body = req.validatedBody ?? req.body ?? {};
    const incomingItem = (0, redington_max_qty_1.buildValidationItemFromPayload)(body);
    if (incomingItem) {
        const prospectiveItems = buildProspectiveItems(existingCart, incomingItem);
        const validation = await (0, redington_max_qty_1.validateItemsAgainstMaxQty)(prospectiveItems);
        if (!validation.valid) {
            return res.status(422).json({
                message: "Cart violates maximum quantity rules.",
                violations: validation.violations,
            });
        }
    }
    const workflowEngine = req.scope.resolve(utils_1.Modules.WORKFLOW_ENGINE);
    await workflowEngine.run(core_flows_1.addToCartWorkflowId, {
        input: {
            cart_id: cartId,
            items: [body],
            additional_data: body.additional_data,
        },
        transactionId: `cart-add-item-${cartId}`,
    });
    const updatedCart = await cartModule.retrieveCart(cartId, {
        relations: ["items"],
    });
    res.status(200).json({ cart: updatedCart });
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2NhcnRzL1tpZF0vbGluZS1pdGVtcy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxREFBMEQ7QUFFMUQscURBQW1EO0FBR25ELGdGQU1pRDtBQUVqRCxNQUFNLHFCQUFxQixHQUFHLENBQzVCLElBQWEsRUFDYixRQUFtQyxFQUNiLEVBQUU7SUFDeEIsTUFBTSxJQUFJLEdBQUcsSUFBQSxnREFBNEIsRUFBQyxJQUFJLENBQUMsQ0FBQTtJQUMvQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDZCxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFRCxPQUFPLElBQUEsd0NBQW9CLEVBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQTtBQUMvQyxDQUFDLENBQUE7QUFFTSxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDcEUsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUE7SUFFNUIsTUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLElBQUksQ0FFaEQsQ0FBQTtJQUVELE1BQU0sWUFBWSxHQUFHLE1BQU0sVUFBVSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUU7UUFDekQsU0FBUyxFQUFFLENBQUMsT0FBTyxDQUFDO0tBQ3JCLENBQUMsQ0FBQTtJQUVGLE1BQU0sSUFBSSxHQUFJLEdBQVcsQ0FBQyxhQUFhLElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUE7SUFFekQsTUFBTSxZQUFZLEdBQUcsSUFBQSxrREFBOEIsRUFBQyxJQUFJLENBQUMsQ0FBQTtJQUV6RCxJQUFJLFlBQVksRUFBRSxDQUFDO1FBQ2pCLE1BQU0sZ0JBQWdCLEdBQUcscUJBQXFCLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFBO1FBQzFFLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBQSw4Q0FBMEIsRUFBQyxnQkFBZ0IsQ0FBQyxDQUFBO1FBQ3JFLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDdEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsT0FBTyxFQUFFLHVDQUF1QztnQkFDaEQsVUFBVSxFQUFFLFVBQVUsQ0FBQyxVQUFVO2FBQ2xDLENBQUMsQ0FBQTtRQUNKLENBQUM7SUFDSCxDQUFDO0lBRUQsTUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLGVBQWUsQ0FBQyxDQUFBO0lBRWpFLE1BQU0sY0FBYyxDQUFDLEdBQUcsQ0FBQyxnQ0FBbUIsRUFBRTtRQUM1QyxLQUFLLEVBQUU7WUFDTCxPQUFPLEVBQUUsTUFBTTtZQUNmLEtBQUssRUFBRSxDQUFDLElBQUksQ0FBQztZQUNiLGVBQWUsRUFBRyxJQUFZLENBQUMsZUFBZTtTQUMvQztRQUNELGFBQWEsRUFBRSxpQkFBaUIsTUFBTSxFQUFFO0tBQ3pDLENBQUMsQ0FBQTtJQUVGLE1BQU0sV0FBVyxHQUFHLE1BQU0sVUFBVSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUU7UUFDeEQsU0FBUyxFQUFFLENBQUMsT0FBTyxDQUFDO0tBQ3JCLENBQUMsQ0FBQTtJQUVGLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUE7QUFDN0MsQ0FBQyxDQUFBO0FBMUNZLFFBQUEsSUFBSSxRQTBDaEIifQ==