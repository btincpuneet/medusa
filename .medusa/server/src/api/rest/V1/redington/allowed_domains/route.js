"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = exports.OPTIONS = void 0;
const redington_guest_user_1 = require("../../../../../modules/redington-guest-user");
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
const GET = async (req, res) => {
    setCors(req, res);
    try {
        const summary = await (0, redington_guest_user_1.collectAllowedGuestDomains)();
        res.json({
            allowed_domains: summary.allowed,
            config_domains: summary.config,
            database_domains: summary.database,
            domain_extensions: summary.extensions,
        });
    }
    catch (error) {
        const message = error instanceof Error
            ? error.message
            : "Unable to load allowed domains.";
        res.status(500).json({ message });
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvcmVkaW5ndG9uL2FsbG93ZWRfZG9tYWlucy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxzRkFBd0Y7QUFFeEYsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUMxRCxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQTtJQUNqQyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ1gsR0FBRyxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUNqRCxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUM5QixDQUFDO1NBQU0sQ0FBQztRQUNOLEdBQUcsQ0FBQyxNQUFNLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDaEQsQ0FBQztJQUVELEdBQUcsQ0FBQyxNQUFNLENBQ1IsOEJBQThCLEVBQzlCLEdBQUcsQ0FBQyxPQUFPLENBQUMsZ0NBQWdDLENBQUM7UUFDM0MsNkJBQTZCLENBQ2hDLENBQUE7SUFDRCxHQUFHLENBQUMsTUFBTSxDQUFDLDhCQUE4QixFQUFFLGFBQWEsQ0FBQyxDQUFBO0lBQ3pELEdBQUcsQ0FBQyxNQUFNLENBQUMsa0NBQWtDLEVBQUUsTUFBTSxDQUFDLENBQUE7QUFDeEQsQ0FBQyxDQUFBO0FBRU0sTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ3ZFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDakIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtBQUN4QixDQUFDLENBQUE7QUFIWSxRQUFBLE9BQU8sV0FHbkI7QUFFTSxNQUFNLEdBQUcsR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDbkUsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUVqQixJQUFJLENBQUM7UUFDSCxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUEsaURBQTBCLEdBQUUsQ0FBQTtRQUNsRCxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ1AsZUFBZSxFQUFFLE9BQU8sQ0FBQyxPQUFPO1lBQ2hDLGNBQWMsRUFBRSxPQUFPLENBQUMsTUFBTTtZQUM5QixnQkFBZ0IsRUFBRSxPQUFPLENBQUMsUUFBUTtZQUNsQyxpQkFBaUIsRUFBRSxPQUFPLENBQUMsVUFBVTtTQUN0QyxDQUFDLENBQUE7SUFDSixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE1BQU0sT0FBTyxHQUNYLEtBQUssWUFBWSxLQUFLO1lBQ3BCLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTztZQUNmLENBQUMsQ0FBQyxpQ0FBaUMsQ0FBQTtRQUN2QyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUE7SUFDbkMsQ0FBQztBQUNILENBQUMsQ0FBQTtBQWxCWSxRQUFBLEdBQUcsT0FrQmYifQ==