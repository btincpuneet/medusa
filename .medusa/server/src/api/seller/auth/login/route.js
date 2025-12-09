"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const seller_auth_service_1 = require("../../../../services/seller-auth-service");
const POST = async (req, res) => {
    const { email, password } = (req.body || {});
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
    }
    const manager = req.scope.resolve("manager");
    const auth = new seller_auth_service_1.SellerAuthService(manager);
    try {
        const { token, payload } = await auth.login(email, password);
        return res.json({
            token,
            vendorId: payload.sellerId,
            vendorName: payload.vendorName,
            role: payload.role,
            allowedServices: payload.allowedServices,
        });
    }
    catch (e) {
        return res.status(401).json({ message: e?.message || "Invalid credentials" });
    }
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3NlbGxlci9hdXRoL2xvZ2luL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLGtGQUE0RTtBQUlyRSxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDcEUsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFjLENBQUE7SUFDekQsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3hCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsNkJBQTZCLEVBQUUsQ0FBQyxDQUFBO0lBQ3pFLENBQUM7SUFFRCxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQVEsQ0FBQTtJQUNuRCxNQUFNLElBQUksR0FBRyxJQUFJLHVDQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBRTNDLElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQTtRQUM1RCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDZCxLQUFLO1lBQ0wsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRO1lBQzFCLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTtZQUM5QixJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUk7WUFDbEIsZUFBZSxFQUFFLE9BQU8sQ0FBQyxlQUFlO1NBQ3pDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFBQyxPQUFPLENBQU0sRUFBRSxDQUFDO1FBQ2hCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLE9BQU8sSUFBSSxxQkFBcUIsRUFBRSxDQUFDLENBQUE7SUFDL0UsQ0FBQztBQUNILENBQUMsQ0FBQTtBQXJCWSxRQUFBLElBQUksUUFxQmhCIn0=