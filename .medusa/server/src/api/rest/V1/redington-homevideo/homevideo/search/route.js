"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = exports.OPTIONS = void 0;
const pg_1 = require("../../../../../../lib/pg");
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
    res.header("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");
};
const OPTIONS = async (req, res) => {
    setCors(req, res);
    res.status(204).send();
};
exports.OPTIONS = OPTIONS;
const parseStatusFilter = (req) => {
    const value = req.query?.["searchCriteria[filter_groups][0][filters][0][value]"] ??
        req.query?.["searchCriteria[filter_groups][0][filters][0][value]".toLowerCase()];
    if (typeof value !== "string") {
        return undefined;
    }
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "active", "enabled"].includes(normalized)) {
        return true;
    }
    if (["0", "false", "no", "inactive", "disabled"].includes(normalized)) {
        return false;
    }
    return undefined;
};
const GET = async (req, res) => {
    setCors(req, res);
    await (0, pg_1.ensureRedingtonHomeVideoTable)();
    const statusFilter = parseStatusFilter(req);
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT id, title, url, status, created_at, updated_at
      FROM redington_home_video
      ${statusFilter === undefined ? "" : "WHERE status = $1"}
      ORDER BY created_at DESC
    `, statusFilter === undefined ? [] : [statusFilter]);
    const items = rows.map((row) => {
        const mapped = (0, pg_1.mapHomeVideoRow)(row);
        return {
            homevideo_id: mapped.id,
            title: mapped.title,
            url: mapped.url,
            status: mapped.status ? "yes" : "no",
            created_at: mapped.created_at,
            updateAt: mapped.updated_at,
        };
    });
    return res.json({
        items,
        total_count: items.length,
        search_criteria: req.query ?? {},
    });
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvcmVkaW5ndG9uLWhvbWV2aWRlby9ob21ldmlkZW8vc2VhcmNoL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLGlEQUlpQztBQUVqQyxNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQzFELE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFBO0lBQ2pDLElBQUksTUFBTSxFQUFFLENBQUM7UUFDWCxHQUFHLENBQUMsTUFBTSxDQUFDLDZCQUE2QixFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQ2pELEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBQzlCLENBQUM7U0FBTSxDQUFDO1FBQ04sR0FBRyxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUNoRCxDQUFDO0lBRUQsR0FBRyxDQUFDLE1BQU0sQ0FDUiw4QkFBOEIsRUFDOUIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQztRQUMzQyw2QkFBNkIsQ0FDaEMsQ0FBQTtJQUNELEdBQUcsQ0FBQyxNQUFNLENBQUMsOEJBQThCLEVBQUUsYUFBYSxDQUFDLENBQUE7SUFDekQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxrQ0FBa0MsRUFBRSxNQUFNLENBQUMsQ0FBQTtBQUN4RCxDQUFDLENBQUE7QUFFTSxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDdkUsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUNqQixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO0FBQ3hCLENBQUMsQ0FBQTtBQUhZLFFBQUEs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