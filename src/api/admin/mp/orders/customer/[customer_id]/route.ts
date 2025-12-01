import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

function client() {
  return new Client({ connectionString: process.env.DATABASE_URL });
}

// ====================================
// GET – Fetch customer orders with complete relations
// ====================================

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { customer_id } = req.params; // Changed from id to customer_id
  const db = client();
  await db.connect();

  try {
    // Get all orders for the customer
    const ordersResult = await db.query(
      `SELECT * FROM mp_orders WHERE customer_id = $1 ORDER BY created_at DESC`,
      [customer_id]
    );

    if (ordersResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found for this customer"
      });
    }

    const orders = ordersResult.rows;

    // For each order, fetch all related data
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const orderId = order.id;

        // 1. Get order items
        const itemsResult = await db.query(
          `SELECT 
            oi.*,
            p.name as product_name,
            p.product_code,
            s.name as seller_name
           FROM mp_order_items oi
           LEFT JOIN mp_products p ON oi.product_id = p.id
           LEFT JOIN mp_sellers s ON oi.seller_id = s.id
           WHERE oi.order_id = $1`,
          [orderId]
        );

        // 2. Get order addresses
        const addressesResult = await db.query(
          `SELECT * FROM mp_order_addresses WHERE order_id = $1`,
          [orderId]
        );

        // 3. Get payment information
        const paymentsResult = await db.query(
          `SELECT * FROM mp_order_payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`,
          [orderId]
        );

        // 4. Get status history
        const statusHistoryResult = await db.query(
          `SELECT * FROM mp_order_status_history WHERE order_id = $1 ORDER BY created_at ASC`,
          [orderId]
        );

        // 5. Get shipments
        const shipmentsResult = await db.query(
          `SELECT 
            os.*,
            s.name as seller_name
           FROM mp_order_shipments os
           LEFT JOIN mp_sellers s ON os.seller_id = s.id
           WHERE os.order_id = $1`,
          [orderId]
        );

        // 6. Get settlements (if needed)
        const settlementsResult = await db.query(
          `SELECT * FROM mp_seller_order_settlements WHERE order_id = $1`,
          [orderId]
        );

        return {
          ...order,
          items: itemsResult.rows,
          addresses: addressesResult.rows,
          payment: paymentsResult.rows[0] || null,
          status_history: statusHistoryResult.rows,
          shipments: shipmentsResult.rows,
          settlements: settlementsResult.rows
        };
      })
    );

    await db.end();

    return res.json({
      success: true,
      count: ordersWithDetails.length,
      orders: ordersWithDetails
    });

  } catch (err) {
    await db.end();
    console.error("Orders fetch error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer orders",
      error: err.message
    });
  }
}