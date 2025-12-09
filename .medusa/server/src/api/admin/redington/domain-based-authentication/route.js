"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const pg_1 = require("../../../../lib/pg");
function parseBoolean(value, fallback) {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "number") {
        return value !== 0;
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
}
function parseAuthType(value, fallback = 2) {
    if (value === undefined || value === null) {
        return fallback;
    }
    const parsed = typeof value === "number"
        ? value
        : Number.parseInt(String(value).trim(), 10);
    if (!Number.isFinite(parsed)) {
        return null;
    }
    if (parsed === 1 || parsed === 2) {
        return parsed;
    }
    return null;
}
async function ensureDomainExists(domainId) {
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT id
      FROM redington_domain
      WHERE id = $1
    `, [domainId]);
    return rows[0] ? rows[0].id : null;
}
async function loadDomainAuthRecord(id) {
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT a.id,
             a.domain_id,
             a.auth_type,
             a.email_otp,
             a.mobile_otp,
             a.created_at,
             a.updated_at,
             d.domain_name
        FROM redington_domain_auth a
        LEFT JOIN redington_domain d ON d.id = a.domain_id
       WHERE a.id = $1
    `, [id]);
    return rows[0] ? (0, pg_1.mapDomainAuthRow)(rows[0]) : null;
}
async function GET(req, res) {
    await (0, pg_1.ensureRedingtonDomainTable)();
    await (0, pg_1.ensureRedingtonDomainAuthTable)();
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT a.id,
             a.domain_id,
             a.auth_type,
             a.email_otp,
             a.mobile_otp,
             a.created_at,
             a.updated_at,
             d.domain_name
        FROM redington_domain_auth a
        LEFT JOIN redington_domain d ON d.id = a.domain_id
       ORDER BY a.created_at DESC
    `);
    return res.json({
        domain_auth_controls: rows.map(pg_1.mapDomainAuthRow),
    });
}
async function POST(req, res) {
    await (0, pg_1.ensureRedingtonDomainTable)();
    await (0, pg_1.ensureRedingtonDomainAuthTable)();
    const body = (req.body || {});
    const domainId = Number.parseInt(String(body.domain_id ?? "").trim(), 10);
    if (!Number.isFinite(domainId)) {
        return res.status(400).json({
            message: "domain_id is required",
        });
    }
    const domainExists = await ensureDomainExists(domainId);
    if (!domainExists) {
        return res.status(404).json({
            message: `Domain with id ${domainId} not found`,
        });
    }
    const authType = parseAuthType(body.auth_type, 2);
    if (authType === null) {
        return res.status(400).json({
            message: "auth_type must be 1 (OTP-only) or 2 (Password + OTP)",
        });
    }
    const emailOtp = parseBoolean(body.email_otp, true);
    const mobileOtp = parseBoolean(body.mobile_otp, true);
    try {
        const { rows, } = await (0, pg_1.getPgPool)().query(`
        INSERT INTO redington_domain_auth (domain_id, auth_type, email_otp, mobile_otp)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [domainId, authType, emailOtp, mobileOtp]);
        const inserted = await loadDomainAuthRecord(rows[0].id);
        return res.status(201).json({
            domain_auth_control: inserted,
        });
    }
    catch (error) {
        if (error?.code === "23505") {
            return res.status(409).json({
                message: "Authentication settings already exist for this domain.",
            });
        }
        return res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "Unexpected error creating domain authentication settings",
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9kb21haW4tYmFzZWQtYXV0aGVudGljYXRpb24vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFzRkEsa0JBdUJDO0FBU0Qsb0JBNkRDO0FBakxELDJDQUsyQjtBQUUzQixTQUFTLFlBQVksQ0FBQyxLQUFjLEVBQUUsUUFBaUI7SUFDckQsSUFBSSxPQUFPLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUMvQixPQUFPLEtBQUssQ0FBQTtJQUNkLENBQUM7SUFFRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQzlCLE9BQU8sS0FBSyxLQUFLLENBQUMsQ0FBQTtJQUNwQixDQUFDO0lBRUQsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztRQUM5QixNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDN0MsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1lBQ3BELE9BQU8sSUFBSSxDQUFBO1FBQ2IsQ0FBQztRQUNELElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztZQUNyRCxPQUFPLEtBQUssQ0FBQTtRQUNkLENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTyxRQUFRLENBQUE7QUFDakIsQ0FBQztBQUVELFNBQVMsYUFBYSxDQUFDLEtBQWMsRUFBRSxRQUFRLEdBQUcsQ0FBQztJQUNqRCxJQUFJLEtBQUssS0FBSyxTQUFTLElBQUksS0FBSyxLQUFLLElBQUksRUFBRSxDQUFDO1FBQzFDLE9BQU8sUUFBUSxD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