import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import type { AwilixContainer } from "awilix"
import { DataSource } from "typeorm"
import type { EntityManager, Repository } from "typeorm"
import OrderService from "@medusajs/order/dist/services/order-service"

import createSapClient, { SapClient } from "../sap-client"
import { buildRedingtonConfig } from "../redington-config"
import { RedingtonSapConfig } from "../../models/redington-sap-config"
import { RedingtonSapSyncLog } from "../../models/redington-sap-sync-log"

type SapServiceDeps = {
  manager?: EntityManager
  managerFactory?: () => Promise<EntityManager>
  orderService: OrderService
  logger?: {
    info: (...args: any[]) => void
    warn: (...args: any[]) => void
    error: (...args: any[]) => void
  }
  sapClientFactory?: (options?: Parameters<typeof createSapClient>[0]) => SapClient
}

type SyncRunArgs = {
  orderId?: string | null
  actorId: string
  runType: "manual" | "automatic"
}

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const normalizeList = (value: unknown): string[] => {
  if (!value) {
    return []
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeString(entry))
      .filter((entry): entry is string => entry !== null)
  }
  if (typeof value === "string") {
    return value
      .split(/[,\n]+/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
  }
  return []
}

let sapTablesInitialized = false
let fallbackDataSourcePromise: Promise<DataSource> | null = null

const ensureSapTables = async (manager: EntityManager) => {
  if (sapTablesInitialized) {
    return
  }

  await manager.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`)

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
  `)

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
  `)

  sapTablesInitialized = true
}

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export class RedingtonSapIntegrationService {
  private manager: EntityManager | null
  private readonly managerFactory?: () => Promise<EntityManager>
  private readonly orderService: OrderService
  private readonly logger?: SapServiceDeps["logger"]
  private readonly sapClientFactory: SapServiceDeps["sapClientFactory"]

  constructor(deps: SapServiceDeps) {
    this.manager = deps.manager ?? null
    this.managerFactory = deps.managerFactory
    this.orderService = deps.orderService
    this.logger = deps.logger
    this.sapClientFactory = deps.sapClientFactory ?? createSapClient
  }

  static fromScope(scope: MedusaContainer | AwilixContainer) {
    let manager: EntityManager | undefined
    try {
      const resolved = scope.resolve(
        ContainerRegistrationKeys.MANAGER
      ) as any
      if (resolved && typeof resolved.getRepository === "function") {
        manager = resolved as EntityManager
      }
    } catch {
      manager = undefined
    }

    let orderService: OrderService | undefined
    try {
      orderService = scope.resolve(Modules.ORDER, {
        allowUnregistered: true,
      }) as OrderService
    } catch {
      orderService = undefined
    }

    if (!orderService) {
      try {
        orderService = scope.resolve("orderService", {
          allowUnregistered: true,
        }) as OrderService
      } catch {
        orderService = undefined
      }
    }

    if (!orderService) {
      throw new Error(
        "Order service is not registered. Enable the @medusajs/order module or register a custom orderService."
      )
    }

    let logger: SapServiceDeps["logger"] | undefined
    try {
      logger = scope.resolve(
        ContainerRegistrationKeys.LOGGER
      ) as SapServiceDeps["logger"]
    } catch {
      logger = undefined
    }

    return new RedingtonSapIntegrationService({
      manager,
      managerFactory:
        manager === undefined
          ? async () => {
              const ds = await getFallbackDataSource()
              return ds.manager
            }
          : undefined,
      orderService,
      logger,
    })
  }

  private async resolveManager(): Promise<EntityManager> {
    if (this.manager) {
      return this.manager
    }
    if (this.managerFactory) {
      this.manager = await this.managerFactory()
      return this.manager
    }
    throw new Error(
      "Entity manager is not available for SAP integration."
    )
  }

  private async configRepository(): Promise<
    Repository<RedingtonSapConfig>
  > {
    const manager = await this.resolveManager()
    await ensureSapTables(manager)
    return manager.getRepository(RedingtonSapConfig)
  }

  private async logRepository(): Promise<
    Repository<RedingtonSapSyncLog>
  > {
    const manager = await this.resolveManager()
    await ensureSapTables(manager)
    return manager.getRepository(RedingtonSapSyncLog)
  }

  private buildDefaults(): Partial<RedingtonSapConfig> {
    const env = buildRedingtonConfig()
    return {
      api_url: env.sap.apiUrl ?? null,
      client_id: env.sap.clientId ?? null,
      client_secret: env.sap.clientSecret ?? null,
      invoice_api_url: env.sap.invoiceApiUrl ?? null,
      invoice_pdf_api_url: env.sap.invoicePdfApiUrl ?? null,
      invoice_client_id:
        env.sap.invoiceClientId ?? env.sap.clientId ?? null,
      invoice_client_secret:
        env.sap.invoiceClientSecret ?? env.sap.clientSecret ?? null,
      domain_url: env.sap.domain ?? null,
      company_codes: env.sap.customerNumber
        ? [env.sap.customerNumber]
        : [],
      notification_emails: env.sap.notificationRecipients ?? [],
    }
  }

  private async ensureConfig(): Promise<RedingtonSapConfig> {
    const repo = await this.configRepository()
    let config = await repo.findOne({
      where: {},
    })

    if (!config) {
      config = repo.create(this.buildDefaults())
      config = await repo.save(config)
    }

    return config
  }

  async getConfig(): Promise<RedingtonSapConfig> {
    return this.ensureConfig()
  }

  async updateConfig(
    updates: Partial<RedingtonSapConfig>,
    actorId: string
  ): Promise<RedingtonSapConfig> {
    const repo = await this.configRepository()
    const config = await this.ensureConfig()

    const payload: Partial<RedingtonSapConfig> = {
      api_url:
        updates.api_url !== undefined
          ? normalizeString(updates.api_url)
          : config.api_url,
      client_id:
        updates.client_id !== undefined
          ? normalizeString(updates.client_id)
          : config.client_id,
      client_secret:
        updates.client_secret !== undefined
          ? normalizeString(updates.client_secret)
          : config.client_secret,
      invoice_api_url:
        updates.invoice_api_url !== undefined
          ? normalizeString(updates.invoice_api_url)
          : config.invoice_api_url,
      invoice_pdf_api_url:
        updates.invoice_pdf_api_url !== undefined
          ? normalizeString(updates.invoice_pdf_api_url)
          : config.invoice_pdf_api_url,
      invoice_client_id:
        updates.invoice_client_id !== undefined
          ? normalizeString(updates.invoice_client_id)
          : config.invoice_client_id,
      invoice_client_secret:
        updates.invoice_client_secret !== undefined
          ? normalizeString(updates.invoice_client_secret)
          : config.invoice_client_secret,
      domain_url:
        updates.domain_url !== undefined
          ? normalizeString(updates.domain_url)
          : config.domain_url,
      company_codes:
        updates.company_codes !== undefined
          ? normalizeList(updates.company_codes)
          : config.company_codes ?? [],
      notification_emails:
        updates.notification_emails !== undefined
          ? normalizeList(updates.notification_emails)
          : config.notification_emails ?? [],
      updated_by: actorId,
    }

    Object.assign(config, payload)
    const saved = await repo.save(config)

    const logRepo = await this.logRepository()
    await logRepo.save(
      logRepo.create({
        run_type: "manual",
        status: "success",
        message: `Configuration updated by ${actorId}`,
        actor_id: actorId,
      })
    )

    return saved
  }

  private buildSapClient(
    config: RedingtonSapConfig,
    overrides: Partial<Parameters<typeof createSapClient>[0]["config"]> = {}
  ): SapClient {
    return this.sapClientFactory?.({
      config: {
        apiUrl: config.api_url ?? "",
        clientId: config.client_id ?? "",
        clientSecret: config.client_secret ?? "",
        invoiceApiUrl: config.invoice_api_url ?? "",
        invoicePdfApiUrl: config.invoice_pdf_api_url ?? "",
        invoiceClientId: config.invoice_client_id ?? config.client_id ?? "",
        invoiceClientSecret:
          config.invoice_client_secret ?? config.client_secret ?? "",
        ...overrides,
      },
    })
  }

  private async withRetries<T>(
    fn: () => Promise<T>,
    attempts = 3,
    delayMs = 500
  ): Promise<T> {
    let lastError: unknown
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        if (attempt < attempts) {
          await sleep(delayMs * attempt)
          continue
        }
      }
    }
    throw lastError
  }

  async testConnection(actorId: string) {
    const config = await this.ensureConfig()
    const client = this.buildSapClient(config)
    const startedAt = Date.now()

    try {
      const response = await this.withRetries(() =>
        client.request({
          method: "GET",
          url: "health",
        })
      )

      const latency = Date.now() - startedAt
      const logRepo = await this.logRepository()
      await logRepo.save(
        logRepo.create({
          run_type: "test",
          status: "success",
          message: `Health check succeeded (${response.status})`,
          actor_id: actorId,
          duration_ms: latency,
        })
      )

      return {
        ok: true,
        latency_ms: latency,
        status: response.status,
      }
    } catch (error) {
      const latency = Date.now() - startedAt
      const message =
        error instanceof Error ? error.message : "Unknown SAP error"

      const logRepo = await this.logRepository()
      await logRepo.save(
        logRepo.create({
          run_type: "test",
          status: "failed",
          message,
          actor_id: actorId,
          duration_ms: latency,
        })
      )

      throw error
    }
  }

  private buildOrderPayload(
    order: any,
    config: RedingtonSapConfig
  ): Record<string, unknown> {
    const companyCode =
      order?.metadata?.company_code ??
      config.company_codes?.[0] ??
      config.domain_url ??
      ""
    const distributionChannel =
      order?.metadata?.distribution_channel ?? "10"
    const billingAddress = order?.billing_address ?? {}

    const items =
      Array.isArray(order?.items) && order.items.length
        ? order.items.map((item: any, index: number) => ({
            Itm_Number: item.id ?? index + 1,
            Material: item.sku ?? item.variant?.sku ?? "",
            Target_Qty: item.quantity ?? 0,
            Unit_Price: item.unit_price ?? 0,
          }))
        : []

    return {
      Header: {
        Sales_Org: companyCode,
        Distr_Chan: distributionChannel,
        Purch_No: order.display_id ?? order.id,
        Soldto:
          order?.customer?.metadata?.sap_customer_code ??
          order.customer_id,
        Shipto:
          order?.shipping_address?.metadata?.sap_customer_code ??
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
    }
  }

  private extractSapOrderNumber(response: any): string | null {
    if (!response) {
      return null
    }
    if (typeof response === "string") {
      return response.length ? response : null
    }
    if (typeof response.OrderNo === "string" && response.OrderNo.length) {
      return response.OrderNo
    }
    if (
      response.data &&
      typeof response.data.OrderNo === "string" &&
      response.data.OrderNo.length
    ) {
      return response.data.OrderNo
    }
    return null
  }

  private async persistSapOrderNumber(
    orderId: string,
    sapOrderNumber: string
  ) {
    const order = await this.orderService.retrieve(orderId, {
      relations: [],
    })
    const metadata = {
      ...(order.metadata ?? {}),
      sap_order_numbers: sapOrderNumber,
      sap_synced_at: new Date().toISOString(),
    }
    await this.orderService.update(orderId, { metadata })
  }

  private async saveLog(log: RedingtonSapSyncLog) {
    const repo = await this.logRepository()
    return repo.save(log)
  }

  private async createLog(
    data: Partial<RedingtonSapSyncLog>
  ): Promise<RedingtonSapSyncLog> {
    const repo = await this.logRepository()
    const log = repo.create(data)
    return repo.save(log)
  }

  private async triggerOrderSync({
    orderId,
    actorId,
    runType,
  }: SyncRunArgs & { orderId: string }) {
    const config = await this.ensureConfig()
    const client = this.buildSapClient(config)
    const order = await this.orderService.retrieve(orderId, {
      relations: [
        "items",
        "items.variant",
        "shipping_address",
        "billing_address",
        "customer",
      ],
    })

    const payload = this.buildOrderPayload(order, config)
    const log = await this.createLog({
      run_type: runType,
      order_id: orderId,
      status: "pending",
      actor_id: actorId,
      payload,
    })

    const started = Date.now()
    try {
      const response = await this.withRetries(() =>
        client.request({
          method: "POST",
          url: "CreateOrder",
          data: payload,
        })
      )

      const sapOrderNumber = this.extractSapOrderNumber(response.data)
      if (sapOrderNumber) {
        await this.persistSapOrderNumber(orderId, sapOrderNumber)
      }

      log.status = "success"
      log.sap_order_number = sapOrderNumber ?? null
      log.message = sapOrderNumber
        ? `Created SAP order ${sapOrderNumber}`
        : "Order synced with SAP"
      log.duration_ms = Date.now() - started
      await this.saveLog(log)
      return log
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "SAP order sync failed"
      log.status = "failed"
      log.message = message
      log.duration_ms = Date.now() - started
      await this.saveLog(log)
      this.logger?.error?.(
        "redington-sap",
        "order-sync",
        orderId,
        message
      )
      throw error
    }
  }

  private async triggerStockSync({
    actorId,
    runType,
  }: Omit<SyncRunArgs, "orderId">) {
    const config = await this.ensureConfig()
    const client = this.buildSapClient(config)
    const log = await this.createLog({
      run_type: runType,
      status: "pending",
      actor_id: actorId,
    })
    const started = Date.now()

    try {
      const response = await this.withRetries(() =>
        client.request({
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
        })
      )

      const items = Array.isArray(response.data?.ATPItems)
        ? response.data.ATPItems
        : []

      log.status = "success"
      log.message = `Fetched ${items.length} ATP entries`
      log.duration_ms = Date.now() - started
      await this.saveLog(log)
      return log
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "SAP stock sync failed"
      log.status = "failed"
      log.message = message
      log.duration_ms = Date.now() - started
      await this.saveLog(log)
      this.logger?.error?.("redington-sap", "stock-sync", message)
      throw error
    }
  }

  async triggerSync(args: SyncRunArgs) {
    if (args.orderId) {
      return this.triggerOrderSync({
        ...args,
        orderId: args.orderId,
      } as SyncRunArgs & { orderId: string })
    }

    return this.triggerStockSync(args)
  }

  async listLogs(limit = 20, offset = 0) {
    const repo = await this.logRepository()
    const [logs, count] = await repo.findAndCount({
      order: { created_at: "DESC" },
      take: limit,
      skip: offset,
    })
    return { logs, count }
  }
}

export const resolveSapIntegrationService = (
  scope: MedusaContainer | AwilixContainer
) => RedingtonSapIntegrationService.fromScope(scope)

async function getFallbackDataSource(): Promise<DataSource> {
  if (fallbackDataSourcePromise) {
    return fallbackDataSourcePromise
  }

  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      "DATABASE_URL must be defined to initialize SAP integration storage."
    )
  }

  fallbackDataSourcePromise = (async () => {
    const dataSource = new DataSource({
      type: "postgres",
      url,
      entities: [RedingtonSapConfig, RedingtonSapSyncLog],
      synchronize: false,
    })
    await dataSource.initialize()
    await ensureSapTables(dataSource.manager)
    return dataSource
  })()

  return fallbackDataSourcePromise
}
