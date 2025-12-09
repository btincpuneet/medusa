"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const pg_1 = require("../../../../lib/pg");
const normalizeString = (value) => (value ?? "").trim();
const normalizeLower = (value) => normalizeString(value).toLowerCase();
const clampLimit = (value, fallback) => {
    if (!value) {
        return fallback;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }
    return Math.min(Math.trunc(parsed), 200);
};
const clampOffset = (value) => {
    if (!value) {
        return 0;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
    }
    return Math.trunc(parsed);
};
const STATUS_CASE = `
  CASE
    WHEN consumed_at IS NOT NULL THEN 'consumed'
    WHEN expires_at < NOW() THEN 'expired'
    ELSE 'pending'
  END
`;
async function GET(req, res) {
    await (0, pg_1.ensureRedingtonOtpTable)();
    const query = (req.query || {});
    const conditions = [];
    const params = [];
    const email = normalizeLower(query.email);
    if (email) {
        conditions.push(`LOWER(email) LIKE $${params.length + 1}`);
        params.push(`%${email}%`);
    }
    const action = normalizeString(query.action);
    if (action) {
        conditions.push(`LOWER(action) = $${params.length + 1}`);
        params.push(action.toLowerCase());
    }
    const status = normalizeLower(query.status);
    if (status && !["all", ""].includes(status)) {
        if (!["pending", "expired", "consumed"].includes(status)) {
            return res.status(400).json({
                message: "status must be one of pending, expired, consumed, or omitted",
            });
        }
        conditions.push(`${STATUS_CASE} = $${params.length + 1}`);
        params.push(status);
    }
    const limit = clampLimit(query.limit, 100);
    const offset = clampOffset(query.offset);
    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT
        id,
        email,
        action,
        code,
        expires_at,
        consumed_at,
        created_at,
        updated_at,
        ${STATUS_CASE} AS status,
        (consumed_at IS NOT NULL) AS is_consumed,
        (expires_at < NOW()) AS is_expired,
        GREATEST(updated_at, created_at, expires_at) AS activity_at,
        COUNT(*) OVER() AS total_count
      FROM redington_otp
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `, [...params, limit, offset]);
    const total = rows.length && rows[0].total_count !== undefined
        ? Number(rows[0].total_count)
        : 0;
    const mapped = rows.map((row) => {
        const record = (0, pg_1.mapOtpRow)(row);
        const activityAt = row.activity_at instanceof Date
            ? row.activity_at.toISOString()
            : String(row.activity_at ?? record.updated_at);
        return {
            ...record,
            status: typeof row.status === "string" ? row.status : "pending",
            is_expired: Boolean(row.is_expired),
            is_consumed: Boolean(row.is_consumed),
            activity_at: activityAt,
        };
    });
    const { rows: statsRows } = await (0, pg_1.getPgPool)().query(`
      SELECT
        COUNT(*) FILTER (WHERE consumed_at IS NOT NULL) AS consumed,
        COUNT(*) FILTER (WHERE consumed_at IS NULL AND expires_at < NOW()) AS expired,
        COUNT(*) FILTER (WHERE consumed_at IS NULL AND expires_at >= NOW()) AS pending,
        MAX(created_at) AS last_created_at,
        MAX(consumed_at) AS last_consumed_at
      FROM redington_otp
    `);
    const statsRow = statsRows[0] ?? {};
    const pending = Number(statsRow.pending ?? 0);
    const expired = Number(statsRow.expired ?? 0);
    const consumed = Number(statsRow.consumed ?? 0);
    return res.json({
        otps: mapped,
        count: total,
        limit,
        offset,
        stats: {
            pending,
            expired,
            consumed,
            total: pending + expired + consumed,
            last_created_at: statsRow.last_created_at instanceof Date
                ? statsRow.last_created_at.toISOString()
                : statsRow.last_created_at ?? null,
            last_consumed_at: statsRow.last_consumed_at instanceof Date
                ? statsRow.last_consumed_at.toISOString()
                : statsRow.last_consumed_at ?? null,
        },
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9vdHAvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFvREEsa0JBMkhDO0FBN0tELDJDQUkyQjtBQUkzQixNQUFNLGVBQWUsR0FBRyxDQUFDLEtBQXVCLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO0FBQ3pFLE1BQU0sY0FBYyxHQUFHLENBQUMsS0FBdUIsRUFBRSxFQUFFLENBQ2pELGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUV0QyxNQUFNLFVBQVUsR0FBRyxDQUFDLEtBQXVCLEVBQUUsUUFBZ0IsRUFBRSxFQUFFO0lBQy9ELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNYLE9BQU8sUUFBUSxDQUFBO0lBQ2pCLENBQUM7SUFDRCxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQzVDLE9BQU8sUUFBUSxDQUFBO0lBQ2pCLENBQUM7SUFDRCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQTtBQUMxQyxDQUFDLENBQUE7QUFFRCxNQUFNLFdBQVcsR0FBRyxDQUFDLEtBQXVCLEVBQUUsRUFBRTtJQUM5QyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDWCxPQUFPLENBQUMsQ0FBQTtJQUNWLENBQUM7SUFDRCxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFB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