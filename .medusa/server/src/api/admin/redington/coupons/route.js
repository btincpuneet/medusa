"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const pg_1 = require("../../../../lib/pg");
const normalizeString = (value) => typeof value === "string" ? value.trim() : "";
const parseNumeric = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim().length) {
        const parsed = Number.parseInt(value.trim(), 10);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
};
const parseBoolean = (value, fallback) => {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "1", "yes", "on"].includes(normalized)) {
            return true;
        }
        if (["false", "0", "no", "off"].includes(normalized)) {
            return false;
        }
    }
    return fallback;
};
const ensureDomainExtentionExists = async (domainExtentionId) => {
    await (0, pg_1.ensureRedingtonDomainExtentionTable)();
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT id
      FROM redington_domain_extention
      WHERE id = $1
      LIMIT 1
    `, [domainExtentionId]);
    return rows[0]?.id ? Number(rows[0].id) : null;
};
async function GET(req, res) {
    await (0, pg_1.ensureRedingtonCouponRuleTable)();
    const clauses = [];
    const params = [];
    if (req.query.company_code) {
        clauses.push(`company_code = $${clauses.length + 1}`);
        params.push(String(req.query.company_code).trim());
    }
    const domainId = parseNumeric(req.query.domain_id ?? req.query.domainId);
    if (domainId) {
        clauses.push(`domain_id = $${clauses.length + 1}`);
        params.push(domainId);
    }
    const isActive = req.query.is_active !== undefined
        ? parseBoolean(req.query.is_active, true)
        : undefined;
    if (isActive !== undefined) {
        clauses.push(`is_active = $${clauses.length + 1}`);
        params.push(isActive);
    }
    const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT *
      FROM redington_coupon_rule
      ${whereClause}
      ORDER BY updated_at DESC
    `, params);
    return res.json({
        coupon_rules: rows.map(pg_1.mapCouponRuleRow),
    });
}
async function POST(req, res) {
    await Promise.all([
        (0, pg_1.ensureRedingtonCouponRuleTable)(),
        (0, pg_1.ensureRedingtonDomainTable)(),
        (0, pg_1.ensureRedingtonDomainExtentionTable)(),
    ]);
    const body = (req.body || {});
    const couponCode = normalizeString(body.coupon_code);
    if (!couponCode) {
        return res.status(400).json({ message: "coupon_code is required" });
    }
    const companyCode = normalizeString(body.company_code);
    if (!companyCode) {
        return res.status(400).json({ message: "company_code is required" });
    }
    const domainId = parseNumeric(body.domain_id);
    if (!domainId) {
        return res.status(400).json({ message: "domain_id is required" });
    }
    const domain = await (0, pg_1.findDomainById)(domainId);
    if (!domain) {
        return res.status(404).json({
            message: `Domain with id ${domainId} not found`,
        });
    }
    let domainExtentionId = null;
    if (body.domain_extention_id !== undefined && body.domain_extention_id !== null) {
        const parsed = parseNumeric(body.domain_extention_id);
        if (!parsed) {
            return res.status(400).json({
                message: "domain_extention_id must be a valid number",
            });
        }
        const existing = await ensureDomainExtentionExists(parsed);
        if (!existing) {
            return res.status(404).json({
                message: `Domain extension with id ${parsed} not found`,
            });
        }
        domainExtentionId = parsed;
    }
    const metadata = typeof body.metadata === "object" && body.metadata !== null
        ? body.metadata
        : {};
    try {
        const { rows } = await (0, pg_1.getPgPool)().query(`
        INSERT INTO redington_coupon_rule (
          coupon_code,
          company_code,
          domain_id,
          domain_extention_id,
          is_active,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
        RETURNING *
      `, [
            couponCode,
            companyCode,
            domainId,
            domainExtentionId,
            parseBoolean(body.is_active, true),
            JSON.stringify(metadata),
        ]);
        return res.status(201).json({
            coupon_rule: (0, pg_1.mapCouponRuleRow)(rows[0]),
        });
    }
    catch (error) {
        if (error?.code === "23505") {
            return res.status(409).json({
                message: "Coupon rule already exists for this combination of company, domain, and extension.",
            });
        }
        return res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "Unexpected error creating coupon rule",
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9jb3Vwb25zL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBb0VBLGtCQXlDQztBQUVELG9CQWdHQztBQTdNRCwyQ0FPMkI7QUFXM0IsTUFBTSxlQUFlLEdBQUcsQ0FBQyxLQUFjLEVBQUUsRUFBRSxDQUN6QyxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFBO0FBRS9DLE1BQU0sWUFBWSxHQUFHLENBQUMsS0FBYyxFQUFzQixFQUFFO0lBQzFELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztRQUN4RCxPQUFPLEtBQUssQ0FBQTtJQUNkLENBQUM7SUFFRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDckQsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDaEQsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQTtJQUNyRCxDQUFDO0lBRUQsT0FBTyxTQUFTLENBQUE7QUFDbEIsQ0FBQyxDQUFBO0FBRUQsTUFBTSxZQUFZLEdBQUcsQ0FBQyxLQUFjLEVBQUUsUUFBaUIsRUFBRSxFQUFFO0lBQ3pELElBQUksT0FBTyxLQUFLLEtBQUssU0FBUyxFQUFFLENBQUM7UUFDL0IsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0lBQ0QsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztRQUM5QixNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDN0MsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1lBQ3BELE9BQU8sSUFBSSxDQUFBO1FBQ2IsQ0FBQztRQUNELElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztZQUNyRCxPQUFPLEtBQUssQ0FBQTtRQUNkLENBQUM7SUFDSCxDQUFDO0lBQ0QsT0FBTyxRQUFRLENBQUE7QUFDakIsQ0FBQyxDQUFBO0FBRUQsTUFBTSwyQkFBMkIsR0FBRyxLQUFLLEVBQUUsaUJBQXlCLEVBQUUsRUFBRTtJQUN0RSxNQUFNLElBQUEsd0NBQW1DLEdBQUUsQ0FBQTtJQUUzQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxJQUFBLGNBQVMsR0FBRSxDQUFDLEtBQUssQ0FDdEM7Ozs7O0tBS0MsRUFDRCxDQUFDLGlCQUFpQixDQUFDLENBQ3BCLENBQUE7SUFFRCxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQTtBQUNoRCxDQUFDLENBQUE7QUFFTSxLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsTUFBTSxJQUFBLG1DQUE4QixHQUFFLENBQUE7SUFFdEMsTUFBTSxPQUFPLEdBQWEsRUFBRSxDQUFBO0lBQzVCLE1BQU0sTUFBTSxHQUFVLEVBQUUsQ0FBQTtJQUV4QixJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDM0IsT0FBTyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ3JELE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQTtJQUNwRCxDQUFDO0lBRUQsTUFBTSxRQUFRLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUE7SUFDeEUsSUFBSSxRQUFRLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUNsRCxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBO0lBQ3ZCLENBQUM7SUFFRCxNQUFNLFFBQVEsR0FDWixHQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsS0FBSyxTQUFTO1FBQy9CLENBQUMsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDO1FBQ3pDLENBQUMsQ0FBQyxTQUFTLENBQUE7SUFDZixJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUMzQixPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDbEQsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtJQUN2QixDQUFDO0lBRUQsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQTtJQUUxRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxJQUFBLGNBQVMsR0FBRSxDQUFDLEtBQUssQ0FDdEM7OztRQUdJLFdBQVc7O0tBRWQsRUFDRCxNQUFNLENBQ1AsQ0FBQTtJQUVELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztRQUNkLFlBQVksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLHFCQUFnQixDQUFDO0tBQ3pDLENBQUMsQ0FBQTtBQUNKLENBQUM7QUFFTSxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ2hCLElBQUEsbUNBQThCLEdBQUU7UUFDaEMsSUFBQSwrQkFBMEIsR0FBRTtRQUM1QixJQUFBLHdDQUFtQyxHQUFFO0tBQ3RDLENBQUMsQ0FBQTtJQUVGLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLENBQXlCLENBQUE7SUFFckQsTUFBTSxVQUFVLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQTtJQUNwRCxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDaEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSx5QkFBeUIsRUFBRSxDQUFDLENBQUE7SUFDckUsQ0FBQztJQUVELE1BQU0sV0FBVyxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUE7SUFDdEQsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ2pCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsQ0FBQyxDQUFBO0lBQ3RFLENBQUM7SUFFRCxNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO0lBQzdDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNkLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsQ0FBQyxDQUFBO0lBQ25FLENBQUM7SUFFRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsbUJBQWMsRUFBQyxRQUFRLENBQUMsQ0FBQTtJQUM3QyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDWixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFBRSxrQkFBa0IsUUFBUSxZQUFZO1NBQ2hELENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRCxJQUFJLGlCQUFpQixHQUFrQixJQUFJLENBQUE7SUFDM0MsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEtBQUssU0FBUyxJQUFJLElBQUksQ0FBQyxtQkFBbUIsS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUNoRixNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUE7UUFDckQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ1osT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsT0FBTyxFQUFFLDRDQUE0QzthQUN0RCxDQUFDLENBQUE7UUFDSixDQUFDO1FBRUQsTUFBTSxRQUFRLEdBQUcsTUFBTSwyQkFBMkIsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUMxRCxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDZCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixPQUFPLEVBQUUsNEJBQTRCLE1BQU0sWUFBWTthQUN4RCxDQUFDLENBQUE7UUFDSixDQUFDO1FBQ0QsaUJBQWlCLEdBQUcsTUFBTSxDQUFBO0lBQzVCLENBQUM7SUFFRCxNQUFNLFFBQVEsR0FDWixPQUFPLElBQUksQ0FBQyxRQUFRLEtBQUssUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssSUFBSTtRQUN6RCxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVE7UUFDZixDQUFDLENBQUMsRUFBRSxDQUFBO0lBRVIsSUFBSSxDQUFDO1FBQ0gsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLE1BQU0sSUFBQSxjQUFTLEdBQUUsQ0FBQyxLQUFLLENBQ3RDOzs7Ozs7Ozs7OztPQVdDLEVBQ0Q7WUFDRSxVQUFVO1lBQ1YsV0FBVztZQUNYLFFBQVE7WUFDUixpQkFBaUI7WUFDakIsWUFBWSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO1NBQ3pCLENBQ0YsQ0FBQTtRQUVELE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDMUIsV0FBVyxFQUFFLElBQUEscUJBQWdCLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3ZDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1FBQ3BCLElBQUksS0FBSyxFQUFFLElBQUksS0FBSyxPQUFPLEVBQUUsQ0FBQztZQUM1QixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixPQUFPLEVBQ0wsb0ZBQW9GO2FBQ3ZGLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFDTCxLQUFLLFlBQVksS0FBSztnQkFDcEIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPO2dCQUNmLENBQUMsQ0FBQyx1Q0FBdUM7U0FDOUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQztBQUNILENBQUMifQ==