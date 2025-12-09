"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const service_1 = require("../../../../models/service");
const admin_auth_1 = require("../../../utils/admin-auth");
exports.POST = [
    admin_auth_1.ensureAdmin,
    async (req, res) => {
        const { code, name, description, route_path, icon_name, is_active = true, } = req.body || {};
        if (!code || !name) {
            return res.status(400).json({ message: "code and name are required" });
        }
        const manager = req.scope.resolve("manager");
        const repo = manager.getRepository(service_1.Service);
        const existing = await repo.findOne({ where: { code } });
        if (existing) {
            return res.status(409).json({ message: "Service code already exists" });
        }
        const saved = await repo.save(repo.create({ code, name, description, route_path, icon_name, is_active }));
        return res.status(201).json({ service: saved });
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3NlcnZpY2VzL2NyZWF0ZS9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSx3REFBb0Q7QUFDcEQsMERBQXVEO0FBRTFDLFFBQUEsSUFBSSxHQUFHO0lBQ2xCLHdCQUFXO0lBQ1gsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO1FBQ2hELE1BQU0sRUFDSixJQUFJLEVBQ0osSUFBSSxFQUNKLFdBQVcsRUFDWCxVQUFVLEVBQ1YsU0FBUyxFQUNULFNBQVMsR0FBRyxJQUFJLEdBQ2pCLEdBQUksR0FBRyxDQUFDLElBQVksSUFBSSxFQUFFLENBQUE7UUFFM0IsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ25CLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsNEJBQTRCLEVBQUUsQ0FBQyxDQUFBO1FBQ3hFLENBQUM7UUFFRCxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQVEsQ0FBQTtRQUNuRCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLGlCQUFPLENBQUMsQ0FBQTtRQUMzQyxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDeEQsSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUNiLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsNkJBQTZCLEVBQUUsQ0FBQyxDQUFBO1FBQ3pFLENBQUM7UUFFRCxNQUFNLEtBQUssR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQzNCLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQzNFLENBQUE7UUFFRCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7SUFDakQsQ0FBQztDQUNGLENBQUEifQ==