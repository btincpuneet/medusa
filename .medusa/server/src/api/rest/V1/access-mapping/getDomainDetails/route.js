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
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");
};
const OPTIONS = async (req, res) => {
    setCors(req, res);
    res.status(204).send();
};
exports.OPTIONS = OPTIONS;
const normalizeCountryCode = (body) => {
    const raw = body.countryCode || body.country_code || body.country || "";
    const trimmed = raw.trim().toUpperCase();
    return trimmed.length ? trimmed : null;
};
const POST = async (req, res) => {
    setCors(req, res);
    await Promise.all([
        (0, pg_1.ensureRedingtonAccessMappingTable)(),
        (0, pg_1.ensureRedingtonDomainTable)(),
        (0, pg_1.ensureRedingtonDomainExtentionTable)(),
    ]);
    const body = (req.body || {});
    const countryCode = normalizeCountryCode(body);
    if (!countryCode) {
        return res
            .status(400)
            .json({ message: "countryCode is required" });
    }
    const params = [];
    let whereClause = "";
    if (countryCode !== "ALL") {
        whereClause = "WHERE am.country_code = $1";
        params.push(countryCode);
    }
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT
        am.*,
        d.domain_name,
        de.domain_extention_name
      FROM redington_access_mapping am
      LEFT JOIN redington_domain d ON d.id = am.domain_id
      LEFT JOIN redington_domain_extention de ON de.id = am.domain_extention_id
      ${whereClause}
      ORDER BY am.created_at DESC
    `, params);
    if (!rows.length) {
        return res.status(404).json({
            message: countryCode === "ALL"
                ? "No access mappings found."
                : `No access mapping found for country ${countryCode}.`,
        });
    }
    const mapped = rows.map(pg_1.mapAccessMappingRow);
    if (countryCode === "ALL") {
        return res.json({
            domain_names: mapped.map((entry) => ({
                access_id: entry.access_id ?? entry.id,
                domain_name: entry.domain_name,
                domain_extention_name: entry.domain_extention_name,
                company_code: entry.company_code,
                country_code: entry.country_code,
                mobile_ext: entry.mobile_ext,
                brand_ids: entry.brand_ids,
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
            domain_extention_name: entry.domain_extention_name,
            company_code: entry.company_code,
            brand_ids: entry.brand_ids,
            mobile_ext: entry.mobile_ext,
        })),
    });
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvYWNjZXNzLW1hcHBpbmcvZ2V0RG9tYWluRGV0YWlscy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSw4Q0FNOEI7QUFFOUIsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUMxRCxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQTtJQUNqQyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ1gsR0FBRyxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUNqRCxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUM5QixDQUFDO1NBQU0sQ0FBQztRQUNOLEdBQUcsQ0FBQyxNQUFNLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDaEQsQ0FBQztJQUVELEdBQUcsQ0FBQyxNQUFNLENBQ1IsOEJBQThCLEVBQzlCLEdBQUcsQ0FBQyxPQUFPLENBQUMsZ0NBQWdDLENBQUM7UUFDM0MsNkJBQTZCLENBQ2hDLENBQUE7SUFDRCxHQUFHLENBQUMsTUFBTSxDQUFDLDhCQUE4QixFQUFFLGtCQUFrQixDQUFDLENBQUE7SUFDOUQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxrQ0FBa0MsRUFBRSxNQUFNLENBQUMsQ0FBQTtBQUN4RCxDQUFDLENBQUE7QUFFTSxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDdkUsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUNqQixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO0FBQ3hCLENBQUMsQ0FBQTtBQUhZLFFBQUEsT0FBTyxX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