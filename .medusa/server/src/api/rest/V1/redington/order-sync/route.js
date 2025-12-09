"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.OPTIONS = void 0;
const utils_1 = require("@medusajs/framework/utils");
const magentoClient_1 = require("../../../../magentoClient");
const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL;
const MAGENTO_ADMIN_TOKEN = process.env.MAGENTO_ADMIN_TOKEN;
const ensureMagentoConfig = () => {
    if (!MAGENTO_REST_BASE_URL || !MAGENTO_ADMIN_TOKEN) {
        throw new Error("MAGENTO_REST_BASE_URL and MAGENTO_ADMIN_TOKEN are required for order sync.");
    }
};
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
const toMinorUnits = (value) => {
    const amount = Number(value ?? 0);
    if (!Number.isFinite(amount)) {
        return 0;
    }
    return Math.round(amount * 100);
};
const mapOrderStatus = (state, status) => {
    const normalized = (state || status || "").toLowerCase();
    if (normalized.includes("cancel")) {
        return "canceled";
    }
    if (normalized.includes("complete")) {
        return "completed";
    }
    return "pending";
};
const mapPaymentStatus = (order) => {
    const state = String(order.state || order.status || "").toLowerCase();
    if (state.includes("cancel")) {
        return "canceled";
    }
    const paid = Number(order.total_paid ?? order.base_total_paid ?? 0);
    if (Number.isFinite(paid) && paid > 0) {
        return "captured";
    }
    if (state.includes("pending")) {
        return "awaiting";
    }
    return "not_paid";
};
const mapFulfillmentStatus = (state, status) => {
    const normalized = (state || status || "").toLowerCase();
    return normalized.includes("complete") ? "fulfilled" : "not_fulfilled";
};
const loadMagentoOrder = async (identifier) => {
    ensureMagentoConfig();
    const client = (0, magentoClient_1.createMagentoB2CClient)({
        baseUrl: MAGENTO_REST_BASE_URL,
        axiosConfig: {
            headers: {
                Authorization: `Bearer ${MAGENTO_ADMIN_TOKEN}`,
                "Content-Type": "application/json",
            },
            validateStatus: () => true,
        },
    });
    const numericId = Number(identifier);
    if (Number.isFinite(numericId)) {
        const response = await client.request({
            url: `orders/${numericId}`,
            method: "GET",
        });
        if (response.status >= 200 && response.status < 300) {
            return response.data;
        }
    }
    const response = await client.request({
        url: "orders",
        method: "GET",
        params: {
            "searchCriteria[filter_groups][0][filters][0][field]": "increment_id",
            "searchCriteria[filter_groups][0][filters][0][value]": identifier,
            "searchCriteria[filter_groups][0][filters][0][condition_type]": "eq",
        },
    });
    if (response.status >= 200 && response.status < 300) {
        const items = Array.isArray(response.data?.items)
            ? response.data.items
            : [];
        if (items.length) {
            return items[0];
        }
    }
    return null;
};
const OPTIONS = async (req, res) => {
    setCors(req, res);
    res.status(204).send();
};
exports.OPTIONS = OPTIONS;
const POST = async (req, res) => {
    setCors(req, res);
    const body = (req.body || {});
    const identifier = body.order_id ?? body.increment_id ?? req.query.order_id ?? req.query.increment_id;
    if (!identifier || !String(identifier).trim().length) {
        return res.status(400).json({
            message: "order_id (or increment_id) is required to sync an order.",
        });
    }
    let magentoOrder = null;
    try {
        magentoOrder = await loadMagentoOrder(String(identifier).trim());
    }
    catch (error) {
        return res.status(502).json({
            message: error?.message ||
                "Failed to load Magento order. Verify the identifier and try again.",
        });
    }
    if (!magentoOrder) {
        return res.status(404).json({
            message: "Magento order not found.",
        });
    }
    const manager = req.scope.resolve("manager");
    const orderService = req.scope.resolve(utils_1.Modules.ORDER);
    const lineItemService = req.scope.resolve("lineItemService");
    const magentoIdentifier = String(magentoOrder.increment_id ?? magentoOrder.entity_id);
    const [existingOrders] = await orderService.listAndCount({
        magento_order_id: magentoIdentifier,
    }, {
        take: 1,
    });
    if (!existingOrders.length) {
        const [legacyOrders] = await orderService.listAndCount({
            metadata: {
                magento_order_id: magentoIdentifier,
            },
        }, {
            take: 1,
        });
        if (legacyOrders.length) {
            existingOrders.push(legacyOrders[0]);
        }
    }
    if (existingOrders.length) {
        return res.json({
            order_id: existingOrders[0].id,
            already_synced: true,
        });
    }
    const currency = (magentoOrder.order_currency_code ||
        magentoOrder.base_currency_code ||
        "AED")?.toLowerCase() || "aed";
    const email = magentoOrder.customer_email ||
        body.customer_email ||
        req.body?.email ||
        null;
    if (!email) {
        return res.status(400).json({
            message: "customer_email is required when Magento order does not include it.",
        });
    }
    const orderPayload = {
        email,
        currency_code: currency,
        status: mapOrderStatus(magentoOrder.state, magentoOrder.status),
        fulfillment_status: mapFulfillmentStatus(magentoOrder.state, magentoOrder.status),
        payment_status: mapPaymentStatus(magentoOrder),
        magento_order_id: magentoIdentifier,
        metadata: {
            magento_increment_id: magentoOrder.increment_id,
            magento_status: magentoOrder.status,
            payment_method: magentoOrder.payment?.method,
        },
        created_at: magentoOrder.created_at
            ? new Date(magentoOrder.created_at)
            : new Date(),
    };
    let medusaOrder;
    await manager.transaction(async (trx) => {
        medusaOrder = await orderService.withTransaction(trx).create(orderPayload);
        const items = Array.isArray(magentoOrder.items)
            ? magentoOrder.items
            : [];
        for (const item of items) {
            if (item.parent_item_id) {
                continue;
            }
            await lineItemService.withTransaction(trx).create({
                order_id: medusaOrder.id,
                title: item.name || item.sku || "Item",
                quantity: Math.max(1, Number(item.qty_ordered || item.qty || 1)),
                unit_price: toMinorUnits(item.base_price_incl_tax ?? item.base_price ?? item.price ?? 0),
                metadata: {
                    sku: item.sku,
                    magento_item_id: item.item_id,
                },
            });
        }
        await orderService.withTransaction(trx).update(medusaOrder.id, {
            subtotal: toMinorUnits(magentoOrder.base_subtotal_incl_tax ??
                magentoOrder.base_subtotal ??
                magentoOrder.subtotal) || 0,
            tax_total: toMinorUnits(magentoOrder.base_tax_amount ?? 0),
            discount_total: Math.abs(toMinorUnits(magentoOrder.base_discount_amount ?? 0)),
            shipping_total: toMinorUnits(magentoOrder.base_shipping_amount ?? 0),
            total: toMinorUnits(magentoOrder.base_grand_total ?? magentoOrder.grand_total ?? 0) || 0,
        });
    });
    return res.json({
        order_id: medusaOrder.id,
        magento_order_id: magentoIdentifier,
    });
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvcmVkaW5ndG9uL29yZGVyLXN5bmMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0EscURBQW1EO0FBRW5ELDZEQUFrRTtBQUVsRSxNQUFNLHFCQUFxQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUE7QUFDL0QsTUFBTSxtQkFBbUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFBO0FBRTNELE1BQU0sbUJBQW1CLEdBQUcsR0FBRyxFQUFFO0lBQy9CLElBQUksQ0FBQyxxQkFBcUIsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDbkQsTUFBTSxJQUFJLEtBQUssQ0FDYiw0RUFBNEUsQ0FDN0UsQ0FBQTtJQUNILENBQUM7QUFDSCxDQUFDLENBQUE7QUFFRCxNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQzFELE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFBO0lBQ2pDLElBQUksTUFBTSxFQUFFLENBQUM7UUFDWCxHQUFHLENBQUMsTUFBTSxDQUFDLDZCQUE2QixFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQ2pELEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBQzlCLENBQUM7U0FBTSxDQUFDO1FBQ04sR0FBRyxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUNoRCxDQUFDO0lBRUQsR0FBRyxDQUFDLE1BQU0sQ0FDUiw4QkFBOEIsRUFDOUIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQztRQUMzQyw2QkFBNkIsQ0FDaEMsQ0FBQTtJQUNELEdBQUcsQ0FBQyxNQUFNLENBQUMsOEJBQThCLEVBQUUsY0FBYyxDQUFD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