"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.GET = void 0;
const seller_service_1 = require("../../../services/seller-service");
const seller_permission_service_1 = require("../../../services/seller-permission-service");
const admin_auth_1 = require("../../utils/admin-auth");
const service_1 = require("../../../models/service");
const seller_service_2 = require("../../../models/seller-service");
// Lists seller/vendor accounts so Super Admins can assign services and plans.
exports.GET = [
    admin_auth_1.ensureAdmin,
    async (req, res) => {
        const sellerService = seller_service_1.SellerService.fromRequest(req);
        const sellers = await sellerService.listAll();
        const permissions = new seller_permission_service_1.SellerPermissionService(req.scope.resolve("manager"));
        const enriched = await Promise.all(sellers.map(async (s) => ({
            ...s,
            allowed_services: await permissions.listAllowedCodes(s.id),
        })));
        return res.json({ sellers: enriched });
    },
];
exports.POST = [
    admin_auth_1.ensureAdmin,
    async (req, res) => {
        const body = req.body || {};
        const { vendor_name, contact_name, email, password, phone, role = "OWNER", subscription_plan = "FREE", status = "active", allowedServices = [], } = body;
        if (!vendor_name || !contact_name || !email || !password) {
            return res
                .status(400)
                .json({ message: "vendor_name, contact_name, email, password are required" });
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
            return res
                .status(400)
                .json({ message: e?.message || "Unable to create seller" });
        }
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3NlbGxlcnMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEscUVBQWdFO0FBQ2hFLDJGQUFxRjtBQUNyRix1REFBb0Q7QUFDcEQscURBQWlEO0FBQ2pELG1FQUFrRjtBQUVsRiw4RUFBOEU7QUFDakUsUUFBQSxHQUFHLEdBQUc7SUFDakIsd0JBQVc7SUFDWCxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7UUFDaEQsTUFBTSxhQUFhLEdBQUcsOEJBQWEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDcEQsTUFBTSxPQUFPLEdBQUcsTUFBTSxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUE7UUFDN0MsTUFBTSxXQUFXLEdBQUcsSUFBSSxtREFBdUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFBO1FBQzdFLE1BQU0sUUFBUSxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FDaEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3hCLEdBQUcsQ0FBQztZQUNKLGdCQUFnQixFQUFFLE1BQU0sV0FBVyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7U0FDM0QsQ0FBQyxDQUFDLENBQ0osQ0FBQTtRQUVELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFBO0lBQ3hDLENBQUM7Q0FDRixDQUFBO0FBRVksUUFBQSxJQUFJLEdBQUc7SUFDbEIsd0JBQVc7SUFDWCxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7UUFDaEQsTUFBTSxJQUFJLEdBQUksR0FBRyxDQUFDLElBQVksSUFBSSxFQUFFLENBQUE7UUFDcEMsTUFBTSxFQUNKLFdBQVcsRUFDWCxZQUFZLEVBQ1osS0FBSyxFQUNMLFFBQVEsRUFDUixLQUFLLEVBQ0wsSUFBSSxHQUFHLE9BQU8sRUFDZCxpQkFBaUIsR0FBRyxNQUFNLEVBQzFCLE1BQU0sR0FBRyxRQUFRLEVBQ2pCLGVBQWUsR0FBRyxFQUFFLEdBQ3JCLEdBQUcsSUFBSSxDQUFBO1FBRVIsSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLFlBQVksSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3pELE9BQU8sR0FBRztpQkFDUCxNQUFNLENBQUMsR0FBRyxDQUFDO2lCQUNYLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSx5REFBeUQsRUFBRSxDQUFDLENBQUE7UUFDakYsQ0FBQztRQUVELE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBUSxDQUFBO1FBQ25ELE1BQU0sU0FBUyxHQUFHLElBQUksOEJBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUU1QyxJQUFJLENBQUM7WUFDSCxNQUFNLE1BQU0sR0FBRyxNQUFNLFNBQVMsQ0FBQyxZQUFZLENBQUM7Z0JBQzFDLFdBQVc7Z0JBQ1gsWUFBWTtnQkFDWixJQUFJLEVBQUUsV0FBVztnQkFDakIsS0FBSztnQkFDTCxRQUFRO2dCQUNSLEtBQUs7Z0JBQ0wsSUFBSTtnQkFDSixpQkFBaUI7Z0JBQ2pCLE1BQU07YUFDUCxDQUFDLENBQUE7WUFFRixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLElBQUksZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUM3RCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLGlCQUFPLENBQUMsQ0FBQTtnQkFDbEQsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyw4QkFBZ0IsQ0FBQyxDQUFBO2dCQUN2RCxNQUFNLFFBQVEsR0FBRyxNQUFNLFdBQVcsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsZUFBc0IsRUFBRSxDQUFDLENBQUE7Z0JBQzNFLE1BQU0sT0FBTyxDQUFDLElBQUksQ0FDaEIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQ25CLE9BQU8sQ0FBQyxNQUFNLENBQUM7b0JBQ2IsU0FBUyxFQUFFLE1BQU0sQ0FBQyxFQUFFO29CQUNwQixVQUFVLEVBQUUsR0FBRyxDQUFDLEVBQUU7aUJBQ25CLENBQUMsQ0FDSCxDQUNGLENBQUE7WUFDSCxDQUFDO1lBRUQsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUE7UUFDekMsQ0FBQztRQUFDLE9BQU8sQ0FBTSxFQUFFLENBQUM7WUFDaEIsT0FBTyxHQUFHO2lCQUNQLE1BQU0sQ0FBQyxHQUFHLENBQUM7aUJBQ1gsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxPQUFPLElBQUkseUJBQXlCLEVBQUUsQ0FBQyxDQUFBO1FBQy9ELENBQUM7SUFDSCxDQUFDO0NBQ0YsQ0FBQSJ9