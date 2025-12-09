"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const seller_service_1 = require("../../../../../services/seller-service");
const VALID_PLANS = [
    "FREE",
    "BASIC",
    "PRO",
    "ENTERPRISE",
];
/**
 * Updates the seller's subscription plan and resets allowed services to that plan's defaults.
 * Override specific tabs afterwards via POST /admin/sellers/:id/services.
 */
const POST = async (req, res) => {
    const sellerId = req.params?.id;
    const body = (req.body || {});
    if (!sellerId) {
        return res.status(400).json({ message: "Seller id is required." });
    }
    const plan = (body.subscription_plan || "").toUpperCase();
    if (!VALID_PLANS.includes(plan)) {
        return res.status(400).json({
            message: `subscription_plan must be one of ${VALID_PLANS.join(", ")}`,
        });
    }
    try {
        const sellerService = seller_service_1.SellerService.fromRequest(req);
        const seller = await sellerService.updateSubscriptionPlan(sellerId, plan);
        return res.json({ seller });
    }
    catch (error) {
        const message = error instanceof Error
            ? error.message
            : "Unable to update subscription plan.";
        const status = message.toLowerCase().includes("not found") ? 404 : 400;
        return res.status(status).json({ message });
    }
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3NlbGxlcnMvW2lkXS9zdWJzY3JpcHRpb24vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0EsMkVBQXNFO0FBRXRFLE1BQU0sV0FBVyxHQUE2QjtJQUM1QyxNQUFNO0lBQ04sT0FBTztJQUNQLEtBQUs7SUFDTCxZQUFZO0NBQ2IsQ0FBQTtBQUVEOzs7R0FHRztBQUNJLE1BQU0sSUFBSSxHQUFHLEtBQUssRUFBRSxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUNwRSxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQTtJQUMvQixNQUFNLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFtQyxDQUFBO0lBRS9ELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNkLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQyxDQUFBO0lBQ3BFLENBQUM7SUFFRCxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxFQUFFLENBQUMsQ0FBQyxXQUFXLEVBQTRCLENBQUE7SUFFbkYsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUNoQyxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFBRSxvQ0FBb0MsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtTQUN0RSxDQUFDLENBQUE7SUFDSixDQUFDO0lBRUQsSUFBSSxDQUFDO1FBQ0gsTUFBTSxhQUFhLEdBQUcsOEJBQWEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDcEQsTUFBTSxNQUFNLEdBQUcsTUFBTSxhQUFhLENBQUMsc0JBQXNCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFBO1FBRXpFLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUE7SUFDN0IsQ0FBQztJQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7UUFDcEIsTUFBTSxPQUFPLEdBQ1gsS0FBSyxZQUFZLEtBQUs7WUFDcEIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPO1lBQ2YsQ0FBQyxDQUFDLHFDQUFxQyxDQUFBO1FBQzNDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFBO1FBRXRFLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFBO0lBQzdDLENBQUM7QUFDSCxDQUFDLENBQUE7QUE5QlksUUFBQSxJQUFJLFFBOEJoQiJ9