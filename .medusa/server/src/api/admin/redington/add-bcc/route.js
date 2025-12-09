"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const pg_1 = require("../../../../lib/pg");
const normalizeEmails = (value) => {
    if (!value) {
        return [];
    }
    if (Array.isArray(value)) {
        return value
            .map((entry) => String(entry).trim())
            .filter(Boolean);
    }
    return value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
};
async function GET(req, res) {
    await Promise.all([
        (0, pg_1.ensureRedingtonAddBccTable)(),
        (0, pg_1.ensureRedingtonDomainTable)(),
    ]);
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT
        ab.*,
        d.domain_name
      FROM redington_add_bcc ab
      LEFT JOIN redington_domain d ON d.id = ab.domain_id
      ORDER BY ab.updated_at DESC
    `);
    return res.json({
        add_bcc_entries: rows.map((row) => ({
            ...(0, pg_1.mapAddBccRow)(row),
            domain_name: typeof row.domain_name === "string" && row.domain_name.length
                ? row.domain_name
                : null,
        })),
    });
}
async function POST(req, res) {
    await Promise.all([
        (0, pg_1.ensureRedingtonAddBccTable)(),
        (0, pg_1.ensureRedingtonDomainTable)(),
    ]);
    const body = (req.body || {});
    const domainIdRaw = body.domain_id;
    const domainId = typeof domainIdRaw === "string"
        ? Number.parseInt(domainIdRaw, 10)
        : Number(domainIdRaw);
    if (!Number.isFinite(domainId)) {
        return res.status(400).json({
            message: "domain_id must be a valid number",
        });
    }
    const domain = await (0, pg_1.findDomainById)(domainId);
    if (!domain) {
        return res.status(404).json({
            message: `Domain with id ${domainId} not found`,
        });
    }
    const emails = normalizeEmails(body.bcc_emails);
    const serialized = emails.join(",");
    const { rows } = await (0, pg_1.getPgPool)().query(`
      INSERT INTO redington_add_bcc (domain_id, bcc_emails)
      VALUES ($1, $2)
      ON CONFLICT (domain_id) DO UPDATE
        SET bcc_emails = EXCLUDED.bcc_emails,
            updated_at = NOW()
      RETURNING *
    `, [domainId, serialized]);
    const mapped = (0, pg_1.mapAddBccRow)(rows[0]);
    return res.status(201).json({
        add_bcc: {
            ...mapped,
            domain_name: domain.domain_name,
        },
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9hZGQtYmNjL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBZ0NBLGtCQTBCQztBQUVELG9CQWtEQztBQTVHRCwyQ0FNMkI7QUFPM0IsTUFBTSxlQUFlLEdBQUcsQ0FBQyxLQUFxQyxFQUFZLEVBQUU7SUFDMUUsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ1gsT0FBTyxFQUFFLENBQUE7SUFDWCxDQUFDO0lBRUQsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDekIsT0FBTyxLQUFLO2FBQ1QsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7YUFDcEMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ3BCLENBQUM7SUFFRCxPQUFPLEtBQUs7U0FDVCxLQUFLLENBQUMsR0FBRyxDQUFDO1NBQ1YsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDNUIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0FBQ3BCLENBQUMsQ0FBQTtBQUVNLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDaEIsSUFBQSwrQkFBMEIsR0FBRTtRQUM1QixJQUFBLCtCQUEwQixHQUFFO0tBQzdCLENBQUMsQ0FBQTtJQUVGLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxNQUFNLElBQUEsY0FBUyxHQUFFLENBQUMsS0FBSyxDQUN0Qzs7Ozs7OztLQU9DLENBQ0YsQ0FBQTtJQUVELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztRQUNkLGVBQWUsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2xDLEdBQUcsSUFBQSxpQkFBWSxFQUFDLEdBQUcsQ0FBQztZQUNwQixXQUFXLEVBQ1QsT0FBTyxHQUFHLENBQUMsV0FBVyxLQUFLLFFBQVEsSUFBSSxHQUFHLENBQUMsV0FBVyxDQUFDLE1BQU07Z0JBQzNELENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVztnQkFDakIsQ0FBQyxDQUFDLElBQUk7U0FDWCxDQUFDLENBQUM7S0FDSixDQUFDLENBQUE7QUFDSixDQUFDO0FBRU0sS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2hFLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUNoQixJQUFBLCtCQUEwQixHQUFFO1FBQzVCLElBQUEsK0JBQTBCLEdBQUU7S0FDN0IsQ0FBQyxDQUFBO0lBRUYsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBcUIsQ0FBQTtJQUVqRCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFBO0lBQ2xDLE1BQU0sUUFBUSxHQUNaLE9BQU8sV0FBVyxLQUFLLFFBQVE7UUFDN0IsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztRQUNsQyxDQUFDLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFBO0lBRXpCLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7UUFDL0IsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUsa0NBQWtDO1NBQzVDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsbUJBQWMsRUFBQyxRQUFRLENBQUMsQ0FBQTtJQUM3QyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDWixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFBRSxrQkFBa0IsUUFBUSxZQUFZO1NBQ2hELENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRCxNQUFNLE1BQU0sR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFBO0lBQy9DLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7SUFFbkMsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLE1BQU0sSUFBQSxjQUFTLEdBQUUsQ0FBQyxLQUFLLENBQ3RDOzs7Ozs7O0tBT0MsRUFDRCxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FDdkIsQ0FBQTtJQUVELE1BQU0sTUFBTSxHQUFHLElBQUEsaUJBQVksRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUVwQyxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQzFCLE9BQU8sRUFBRTtZQUNQLEdBQUcsTUFBTTtZQUNULFdBQVcsRUFBRSxNQUFNLENBQUMsV0FBVztTQUNoQztLQUNGLENBQUMsQ0FBQTtBQUNKLENBQUMifQ==