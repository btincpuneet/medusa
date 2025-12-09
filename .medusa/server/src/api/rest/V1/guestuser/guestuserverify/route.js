"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.OPTIONS = void 0;
const sap_client_1 = __importDefault(require("../../../../../modules/sap-client"));
const redington_config_1 = require("../../../../../modules/redington-config");
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
const extractDomain = (email) => {
    const trimmed = email.trim().toLowerCase();
    const at = trimmed.lastIndexOf("@");
    if (at === -1 || at === trimmed.length - 1) {
        return null;
    }
    return trimmed.slice(at + 1);
};
const isAllowedDomain = (domain) => {
    if (!domain) {
        return false;
    }
    const allowed = redington_config_1.redingtonConfig.guestUsers.allowedDomains ?? [];
    if (!allowed.length) {
        return true;
    }
    return allowed
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean)
        .includes(domain.toLowerCase());
};
const POST = async (req, res) => {
    setCors(req, res);
    const body = (req.body || {});
    const email = (body.email || "").trim().toLowerCase();
    if (!email) {
        return res.status(400).json([
            {
                status: "error",
                message: "email is required",
            },
        ]);
    }
    const domain = extractDomain(email);
    if (!isAllowedDomain(domain)) {
        await (0, pg_1.recordGuestUserAudit)({
            email,
            success: false,
            message: "Domain is not allowed for guest access.",
            metadata: { domain },
        });
        return res.status(403).json([
            {
                status: "error",
                message: "Email domain is not permitted for guest access.",
            },
        ]);
    }
    // ensure guest token table exists because the follow-up flow depends on it
    await (0, pg_1.ensureRedingtonGuestTokenTable)();
    const sapClient = (0, sap_client_1.default)();
    let success = false;
    let message = "Email verified.";
    let sapPayload;
    let sapCustomerCode = null;
    try {
        const response = await sapClient.createCustomer(email);
        sapPayload = response.data ?? {};
        const status = typeof response.data === "object" && response.data
            ? (response.data.Status ??
                response.data.status ??
                response.data.result ??
                response.data.Result ??
                "")
            : "";
        const normalizedStatus = typeof status === "string" ? status.toUpperCase() : "";
        success = normalizedStatus === "PASS" || normalizedStatus === "SUCCESS";
        const potentialCode = response.data?.CustomerCode ??
            response.data?.customerCode ??
            response.data?.customer_code ??
            response.data?.customerid ??
            response.data?.CustomerID;
        if (typeof potentialCode === "string" && potentialCode.trim().length) {
            sapCustomerCode = potentialCode.trim();
        }
        if (success) {
            message = "Email verified and customer synced with SAP.";
        }
        else if (normalizedStatus) {
            message = `Email verified but SAP returned status ${normalizedStatus}.`;
        }
    }
    catch (error) {
        message =
            error?.response?.data?.message ||
                error?.message ||
                "Unexpected error while verifying guest user.";
        sapPayload = {
            error: true,
            message,
            status: error?.response?.status,
        };
    }
    try {
        await (0, pg_1.upsertRedingtonCustomerSync)({
            email,
            sapSync: success,
            sapCustomerCode,
        });
    }
    catch (syncError) {
        console.warn("Failed to upsert SAP customer sync state", syncError);
    }
    await (0, pg_1.recordGuestUserAudit)({
        email,
        success,
        message,
        metadata: {
            domain,
            sap_response: sapPayload,
        },
    });
    if (!success) {
        return res.status(502).json([
            {
                status: "error",
                message,
            },
        ]);
    }
    return res.json([
        {
            status: "success",
            message,
        },
    ]);
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvZ3Vlc3R1c2VyL2d1ZXN0dXNlcnZlcmlmeS9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFFQSxtRkFBK0Q7QUFDL0QsOEVBQXlFO0FBQ3pFLDhDQUk4QjtBQUU5QixNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQzFELE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFBO0lBQ2pDLElBQUksTUFBTSxFQUFFLENBQUM7UUFDWCxHQUFHLENBQUMsTUFBTSxDQUFDLDZCQUE2QixFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQ2pELEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBQzlCLENBQUM7U0FBTSxDQUFDO1FBQ04sR0FBRyxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUNoRCxDQUFDO0lBRUQsR0FBRyxDQUFDLE1BQU0sQ0FDUiw4QkFBOEIsRUFDOUIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQztRQUMzQyw2QkFBNkIsQ0FDaEMsQ0FBQTtJQUNELEdBQUcsQ0FBQyxNQUFNLENBQUMsOEJBQThCLEVBQUUsY0FBYyxDQUFDLENBQUE7SUFDMUQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxrQ0FBa0MsRUFBRSxNQUFNLENBQUMsQ0FBQTtBQUN4RCxDQUFDLENBQUE7QUFFTSxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDdkUsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUNqQixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO0FBQ3hCLENBQUMs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