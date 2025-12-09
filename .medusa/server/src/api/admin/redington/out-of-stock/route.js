"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const pg_1 = require("../../../../lib/pg");
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
async function GET(req, res) {
    await (0, pg_1.ensureRedingtonDomainOutOfStockTable)();
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT dos.*, d.domain_name
      FROM redington_domain_out_of_stock dos
      LEFT JOIN redington_domain d ON d.id = dos.domain_id
      ORDER BY dos.updated_at DESC
    `);
    return res.json({
        domain_out_of_stock: rows.map((row) => ({
            ...(0, pg_1.mapDomainOutOfStockRow)(row),
            domain_name: typeof row.domain_name === "string" && row.domain_name.length
                ? row.domain_name
                : null,
        })),
    });
}
async function POST(req, res) {
    await Promise.all([
        (0, pg_1.ensureRedingtonDomainOutOfStockTable)(),
        (0, pg_1.ensureRedingtonDomainTable)(),
    ]);
    const body = (req.body || {});
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
    const status = parseBoolean(body.status, false);
    const { rows } = await (0, pg_1.getPgPool)().query(`
      INSERT INTO redington_domain_out_of_stock (domain_id, status)
      VALUES ($1, $2)
      ON CONFLICT (domain_id) DO UPDATE
        SET status = EXCLUDED.status,
            updated_at = NOW()
      RETURNING *
    `, [domainId, status]);
    return res.status(201).json({
        domain_out_of_stock: {
            ...(0, pg_1.mapDomainOutOfStockRow)(rows[0]),
            domain_name: domain.domain_name,
        },
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9vdXQtb2Ytc3RvY2svcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUEwQ0Esa0JBcUJDO0FBRUQsb0JBd0NDO0FBdkdELDJDQU0yQjtBQU8zQixNQUFNLFlBQVksR0FBRyxDQUFDLEtBQWMsRUFBc0IsRUFBRTtJQUMxRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDeEQsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0lBQ0QsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3JELE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQ2hELE9BQU8sTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUE7SUFDckQsQ0FBQztJQUNELE9BQU8sU0FBUyxDQUFBO0FBQ2xCLENBQUMsQ0FBQTtBQUVELE1BQU0sWUFBWSxHQUFHLENBQUMsS0FBYyxFQUFFLFFBQWlCLEVBQUUsRUFBRTtJQUN6RCxJQUFJLE9BQU8sS0FBSyxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQy9CLE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztJQUNELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDOUIsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFBO1FBQzdDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxJ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