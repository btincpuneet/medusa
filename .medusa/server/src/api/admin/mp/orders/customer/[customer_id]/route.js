"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const pg_1 = require("pg");
function client() {
    return new pg_1.Client({ connectionString: process.env.DATABASE_URL });
}
// ====================================
// GET – Fetch customer orders with complete relations
// ====================================
async function GET(req, res) {
    const { customer_id } = req.params; // Changed from id to customer_id
    const db = client();
    await db.connect();
    try {
        // Get all orders for the customer
        const ordersResult = await db.query(`SELECT * FROM mp_orders WHERE customer_id = $1 ORDER BY created_at DESC`, [customer_id]);
        if (ordersResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No orders found for this customer"
            });
        }
        const orders = ordersResult.rows;
        // For each order, fetch all related data
        const ordersWithDetails = await Promise.all(orders.map(async (order) => {
            const orderId = order.id;
            // 1. Get order items
            const itemsResult = await db.query(`SELECT 
            oi.*,
            p.name as product_name,
            p.product_code,
            s.name as seller_name
           FROM mp_order_items oi
           LEFT JOIN mp_products p ON oi.product_id = p.id
           LEFT JOIN mp_sellers s ON oi.seller_id = s.id
           WHERE oi.order_id = $1`, [orderId]);
            // 2. Get order addresses
            const addressesResult = await db.query(`SELECT * FROM mp_order_addresses WHERE order_id = $1`, [orderId]);
            // 3. Get payment information
            const paymentsResult = await db.query(`SELECT * FROM mp_order_payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`, [orderId]);
            // 4. Get status history
            const statusHistoryResult = await db.query(`SELECT * FROM mp_order_status_history WHERE order_id = $1 ORDER BY created_at ASC`, [orderId]);
            // 5. Get shipments
            const shipmentsResult = await db.query(`SELECT 
            os.*,
            s.name as seller_name
           FROM mp_order_shipments os
           LEFT JOIN mp_sellers s ON os.seller_id = s.id
           WHERE os.order_id = $1`, [orderId]);
            // 6. Get settlements (if needed)
            const settlementsResult = await db.query(`SELECT * FROM mp_seller_order_settlements WHERE order_id = $1`, [orderId]);
            return {
                ...order,
                items: itemsResult.rows,
                addresses: addressesResult.rows,
                payment: paymentsResult.rows[0] || null,
                status_history: statusHistoryResult.rows,
                shipments: shipmentsResult.rows,
                settlements: settlementsResult.rows
            };
        }));
        await db.end();
        return res.json({
            success: true,
            count: ordersWithDetails.length,
            orders: ordersWithDetails
        });
    }
    catch (err) {
        await db.end();
        console.error("Orders fetch error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch customer orders",
            error: err.message
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL21wL29yZGVycy9jdXN0b21lci9bY3VzdG9tZXJfaWRdL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBWUEsa0JBd0dDO0FBbEhELDJCQUE0QjtBQUU1QixTQUFTLE1BQU07SUFDYixPQUFPLElBQUksV0FBTSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO0FBQ3BFLENBQUM7QUFFRCx1Q0FBdUM7QUFDdkMsc0RBQXNEO0FBQ3RELHVDQUF1QztBQUVoQyxLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsTUFBTSxFQUFFLFdBQVcsRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxpQ0FBaUM7SUFDckUsTUFBTSxFQUFFLEdBQUcsTUFBTSxFQUFFLENBQUM7SUFDcEIsTUFBTSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7SUFFbkIsSUFBSSxDQUFDO1FBQ0gsa0NBQWtDO1FBQ2xDLE1BQU0sWUFBWSxHQUFHLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FDakMseUVBQXlFLEVBQ3pFLENBQUMsV0FBVyxDQUFDLENBQ2QsQ0FBQztRQUVGLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDbkMsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsT0FBTyxFQUFFLG1DQUFtQzthQUM3QyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQztRQUVqQyx5Q0FBeUM7UUFDekMsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQ3pDLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQ3pCLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFFekIscUJBQXFCO1lBQ3JCLE1BQU0sV0FBVyxHQUFHLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FDaEM7Ozs7Ozs7O2tDQVF3QixFQUN4QixDQUFDLE9BQU8sQ0FBQyxDQUNWLENBQUM7WUFFRix5QkFBeUI7WUFDekIsTUFBTSxlQUFlLEdBQUcsTUFBTSxFQUFFLENBQUMsS0FBSyxDQUNwQyxzREFBc0QsRUFDdEQsQ0FBQyxPQUFPLENBQUMsQ0FDVixDQUFDO1lBRUYsNkJBQTZCO1lBQzdCLE1BQU0sY0FBYyxHQUFHLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FDbkMsc0ZBQXNGLEVBQ3RGLENBQUMsT0FBTyxDQUFDLENBQ1YsQ0FBQztZQUVGLHdCQUF3QjtZQUN4QixNQUFNLG1CQUFtQixHQUFHLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FDeEMsbUZBQW1GLEVBQ25GLENBQUMsT0FBTyxDQUFDLENBQ1YsQ0FBQztZQUVGLG1CQUFtQjtZQUNuQixNQUFNLGVBQWUsR0FBRyxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQ3BDOzs7OztrQ0FLd0IsRUFDeEIsQ0FBQyxPQUFPLENBQUMsQ0FDVixDQUFDO1lBRUYsaUNBQWlDO1lBQ2pDLE1BQU0saUJBQWlCLEdBQUcsTUFBTSxFQUFFLENBQUMsS0FBSyxDQUN0QywrREFBK0QsRUFDL0QsQ0FBQyxPQUFPLENBQUMsQ0FDVixDQUFDO1lBRUYsT0FBTztnQkFDTCxHQUFHLEtBQUs7Z0JBQ1IsS0FBSyxFQUFFLFdBQVcsQ0FBQyxJQUFJO2dCQUN2QixTQUFTLEVBQUUsZUFBZSxDQUFDLElBQUk7Z0JBQy9CLE9BQU8sRUFBRSxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUk7Z0JBQ3ZDLGNBQWMsRUFBRSxtQkFBbUIsQ0FBQyxJQUFJO2dCQUN4QyxTQUFTLEVBQUUsZUFBZSxDQUFDLElBQUk7Z0JBQy9CLFdBQVcsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJO2FBQ3BDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FDSCxDQUFDO1FBRUYsTUFBTSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFZixPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDZCxPQUFPLEVBQUUsSUFBSTtZQUNiLEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxNQUFNO1lBQy9CLE1BQU0sRUFBRSxpQkFBaUI7U0FDMUIsQ0FBQyxDQUFDO0lBRUwsQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDYixNQUFNLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMscUJBQXFCLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDMUMsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUsS0FBSztZQUNkLE9BQU8sRUFBRSxpQ0FBaUM7WUFDMUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxPQUFPO1NBQ25CLENBQUMsQ0FBQztJQUNMLENBQUM7QUFDSCxDQUFDIn0=