"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const seller_service_1 = require("../../../services/seller-service");
/**
 * Seller login uses a dedicated table + argon2 password hash and issues a seller-scoped JWT.
 * This keeps the auth surface separate from Medusa admin logins while still allowing an
 * optional link via Seller.admin_user_id if you choose to federate identities later.
 */
const POST = async (req, res) => {
    const body = (req.body || {});
    const email = (body.email || "").trim();
    const password = body.password || "";
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }
    try {
        const sellerService = seller_service_1.SellerService.fromRequest(req);
        const seller = await sellerService.authenticate(email, password);
        const { token } = sellerService.issueToken(seller);
        return res.json({
            token,
            seller: {
                id: seller.id,
                name: seller.name,
                email: seller.email,
                status: seller.status,
                subscription_plan: seller.subscription_plan,
                allowed_services: seller.allowed_services,
            },
        });
    }
    catch (error) {
        return res.status(401).json({
            message: error instanceof Error ? error.message : "Unable to sign in seller.",
        });
    }
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3NlbGxlci9sb2dpbi9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxxRUFBZ0U7QUFFaEU7Ozs7R0FJRztBQUNJLE1BQU0sSUFBSSxHQUFHLEtBQUssRUFBRSxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUNwRSxNQUFNLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUEwQyxDQUFBO0lBQ3RFLE1BQU0sS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtJQUN2QyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQTtJQUVwQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDeEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxrQ0FBa0MsRUFBRSxDQUFDLENBQUE7SUFDOUUsQ0FBQztJQUVELElBQUksQ0FBQztRQUNILE1BQU0sYUFBYSxHQUFHLDhCQUFhLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ3BELE1BQU0sTUFBTSxHQUFHLE1BQU0sYUFBYSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDaEUsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLGFBQWEsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUE7UUFFbEQsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ2QsS0FBSztZQUNMLE1BQU0sRUFBRTtnQkFDTixFQUFFLEVBQUUsTUFBTSxDQUFDLEVBQUU7Z0JBQ2IsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJO2dCQUNqQixLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUs7Z0JBQ25CLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTTtnQkFDckIsaUJBQWlCLEVBQUUsTUFBTSxDQUFDLGlCQUFpQjtnQkFDM0MsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLGdCQUFnQjthQUMxQztTQUNGLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1FBQ3BCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDMUIsT0FBTyxFQUNMLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLDJCQUEyQjtTQUN2RSxDQUFDLENBQUE7SUFDSixDQUFDO0FBQ0gsQ0FBQyxDQUFBO0FBL0JZLFFBQUEsSUFBSSxRQStCaEIifQ==