"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.OPTIONS = void 0;
const pg_1 = require("../../../../../lib/pg");
const setCors = (req, res) => {
    const origin = req.headers.origin;
    if (origin) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Vary", "Origin");
    }
    else {
        res.header("Access-Control-Allow-Origin", "*");
    }
    res.header("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] ||
        "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");
};
const OPTIONS = async (req, res) => {
    setCors(req, res);
    res.status(204).send();
};
exports.OPTIONS = OPTIONS;
const normalizeCountryCode = (body) => {
    const value = body.countryCode ?? body.country_code ?? body.country ?? undefined;
    if (typeof value !== "string") {
        return null;
    }
    const trimmed = value.trim().toUpperCase();
    return trimmed.length ? trimmed : null;
};
const POST = async (req, res) => {
    setCors(req, res);
    await (0, pg_1.ensureRedingtonCurrencyMappingTable)();
    const body = (req.body || {});
    const countryCode = normalizeCountryCode(body);
    if (!countryCode) {
        return res.status(400).json({
            message: "countryCode is required",
        });
    }
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT
        company_code,
        country_code,
        currency_code,
        decimal_place,
        payment_method,
        shipment_tracking_url
      FROM redington_currency_mapping
      WHERE UPPER(country_code) = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [countryCode]);
    if (!rows[0]) {
        return res.status(404).json({
            message: `No currency mapping found for ${countryCode}`,
        });
    }
    const record = rows[0];
    return res.json([
        {
            currency_code: record.currency_code ?? null,
            shippment_tracking_url: record.shipment_tracking_url ?? null,
            payment_method_code: record.payment_method ?? null,
            company_code: record.company_code ?? null,
            country_code: record.country_code ?? null,
            decimal_place: record.decimal_place !== null && record.decimal_place !== undefined
                ? Number(record.decimal_place)
                : null,
        },
    ]);
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvY3VzdG9tZXItaW5mby9nZXRDdXN0b21lckluZm8vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsOENBRzhCO0FBRTlCLE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDMUQsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7SUFDakMsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUNYLEdBQUcsQ0FBQyxNQUFNLENBQUMsNkJBQTZCLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFDakQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDOUIsQ0FBQztTQUFNLENBQUM7UUFDTixHQUFHLENBQUMsTUFBTSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ2hELENBQUM7SUFFRCxHQUFHLENBQUMsTUFBTSxDQUNSLDhCQUE4QixFQUM5QixHQUFHLENBQUMsT0FBTyxDQUFDLGdDQUFnQyxDQUFDO1FBQzNDLDZCQUE2QixDQUNoQyxDQUFBO0lBQ0QsR0FBRyxDQUFDLE1BQU0sQ0FBQyw4QkFBOEIsRUFBRSxjQUFjLENBQUMsQ0FBQTtJQUMxRCxHQUFHLENBQUMsTUFBTSxDQUFDLGtDQUFrQyxFQUFFLE1BQU0sQ0FBQyxDQUFBO0FBQ3hELENBQUMsQ0FBQTtBQUVNLE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUN2RSxPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ2pCLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7QUFDeEIsQ0FBQyxDQUFBO0FBSFksUUFBQSxPQUFPLFdBR25CO0FBUUQsTUFBTSxvQkFBb0IsR0FBRyxDQUFDLElBQXNCLEVBQWlCLEVBQUU7SUFDckUsTUFBTSxLQUFLLEdBQ1QsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsWUFBWSxJQUFJLElBQUksQ0FBQyxPQUFPLElBQUksU0FBUyxDQUFBO0lBRXBFLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDOUIsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRUQsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFBO0lBQzFDLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUE7QUFDeEMsQ0FBQyxDQUFBO0FBRU0sTUFBTSxJQUFJLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ3BFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFFakIsTUFBTSxJQUFBLHdDQUFtQyxHQUFFLENBQUE7SUFFM0MsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBcUIsQ0FBQTtJQUNqRCxNQUFNLFdBQVcsR0FBRyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUU5QyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDakIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUseUJBQXlCO1NBQ25DLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRCxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxJQUFBLGNBQVMsR0FBRSxDQUFDLEtBQUssQ0FDdEM7Ozs7Ozs7Ozs7OztLQVlDLEVBQ0QsQ0FBQyxXQUFXLENBQUMsQ0FDZCxDQUFBO0lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ2IsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUsaUNBQWlDLFdBQVcsRUFBRTtTQUN4RCxDQUFDLENBQUE7SUFDSixDQUFDO0lBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBRXRCLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztRQUNkO1lBQ0UsYUFBYSxFQUFFLE1BQU0sQ0FBQyxhQUFhLElBQUksSUFBSTtZQUMzQyxzQkFBc0IsRUFBRSxNQUFNLENBQUMscUJBQXFCLElBQUksSUFBSTtZQUM1RCxtQkFBbUIsRUFBRSxNQUFNLENBQUMsY0FBYyxJQUFJLElBQUk7WUFDbEQsWUFBWSxFQUFFLE1BQU0sQ0FBQyxZQUFZLElBQUksSUFBSTtZQUN6QyxZQUFZLEVBQUUsTUFBTSxDQUFDLFlBQVksSUFBSSxJQUFJO1lBQ3pDLGFBQWEsRUFDWCxNQUFNLENBQUMsYUFBYSxLQUFLLElBQUksSUFBSSxNQUFNLENBQUMsYUFBYSxLQUFLLFNBQVM7Z0JBQ2pFLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQztnQkFDOUIsQ0FBQyxDQUFDLElBQUk7U0FDWDtLQUNGLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQTtBQXBEWSxRQUFBLElBQUksUUFvRGhCIn0=