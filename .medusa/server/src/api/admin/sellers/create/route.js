"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const seller_service_1 = require("../../../../services/seller-service");
const seller_service_2 = require("../../../../models/seller-service");
const service_1 = require("../../../../models/service");
const admin_auth_1 = require("../../../utils/admin-auth");
exports.POST = [
    admin_auth_1.ensureAdmin,
    async (req, res) => {
        const body = req.body || {};
        const { vendor_name, contact_name, email, password, phone, role = "OWNER", subscription_plan = "FREE", status = "active", allowedServices = [], } = body;
        if (!vendor_name || !contact_name || !email || !password) {
            return res.status(400).json({ message: "vendor_name, contact_name, email, password are required" });
        }
        const manager = req.scope.resolve("manager");
        const sellerSvc = new seller_service_1.SellerService(manager);
        try {
            const seller = await sellerSvc.createSeller({
                vendor_name,
                contact_name,
                name: vendor_name,
                email,
                password,
                phone,
                role,
                subscription_plan,
                status,
            });
            if (Array.isArray(allowedServices) && allowedServices.length) {
                const serviceRepo = manager.getRepository(service_1.Service);
                const mapRepo = manager.getRepository(seller_service_2.SellerService);
                const services = await serviceRepo.findBy({ code: allowedServices });
                await mapRepo.save(services.map((svc) => mapRepo.create({
                    seller_id: seller.id,
                    service_id: svc.id,
                })));
            }
            return res.status(201).json({ seller });
        }
        catch (e) {
            return res.status(400).json({ message: e?.message || "Unable to create seller" });
        }
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3NlbGxlcnMvY3JlYXRlL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLHdFQUFtRTtBQUNuRSxzRUFBcUY7QUFDckYsd0RBQW9EO0FBQ3BELDBEQUF1RDtBQUUxQyxRQUFBLElBQUksR0FBRztJQUNsQix3QkFBVztJQUNYLEtBQUssRUFBRSxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtRQUNoRCxNQUFNLElBQUksR0FBSSxHQUFHLENBQUMsSUFBWSxJQUFJLEVBQUUsQ0FBQTtRQUNwQyxNQUFNLEVBQ0osV0FBVyxFQUNYLFlBQVksRUFDWixLQUFLLEVBQ0wsUUFBUSxFQUNSLEtBQUssRUFDTCxJQUFJLEdBQUcsT0FBTyxFQUNkLGlCQUFpQixHQUFHLE1BQU0sRUFDMUIsTUFBTSxHQUFHLFFBQVEsRUFDakIsZUFBZSxHQUFHLEVBQUUsR0FDckIsR0FBRyxJQUFJLENBQUE7UUFFUixJQUFJLENBQUMsV0FBVyxJQUFJLENBQUMsWUFBWSxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDekQsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSx5REFBeUQsRUFBRSxDQUFDLENBQUE7UUFDckcsQ0FBQztRQUVELE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBUSxDQUFBO1FBQ25ELE1BQU0sU0FBUyxHQUFHLElBQUksOEJBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUU1QyxJQUFJLENBQUM7WUFDSCxNQUFNLE1BQU0sR0FBRyxNQUFNLFNBQVMsQ0FBQyxZQUFZLENBQUM7Z0JBQzFDLFdBQVc7Z0JBQ1gsWUFBWTtnQkFDWixJQUFJLEVBQUUsV0FBVztnQkFDakIsS0FBSztnQkFDTCxRQUFRO2dCQUNSLEtBQUs7Z0JBQ0wsSUFBSTtnQkFDSixpQkFBaUI7Z0JBQ2pCLE1BQU07YUFDUCxDQUFDLENBQUE7WUFFRixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLElBQUksZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUM3RCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLGlCQUFPLENBQUMsQ0FBQTtnQkFDbEQsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyw4QkFBZ0IsQ0FBQyxDQUFBO2dCQUN2RCxNQUFNLFFBQVEsR0FBRyxNQUFNLFdBQVcsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsZUFBc0IsRUFBRSxDQUFDLENBQUE7Z0JBQzNFLE1BQU0sT0FBTyxDQUFDLElBQUksQ0FDaEIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQ25CLE9BQU8sQ0FBQyxNQUFNLENBQUM7b0JBQ2IsU0FBUyxFQUFFLE1BQU0sQ0FBQyxFQUFFO29CQUNwQixVQUFVLEVBQUUsR0FBRyxDQUFDLEVBQUU7aUJBQ25CLENBQUMsQ0FDSCxDQUNGLENBQUE7WUFDSCxDQUFDO1lBRUQsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUE7UUFDekMsQ0FBQztRQUFDLE9BQU8sQ0FBTSxFQUFFLENBQUM7WUFDaEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsT0FBTyxJQUFJLHlCQUF5QixFQUFFLENBQUMsQ0FBQTtRQUNuRixDQUFDO0lBQ0gsQ0FBQztDQUNGLENBQUEifQ==