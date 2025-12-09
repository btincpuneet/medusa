"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = exports.OPTIONS = void 0;
const pg_1 = require("../../../../../lib/pg");
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
const formatDateTime = (value) => {
    const date = value instanceof Date
        ? value
        : (() => {
            if (!value) {
                return new Date();
            }
            const parsed = new Date(value);
            return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
        })();
    const iso = date.toISOString();
    return iso.replace("T", " ").slice(0, 19);
};
const toMajorUnits = (value) => {
    const amount = Number(value ?? 0);
    if (!Number.isFinite(amount)) {
        return 0;
    }
    return Number((amount / 100).toFixed(2));
};
const mapOrderRow = (row, totals) => {
    const metadata = row && typeof row.metadata === "object" && row.metadata !== null
        ? row.metadata
        : {};
    return {
        entity_id: row.id,
        increment_id: metadata.magento_increment_id ?? row.display_id ?? row.id ?? "",
        state: row.status ?? "pending",
        status: row.status ?? "pending",
        created_at: formatDateTime(row.created_at),
        grand_total: toMajorUnits(totals.grand),
        subtotal: toMajorUnits(totals.subtotal),
        shipping_amount: toMajorUnits(totals.shipping),
        tax_amount: toMajorUnits(totals.tax),
        discount_amount: toMajorUnits(totals.discount) * -1,
        customer_email: row.email,
        billing_address: row.billing_address,
        payment: {
            method: metadata.payment?.method ?? "manual",
            additional_information: [],
        },
    };
};
const mapItems = (rows) => {
    const grouped = new Map();
    for (const row of rows) {
        const key = row.order_id;
        if (!grouped.has(key)) {
            grouped.set(key, { items: [], subtotal: 0 });
        }
        const qty = Number(row.quantity ?? 0);
        const unitPrice = Number(row.unit_price ?? 0);
        const rowTotal = qty * unitPrice;
        grouped.get(key).items.push({
            item_id: row.line_item_id,
            sku: row.sku,
            name: row.title,
            qty_ordered: qty,
            price: toMajorUnits(unitPrice),
            price_incl_tax: toMajorUnits(unitPrice),
            row_total: toMajorUnits(rowTotal),
            row_total_incl_tax: toMajorUnits(rowTotal),
        });
        grouped.get(key).subtotal += rowTotal;
    }
    return grouped;
};
const toMinorNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
};
const buildTotals = (row, computedSubtotal) => {
    const metadata = row && typeof row.metadata === "object" && row.metadata !== null
        ? row.metadata
        : {};
    const metadataTotals = metadata.totals || {};
    const summaryTotals = row && typeof row.summary_totals === "object" && row.summary_totals !== null
        ? row.summary_totals
        : {};
    const subtotal = toMinorNumber(metadataTotals.subtotal) ?? computedSubtotal ?? 0;
    const shipping = toMinorNumber(metadataTotals.shipping_total) ?? 0;
    const tax = toMinorNumber(metadataTotals.tax_total) ?? 0;
    const discount = toMinorNumber(metadataTotals.discount_total) ?? 0;
    const grand = toMinorNumber(metadataTotals.grand_total) ??
        toMinorNumber(summaryTotals.current_order_total) ??
        subtotal + shipping + tax - discount;
    return {
        subtotal,
        shipping,
        tax,
        discount,
        grand,
    };
};
const OPTIONS = async (req, res) => {
    setCors(req, res);
    res.status(204).send();
};
exports.OPTIONS = OPTIONS;
const GET = async (req, res) => {
    setCors(req, res);
    const customerEmail = (req.query.customer_email ||
        req.query.customerEmail ||
        req.query.email);
    if (!customerEmail || !customerEmail.trim().length) {
        return res.status(400).json({
            message: "customer_email query parameter is required",
        });
    }
    const pool = (0, pg_1.getPgPool)();
    const { rows: orderRows } = await pool.query(`
      SELECT
        o.id,
        o.display_id,
        o.email,
        o.status,
        o.created_at,
        o.metadata,
        o.currency_code,
        summary.totals AS summary_totals
      FROM "order" o
      LEFT JOIN LATERAL (
        SELECT totals
        FROM order_summary os
        WHERE os.order_id = o.id
          AND os.deleted_at IS NULL
        ORDER BY os.version DESC
        LIMIT 1
      ) summary ON TRUE
      WHERE o.deleted_at IS NULL
        AND LOWER(o.email) = LOWER($1)
      ORDER BY o.created_at DESC
    `, [customerEmail.trim()]);
    if (!orderRows.length) {
        return res.json({
            items: [],
            total_count: 0,
        });
    }
    const orderIds = orderRows.map((row) => row.id);
    const { rows: itemRows } = await pool.query(`
      SELECT
        oi.order_id,
        oli.id AS line_item_id,
        oli.title,
        COALESCE(oli.variant_sku, oli.product_id, oli.id) AS sku,
        oi.quantity,
        oli.unit_price
      FROM order_item oi
      INNER JOIN order_line_item oli
        ON oi.item_id = oli.id
      WHERE oi.deleted_at IS NULL
        AND oi.order_id = ANY($1::text[])
        AND oli.deleted_at IS NULL
    `, [orderIds]);
    const itemMap = mapItems(itemRows);
    const items = orderRows.map((row) => {
        const summary = itemMap.get(row.id) ?? { items: [], subtotal: 0 };
        const totals = buildTotals(row, summary.subtotal ?? 0);
        return {
            ...mapOrderRow({
                id: row.id,
                display_id: row.display_id,
                status: row.status,
                created_at: row.created_at,
                email: row.email,
                billing_address: null,
                metadata: row.metadata,
            }, totals),
            items: summary.items,
        };
    });
    return res.json({
        items,
        total_count: items.length,
    });
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvcmVkaW5ndG9uL29yZGVycy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSw4Q0FBaUQ7QUFFakQsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUMxRCxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQTtJQUNqQyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ1gsR0FBRyxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUNqRCxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUM5QixDQUFDO1NBQU0sQ0FBQztRQUNOLEdBQUcsQ0FBQyxNQUFNLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDaEQsQ0FBQztJQUVELEdBQUcsQ0FBQyxNQUFNLENBQ1IsOEJBQThCLEVBQzlCLEdBQUcsQ0FBQyxPQUFPLENBQUMsZ0NBQWdDLENBQUM7UUFDM0MsNkJBQTZCLENBQ2hDLENBQUE7SUFDRCxHQUFHLENBQUMsTUFBTSxDQUFDLDhCQUE4QixFQUFFLGFBQWEsQ0FBQyxDQUFBO0lBQ3pELEdBQUcsQ0FBQyxNQUFNLENBQUMsa0NBQWtDLEVBQUUsTUFBTSxDQUFDLENBQUE7QUFDeEQsQ0FBQyxDQUFBO0FBRUQsTUFBTSxjQUFjLEdBQUcsQ0FBQyxLQUF1QyxFQUFFLEVBQUU7SUFDakUsTUFBTSxJQUFJLEdBQ1IsS0FBSyxZQUFZLElBQUk7UUFDbkIsQ0FBQyxDQUFDLEtBQUs7UUFDUCxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUU7WUFDSixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1gsT0FBTyxJQUFJLElBQUksRUFBRSxDQUFBO1lBQ25CLENBQUM7WUFD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