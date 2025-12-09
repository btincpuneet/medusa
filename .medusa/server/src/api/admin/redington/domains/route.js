"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const pg_1 = require("../../../../lib/pg");
function parseBoolean(value, fallback) {
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
}
async function GET(req, res) {
    await (0, pg_1.ensureRedingtonDomainTable)();
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT id, domain_name, is_active, created_at, updated_at
      FROM redington_domain
      ORDER BY created_at DESC
    `);
    return res.json({
        domains: rows.map(pg_1.mapDomainRow),
    });
}
async function POST(req, res) {
    await (0, pg_1.ensureRedingtonDomainTable)();
    const body = (req.body || {});
    const domainName = (body.domain_name || "").trim();
    if (!domainName) {
        return res.status(400).json({
            message: "domain_name is required",
        });
    }
    const isActive = parseBoolean(body.is_active, true);
    try {
        const { rows } = await (0, pg_1.getPgPool)().query(`
        INSERT INTO redington_domain (domain_name, is_active)
        VALUES ($1, $2)
        RETURNING id, domain_name, is_active, created_at, updated_at
      `, [domainName, isActive]);
        return res.status(201).json({
            domain: (0, pg_1.mapDomainRow)(rows[0]),
        });
    }
    catch (error) {
        if (error?.code === "23505") {
            return res.status(409).json({
                message: `Domain "${domainName}" already exists`,
            });
        }
        return res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "Unexpected error creating domain",
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9kb21haW5zL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBMEJBLGtCQWNDO0FBT0Qsb0JBeUNDO0FBdEZELDJDQUkyQjtBQUUzQixTQUFTLFlBQVksQ0FBQyxLQUFjLEVBQUUsUUFBaUI7SUFDckQsSUFBSSxPQUFPLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUMvQixPQUFPLEtBQUssQ0FBQTtJQUNkLENBQUM7SUFFRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQzlCLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtRQUM3QyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7WUFDcEQsT0FBTyxJQUFJLENBQUE7UUFDYixDQUFDO1FBQ0QsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1lBQ3JELE9BQU8sS0FBSyxDQUFBO1FBQ2QsQ0FBQztJQUNILENBQUM7SUFFRCxPQUFPLFFBQVEsQ0FBQTtBQUNqQixDQUFDO0FBRU0sS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELE1BQU0sSUFBQSwrQkFBMEIsR0FBRSxDQUFBO0lBRWxDLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxNQUFNLElBQUEsY0FBUyxHQUFFLENBQUMsS0FBSyxDQUN0Qzs7OztLQUlDLENBQ0YsQ0FBQTtJQUVELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztRQUNkLE9BQU8sRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLGlCQUFZLENBQUM7S0FDaEMsQ0FBQyxDQUFBO0FBQ0osQ0FBQztBQU9NLEtBQUssVUFBVSxJQUFJLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUNoRSxNQUFNLElBQUEsK0JBQTBCLEdBQUUsQ0FBQTtJQUVsQyxNQUFNLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFxQixDQUFBO0lBQ2pELE1BQU0sVUFBVSxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtJQUVsRCxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDaEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUseUJBQXlCO1NBQ25DLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRCxNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUVuRCxJQUFJLENBQUM7UUFDSCxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxJQUFBLGNBQVMsR0FBRSxDQUFDLEtBQUssQ0FDdEM7Ozs7T0FJQyxFQUNELENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUN2QixDQUFBO1FBRUQsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixNQUFNLEVBQUUsSUFBQSxpQkFBWSxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUM5QixDQUFDLENBQUE7SUFDSixDQUFDO0lBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztRQUNwQixJQUFJLEtBQUssRUFBRSxJQUFJLEtBQUssT0FBTyxFQUFFLENBQUM7WUFDNUIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsT0FBTyxFQUFFLFdBQVcsVUFBVSxrQkFBa0I7YUFDakQsQ0FBQyxDQUFBO1FBQ0osQ0FBQztRQUVELE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDMUIsT0FBTyxFQUNMLEtBQUssWUFBWSxLQUFLO2dCQUNwQixDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU87Z0JBQ2YsQ0FBQyxDQUFDLGtDQUFrQztTQUN6QyxDQUFDLENBQUE7SUFDSixDQUFDO0FBQ0gsQ0FBQyJ9