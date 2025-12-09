"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = exports.OPTIONS = void 0;
const pg_1 = require("../../../../lib/pg");
const pg_2 = require("../../../../lib/pg");
const setCors = (req, res) => {
    const origin = req.headers.origin;
    if (origin) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Vary", "Origin");
    }
    else {
        res.header("Access-Control-Allow-Origin", "*");
    }
    res.header("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] ||
        "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");
};
const OPTIONS = async (req, res) => {
    setCors(req, res);
    res.status(204).send();
};
exports.OPTIONS = OPTIONS;
const buildImageMap = async (returns) => {
    const orderIds = Array.from(new Set(returns
        .map((r) => r.order_id)
        .filter((id) => typeof id === "string" && id.length)));
    if (!orderIds.length) {
        return new Map();
    }
    const { rows } = await (0, pg_2.getPgPool)().query(`
      SELECT
        oi.order_id,
        COALESCE(oli.variant_sku, oli.product_id, oli.id::text) AS sku,
        oli.thumbnail
      FROM order_item oi
      INNER JOIN order_line_item oli
        ON oi.item_id = oli.id
      WHERE oi.order_id = ANY($1::text[])
        AND oi.deleted_at IS NULL
        AND oli.deleted_at IS NULL
    `, [orderIds]);
    const map = new Map();
    for (const row of rows) {
        const key = `${row.order_id}::${row.sku}`;
        map.set(key, typeof row.thumbnail === "string" ? row.thumbnail : null);
    }
    return map;
};
const GET = async (req, res) => {
    setCors(req, res);
    const email = (req.query.customer_email ||
        req.query.email ||
        req.query.user_email ||
        "")?.toString().trim() ?? "";
    if (!email.length) {
        return res.status(400).json({ message: "customer_email is required" });
    }
    try {
        const returns = await (0, pg_1.listOrderReturnsByEmail)(email);
        if (!returns.length) {
            return res.json([]);
        }
        const imageMap = await buildImageMap(returns);
        const payload = returns.map((entry) => {
            const key = `${entry.order_id}::${entry.sku}`;
            return {
                id: entry.id,
                order_id: entry.order_id,
                user_name: entry.user_name,
                user_email: entry.user_email,
                sku: entry.sku,
                product_name: entry.product_name,
                qty: entry.qty,
                price: entry.price,
                order_status: entry.order_status,
                return_status: entry.return_status,
                remarks: entry.remarks,
                created_at: entry.created_at,
                updated_at: entry.updated_at,
                image: imageMap.get(key) ?? null,
            };
        });
        return res.json(payload);
    }
    catch (error) {
        return res.status(500).json({
            message: error?.message || "Failed to load return requests.",
        });
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvcmV0dXJuVmlldy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSwyQ0FHMkI7QUFDM0IsMkNBQThDO0FBRTlDLE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDMUQsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7SUFDakMsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUNYLEdBQUcsQ0FBQyxNQUFNLENBQUMsNkJBQTZCLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFDakQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDOUIsQ0FBQztTQUFNLENBQUM7UUFDTixHQUFHLENBQUMsTUFBTSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ2hELENBQUM7SUFFRCxHQUFHLENBQUMsTUFBTSxDQUNSLDhCQUE4QixFQUM5QixHQUFHLENBQUMsT0FBTyxDQUFDLGdDQUFnQyxDQUFDO1FBQzNDLDZCQUE2QixDQUNoQyxDQUFBO0lBQ0QsR0FBRyxDQUFDLE1BQU0sQ0FBQyw4QkFBOEIsRUFBRSxhQUFhLENBQUMsQ0FBQTtJQUN6RCxHQUFHLENBQUMsTUFBTSxDQUFDLGtDQUFrQyxFQUFFLE1BQU0sQ0FBQyxDQUFBO0FBQ3hELENBQUMsQ0FBQTtBQUVNLE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUN2RSxPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ2pCLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7QUFDeEIsQ0FBQyxDQUFBO0FBSFksUUFBQSxPQUFPLFdBR25CO0FBRUQsTUFB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