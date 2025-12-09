"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const pg_1 = require("../../../../lib/pg");
async function GET(req, res) {
    await Promise.all([
        (0, pg_1.ensureRedingtonAccessMappingTable)(),
        (0, pg_1.ensureRedingtonDomainTable)(),
        (0, pg_1.ensureRedingtonDomainExtentionTable)(),
    ]);
    const rawCountry = (req.query.country_code ||
        req.query.countryCode ||
        req.query.country);
    if (!rawCountry) {
        return res
            .status(400)
            .json({ message: "country_code query parameter is required" });
    }
    const countryCode = rawCountry.trim().toUpperCase();
    const baseQuery = `
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
  `;
    const params = [];
    let whereClause = "";
    if (countryCode !== "ALL") {
        whereClause = "WHERE am.country_code = $1";
        params.push(countryCode);
    }
    const { rows } = await (0, pg_1.getPgPool)().query(`${baseQuery} ${whereClause} ORDER BY am.created_at DESC`, params);
    if (!rows.length) {
        return res.status(404).json({
            message: countryCode === "ALL"
                ? "No access mappings found"
                : `No access mappings found for country code ${countryCode}`,
        });
    }
    const mapped = rows.map(pg_1.mapAccessMappingRow);
    if (countryCode === "ALL") {
        return res.json({
            domain_names: mapped.map((entry) => ({
                access_id: entry.access_id ?? entry.id,
                domain_name: entry.domain_name,
                company_code: entry.company_code,
                domain_extention_name: entry.domain_extention_name,
                brand_ids: entry.brand_ids,
                mobile_ext: entry.mobile_ext,
                country_code: entry.country_code,
            })),
        });
    }
    const mobileExtension = mapped[0]?.mobile_ext ?? "";
    return res.json({
        country_code: countryCode,
        mobile_extension: mobileExtension,
        domain_names: mapped.map((entry) => ({
            access_id: entry.access_id ?? entry.id,
            domain_name: entry.domain_name,
            company_code: entry.company_code,
            domain_extention_name: entry.domain_extention_name,
            brand_ids: entry.brand_ids,
            mobile_ext: entry.mobile_ext,
        })),
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3JlZGluZ3Rvbi9hY2Nlc3MtbWFwcGluZ3Mvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFVQSxrQkEyRkM7QUFuR0QsMkNBTTJCO0FBRXBCLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDaEIsSUFBQSxzQ0FBaUMsR0FBRTtRQUNuQyxJQUFBLCtCQUEwQixHQUFFO1FBQzVCLElBQUEsd0NBQW1DLEdBQUU7S0FDdEMsQ0FBQyxDQUFBO0lBRUYsTUFBTSxVQUFVLEdBQ2QsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFlBQVk7UUFDckIsR0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFXO1FBQ3JCLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUF1QixDQUFBO0lBRTVDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNoQixPQUFPLEdBQUc7YUFDUCxNQUFNLENBQUMsR0FBRyxDQUFDO2FBQ1gsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLDBDQUEwQyxFQUFFLENBQUMsQ0FBQTtJQUNsRSxDQUFDO0lBRUQsTUFBTSxXQUFXLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFBO0lBRW5ELE1BQU0sU0FBUyxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7OztHQWlCakIsQ0FBQTtJQUVELE1BQU0sTUFBTSxHQUFVLEVBQUUsQ0FBQTtJQUN4QixJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUE7SUFFcEIsSUFBSSxXQUFXLEtBQUssS0FBSyxFQUFFLENBQUM7UUFDMUIsV0FBVyxHQUFHLDRCQUE0QixDQUFBO1FBQzFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUE7SUFDMUIsQ0FBQztJQUVELE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxNQUFNLElBQUEsY0FBUyxHQUFFLENBQUMsS0FBSyxDQUN0QyxHQUFHLFNBQVMsSUFBSSxXQUFXLDhCQUE4QixFQUN6RCxNQUFNLENBQ1AsQ0FBQTtJQUVELElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDakIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQ0wsV0FBVyxLQUFLLEtBQUs7Z0JBQ25CLENBQUMsQ0FBQywwQkFBMEI7Z0JBQzVCLENBQUMsQ0FBQyw2Q0FBNkMsV0FBVyxFQUFFO1NBQ2pFLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLHdCQUFtQixDQUFDLENBQUE7SUFFNUMsSUFBSSxXQUFXLEtBQUssS0FBSyxFQUFFLENBQUM7UUFDMUIsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ2QsWUFBWSxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ25DLFNBQVMsRUFBRSxLQUFLLENBQUMsU0FBUyxJQUFJLEtBQUssQ0FBQyxFQUFFO2dCQUN0QyxXQUFXLEVBQUUsS0FBSyxDQUFDLFdBQVc7Z0JBQzlCLFlBQVksRUFBRSxLQUFLLENBQUMsWUFBWTtnQkFDaEMscUJBQXFCLEVBQUUsS0FBSyxDQUFDLHFCQUFxQjtnQkFDbEQsU0FBUyxFQUFFLEtBQUssQ0FBQyxTQUFTO2dCQUMxQixVQUFVLEVBQUUsS0FBSyxDQUFDLFVBQVU7Z0JBQzVCLFlBQVksRUFBRSxLQUFLLENBQUMsWUFBWTthQUNqQyxDQUFDLENBQUM7U0FDSixDQUFDLENBQUE7SUFDSixDQUFDO0lBRUQsTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLFVBQVUsSUFBSSxFQUFFLENBQUE7SUFFbkQsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQ2QsWUFBWSxFQUFFLFdBQVc7UUFDekIsZ0JBQWdCLEVBQUUsZUFBZTtRQUNqQyxZQUFZLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNuQyxTQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVMsSUFBSSxLQUFLLENBQUMsRUFBRTtZQUN0QyxXQUFXLEVBQUUsS0FBSyxDQUFDLFdBQVc7WUFDOUIsWUFBWSxFQUFFLEtBQUssQ0FBQyxZQUFZO1lBQ2hDLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxxQkFBcUI7WUFDbEQsU0FBUyxFQUFFLEtBQUssQ0FBQyxTQUFTO1lBQzFCLFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVTtTQUM3QixDQUFDLENBQUM7S0FDSixDQUFDLENBQUE7QUFDSixDQUFDIn0=