"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendPaymentSession = exports.updateMpgsTransactionStatus = exports.upsertMpgsTransaction = exports.retrieveMpgsTransactionBySession = exports.retrieveMpgsTransaction = exports.listMpgsTransactions = void 0;
const utils_1 = require("@medusajs/framework/utils");
const mpgs_client_1 = __importDefault(require("../mpgs-client"));
const pg_1 = require("../../lib/pg");
const clampLimit = (value, fallback = 25, max = 100) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }
    return Math.min(Math.trunc(parsed), max);
};
const clampOffset = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
    }
    return Math.trunc(parsed);
};
const normalizeString = (value) => {
    if (typeof value === "string") {
        return value.trim();
    }
    if (value === null || value === undefined) {
        return "";
    }
    return String(value).trim();
};
const normalizeOptional = (value) => {
    const normalized = normalizeString(value);
    return normalized.length ? normalized : null;
};
const toNumber = (value) => {
    if (value === null || value === undefined) {
        return 0;
    }
    if (typeof value === "number") {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    if (typeof value === "object") {
        if (value && typeof value.value === "string") {
            const parsed = Number(value.value);
            return Number.isFinite(parsed) ? parsed : 0;
        }
        if (value && typeof value.amount === "string") {
            const parsed = Number(value.amount);
            return Number.isFinite(parsed) ? parsed : 0;
        }
    }
    return 0;
};
const listMpgsTransactions = async (filters = {}, pagination = {}) => {
    await (0, pg_1.ensureRedingtonMpgsTransactionTable)();
    const conditions = [];
    const params = [];
    const pushCondition = (field, value) => {
        if (!value) {
            return;
        }
        params.push(value);
        conditions.push(`${field} = $${params.length}`);
    };
    pushCondition("order_ref_id", normalizeString(filters.order_ref_id));
    pushCondition("order_increment_id", normalizeString(filters.order_increment_id));
    pushCondition("session_id", normalizeString(filters.session_id));
    pushCondition("transaction_reference", normalizeString(filters.transaction_reference));
    pushCondition("result_indicator", normalizeString(filters.result_indicator));
    pushCondition("payment_status", normalizeString(filters.payment_status));
    const limit = clampLimit(pagination.limit, 25, 200);
    const offset = clampOffset(pagination.offset);
    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";
    const listParams = [...params, limit, offset];
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT id,
             order_ref_id,
             session_id,
             transaction_reference,
             order_increment_id,
             payment_status,
             session_version,
             result_indicator,
             order_status,
             transaction_receipt,
             created_at,
             updated_at
      FROM redington_mpgs_transaction
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT $${listParams.length - 1}
      OFFSET $${listParams.length}
    `, listParams);
    const countResult = await (0, pg_1.getPgPool)().query(`
      SELECT COUNT(*) AS count
      FROM redington_mpgs_transaction
      ${whereClause}
    `, params);
    const count = Number(countResult.rows[0]?.count ?? 0);
    return [rows.map(pg_1.mapMpgsTransactionRow), count];
};
exports.listMpgsTransactions = listMpgsTransactions;
const retrieveMpgsTransaction = async (id) => {
    await (0, pg_1.ensureRedingtonMpgsTransactionTable)();
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT *
      FROM redington_mpgs_transaction
      WHERE id = $1
    `, [id]);
    return rows[0] ? (0, pg_1.mapMpgsTransactionRow)(rows[0]) : null;
};
exports.retrieveMpgsTransaction = retrieveMpgsTransaction;
const retrieveMpgsTransactionBySession = async (sessionId) => {
    await (0, pg_1.ensureRedingtonMpgsTransactionTable)();
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT *
      FROM redington_mpgs_transaction
      WHERE session_id = $1
    `, [sessionId]);
    return rows[0] ? (0, pg_1.mapMpgsTransactionRow)(rows[0]) : null;
};
exports.retrieveMpgsTransactionBySession = retrieveMpgsTransactionBySession;
const upsertMpgsTransaction = async (input) => {
    await (0, pg_1.ensureRedingtonMpgsTransactionTable)();
    const createdAt = new Date().toISOString();
    const { rows } = await (0, pg_1.getPgPool)().query(`
      INSERT INTO redington_mpgs_transaction (
        order_ref_id,
        session_id,
        transaction_reference,
        order_increment_id,
        payment_status,
        session_version,
        result_indicator,
        order_status,
        transaction_receipt,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)
      ON CONFLICT (session_id) DO UPDATE SET
        order_ref_id = EXCLUDED.order_ref_id,
        transaction_reference = EXCLUDED.transaction_reference,
        order_increment_id = EXCLUDED.order_increment_id,
        payment_status = EXCLUDED.payment_status,
        session_version = EXCLUDED.session_version,
        result_indicator = EXCLUDED.result_indicator,
        order_status = EXCLUDED.order_status,
        transaction_receipt = EXCLUDED.transaction_receipt,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `, [
        normalizeString(input.order_ref_id),
        normalizeString(input.session_id),
        normalizeString(input.transaction_reference),
        normalizeString(input.order_increment_id),
        normalizeOptional(input.payment_status),
        normalizeOptional(input.session_version),
        normalizeOptional(input.result_indicator),
        normalizeOptional(input.order_status),
        normalizeOptional(input.transaction_receipt),
        createdAt,
    ]);
    return (0, pg_1.mapMpgsTransactionRow)(rows[0]);
};
exports.upsertMpgsTransaction = upsertMpgsTransaction;
const updateMpgsTransactionStatus = async (sessionId, updates) => {
    await (0, pg_1.ensureRedingtonMpgsTransactionTable)();
    const fields = [];
    const params = [];
    const push = (column, value) => {
        params.push(normalizeOptional(value));
        fields.push(`${column} = $${params.length}`);
    };
    if (updates.payment_status !== undefined) {
        push("payment_status", updates.payment_status);
    }
    if (updates.result_indicator !== undefined) {
        push("result_indicator", updates.result_indicator);
    }
    if (updates.order_status !== undefined) {
        push("order_status", updates.order_status);
    }
    if (updates.transaction_receipt !== undefined) {
        push("transaction_receipt", updates.transaction_receipt);
    }
    if (updates.session_version !== undefined) {
        push("session_version", updates.session_version);
    }
    if (!fields.length) {
        return null;
    }
    params.push(normalizeString(sessionId));
    const { rows } = await (0, pg_1.getPgPool)().query(`
      UPDATE redington_mpgs_transaction
      SET ${fields.join(", ")},
          updated_at = NOW()
      WHERE session_id = $${params.length}
      RETURNING *
    `, params);
    return rows[0] ? (0, pg_1.mapMpgsTransactionRow)(rows[0]) : null;
};
exports.updateMpgsTransactionStatus = updateMpgsTransactionStatus;
const resolveOrderAmount = (order) => {
    if (!order) {
        return { amount: 0, currency: "" };
    }
    const summary = order?.summary;
    const amount = toNumber(summary?.total) ||
        toNumber(order.item_total) ||
        toNumber(order.original_item_total);
    return {
        amount,
        currency: order.currency_code || "",
    };
};
const resendPaymentSession = async (options) => {
    const { scope, orderRefId, orderIncrementId, returnUrl, amount, currency, interactionOperation = "PURCHASE", } = options;
    const orderModule = scope.resolve(utils_1.Modules.ORDER);
    let order = null;
    try {
        order = await orderModule.retrieve(orderRefId, {
            select: ["id", "currency_code", "summary", "item_total", "original_item_total", "metadata"],
        });
    }
    catch (_) {
        order = null;
    }
    const resolved = resolveOrderAmount(order);
    const resolvedAmount = amount ?? resolved.amount;
    const resolvedCurrency = currency ?? resolved.currency;
    if (!resolvedCurrency) {
        throw new Error("Unable to determine order currency.");
    }
    if (!resolvedAmount || resolvedAmount <= 0) {
        throw new Error("Unable to determine order amount. Provide amount explicitly.");
    }
    const client = (0, mpgs_client_1.default)();
    const sanitizedOrderIncrement = orderIncrementId ||
        (order?.metadata &&
            order.metadata?.order_increment_id) ||
        orderRefId;
    const transactionReference = `txn-${sanitizedOrderIncrement}-${Date.now()}`;
    const response = await client.createCheckoutSession({
        amount: Number(resolvedAmount.toFixed(2)),
        currency: resolvedCurrency,
        orderId: sanitizedOrderIncrement,
        orderReference: orderRefId,
        transactionReference,
        returnUrl,
        interactionOperation,
    });
    const data = response.data ?? {};
    const session = data.session ?? data;
    const sessionId = session?.id ?? data.sessionId;
    if (!sessionId) {
        throw new Error("MPGS response missing session id.");
    }
    const sessionVersion = session?.version ?? data.sessionVersion ?? null;
    const resultIndicator = data.successIndicator ??
        data.resultIndicator ??
        session?.resultIndicator ??
        null;
    const transaction = await (0, exports.upsertMpgsTransaction)({
        order_ref_id: orderRefId,
        session_id: sessionId,
        transaction_reference: transactionReference,
        order_increment_id: sanitizedOrderIncrement,
        payment_status: "pending",
        session_version: sessionVersion ? String(sessionVersion) : null,
        result_indicator: resultIndicator ? String(resultIndicator) : null,
        order_status: null,
        transaction_receipt: null,
    });
    return {
        transaction,
        session: {
            id: sessionId,
            version: sessionVersion,
            result_indicator: resultIndicator,
        },
        raw: data,
    };
};
exports.resendPaymentSession = resendPaymentSession;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9yZWRpbmd0b24tbXBncy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxxREFBbUQ7QUFJbkQsaUVBQTZDO0FBQzdDLHFDQUtxQjtBQUVyQixNQUFNLFVBQVUsR0FBRyxDQUFDLEtBQWMsRUFBRSxRQUFRLEdBQUcsRUFBRSxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsRUFBRTtJQUM5RCxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQzVDLE9BQU8sUUFBUSxDQUFBO0lBQ2pCLENBQUM7SUFDRCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQTtBQUMxQyxDQUFDLENBQUE7QUFFRCxNQUFNLFdBQVcsR0FBRyxDQUFDLEtBQWMsRUFBRSxFQUFFO0lBQ3JDLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUM1QixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDM0MsT0FBTyxDQUFDLENBQUE7SUFDVixDQUFDO0lBQ0QsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0FBQzNCLENBQUMsQ0FBQTtBQUVELE1BQU0sZUFBZSxHQUFHLENBQUMsS0FBYyxFQUFVLEVBQUU7SUFDakQsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztRQUM5QixPQUFPLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQTtJQUNyQixDQUFDO0lBQ0QsSUFB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