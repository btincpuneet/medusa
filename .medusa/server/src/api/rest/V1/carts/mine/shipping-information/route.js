"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.OPTIONS = void 0;
const axios_1 = __importDefault(require("axios"));
const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL;
const buildUrl = () => {
    if (!MAGENTO_REST_BASE_URL) {
        throw new Error("MAGENTO_REST_BASE_URL is not configured.");
    }
    const base = MAGENTO_REST_BASE_URL.replace(/\/$/, "");
    return `${base}/rest/V1/carts/mine/shipping-information`;
};
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
const POST = async (req, res) => {
    setCors(req, res);
    try {
        const url = buildUrl();
        const response = await axios_1.default.post(url, req.body, {
            headers: {
                "Content-Type": "application/json",
                Authorization: req.headers.authorization || "",
            },
            validateStatus: () => true,
        });
        if (response.status >= 200 && response.status < 300) {
            return res.json(response.data);
        }
        return res.status(response.status || 502).json({
            message: (response.data && response.data.message) ||
                "Failed to submit shipping information.",
        });
    }
    catch (error) {
        const status = error?.response?.status ?? 500;
        const message = error?.response?.data?.message ||
            error?.message ||
            "Unexpected error submitting shipping information.";
        return res.status(status).json({ message });
    }
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvY2FydHMvbWluZS9zaGlwcGluZy1pbmZvcm1hdGlvbi9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxrREFBeUI7QUFHekIsTUFBTSxxQkFBcUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFBO0FBQy9ELE1BQU0sUUFBUSxHQUFHLEdBQUcsRUFBRTtJQUNwQixJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUMzQixNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxDQUFDLENBQUE7SUFDN0QsQ0FBQztJQUNELE1BQU0sSUFBSSxHQUFHLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDckQsT0FBTyxHQUFHLElBQUksMENBQTBDLENBQUE7QUFDMUQsQ0FBQyxDQUFBO0FBRUQsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUMxRCxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQTtJQUNqQyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ1gsR0FBRyxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUNqRCxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUM5QixDQUFDO1NBQU0sQ0FBQztRQUNOLEdBQUcsQ0FBQyxNQUFNLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDaEQsQ0FBQztJQUNELEdBQUcsQ0FBQyxNQUFNLENBQ1IsOEJBQThCLEVBQzlCLEdBQUcsQ0FBQyxPQUFPLENBQUMsZ0NBQWdDLENBQUM7UUFDM0MsNkJBQTZCLENBQ2hDLENBQUE7SUFDRCxHQUFHLENBQUMsTUFBTSxDQUFDLDhCQUE4QixFQUFFLGNBQWMsQ0FBQyxDQUFBO0lBQzFELEdBQUcsQ0FBQyxNQUFNLENBQUMsa0NBQWtDLEVBQUUsTUFBTSxDQUFDLENBQUE7QUFDeEQsQ0FBQyxDQUFBO0FBRU0sTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ3ZFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDakIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtBQUN4QixDQUFDLENBQUE7QUFIWSxRQUFBLE9BQU8sV0FHbkI7QUFFTSxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDcEUsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUNqQixJQUFJLENBQUM7UUFDSCxNQUFNLEdBQUcsR0FBRyxRQUFRLEVBQUUsQ0FBQTtRQUN0QixNQUFNLFFBQVEsR0FBRyxNQUFNLGVBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUU7WUFDL0MsT0FBTyxFQUFFO2dCQUNQLGNBQWMsRUFBRSxrQkFBa0I7Z0JBQ2xDLGFBQWEsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLGFBQWEsSUFBSSxFQUFFO2FBQy9DO1lBQ0QsY0FBYyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUk7U0FDM0IsQ0FBQyxDQUFBO1FBRUYsSUFBSSxRQUFRLENBQUMsTUFBTSxJQUFJLEdBQUcsSUFBSSxRQUFRLENBQUMsTUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDO1lBQ3BELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDaEMsQ0FBQztRQUVELE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUM3QyxPQUFPLEVBQ0wsQ0FBQyxRQUFRLENBQUMsSUFBSSxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO2dCQUN4Qyx3Q0FBd0M7U0FDM0MsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7UUFDcEIsTUFBTSxNQUFNLEdBQUcsS0FBSyxFQUFFLFFBQVEsRUFBRSxNQUFNLElBQUksR0FBRyxDQUFBO1FBQzdDLE1BQU0sT0FBTyxHQUNYLEtBQUssRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE9BQU87WUFDOUIsS0FBSyxFQUFFLE9BQU87WUFDZCxtREFBbUQsQ0FBQTtRQUNyRCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQTtJQUM3QyxDQUFDO0FBQ0gsQ0FBQyxDQUFBO0FBN0JZLFFBQUEsSUFBSSxRQTZCaEIifQ==