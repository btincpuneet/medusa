"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.OPTIONS = void 0;
const helpers_1 = require("../order-return/helpers");
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
    res.header("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");
};
const OPTIONS = async (req, res) => {
    setCors(req, res);
    res.status(204).send();
};
exports.OPTIONS = OPTIONS;
const POST = async (req, res) => {
    setCors(req, res);
    const body = req.body || {};
    const email = String(body.customer_email || body.email || "").trim();
    const orderId = String(body.orderId || body.order_id || "").trim();
    if (!email.length || !orderId.length) {
        return res.status(400).json({
            message: "customer_email and orderId are required.",
        });
    }
    try {
        const { order, items } = await (0, helpers_1.fetchOrderContext)(orderId, email);
        const summaryMap = await (0, helpers_1.buildReturnSummary)(orderId, email);
        const orderStatus = (order.status || "").toLowerCase();
        const canReturnStatus = orderStatus === "invoiced";
        const response = items.map((item) => {
            const sku = (0, helpers_1.normalizeSku)(item.sku, `item_${item.line_item_id}`);
            const quantity = Number(item.quantity ?? 0) || 0;
            const unitPrice = Number(item.unit_price ?? 0);
            const totalPriceMinor = unitPrice * quantity;
            const summary = summaryMap.get(sku);
            const returnedQty = summary?.qty ?? 0;
            const remainingQty = Math.max(0, quantity - returnedQty);
            return {
                sku,
                product_name: item.title ?? sku,
                image: item.thumbnail ?? null,
                qty: quantity,
                unit_price: (0, helpers_1.toMajorUnits)(unitPrice),
                total_price: (0, helpers_1.toMajorUnits)(totalPriceMinor),
                return_date: summary?.last_returned_at ?? null,
                can_return: canReturnStatus && remainingQty > 0 ? "yes" : "no",
                returned_qty: returnedQty,
            };
        });
        if (!response.length) {
            return res.json([]);
        }
        return res.json(response);
    }
    catch (error) {
        if (error?.status) {
            return res.status(error.status).json({ message: error.message });
        }
        return res.status(500).json({
            message: error?.message || "Failed to evaluate order return eligibility.",
        });
    }
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvY2hlY2tPcmRlclJldHVybi9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSxxREFLZ0M7QUFFaEMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUMxRCxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQTtJQUNqQyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ1gsR0FBRyxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUNqRCxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUM5QixDQUFDO1NBQU0sQ0FBQztRQUNOLEdBQUcsQ0FBQyxNQUFNLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDaEQsQ0FBQztJQUVELEdBQUcsQ0FBQyxNQUFNLENBQ1IsOEJBQThCLEVBQzlCLEdBQUcsQ0FBQyxPQUFPLENBQUMsZ0NBQWdDLENBQUM7UUFDM0MsNkJBQTZCLENBQ2hDLENBQUE7SUFDRCxHQUFHLENBQUMsTUFBTSxDQUFDLDhCQUE4QixFQUFFLGNBQWMsQ0FBQyxDQUFBO0lBQzFELEdBQUcsQ0FBQyxNQUFNLENBQUMsa0NBQWtDLEVBQUUsTUFBTSxDQUFDLENBQUE7QUFDeEQsQ0FBQyxDQUFBO0FBR00sTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ3ZFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDakIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtBQUN4QixDQUFDLENBQUE7QUFIWSxRQUFBLE9BQU8sV0FHbkI7QUFFTSxNQUFNLElBQUks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