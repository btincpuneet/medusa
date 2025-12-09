"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const seller_service_1 = require("../../../../../services/seller-service");
const admin_auth_1 = require("../../../../utils/admin-auth");
/**
 * Allows a Super Admin to override the tabs/services a seller can see.
 * Subscription defaults are handled by the subscription endpoint; this one
 * is purely for explicit overrides.
 */
exports.POST = [
    admin_auth_1.ensureAdmin,
    async (req, res) => {
        const sellerId = req.params?.id;
        const body = (req.body || {});
        if (!sellerId) {
            return res.status(400).json({ message: "Seller id is required." });
        }
        const allowedServices = Array.isArray(body.allowed_services)
            ? body.allowed_services
            : [];
        try {
            const sellerService = seller_service_1.SellerService.fromRequest(req);
            const seller = await sellerService.updateAllowedServices(sellerId, allowedServices);
            return res.json({ seller });
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Unable to update allowed services.";
            const status = message.toLowerCase().includes("not found") ? 404 : 400;
            return res.status(status).json({ message });
        }
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3NlbGxlcnMvW2lkXS9zZXJ2aWNlcy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSwyRUFBc0U7QUFDdEUsNkRBQTBEO0FBRTFEOzs7O0dBSUc7QUFDVSxRQUFBLElBQUksR0FBRztJQUNsQix3QkFBVztJQUNYLEtBQUssRUFBRSxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtRQUNsRCxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQTtRQUMvQixNQUFNLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFvQyxDQUFBO1FBRWhFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNkLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQyxDQUFBO1FBQ3BFLENBQUM7UUFFRCxNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztZQUMxRCxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQjtZQUN2QixDQUFDLENBQUMsRUFBRSxDQUFBO1FBRU4sSUFBSSxDQUFDO1lBQ0gsTUFBTSxhQUFhLEdBQUcsOEJBQWEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDcEQsTUFBTSxNQUFNLEdBQUcsTUFBTSxhQUFhLENBQUMscUJBQXFCLENBQ3RELFFBQVEsRUFDUixlQUFlLENBQ2hCLENBQUE7WUFFRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFBO1FBQzdCLENBQUM7UUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1lBQ3BCLE1BQU0sT0FBTyxHQUNYLEtBQUssWUFBWSxLQUFLO2dCQUNwQixDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU87Z0JBQ2YsQ0FBQyxDQUFDLG9DQUFvQyxDQUFBO1lBQzFDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFBO1lBRXRFLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFBO1FBQzdDLENBQUM7SUFDRCxDQUFDO0NBQ0YsQ0FBQSJ9