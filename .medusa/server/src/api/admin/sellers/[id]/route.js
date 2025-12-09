"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELETE = exports.PUT = exports.GET = void 0;
const seller_1 = require("../../../../models/seller");
const seller_service_1 = require("../../../../models/seller-service");
const service_1 = require("../../../../models/service");
const admin_auth_1 = require("../../../utils/admin-auth");
exports.GET = [
    admin_auth_1.ensureAdmin,
    async (req, res) => {
        const repo = req.scope.resolve("manager").getRepository(seller_1.Seller);
        const seller = await repo.findOne({ where: { id: req.params.id } });
        if (!seller) {
            return res.status(404).json({ message: "Seller not found" });
        }
        return res.json({ seller });
    },
];
exports.PUT = [
    admin_auth_1.ensureAdmin,
    async (req, res) => {
        const manager = req.scope.resolve("manager");
        const repo = manager.getRepository(seller_1.Seller);
        const seller = await repo.findOne({ where: { id: req.params.id } });
        if (!seller) {
            return res.status(404).json({ message: "Seller not found" });
        }
        Object.assign(seller, req.body || {});
        const saved = await repo.save(seller);
        // Optionally update allowed services when provided
        const allowedServices = req.body?.allowedServices || [];
        if (Array.isArray(allowedServices)) {
            const serviceRepo = manager.getRepository(service_1.Service);
            const mapRepo = manager.getRepository(seller_service_1.SellerService);
            await mapRepo.delete({ seller_id: saved.id });
            if (allowedServices.length) {
                const services = await serviceRepo.findBy({ code: allowedServices });
                await mapRepo.save(services.map((svc) => mapRepo.create({
                    seller_id: saved.id,
                    service_id: svc.id,
                })));
            }
        }
        return res.json({ seller: saved });
    },
];
exports.DELETE = [
    admin_auth_1.ensureAdmin,
    async (req, res) => {
        const repo = req.scope.resolve("manager").getRepository(seller_1.Seller);
        await repo.delete({ id: req.params.id });
        return res.json({ success: true });
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3NlbGxlcnMvW2lkXS9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxzREFBa0Q7QUFDbEQsc0VBQXFGO0FBQ3JGLHdEQUFvRDtBQUNwRCwwREFBdUQ7QUFFMUMsUUFBQSxHQUFHLEdBQUc7SUFDakIsd0JBQVc7SUFDWCxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7UUFDaEQsTUFBTSxJQUFJLEdBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFTLENBQUMsYUFBYSxDQUFDLGVBQU0sQ0FBQyxDQUFBO1FBQ3hFLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUNuRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDWixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLGtCQUFrQixFQUFFLENBQUMsQ0FBQTtRQUM5RCxDQUFDO1FBQ0QsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQTtJQUM3QixDQUFDO0NBQ0YsQ0FBQTtBQUVZLFFBQUEsR0FBRyxHQUFHO0lBQ2pCLHdCQUFXO0lBQ1gsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO1FBQ2hELE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBUSxDQUFBO1FBQ25ELE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsZUFBTSxDQUFDLENBQUE7UUFDMUMsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQ25FLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNaLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQyxDQUFBO1FBQzlELENBQUM7UUFFRCxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRyxHQUFHLENBQUMsSUFBWSxJQUFJLEVBQUUsQ0FBQyxDQUFBO1FBQzlDLE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUVyQyxtREFBbUQ7UUFDbkQsTUFBTSxlQUFlLEdBQUssR0FBRyxDQUFDLElBQVksRUFBRSxlQUE0QixJQUFJLEVBQUUsQ0FBQTtRQUM5RSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQztZQUNuQyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLGlCQUFPLENBQUMsQ0FBQTtZQUNsRCxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLDhCQUFnQixDQUFDLENBQUE7WUFDdkQsTUFBTSxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQzdDLElBQUksZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMzQixNQUFNLFFBQVEsR0FBRyxNQUFNLFdBQVcsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsZUFBc0IsRUFBRSxDQUFDLENBQUE7Z0JBQzNFLE1BQU0sT0FBTyxDQUFDLElBQUksQ0FDaEIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQ25CLE9BQU8sQ0FBQyxNQUFNLENBQUM7b0JBQ2IsU0FBUyxFQUFFLEtBQUssQ0FBQyxFQUFFO29CQUNuQixVQUFVLEVBQUUsR0FBRyxDQUFDLEVBQUU7aUJBQ25CLENBQUMsQ0FDSCxDQUNGLENBQUE7WUFDSCxDQUFDO1FBQ0gsQ0FBQztRQUVELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO0lBQ3BDLENBQUM7Q0FDRixDQUFBO0FBRVksUUFBQSxNQUFNLEdBQUc7SUFDcEIsd0JBQVc7SUFDWCxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7UUFDaEQsTUFBTSxJQUFJLEdBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFTLENBQUMsYUFBYSxDQUFDLGVBQU0sQ0FBQyxDQUFBO1FBQ3hFLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDeEMsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7SUFDcEMsQ0FBQztDQUNGLENBQUEifQ==