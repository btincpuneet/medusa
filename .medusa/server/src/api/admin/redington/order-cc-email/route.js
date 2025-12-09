"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const pg_1 = require("../../../../lib/pg");
const clampLimit = (value, fallback = 100, max = 200) => {
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
const parseNullableId = (value) => {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
        const normalized = Math.trunc(value);
        return normalized > 0 ? normalized : undefined;
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed.length || trimmed.toLowerCase() === "null") {
            return null;
        }
        const parsed = Number.parseInt(trimmed, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
    }
    return undefined;
};
const normalizeList = (value, { allowUndefined = false } = {}) => {
    if (value === undefined) {
        return allowUndefined ? undefined : [];
    }
    if (value === null) {
        return [];
    }
    if (Array.isArray(value)) {
        return value
            .map((entry) => String(entry).trim())
            .filter(Boolean);
    }
    if (typeof value === "string") {
        return value
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean);
    }
    return [];
};
const serializeList = (values) => values && values.length ? values.join(",") : null;
async function GET(req, res) {
    await (0, pg_1.ensureRedingtonOrderCcEmailTable)();
    const query = (req.query || {});
    const conditions = [];
    const params = [];
    const companyCode = (query.company_code || "").trim();
    if (companyCode) {
        conditions.push(`LOWER(company_code) = LOWER($${params.length + 1})`);
        params.push(companyCode);
    }
    const domainId = parseNullableId(query.domain_id);
    if (query.domain_id !== undefined) {
        if (domainId === undefined) {
            return res
                .status(400)
                .json({ message: "domain_id must be a number or null" });
        }
        if (domainId === null) {
            conditions.push("domain_id IS NULL");
        }
        else {
            conditions.push(`domain_id = $${params.length + 1}`);
            params.push(domainId);
        }
    }
    const domainExtentionId = parseNullableId(query.domain_extention_id);
    if (query.domain_extention_id !== undefined) {
        if (domainExtentionId === undefined) {
            return res.status(400).json({
                message: "domain_extention_id must be a number or null",
            });
        }
        if (domainExtentionId === null) {
            conditions.push("domain_extention_id IS NULL");
        }
        else {
            conditions.push(`domain_extention_id = $${params.length + 1}`);
            params.push(domainExtentionId);
        }
    }
    const emailSearch = (query.email || "").trim().toLowerCase();
    if (emailSearch) {
        conditions.push(`LOWER(COALESCE(cc_emails, '')) LIKE $${params.length + 1}`);
        params.push(`%${emailSearch}%`);
    }
    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";
    const limit = clampLimit(query.limit);
    const offset = clampOffset(query.offset);
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT
        oce.*,
        d.domain_name,
        de.domain_extention_name,
        COUNT(*) OVER() AS total_count
      FROM redington_order_cc_email oce
      LEFT JOIN redington_domain d ON d.id = oce.domain_id
      LEFT JOIN redington_domain_extention de ON de.id = oce.domain_extention_id
      ${whereClause}
      ORDER BY oce.updated_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `, [...params, limit, offset]);
    const count = rows.length && rows[0].total_count !== undefined
        ? Number(rows[0].total_count)
        : 0;
    return res.json({
        order_cc_emails: rows.map((row) => ({
            ...(0, pg_1.mapOrderCcEmailRow)(row),
            domain_name: typeof row.domain_name === "string" && row.domain_name.length
                ? row.domain_name
                : null,
            domain_extention_name: typeof row.domain_extention_name === "string" &&
                row.domain_extention_name.length
                ? row.domain_extention_name
                : null,
        })),
        count,
        limit,
        offset,
    });
}
async function POST(req, res) {
    await (0, pg_1.ensureRedingtonOrderCcEmailTable)();
    const body = (req.body || {});
    const companyCode = (body.company_code || "").trim();
    if (!companyCode) {
        return res.status(400).json({
            message: "company_code is required",
        });
    }
    const domainId = parseNullableId(body.domain_id);
    if (body.domain_id !== undefined && domainId === undefined) {
        return res.status(400).json({
            message: "domain_id must be a number or null",
        });
    }
    const domainExtentionId = parseNullableId(body.domain_extention_id);
    if (body.domain_extention_id !== undefined && domainExtentionId === undefined) {
        return res.status(400).json({
            message: "domain_extention_id must be a number or null",
        });
    }
    const ccEmails = normalizeList(body.cc_emails) || [];
    if (!ccEmails.length) {
        return res.status(400).json({
            message: "cc_emails is required",
        });
    }
    const brandIds = normalizeList(body.brand_ids);
    const [domain, domainExtension] = await Promise.all([
        domainId ? (0, pg_1.findDomainById)(domainId) : Promise.resolve(null),
        domainExtentionId ? (0, pg_1.findDomainExtentionById)(domainExtentionId) : Promise.resolve(null),
    ]);
    if (domainId && !domain) {
        return res.status(404).json({
            message: `Domain with id ${domainId} not found`,
        });
    }
    if (domainExtentionId && !domainExtension) {
        return res.status(404).json({
            message: `Domain extension with id ${domainExtentionId} not found`,
        });
    }
    const { rows } = await (0, pg_1.getPgPool)().query(`
      INSERT INTO redington_order_cc_email (
        company_code,
        domain_id,
        domain_extention_id,
        brand_ids,
        cc_emails
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
        companyCode,
        domainId ?? null,
        domainExtentionId ?? null,
        serializeList(brandIds),
        serializeList(ccEmails),
    ]);
    const mapped = (0, pg_1.mapOrderCcEmailRow)(rows[0]);
    return res.status(201).json({
        order_cc_email: {
            ...mapped,
            domain_name: domain?.domain_name ?? null,
            domain_extention_name: domainExtension?.domain_extention_name ?? null,
        },
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9vcmRlci1jYy1lbWFpbC9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQThGQSxrQkFnR0M7QUFFRCxvQkFrRkM7QUFoUkQsMkNBTTJCO0FBbUIzQixNQUFNLFVBQVUsR0FBRyxDQUFDLEtBQWMsRUFBRSxRQUFRLEdBQUcsR0FBRyxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsRUFBRTtJQUMvRCxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQzVDLE9BQU8sUUFBUSxDQUFBO0lBQ2pCLENBQUM7SUFDRCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQTtBQUMxQyxDQUFDLENBQUE7QUFFRCxNQUFNLFdBQVcsR0FBRyxDQUFDLEtBQWMsRUFBRSxFQUFFO0lBQ3JDLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUM1QixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDM0MsT0FBTyxDQUFDLENBQUE7SUFDVixDQUFDO0lBQ0QsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0FBQzNCLENBQUMsQ0FBQTtBQUVELE1BQU0sZUFBZSxHQUFHLENBQ3RCLEtBQWMsRUFDYSxFQUFFO0lBQzdCLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQ3hCLE9BQU8sU0FBUyxDQUFBO0lBQ2xCLENBQUM7SUFDRCxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUNuQixPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFDRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDeEQsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUNwQyxPQUFPLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFBO0lBQ2hELENBQUM7SUFDRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQzlCLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQTtRQUM1QixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUMsV0FBVyxFQUFFLEtBQUssTUFBTSxFQUFFLENBQUM7WUFDeEQsT0FBTyxJQUFJLENBQUE7UUFDYixDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDM0MsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFBO0lBQ25FLENBQUM7SUFDRCxPQUFPLFNBQVMsQ0FBQTtBQUNsQixDQUFDLENBQUE7QUFFRCxNQUFNLGFBQWEsR0FBRyxDQUNwQixLQUFjLEVBQ2QsRUFBRSxjQUFjLEdBQUcsS0FBSyxLQUFtQyxFQUFFLEVBQ3ZDLEVBQUU7SUFDeEIsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFLENBQUM7UUFDeEIsT0FBTyxjQUFjLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFBO0lBQ3hDLENBQUM7SUFDRCxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUNuQixPQUFPLEVBQUUsQ0FBQTtJQUNYLENBQUM7SUFDRCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztRQUN6QixPQUFPLEtBQUs7YUFDVCxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQzthQUNwQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDcEIsQ0FBQztJQUNELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDOUIsT0FBTyxLQUFLO2FBQ1QsS0FBSyxDQUFDLEdBQUcsQ0FBQzthQUNWLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO2FBQzVCLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUNwQixDQUFDO0lBQ0QsT0FBTyxFQUFFLENBQUE7QUFDWCxDQUFDLENBQUE7QUFFRCxNQUFNLGFBQWEsR0FBRyxDQUFDLE1BQTRCLEVBQUUsRUFBRSxDQUNyRCxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFBO0FBRTVDLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxNQUFNLElBQUEscUNBQWdDLEdBQUUsQ0FBQTtJQUV4QyxNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFzQixDQUFBO0lBQ3BELE1BQU0sVUFBVSxHQUFhLEVBQUUsQ0FBQTtJQUMvQixNQUFNLE1BQU0sR0FBVSxFQUFFLENBQUE7SUFFeEIsTUFBTSxXQUFXLEdBQUcsQ0FBQyxLQUFLLENBQUMsWUFBWSxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO0lBQ3JELElBQUksV0FBVyxFQUFFLENBQUM7UUFDaEIsVUFBVSxDQUFDLElBQUksQ0FBQyxnQ0FBZ0MsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ3JFLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUE7SUFDMUIsQ0FBQztJQUVELE1BQU0sUUFBUSxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUE7SUFDakQsSUFBSSxLQUFLLENBQUMsU0FBUyxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQ2xDLElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzNCLE9BQU8sR0FBRztpQkFDUCxNQUFNLENBQUMsR0FBRyxDQUFDO2lCQUNYLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxvQ0FBb0MsRUFBRSxDQUFDLENBQUE7UUFDNUQsQ0FBQztRQUNELElBQUksUUFBUSxLQUFLLElBQUksRUFBRSxDQUFDO1lBQ3RCLFVBQVUsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQTtRQUN0QyxDQUFDO2FBQU0sQ0FBQztZQUNOLFVBQVUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUNwRCxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ3ZCLENBQUM7SUFDSCxDQUFDO0lBRUQsTUFBTSxpQkFBaUIsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUE7SUFDcEUsSUFBSSxLQUFLLENBQUMsbUJBQW1CLEtBQUssU0FBUyxFQUFFLENBQUM7UUFDNUMsSUFBSSxpQkFBaUIsS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUNwQyxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixPQUFPLEVBQUUsOENBQThDO2FBQ3hELENBQUMsQ0FBQTtRQUNKLENBQUM7UUFDRCxJQUFJLGlCQUFpQixLQUFLLElBQUksRUFBRSxDQUFDO1lBQy9CLFVBQVUsQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsQ0FBQTtRQUNoRCxDQUFDO2FBQU0sQ0FBQztZQUNOLFVBQVUsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUM5RCxNQUFNLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUE7UUFDaEMsQ0FBQztJQUNILENBQUM7SUFFRCxNQUFNLFdBQVcsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUE7SUFDNUQsSUFBSSxXQUFXLEVBQUUsQ0FBQztRQUNoQixVQUFVLENBQUMsSUFBSSxDQUFDLHdDQUF3QyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDNUUsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUE7SUFDakMsQ0FBQztJQUVELE1BQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQyxNQUFNO1FBQ25DLENBQUMsQ0FBQyxTQUFTLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDckMsQ0FBQyxDQUFDLEVBQUUsQ0FBQTtJQUVOLE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDckMsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUV4QyxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxJQUFBLGNBQVMsR0FBRSxDQUFDLEtBQUssQ0FDdEM7Ozs7Ozs7OztRQVNJLFdBQVc7O2VBRUosTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDO2dCQUNoQixNQUFNLENBQUMsTUFBTSxHQUFHLENBQUM7S0FDNUIsRUFDRCxDQUFDLEdBQUcsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FDM0IsQ0FBQTtJQUVELE1BQU0sS0FBSyxHQUNULElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsS0FBSyxTQUFTO1FBQzlDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztRQUM3QixDQUFDLENBQUMsQ0FBQyxDQUFBO0lBRVAsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQ2QsZUFBZSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDbEMsR0FBRyxJQUFBLHVCQUFrQixFQUFDLEdBQUcsQ0FBQztZQUMxQixXQUFXLEVBQ1QsT0FBTyxHQUFHLENBQUMsV0FBVyxLQUFLLFFBQVEsSUFBSSxHQUFHLENBQUMsV0FBVyxDQUFDLE1BQU07Z0JBQzNELENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVztnQkFDakIsQ0FBQyxDQUFDLElBQUk7WUFDVixxQkFBcUIsRUFDbkIsT0FBTyxHQUFHLENBQUMscUJBQXFCLEtBQUssUUFBUTtnQkFDN0MsR0FBRyxDQUFDLHFCQUFxQixDQUFDLE1BQU07Z0JBQzlCLENBQUMsQ0FBQyxHQUFHLENBQUMscUJBQXFCO2dCQUMzQixDQUFDLENBQUMsSUFBSTtTQUNYLENBQUMsQ0FBQztRQUNILEtBQUs7UUFDTCxLQUFLO1FBQ0wsTUFBTTtLQUNQLENBQUMsQ0FBQTtBQUNKLENBQUM7QUFFTSxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsTUFBTSxJQUFBLHFDQUFnQyxHQUFFLENBQUE7SUFFeEMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBcUIsQ0FBQTtJQUVqRCxNQUFNLFdBQVcsR0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDcEQsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ2pCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDMUIsT0FBTyxFQUFFLDBCQUEwQjtTQUNwQyxDQUFDLENBQUE7SUFDSixDQUFDO0lBRUQsTUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQTtJQUNoRCxJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssU0FBUyxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUMzRCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFBRSxvQ0FBb0M7U0FDOUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVELE1BQU0saUJBQWlCLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFBO0lBQ25FLElBQUksSUFBSSxDQUFDLG1CQUFtQixLQUFLLFNBQVMsSUFBSSxpQkFBaUIsS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUM5RSxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFBRSw4Q0FBOEM7U0FDeEQsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVELE1BQU0sUUFBUSxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFBO0lBQ3BELElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDckIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUsdUJBQXVCO1NBQ2pDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRCxNQUFNLFFBQVEsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO0lBRTlDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsZUFBZSxDQUFDLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ2xELFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBQSxtQkFBYyxFQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztRQUMzRCxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsSUFBQSw0QkFBdUIsRUFBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztLQUN2RixDQUFDLENBQUE7SUFFRixJQUFJLFFBQVEsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3hCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDMUIsT0FBTyxFQUFFLGtCQUFrQixRQUFRLFlBQVk7U0FDaEQsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVELElBQUksaUJBQWlCLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUMxQyxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFBRSw0QkFBNEIsaUJBQWlCLFlBQVk7U0FDbkUsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVELE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxNQUFNLElBQUEsY0FBUyxHQUFFLENBQUMsS0FBSyxDQUN0Qzs7Ozs7Ozs7OztLQVVDLEVBQ0Q7UUFDRSxXQUFXO1FBQ1gsUUFBUSxJQUFJLElBQUk7UUFDaEIsaUJBQWlCLElBQUksSUFBSTtRQUN6QixhQUFhLENBQUMsUUFBUSxDQUFDO1FBQ3ZCLGFBQWEsQ0FBQyxRQUFRLENBQUM7S0FDeEIsQ0FDRixDQUFBO0lBRUQsTUFBTSxNQUFNLEdBQUcsSUFBQSx1QkFBa0IsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUUxQyxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQzFCLGNBQWMsRUFBRTtZQUNkLEdBQUcsTUFBTTtZQUNULFdBQVcsRUFBRSxNQUFNLEVBQUUsV0FBVyxJQUFJLElBQUk7WUFDeEMscUJBQXFCLEVBQUUsZUFBZSxFQUFFLHFCQUFxQixJQUFJLElBQUk7U0FDdEU7S0FDRixDQUFDLENBQUE7QUFDSixDQUFDIn0=