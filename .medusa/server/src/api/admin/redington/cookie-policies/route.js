"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const pg_1 = require("../../../../lib/pg");
async function GET(req, res) {
    await (0, pg_1.ensureRedingtonCookiePolicyTable)();
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT *
      FROM redington_cookie_policy
      ORDER BY created_at DESC
    `);
    return res.json({
        cookie_policies: rows.map(pg_1.mapCookiePolicyRow),
    });
}
async function POST(req, res) {
    await (0, pg_1.ensureRedingtonCookiePolicyTable)();
    const body = (req.body || {});
    const documentUrl = typeof body.document_url === "string" ? body.document_url.trim() : null;
    const status = typeof body.status === "string" ? body.status.trim() : null;
    const { rows } = await (0, pg_1.getPgPool)().query(`
      INSERT INTO redington_cookie_policy (document_url, status)
      VALUES ($1, $2)
      RETURNING *
    `, [documentUrl, status]);
    return res.status(201).json({
        cookie_policy: (0, pg_1.mapCookiePolicyRow)(rows[0]),
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9jb29raWUtcG9saWNpZXMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFhQSxrQkFjQztBQUVELG9CQXNCQztBQWpERCwyQ0FJMkI7QUFPcEIsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELE1BQU0sSUFBQSxxQ0FBZ0MsR0FBRSxDQUFBO0lBRXhDLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxNQUFNLElBQUEsY0FBUyxHQUFFLENBQUMsS0FBSyxDQUN0Qzs7OztLQUlDLENBQ0YsQ0FBQTtJQUVELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztRQUNkLGVBQWUsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLHVCQUFrQixDQUFDO0tBQzlDLENBQUMsQ0FBQTtBQUNKLENBQUM7QUFFTSxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsTUFBTSxJQUFBLHFDQUFnQyxHQUFFLENBQUE7SUFFeEMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBMkIsQ0FBQTtJQUV2RCxNQUFNLFdBQVcsR0FDZixPQUFPLElBQUksQ0FBQyxZQUFZLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUE7SUFDekUsTUFBTSxNQUFNLEdBQ1YsT0FBTyxJQUFJLENBQUMsTUFBTSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFBO0lBRTdELE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxNQUFNLElBQUEsY0FBUyxHQUFFLENBQUMsS0FBSyxDQUN0Qzs7OztLQUlDLEVBQ0QsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQ3RCLENBQUE7SUFFRCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQzFCLGFBQWEsRUFBRSxJQUFBLHVCQUFrQixFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUMzQyxDQUFDLENBQUE7QUFDSixDQUFDIn0=