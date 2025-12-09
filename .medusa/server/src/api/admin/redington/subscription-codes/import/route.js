"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const sync_1 = require("csv-parse/sync");
const pg_1 = require("../../../../../lib/pg");
const REQUIRED_COLUMNS = [
    "subscription_code",
    "access_id",
    "company_code",
    "first_name",
    "last_name",
    "email",
];
const normalizeString = (value) => typeof value === "string" ? value.trim() : "";
const normalizeEmail = (value) => typeof value === "string" ? value.trim().toLowerCase() : "";
const sanitizeAccessId = (value) => value.replace(/[^0-9.]/g, "");
const parseStatus = (value) => {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["0", "false", "no", "disable", "disabled"].includes(normalized)) {
            return false;
        }
    }
    if (typeof value === "number") {
        return value !== 0;
    }
    return true;
};
const normalizeRow = (row) => {
    const subscriptionCode = normalizeString(row.subscription_code || row.code);
    const companyCode = normalizeString(row.company_code);
    const accessId = sanitizeAccessId(normalizeString(row.access_id));
    const firstName = normalizeString(row.first_name);
    const lastName = normalizeString(row.last_name);
    const email = normalizeEmail(row.email);
    const status = parseStatus(row.status);
    if (!subscriptionCode) {
        return { error: "Subscription Code is missing" };
    }
    if (!companyCode) {
        return { error: "Company Code is missing" };
    }
    if (!accessId) {
        return { error: "Access Id is missing" };
    }
    if (!firstName || !lastName || !email) {
        return { error: "First Name, Last Name, and Email are required" };
    }
    return {
        row: {
            subscription_code: subscriptionCode,
            company_code: companyCode,
            access_id: accessId,
            first_name: firstName,
            last_name: lastName,
            email,
            status,
        },
    };
};
const selectExistingId = async (normalized) => {
    const client = (0, pg_1.getPgPool)();
    // First try an exact combination match.
    const byCombo = await client.query(`
      SELECT id
      FROM redington_subscription_code
      WHERE LOWER(subscription_code) = LOWER($1)
        AND company_code = $2
        AND access_id = $3
      LIMIT 1
    `, [normalized.subscription_code, normalized.company_code, normalized.access_id]);
    if (byCombo.rows[0]?.id) {
        return Number(byCombo.rows[0].id);
    }
    // Fall back to subscription code uniqueness.
    const byCode = await client.query(`
      SELECT id
      FROM redington_subscription_code
      WHERE LOWER(subscription_code) = LOWER($1)
      LIMIT 1
    `, [normalized.subscription_code]);
    return byCode.rows[0]?.id ? Number(byCode.rows[0].id) : null;
};
async function POST(req, res) {
    await (0, pg_1.ensureRedingtonSubscriptionCodeTable)();
    const body = (req.body || {});
    const csv = typeof body.csv === "string" ? body.csv : "";
    if (!csv.trim()) {
        return res.status(400).json({ message: "csv payload is required" });
    }
    let records = [];
    try {
        records = (0, sync_1.parse)(csv, {
            columns: (header) => header.map((entry) => entry.trim().toLowerCase().replace(/\s+/g, "_")),
            skip_empty_lines: true,
            trim: true,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error instanceof Error
                ? `Unable to parse CSV: ${error.message}`
                : "Unable to parse CSV content",
        });
    }
    if (!records.length) {
        return res.status(400).json({ message: "CSV contained no data rows" });
    }
    const headerKeys = Object.keys(records[0] || {});
    const missingColumns = REQUIRED_COLUMNS.filter((col) => !headerKeys.includes(col));
    if (missingColumns.length) {
        return res.status(400).json({
            message: `CSV is missing required columns: ${missingColumns.join(", ")}`,
        });
    }
    const errors = [];
    const created = [];
    const updated = [];
    for (let index = 0; index < records.length; index++) {
        const parsed = normalizeRow(records[index]);
        const rowNumber = index + 2; // account for header row
        if (parsed.error || !parsed.row) {
            const message = parsed.error || "Row is missing required data";
            errors.push(`Row ${rowNumber}: ${message}`);
            continue;
        }
        try {
            const existingId = await selectExistingId(parsed.row);
            if (existingId) {
                const { rows: updatedRows } = await (0, pg_1.getPgPool)().query(`
            UPDATE redington_subscription_code
            SET
              company_code = $1,
              access_id = $2,
              first_name = $3,
              last_name = $4,
              email = $5,
              status = $6,
              updated_at = NOW()
            WHERE id = $7
            RETURNING *
          `, [
                    parsed.row.company_code,
                    parsed.row.access_id,
                    parsed.row.first_name,
                    parsed.row.last_name,
                    parsed.row.email,
                    parsed.row.status,
                    existingId,
                ]);
                updated.push((0, pg_1.mapSubscriptionCodeRow)(updatedRows[0]));
            }
            else {
                const { rows: createdRows } = await (0, pg_1.getPgPool)().query(`
            INSERT INTO redington_subscription_code (
              subscription_code,
              company_code,
              access_id,
              first_name,
              last_name,
              email,
              status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (subscription_code) DO NOTHING
            RETURNING *
          `, [
                    parsed.row.subscription_code,
                    parsed.row.company_code,
                    parsed.row.access_id,
                    parsed.row.first_name,
                    parsed.row.last_name,
                    parsed.row.email,
                    parsed.row.status,
                ]);
                if (createdRows[0]) {
                    created.push((0, pg_1.mapSubscriptionCodeRow)(createdRows[0]));
                }
                else {
                    // If conflict occurred because of a race on subscription_code, try updating instead.
                    const fallbackExisting = await (0, pg_1.findSubscriptionCodeByCode)(parsed.row.subscription_code);
                    if (fallbackExisting?.id) {
                        const { rows: updatedRows } = await (0, pg_1.getPgPool)().query(`
                UPDATE redington_subscription_code
                SET
                  company_code = $1,
                  access_id = $2,
                  first_name = $3,
                  last_name = $4,
                  email = $5,
                  status = $6,
                  updated_at = NOW()
                WHERE id = $7
                RETURNING *
              `, [
                            parsed.row.company_code,
                            parsed.row.access_id,
                            parsed.row.first_name,
                            parsed.row.last_name,
                            parsed.row.email,
                            parsed.row.status,
                            fallbackExisting.id,
                        ]);
                        updated.push((0, pg_1.mapSubscriptionCodeRow)(updatedRows[0]));
                    }
                }
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unexpected import error";
            errors.push(`Row ${rowNumber}: ${message}`);
        }
    }
    return res.json({
        created: created.length,
        updated: updated.length,
        errors,
        subscription_codes: {
            created,
            updated,
        },
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9zdWJzY3JpcHRpb24tY29kZXMvaW1wb3J0L3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBa0lBLG9CQXlLQztBQTFTRCx5Q0FBc0M7QUFFdEMsOENBTThCO0FBZ0I5QixNQUFNLGdCQUFnQixHQUFHO0lBQ3ZCLG1CQUFtQjtJQUNuQixXQUFXO0lBQ1gsY0FBYztJQUNkLFlBQVk7SUFDWixXQUFXO0lBQ1gsT0FBTztDQUNSLENBQUE7QUFFRCxNQUFNLGVBQWUsR0FBRyxDQUFDLEtBQWMsRUFBRSxFQUFFLENBQ3pDLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUE7QUFFL0MsTUFBTSxjQUFjLEdBQUcsQ0FBQyxLQUFjLEVBQUUsRUFBRSxDQUN4QyxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFBO0FBRTdELE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxLQUFhLEVBQUUsRUFBRSxDQUN6QyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQTtBQUUvQixNQUFNLFdBQVcsR0FBRyxDQUFDLEtBQWMsRUFBVyxFQUFFO0lBQzlDLElBQUksT0FBTyxLQUFLLEtBQUssU0FBUyxFQUFFLENBQUM7UUFDL0IsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0lBQ0QsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztRQUM5QixNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDN0MsSUFBSSxDQUFDLEdB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