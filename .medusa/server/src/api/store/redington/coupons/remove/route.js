"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const core_flows_1 = require("@medusajs/core-flows");
const utils_1 = require("@medusajs/framework/utils");
const normalizeString = (value) => typeof value === "string" ? value.trim() : "";
async function POST(req, res) {
    const body = (req.body || {});
    const cartId = normalizeString(body.cart_id);
    if (!cartId) {
        return res.status(400).json({ message: "cart_id is required" });
    }
    const couponCode = normalizeString(body.coupon_code);
    if (!couponCode) {
        return res.status(400).json({ message: "coupon_code is required" });
    }
    const workflowEngine = req.scope.resolve(utils_1.Modules.WORKFLOW_ENGINE);
    try {
        await workflowEngine.run(core_flows_1.updateCartPromotionsWorkflowId, {
            input: {
                cart_id: cartId,
                promo_codes: [couponCode],
                action: utils_1.PromotionActions.REMOVE,
            },
            transactionId: `redington-cart-remove-promo-${cartId}`,
        });
        return res.status(200).json({
            data: {
                success: true,
                message: "Coupon removed successfully.",
                cart_id: cartId,
                coupon_code: couponCode,
            },
        });
    }
    catch (error) {
        const message = error instanceof Error
            ? error.message
            : "Failed to remove coupon from the cart.";
        return res.status(400).json({
            data: {
                success: false,
                message,
            },
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3JlZGluZ3Rvbi9jb3Vwb25zL3JlbW92ZS9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQVlBLG9CQThDQztBQTFERCxxREFBcUU7QUFFckUscURBQXFFO0FBT3JFLE1BQU0sZUFBZSxHQUFHLENBQUMsS0FBYyxFQUFFLEVBQUUsQ0FDekMsT0FBTyxLQUFLLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQTtBQUV4QyxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBcUIsQ0FBQTtJQUVqRCxNQUFNLE1BQU0sR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQzVDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNaLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxDQUFBO0lBQ2pFLENBQUM7SUFFRCxNQUFNLFVBQVUsR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFBO0lBQ3BELElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNoQixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLHlCQUF5QixFQUFFLENBQUMsQ0FBQTtJQUNyRSxDQUFDO0lBRUQsTUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLGVBQWUsQ0FBQyxDQUFBO0lBRWpFLElBQUksQ0FBQztRQUNILE1BQU0sY0FBYyxDQUFDLEdBQUcsQ0FBQywyQ0FBOEIsRUFBRTtZQUN2RCxLQUFLLEVBQUU7Z0JBQ0wsT0FBTyxFQUFFLE1BQU07Z0JBQ2YsV0FBVyxFQUFFLENBQUMsVUFBVSxDQUFDO2dCQUN6QixNQUFNLEVBQUUsd0JBQWdCLENBQUMsTUFBTTthQUNoQztZQUNELGFBQWEsRUFBRSwrQkFBK0IsTUFBTSxFQUFFO1NBQ3ZELENBQUMsQ0FBQTtRQUVGLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDMUIsSUFBSSxFQUFFO2dCQUNKLE9BQU8sRUFBRSxJQUFJO2dCQUNiLE9BQU8sRUFBRSw4QkFBOEI7Z0JBQ3ZDLE9BQU8sRUFBRSxNQUFNO2dCQUNmLFdBQVcsRUFBRSxVQUFVO2FBQ3hCO1NBQ0YsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7UUFDcEIsTUFBTSxPQUFPLEdBQ1gsS0FBSyxZQUFZLEtBQUs7WUFDcEIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPO1lBQ2YsQ0FBQyxDQUFDLHdDQUF3QyxDQUFBO1FBRTlDLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDMUIsSUFBSSxFQUFFO2dCQUNKLE9BQU8sRUFBRSxLQUFLO2dCQUNkLE9BQU87YUFDUjtTQUNGLENBQUMsQ0FBQTtJQUNKLENBQUM7QUFDSCxDQUFDIn0=