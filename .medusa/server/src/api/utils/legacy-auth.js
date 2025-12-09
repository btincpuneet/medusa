"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateWithLegacySupport = exports.verifyCustomerToken = exports.issueCustomerToken = exports.CUSTOMER_SESSION_COOKIE = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const customer_auth_1 = require("../../lib/customer-auth");
const unauthorizedError = () => {
    const error = new Error("Unauthorized");
    error.name = "UnauthorizedError";
    return error;
};
const EMAILPASS_PROVIDER = "emailpass";
const TOKEN_TTL = process.env.CUSTOMER_TOKEN_TTL || "1d";
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
exports.CUSTOMER_SESSION_COOKIE = process.env.CUSTOMER_SESSION_COOKIE || "redington_session";
const issueCustomerToken = (email, customerId) => {
    const normalizedEmail = (email || "").trim().toLowerCase();
    if (!normalizedEmail) {
        throw unauthorizedError();
    }
    return jsonwebtoken_1.default.sign({
        email: normalizedEmail,
        actor_type: "customer",
        customer_id: customerId ?? null,
    }, JWT_SECRET, { expiresIn: TOKEN_TTL });
};
exports.issueCustomerToken = issueCustomerToken;
const verifyCustomerToken = (token) => {
    if (!token || typeof token !== "string") {
        return null;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return typeof decoded === "string"
            ? { email: decoded }
            : decoded;
    }
    catch (_) {
        return null;
    }
};
exports.verifyCustomerToken = verifyCustomerToken;
const authenticateWithEmailPass = async (scope, email, password) => {
    const authModule = (0, customer_auth_1.getAuthModuleService)(scope);
    const normalizedEmail = (email || "").trim().toLowerCase();
    const result = await authModule.authenticate(EMAILPASS_PROVIDER, {
        body: {
            email: normalizedEmail,
            password,
        },
    });
    if (!result?.success) {
        throw unauthorizedError();
    }
    let customerId = result.authIdentity?.app_metadata?.customer_id ||
        null;
    if (!customerId) {
        const customer = await (0, customer_auth_1.findRegisteredCustomerByEmail)(scope, normalizedEmail);
        if (!customer?.id) {
            throw unauthorizedError();
        }
        customerId = customer.id;
        await (0, customer_auth_1.ensureEmailPasswordIdentity)(scope, normalizedEmail, password, customerId);
    }
    return (0, exports.issueCustomerToken)(normalizedEmail, customerId);
};
/**
 * Attempts to authenticate a Medusa customer. If the credential check fails,
 * the function falls back to validating legacy Magento hashes stored in
 * customer metadata. When a legacy hash succeeds, it is automatically
 * upgraded to a Medusa-native password hash for subsequent logins.
 */
const authenticateWithLegacySupport = async (req, email, password) => {
    const scope = req.scope;
    const bcrypt = require("bcryptjs");
    const argon2 = require("argon2");
    // 1) Try native Medusa auth first.
    try {
        return await authenticateWithEmailPass(scope, email, password);
    }
    catch (_) {
        // continue with legacy path
    }
    // 2) Attempt legacy hash validation.
    const customer = await (0, customer_auth_1.findRegisteredCustomerByEmail)(scope, email);
    if (!customer) {
        throw unauthorizedError();
    }
    const metadata = (customer.metadata || {});
    const legacyHash = metadata.magento_password_hash ??
        metadata.legacy_password_hash ??
        null;
    const legacyAlgo = metadata.magento_hash_algo ??
        metadata.legacy_hash_algo ??
        null;
    if (!legacyHash) {
        throw unauthorizedError();
    }
    let isValid = false;
    try {
        const normalizedHash = typeof legacyHash === "string" ? legacyHash.trim() : "";
        if (!normalizedHash) {
            throw unauthorizedError();
        }
        if (legacyAlgo === "bcrypt" ||
            normalizedHash.startsWith("$2a$") ||
            normalizedHash.startsWith("$2b$") ||
            normalizedHash.startsWith("$2y$")) {
            // Magento stores bcrypt hashes with $2y; Node's bcrypt expects $2b.
            const compatibleHash = normalizedHash.replace(/^\$2y\$/, "$2b$");
            isValid = await bcrypt.compare(password, compatibleHash);
        }
        else if (legacyAlgo === "argon2id" ||
            normalizedHash.startsWith("$argon2id$")) {
            isValid = await argon2.verify(normalizedHash, password);
        }
    }
    catch (_) {
        // fall through to unauthorized
    }
    if (!isValid) {
        throw unauthorizedError();
    }
    // 3) Upgrade password to Medusa-native hash and clear legacy metadata.
    await (0, customer_auth_1.updateCustomerRecord)(scope, customer.id, {
        metadata: {
            ...metadata,
            magento_password_hash: null,
            magento_hash_algo: null,
            legacy_password_hash: null,
            legacy_hash_algo: null,
            magento_password_upgraded_at: new Date().toISOString(),
        },
    });
    await (0, customer_auth_1.ensureEmailPasswordIdentity)(scope, email, password, customer.id);
    // 4) Issue a Medusa JWT for downstream requests.
    return (0, exports.issueCustomerToken)(email, customer.id);
};
exports.authenticateWithLegacySupport = authenticateWithLegacySupport;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVnYWN5LWF1dGguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3V0aWxzL2xlZ2FjeS1hdXRoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUVBLGdFQUFtRDtBQUVuRCwyREFLZ0M7QUFZaEMsTUFBTSxpQkFBaUIsR0FBRyxHQUFHLEVBQUU7SUFDN0IsTUFBTSxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUE7SUFDdkMsS0FBSyxDQUFDLElBQUksR0FBRyxtQkFBbUIsQ0FBQTtJQUNoQyxPQUFPLEtBQUssQ0FBQTtBQUNkLENBQUMsQ0FBQTtBQUVELE1BQU0sa0JBQWtCLEdBQUcsV0FBVyxDQUFBO0FBQ3RDLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksSUFBSSxDQUFBO0FBQ3hELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLGFBQWEsQ0FBQTtBQUM3QyxRQUFBLHVCQUF1QixHQUNsQyxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixJQUFJLG1CQUFtQixDQUFBO0FBUXJELE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxLQUFhLEVBQUUsVUFBMEIsRUFBRSxFQUFFO0lBQzlFLE1BQU0sZUFBZSxHQUFHLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFBO0lBQzFELElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUNyQixNQUFNLGlCQUFpQixFQUFFLENBQUE7SUFDM0IsQ0FBQztJQUVELE9BQU8sc0JBQUcsQ0FBQyxJQUFJLENBQ2I7UUFDRSxLQUFLLEVBQUUsZUFBZTtRQUN0QixVQUFVLEVBQUUsVUFBVTtRQUN0QixXQUFXLEVBQUUsVUFBVSxJQUFJLElBQUk7S0FDaEMsRUFDRCxVQUFVLEVBQ1YsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFF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