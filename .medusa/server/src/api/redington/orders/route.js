"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const admin_client_1 = require("../utils/admin-client");
const session_1 = require("../utils/session");
const respond_1 = require("../utils/respond");
const DEFAULT_LIMIT = Number(process.env.REDINGTON_ORDERS_LIMIT || 20);
const MAX_LIMIT = Number(process.env.REDINGTON_ORDERS_MAX_LIMIT || 100);
const pickQueryValue = (query, keys) => {
    const lookup = Array.isArray(keys) ? keys : [keys];
    for (const key of lookup) {
        const value = query?.[key];
        if (value === undefined || value === null) {
            continue;
        }
        if (Array.isArray(value)) {
            const candidate = value[0];
            if (candidate !== undefined && candidate !== null) {
                return String(candidate);
            }
            continue;
        }
        if (typeof value === "string") {
            if (value.trim().length === 0) {
                continue;
            }
            return value;
        }
        return String(value);
    }
    return undefined;
};
const parseNumberParam = (value, fallback) => {
    if (!value) {
        return fallback;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    return parsed;
};
const getOrderEmail = (order) => {
    return (order.customer?.email ||
        order.email ||
        order.metadata?.customer_email ||
        order.metadata?.magento_customer_email ||
        "").trim();
};
const getCustomerName = (order) => {
    const nameFromCustomer = `${order.customer?.first_name || ""} ${order.customer?.last_name || ""}`.trim();
    if (nameFromCustomer) {
        return nameFromCustomer;
    }
    const nameFromShipping = `${order.shipping_address?.first_name || ""} ${order.shipping_address?.last_name || ""}`.trim();
    if (nameFromShipping) {
        return nameFromShipping;
    }
    const nameFromBilling = `${order.billing_address?.first_name || ""} ${order.billing_address?.last_name || ""}`.trim();
    if (nameFromBilling) {
        return nameFromBilling;
    }
    return "";
};
const resolveTotal = (order) => {
    if (typeof order.total === "number") {
        return order.total;
    }
    if (typeof order.paid_total === "number") {
        return order.paid_total;
    }
    if (typeof order.subtotal === "number") {
        return order.subtotal;
    }
    return null;
};
const simplifyOrder = (order) => {
    const metadata = order.metadata || {};
    return {
        id: order.id,
        display_id: order.display_id ?? null,
        magento_order_id: metadata.magento_order_id ||
            metadata.legacy_order_id ||
            metadata.increment_id ||
            null,
        created_at: order.created_at || null,
        customer_name: getCustomerName(order) || null,
        customer_email: getOrderEmail(order) || null,
        total: resolveTotal(order),
        payment_status: order.payment_status || "pending",
        fulfillment_status: order.fulfillment_status || "not_fulfilled",
        metadata,
    };
};
const GET = async (req, res) => {
    try {
        const session = (0, session_1.requireCustomerSession)(req);
        const limitParam = pickQueryValue(req.query, "limit");
        const offsetParam = pickQueryValue(req.query, "offset");
        const limit = Math.min(Math.max(parseNumberParam(limitParam, DEFAULT_LIMIT), 1), MAX_LIMIT);
        const offset = Math.max(parseNumberParam(offsetParam, 0), 0);
        const forwarded = new URLSearchParams();
        forwarded.set("limit", limit.toString());
        forwarded.set("offset", offset.toString());
        forwarded.set("expand", "customer,shipping_address,billing_address");
        const adminPath = `/admin/orders?${forwarded.toString()}`;
        const response = await (0, admin_client_1.adminFetch)(adminPath);
        const orders = Array.isArray(response?.orders) ? response.orders : [];
        const requestedEmail = pickQueryValue(req.query, ["customer_email", "email"])?.trim().toLowerCase() ||
            session.email.toLowerCase();
        const filtered = orders.filter((order) => {
            if (!requestedEmail) {
                return true;
            }
            const normalizedEmail = getOrderEmail(order).toLowerCase();
            return normalizedEmail === requestedEmail;
        });
        const simplified = filtered.map(simplifyOrder);
        return res.json({
            items: simplified,
            count: simplified.length,
            limit,
            offset,
        });
    }
    catch (error) {
        return (0, respond_1.sendErrorResponse)(res, error, "Unable to load orders.");
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3JlZGluZ3Rvbi9vcmRlcnMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsd0RBQWtEO0FBQ2xELDhDQUF5RDtBQUN6RCw4Q0FBb0Q7QUFFcEQsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLElBQUksRUFBRSxDQUFDLENBQUE7QUFDdEUsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLElBQUksR0FBRyxDQUFDLENBQUE7QUE4QnZFLE1BQU0sY0FBYyxHQUFHLENBQ3JCLEtBQTZCLEVBQzdCLElBQXVCLEVBQ0gsRUFBRTtJQUN0QixNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDbEQsS0FBSyxNQUFNLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUN6QixNQUFNLEtBQUssR0FBSSxLQUE2QyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDbkUsSUFBSSxLQUFLLEtBQUssU0FBUyxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUMxQyxTQUFRO1FBQ1YsQ0FBQztRQUNELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3pCLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUMxQixJQUFJLFNBQVMsS0FBSyxTQUFTLElBQUksU0FBUyxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUNsRCxPQUFPLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQTtZQUMxQixDQUFDO1lBQ0QsU0FBUTtRQUNWLENBQUM7UUFDRCxJQUFJLE9BQU8s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