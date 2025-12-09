"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const service_1 = require("../../../../models/service");
const admin_auth_1 = require("../../../utils/admin-auth");
exports.GET = [
    admin_auth_1.ensureAdmin,
    async (req, res) => {
        const manager = req.scope.resolve("manager");
        const services = await manager.getRepository(service_1.Service).find({
            order: { created_at: "DESC" },
        });
        return res.json({ services });
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3NlcnZpY2VzL2xpc3Qvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsd0RBQW9EO0FBQ3BELDBEQUF1RDtBQUUxQyxRQUFBLEdBQUcsR0FBRztJQUNqQix3QkFBVztJQUNYLEtBQUssRUFBRSxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtRQUNoRCxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQVEsQ0FBQTtRQUNuRCxNQUFNLFFBQVEsR0FBRyxNQUFNLE9BQU8sQ0FBQyxhQUFhLENBQUMsaUJBQU8sQ0FBQyxDQUFDLElBQUksQ0FBQztZQUN6RCxLQUFLLEVBQUUsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFO1NBQzlCLENBQUMsQ0FBQTtRQUVGLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUE7SUFDL0IsQ0FBQztDQUNGLENBQUEifQ==