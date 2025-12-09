"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELETE = exports.PATCH = exports.PUT = exports.POST = exports.GET = exports.OPTIONS = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const pg_1 = require("../../../../../lib/pg");
const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL;
const ensureMagentoConfig = () => {
    if (!MAGENTO_REST_BASE_URL) {
        throw new Error("MAGENTO_REST_BASE_URL is required for cart proxy routes.");
    }
};
const ALLOWED_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
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
    res.header("Access-Control-Allow-Methods", ALLOWED_METHODS);
    res.header("Access-Control-Allow-Credentials", "true");
};
const buildGuestCartResponse = (method, token) => {
    const basePayload = {
        id: token,
        items_count: 0,
        items_qty: 0,
        customer: null,
        addresses: [],
        currency: {
            global_currency_code: "AED",
            base_currency_code: "AED",
            store_currency_code: "AED",
            quote_currency_code: "AED",
        },
        items: [],
    };
    switch (method) {
        case "POST":
            return token;
        case "DELETE":
        case "PUT":
        case "PATCH":
            return { success: true };
        default:
            return basePayload;
    }
};
const generateFallbackCartId = () => crypto_1.default.randomBytes(8).toString("hex");
const forwardToMagento = async (req, res) => {
    setCors(req, res);
    const tokenHeader = req.headers.authorization || req.headers["x-auth-token"] || undefined;
    const authHeader = Array.isArray(tokenHeader)
        ? tokenHeader[0]
        : tokenHeader;
    // Allow a hard fallback cart id when no Authorization header is present.
    if (!tokenHeader) {
        const id = generateFallbackCartId();
        return res.json(buildGuestCartResponse((req.method || "GET").toUpperCase(), id));
    }
    try {
        ensureMagentoConfig();
    }
    catch (error) {
        const id = generateFallbackCartId();
        return res.json(buildGuestCartResponse((req.method || "GET").toUpperCase(), id));
    }
    const method = (req.method || "GET").toUpperCase();
    const tokenValue = (authHeader || "").replace(/^Bearer\s+/i, "").trim();
    if (tokenValue && !tokenValue.includes(".")) {
        const guestToken = await (0, pg_1.findActiveGuestToken)(tokenValue);
        if (guestToken) {
            return res.json(buildGuestCartResponse(method, guestToken.token));
        }
    }
    const baseURL = MAGENTO_REST_BASE_URL.replace(/\/$/, "");
    const axiosConfig = {
        baseURL,
        url: "carts/mine",
        method,
        headers: {
            Authorization: tokenHeader,
            "Content-Type": "application/json",
        },
        params: method === "GET" ? req.query : undefined,
        data: method === "POST" ||
            method === "PUT" ||
            method === "PATCH" ||
            method === "DELETE"
            ? req.body
            : undefined,
        validateStatus: () => true,
    };
    try {
        const response = await axios_1.default.request(axiosConfig);
        if (response.status >= 200 && response.status < 300) {
            return res.status(response.status).json(response.data);
        }
        const fallback = buildGuestCartResponse(method, generateFallbackCartId());
        return res.status(200).json(fallback);
    }
    catch (error) {
        const fallback = buildGuestCartResponse(method, generateFallbackCartId());
        return res.status(200).json(fallback);
    }
};
const OPTIONS = async (req, res) => {
    setCors(req, res);
    res.status(204).send();
};
exports.OPTIONS = OPTIONS;
exports.GET = forwardToMagento;
exports.POST = forwardToMagento;
exports.PUT = forwardToMagento;
exports.PATCH = forwardToMagento;
exports.DELETE = forwardToMagento;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvY2FydHMvbWluZS9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxrREFBeUI7QUFDekIsb0RBQTJCO0FBRzNCLDhDQUE0RDtBQUU1RCxNQUFNLHFCQUFxQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUE7QUFFL0QsTUFBTSxtQkFBbUIsR0FBRyxHQUFHLEVBQUU7SUFDL0IsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFDM0IsTUFBTSxJQUFJLEtBQUssQ0FBQywwREFBMEQsQ0FBQyxDQUFBO0lBQzdFLENBQUM7QUFDSCxDQUFDLENBQUE7QUFFRCxNQUFNLGVBQWUsR0FBRyxtQ0FBbUMsQ0FBQTtBQUUzRCxNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQzFELE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFBO0lBQ2pDLElBQUksTUFBTSxFQUFFLENBQUM7UUFDWCxHQUFHLENBQUMsTUFBTSxDQUFDLDZCQUE2QixFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQ2pELEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBQzlCLENBQUM7U0FBTSxDQUFDO1FBQ04sR0FBRyxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUNoRCxDQUFDO0lBRUQsR0FBRyxDQUFDLE1BQU0sQ0FDUiw4QkFBOEIsRUFDOUIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQztRQUMzQyw2QkFBNkIsQ0FDaEMsQ0FBQTtJQUNELEdBQUcsQ0FBQyxNQUFNLENBQUMsOEJBQThCLEVBQUUsZUFBZSxDQUFDLENBQUE7SUFDM0QsR0FBRyxDQUFDLE1BQU0sQ0FBQyxr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