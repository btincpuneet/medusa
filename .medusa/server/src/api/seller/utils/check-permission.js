"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = void 0;
const seller_auth_service_1 = require("../../../services/seller-auth-service");
const checkPermission = (required) => async (req, res, next) => {
    const header = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
    if (!header) {
        return res.status(401).json({ message: "Missing token" });
    }
    try {
        const manager = req.scope.resolve("manager");
        const auth = new seller_auth_service_1.SellerAuthService(manager);
        const payload = auth.verify(header);
        req.seller = {
            sellerId: payload.sellerId,
            vendorName: payload.vendorName,
            role: payload.role,
            allowedServices: payload.allowedServices,
        };
        if (required && !payload.allowedServices.includes(required)) {
            return res.status(403).json({ message: "Access denied" });
        }
        next();
    }
    catch {
        return res.status(401).json({ message: "Invalid token" });
    }
};
exports.checkPermission = checkPermission;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hlY2stcGVybWlzc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9hcGkvc2VsbGVyL3V0aWxzL2NoZWNrLXBlcm1pc3Npb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBTUEsK0VBQXlFO0FBU2xFLE1BQU0sZUFBZSxHQUMxQixDQUFDLFFBQWlCLEVBQUUsRUFBRSxDQUN0QixLQUFLLEVBQ0gsR0FBbUQsRUFDbkQsR0FBbUIsRUFDbkIsSUFBd0IsRUFDeEIsRUFBRTtJQUNGLE1BQU0sTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxhQUFhLElBQUksRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtJQUNsRixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDWixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLGVBQWUsRUFBRSxDQUFDLENBQUE7SUFDM0QsQ0FBQztJQUVELElBQUksQ0FBQztRQUNILE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFBO1FBQzVDLE1BQU0sSUFBSSxHQUFHLElBQUksdUNBQWlCLENBQUMsT0FBYyxDQUFDLENBQUE7UUFDbEQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUNuQyxHQUFHLENBQUMsTUFBTSxHQUFHO1lBQ1gsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRO1lBQzFCLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTtZQUM5QixJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUk7WUFDbEIsZUFBZSxFQUFFLE9BQU8sQ0FBQyxlQUFlO1NBQ3pDLENBQUE7UUFDRCxJQUFJLFFBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDNUQsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxlQUFlLEVBQUUsQ0FBQyxDQUFBO1FBQzNELENBQUM7UUFDRCxJQUFJLEVBQUUsQ0FBQTtJQUNSLENBQUM7SUFBQyxNQUFNLENBQUM7UUFDUCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLGVBQWUsRUFBRSxDQUFDLENBQUE7SUFDM0QsQ0FBQztBQUNILENBQUMsQ0FBQTtBQTdCVSxRQUFBLGVBQWUsbUJBNkJ6QiJ9