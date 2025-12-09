"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.OPTIONS = void 0;
const url_crypto_1 = require("../../../../../lib/url-crypto");
const setCors = (req, res) => {
    const origin = req.headers.origin;
    if (origin) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Vary", "Origin");
    }
    else {
        res.header("Access-Control-Allow-Origin", "*");
    }
    res.header("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] || "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");
};
const OPTIONS = async (req, res) => {
    setCors(req, res);
    res.status(204).send();
};
exports.OPTIONS = OPTIONS;
const pickBaseUrl = (body) => {
    const value = body.baseUrl ||
        body.base_url ||
        body.webUrl ||
        body.web_url ||
        body.url ||
        "";
    return value ? String(value).trim() : "";
};
const pickParam = (body, key) => {
    const nested = body.params || {};
    const raw = (key === "access_code" &&
        (body.access_code ?? nested.access_code ?? body.accessCode)) ||
        (key === "company_code" &&
            (body.company_code ?? nested.company_code ?? body.companyCode)) ||
        (key === "country_code" &&
            (body.country_code ?? nested.country_code ?? body.countryCode)) ||
        "";
    return typeof raw === "string" ? raw.trim() : String(raw ?? "").trim();
};
const buildError = (message) => [
    {
        error: message,
        data: { error: message },
    },
];
const POST = async (req, res) => {
    setCors(req, res);
    const body = (req.body || {});
    const baseUrl = pickBaseUrl(body);
    if (!baseUrl) {
        return res.json(buildError("Web URL is missing"));
    }
    const params = {
        access_code: pickParam(body, "access_code"),
        company_code: pickParam(body, "company_code"),
        country_code: pickParam(body, "country_code"),
    };
    if (!params.access_code) {
        return res.json(buildError("Access code is missing or invalid"));
    }
    if (!params.company_code) {
        return res.json(buildError("Company code is missing or invalid"));
    }
    if (!params.country_code) {
        return res.json(buildError("Country code is missing or invalid (should be a 2-character code)"));
    }
    try {
        const result = (0, url_crypto_1.encryptUrlParams)(baseUrl, params);
        return res.json([
            {
                encrypted_url: result.encryptedUrl,
                q: result.q,
                data: {
                    encrypted_url: result.encryptedUrl,
                    q: result.q,
                    params: result.params,
                    query: result.query,
                },
            },
        ]);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error while encrypting URL.";
        return res.status(500).json({ message });
    }
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvdXJsL2VuY3J5cHQvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsOERBQWlGO0FBRWpGLE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDMUQsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7SUFDakMsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUNYLEdBQUcsQ0FBQyxNQUFNLENBQUMsNkJBQTZCLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFDakQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDOUIsQ0FBQztTQUFNLENBQUM7UUFDTixHQUFHLENBQUMsTUFBTSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ2hELENBQUM7SUFFRCxHQUFHLENBQUMsTUFBTSxDQUNSLDhCQUE4QixFQUM5QixHQUFHLENBQUMsT0FBTyxDQUFDLGdDQUFnQyxDQUFDLElBQUksNkJBQTZCLENBQy9FLENBQUE7SUFDRCxHQUFHLENBQUMsTUFBTSxDQUFDLDhCQUE4QixFQUFFLGNBQWMsQ0FBQyxDQUFBO0lBQzFELEdBQUcsQ0FBQyxNQUFNLENBQUMsa0NBQWtDLEVBQUUsTUFBTSxDQUFDLENBQUE7QUFDeEQsQ0FBQyxDQUFBO0FBRU0sTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ3ZFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDakIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtBQUN4QixDQUFDLENBQUE7QUFIWSxRQUFBLE9BQU8sV0FHbkI7QUFpQkQsTUFBTSxXQUFXLEdB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