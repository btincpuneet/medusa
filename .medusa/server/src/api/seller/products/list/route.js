"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const check_permission_1 = require("../../utils/check-permission");
exports.GET = [
    (0, check_permission_1.checkPermission)("products"),
    async (req, res) => {
        const sellerId = req.seller?.sellerId;
        const limit = Number(req.query.limit || 20);
        const offset = Number(req.query.offset || 0);
        const manager = req.scope.resolve("manager");
        try {
            const rows = await manager.query(`SELECT * FROM products WHERE seller_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, [sellerId, limit, offset]);
            const countRes = await manager.query(`SELECT COUNT(*)::int AS count FROM products WHERE seller_id = $1`, [sellerId]);
            return res.json({
                products: rows,
                count: countRes[0]?.count ?? 0,
                limit,
                offset,
            });
        }
        catch {
            return res.json({
                products: [],
                count: 0,
                limit,
                offset,
                message: "No seller-scoped products found.",
            });
        }
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3NlbGxlci9wcm9kdWN0cy9saXN0L3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLG1FQUE4RDtBQUVqRCxRQUFBLEdBQUcsR0FBRztJQUNqQixJQUFBLGtDQUFlLEVBQUMsVUFBVSxDQUFDO0lBQzNCLEtBQUssRUFBRSxHQUFxQyxFQUFFLEdBQW1CLEVBQUUsRUFBRTtRQUNuRSxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQTtRQUNyQyxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLENBQUE7UUFDM0MsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFBO1FBQzVDLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBUSxDQUFBO1FBRW5ELElBQUksQ0FBQztZQUNILE1BQU0sSUFBSSxHQUFHLE1BQU0sT0FBTyxDQUFDLEtBQUssQ0FDOUIseUZBQXlGLEVBQ3pGLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FDMUIsQ0FBQTtZQUNELE1BQU0sUUFBUSxHQUFHLE1BQU0sT0FBTyxDQUFDLEtBQUssQ0FDbEMsa0VBQWtFLEVBQ2xFLENBQUMsUUFBUSxDQUFDLENBQ1gsQ0FBQTtZQUNELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztnQkFDZCxRQUFRLEVBQUUsSUFBSTtnQkFDZCxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssSUFBSSxDQUFDO2dCQUM5QixLQUFLO2dCQUNMLE1BQU07YUFDUCxDQUFDLENBQUE7UUFDSixDQUFDO1FBQUMsTUFBTSxDQUFDO1lBQ1AsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDO2dCQUNkLFFBQVEsRUFBRSxFQUFFO2dCQUNaLEtBQUssRUFBRSxDQUFDO2dCQUNSLEtBQUs7Z0JBQ0wsTUFBTTtnQkFDTixPQUFPLEVBQUUsa0NBQWtDO2FBQzVDLENBQUMsQ0FBQTtRQUNKLENBQUM7SUFDSCxDQUFDO0NBQ0YsQ0FBQSJ9