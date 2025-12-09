"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.OPTIONS = void 0;
const axios_1 = __importDefault(require("axios"));
const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL;
const ensureMagentoConfig = () => {
    if (!MAGENTO_REST_BASE_URL) {
        throw new Error("MAGENTO_REST_BASE_URL is required for CC Avenue payment proxy routes.");
    }
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
const forwardToMagento = async (req, res) => {
    setCors(req, res);
    try {
        ensureMagentoConfig();
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: error.message ?? "Magento config missing." });
    }
    const tokenHeader = req.headers.authorization || req.headers["x-auth-token"] || undefined;
    if (!tokenHeader) {
        return res.status(401).json({ message: "Missing Authorization header." });
    }
    const axiosConfig = {
        baseURL: MAGENTO_REST_BASE_URL.replace(/\/+$/, "") + "/",
        url: "carts/mine/cc-avenuepayment-information",
        method: "POST",
        headers: {
            Authorization: tokenHeader,
            "Content-Type": "application/json",
        },
        params: req.query,
        data: req.body,
        validateStatus: () => true,
    };
    try {
        const response = await axios_1.default.request(axiosConfig);
        return res.status(response.status).json(response.data);
    }
    catch (error) {
        const status = error?.response?.status ?? 500;
        const message = error?.response?.data?.message ||
            error?.message ||
            "Failed to proxy Magento CC Avenue payment request.";
        return res.status(status).json({ message });
    }
};
const OPTIONS = async (req, res) => {
    setCors(req, res);
    res.status(204).send();
};
exports.OPTIONS = OPTIONS;
exports.POST = forwardToMagento;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvY2FydHMvbWluZS9jYy1hdmVudWVwYXltZW50LWluZm9ybWF0aW9uL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUF5QjtBQUd6QixNQUFNLHFCQUFxQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUE7QUFFL0QsTUFBTSxtQkFBbUIsR0FBRyxHQUFHLEVBQUU7SUFDL0IsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFDM0IsTUFBTSxJQUFJLEtBQUssQ0FDYix1RUFBdUUsQ0FDeEUsQ0FBQTtJQUNILENBQUM7QUFDSCxDQUFDLENBQUE7QUFFRCxNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQzFELE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFBO0lBQ2pDLElBQUksTUFBTSxFQUFFLENBQUM7UUFDWCxHQUFHLENBQUMsTUFBTSxDQUFDLDZCQUE2QixFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQ2pELEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBQzlCLENBQUM7U0FBTSxDQUFDO1FBQ04sR0FBRyxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUNoRCxDQUFDO0lBRUQsR0FBRyxDQUFDLE1BQU0sQ0FDUiw4QkFBOEIsRUFDOUIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQztRQUMzQyw2QkFBNkIsQ0FDaEMsQ0FBQTtJQUNELEdBQUcsQ0FBQyxNQUFNLENBQUMsOEJBQThCLEVBQUUsY0FBYyxDQUFDLENBQUE7SUFDMUQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxrQ0FBa0MsRUFBRSxNQUFNLENBQUMsQ0FBQTtB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