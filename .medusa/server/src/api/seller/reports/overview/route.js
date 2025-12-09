"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const check_permission_1 = require("../../utils/check-permission");
exports.GET = [
    (0, check_permission_1.checkPermission)("reports"),
    async (req, res) => {
        const sellerId = req.seller?.sellerId;
        const manager = req.scope.resolve("manager");
        try {
            const [{ total_orders = 0, total_revenue = 0 }] = await manager.query(`SELECT COUNT(*)::int AS total_orders, COALESCE(SUM(total),0) AS total_revenue FROM orders WHERE seller_id = $1`, [sellerId]);
            const topProducts = await manager.query(`SELECT product_id, SUM(quantity)::int as qty, SUM(total)::numeric as revenue
         FROM order_items WHERE seller_id = $1 GROUP BY product_id ORDER BY revenue DESC LIMIT 5`, [sellerId]);
            const last30DaysSales = await manager.query(`SELECT to_char(created_at::date, 'YYYY-MM-DD') AS day,
                SUM(total)::numeric AS revenue,
                COUNT(*)::int AS orders
         FROM orders
         WHERE seller_id = $1 AND created_at >= now() - interval '30 days'
         GROUP BY day ORDER BY day`, [sellerId]);
            return res.json({
                totalOrders: Number(total_orders),
                totalRevenue: Number(total_revenue),
                topProducts,
                last30DaysSales,
            });
        }
        catch {
            return res.json({
                totalOrders: 0,
                totalRevenue: 0,
                topProducts: [],
                last30DaysSales: [],
            });
        }
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3NlbGxlci9yZXBvcnRzL292ZXJ2aWV3L3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLG1FQUE4RDtBQUVqRCxRQUFBLEdBQUcsR0FBRztJQUNqQixJQUFBLGtDQUFlLEVBQUMsU0FBUyxDQUFDO0lBQzFCLEtBQUssRUFBRSxHQUFxQyxFQUFFLEdBQW1CLEVBQUUsRUFBRTtRQUNuRSxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQTtRQUNyQyxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQVEsQ0FBQTtRQUVuRCxJQUFJLENBQUM7WUFDSCxNQUFNLENBQUMsRUFBRSxZQUFZLEdBQUcsQ0FBQyxFQUFFLGFBQWEsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sT0FBTyxDQUFDLEtBQUssQ0FDbkUsZ0hBQWdILEVBQ2hILENBQUMsUUFBUSxDQUFDLENBQ1gsQ0FBQTtZQUVELE1BQU0sV0FBVyxHQUFHLE1BQU0sT0FBTyxDQUFDLEtBQUssQ0FDckM7aUdBQ3lGLEVBQ3pGLENBQUMsUUFBUSxDQUFDLENBQ1gsQ0FBQTtZQUVELE1BQU0sZUFBZSxHQUFHLE1BQU0sT0FBTyxDQUFDLEtBQUssQ0FDekM7Ozs7O21DQUsyQixFQUMzQixDQUFDLFFBQVEsQ0FBQyxDQUNYLENBQUE7WUFFRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7Z0JBQ2QsV0FBVyxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUM7Z0JBQ2pDLFlBQVksRUFBRSxNQUFNLENBQUMsYUFBYSxDQUFDO2dCQUNuQyxXQUFXO2dCQUNYLGVBQWU7YUFDaEIsQ0FBQyxDQUFBO1FBQ0osQ0FBQztRQUFDLE1BQU0sQ0FBQztZQUNQLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztnQkFDZCxXQUFXLEVBQUUsQ0FBQztnQkFDZCxZQUFZLEVBQUUsQ0FBQztnQkFDZixXQUFXLEVBQUUsRUFBRTtnQkFDZixlQUFlLEVBQUUsRUFBRTthQUNwQixDQUFDLENBQUE7UUFDSixDQUFDO0lBQ0gsQ0FBQztDQUNGLENBQUEifQ==