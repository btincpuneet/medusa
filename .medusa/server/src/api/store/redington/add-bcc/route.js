"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const pg_1 = require("../../../../lib/pg");
const parseNumeric = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim().length) {
        const parsed = Number.parseInt(value.trim(), 10);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
};
const parseAccessId = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
    }
    if (typeof value === "string" && value.trim().length) {
        return value.trim();
    }
    return undefined;
};
async function GET(req, res) {
    await Promise.all([
        (0, pg_1.ensureRedingtonAddBccTable)(),
        (0, pg_1.ensureRedingtonAccessMappingTable)(),
        (0, pg_1.ensureRedingtonDomainTable)(),
    ]);
    const accessId = parseAccessId(req.query.access_id ?? req.query.accessId ?? req.query.access);
    const domainIdQuery = parseNumeric(req.query.domain_id ?? req.query.domainId);
    let domainId = domainIdQuery;
    if (!domainId && accessId) {
        const { rows } = await (0, pg_1.getPgPool)().query(`
        SELECT domain_id
        FROM redington_access_mapping
        WHERE access_id = $1
        LIMIT 1
      `, [accessId]);
        if (rows[0]?.domain_id) {
            domainId = Number(rows[0].domain_id);
        }
    }
    if (!domainId) {
        return res.status(400).json({
            message: "domain_id or access_id query parameter is required to resolve a BCC entry",
        });
    }
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT *
      FROM redington_add_bcc
      WHERE domain_id = $1
      LIMIT 1
    `, [domainId]);
    if (!rows[0]) {
        return res.status(404).json({
            message: `No BCC configuration found for domain ${domainId}`,
        });
    }
    return res.json({
        add_bcc: (0, pg_1.mapAddBccRow)(rows[0]),
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3JlZGluZ3Rvbi9hZGQtYmNjL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBbUNBLGtCQXdEQztBQXpGRCwyQ0FNMkI7QUFFM0IsTUFBTSxZQUFZLEdBQUcsQ0FBQyxLQUFjLEVBQXNCLEVBQUU7SUFDMUQsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ3hELE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztJQUVELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNyRCxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUNoRCxPQUFPLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFBO0lBQ3JELENBQUM7SUFFRCxPQUFPLFNBQVMsQ0FBQTtBQUNsQixDQUFDLENBQUE7QUFFRCxNQUFNLGFBQWEsR0FBRyxDQUFDLEtBQWMsRUFBc0IsRUFBRTtJQUMzRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDeEQsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDdEIsQ0FBQztJQUVELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNyRCxPQUFPLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQTtJQUNyQixDQUFDO0lBRUQsT0FBTyxTQUFTLENBQUE7QUFDbEIsQ0FBQyxDQUFBO0FBRU0sS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUNoQixJQUFBLCtCQUEwQixHQUFFO1FBQzVCLElBQUEsc0NBQWlDLEdBQUU7UUFDbkMsSUFBQSwrQkFBMEIsR0FBRTtLQUM3QixDQUFDLENBQUE7SUFFRixNQUFNLFFBQVEsR0FBRyxhQUFhLENBQzVCLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUM5RCxDQUFBO0lBQ0QsTUFBTSxhQUFhLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUE7SUFFN0UsSUFBSSxRQUFRLEdBQUcsYUFBYSxDQUFBO0lBRTVCLElBQUksQ0FBQyxRQUFRLElBQUksUUFBUSxFQUFFLENBQUM7UUFDMUIsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLE1BQU0sSUFBQSxjQUFTLEdBQUUsQ0FBQyxLQUFLLENBQ3RDOzs7OztPQUtDLEVBQ0QsQ0FBQyxRQUFRLENBQUMsQ0FDWCxDQUFBO1FBRUQsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUM7WUFDdkIsUUFBUSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUE7UUFDdEMsQ0FBQztJQUNILENBQUM7SUFFRCxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDZCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFDTCwyRUFBMkU7U0FDOUUsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVELE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxNQUFNLElBQUEsY0FBUyxHQUFFLENBQUMsS0FBSyxDQUN0Qzs7Ozs7S0FLQyxFQUNELENBQUMsUUFBUSxDQUFDLENBQ1gsQ0FBQTtJQUVELElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUNiLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDMUIsT0FBTyxFQUFFLHlDQUF5QyxRQUFRLEVBQUU7U0FDN0QsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztRQUNkLE9BQU8sRUFBRSxJQUFBLGlCQUFZLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQy9CLENBQUMsQ0FBQTtBQUNKLENBQUMifQ==