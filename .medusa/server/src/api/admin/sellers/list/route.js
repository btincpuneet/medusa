"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const seller_1 = require("../../../../models/seller");
const seller_permission_service_1 = require("../../../../services/seller-permission-service");
const admin_auth_1 = require("../../../utils/admin-auth");
exports.GET = [
    admin_auth_1.ensureAdmin,
    async (req, res) => {
        const manager = req.scope.resolve("manager");
        const repo = manager.getRepository(seller_1.Seller);
        const sellers = await repo.find({ order: { created_at: "DESC" } });
        const permission = new seller_permission_service_1.SellerPermissionService(manager);
        const withServices = await Promise.all(sellers.map(async (s) => ({
            ...s,
            allowed_services: await permission.listAllowedCodes(s.id),
        })));
        return res.json({ sellers: withServices });
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3NlbGxlcnMvbGlzdC9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxzREFBa0Q7QUFDbEQsOEZBQXdGO0FBQ3hGLDBEQUF1RDtBQUUxQyxRQUFBLEdBQUcsR0FBRztJQUNqQix3QkFBVztJQUNYLEtBQUssRUFBRSxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtRQUNoRCxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQVEsQ0FBQTtRQUNuRCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLGVBQU0sQ0FBQyxDQUFBO1FBQzFDLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDbEUsTUFBTSxVQUFVLEdBQUcsSUFBSSxtREFBdUIsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUV2RCxNQUFNLFlBQVksR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQ3BDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN4QixHQUFHLENBQUM7WUFDSixnQkFBZ0IsRUFBRSxNQUFNLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1NBQzFELENBQUMsQ0FBQyxDQUNKLENBQUE7UUFFRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQTtJQUM1QyxDQUFDO0NBQ0YsQ0FBQSJ9