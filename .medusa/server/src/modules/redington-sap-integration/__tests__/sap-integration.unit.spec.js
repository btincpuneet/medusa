"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const redington_sap_config_1 = require("../../../models/redington-sap-config");
const redington_sap_sync_log_1 = require("../../../models/redington-sap-sync-log");
class FakeRepository {
    constructor() {
        this.items = [];
    }
    create(data) {
        const entity = {
            ...data,
        };
        if (!entity.id) {
            entity.id = `test_${this.items.length + 1}`;
        }
        entity.created_at =
            entity.created_at ?? new Date().toISOString();
        entity.updated_at =
            entity.updated_at ?? new Date().toISOString();
        return entity;
    }
    async save(entity) {
        const index = this.items.findIndex((item) => item.id === entity.id);
        if (index >= 0) {
            this.items[index] = {
                ...this.items[index],
                ...entity,
            };
        }
        else {
            this.items.push(entity);
        }
        return entity;
    }
    async findOne() {
        return this.items[0] ?? null;
    }
    async findAndCount() {
        return [this.items.slice(), this.items.length];
    }
}
describe("RedingtonSapIntegrationService", () => {
    const ORIGINAL_ENV = { ...process.env };
    beforeEach(() => {
        jest.resetModules();
        process.env = { ...ORIGINAL_ENV };
        process.env.REDINGTON_SAP_API_URL = "https://sap.env/api";
        process.env.REDINGTON_SAP_API_CLIENT_ID = "ENV_ID";
        process.env.REDINGTON_SAP_API_CLIENT_SECRET = "ENV_SECRET";
    });
    afterAll(() => {
        process.env = ORIGINAL_ENV;
    });
    const createService = () => {
        const configRepo = new FakeRepository();
        const logRepo = new FakeRepository();
        const manager = {
            getRepository: (entity) => {
                if (entity === redington_sap_config_1.RedingtonSapConfig) {
                    return configRepo;
                }
                if (entity === redington_sap_sync_log_1.RedingtonSapSyncLog) {
                    return logRepo;
                }
                throw new Error("Unknown repository");
            },
            query: jest.fn().mockResolvedValue(undefined),
        };
        const orderService = {
            retrieve: jest.fn().mockResolvedValue({
                id: "order_123",
                display_id: "100001",
                email: "order@example.com",
                items: [],
                metadata: {},
            }),
            update: jest.fn(),
        };
        const sapClient = {
            request: jest.fn().mockResolvedValue({
                status: 200,
                data: { Status: "PASS" },
            }),
        };
        const service = new __1.RedingtonSapIntegrationService({
            manager,
            orderService,
            sapClientFactory: () => sapClient,
        });
        return {
            service,
            configRepo,
            logRepo,
            sapClient,
        };
    };
    it("creates default config from env and updates values", async () => {
        const { service, configRepo, logRepo } = createService();
        const config = await service.getConfig();
        expect(config.api_url).toBe("https://sap.env/api");
        expect(config.client_id).toBe("ENV_ID");
        const updated = await service.updateConfig({
            api_url: "https://sap.dev/api",
            notification_emails: ["ops@example.com", "   "],
        }, "admin_1");
        expect(updated.api_url).toBe("https://sap.dev/api");
        expect(updated.notification_emails).toEqual(["ops@example.com"]);
        expect(configRepo.items).toHaveLength(1);
        expect(logRepo.items[0].message).toContain("Configuration updated");
    });
    it("tests SAP connection using the client factory", async () => {
        const { service, sapClient, logRepo } = createService();
        await service.testConnection("admin_tester");
        expect(sapClient.request).toHaveBeenCalledWith({
            method: "GET",
            url: "health",
        });
        expect(logRepo.items[0].status).toBe("success");
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FwLWludGVncmF0aW9uLnVuaXQuc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL3JlZGluZ3Rvbi1zYXAtaW50ZWdyYXRpb24vX190ZXN0c19fL3NhcC1pbnRlZ3JhdGlvbi51bml0LnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwwQkFBbUQ7QUFDbkQsK0VBQXlFO0FBQ3pFLG1GQUE0RTtBQUU1RSxNQUFNLGNBQWM7SUFBcEI7UUFDRSxVQUFLLEdBQVEsRUFBRSxDQUFBO0lBb0NqQixDQUFDO0lBbENDLE1BQU0sQ0FBQyxJQUFnQjtRQUNyQixNQUFNLE1BQU0sR0FBUTtZQUNsQixHQUFHLElBQUk7U0FDUixDQUFBO1FBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNmLE1BQU0sQ0FBQyxFQUFFLEdBQUcsUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQTtRQUM3QyxDQUFDO1FBQ0QsTUFBTSxDQUFDLFVBQVU7WUFDZixNQUFNLENBQUMsVUFBVSxJQUFJLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDL0MsTUFBTSxDQUFDLFVBQVU7WUFDZixNQUFNLENBQUMsVUFBVSxJQUFJLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDL0MsT0FBTyxNQUFXLENBQUE7SUFDcEIsQ0FBQztJQUVELEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBUztRQUNsQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDbkUsSUFBSSxLQUFLLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDZixJQUFJLENBQUMsS0FBSyxDQUFDLEtB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