import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

function client() {
  return new Client({ connectionString: process.env.DATABASE_URL });
}


// ====================================
// GET – Fetch single order with complete relations by order ID
// ====================================

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { order_id } = req.params;
  const db = client();
  await db.connect();

  try {
    // Get main order
    const orderResult = await db.query(
      `SELECT * FROM mp_orders WHERE id = $1`,
      [order_id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const order = orderResult.rows[0];

    // Get all related data (same queries as above)
    const [
      itemsResult,
      addressesResult,
      paymentsResult,
      statusHistoryResult,
      shipmentsResult,
      settlementsResult
    ] = await Promise.all([
      db.query(
        `SELECT 
          oi.*,
          p.name as product_name,
          p.product_code,
          s.name as seller_name
         FROM mp_order_items oi
         LEFT JOIN mp_products p ON oi.product_id = p.id
         LEFT JOIN mp_sellers s ON oi.seller_id = s.id
         WHERE oi.order_id = $1`,
        [order_id]
      ),
      db.query(
        `SELECT * FROM mp_order_addresses WHERE order_id = $1`,
        [order_id]
      ),
      db.query(
        `SELECT * FROM mp_order_payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [order_id]
      ),
      db.query(
        `SELECT * FROM mp_order_status_history WHERE order_id = $1 ORDER BY created_at ASC`,
        [order_id]
      ),
      db.query(
        `SELECT 
          os.*,
          s.name as seller_name
         FROM mp_order_shipments os
         LEFT JOIN mp_sellers s ON os.seller_id = s.id
         WHERE os.order_id = $1`,
        [order_id]
      ),
      db.query(
        `SELECT * FROM mp_seller_order_settlements WHERE order_id = $1`,
        [order_id]
      )
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

  } catch (err) {
    await db.end();
    console.error("Order fetch error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: err.message
    });
  }
}
