"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const pg_1 = require("../../../../lib/pg");
async function GET(req, res) {
    await (0, pg_1.ensureRedingtonDomainExtentionTable)();
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT id, domain_extention_name, status, created_at, updated_at
      FROM redington_domain_extention
      WHERE status = TRUE
      ORDER BY domain_extention_name ASC
    `);
    return res.json({
        domain_extentions: rows.map(pg_1.mapDomainExtentionRow),
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3JlZGluZ3Rvbi9kb21haW4tZXh0ZW5zaW9ucy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQVFBLGtCQWVDO0FBckJELDJDQUkyQjtBQUVwQixLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsTUFBTSxJQUFBLHdDQUFtQyxHQUFFLENBQUE7SUFFM0MsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLE1BQU0sSUFBQSxjQUFTLEdBQUUsQ0FBQyxLQUFLLENBQ3RDOzs7OztLQUtDLENBQ0YsQ0FBQTtJQUVELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztRQUNkLGlCQUFpQixFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsMEJBQXFCLENBQUM7S0FDbkQsQ0FBQyxDQUFBO0FBQ0osQ0FBQyJ9