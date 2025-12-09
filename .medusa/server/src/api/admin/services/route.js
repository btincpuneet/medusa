"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.GET = void 0;
const service_1 = require("../../../models/service");
const admin_auth_1 = require("../../utils/admin-auth");
exports.GET = [
    admin_auth_1.ensureAdmin,
    async (req, res) => {
        const services = await req.scope.resolve("manager")
            .getRepository(service_1.Service)
            .find({ order: { created_at: "DESC" } });
        return res.json({ services });
    },
];
exports.POST = [
    admin_auth_1.ensureAdmin,
    async (req, res) => {
        const { code, name, description, route_path, icon_name, is_active = true } = req.body || {};
        if (!code || !name) {
            return res.status(400).json({ message: "code and name are required" });
        }
        const repo = req.scope.resolve("manager").getRepository(service_1.Service);
        const existing = await repo.findOne({ where: { code } });
        if (existing) {
            return res.status(409).json({ message: "Service code already exists" });
        }
        const saved = await repo.save(repo.create({ code, name, description, route_path, icon_name, is_active }));
        return res.status(201).json({ service: saved });
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3NlcnZpY2VzL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLHFEQUFpRDtBQUNqRCx1REFBb0Q7QUFFdkMsUUFBQSxHQUFHLEdBQUc7SUFDakIsd0JBQVc7SUFDWCxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7UUFDbEQsTUFBTSxRQUFRLEdBQUcsTUFBTyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQVM7YUFDekQsYUFBYSxDQUFDLGlCQUFPLENBQUM7YUFDdEIsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUMxQyxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFBO0lBQzdCLENBQUM7Q0FDRixDQUFBO0FBRVksUUFBQSxJQUFJLEdBQUc7SUFDbEIsd0JBQVc7SUFDWCxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7UUFDbEQsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsU0FBUyxHQUFHLElBQUksRUFBRSxHQUN2RSxHQUFHLENBQUMsSUFBWSxJQUFJLEVBQUUsQ0FBQTtRQUN6QixJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbkIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSw0QkFBNEIsRUFBRSxDQUFDLENBQUE7UUFDeEUsQ0FBQztRQUNELE1BQU0sSUFBSSxHQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBUyxDQUFDLGFBQWEsQ0FBQyxpQkFBTyxDQUFDLENBQUE7UUFDekUsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQ3hELElBQUksUUFBUSxFQUFFLENBQUM7WUFDYixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLDZCQUE2QixFQUFFLENBQUMsQ0FBQTtRQUN6RSxDQUFDO1FBQ0QsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUMzQixJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUMzRSxDQUFBO1FBQ0QsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO0lBQy9DLENBQUM7Q0FDRixDQUFBIn0=