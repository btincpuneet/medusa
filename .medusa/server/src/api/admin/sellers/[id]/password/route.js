"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const seller_service_1 = require("../../../../../services/seller-service");
const admin_auth_1 = require("../../../../utils/admin-auth");
/**
 * Admin helper to set/reset a seller password (argon2 hashed).
 * Use this when you need to provision a login for a seller account.
 */
exports.POST = [
    admin_auth_1.ensureAdmin,
    async (req, res) => {
        const sellerId = req.params?.id;
        const body = (req.body || {});
        if (!sellerId) {
            return res.status(400).json({ message: "Seller id is required." });
        }
        const password = (body.password || "").trim();
        if (!password) {
            return res.status(400).json({ message: "Password is required." });
        }
        try {
            const sellerService = seller_service_1.SellerService.fromRequest(req);
            const seller = await sellerService.setPassword(sellerId, password);
            return res.json({ seller, message: "Password updated." });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unable to update seller password.";
            const status = message.toLowerCase().includes("not found") ? 404 : 400;
            return res.status(status).json({ message });
        }
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3NlbGxlcnMvW2lkXS9wYXNzd29yZC9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSwyRUFBc0U7QUFDdEUsNkRBQTBEO0FBTTFEOzs7R0FHRztBQUNVLFFBQUEsSUFBSSxHQUFHO0lBQ2xCLHdCQUFXO0lBQ1gsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO1FBQ2xELE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFBO1FBQy9CLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLENBQVMsQ0FBQTtRQUVyQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDZCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLHdCQUF3QixFQUFFLENBQUMsQ0FBQTtRQUNwRSxDQUFDO1FBRUQsTUFBTSxRQUFRLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO1FBQzdDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNkLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsQ0FBQyxDQUFBO1FBQ25FLENBQUM7UUFFRCxJQUFJLENBQUM7WUFDSCxNQUFNLGFBQWEsR0FBRyw4QkFBYSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUNwRCxNQUFNLE1BQU0sR0FBRyxNQUFNLGFBQWEsQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFBO1lBQ2xFLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxDQUFBO1FBQzNELENBQUM7UUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1lBQ3BCLE1BQU0sT0FBTyxHQUNYLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLG1DQUFtQyxDQUFBO1lBQzlFLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFBO1lBQ3RFLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFBO1FBQzdDLENBQUM7SUFDRCxDQUFDO0NBQ0YsQ0FBQSJ9