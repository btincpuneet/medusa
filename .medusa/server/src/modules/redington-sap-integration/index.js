"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSapIntegrationService = exports.RedingtonSapIntegrationService = void 0;
// @ts-nocheck
const utils_1 = require("@medusajs/framework/utils");
const typeorm_1 = require("typeorm");
const sap_client_1 = __importDefault(require("../sap-client"));
const redington_config_1 = require("../redington-config");
const redington_sap_config_1 = require("../../models/redington-sap-config");
const redington_sap_sync_log_1 = require("../../models/redington-sap-sync-log");
const normalizeString = (value) => {
    if (typeof value !== "string") {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
};
const normalizeList = (value) => {
    if (!value) {
        return [];
    }
    if (Array.isArray(value)) {
        return value
            .map((entry) => normalizeString(entry))
            .filter((entry) => entry !== null);
    }
    if (typeof value === "string") {
        return value
            .split(/[,\n]+/)
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0);
    }
    return [];
};
let sapTablesInitialized = false;
let fallbackDataSourcePromise = null;
const ensureSapTables = async (manager) => {
    if (sapTablesInitialized) {
        return;
    }
    await manager.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await manager.query(`
    CREATE TABLE IF NOT EXISTS redington_sap_config (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      api_url VARCHAR,
      client_id VARCHAR,
      client_secret VARCHAR,
      invoice_api_url VARCHAR,
      invoice_pdf_api_url VARCHAR,
      invoice_client_id VARCHAR,
      invoice_client_secret VARCHAR,
      domain_url VARCHAR,
      company_codes TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
      notification_emails TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
      updated_by VARCHAR,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
    await manager.query(`
    CREATE TABLE IF NOT EXISTS redington_sap_sync_log (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      run_type VARCHAR NOT NULL,
      order_id VARCHAR,
      sap_order_number VARCHAR,
      status VARCHAR NOT NULL DEFAULT 'pending',
      message TEXT,
      payload JSONB,
      actor_id VARCHAR,
      duration_ms INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
    sapTablesInitialized = true;
};
const sleep = (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
});
class RedingtonSapIntegrationService {
    constructor(deps) {
        this.manager = deps.manager ?? null;
        this.managerFactory = deps.managerFactory;
        this.orderService = deps.orderService;
        this.logger = deps.logger;
        this.sapClientFactory = deps.sapClientFactory ?? sap_client_1.default;
    }
    static fromScope(scope) {
        let manager;
        try {
            const resolved = scope.resolve(utils_1.ContainerRegistrationKeys.MANAGER);
            if (resolved && typeof resolved.getRepository === "function") {
                manager = resolved;
            }
        }
        catch {
            manager = undefined;
        }
        let orderService;
        try {
            orderService = scope.resolve(utils_1.Modules.ORDER, {
                allowUnregistered: true,
            });
        }
        catch {
            orderService = undefined;
        }
        if (!orderService) {
            try {
                orderService = scope.resolve("orderService", {
                    allowUnregistered: true,
                });
            }
            catch {
                orderService = undefined;
            }
        }
        if (!orderService) {
            throw new Error("Order service is not registered. Enable the @medusajs/order module or register a custom orderService.");
        }
        let logger;
        try {
            logger = scope.resolve(utils_1.ContainerRegistrationKeys.LOGGER);
        }
        catch {
            logger = undefined;
        }
        return new RedingtonSapIntegrationService({
            manager,
            managerFactory: manager === undefined
                ? async () => {
                    const ds = await getFallbackDataSource();
                    return ds.manager;
                }
                : undefined,
            orderService,
            logger,
        });
    }
    async resolveManager() {
        if (this.manager) {
            return this.manager;
        }
        if (this.managerFactory) {
            this.manager = await this.managerFactory();
            return this.manager;
        }
        throw new Error("Entity manager is not available for SAP integration.");
    }
    async configRepository() {
        const manager = await this.resolveManager();
        await ensureSapTables(manager);
        return manager.getRepository(redington_sap_config_1.RedingtonSapConfig);
    }
    async logRepository() {
        const manager = await this.resolveManager();
        await ensureSapTables(manager);
        return manager.getRepository(redington_sap_sync_log_1.RedingtonSapSyncLog);
    }
    buildDefaults() {
        const env = (0, redington_config_1.buildRedingtonConfig)();
        return {
            api_url: env.sap.apiUrl ?? null,
            client_id: env.sap.clientId ?? null,
            client_secret: env.sap.clientSecret ?? null,
            invoice_api_url: env.sap.invoiceApiUrl ?? null,
            invoice_pdf_api_url: env.sap.invoicePdfApiUrl ?? null,
            invoice_client_id: env.sap.invoiceClientId ?? env.sap.clientId ?? null,
            invoice_client_secret: env.sap.invoiceClientSecret ?? env.sap.clientSecret ?? null,
            domain_url: env.sap.domain ?? null,
            company_codes: env.sap.customerNumber
                ? [env.sap.customerNumber]
                : [],
            notification_emails: env.sap.notificationRecipients ?? [],
        };
    }
    async ensureConfig() {
        const repo = await this.configRepository();
        let config = await repo.findOne({
            where: {},
        });
        if (!config) {
            config = repo.create(this.buildDefaults());
            config = await repo.save(config);
        }
        return config;
    }
    async getConfig() {
        return this.ensureConfig();
    }
    async updateConfig(updates, actorId) {
        const repo = await this.configRepository();
        const config = await this.ensureConfig();
        const payload = {
            api_url: updates.api_url !== undefined
                ? normalizeString(updates.api_url)
                : config.api_url,
            client_id: updates.client_id !== undefined
                ? normalizeString(updates.client_id)
                : config.client_id,
            client_secret: updates.client_secret !== undefined
                ? normalizeString(updates.client_secret)
                : config.client_secret,
            invoice_api_url: updates.invoice_api_url !== undefined
                ? normalizeString(updates.invoice_api_url)
                : config.invoice_api_url,
            invoice_pdf_api_url: updates.invoice_pdf_api_url !== undefined
                ? normalizeString(updates.invoice_pdf_api_url)
                : config.invoice_pdf_api_url,
            invoice_client_id: updates.invoice_client_id !== undefined
                ? normalizeString(updates.invoice_client_id)
                : config.invoice_client_id,
            invoice_client_secret: updates.invoice_client_secret !== undefined
                ? normalizeString(updates.invoice_client_secret)
                : config.invoice_client_secret,
            domain_url: updates.domain_url !== undefined
                ? normalizeString(updates.domain_url)
                : config.domain_url,
            company_codes: updates.company_codes !== undefined
                ? normalizeList(updates.company_codes)
                : config.company_codes ?? [],
            notification_emails: updates.notification_emails !== undefined
                ? normalizeList(updates.notification_emails)
                : config.notification_emails ?? [],
            updated_by: actorId,
        };
        Object.assign(config, payload);
        const saved = await repo.save(config);
        const logRepo = await this.logRepository();
        await logRepo.save(logRepo.create({
            run_type: "manual",
            status: "success",
            message: `Configuration updated by ${actorId}`,
            actor_id: actorId,
        }));
        return saved;
    }
    buildSapClient(config, overrides = {}) {
        return this.sapClientFactory?.({
            config: {
                apiUrl: config.api_url ?? "",
                clientId: config.client_id ?? "",
                clientSecret: config.client_secret ?? "",
                invoiceApiUrl: config.invoice_api_url ?? "",
                invoicePdfApiUrl: config.invoice_pdf_api_url ?? "",
                invoiceClientId: config.invoice_client_id ?? config.client_id ?? "",
                invoiceClientSecret: config.invoice_client_secret ?? config.client_secret ?? "",
                ...overrides,
            },
        });
    }
    async withRetries(fn, attempts = 3, delayMs = 500) {
        let lastError;
        for (let attempt = 1; attempt <= attempts; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                if (attempt < attempts) {
                    await sleep(delayMs * attempt);
                    continue;
                }
            }
        }
        throw lastError;
    }
    async testConnection(actorId) {
        const config = await this.ensureConfig();
        const client = this.buildSapClient(config);
        const startedAt = Date.now();
        try {
            const response = await this.withRetries(() => client.request({
                method: "GET",
                url: "health",
            }));
            const latency = Date.now() - startedAt;
            const logRepo = await this.logRepository();
            await logRepo.save(logRepo.create({
                run_type: "test",
                status: "success",
                message: `Health check succeeded (${response.status})`,
                actor_id: actorId,
                duration_ms: latency,
            }));
            return {
                ok: true,
                latency_ms: latency,
                status: response.status,
            };
        }
        catch (error) {
            const latency = Date.now() - startedAt;
            const message = error instanceof Error ? error.message : "Unknown SAP error";
            const logRepo = await this.logRepository();
            await logRepo.save(logRepo.create({
                run_type: "test",
                status: "failed",
                message,
                actor_id: actorId,
                duration_ms: latency,
            }));
            throw error;
        }
    }
    buildOrderPayload(order, config) {
        const companyCode = order?.metadata?.company_code ??
            config.company_codes?.[0] ??
            config.domain_url ??
            "";
        const distributionChannel = order?.metadata?.distribution_channel ?? "10";
        const billingAddress = order?.billing_address ?? {};
        const items = Array.isArray(order?.items) && order.items.length
            ? order.items.map((item, index) => ({
                Itm_Number: item.id ?? index + 1,
                Material: item.sku ?? item.variant?.sku ?? "",
                Target_Qty: item.quantity ?? 0,
                Unit_Price: item.unit_price ?? 0,
            }))
            : [];
        return {
            Header: {
                Sales_Org: companyCode,
                Distr_Chan: distributionChannel,
                Purch_No: order.display_id ?? order.id,
                Soldto: order?.customer?.metadata?.sap_customer_code ??
                    order.customer_id,
                Shipto: order?.shipping_address?.metadata?.sap_customer_code ??
                    order.customer_id,
                Enduser: order.email,
                City: billingAddress.city ?? "",
                Country: billingAddress.country_code ?? billingAddress.country ?? "",
                PostalCode: billingAddress.postal_code ?? "",
                Mobileno: billingAddress.phone ?? "",
                PortalId: "MEDUSA",
                TransactionId: order.id,
            },
            Items: items,
        };
    }
    extractSapOrderNumber(response) {
        if (!response) {
            return null;
        }
        if (typeof response === "string") {
            return response.length ? response : null;
        }
        if (typeof response.OrderNo === "string" && response.OrderNo.length) {
            return response.OrderNo;
        }
        if (response.data &&
            typeof response.data.OrderNo === "string" &&
            response.data.OrderNo.length) {
            return response.data.OrderNo;
        }
        return null;
    }
    async persistSapOrderNumber(orderId, sapOrderNumber) {
        const order = await this.orderService.retrieve(orderId, {
            relations: [],
        });
        const metadata = {
            ...(order.metadata ?? {}),
            sap_order_numbers: sapOrderNumber,
            sap_synced_at: new Date().toISOString(),
        };
        await this.orderService.update(orderId, { metadata });
    }
    async saveLog(log) {
        const repo = await this.logRepository();
        return repo.save(log);
    }
    async createLog(data) {
        const repo = await this.logRepository();
        const log = repo.create(data);
        return repo.save(log);
    }
    async triggerOrderSync({ orderId, actorId, runType, }) {
        const config = await this.ensureConfig();
        const client = this.buildSapClient(config);
        const order = await this.orderService.retrieve(orderId, {
            relations: [
                "items",
                "items.variant",
                "shipping_address",
                "billing_address",
                "customer",
            ],
        });
        const payload = this.buildOrderPayload(order, config);
        const log = await this.createLog({
            run_type: runType,
            order_id: orderId,
            status: "pending",
            actor_id: actorId,
            payload,
        });
        const started = Date.now();
        try {
            const response = await this.withRetries(() => client.request({
                method: "POST",
                url: "CreateOrder",
                data: payload,
            }));
            const sapOrderNumber = this.extractSapOrderNumber(response.data);
            if (sapOrderNumber) {
                await this.persistSapOrderNumber(orderId, sapOrderNumber);
            }
            log.status = "success";
            log.sap_order_number = sapOrderNumber ?? null;
            log.message = sapOrderNumber
                ? `Created SAP order ${sapOrderNumber}`
                : "Order synced with SAP";
            log.duration_ms = Date.now() - started;
            await this.saveLog(log);
            return log;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "SAP order sync failed";
            log.status = "failed";
            log.message = message;
            log.duration_ms = Date.now() - started;
            await this.saveLog(log);
            this.logger?.error?.("redington-sap", "order-sync", orderId, message);
            throw error;
        }
    }
    async triggerStockSync({ actorId, runType, }) {
        const config = await this.ensureConfig();
        const client = this.buildSapClient(config);
        const log = await this.createLog({
            run_type: runType,
            status: "pending",
            actor_id: actorId,
        });
        const started = Date.now();
        try {
            const response = await this.withRetries(() => client.request({
                method: "POST",
                url: "SystemATP",
                data: {
                    Im_Application: "B2C",
                    Im_Indicator: "",
                    Status: "GETALL",
                    ATPItems: [
                        {
                            Mandt: "",
                            Companycode: "",
                            Material: "",
                            Atpqty: "",
                            Atp_Updatetime: 0,
                        },
                    ],
                },
            }));
            const items = Array.isArray(response.data?.ATPItems)
                ? response.data.ATPItems
                : [];
            log.status = "success";
            log.message = `Fetched ${items.length} ATP entries`;
            log.duration_ms = Date.now() - started;
            await this.saveLog(log);
            return log;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "SAP stock sync failed";
            log.status = "failed";
            log.message = message;
            log.duration_ms = Date.now() - started;
            await this.saveLog(log);
            this.logger?.error?.("redington-sap", "stock-sync", message);
            throw error;
        }
    }
    async triggerSync(args) {
        if (args.orderId) {
            return this.triggerOrderSync({
                ...args,
                orderId: args.orderId,
            });
        }
        return this.triggerStockSync(args);
    }
    async listLogs(limit = 20, offset = 0) {
        const repo = await this.logRepository();
        const [logs, count] = await repo.findAndCount({
            order: { created_at: "DESC" },
            take: limit,
            skip: offset,
        });
        return { logs, count };
    }
}
exports.RedingtonSapIntegrationService = RedingtonSapIntegrationService;
const resolveSapIntegrationService = (scope) => RedingtonSapIntegrationService.fromScope(scope);
exports.resolveSapIntegrationService = resolveSapIntegrationService;
async function getFallbackDataSource() {
    if (fallbackDataSourcePromise) {
        return fallbackDataSourcePromise;
    }
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error("DATABASE_URL must be defined to initialize SAP integration storage.");
    }
    fallbackDataSourcePromise = (async () => {
        const dataSource = new typeorm_1.DataSource({
            type: "postgres",
            url,
            entities: [redington_sap_config_1.RedingtonSapConfig, redington_sap_sync_log_1.RedingtonSapSyncLog],
            synchronize: false,
        });
        await dataSource.initialize();
        await ensureSapTables(dataSource.manager);
        return dataSource;
    })();
    return fallbackDataSourcePromise;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9yZWRpbmd0b24tc2FwLWludGVncmF0aW9uL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGNBQWM7QUFDZCxxREFBOEU7QUFHOUUscUNBQW9DO0FBSXBDLCtEQUEwRDtBQUMxRCwwREFBMEQ7QUFDMUQsNEVBQXNFO0FBQ3RFLGdGQUF5RTtBQW9CekUsTUFBTSxlQUFlLEdBQUcsQ0FBQyxLQUFjLEVBQWlCLEVBQUU7SUFDeEQsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztRQUM5QixPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFDRCxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDNUIsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQTtBQUN4QyxDQUFDLENBQUE7QUFFRCxNQUFNLGFBQWEsR0FBRyxDQUFDLEtBQWMsRUFBWSxFQUFFO0lBQ2pELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNYLE9BQU8sRUFBRSxDQUFBO0lBQ1gsQ0FBQztJQUNELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ3pCLE9BQU8sS0FBSzthQUNULEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3RDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBbUIsRUFBRSxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsQ0FBQTtJQUN2RCxDQUFDO0lBQ0QsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztRQUM5QixPQUFPLEtBQUs7YUFDVCxLQUFLLENBQUMsUUFBUSxDQUFDO2FBQ2YsR0FBRyxDQUFDLENBQUMsS0FB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