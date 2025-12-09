"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellerPermissionService = void 0;
const service_1 = require("../models/service");
const seller_service_repository_1 = require("../repositories/seller-service-repository");
class SellerPermissionService {
    constructor(manager) {
        this.manager = manager;
    }
    async listAllowedCodes(sellerId) {
        const repo = (0, seller_service_repository_1.getSellerServiceRepository)(this.manager);
        const rows = await repo
            .createQueryBuilder("ss")
            .leftJoin(service_1.Service, "s", "s.id = ss.service_id")
            .where("ss.seller_id = :sellerId", { sellerId })
            .andWhere("s.is_active = true")
            .select("s.code", "code")
            .getRawMany();
        return rows.map((r) => r.code).filter(Boolean);
    }
}
exports.SellerPermissionService = SellerPermissionService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsbGVyLXBlcm1pc3Npb24tc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9zZWxsZXItcGVybWlzc2lvbi1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLCtDQUEyQztBQUMzQyx5RkFBc0Y7QUFFdEYsTUFBYSx1QkFBdUI7SUFDbEMsWUFBb0IsT0FBc0I7UUFBdEIsWUFBTyxHQUFQLE9BQU8sQ0FBZTtJQUFHLENBQUM7SUFFOUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFFBQWdCO1FBQ3JDLE1BQU0sSUFBSSxHQUFHLElBQUEsc0RBQTBCLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ3JELE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSTthQUNwQixrQkFBa0IsQ0FBQyxJQUFJLENBQUM7YUFDeEIsUUFBUSxDQUFDLGlCQUFPLEVBQUUsR0FBRyxFQUFFLHNCQUFzQixDQUFDO2FBQzlDLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxFQUFFLFFBQVEsRUFBRSxDQUFDO2FBQy9DLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQzthQUM5QixNQUFNLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQzthQUN4QixVQUFVLEVBQUUsQ0FBQTtRQUVmLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUNoRCxDQUFDO0NBQ0Y7QUFmRCwwREFlQyJ9