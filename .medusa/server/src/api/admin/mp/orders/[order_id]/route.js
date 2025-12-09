"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const pg_1 = require("pg");
function client() {
    return new pg_1.Client({ connectionString: process.env.DATABASE_URL });
}
// ====================================
// GET – Fetch single order with complete relations by order ID
// ====================================
async function GET(req, res) {
    const { order_id } = req.params;
    const db = client();
    await db.connect();
    try {
        // Get main order
        const orderResult = await db.query(`SELECT * FROM mp_orders WHERE id = $1`, [order_id]);
        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }
        const order = orderResult.rows[0];
        // Get all related data (same queries as above)
        const [itemsResult, addressesResult, paymentsResult, statusHistoryResult, shipmentsResult, settlementsResult] = await Promise.all([
            db.query(`SELECT 
          oi.*,
          p.name as product_name,
          p.product_code,
          s.name as seller_name
         FROM mp_order_items oi
         LEFT JOIN mp_products p ON oi.product_id = p.id
         LEFT JOIN mp_sellers s ON oi.seller_id = s.id
         WHERE oi.order_id = $1`, [order_id]),
            db.query(`SELECT * FROM mp_order_addresses WHERE order_id = $1`, [order_id]),
            db.query(`SELECT * FROM mp_order_payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`, [order_id]),
            db.query(`SELECT * FROM mp_order_status_history WHERE order_id = $1 ORDER BY created_at ASC`, [order_id]),
            db.query(`SELECT 
          os.*,
          s.name as seller_name
         FROM mp_order_shipments os
         LEFT JOIN mp_sellers s ON os.seller_id = s.id
         WHERE os.order_id = $1`, [order_id]),
            db.query(`SELECT * FROM mp_seller_order_settlements WHERE order_id = $1`, [order_id])
        ]);
        await db.end();
        return res.json({
            success: true,
            order: {
                ...order,
                items: itemsResult.rows,
                addresses: addressesResult.rows,
                payment: paymentsResult.rows[0] || null,
                status_history: statusHistoryResult.rows,
                shipments: shipmentsResult.rows,
                settlements: settlementsResult.rows
            }
        });
    }
    catch (err) {
        await db.end();
        console.error("Order fetch error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch order details",
            error: err.message
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL21wL29yZGVycy9bb3JkZXJfaWRdL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBYUEsa0JBNkZDO0FBeEdELDJCQUE0QjtBQUU1QixTQUFTLE1BQU07SUFDYixPQUFPLElBQUksV0FBTSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO0FBQ3BFLENBQUM7QUFHRCx1Q0FBdUM7QUFDdkMsK0RBQStEO0FBQy9ELHVDQUF1QztBQUVoQyxLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7SUFDaEMsTUFBTSxFQUFFLEdBQUcsTUFBTSxFQUFFLENBQUM7SUFDcEIsTUFBTSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7SUFFbkIsSUFBSSxDQUFDO1FBQ0gsaUJBQWlCO1FBQ2pCLE1BQU0sV0FBVyxHQUFHLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FDaEMsdUNBQXVDLEVBQ3ZDLENBQUMsUUFBUSxDQUFDLENBQ1gsQ0FBQztRQUVGLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDbEMsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsT0FBTyxFQUFFLGlCQUFpQjthQUMzQixDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVsQywrQ0FBK0M7UUFDL0MsTUFBTSxDQUNKLFdBQVcsRUFDWCxlQUFlLEVBQ2YsY0FBYyxFQUNkLG1CQUFtQixFQUNuQixlQUFlLEVBQ2YsaUJBQWlCLENBQ2xCLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDO1lBQ3BCLEVBQUUsQ0FBQyxLQUFLLENBQ047Ozs7Ozs7O2dDQVF3QixFQUN4QixDQUFDLFFBQVEsQ0FBQyxDQUNYO1lBQ0QsRUFBRSxDQUFDLEtBQUssQ0FDTixzREFBc0QsRUFDdEQsQ0FBQyxRQUFRLENBQUMsQ0FDWDtZQUNELEVBQUUsQ0FBQyxLQUFLLENBQ04sc0ZBQXNGLEVBQ3RGLENBQUMsUUFBUSxDQUFDLENBQ1g7WUFDRCxFQUFFLENBQUMsS0FBSyxDQUNOLG1GQUFtRixFQUNuRixDQUFDLFFBQVEsQ0FBQyxDQUNYO1lBQ0QsRUFBRSxDQUFDLEtBQUssQ0FDTjs7Ozs7Z0NBS3dCLEVBQ3hCLENBQUMsUUFBUSxDQUFDLENBQ1g7WUFDRCxFQUFFLENBQUMsS0FBSyxDQUNOLCtEQUErRCxFQUMvRCxDQUFDLFFBQVEsQ0FBQyxDQUNYO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsTUFBTSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFZixPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDZCxPQUFPLEVBQUUsSUFBSTtZQUNiLEtBQUssRUFBRTtnQkFDTCxHQUFHLEtBQUs7Z0JBQ1IsS0FBSyxFQUFFLFdBQVcsQ0FBQyxJQUFJO2dCQUN2QixTQUFTLEVBQUUsZUFBZSxDQUFDLElBQUk7Z0JBQy9CLE9BQU8sRUFBRSxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUk7Z0JBQ3ZDLGNBQWMsRUFBRSxtQkFBbUIsQ0FBQyxJQUFJO2dCQUN4QyxTQUFTLEVBQUUsZUFBZSxDQUFDLElBQUk7Z0JBQy9CLFdBQVcsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJO2FBQ3BDO1NBQ0YsQ0FBQyxDQUFDO0lBRUwsQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDYixNQUFNLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDekMsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUsS0FBSztZQUNkLE9BQU8sRUFBRSwrQkFBK0I7WUFDeEMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxPQUFPO1NBQ25CLENBQUMsQ0FBQztJQUNMLENBQUM7QUFDSCxDQUFDIn0=