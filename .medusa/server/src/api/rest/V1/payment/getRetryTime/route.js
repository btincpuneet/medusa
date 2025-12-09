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
const DEFAULT_RETRY_TIME = "02:00:00";
const normalizeString = (value) => {
    if (typeof value !== "string") {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
};
const POST = async (req, res) => {
    setCors(req, res);
    const body = (req.body || {});
    const accessId = normalizeString(body.access_id ?? body.accessId ?? null);
    const companyCode = normalizeString(body.company_code ?? body.companyCode ?? null);
    await (0, pg_1.ensureRedingtonRetainCartConfigTable)();
    if (!accessId || !companyCode) {
        return res.status(400).json([
            {
                success: false,
                message: "access_id and company_code are required.",
            },
        ]);
    }
    const accessMapping = await (0, pg_1.findAccessMappingByAccessId)(accessId, {
        companyCode,
    });
    let domainId = accessMapping?.domain_id ?? null;
    if (domainId !== null && !Number.isFinite(domainId)) {
        domainId = null;
    }
    const config = await (0, pg_1.findRetainCartConfigByDomainId)(domainId);
    const retryTime = config?.retry_time ?? DEFAULT_RETRY_TIME;
    return res.json([
        {
            success: true,
            data: [
                {
                    retry_time: retryTime,
                    domain_id: domainId,
                    source: config ? "config" : "default",
                },
            ],
        },
    ]);
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvcGF5bWVudC9nZXRSZXRyeVRpbWUvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsOENBSThCO0FBRTlCLE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDMUQsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7SUFDakMsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUNYLEdBQUcsQ0FBQyxNQUFNLENBQUMsNkJBQTZCLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFDakQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDOUIsQ0FBQztTQUFNLENBQUM7UUFDTixHQUFHLENBQUMsTUFBTSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ2hELENBQUM7SUFFRCxHQUFHLENBQUMsTUFBTSxDQUNSLDhCQUE4QixFQUM5QixHQUFHLENBQUMsT0FBTyxDQUFDLGdDQUFnQyxDQUFDO1FBQzNDLDZCQUE2QixDQUNoQyxDQUFBO0lBQ0QsR0FBRyxDQUFDLE1BQU0sQ0FBQyw4QkFBOEIsRUFBRSxjQUFjLENBQUMsQ0FBQTtJQUMxRCxHQUFHLENBQUMsTUFBTSxDQUFDLGtDQUFrQyxFQUFFLE1BQU0sQ0FBQyxDQUFBO0FBQ3hELENBQUMsQ0FBQTtBQUVNLE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUN2RSxPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ2pCLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7QUFDeEIsQ0FBQyxDQUFBO0FBSFksUUFBQSxPQUFPLFdBR25CO0FBU0QsTUFBTSxrQkFBa0IsR0FBRyxVQUFVLENBQUE7QUFFckMsTUFBTSxlQUFlLEdBQUcsQ0FBQyxLQUFxQixFQUFpQixFQUFFO0lBQy9ELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDOUIsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBQ0QsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFBO0lBQzVCLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUE7QUFDeEMsQ0FBQyxDQUFBO0FBRU0sTUFBTSxJQUFJLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ3BFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFFakIsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBa0IsQ0FBQTtJQUM5QyxNQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxDQUFBO0lBQ3pFLE1BQU0sV0FBVyxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsWUFBWSxJQUFJLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLENBQUE7SUFFbEYsTUFBTSxJQUFBLHlDQUFvQyxHQUFFLENBQUE7SUFFNUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQzlCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDMUI7Z0JBQ0UsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsT0FBTyxFQUFFLDBDQUEwQzthQUNwRDtTQUNGLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRCxNQUFNLGFBQWEsR0FBRyxNQUFNLElBQUEsZ0NBQTJCLEVBQUMsUUFBUSxFQUFFO1FBQ2hFLFdBQVc7S0FDWixDQUFDLENBQUE7SUFFRixJQUFJLFFBQVEsR0FBRyxhQUFhLEVBQUUsU0FBUyxJQUFJLElBQUksQ0FBQTtJQUMvQyxJQUFJLFFBQVEsS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7UUFDcEQsUUFBUSxHQUFHLElBQUksQ0FBQTtJQUNqQixDQUFDO0lBRUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLG1DQUE4QixFQUFDLFFBQVEsQ0FBQyxDQUFBO0lBRTdELE1BQU0sU0FBUyxHQUFHLE1BQU0sRUFBRSxVQUFVLElBQUksa0JBQWtCLENBQUE7SUFFMUQsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQ2Q7WUFDRSxPQUFPLEVBQUUsSUFBSTtZQUNiLElBQUksRUFBRTtnQkFDSjtvQkFDRSxVQUFVLEVBQUUsU0FBUztvQkFDckIsU0FBUyxFQUFFLFFBQVE7b0JBQ25CLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBUztpQkFDdEM7YUFDRjtTQUNGO0tBQ0YsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFBO0FBM0NZLFFBQUEsSUFBSSxRQTJDaEIifQ==