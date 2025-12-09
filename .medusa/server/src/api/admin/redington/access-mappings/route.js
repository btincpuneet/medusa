"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const pg_1 = require("../../../../lib/pg");
const normalizeCountryCode = (value) => (value ?? "").trim().toUpperCase();
const normalizeMobileExt = (value) => (value ?? "").trim();
const normalizeCompanyCode = (value) => (value ?? "").trim();
const normalizeAccessId = (value) => {
    if (value === null || value === undefined) {
        return "";
    }
    return String(value).trim();
};
const normalizeBrands = (value) => {
    if (!value) {
        return [];
    }
    if (Array.isArray(value)) {
        return value.map((entry) => String(entry).trim()).filter(Boolean);
    }
    return value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
};
const normalizeId = (value) => {
    const parsed = typeof value === "string" ? Number.parseInt(value, 10) : Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};
async function GET(req, res) {
    await Promise.all([
        (0, pg_1.ensureRedingtonAccessMappingTable)(),
        (0, pg_1.ensureRedingtonDomainTable)(),
        (0, pg_1.ensureRedingtonDomainExtentionTable)(),
    ]);
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT
        am.id,
        am.access_id,
        am.country_code,
        am.mobile_ext,
        am.company_code,
        am.brand_ids,
        am.domain_id,
        am.domain_extention_id,
        d.domain_name,
        de.domain_extention_name,
        am.created_at,
        am.updated_at
      FROM redington_access_mapping am
      LEFT JOIN redington_domain d ON d.id = am.domain_id
      LEFT JOIN redington_domain_extention de ON de.id = am.domain_extention_id
      ORDER BY am.created_at DESC
    `);
    return res.json({
        access_mappings: rows.map(pg_1.mapAccessMappingRow),
    });
}
async function POST(req, res) {
    await Promise.all([
        (0, pg_1.ensureRedingtonAccessMappingTable)(),
        (0, pg_1.ensureRedingtonDomainTable)(),
        (0, pg_1.ensureRedingtonDomainExtentionTable)(),
    ]);
    const body = (req.body || {});
    const accessId = normalizeAccessId(body.access_id);
    const countryCode = normalizeCountryCode(body.country_code);
    const mobileExt = normalizeMobileExt(body.mobile_ext);
    const companyCode = normalizeCompanyCode(body.company_code);
    const brandIds = normalizeBrands(body.brand_ids);
    const domainId = normalizeId(body.domain_id);
    const domainExtentionId = normalizeId(body.domain_extention_id);
    if (!accessId) {
        return res.status(400).json({ message: "access_id is required" });
    }
    if (!countryCode) {
        return res.status(400).json({ message: "country_code is required" });
    }
    if (!mobileExt) {
        return res.status(400).json({ message: "mobile_ext is required" });
    }
    if (!companyCode) {
        return res.status(400).json({ message: "company_code is required" });
    }
    if (!domainId) {
        return res.status(400).json({ message: "domain_id is required" });
    }
    if (!domainExtentionId) {
        return res.status(400).json({ message: "domain_extention_id is required" });
    }
    const brandIdsJson = JSON.stringify(brandIds);
    try {
        const { rows } = await (0, pg_1.getPgPool)().query(`
        INSERT INTO redington_access_mapping
          (access_id, country_code, mobile_ext, company_code, brand_ids, domain_id, domain_extention_id)
        VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
        RETURNING
          id,
          access_id,
          country_code,
          mobile_ext,
          company_code,
          brand_ids,
          domain_id,
          domain_extention_id,
          created_at,
          updated_at
      `, [accessId, countryCode, mobileExt, companyCode, brandIdsJson, domainId, domainExtentionId]);
        const created = rows[0];
        const { rows: hydrated } = await (0, pg_1.getPgPool)().query(`
        SELECT
          am.id,
          am.access_id,
          am.country_code,
          am.mobile_ext,
          am.company_code,
          am.brand_ids,
          am.domain_id,
          am.domain_extention_id,
          d.domain_name,
          de.domain_extention_name,
          am.created_at,
          am.updated_at
        FROM redington_access_mapping am
        LEFT JOIN redington_domain d ON d.id = am.domain_id
        LEFT JOIN redington_domain_extention de ON de.id = am.domain_extention_id
        WHERE am.id = $1
      `, [created.id]);
        return res.status(201).json({
            access_mapping: (0, pg_1.mapAccessMappingRow)(hydrated[0] ?? created),
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "Unexpected error creating access mapping",
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9hY2Nlc3MtbWFwcGluZ3Mvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUF5REEsa0JBZ0NDO0FBRUQsb0JBb0dDO0FBN0xELDJDQU0yQjtBQWMzQixNQUFNLG9CQUFvQixHQUFHLENBQUMsS0FBdUIsRUFBRSxFQUFFLENBQ3ZELENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRXBDLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxLQUF1QixFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtBQUU1RSxNQUFNLG9CQUFvQixHQUFHLENBQUMsS0FBdUIsRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7QUFFOUUsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLEtBQWdDLEVBQUUsRUFBRTtJQUM3RCxJQUFJLEtBQUssS0FBSyxJQUFJLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQzFDLE9BQU8sRUFBRSxDQUFBO0lBQ1gsQ0FBQztJQUNELE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO0FBQzdCLENBQUMsQ0FBQTtBQUVELE1BQU0sZUFBZSxHQUFHLENBQUMsS0FBa0MsRUFBWSxFQUFFO0lBQ3ZFLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNYLE9BQU8sRUFBRSxDQUFBO0lBQ1gsQ0FBQztJQUVELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ3pCLE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsTUFB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