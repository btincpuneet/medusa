"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const pg_1 = require("../../../../lib/pg");
async function GET(req, res) {
    await (0, pg_1.ensureRedingtonCurrencyMappingTable)();
    const rawCountry = (req.query.country_code ||
        req.query.countryCode ||
        req.query.country);
    if (!rawCountry) {
        return res
            .status(400)
            .json({ message: "country_code query parameter is required" });
    }
    const countryCode = rawCountry.trim().toUpperCase();
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT
        id,
        name,
        company_code,
        country_name,
        country_code,
        currency_code,
        decimal_place,
        payment_method,
        shipment_tracking_url,
        is_active,
        created_at,
        updated_at
      FROM redington_currency_mapping
      WHERE country_code = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [countryCode]);
    if (!rows.length) {
        return res.status(404).json({
            message: `No currency mapping found for country code ${countryCode}`,
        });
    }
    return res.json({
        mapping: (0, pg_1.mapCurrencyMappingRow)(rows[0]),
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3JlZGluZ3Rvbi9jdXJyZW5jeS1tYXBwaW5ncy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQVFBLGtCQWdEQztBQXRERCwyQ0FJMkI7QUFFcEIsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELE1BQU0sSUFBQSx3Q0FBbUMsR0FBRSxDQUFBO0lBRTNDLE1BQU0sVUFBVSxHQUNkLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxZQUFZO1FBQ3JCLEdBQUcsQ0FBQyxLQUFLLENBQUMsV0FBVztRQUNyQixHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBdUIsQ0FBQTtJQUU1QyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDaEIsT0FBTyxHQUFHO2FBQ1AsTUFBTSxDQUFDLEdBQUcsQ0FBQzthQUNYLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSwwQ0FBMEMsRUFBRSxDQUFDLENBQUE7SUFDbEUsQ0FBQztJQUVELE1BQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtJQUVuRCxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxJQUFBLGNBQVMsR0FBRSxDQUFDLEtBQUssQ0FDdEM7Ozs7Ozs7Ozs7Ozs7Ozs7OztLQWtCQyxFQUNELENBQUMsV0FBVyxDQUFDLENBQ2QsQ0FBQTtJQUVELElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDakIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUsOENBQThDLFdBQVcsRUFBRTtTQUNyRSxDQUFDLENBQUE7SUFDSixDQUFDO0lBRUQsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQ2QsT0FBTyxFQUFFLElBQUEsMEJBQXFCLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3hDLENBQUMsQ0FBQTtBQUNKLENBQUMifQ==