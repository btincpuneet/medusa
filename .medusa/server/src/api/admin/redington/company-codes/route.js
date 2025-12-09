"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const pg_1 = require("../../../../lib/pg");
const truthyValues = ["true", "1", "yes", "on"];
const falsyValues = ["false", "0", "no", "off"];
function parseBoolean(value, fallback) {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (truthyValues.includes(normalized)) {
            return true;
        }
        if (falsyValues.includes(normalized)) {
            return false;
        }
    }
    return fallback;
}
function normalizeCountryCode(code) {
    return code.trim().toUpperCase();
}
function normalizeCompanyCode(code) {
    return code.trim();
}
async function GET(req, res) {
    await (0, pg_1.ensureRedingtonCompanyCodeTable)();
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT id, country_code, company_code, status, created_at, updated_at
      FROM redington_company_code
      ORDER BY created_at DESC
    `);
    return res.json({
        company_codes: rows.map(pg_1.mapCompanyCodeRow),
    });
}
async function POST(req, res) {
    await (0, pg_1.ensureRedingtonCompanyCodeTable)();
    const body = (req.body || {});
    const countryCode = normalizeCountryCode(body.country_code ?? "");
    if (!countryCode) {
        return res.status(400).json({
            message: "country_code is required",
        });
    }
    const companyCode = normalizeCompanyCode(body.company_code ?? "");
    if (!companyCode) {
        return res.status(400).json({
            message: "company_code is required",
        });
    }
    const isActive = parseBoolean(body.status, true);
    try {
        const { rows } = await (0, pg_1.getPgPool)().query(`
        INSERT INTO redington_company_code (country_code, company_code, status)
        VALUES ($1, $2, $3)
        RETURNING id, country_code, company_code, status, created_at, updated_at
      `, [countryCode, companyCode, isActive]);
        return res.status(201).json({
            company_code: (0, pg_1.mapCompanyCodeRow)(rows[0]),
        });
    }
    catch (error) {
        if (error?.code === "23505") {
            return res.status(409).json({
                message: `Country code "${countryCode}" already exists`,
            });
        }
        return res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "Unexpected error creating company code",
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9jb21wYW55LWNvZGVzL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBdUNBLGtCQWNDO0FBUUQsb0JBZ0RDO0FBM0dELDJDQUkyQjtBQUkzQixNQUFNLFlBQVksR0FBRyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFBO0FBQy9DLE1BQU0sV0FBVyxHQUFHLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUE7QUFFL0MsU0FBUyxZQUFZLENBQUMsS0FBaUMsRUFBRSxRQUFpQjtJQUN4RSxJQUFJLE9BQU8sS0FBSyxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQy9CLE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztJQUVELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDOUIsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFBO1FBQzdDLElBQUksWUFBWSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1lBQ3RDLE9BQU8sSUFBSSxDQUFBO1FBQ2IsQ0FBQztRQUNELElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1lBQ3JDLE9BQU8sS0FBSyxDQUFBO1FBQ2QsQ0FBQztJQUNILENBQUM7SUFFRCxPQUFPLFFBQVEsQ0FBQTtBQUNqQixDQUFDO0FBRUQsU0FBUyxvQkFBb0IsQ0FBQyxJQUFZO0lBQ3hDLE9BQU8sSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2xDLENBQUM7QUFFRCxTQUFTLG9CQUFvQixDQUFDLElBQVk7SUFDeEMsT0FBTyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUE7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