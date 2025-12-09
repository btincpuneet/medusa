"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
const pg_1 = require("../../../../lib/pg");
const normalizeRequired = (value, field) => {
    if (typeof value !== "string" || !value.trim()) {
        throw new Error(`"${field}" is required`);
    }
    return value.trim();
};
async function POST(req, res) {
    await (0, pg_1.ensureRedingtonGetInTouchTable)();
    const body = (req.body || {});
    let name;
    let email;
    let mobileNumber;
    try {
        name = normalizeRequired(body.name, "name");
        email = normalizeRequired(body.email, "email");
        mobileNumber = normalizeRequired(body.mobile_number, "mobile_number");
    }
    catch (error) {
        return res.status(400).json({
            message: error instanceof Error ? error.message : String(error),
        });
    }
    const { rows } = await (0, pg_1.getPgPool)().query(`
      INSERT INTO redington_get_in_touch (
        name,
        email,
        mobile_number,
        company_name,
        enquiry_type,
        enquiry_details
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
        name,
        email,
        mobileNumber,
        body.company_name ?? null,
        body.enquiry_type ?? null,
        body.enquiry_details ?? null,
    ]);
    const record = (0, pg_1.mapGetInTouchRow)(rows[0]);
    await dispatchNotifications(req, {
        ...record,
        enquiry_type: record.enquiry_type ?? undefined,
        enquiry_details: record.enquiry_details ?? undefined,
    });
    return res.status(201).json({
        enquiry: record,
    });
}
async function dispatchNotifications(req, payload) {
    let recipients = [];
    try {
        const configured = (await (0, pg_1.getRedingtonSetting)("get_in_touch.email_recipients")) ?? {};
        if (Array.isArray(configured.recipients)) {
            recipients = configured.recipients.filter((entry) => !!entry);
        }
        else if (typeof configured.recipients === "string") {
            recipients = configured.recipients
                .split(",")
                .map((entry) => entry.trim())
                .filter(Boolean);
        }
    }
    catch (error) {
        // ignore – we'll fall back to env/config below
    }
    if (!recipients.length && process.env.GET_IN_TOUCH_RECIPIENTS) {
        recipients = process.env.GET_IN_TOUCH_RECIPIENTS.split(",")
            .map((entry) => entry.trim())
            .filter(Boolean);
    }
    if (!recipients.length) {
        return;
    }
    let notificationModule = null;
    try {
        notificationModule = req.scope.resolve(utils_1.Modules.NOTIFICATION);
    }
    catch (_) {
        // notification module not registered
    }
    if (!notificationModule?.createNotifications) {
        logWarning(req, "Notification module is not configured; skipping email send.");
        return;
    }
    try {
        await notificationModule.createNotifications(recipients.map((recipient) => ({
            to: recipient,
            channel: "email",
            template: "redington-get-in-touch",
            trigger_type: "redington.get_in_touch",
            resource_type: "get_in_touch",
            resource_id: String(payload.id),
            data: {
                name: payload.name,
                email: payload.email,
                mobile_number: payload.mobile_number,
                company_name: payload.company_name,
                enquiry_type: payload.enquiry_type,
                enquiry_details: payload.enquiry_details,
            },
        })));
    }
    catch (error) {
        logWarning(req, `Failed to dispatch Get-In-Touch notifications: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function logWarning(req, message) {
    try {
        const logger = req.scope.resolve(utils_1.ContainerRegistrationKeys.LOGGER);
        logger?.warn?.(message);
    }
    catch (_) {
        // ignore logging errors
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3JlZGluZ3Rvbi9nZXQtaW4tdG91Y2gvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUEwQkEsb0JBcURDO0FBOUVELHFEQUE4RTtBQUU5RSwyQ0FLMkI7QUFXM0IsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLEtBQWMsRUFBRSxLQUFhLEVBQUUsRUFBRTtJQUMxRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDO1FBQy9DLE1BQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLGVBQWUsQ0FBQyxDQUFBO0lBQzNDLENBQUM7SUFDRCxPQUFPLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQTtBQUNyQixDQUFDLENBQUE7QUFFTSxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsTUFBTSxJQUFBLG1DQUE4QixHQUFFLENBQUE7SUFFdEMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBbUIsQ0FBQTtJQUUvQyxJQUFJLElBQVksQ0FBQTtJQUNoQixJQUFJLEtBQWEsQ0FBQTtJQUNqQixJQUFJLFlBQW9CLENBQUE7SUFFeEIsSUFBSSxDQUFDO1FBQ0gsSUFBSSxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFDM0MsS0FBSyxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDOUMsWUFBWSxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsZUFBZSxDQUFDLENBQUE7SUFDdkUsQ0FBQztJQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7UUFDcEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFD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