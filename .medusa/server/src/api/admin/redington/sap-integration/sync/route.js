"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const redington_sap_integration_1 = require("../../../../../modules/redington-sap-integration");
const POST = async (req, res) => {
    const service = (0, redington_sap_integration_1.resolveSapIntegrationService)(req.scope);
    const actorId = req.auth_user?.id ??
        req.user?.id ??
        "admin:redington-sap";
    const body = (req.body || {});
    const orderId = typeof body.order_id === "string" ? body.order_id : null;
    try {
        const log = await service.triggerSync({
            orderId,
            actorId,
            runType: "manual",
        });
        return res.status(202).json({
            message: orderId
                ? `Order ${orderId} queued for SAP sync`
                : "SAP stock sync queued",
            log_id: log.id,
        });
    }
    catch (error) {
        return res.status(502).json({
            message: error?.message ?? "Failed to trigger SAP sync",
        });
    }
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9zYXAtaW50ZWdyYXRpb24vc3luYy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFLQSxnR0FBK0Y7QUFNeEYsTUFBTSxJQUFJLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ3BFLE1BQU0sT0FBTyxHQUFHLElBQUEsd0RBQTRCLEVBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQ3ZELE1BQU0sT0FBTyxHQUNWLEdBQVcsQ0FBQyxTQUFTLEVBQUUsRUFBRTtRQUN6QixHQUFXLENBQUMsSUFBSSxFQUFFLEVBQUU7UUFDckIscUJBQXFCLENBQUE7SUFFdkIsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBb0IsQ0FBQTtJQUNoRCxNQUFNLE9BQU8sR0FBRyxPQUFPLElBQUksQ0FBQyxRQUFRLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUE7SUFFeEUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxHQUFHLEdBQUcsTUFBTSxPQUFPLENBQUMsV0FBVyxDQUFDO1lBQ3BDLE9BQU87WUFDUCxPQUFPO1lBQ1AsT0FBTyxFQUFFLFFBQVE7U0FDbEIsQ0FBQyxDQUFBO1FBRUYsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUsT0FBTztnQkFDZCxDQUFDLENBQUMsU0FBUyxPQUFPLHNCQUFzQjtnQkFDeEMsQ0FBQyxDQUFDLHVCQUF1QjtZQUMzQixNQUFNLEVBQUUsR0FBRyxDQUFDLEVBQUU7U0FDZixDQUFDLENBQUE7SUFDSixDQUFDO0lBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztRQUNwQixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBTyxJQUFJLDRCQUE0QjtTQUN4RCxDQUFDLENBQUE7SUFDSixDQUFDO0FBQ0gsQ0FBQyxDQUFBO0FBNUJZLFFBQUEsSUFBSSxRQTRCaEIifQ==