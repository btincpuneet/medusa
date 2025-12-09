"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.OPTIONS = void 0;
const axios_1 = __importDefault(require("axios"));
const legacy_auth_1 = require("../../../../../utils/legacy-auth");
const magento_customer_1 = require("../../../../../utils/magento-customer");
const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL;
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
const extractTokenString = (payload) => {
    if (!payload) {
        return null;
    }
    if (typeof payload === "string") {
        return payload;
    }
    if (typeof payload === "object") {
        if (typeof payload.token === "string") {
            return payload.token;
        }
        if (typeof payload.access_token === "string") {
            return payload.access_token;
        }
        if (typeof payload.jwt === "string") {
            return payload.jwt;
        }
        if (payload.token && typeof payload.token.token === "string") {
            return payload.token.token;
        }
    }
    return null;
};
const buildMagentoLoginUrl = () => {
    if (!MAGENTO_REST_BASE_URL) {
        throw new Error("MAGENTO_REST_BASE_URL is not configured. Unable to authenticate customers against Magento.");
    }
    return `${MAGENTO_REST_BASE_URL.replace(/\/$/, "")}/integration/customer/token`;
};
const exchangeMagentoToken = async (username, password) => {
    const url = buildMagentoLoginUrl();
    const response = await axios_1.default.post(url, { username, password }, {
        headers: {
            "Content-Type": "application/json",
        },
        validateStatus: () => true,
        timeout: 10000,
    });
    if (response.status === 200 &&
        typeof response.data === "string" &&
        response.data.trim().length) {
        return response.data.trim();
    }
    const message = (response.data && response.data.message) ||
        (typeof response.data === "string" ? response.data : null) ||
        "Failed to authenticate with Magento.";
    const error = new Error(message);
    error.status = response.status === 401 ? 401 : 502;
    throw error;
};
const OPTIONS = async (req, res) => {
    setCors(req, res);
    res.status(204).send();
};
exports.OPTIONS = OPTIONS;
const POST = async (req, res) => {
    setCors(req, res);
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: "username and password are required" });
    }
    const normalizedUsername = String(username).trim();
    if (!normalizedUsername.length) {
        return res.status(400).json({ message: "A valid username is required." });
    }
    const email = normalizedUsername.toLowerCase();
    let medusaToken = null;
    try {
        const authPayload = await (0, legacy_auth_1.authenticateWithLegacySupport)(req, email, password);
        medusaToken = extractTokenString(authPayload);
        if (medusaToken) {
            res.header("X-Medusa-Token", medusaToken);
        }
    }
    catch (error) {
        const isUnauthorized = error?.name === "UnauthorizedError" || error?.message === "Unauthorized";
        if (!isUnauthorized) {
            console.warn("Medusa authentication failed, attempting Magento fallback.", error);
        }
    }
    let magentoToken = null;
    let magentoError = null;
    try {
        magentoToken = await exchangeMagentoToken(normalizedUsername, password);
    }
    catch (error) {
        magentoError = error;
        const unauthorized = error?.name === "UnauthorizedError" ||
            error?.message === "Unauthorized" ||
            error?.status === 401;
        if (unauthorized) {
            await (0, magento_customer_1.updateMagentoCustomerPassword)(email, password).catch(() => undefined);
            try {
                magentoToken = await exchangeMagentoToken(normalizedUsername, password);
                magentoError = null;
            }
            catch (retryError) {
                magentoError = retryError;
            }
        }
    }
    if (magentoToken) {
        return res.status(200).json(magentoToken);
    }
    const unauthorized = magentoError?.name === "UnauthorizedError" ||
        magentoError?.message === "Unauthorized" ||
        magentoError?.status === 401;
    const status = unauthorized ? 401 : magentoError?.status || 500;
    const message = status === 401
        ? "The credentials provided are invalid."
        : magentoError?.message || "Unexpected error during authentication.";
    return res.status(status).json({
        message,
        ...(medusaToken ? { medusa_token: medusaToken } : {}),
    });
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvaW50ZWdyYXRpb24vY3VzdG9tZXIvdG9rZW4vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsa0RBQXlCO0FBR3pCLGtFQUFnRjtBQUNoRiw0RUFBcUY7QUFPckYsTUFBTSxxQkFBcUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFBO0FBRS9ELE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDMUQsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7SUFDakMsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUNYLEdBQUcsQ0FBQyxNQUFNLENBQUMsNkJBQTZCLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFDakQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDOUIsQ0FBQztTQUFNLENBQUM7UUFDTixHQUFHLENBQUMsTUFBTSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ2hELENBQUM7SUFFRCxHQUFHLENBQUMsTUFBTSxDQUNSLDhCQUE4QixFQUM5QixHQUFHLENBQUMsT0FBTyxDQUFDLGdDQUFnQyxDQUFDO1FBQzNDLDZCQUE2QixDQUNoQyxDQUFBO0lBQ0QsR0FBRyxDQUFDLE1BQU0sQ0FBQyw4QkFBOEIsRUFBRSxjQUFjLENBQUMsQ0FBQTtJQUMxRCxHQUFHLENBQUMsTUFBTSxDQUFDLGtDQUFrQyxFQUFFLE1BQU0sQ0FBQyxDQUFBO0FBQ3hELENBQUMsQ0FBQTtBQUVELE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxPQUFZLEVBQWlCLEVBQUU7SUFDekQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2IsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lB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