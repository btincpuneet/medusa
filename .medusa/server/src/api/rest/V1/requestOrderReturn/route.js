"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.OPTIONS = void 0;
const pg_1 = require("../../../../lib/pg");
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
const resolveSkuKey = (input, fallback) => {
    return ((0, helpers_1.normalizeSku)(input.skuId ?? input.sku ?? input.sku_id, fallback) || fallback);
};
const resolveQty = (input) => {
    const qty = Number(input.qty ?? input.quantity ?? input.return_qty ?? 0);
    return Math.trunc(qty);
};
const OPTIONS = async (req, res) => {
    setCors(req, res);
    res.status(204).send();
};
exports.OPTIONS = OPTIONS;
const POST = async (req, res) => {
    setCors(req, res);
    const body = (req.body || {});
    const email = String(body.customer_email || body.email || "").trim();
    const orderId = String(body.orderId || body.order_id || "").trim();
    const remark = typeof body.remark === "string" && body.remark.trim().length
        ? body.remark.trim()
        : null;
    if (!email.length || !orderId.length) {
        return res.status(400).json({
            message: "customer_email and orderId are required.",
        });
    }
    if (!Array.isArray(body.products) || !body.products.length) {
        return res.status(400).json({
            message: "products array is required.",
        });
    }
    try {
        const { order, items, customerName } = await (0, helpers_1.fetchOrderContext)(orderId, email);
        const orderStatus = (order.status || "").toLowerCase();
        if (orderStatus !== "invoiced") {
            return res.status(400).json({
                message: "Returns can only be requested for invoiced orders.",
            });
        }
        const itemMap = new Map();
        items.forEach((item) => {
            const sku = (0, helpers_1.normalizeSku)(item.sku, `item_${item.line_item_id}`);
            itemMap.set(sku, {
                title: item.title ?? sku,
                quantity: Number(item.quantity ?? 0) || 0,
                unit_price: Number(item.unit_price ?? 0) || 0,
                thumbnail: item.thumbnail ?? null,
            });
        });
        if (!itemMap.size) {
            return res.status(400).json({
                message: "Order does not contain any shippable items.",
            });
        }
        const summaryMap = await (0, helpers_1.buildReturnSummary)(orderId, email);
        const entries = [];
        for (const product of body.products) {
            const sku = resolveSkuKey(product, "");
            if (!sku.length) {
                return res.status(400).json({
                    message: "Each product must include a sku.",
                });
            }
            const line = itemMap.get(sku);
            if (!line) {
                return res.status(400).json({
                    message: `SKU ${sku} is not part of the order.`,
                });
            }
            const qtyRequested = resolveQty(product);
            if (!Number.isFinite(qtyRequested) || qtyRequested <= 0) {
                return res.status(400).json({
                    message: `Invalid quantity for ${sku}.`,
                });
            }
            const previouslyReturned = summaryMap.get(sku)?.qty ?? 0;
            const remainingQty = Math.max(0, line.quantity - previouslyReturned);
            if (qtyRequested > remainingQty) {
                return res.status(400).json({
                    message: `Return quantity for ${sku} exceeds remaining items.`,
                });
            }
            summaryMap.set(sku, {
                qty: previouslyReturned + qtyRequested,
                last_returned_at: new Date().toISOString(),
            });
            entries.push({
                order_id: orderId,
                user_name: customerName ?? email,
                user_email: email,
                sku,
                product_name: line.title,
                qty: qtyRequested,
                price: (0, helpers_1.toMajorUnits)(line.unit_price),
                order_status: order.status ?? null,
                return_status: "Pending",
                remarks: remark,
            });
        }
        const inserted = await (0, pg_1.insertOrderReturnEntries)(entries);
        return res.json({
            success: true,
            returns: inserted,
        });
    }
    catch (error) {
        if (error?.status) {
            return res.status(error.status).json({ message: error.message });
        }
        return res.status(500).json({
            message: error?.message || "Failed to submit return request.",
        });
    }
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvcmVxdWVzdE9yZGVyUmV0dXJuL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUdBLDJDQUUyQjtBQUMzQixxREFLZ0M7QUFFaEMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUMxRCxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQTtJQUNqQyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ1gsR0FBRyxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUNqRCxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUM5QixDQUFDO1NBQU0sQ0FBQztRQUNOLEdBQUcsQ0FBQyxNQUFNLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDaEQsQ0FBQztJQUVELEdBQUcsQ0FBQyxNQUFNLENBQ1IsOEJBQThCLEVBQzlCLEdBQUcsQ0FBQyxPQUFPLENBQUMsZ0NBQWdDLENBQUM7UUFDM0MsNkJBQTZCLENBQ2hDLENBQUE7SUFDRCxHQUFHLENBQUMsTUFBTSxDQUFDLDhCQUE4QixFQUFFLGNBQWMsQ0FBQyxDQUFBO0lBQzFELEdBQUcsQ0FBQyxNQUFNLENBQUMsa0NBQWtDLEVBQUUsTUFBTSxDQUFDLENBQUE7QUFDeEQsQ0FBQyxDQUFBO0FBa0JELE1BQU0sYUFBYSxHQUFHLENBQUMsS0FBeUIsRUFBRSxRQUFnQixFQUFFLEVBQUU7SUFDcEUsT0FBTyxDQUNMLElBQUEsc0JBQVksRUFDVixLQUFLLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxHQUFHLElBQUssS0FBYSxDQUFDLE1BQU0sRUFDakQsUUFBUSxDQUNULElBQUksUUFBUSxDQUNkLENBQUE7QUFDSCxDQUFDLENBQUE7QUFFRCxNQUFNLFVBQVUsR0FBRyxDQUFDLEtBQXlCLEVBQUUsRUFBRTtJQUMvQyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQ2hCLEtBQUssQ0FBQyxHQUFHLElBQUksS0FBSyxDQUFDLFFBQVEsSUFBSyxLQUFhLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FDOUQsQ0FBQTtJQUNELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUN4QixDQUFDLENBQUE7QUFFTSxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDdkUsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUNqQixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO0FBQ3hCLENBQUMsQ0FBQTtBQUhZLFFBQUEsT0FBTyxXQUduQjtBQUVNLE1BQU0sSUFBSSxHQUFHLEtBQUssRUFBRSxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUNwRSxPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBRWpCLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLENBQXNCLENBQUE7SUFDbEQsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtJQUNwRSxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO0lBQ2xFLE1BQU0sTUFBTSxHQUNWLE9BQU8sSUFBSSxDQUFDLE1BQU0sS0FBSyxRQUFRLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNO1FBQzFELENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRTtRQUNwQixDQUFDLENBQUMsSUFBSSxDQUFBO0lBRVYsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDckMsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUsMENBQTBDO1NBQ3BELENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRCxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQzNELE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDMUIsT0FBTyxFQUFFLDZCQUE2QjtTQUN2QyxDQUFDLENBQUE7SUFDSixDQUFDO0lBRUQsSUFBSSxDQUFDO1FBQ0gsTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLEdBQUcsTUFBTSxJQUFBLDJCQUFpQixFQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUU5RSxNQUFNLFdBQVcsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDdEQsSUFBSSxXQUFXLEtBQUssVUFBVSxFQUFFLENBQUM7WUFDL0IsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsT0FBTyxFQUFFLG9EQUFvRDthQUM5RCxDQUFDLENBQUE7UUFDSixDQUFDO1FBQ0QsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBUXBCLENBQUE7UUFFSCxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDckIsTUFBTSxHQUFHLEdBQUcsSUFBQSxzQkFBWSxFQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsUUFBUSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQTtZQUMvRCxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRTtnQkFDZixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssSUFBSSxHQUFHO2dCQUN4QixRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDekMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQzdDLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUk7YUFDbEMsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2xCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQzFCLE9BQU8sRUFBRSw2Q0FBNkM7YUFDdkQsQ0FBQyxDQUFBO1FBQ0osQ0FBQztRQUVELE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBQSw0QkFBa0IsRUFBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDM0QsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFBO1FBRWxCLEtBQUssTUFBTSxPQUFPLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3BDLE1BQU0sR0FBRyxHQUFHLGFBQWEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFDdEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDaEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztvQkFDMUIsT0FBTyxFQUFFLGtDQUFrQztpQkFDNUMsQ0FBQyxDQUFBO1lBQ0osQ0FBQztZQUVELE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDN0IsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNWLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7b0JBQzFCLE9BQU8sRUFBRSxPQUFPLEdBQUcsNEJBQTRCO2lCQUNoRCxDQUFDLENBQUE7WUFDSixDQUFDO1lBRUQsTUFBTSxZQUFZLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQ3hDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLFlBQVksSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDeEQsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztvQkFDMUIsT0FBTyxFQUFFLHdCQUF3QixHQUFHLEdBQUc7aUJBQ3hDLENBQUMsQ0FBQTtZQUNKLENBQUM7WUFFRCxNQUFNLGtCQUFrQixHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQTtZQUN4RCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxHQUFHLGtCQUFrQixDQUFDLENBQUE7WUFDcEUsSUFBSSxZQUFZLEdBQUcsWUFBWSxFQUFFLENBQUM7Z0JBQ2hDLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7b0JBQzFCLE9BQU8sRUFBRSx1QkFBdUIsR0FBRywyQkFBMkI7aUJBQy9ELENBQUMsQ0FBQTtZQUNKLENBQUM7WUFFRCxVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRTtnQkFDbEIsR0FBRyxFQUFFLGtCQUFrQixHQUFHLFlBQVk7Z0JBQ3RDLGdCQUFnQixFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO2FBQzNDLENBQUMsQ0FBQTtZQUVGLE9BQU8sQ0FBQyxJQUFJLENBQUM7Z0JBQ1gsUUFBUSxFQUFFLE9BQU87Z0JBQ2pCLFNBQVMsRUFBRSxZQUFZLElBQUksS0FBSztnQkFDaEMsVUFBVSxFQUFFLEtBQUs7Z0JBQ2pCLEdBQUc7Z0JBQ0gsWUFBWSxFQUFFLElBQUksQ0FBQyxLQUFLO2dCQUN4QixHQUFHLEVBQUUsWUFBWTtnQkFDakIsS0FBSyxFQUFFLElBQUEsc0JBQVksRUFBQyxJQUFJLENBQUMsVUFBVSxDQUFDO2dCQUNwQyxZQUFZLEVBQUUsS0FBSyxDQUFDLE1BQU0sSUFBSSxJQUFJO2dCQUNsQyxhQUFhLEVBQUUsU0FBUztnQkFDeEIsT0FBTyxFQUFFLE1BQU07YUFDaEIsQ0FBQyxDQUFBO1FBQ0osQ0FBQztRQUVELE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBQSw2QkFBd0IsRUFBQyxPQUFPLENBQUMsQ0FBQTtRQUV4RCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDZCxPQUFPLEVBQUUsSUFBSTtZQUNiLE9BQU8sRUFBRSxRQUFRO1NBQ2xCLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1FBQ3BCLElBQUksS0FBSyxFQUFFLE1BQU0sRUFBRSxDQUFDO1lBQ2xCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFBO1FBQ2xFLENBQUM7UUFFRCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBTyxJQUFJLGtDQUFrQztTQUM5RCxDQUFDLENBQUE7SUFDSixDQUFDO0FBQ0gsQ0FBQyxDQUFBO0FBN0hZLFFBQUEsSUFBSSxRQTZIaEIifQ==