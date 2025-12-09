"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.OPTIONS = void 0;
const pg_1 = require("../../../../../lib/pg");
const magentoClient_1 = require("../../../../../api/magentoClient");
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
const OPTIONS = async (req, res) => {
    setCors(req, res);
    res.status(204).send();
};
exports.OPTIONS = OPTIONS;
const createFailureResponse = (message) => [
    {
        success: false,
        message,
    },
];
const TOKEN_TTL_MINUTES = Number(process.env.REDINGTON_GUEST_TOKEN_TTL_MINUTES || 60);
const ensureMagentoConfig = () => {
    if (!MAGENTO_REST_BASE_URL) {
        throw new Error("MAGENTO_REST_BASE_URL is required for guest tokens.");
    }
};
const POST = async (req, res) => {
    setCors(req, res);
    const body = (req.body || {});
    const email = (body.email || "").trim().toLowerCase();
    if (!email) {
        return res.json(createFailureResponse("email is required"));
    }
    try {
        ensureMagentoConfig();
    }
    catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Magento configuration missing.",
        });
    }
    try {
        const magentoClient = (0, magentoClient_1.createMagentoB2CClient)({
            baseUrl: MAGENTO_REST_BASE_URL,
        });
        const response = await magentoClient.request({
            url: "guestuser/token",
            method: "POST",
            data: body,
        });
        const magentoPayload = response.data;
        const extractToken = (payload) => {
            if (!payload) {
                return null;
            }
            if (typeof payload === "string") {
                return payload;
            }
            if (Array.isArray(payload)) {
                return extractToken(payload[0]);
            }
            if (typeof payload === "object") {
                return (typeof payload.token === "string"
                    ? payload.token
                    : typeof payload.access_token === "string"
                        ? payload.access_token
                        : null);
            }
            return null;
        };
        const token = extractToken(magentoPayload);
        if (token) {
            await (0, pg_1.ensureRedingtonGuestTokenTable)();
            const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString();
            await (0, pg_1.getPgPool)().query(`
          INSERT INTO redington_guest_token (email, token, expires_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (email) DO UPDATE
            SET token = EXCLUDED.token,
                expires_at = EXCLUDED.expires_at,
                updated_at = NOW()
        `, [email, token, expiresAt]);
        }
        return res.status(response.status).json(magentoPayload);
    }
    catch (error) {
        const status = error?.response?.status ?? 502;
        const message = error?.response?.data?.message ||
            error?.message ||
            "Failed to request Magento guest token.";
        return res.status(status).json(createFailureResponse(message));
    }
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvZ3Vlc3R1c2VyL3Rva2VuL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLDhDQUc4QjtBQUM5QixvRUFBeUU7QUFFekUsTUFBTSxxQkFBcUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFBO0FBRS9ELE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDMUQsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7SUFDakMsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUNYLEdBQUcsQ0FBQyxNQUFNLENBQUMsNkJBQTZCLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFDakQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDOUIsQ0FBQztTQUFNLENBQUM7UUFDTixHQUFHLENBQUMsTUFBTSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ2hELENBQUM7SUFFRCxHQUFHLENBQUMsTUFBTSxDQUNSLDhCQUE4QixFQUM5QixHQUFHLENBQUMsT0FBTyxDQUFDLGdDQUFnQyxDQUFDO1FBQzNDLDZCQUE2QixDQUNoQyxDQUFBO0lBQ0QsR0FBRyxDQUFDLE1BQU0sQ0FBQyw4QkFBOEIsRUFBRSxjQUFjLENBQUMsQ0FBQTtJQUMxRCxHQUFHLENBQUMsTUFBTSxDQUFDLGtDQUFrQyxFQUFFLE1BQU0sQ0FBQyxDQUFBO0FBQ3hELENBQUMsQ0FBQTtBQUVNLE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUN2RSxPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ2pCLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENB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