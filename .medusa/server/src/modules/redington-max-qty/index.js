"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMaxOrderQtySummary = exports.buildValidationItemFromPayload = exports.purgeOrderQuantityTrackerByMonths = exports.purgeOrderQuantityTrackerBefore = exports.mergeValidationItems = exports.validateCart = exports.buildValidationItemsFromCart = exports.validateItemsAgainstMaxQty = exports.listOrderQuantityTracker = exports.purgeOrderQuantityTracker = exports.upsertOrderQuantityTracker = exports.retrieveMaxQtyCategory = exports.deleteMaxQtyCategory = exports.updateMaxQtyCategory = exports.createMaxQtyCategory = exports.listMaxQtyCategories = exports.retrieveMaxQtyRule = exports.deleteMaxQtyRule = exports.updateMaxQtyRule = exports.createMaxQtyRule = exports.listMaxQtyRules = void 0;
const pg_1 = require("../../lib/pg");
const normalizeString = (value) => {
    if (typeof value === "string") {
        return value.trim();
    }
    if (value === null || value === undefined) {
        return "";
    }
    return String(value).trim();
};
const normalizeNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    return parsed;
};
const normalizeOptionalNumber = (value) => {
    if (value === null || value === undefined || value === "") {
        return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};
const buildRuleWhereClauses = (filters) => {
    const conditions = [];
    const params = [];
    if (filters.category_id) {
        params.push(filters.category_id.trim());
        conditions.push(`category_id = $${params.length}`);
    }
    if (filters.brand_id) {
        params.push(filters.brand_id.trim());
        conditions.push(`brand_id = $${params.length}`);
    }
    if (filters.company_code) {
        params.push(filters.company_code.trim());
        conditions.push(`company_code = $${params.length}`);
    }
    if (filters.domain_id !== undefined) {
        if (filters.domain_id === null) {
            conditions.push(`domain_id IS NULL`);
        }
        else {
            params.push(filters.domain_id);
            conditions.push(`domain_id = $${params.length}`);
        }
    }
    return { conditions, params };
};
const buildCategoryWhereClauses = (filters) => {
    const conditions = [];
    const params = [];
    if (filters.category_ids) {
        params.push(filters.category_ids.trim());
        conditions.push(`category_ids = $${params.length}`);
    }
    if (filters.brand_id) {
        params.push(filters.brand_id.trim());
        conditions.push(`brand_id = $${params.length}`);
    }
    if (filters.company_code) {
        params.push(filters.company_code.trim());
        conditions.push(`company_code = $${params.length}`);
    }
    if (filters.domain_id !== undefined) {
        if (filters.domain_id === null) {
            conditions.push(`domain_id IS NULL`);
        }
        else {
            params.push(filters.domain_id);
            conditions.push(`domain_id = $${params.length}`);
        }
    }
    return { conditions, params };
};
const buildRuleKey = (categoryId, brandId, companyCode, domainId) => `${categoryId}::${brandId}::${companyCode}::${domainId ?? "null"}`;
const parseCategoryIdsFromString = (value) => {
    return value
        .split(/[\s,]+/)
        .map((entry) => entry.trim())
        .filter(Boolean);
};
const toDomainId = (value) => {
    if (value === null || value === undefined || value === "") {
        return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
};
const clampPagination = (limit, offset, maxLimit = 100, defaultLimit = 25) => {
    const parsedLimit = clampLimit(limit, defaultLimit, maxLimit);
    const parsedOffset = clampOffset(offset);
    return { limit: parsedLimit, offset: parsedOffset };
};
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
const listMaxQtyRules = async (filters = {}, pagination = {}) => {
    await (0, pg_1.ensureRedingtonMaxQtyRuleTable)();
    const { conditions, params } = buildRuleWhereClauses(filters);
    const { limit, offset } = clampPagination(pagination.limit, pagination.offset);
    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";
    const dataParams = [...params, limit, offset];
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT id,
             category_id,
             brand_id,
             company_code,
             domain_id,
             max_qty,
             created_at,
             updated_at
      FROM redington_max_qty_rule
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${dataParams.length - 1}
      OFFSET $${dataParams.length}
    `, dataParams);
    const countResult = await (0, pg_1.getPgPool)().query(`
      SELECT COUNT(*) AS count
      FROM redington_max_qty_rule
      ${whereClause}
    `, params);
    const count = Number(countResult.rows[0]?.count ?? 0);
    return [rows.map(pg_1.mapMaxQtyRuleRow), count];
};
exports.listMaxQtyRules = listMaxQtyRules;
const createMaxQtyRule = async (input) => {
    await (0, pg_1.ensureRedingtonMaxQtyRuleTable)();
    const payload = {
        category_id: normalizeString(input.category_id),
        brand_id: normalizeString(input.brand_id),
        company_code: normalizeString(input.company_code),
        domain_id: normalizeOptionalNumber(input.domain_id),
        max_qty: normalizeNumber(input.max_qty, 0),
    };
    const { rows } = await (0, pg_1.getPgPool)().query(`
      INSERT INTO redington_max_qty_rule (
        category_id,
        brand_id,
        company_code,
        domain_id,
        max_qty
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (category_id, brand_id, company_code, domain_id) DO UPDATE
        SET max_qty = EXCLUDED.max_qty,
            updated_at = NOW()
      RETURNING *
    `, [
        payload.category_id,
        payload.brand_id,
        payload.company_code,
        payload.domain_id,
        payload.max_qty,
    ]);
    return (0, pg_1.mapMaxQtyRuleRow)(rows[0]);
};
exports.createMaxQtyRule = createMaxQtyRule;
const updateMaxQtyRule = async (id, input) => {
    await (0, pg_1.ensureRedingtonMaxQtyRuleTable)();
    const fields = [];
    const params = [];
    if (input.category_id !== undefined) {
        params.push(normalizeString(input.category_id));
        fields.push(`category_id = $${params.length}`);
    }
    if (input.brand_id !== undefined) {
        params.push(normalizeString(input.brand_id));
        fields.push(`brand_id = $${params.length}`);
    }
    if (input.company_code !== undefined) {
        params.push(normalizeString(input.company_code));
        fields.push(`company_code = $${params.length}`);
    }
    if (input.domain_id !== undefined) {
        params.push(normalizeOptionalNumber(input.domain_id));
        fields.push(`domain_id = $${params.length}`);
    }
    if (input.max_qty !== undefined) {
        params.push(normalizeNumber(input.max_qty, 0));
        fields.push(`max_qty = $${params.length}`);
    }
    if (!fields.length) {
        const existing = await (0, pg_1.getPgPool)().query(`
        SELECT *
        FROM redington_max_qty_rule
        WHERE id = $1
      `, [id]);
        return existing.rows[0] ? (0, pg_1.mapMaxQtyRuleRow)(existing.rows[0]) : null;
    }
    params.push(id);
    const { rows } = await (0, pg_1.getPgPool)().query(`
      UPDATE redington_max_qty_rule
      SET ${fields.join(", ")},
          updated_at = NOW()
      WHERE id = $${params.length}
      RETURNING *
    `, params);
    return rows[0] ? (0, pg_1.mapMaxQtyRuleRow)(rows[0]) : null;
};
exports.updateMaxQtyRule = updateMaxQtyRule;
const deleteMaxQtyRule = async (id) => {
    await (0, pg_1.ensureRedingtonMaxQtyRuleTable)();
    const result = await (0, pg_1.getPgPool)().query(`
      DELETE FROM redington_max_qty_rule
      WHERE id = $1
    `, [id]);
    return result.rowCount > 0;
};
exports.deleteMaxQtyRule = deleteMaxQtyRule;
const retrieveMaxQtyRule = async (id) => {
    await (0, pg_1.ensureRedingtonMaxQtyRuleTable)();
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT id,
             category_id,
             brand_id,
             company_code,
             domain_id,
             max_qty,
             created_at,
             updated_at
      FROM redington_max_qty_rule
      WHERE id = $1
    `, [id]);
    return rows[0] ? (0, pg_1.mapMaxQtyRuleRow)(rows[0]) : null;
};
exports.retrieveMaxQtyRule = retrieveMaxQtyRule;
const listMaxQtyCategories = async (filters = {}, pagination = {}) => {
    await (0, pg_1.ensureRedingtonMaxQtyCategoryTable)();
    const { conditions, params } = buildCategoryWhereClauses(filters);
    const { limit, offset } = clampPagination(pagination.limit, pagination.offset);
    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";
    const dataParams = [...params, limit, offset];
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT id,
             category_ids,
             brand_id,
             company_code,
             domain_id,
             max_qty,
             created_at,
             updated_at
      FROM redington_max_qty_category
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${dataParams.length - 1}
      OFFSET $${dataParams.length}
    `, dataParams);
    const countResult = await (0, pg_1.getPgPool)().query(`
      SELECT COUNT(*) AS count
      FROM redington_max_qty_category
      ${whereClause}
    `, params);
    const count = Number(countResult.rows[0]?.count ?? 0);
    return [rows.map(pg_1.mapMaxQtyCategoryRow), count];
};
exports.listMaxQtyCategories = listMaxQtyCategories;
const createMaxQtyCategory = async (input) => {
    await (0, pg_1.ensureRedingtonMaxQtyCategoryTable)();
    const payload = {
        category_ids: normalizeString(input.category_ids),
        brand_id: normalizeString(input.brand_id),
        company_code: normalizeString(input.company_code),
        domain_id: normalizeOptionalNumber(input.domain_id),
        max_qty: normalizeNumber(input.max_qty, 0),
    };
    const { rows } = await (0, pg_1.getPgPool)().query(`
      INSERT INTO redington_max_qty_category (
        category_ids,
        brand_id,
        company_code,
        domain_id,
        max_qty
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (category_ids, brand_id, company_code, domain_id) DO UPDATE
        SET max_qty = EXCLUDED.max_qty,
            updated_at = NOW()
      RETURNING *
    `, [
        payload.category_ids,
        payload.brand_id,
        payload.company_code,
        payload.domain_id,
        payload.max_qty,
    ]);
    return (0, pg_1.mapMaxQtyCategoryRow)(rows[0]);
};
exports.createMaxQtyCategory = createMaxQtyCategory;
const updateMaxQtyCategory = async (id, input) => {
    await (0, pg_1.ensureRedingtonMaxQtyCategoryTable)();
    const fields = [];
    const params = [];
    if (input.category_ids !== undefined) {
        params.push(normalizeString(input.category_ids));
        fields.push(`category_ids = $${params.length}`);
    }
    if (input.brand_id !== undefined) {
        params.push(normalizeString(input.brand_id));
        fields.push(`brand_id = $${params.length}`);
    }
    if (input.company_code !== undefined) {
        params.push(normalizeString(input.company_code));
        fields.push(`company_code = $${params.length}`);
    }
    if (input.domain_id !== undefined) {
        params.push(normalizeOptionalNumber(input.domain_id));
        fields.push(`domain_id = $${params.length}`);
    }
    if (input.max_qty !== undefined) {
        params.push(normalizeNumber(input.max_qty, 0));
        fields.push(`max_qty = $${params.length}`);
    }
    if (!fields.length) {
        const existing = await (0, pg_1.getPgPool)().query(`
        SELECT *
        FROM redington_max_qty_category
        WHERE id = $1
      `, [id]);
        return existing.rows[0] ? (0, pg_1.mapMaxQtyCategoryRow)(existing.rows[0]) : null;
    }
    params.push(id);
    const { rows } = await (0, pg_1.getPgPool)().query(`
      UPDATE redington_max_qty_category
      SET ${fields.join(", ")},
          updated_at = NOW()
      WHERE id = $${params.length}
      RETURNING *
    `, params);
    return rows[0] ? (0, pg_1.mapMaxQtyCategoryRow)(rows[0]) : null;
};
exports.updateMaxQtyCategory = updateMaxQtyCategory;
const deleteMaxQtyCategory = async (id) => {
    await (0, pg_1.ensureRedingtonMaxQtyCategoryTable)();
    const result = await (0, pg_1.getPgPool)().query(`
      DELETE FROM redington_max_qty_category
      WHERE id = $1
    `, [id]);
    return result.rowCount > 0;
};
exports.deleteMaxQtyCategory = deleteMaxQtyCategory;
const retrieveMaxQtyCategory = async (id) => {
    await (0, pg_1.ensureRedingtonMaxQtyCategoryTable)();
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT id,
             category_ids,
             brand_id,
             company_code,
             domain_id,
             max_qty,
             created_at,
             updated_at
      FROM redington_max_qty_category
      WHERE id = $1
    `, [id]);
    return rows[0] ? (0, pg_1.mapMaxQtyCategoryRow)(rows[0]) : null;
};
exports.retrieveMaxQtyCategory = retrieveMaxQtyCategory;
const upsertOrderQuantityTracker = async (input) => {
    await (0, pg_1.ensureRedingtonOrderQuantityTrackerTable)();
    const payload = {
        customer_id: normalizeNumber(input.customer_id),
        order_increment_id: normalizeString(input.order_increment_id),
        sku: normalizeString(input.sku),
        quantity: normalizeNumber(input.quantity, 0),
        brand_id: normalizeString(input.brand_id ?? "") || null,
    };
    const { rows } = await (0, pg_1.getPgPool)().query(`
      INSERT INTO redington_order_quantity_tracker (
        customer_id,
        order_increment_id,
        sku,
        quantity,
        brand_id
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (customer_id, order_increment_id, sku) DO UPDATE
        SET quantity = EXCLUDED.quantity,
            brand_id = EXCLUDED.brand_id,
            updated_at = NOW()
      RETURNING *
    `, [
        payload.customer_id,
        payload.order_increment_id,
        payload.sku,
        payload.quantity,
        payload.brand_id,
    ]);
    return (0, pg_1.mapOrderQuantityTrackerRow)(rows[0]);
};
exports.upsertOrderQuantityTracker = upsertOrderQuantityTracker;
const purgeOrderQuantityTracker = async (before) => {
    await (0, pg_1.ensureRedingtonOrderQuantityTrackerTable)();
    const { rowCount } = await (0, pg_1.getPgPool)().query(`
      DELETE FROM redington_order_quantity_tracker
      WHERE created_at < $1
    `, [before.toISOString()]);
    return rowCount ?? 0;
};
exports.purgeOrderQuantityTracker = purgeOrderQuantityTracker;
const listOrderQuantityTracker = async (filters = {}, pagination = {}) => {
    await (0, pg_1.ensureRedingtonOrderQuantityTrackerTable)();
    const conditions = [];
    const params = [];
    if (typeof filters.customer_id === "number") {
        params.push(filters.customer_id);
        conditions.push(`customer_id = $${params.length}`);
    }
    if (filters.order_increment_id) {
        params.push(filters.order_increment_id.trim());
        conditions.push(`order_increment_id = $${params.length}`);
    }
    if (filters.sku) {
        params.push(filters.sku.trim());
        conditions.push(`sku = $${params.length}`);
    }
    if (filters.brand_id) {
        params.push(filters.brand_id.trim());
        conditions.push(`brand_id = $${params.length}`);
    }
    const { limit, offset } = clampPagination(pagination.limit, pagination.offset);
    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";
    const dataParams = [...params, limit, offset];
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT id,
             customer_id,
             order_increment_id,
             sku,
             quantity,
             brand_id,
             created_at,
             updated_at
      FROM redington_order_quantity_tracker
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${dataParams.length - 1}
      OFFSET $${dataParams.length}
    `, dataParams);
    const countResult = await (0, pg_1.getPgPool)().query(`
      SELECT COUNT(*) AS count
      FROM redington_order_quantity_tracker
      ${whereClause}
    `, params);
    const count = Number(countResult.rows[0]?.count ?? 0);
    return [rows.map(pg_1.mapOrderQuantityTrackerRow), count];
};
exports.listOrderQuantityTracker = listOrderQuantityTracker;
const fetchRulesAndCategories = async () => {
    const [rules] = await (0, exports.listMaxQtyRules)({}, { limit: 1000, offset: 0 });
    const [categories] = await (0, exports.listMaxQtyCategories)({}, { limit: 1000, offset: 0 });
    const ruleMap = new Map();
    for (const rule of rules) {
        const key = buildRuleKey(rule.category_id, normalizeString(rule.brand_id), normalizeString(rule.company_code), rule.domain_id);
        ruleMap.set(key, {
            id: rule.id,
            max_qty: rule.max_qty,
            company_code: normalizeString(rule.company_code),
            brand_id: normalizeString(rule.brand_id),
            domain_id: rule.domain_id ?? null,
            category_id: normalizeString(rule.category_id),
        });
    }
    const categoryRules = categories.map((category) => ({
        id: category.id,
        max_qty: category.max_qty,
        brand_id: normalizeString(category.brand_id),
        company_code: normalizeString(category.company_code),
        domain_id: category.domain_id ?? null,
        category_ids: parseCategoryIdsFromString(category.category_ids),
    }));
    return { ruleMap, categoryRules };
};
const validateItemsAgainstMaxQty = async (items) => {
    const { ruleMap, categoryRules } = await fetchRulesAndCategories();
    const aggregates = new Map();
    for (const item of items) {
        const quantity = Number(item.quantity);
        if (!Number.isFinite(quantity) || quantity <= 0) {
            continue;
        }
        const brandId = normalizeString(item.brand_id);
        const companyCode = normalizeString(item.company_code);
        const domainId = toDomainId(item.domain_id);
        const categoryIds = new Set();
        if (item.category_id) {
            categoryIds.add(normalizeString(item.category_id));
        }
        if (Array.isArray(item.category_ids)) {
            for (const cid of item.category_ids) {
                const normalized = normalizeString(cid);
                if (normalized) {
                    categoryIds.add(normalized);
                }
            }
        }
        if (!categoryIds.size) {
            continue;
        }
        let matchedRule = null;
        for (const categoryId of categoryIds) {
            const key = buildRuleKey(categoryId, brandId, companyCode, domainId);
            const rule = ruleMap.get(key);
            if (rule) {
                const agg = aggregates.get(key);
                if (agg) {
                    agg.quantity += quantity;
                    agg.skus.add(item.sku);
                }
                else {
                    aggregates.set(key, {
                        key,
                        quantity,
                        max_qty: rule.max_qty,
                        rule_type: "rule",
                        rule_id: rule.id,
                        company_code: companyCode,
                        brand_id: brandId,
                        domain_id: domainId,
                        category_ids: [rule.category_id],
                        skus: new Set([item.sku]),
                    });
                }
                matchedRule = aggregates.get(key) ?? null;
                break;
            }
        }
        if (matchedRule) {
            continue;
        }
        for (const categoryRule of categoryRules) {
            if (categoryRule.brand_id === brandId &&
                categoryRule.company_code === companyCode &&
                categoryRule.domain_id === domainId) {
                const intersects = categoryRule.category_ids.some((cid) => categoryIds.has(cid));
                if (intersects) {
                    const key = `${categoryRule.id}::category::${brandId}::${companyCode}::${domainId ?? "null"}`;
                    const agg = aggregates.get(key);
                    if (agg) {
                        agg.quantity += quantity;
                        agg.skus.add(item.sku);
                    }
                    else {
                        aggregates.set(key, {
                            key,
                            quantity,
                            max_qty: categoryRule.max_qty,
                            rule_type: "category",
                            rule_id: categoryRule.id,
                            company_code: companyCode,
                            brand_id: brandId,
                            domain_id: domainId,
                            category_ids: categoryRule.category_ids,
                            skus: new Set([item.sku]),
                        });
                    }
                    break;
                }
            }
        }
    }
    const violations = [];
    for (const entry of aggregates.values()) {
        if (entry.quantity > entry.max_qty) {
            violations.push({
                key: entry.key,
                sku: Array.from(entry.skus)[0] ?? "",
                quantity: entry.quantity,
                max_qty: entry.max_qty,
                rule_type: entry.rule_type,
                rule_id: entry.rule_id,
                company_code: entry.company_code,
                brand_id: entry.brand_id,
                domain_id: entry.domain_id,
                category_ids: entry.category_ids,
                message: `Quantity ${entry.quantity} exceeds allowed maximum ${entry.max_qty}.`,
            });
        }
    }
    return {
        valid: violations.length === 0,
        violations,
    };
};
exports.validateItemsAgainstMaxQty = validateItemsAgainstMaxQty;
const extractMetadataString = (metadata, ...keys) => {
    if (!metadata) {
        return null;
    }
    for (const key of keys) {
        const value = metadata[key];
        if (value === undefined || value === null) {
            continue;
        }
        if (typeof value === "string") {
            const trimmed = value.trim();
            if (trimmed.length) {
                return trimmed;
            }
        }
    }
    return null;
};
const extractMetadataArray = (metadata, ...keys) => {
    if (!metadata) {
        return undefined;
    }
    for (const key of keys) {
        const value = metadata[key];
        if (Array.isArray(value)) {
            return value
                .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
                .filter(Boolean);
        }
        if (typeof value === "string") {
            const parsed = parseCategoryIdsFromString(value);
            if (parsed.length) {
                return parsed;
            }
        }
    }
    return undefined;
};
const mapLineItemToValidationItem = (item) => {
    const rawItem = item;
    const metadata = rawItem?.metadata ?? {};
    const sku = (typeof rawItem?.variant?.sku === "string" && rawItem.variant.sku) ||
        (typeof metadata.sku === "string" && metadata.sku) ||
        (typeof rawItem?.sku === "string" ? rawItem.sku : undefined) ||
        rawItem?.title ||
        "";
    const companyCode = extractMetadataString(metadata, "company_code", "companyCode", "companycode") ?? null;
    const brandId = extractMetadataString(metadata, "brand_id", "brandId", "brandid") ?? null;
    const domainIdValue = metadata.domain_id ??
        metadata.domainId ??
        metadata.domain ??
        metadata.domainID;
    const categoryId = extractMetadataString(metadata, "category_id", "categoryId", "magento_category_id") ?? null;
    const categoryIds = extractMetadataArray(metadata, "category_ids", "categoryIds", "magento_category_ids") ??
        (categoryId ? [categoryId] : undefined);
    return {
        sku,
        quantity: Number(rawItem?.quantity ?? 0),
        brand_id: brandId,
        company_code: companyCode,
        category_id: categoryId ?? undefined,
        category_ids: categoryIds,
        domain_id: toDomainId(domainIdValue) ?? undefined,
    };
};
const buildValidationItemsFromCart = (cart) => {
    const items = Array.isArray(cart?.items) ? cart.items : [];
    return items.map(mapLineItemToValidationItem);
};
exports.buildValidationItemsFromCart = buildValidationItemsFromCart;
const validateCart = async (cart) => {
    const items = (0, exports.buildValidationItemsFromCart)(cart);
    return (0, exports.validateItemsAgainstMaxQty)(items);
};
exports.validateCart = validateCart;
const mergeValidationItems = (base, extras) => {
    const merged = [...base];
    for (const item of extras) {
        if (!item || !item.sku) {
            continue;
        }
        merged.push(item);
    }
    return merged;
};
exports.mergeValidationItems = mergeValidationItems;
const purgeOrderQuantityTrackerBefore = async (before) => {
    return (0, exports.purgeOrderQuantityTracker)(before);
};
exports.purgeOrderQuantityTrackerBefore = purgeOrderQuantityTrackerBefore;
const purgeOrderQuantityTrackerByMonths = async (months) => {
    if (!Number.isFinite(months) || months <= 0) {
        return 0;
    }
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - Math.trunc(months));
    return (0, exports.purgeOrderQuantityTracker)(cutoff);
};
exports.purgeOrderQuantityTrackerByMonths = purgeOrderQuantityTrackerByMonths;
const buildValidationItemFromPayload = (payload) => {
    if (!payload) {
        return null;
    }
    const metadata = (payload.metadata ?? payload.additional_data);
    const quantity = typeof payload.quantity === "number"
        ? payload.quantity
        : Number(payload.quantity);
    const sku = payload.sku ??
        (typeof metadata?.sku === "string" ? metadata.sku : undefined) ??
        "";
    return {
        sku: String(sku || ""),
        quantity: Number.isFinite(quantity) ? quantity : 0,
        brand_id: extractMetadataString(metadata, "brand_id", "brandId", "brandid") ?? undefined,
        company_code: extractMetadataString(metadata, "company_code", "companyCode", "companycode") ?? undefined,
        category_id: extractMetadataString(metadata, "category_id", "categoryId", "magento_category_id") ?? undefined,
        category_ids: extractMetadataArray(metadata, "category_ids", "categoryIds", "magento_category_ids") ?? undefined,
        domain_id: toDomainId(metadata?.domain_id ?? metadata?.domainId ?? metadata?.domain) ?? undefined,
    };
};
exports.buildValidationItemFromPayload = buildValidationItemFromPayload;
const sumTrackedQuantityForBrand = async (brandId, customerId) => {
    await (0, pg_1.ensureRedingtonOrderQuantityTrackerTable)();
    const params = [brandId];
    let whereClause = "brand_id = $1";
    if (typeof customerId === "number" && Number.isFinite(customerId)) {
        params.push(Math.trunc(customerId));
        whereClause += ` AND customer_id = $${params.length}`;
    }
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT COALESCE(SUM(quantity), 0) AS qty
      FROM redington_order_quantity_tracker
      WHERE ${whereClause}
    `, params);
    return Number(rows[0]?.qty ?? 0);
};
const extractFirstCategoryId = (value) => {
    if (!value) {
        return "";
    }
    return value
        .split(/[\s,]+/)
        .map((entry) => entry.trim())
        .filter(Boolean)[0] || "";
};
const getMaxOrderQtySummary = async (input) => {
    const brandId = normalizeString(input.brand_id);
    const accessId = normalizeString(input.access_id);
    if (!brandId) {
        throw new Error("brand_id is required.");
    }
    if (!accessId) {
        throw new Error("accessId is required.");
    }
    const accessMapping = await (0, pg_1.findAccessMappingByAccessId)(accessId);
    if (!accessMapping) {
        throw new Error("Access mapping not found for the provided accessId.");
    }
    const companyCode = normalizeString(accessMapping.company_code ?? "");
    const domainId = typeof accessMapping.domain_id === "number"
        ? accessMapping.domain_id
        : null;
    let allowedQty = null;
    let categoryId = "";
    const [rules] = await (0, exports.listMaxQtyRules)({
        brand_id: brandId,
        company_code: companyCode,
        domain_id: domainId,
    }, { limit: 1, offset: 0 });
    if (rules.length) {
        allowedQty = rules[0].max_qty;
        categoryId = rules[0].category_id ?? "";
    }
    else {
        const [categoryRules] = await (0, exports.listMaxQtyCategories)({
            brand_id: brandId,
            company_code: companyCode,
            domain_id: domainId,
        }, { limit: 1, offset: 0 });
        if (categoryRules.length) {
            allowedQty = categoryRules[0].max_qty;
            categoryId = extractFirstCategoryId(categoryRules[0].category_ids);
        }
    }
    const customerIdNumeric = normalizeOptionalNumber(input.customer_id);
    const orderedQty = await sumTrackedQuantityForBrand(brandId, customerIdNumeric);
    return [
        {
            brand_id: brandId,
            category_id: categoryId,
            allowed_qty: allowedQty !== null && allowedQty !== undefined
                ? String(allowedQty)
                : "",
            ordered_qty: orderedQty > 0 ? String(orderedQty) : "",
        },
    ];
};
exports.getMaxOrderQtySummary = getMaxOrderQtySummary;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9yZWRpbmd0b24tbWF4LXF0eS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FZcUI7QUFNckIsTUFBTSxlQUFlLEdBQUcsQ0FBQyxLQUFjLEVBQVUsRUFBRTtJQUNqRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQzlCLE9BQU8sS0FBSyxDQUFDLElBQUksRUFBRSxDQUFBO0lBQ3JCLENBQUM7SUFDRCxJQUFJLEtBQUssS0FBSyxJQUFJLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQzFDLE9BQU8sRUFBRSxDQUFBO0lBQ1gsQ0FBQztJQUNELE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO0FBQzdCLENBQUMsQ0FBQTtBQUVELE1BQU0sZUFBZSxHQUFHLENBQUMsS0FBYyxFQUFFLFFBQVEsR0FBRyxDQUFDLEVBQVUsRUFBRTtJQUMvRCxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztRQUM3QixPQUFPLFFBQVEsQ0FBQTtJQUNqQixDQUFDO0lBQ0QsT0FBTyxNQUFNLENBQUE7QUFDZixDQUFDLENBQUE7QUFFRCxNQUFNLHVCQUF1QixHQUFHLENBQUMsS0FBYyxFQUFpQixFQUFFO0lBQ2hFLElBQUksS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssU0FBUyxJQUFJLEtBQUssS0FBSyxFQUFFLEVBQUUsQ0FBQztRQUMxRCxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFDRCxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDNUIsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxD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