"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const url_crypto_1 = require("../../../../../lib/url-crypto");
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
const respondBadRequest = (res, message) => res.status(400).json({ message });
const POST = async (req, res) => {
    const body = (req.body || {});
    const baseUrl = pickBaseUrl(body);
    if (!baseUrl) {
        return respondBadRequest(res, "Web URL is missing");
    }
    const params = {
        access_code: pickParam(body, "access_code"),
        company_code: pickParam(body, "company_code"),
        country_code: pickParam(body, "country_code"),
    };
    if (!params.access_code) {
        return respondBadRequest(res, "Access code is missing or invalid");
    }
    if (!params.company_code) {
        return respondBadRequest(res, "Company code is missing or invalid");
    }
    if (!params.country_code) {
        return respondBadRequest(res, "Country code is missing or invalid (should be a 2-character code)");
    }
    try {
        const result = (0, url_crypto_1.encryptUrlParams)(baseUrl, params);
        return res.json({
            encrypted_url: result.encryptedUrl,
            q: result.q,
            params: result.params,
            query: result.query,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error while encrypting URL.";
        return res.status(500).json({ message });
    }
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi91cmwtY3J5cHRvL2VuY3J5cHQvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsOERBQWlGO0FBaUJqRixNQUFNLFdBQVcsR0FBRyxDQUFDLElBQWlCLEVBQVUsRUFBRTtJQUNoRCxNQUFNLEtBQUssR0FDVCxJQUFJLENBQUMsT0FBTztRQUNaLElBQUksQ0FBQyxRQUFRO1FBQ2IsSUFBSSxDQUFDLE1BQU07UUFDWCxJQUFJLENBQUMsT0FBTztRQUNaLElBQUksQ0FBQyxHQUFHO1FBQ1IsRUFBRSxDQUFBO0lBQ0osT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFBO0FBQzFDLENBQUMsQ0FBQTtBQUVELE1BQU0sU0FBUyxHQUFHLENBQUMsSUFBaUIsRUFBRSxHQUEwQixFQUFVLEVBQUU7SUFDMUUsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUE7SUFDaEMsTUFBTSxHQUFHLEdBQ1AsQ0FBQyxHQUFHLEtBQUssYUFBYTtRQUNwQixDQUFDLElBQUksQ0FBQyxXQUFXLElBQUksTUFBTSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDOUQsQ0FBQyxHQUFHLEtBQUssY0FBYztZQUNyQixDQUFDLElBQUksQ0FBQyxZQUFZLElBQUksTUFBTSxDQUFDLFlBQVksSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDakUsQ0FBQyxHQUFHLEtBQUssY0FBYztZQUNyQixDQUFDLElBQUksQ0FBQyxZQUFZLElBQUksTUFBTSxDQUFDLFlBQVksSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDakUsRUFBRSxDQUFBO0lBRUos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