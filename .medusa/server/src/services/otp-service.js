"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCustomerOtp = exports.generateCustomerOtp = void 0;
const argon2_1 = __importDefault(require("argon2"));
const pg_1 = require("../lib/pg");
const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const normalizeEmail = (value) => (value || "").trim().toLowerCase();
const buildOtpCode = () => String(Math.floor(10 ** (OTP_LENGTH - 1) + Math.random() * 9 * 10 ** (OTP_LENGTH - 1)));
const toIsoString = (value) => value.toISOString();
const generateCustomerOtp = async (email) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
        throw new Error("Valid email is required to generate an OTP.");
    }
    const otp = buildOtpCode();
    const codeHash = await argon2_1.default.hash(otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    await (0, pg_1.upsertCustomerOtpRecord)(normalizedEmail, codeHash, toIsoString(expiresAt));
    return otp;
};
exports.generateCustomerOtp = generateCustomerOtp;
const verifyCustomerOtp = async (email, otp) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !otp || otp.trim().length === 0) {
        return false;
    }
    const record = await (0, pg_1.fetchCustomerOtpByEmail)(normalizedEmail);
    if (!record) {
        return false;
    }
    if (record.consumed_at) {
        return false;
    }
    const expiresAt = new Date(record.expires_at);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
        return false;
    }
    if (record.attempts >= MAX_OTP_ATTEMPTS) {
        return false;
    }
    let isValid = false;
    try {
        isValid = await argon2_1.default.verify(record.code_hash, otp);
    }
    catch {
        isValid = false;
    }
    if (isValid) {
        await (0, pg_1.markCustomerOtpConsumed)(record.id);
        return true;
    }
    await (0, pg_1.incrementCustomerOtpAttempts)(record.id);
    return false;
};
exports.verifyCustomerOtp = verifyCustomerOtp;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3RwLXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvc2VydmljZXMvb3RwLXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsb0RBQTJCO0FBRTNCLGtDQUtrQjtBQUVsQixNQUFNLFVBQVUsR0FBRyxDQUFDLENBQUE7QUFDcEIsTUFBTSxlQUFlLEdBQUcsRUFBRSxDQUFBO0FBQzFCLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxDQUFBO0FBRTFCLE1BQU0sY0FBYyxHQUFHLENBQUMsS0FBcUIsRUFBRSxFQUFFLENBQy9DLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRXBDLE1BQU0sWUFBWSxHQUFHLEdBQUcsRUFBRSxDQUN4QixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBRXpGLE1BQU0sV0FBVyxHQUFHLENBQUMsS0FBVyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUE7QUFFakQsTUFBTSxtQkFBbUIsR0FBRyxLQUFLLEVBQUUsS0FBYSxFQUFFLEVBQUU7SUFDekQsTUFBTSxlQUFlLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQzdDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUNyQixNQUFNLElBQUksS0FBSyxDQUFDLDZDQUE2QyxDQUFDLENBQUE7SUFDaEUsQ0FBQztJQUVELE1BQU0sR0FBRyxHQUFHLFlBQVksRUFBRSxDQUFBO0lBQzFCLE1BQU0sUUFBUSxHQUFHLE1BQU0sZ0JBQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7SUFDdkMsTUFBTSxTQUFTLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLGVBQWUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUE7SUFFcEUsTUFBTSxJQUFBLDRCQUF1QixFQUMzQixlQUFlLEVBQ2YsUUFBUSxFQUNSLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FDdkIsQ0FBQTtJQUVELE9BQU8sR0FBRyxDQUFBO0FBQ1osQ0FBQyxDQUFBO0FBakJZLFFBQUEsbUJBQW1CLHVCQWlCL0I7QUFFTSxNQUFNLGlCQUFpQixHQUFHLEtBQUssRUFDcEMsS0FBYSxFQUNiLEdBQVcsRUFDTyxFQUFFO0lBQ3BCLE1BQU0sZUFBZSxHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUM3QyxJQUFJLENBQUMsZUFBZSxJQUFJLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDeEQsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0lBRUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLDRCQUF1QixFQUFDLGVBQWUsQ0FBQyxDQUFBO0lBQzdELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNaLE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztJQUVELElBQUksTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3ZCLE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztJQUVELE1BQU0sU0FBUyxHQUFHLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQTtJQUM3QyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksU0FBUyxDQUFDLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDO1FBQzFFLE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztJQUVELElBQUksTUFBTSxDQUFDLFFBQVEsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3hDLE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztJQUVELElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQTtJQUNuQixJQUFJLENBQUM7UUFDSCxPQUFPLEdBQUcsTUFBTSxnQkFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ3RELENBQUM7SUFBQyxNQUFNLENBQUM7UUFDUCxPQUFPLEdBQUcsS0FBSyxDQUFBO0lBQ2pCLENBQUM7SUFFRCxJQUFJLE9BQU8sRUFBRSxDQUFDO1FBQ1osTUFBTSxJQUFBLDRCQUF1QixFQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUN4QyxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFRCxNQUFNLElBQUEsaUNBQTRCLEVBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQzdDLE9BQU8sS0FBSyxDQUFBO0FBQ2QsQ0FBQyxDQUFBO0FBekNZLFFBQUEsaUJBQWlCLHFCQXlDN0IifQ==