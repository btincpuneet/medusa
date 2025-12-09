"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const pg_1 = require("../../../../lib/pg");
const normalizeString = (value) => (value ?? "").trim();
const normalizeCountry = (value) => (value ?? "").trim().toUpperCase();
const parseBoolean = (value, fallback = true) => {
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
    await (0, pg_1.ensureRedingtonCurrencyMappingTable)();
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
      ORDER BY created_at DESC
    `);
    return res.json({
        currency_mappings: rows.map(pg_1.mapCurrencyMappingRow),
    });
}
async function POST(req, res) {
    await (0, pg_1.ensureRedingtonCurrencyMappingTable)();
    const body = (req.body || {});
    const name = normalizeString(body.name);
    const companyCode = normalizeString(body.company_code);
    const countryName = normalizeString(body.country_name);
    const countryCode = normalizeCountry(body.country_code);
    const currencyCode = normalizeString(body.currency_code).toUpperCase();
    const decimalPlace = Number(body.decimal_place ?? 2);
    const paymentMethod = normalizeString(body.payment_method);
    const shipmentTrackingUrl = normalizeString(body.shipment_tracking_url);
    const isActive = parseBoolean(body.is_active, true);
    if (!name) {
        return res.status(400).json({ message: "name is required" });
    }
    if (!companyCode) {
        return res.status(400).json({ message: "company_code is required" });
    }
    if (!countryName) {
        return res.status(400).json({ message: "country_name is required" });
    }
    if (!countryCode) {
        return res.status(400).json({ message: "country_code is required" });
    }
    if (!currencyCode) {
        return res.status(400).json({ message: "currency_code is required" });
    }
    if (!Number.isFinite(decimalPlace) || decimalPlace < 0) {
        return res
            .status(400)
            .json({ message: "decimal_place must be a non-negative number" });
    }
    if (!paymentMethod) {
        return res.status(400).json({ message: "payment_method is required" });
    }
    if (!shipmentTrackingUrl) {
        return res
            .status(400)
            .json({ message: "shipment_tracking_url is required" });
    }
    try {
        const { rows } = await (0, pg_1.getPgPool)().query(`
        INSERT INTO redington_currency_mapping (
          name,
          company_code,
          country_name,
          country_code,
          currency_code,
          decimal_place,
          payment_method,
          shipment_tracking_url,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING
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
      `, [
            name,
            companyCode,
            countryName,
            countryCode,
            currencyCode,
            decimalPlace,
            paymentMethod,
            shipmentTrackingUrl,
            isActive,
        ]);
        return res.status(201).json({
            currency_mapping: (0, pg_1.mapCurrencyMappingRow)(rows[0]),
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "Unexpected error creating currency mapping",
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9jdXJyZW5jeS1tYXBwaW5ncy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQTBDQSxrQkEwQkM7QUFFRCxvQkF3R0M7QUE1S0QsMkNBSTJCO0FBSTNCLE1BQU0sZUFBZSxHQUFHLENBQUMsS0FBdUIsRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7QUFDekUsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLEtBQXVCLEVBQUUsRUFBRSxDQUNuRCxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVwQyxNQUFNLFlBQVksR0FBRyxDQUFDLEtBQWlDLEVBQUUsUUFBUSxHQUFHLElBQUksRUFBRSxFQUFFO0lBQzFFLElBQUksT0FBTyxLQUFLLEtBQUssU0FBUyxFQUFFLENBQUM7UUFDL0IsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0lBQ0QsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztRQUM5QixNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDN0MsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1lBQ3BELE9BQU8sSUFBSSxDQUFBO1FBQ2IsQ0FBQztRQUNELElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztZQUNyRCxPQUFPLEtBQUssQ0FBQTtRQUNkLENBQUM7SUFDSCxDQUFDO0lBQ0QsT0FBTyxRQUFR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