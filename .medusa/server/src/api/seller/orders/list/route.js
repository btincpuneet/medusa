"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const check_permission_1 = require("../../utils/check-permission");
exports.GET = [
    (0, check_permission_1.checkPermission)("orders"),
    async (req, res) => {
        const sellerId = req.seller?.sellerId;
        const limit = Number(req.query.limit || 20);
        const offset = Number(req.query.offset || 0);
        const manager = req.scope.resolve("manager");
        try {
            const rows = await manager.query(`SELECT * FROM orders WHERE seller_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, [sellerId, limit, offset]);
            const countRes = await manager.query(`SELECT COUNT(*)::int AS count FROM orders WHERE seller_id = $1`, [sellerId]);
            return res.json({
                orders: rows,
                count: countRes[0]?.count ?? 0,
                limit,
                offset,
            });
        }
        catch (e) {
            // Fallback if schema not present
            return res.json({
                orders: [],
                count: 0,
                limit,
                offset,
                message: "No seller-scoped orders found.",
            });
        }
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3NlbGxlci9vcmRlcnMvbGlzdC9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxtRUFBOEQ7QUFFakQsUUFBQSxHQUFHLEdBQUc7SUFDakIsSUFBQSxrQ0FBZSxFQUFDLFFBQVEsQ0FBQztJQUN6QixLQUFLLEVBQUUsR0FBcUMsRUFBRSxHQUFtQixFQUFFLEVBQUU7UUFDbkUsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUE7UUFDckMsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxDQUFBO1FBQzNDLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQTtRQUM1QyxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQVEsQ0FBQTtRQUVuRCxJQUFJLENBQUM7WUFDSCxNQUFNLElBQUksR0FBRyxNQUFNLE9BQU8sQ0FBQyxLQUFLLENBQzlCLHVGQUF1RixFQUN2RixDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQzFCLENBQUE7WUFDRCxNQUFNLFFBQVEsR0FBRyxNQUFNLE9BQU8sQ0FBQyxLQUFLLENBQ2xDLGdFQUFnRSxFQUNoRSxDQUFDLFFBQVEsQ0FBQyxDQUNYLENBQUE7WUFDRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7Z0JBQ2QsTUFBTSxFQUFFLElBQUk7Z0JBQ1osS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLElBQUksQ0FBQztnQkFDOUIsS0FBSztnQkFDTCxNQUFNO2FBQ1AsQ0FBQyxDQUFBO1FBQ0osQ0FBQztRQUFDLE9BQU8sQ0FBTSxFQUFFLENBQUM7WUFDaEIsaUNBQWlDO1lBQ2pDLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztnQkFDZCxNQUFNLEVBQUUsRUFBRTtnQkFDVixLQUFLLEVBQUUsQ0FBQztnQkFDUixLQUFLO2dCQUNMLE1BQU07Z0JBQ04sT0FBTyxFQUFFLGdDQUFnQzthQUMxQyxDQUFDLENBQUE7UUFDSixDQUFDO0lBQ0gsQ0FBQztDQUNGLENBQUEifQ==