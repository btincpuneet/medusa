import { RedingtonSapIntegrationService } from ".."
import { RedingtonSapConfig } from "../../../models/redington-sap-config"
import { RedingtonSapSyncLog } from "../../../models/redington-sap-sync-log"

class FakeRepository<T extends { id?: string }> {
  items: T[] = []

  create(data: Partial<T>): T {
    const entity: any = {
      ...data,
    }
    if (!entity.id) {
      entity.id = `test_${this.items.length + 1}`
    }
    entity.created_at =
      entity.created_at ?? new Date().toISOString()
    entity.updated_at =
      entity.updated_at ?? new Date().toISOString()
    return entity as T
  }

  async save(entity: T): Promise<T> {
    const index = this.items.findIndex((item) => item.id === entity.id)
    if (index >= 0) {
      this.items[index] = {
        ...this.items[index],
        ...entity,
      }
    } else {
      this.items.push(entity)
    }
    return entity
  }

  async findOne() {
    return this.items[0] ?? null
  }

  async findAndCount() {
    return [this.items.slice(), this.items.length] as [T[], number]
  }
}

describe("RedingtonSapIntegrationService", () => {
  const ORIGINAL_ENV = { ...process.env }

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV }
    process.env.REDINGTON_SAP_API_URL = "https://sap.env/api"
    process.env.REDINGTON_SAP_API_CLIENT_ID = "ENV_ID"
    process.env.REDINGTON_SAP_API_CLIENT_SECRET = "ENV_SECRET"
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  const createService = () => {
    const configRepo = new FakeRepository<RedingtonSapConfig>()
    const logRepo = new FakeRepository<RedingtonSapSyncLog>()

    const manager = {
      getRepository: (entity: any) => {
        if (entity === RedingtonSapConfig) {
          return configRepo as any
        }
        if (entity === RedingtonSapSyncLog) {
          return logRepo as any
        }
        throw new Error("Unknown repository")
      },
      query: jest.fn().mockResolvedValue(undefined),
    } as any

    const orderService = {
      retrieve: jest.fn().mockResolvedValue({
        id: "order_123",
        display_id: "100001",
        email: "order@example.com",
        items: [],
        metadata: {},
      }),
      update: jest.fn(),
    } as any

    const sapClient = {
      request: jest.fn().mockResolvedValue({
        status: 200,
        data: { Status: "PASS" },
      }),
    }

    const service = new RedingtonSapIntegrationService({
      manager,
      orderService,
      sapClientFactory: () => sapClient as any,
    })

    return {
      service,
      configRepo,
      logRepo,
      sapClient,
    }
  }

  it("creates default config from env and updates values", async () => {
    const { service, configRepo, logRepo } = createService()

    const config = await service.getConfig()
    expect(config.api_url).toBe("https://sap.env/api")
    expect(config.client_id).toBe("ENV_ID")

    const updated = await service.updateConfig(
      {
        api_url: "https://sap.dev/api",
        notification_emails: ["ops@example.com", "   "],
      },
      "admin_1"
    )

    expect(updated.api_url).toBe("https://sap.dev/api")
    expect(updated.notification_emails).toEqual(["ops@example.com"])
    expect(configRepo.items).toHaveLength(1)
    expect(logRepo.items[0].message).toContain("Configuration updated")
  })

  it("tests SAP connection using the client factory", async () => {
    const { service, sapClient, logRepo } = createService()

    await service.testConnection("admin_tester")

    expect(sapClient.request).toHaveBeenCalledWith({
      method: "GET",
      url: "health",
    })
    expect(logRepo.items[0].status).toBe("success")
  })
})
