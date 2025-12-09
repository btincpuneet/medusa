"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const pg_1 = require("../../../../lib/pg");
const parseAccessId = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
    }
    if (typeof value === "string" && value.trim().length) {
        return value.trim();
    }
    return undefined;
};
async function GET(req, res) {
    await Promise.all([
        (0, pg_1.ensureRedingtonAccessMappingTable)(),
        (0, pg_1.ensureRedingtonCustomerNumberTable)(),
    ]);
    const accessId = parseAccessId(req.query.access_id ?? req.query.accessId ?? req.query.access);
    if (!accessId) {
        return res.status(400).json({
            message: "access_id query parameter is required",
        });
    }
    const { rows: mappingRows } = await (0, pg_1.getPgPool)().query(`
      SELECT
        am.*,
        d.domain_name,
        de.domain_extention_name
      FROM redington_access_mapping am
      LEFT JOIN redington_domain d ON d.id = am.domain_id
      LEFT JOIN redington_domain_extention de ON de.id = am.domain_extention_id
      WHERE am.access_id = $1
      LIMIT 1
    `, [accessId]);
    if (!mappingRows[0]) {
        return res.status(404).json({
            message: `Access mapping ${accessId} not found`,
        });
    }
    const mapping = (0, pg_1.mapAccessMappingRow)(mappingRows[0]);
    const brandFilter = typeof req.query.brand_id === "string"
        ? req.query.brand_id.trim()
        : undefined;
    const brandIds = mapping.brand_ids.length
        ? mapping.brand_ids
        : [brandFilter].filter(Boolean) ?? [];
    if (!brandIds.length) {
        return res.status(404).json({
            message: "No brand information is linked to this access mapping. Unable to resolve customer numbers.",
        });
    }
    if (brandFilter && !brandIds.includes(brandFilter)) {
        return res.status(404).json({
            message: `Brand ${brandFilter} is not associated with access ${accessId}.`,
        });
    }
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT *
      FROM redington_customer_number
      WHERE company_code = $1
        AND domain_id = $2
        AND brand_id = ANY($3::text[])
      ORDER BY created_at DESC
    `, [mapping.company_code, mapping.domain_id, brandFilter ? [brandFilter] : brandIds]);
    if (!rows.length) {
        return res.status(404).json({
            message: "No customer numbers found for the given access and brands.",
        });
    }
    return res.json({
        access: {
            id: mapping.access_id ?? String(mapping.id),
            company_code: mapping.company_code,
            domain_id: mapping.domain_id,
            domain_name: mapping.domain_name,
            domain_extention_id: mapping.domain_extention_id,
            domain_extention_name: mapping.domain_extention_name,
            brand_ids: brandIds,
        },
        customer_numbers: rows.map(pg_1.mapCustomerNumberRow),
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3JlZGluZ3Rvbi9jdXN0b21lci1udW1iZXJzL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBc0JBLGtCQTBGQztBQTlHRCwyQ0FNMkI7QUFFM0IsTUFBTSxhQUFhLEdBQUcsQ0FBQyxLQUFjLEVBQXNCLEVBQUU7SUFDM0QsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ3hELE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQ3RCLENBQUM7SUFFRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDckQsT0FBTyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDckIsQ0FBQztJQUVELE9BQU8sU0FBUyxDQUFBO0FBQ2xCLENBQUMsQ0FBQTtBQUVNLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDaEIsSUFBQSxzQ0FBaUMsR0FBRTtRQUNuQyxJQUFBLHVDQUFrQyxHQUFFO0tBQ3JDLENBQUMsQ0FBQTtJQUVGLE1BQU0sUUFBUSxHQUFHLGFBQWEsQ0FDNUIsR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQzlELENBQUE7SUFFRCxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDZCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFBRSx1Q0FBdUM7U0FDakQsQ0FBQyxDQUFBO0lBQ0osQ0FB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