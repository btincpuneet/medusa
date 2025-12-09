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
function normalizeExtentionName(value) {
    let normalized = value.trim();
    if (!normalized.length) {
        return "";
    }
    if (!normalized.startsWith(".")) {
        normalized = `.${normalized}`;
    }
    return normalized.toLowerCase();
}
async function GET(req, res) {
    await (0, pg_1.ensureRedingtonDomainExtentionTable)();
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT id, domain_extention_name, status, created_at, updated_at
      FROM redington_domain_extention
      ORDER BY created_at DESC
    `);
    return res.json({
        domain_extentions: rows.map(pg_1.mapDomainExtentionRow),
    });
}
async function POST(req, res) {
    await (0, pg_1.ensureRedingtonDomainExtentionTable)();
    const body = (req.body || {});
    const rawName = body.domain_extention_name ?? "";
    const normalizedName = normalizeExtentionName(rawName);
    if (!normalizedName) {
        return res.status(400).json({
            message: "domain_extention_name is required",
        });
    }
    const isActive = parseBoolean(body.status, true);
    try {
        const { rows } = await (0, pg_1.getPgPool)().query(`
        INSERT INTO redington_domain_extention (domain_extention_name, status)
        VALUES ($1, $2)
        RETURNING id, domain_extention_name, status, created_at, updated_at
      `, [normalizedName, isActive]);
        return res.status(201).json({
            domain_extention: (0, pg_1.mapDomainExtentionRow)(rows[0]),
        });
    }
    catch (error) {
        if (error?.code === "23505") {
            return res.status(409).json({
                message: `Domain extention "${normalizedName}" already exists`,
            });
        }
        return res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "Unexpected error creating domain extention",
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9kb21haW4tZXh0ZW5zaW9ucy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQTBDQSxrQkFjQztBQU9ELG9CQTBDQztBQXZHRCwyQ0FJMkI7QUFJM0IsU0FBUyxZQUFZLENBQUMsS0FBaUMsRUFBRSxRQUFpQjtJQUN4RSxJQUFJLE9BQU8sS0FBSyxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQy9CLE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztJQUVELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDOUIsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFBO1FBQzdDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztZQUNwRCxPQUFPLElBQUksQ0FBQTtRQUNiLENBQUM7UUFDRCxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7WUFDckQsT0FBTyxLQUFLLENBQUE7UUFDZCxDQUFDO0lBQ0gsQ0FBQztJQUVELE9BQU8sUUFBUSxDQUFBO0FBQ2pCLENBQUM7QUFFRCxTQUFTLHNCQUFzQixDQUFDLEtBQWE7SUFDM0MsSUFBSSxVQUFVLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFBO0lBRTdCLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDdkIsT0FBTyxFQUFFLENBQUE7SUFDWCxDQUFDO0lBRUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUNoQyxVQUFVLEdBQUcsSUFBSSxVQUFVLEVBQUUsQ0FBQTtJQUMvQixDQUFDO0lBRUQsT0FBTyxVQUFVLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDakMsQ0FBQztBQUVNLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxNQUFNLElBQUEsd0NBQW1DLEdBQUUsQ0FBQTtJQUUzQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxJQUFBLGNBQVMsR0FBRSxDQUFDLEtBQUssQ0FDdEM7Ozs7S0FJQyxDQUNGLENBQUE7SUFFRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDZCxpQkFBaUIsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLDBCQUFxQixDQUFDO0tBQ25ELENBQUMsQ0FBQTtBQUNKLENBQUM7QUFPTSxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsTUFBTSxJQUFBLHdDQUFtQyxHQUFFLENBQUE7SUFFM0MsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBOEIsQ0FBQTtJQUMxRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMscUJBQXFCLElBQUksRUFBRSxDQUFBO0lBQ2hELE1BQU0sY0FBYyxHQUFHLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBRXRELElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUNwQixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFBRSxtQ0FBbUM7U0FDN0MsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVELE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFBO0lBRWhELElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxNQUFNLElBQUEsY0FBUyxHQUFFLENBQUMsS0FBSyxDQUN0Qzs7OztPQUlDLEVBQ0QsQ0FBQyxjQUFjLEVBQUUsUUFBUSxDQUFDLENBQzNCLENBQUE7UUFFRCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLGdCQUFnQixFQUFFLElBQUEsMEJBQXFCLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2pELENBQUMsQ0FBQTtJQUNKLENBQUM7SUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1FBQ3BCLElBQUksS0FBSyxFQUFFLElBQUksS0FBSyxPQUFPLEVBQUUsQ0FBQztZQUM1QixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixPQUFPLEVBQUUscUJBQXFCLGNBQWMsa0JBQWtCO2FBQy9ELENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFDTCxLQUFLLFlBQVksS0FBSztnQkFDcEIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPO2dCQUNmLENBQUMsQ0FBQyw0Q0FBNEM7U0FDbkQsQ0FBQyxDQUFBO0lBQ0osQ0FBQztBQUNILENBQUMifQ==