"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const pg_1 = require("../../../../lib/pg");
async function GET(req, res) {
    await (0, pg_1.ensureRedingtonCompanyCodeTable)();
    const countryCodeRaw = (req.query.country_code ||
        req.query.countryCode ||
        req.query.country);
    const params = [];
    let whereClause = "";
    if (countryCodeRaw) {
        whereClause = "AND country_code = $1";
        params.push(countryCodeRaw.trim().toUpperCase());
    }
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT id, country_code, company_code, status, created_at, updated_at
      FROM redington_company_code
      WHERE status = TRUE ${whereClause}
      ORDER BY country_code ASC
    `, params);
    return res.json({
        company_codes: rows.map(pg_1.mapCompanyCodeRow),
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3JlZGluZ3Rvbi9jb21wYW55LWNvZGVzL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBUUEsa0JBNEJDO0FBbENELDJDQUkyQjtBQUVwQixLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsTUFBTSxJQUFBLG9DQUErQixHQUFFLENBQUE7SUFFdkMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFlBQVk7UUFDNUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFXO1FBQ3JCLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUF1QixDQUFBO0lBRTFDLE1BQU0sTUFBTSxHQUFVLEVBQUUsQ0FBQTtJQUN4QixJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUE7SUFFcEIsSUFBSSxjQUFjLEVBQUUsQ0FBQztRQUNuQixXQUFXLEdBQUcsdUJBQXVCLENBQUE7UUFDckMsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQTtJQUNsRCxDQUFDO0lBRUQsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLE1BQU0sSUFBQSxjQUFTLEdBQUUsQ0FBQyxLQUFLLENBQ3RDOzs7NEJBR3dCLFdBQVc7O0tBRWxDLEVBQ0QsTUFBTSxDQUNQLENBQUE7SUFFRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDZCxhQUFhLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxzQkFBaUIsQ0FBQztLQUMzQyxDQUFDLENBQUE7QUFDSixDQUFDIn0=