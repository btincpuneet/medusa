"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const seller_auth_service_1 = require("../../../../services/seller-auth-service");
const GET = async (req, res) => {
    const header = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
    if (!header) {
        return res.status(401).json({ message: "Missing token" });
    }
    const manager = req.scope.resolve("manager");
    const auth = new seller_auth_service_1.SellerAuthService(manager);
    try {
        const payload = auth.verify(header);
        const profile = await auth.profile(payload.sellerId);
        return res.json(profile);
    }
    catch {
        return res.status(401).json({ message: "Invalid token" });
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3NlbGxlci9hdXRoL21lL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLGtGQUE0RTtBQUVyRSxNQUFNLEdBQUcsR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDbkUsTUFBTSxNQUFNLEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLGFBQWEsSUFBSSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO0lBQ2xGLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNaLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsZUFBZSxFQUFFLENBQUMsQ0FBQTtJQUMzRCxDQUFDO0lBRUQsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFRLENBQUE7SUFDbkQsTUFBTSxJQUFJLEdBQUcsSUFBSSx1Q0FBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUMzQyxJQUFJLENBQUM7UUFDSCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ25DLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDcEQsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQzFCLENBQUM7SUFBQyxNQUFNLENBQUM7UUFDUCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLGVBQWUsRUFBRSxDQUFDLENBQUE7SUFDM0QsQ0FBQztBQUNILENBQUMsQ0FBQTtBQWZZLFFBQUEsR0FBRyxPQWVmIn0=