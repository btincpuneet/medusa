"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildReturnSummary = exports.fetchOrderContext = exports.normalizeSku = exports.toMajorUnits = void 0;
const pg_1 = require("../../../../lib/pg");
const toMajorUnits = (value) => {
    const amount = Number(value ?? 0);
    if (!Number.isFinite(amount)) {
        return 0;
    }
    return Number((amount / 100).toFixed(2));
};
exports.toMajorUnits = toMajorUnits;
const normalizeSku = (value, fallback) => {
    if (typeof value === "string" && value.trim().length) {
        return value.trim();
    }
    return fallback;
};
exports.normalizeSku = normalizeSku;
const fetchOrderContext = async (orderId, email) => {
    const pool = (0, pg_1.getPgPool)();
    const { rows: orderRows } = await pool.query(`
      SELECT id, email, status, billing_address_id, shipping_address_id
      FROM "order"
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `, [orderId]);
    const order = orderRows[0];
    if (!order) {
        throw {
            status: 404,
            message: "Order not found.",
        };
    }
    if (order.email && order.email.toLowerCase() !== email.toLowerCase()) {
        throw {
            status: 403,
            message: "Order does not belong to the supplied customer.",
        };
    }
    const { rows: itemRows } = await pool.query(`
      SELECT
        oi.order_id,
        oi.quantity,
        oli.id as line_item_id,
        oli.title,
        oli.thumbnail,
        oli.unit_price,
        COALESCE(oli.variant_sku, oli.product_id, oli.id::text) AS sku
      FROM order_item oi
      INNER JOIN order_line_item oli
        ON oi.item_id = oli.id
      WHERE oi.order_id = $1
        AND oi.deleted_at IS NULL
        AND oli.deleted_at IS NULL
      ORDER BY oli.title ASC, oli.id ASC
    `, [orderId]);
    let customerName = null;
    const addressId = order.billing_address_id ?? order.shipping_address_id;
    if (addressId) {
        const { rows: addressRows } = await pool.query(`
        SELECT first_name, last_name
        FROM order_address
        WHERE id = $1
        LIMIT 1
      `, [addressId]);
        if (addressRows[0]) {
            customerName = `${addressRows[0].first_name ?? ""} ${addressRows[0].last_name ?? ""}`.trim();
        }
    }
    return {
        order,
        items: itemRows,
        customerName: customerName && customerName.length ? customerName : order.email,
    };
};
exports.fetchOrderContext = fetchOrderContext;
const buildReturnSummary = async (orderId, email) => {
    const pool = (0, pg_1.getPgPool)();
    const { rows } = await pool.query(`
      SELECT
        sku,
        SUM(qty) AS returned_qty,
        MAX(created_at) AS last_returned_at
      FROM redington_order_return
      WHERE order_id = $1
        AND LOWER(user_email) = LOWER($2)
      GROUP BY sku
    `, [orderId, email]);
    const summary = new Map();
    rows.forEach((row) => {
        const qty = Number(row.returned_qty ?? 0);
        summary.set(row.sku, {
            qty: Number.isFinite(qty) ? qty : 0,
            last_returned_at: row.last_returned_at instanceof Date
                ? row.last_returned_at.toISOString()
                : row.last_returned_at ?? null,
        });
    });
    return summary;
};
exports.buildReturnSummary = buildReturnSummary;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9hcGkvcmVzdC9WMS9vcmRlci1yZXR1cm4vaGVscGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwyQ0FBOEM7QUFFdkMsTUFBTSxZQUFZLEdBQUcsQ0FBQyxLQUFVLEVBQUUsRUFBRTtJQUN6QyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFBO0lBQ2pDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDN0IsT0FBTyxDQUFDLENBQUE7SUFDVixDQUFDO0lBQ0QsT0FBTyxNQUFNLENBQUMsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDMUMsQ0FBQyxDQUFBO0FBTlksUUFBQSxZQUFZLGdCQU14QjtBQUVNLE1BQU0sWUFBWSxHQUFHLENBQUMsS0FBVSxFQUFFLFFBQWdCLEVBQUUsRUFBRTtJQUMzRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDckQsT0FBTyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDckIsQ0FBQztJQUNELE9BQU8sUUFBUSxDQUFBO0FBQ2pCLENBQUMsQ0FBQTtBQUxZLFFBQUEsWUFBWSxnQkFLeEI7QUFFTSxNQUFNLGlCQUFpQixHQUFHLEtBQUssRUFBRSxPQUFlLEVBQUUsS0FBYSxFQUFFLEVBQUU7SUFDeEUsTUFBTSxJQUFJLEdBQUcsSUFBQSxjQUFTLEdBQUUsQ0FBQTtJQUV4QixNQUFNLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FDMUM7Ozs7OztLQU1DLEVBQ0QsQ0FBQyxPQUFPLENBQUMsQ0FDVixDQUFB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