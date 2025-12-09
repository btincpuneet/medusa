"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const pg_1 = require("../../../../lib/pg");
const normalizeString = (value) => (value ?? "").trim();
const normalizeUpper = (value) => normalizeString(value).toUpperCase();
const parseBoolean = (value, fallback = false) => {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "1", "yes", "on", "active"].includes(normalized)) {
            return true;
        }
        if (["false", "0", "no", "off", "inactive"].includes(normalized)) {
            return false;
        }
    }
    return fallback;
};
const parsePrice = (value, { allowNull = false } = {}) => {
    if (value === null || value === undefined || value === "") {
        return allowNull ? null : undefined;
    }
    const normalized = typeof value === "string" ? value.replace(/,/g, "").trim() : value;
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) {
        return undefined;
    }
    return Math.round(parsed * 10000) / 10000;
};
const parseDate = (value) => {
    const trimmed = normalizeString(value);
    if (!trimmed) {
        return null;
    }
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) {
        return undefined;
    }
    return date.toISOString();
};
const parseDomainId = (value) => {
    if (value === null || value === undefined || value === "") {
        return null;
    }
    if (typeof value === "number") {
        return Number.isFinite(value) && value > 0 ? Math.trunc(value) : undefined;
    }
    const normalized = value.trim().toLowerCase();
    if (["null", "global"].includes(normalized)) {
        return null;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return undefined;
    }
    return Math.trunc(parsed);
};
const clampLimit = (value, fallback) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }
    return Math.min(Math.trunc(parsed), 500);
};
const clampOffset = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
    }
    return Math.trunc(parsed);
};
async function GET(req, res) {
    await (0, pg_1.ensureRedingtonProductPriceTable)();
    const query = (req.query || {});
    const conditions = [];
    const params = [];
    const sku = normalizeString(query.sku);
    if (sku) {
        conditions.push(`LOWER(sku) LIKE $${params.length + 1}`);
        params.push(`%${sku.toLowerCase()}%`);
    }
    const countryCode = normalizeUpper(query.country_code);
    if (countryCode) {
        conditions.push(`country_code = $${params.length + 1}`);
        params.push(countryCode);
    }
    const companyCode = normalizeString(query.company_code);
    if (companyCode) {
        conditions.push(`company_code = $${params.length + 1}`);
        params.push(companyCode);
    }
    const distributionChannel = normalizeString(query.distribution_channel);
    if (distributionChannel) {
        conditions.push(`distribution_channel = $${params.length + 1}`);
        params.push(distributionChannel);
    }
    const brandId = normalizeString(query.brand_id);
    if (brandId) {
        conditions.push(`brand_id = $${params.length + 1}`);
        params.push(brandId);
    }
    const domainParam = query.domain_id;
    if (domainParam !== undefined) {
        if (domainParam === "" || domainParam === null) {
            // ignore
        }
        else if (["global", "null"].includes(domainParam.toLowerCase())) {
            conditions.push(`domain_id IS NULL`);
        }
        else {
            const parsedDomain = parseDomainId(domainParam);
            if (parsedDomain === undefined) {
                return res.status(400).json({
                    message: "domain_id must be a positive integer, 'global', 'null', or omitted",
                });
            }
            conditions.push(`domain_id = $${params.length + 1}`);
            params.push(parsedDomain);
        }
    }
    const isActiveParam = query.is_active?.trim().toLowerCase();
    if (isActiveParam && !["all", ""].includes(isActiveParam)) {
        conditions.push(`is_active = $${params.length + 1}`);
        params.push(parseBoolean(isActiveParam, false));
    }
    const limit = clampLimit(query.limit, 100);
    const offset = clampOffset(query.offset);
    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT
        id,
        sku,
        country_code,
        company_code,
        brand_id,
        distribution_channel,
        domain_id,
        product_base_price,
        product_special_price,
        is_active,
        promotion_channel,
        from_date,
        to_date,
        created_at,
        updated_at,
        COUNT(*) OVER() AS total_count
      FROM redington_product_price
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `, [...params, limit, offset]);
    const count = rows.length && rows[0].total_count !== undefined
        ? Number(rows[0].total_count)
        : 0;
    return res.json({
        product_prices: rows.map(pg_1.mapProductPriceRow),
        count,
        limit,
        offset,
    });
}
async function POST(req, res) {
    await (0, pg_1.ensureRedingtonProductPriceTable)();
    const body = (req.body || {});
    const sku = normalizeString(body.sku);
    if (!sku) {
        return res.status(400).json({ message: "sku is required" });
    }
    const countryCode = normalizeUpper(body.country_code);
    if (!countryCode) {
        return res.status(400).json({ message: "country_code is required" });
    }
    const companyCode = normalizeString(body.company_code);
    if (!companyCode) {
        return res.status(400).json({ message: "company_code is required" });
    }
    const distributionChannel = normalizeString(body.distribution_channel);
    if (!distributionChannel) {
        return res
            .status(400)
            .json({ message: "distribution_channel is required" });
    }
    const basePrice = parsePrice(body.product_base_price, { allowNull: false });
    if (basePrice === undefined) {
        return res.status(400).json({
            message: "product_base_price must be a valid number",
        });
    }
    const specialPrice = parsePrice(body.product_special_price, {
        allowNull: true,
    });
    if (specialPrice === undefined) {
        return res.status(400).json({
            message: "product_special_price must be a valid number",
        });
    }
    const domainId = parseDomainId(body.domain_id ?? null);
    if (domainId === undefined) {
        return res.status(400).json({
            message: "domain_id must be a positive integer, 'global', 'null', or omitted",
        });
    }
    const brandId = normalizeString(body.brand_id) || null;
    const promotionChannel = normalizeString(body.promotion_channel) || null;
    const isActive = parseBoolean(body.is_active, false);
    const fromDate = parseDate(body.from_date);
    if (fromDate === undefined) {
        return res
            .status(400)
            .json({ message: "from_date must be a valid ISO date-time string" });
    }
    const toDate = parseDate(body.to_date);
    if (toDate === undefined) {
        return res
            .status(400)
            .json({ message: "to_date must be a valid ISO date-time string" });
    }
    try {
        const { rows } = await (0, pg_1.getPgPool)().query(`
        INSERT INTO redington_product_price (
          sku,
          country_code,
          company_code,
          brand_id,
          distribution_channel,
          domain_id,
          product_base_price,
          product_special_price,
          is_active,
          promotion_channel,
          from_date,
          to_date
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING
          id,
          sku,
          country_code,
          company_code,
          brand_id,
          distribution_channel,
          domain_id,
          product_base_price,
          product_special_price,
          is_active,
          promotion_channel,
          from_date,
          to_date,
          created_at,
          updated_at
      `, [
            sku,
            countryCode,
            companyCode,
            brandId,
            distributionChannel,
            domainId,
            basePrice,
            specialPrice,
            isActive,
            promotionChannel,
            fromDate,
            toDate,
        ]);
        return res.status(201).json({
            product_price: (0, pg_1.mapProductPriceRow)(rows[0]),
        });
    }
    catch (error) {
        if (error?.code === "23505") {
            return res.status(409).json({
                message: "A product price with the same sku, company_code, distribution_channel, and domain already exists",
            });
        }
        return res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "Unexpected error creating product price",
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9wcm9kdWN0LXByaWNlcy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQXdIQSxrQkE2R0M7QUFFRCxvQkEwSUM7QUEvV0QsMkNBSTJCO0FBSzNCLE1BQU0sZUFBZSxHQUFHLENBQUMsS0FBdUIsRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7QUFDekUsTUFBTSxjQUFjLEdBQUcsQ0FBQyxLQUF1QixFQUFFLEVBQUUsQ0FDakQsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRXRDLE1BQU0sWUFBWSxHQUFHLENBQUMsS0FBaUMsRUFBRSxRQUFRLEdBQUcsS0FBSyxFQUFFLEVBQUU7SUFDM0UsSUFBSSxPQUFPLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUMvQixPQUFPLEtBQUssQ0FBQTtJQUNkLENBQUM7SUFDRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQzlCLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtRQUM3QyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1lBQzlELE9BQU8sSUFBSSxDQUFBO1FBQ2IsQ0FBQztRQUNELElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7WUFDakUsT0FBTyxLQUFLLENBQUE7UUFDZCxDQUFDO0lBQ0gsQ0FBQztJQUNELE9BQU8sUUFBUSxDQUFB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