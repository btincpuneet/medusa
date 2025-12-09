"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellerAuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const seller_service_1 = require("./seller-service");
const seller_permission_service_1 = require("./seller-permission-service");
class SellerAuthService {
    constructor(manager) {
        this.manager = manager;
        this.sellerService = new seller_service_1.SellerService(manager);
        this.permissionService = new seller_permission_service_1.SellerPermissionService(manager);
    }
    secret() {
        return process.env.SELLER_JWT_SECRET || process.env.JWT_SECRET || "seller-secret";
    }
    buildPayload(seller, allowedServices) {
        return {
            sellerId: seller.id,
            vendorName: seller.vendor_name || seller.name,
            role: seller.role,
            allowedServices: allowedServices.length ? allowedServices : seller.allowed_services || [],
        };
    }
    async login(email, password) {
        const seller = await this.sellerService.getByEmail(email);
        if (!seller)
            throw new Error("Invalid email or password.");
        if (seller.status !== "active")
            throw new Error("Seller inactive.");
        const ok = await this.sellerService.verifyPassword(seller, password);
        if (!ok)
            throw new Error("Invalid email or password.");
        const allowed = await this.permissionService.listAllowedCodes(seller.id);
        const payload = this.buildPayload(seller, allowed);
        const token = jsonwebtoken_1.default.sign(payload, this.secret(), { expiresIn: "7d" });
        return { token, payload };
    }
    verify(token) {
        return jsonwebtoken_1.default.verify(token, this.secret());
    }
    async profile(sellerId) {
        const seller = await this.sellerService.getById(sellerId);
        if (!seller)
            throw new Error("Seller not found.");
        const allowed = await this.permissionService.listAllowedCodes(sellerId);
        const payload = this.buildPayload(seller, allowed);
        return {
            vendorId: seller.id,
            vendorName: payload.vendorName,
            role: seller.role,
            allowedServices: payload.allowedServices,
            subscriptionPlan: seller.subscription_plan,
            status: seller.status,
            email: seller.email,
        };
    }
}
exports.SellerAuthService = SellerAuthService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsbGVyLWF1dGgtc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9zZWxsZXItYXV0aC1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGdFQUE4QjtBQUk5QixxREFBZ0Q7QUFDaEQsMkVBQXFFO0FBU3JFLE1BQWEsaUJBQWlCO0lBSTVCLFlBQW9CLE9BQXNCO1FBQXRCLFlBQU8sR0FBUCxPQUFPLENBQWU7UUFDeEMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLDhCQUFhLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDL0MsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksbURBQXVCLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDL0QsQ0FBQztJQUVPLE1BQU07UUFDWixPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksZUFBZSxDQUFBO0lBQ25GLENBQUM7SUFFTyxZQUFZLENBQUMsTUFBYyxFQUFFLGVBQXlCO1FBQzVELE9BQU87WUFDTCxRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDbkIsVUFBVSxFQUFFLE1BQU0sQ0FBQyxXQUFXLElBQUksTUFBTSxDQUFDLElBQUk7WUFDN0MsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJO1lBQ2pCLGVBQWUsRUFBRSxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsSUFBSSxFQUFFO1NBQzFGLENBQUE7SUFDSCxDQUFDO0lBRUQsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFhLEVBQUUsUUFBZ0I7UUFDekMsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUN6RCxJQUFJLENBQUMsTUFBTTtZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQTtRQUMxRCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssUUFBUTtZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQTtRQUNuRSxNQUFNLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtRQUNwRSxJQUFJLENBQUMsRUFBRTtZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQTtRQUV0RCxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDeEUsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDbEQsTUFBTSxLQUFLLEdBQUcsc0JBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO1FBQ25FLE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUE7SUFDM0IsQ0FBQztJQUVELE1BQU0sQ0FBQyxLQUFhO1FBQ2xCLE9BQU8sc0JBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBcUIsQ0FBQTtJQUM3RCxDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFnQjtRQUM1QixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ3pELElBQUksQ0FBQyxNQUFNO1lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxDQUFBO1FBQ2pELE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ3ZFLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQ2xELE9BQU87WUFDTCxRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDbkIsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVO1lBQzlCLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSTtZQUNqQixlQUFlLEVBQUUsT0FBTyxDQUFDLGVBQWU7WUFDeEMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLGlCQUFpQjtZQUMxQyxNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU07WUFDckIsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLO1NBQ3BCLENBQUE7SUFDSCxDQUFDO0NBQ0Y7QUF0REQsOENBc0RDIn0=