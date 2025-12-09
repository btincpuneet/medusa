"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUT = exports.GET = void 0;
const redington_sap_integration_1 = require("../../../../modules/redington-sap-integration");
const toPlainConfig = (config) => ({
    id: config.id,
    api_url: config.api_url,
    client_id: config.client_id,
    client_secret: config.client_secret,
    invoice_api_url: config.invoice_api_url,
    invoice_pdf_api_url: config.invoice_pdf_api_url,
    invoice_client_id: config.invoice_client_id,
    invoice_client_secret: config.invoice_client_secret,
    domain_url: config.domain_url,
    company_codes: config.company_codes ?? [],
    notification_emails: config.notification_emails ?? [],
    updated_by: config.updated_by,
    created_at: config.created_at instanceof Date
        ? config.created_at.toISOString()
        : config.created_at,
    updated_at: config.updated_at instanceof Date
        ? config.updated_at.toISOString()
        : config.updated_at,
});
const toPlainLog = (log) => ({
    id: log.id,
    run_type: log.run_type,
    order_id: log.order_id,
    sap_order_number: log.sap_order_number,
    status: log.status,
    message: log.message,
    actor_id: log.actor_id,
    duration_ms: log.duration_ms,
    payload: log.payload,
    created_at: log.created_at instanceof Date
        ? log.created_at.toISOString()
        : log.created_at,
    updated_at: log.updated_at instanceof Date
        ? log.updated_at.toISOString()
        : log.updated_at,
});
const parseNumber = (value, fallback) => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim().length) {
        const parsed = Number.parseInt(value.trim(), 10);
        return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
};
const GET = async (req, res) => {
    const service = (0, redington_sap_integration_1.resolveSapIntegrationService)(req.scope);
    const limit = parseNumber(req.query.limit, 20);
    const offset = parseNumber(req.query.offset, 0);
    const [config, logsResult] = await Promise.all([
        service.getConfig(),
        service.listLogs(limit, offset),
    ]);
    return res.json({
        config: toPlainConfig(config),
        logs: logsResult.logs.map(toPlainLog),
        count: logsResult.count,
    });
};
exports.GET = GET;
const PUT = async (req, res) => {
    const service = (0, redington_sap_integration_1.resolveSapIntegrationService)(req.scope);
    const actorId = req.auth_user?.id ??
        req.user?.id ??
        "admin:redington-sap";
    const updates = req.body ?? {};
    const config = await service.updateConfig(updates, actorId);
    return res.json({
        config: toPlainConfig(config),
    });
};
exports.PUT = PUT;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9zYXAtaW50ZWdyYXRpb24vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBS0EsNkZBQTRGO0FBRTVGLE1BQU0sYUFBYSxHQUFHLENBQUMsTUFBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3RDLEVBQUUsRUFBRSxNQUFNLENBQUMsRUFBRTtJQUNiLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTztJQUN2QixTQUFTLEVBQUUsTUFBTSxDQUFDLFNBQVM7SUFDM0IsYUFBYSxFQUFFLE1BQU0sQ0FBQyxhQUFhO0lBQ25DLGVBQWUsRUFBRSxNQUFNLENBQUMsZUFBZTtJQUN2QyxtQkFBbUIsRUFBRSxNQUFNLENBQUMsbUJBQW1CO0lBQy9DLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxpQkFBaUI7SUFDM0MscUJBQXFCLEVBQUUsTUFBTSxDQUFDLHFCQUFxQjtJQUNuRCxVQUFVLEVBQUUsTUFBTSxDQUFDLFVBQVU7SUFDN0IsYUFBYSxFQUFFLE1BQU0sQ0FBQyxhQUFhLElBQUksRUFBRTtJQUN6QyxtQkFBbUIsRUFBRSxNQUFNLENBQUMsbUJBQW1CLElBQUksRUFBRTtJQUNyRCxVQUFVLEVBQUUsTUFBTSxDQUFDLFVBQVU7SUFDN0IsVUFBVSxFQUNSLE1BQU0sQ0FBQyxVQUFVLFlBQVksSUFBSTtRQUMvQixDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxXQUFXLEVBQUU7UUFDakMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVO0lBQ3ZCLFVBQVUsRUFDUixNQUFNLENBQUMsVUFBVSxZQUFZLElBQUk7UUFDL0IsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsV0FBVyxFQUFFO1FBQ2pDLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVTtDQUN4QixDQUFDLENBQUE7QUFFRixNQUFNLFVBQVUsR0FBRyxD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