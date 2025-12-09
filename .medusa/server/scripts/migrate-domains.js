"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const pg_1 = require("../src/lib/pg");
const ENV_PATHS = [
    node_path_1.default.resolve(process.cwd(), ".env"),
    node_path_1.default.resolve(process.cwd(), "../.env"),
    node_path_1.default.resolve(process.cwd(), "../../.env"),
];
for (const envPath of ENV_PATHS) {
    if (node_fs_1.default.existsSync(envPath)) {
        dotenv_1.default.config({ path: envPath });
        break;
    }
}
const magentoBaseUrl = (process.env.MAGENTO_REST_BASE_URL || "").replace(/\/$/, "");
async function fetchMagentoDomains() {
    if (!magentoBaseUrl) {
        throw new Error("MAGENTO_REST_BASE_URL env variable is required to pull Magento domains.");
    }
    const url = `${magentoBaseUrl}/access-mapping/getDomainDetails/`;
    const headers = {
        "Content-Type": "application/json",
    };
    if (process.env.MAGENTO_ADMIN_TOKEN) {
        headers.Authorization = `Bearer ${process.env.MAGENTO_ADMIN_TOKEN}`;
    }
    const { data } = await axios_1.default.post(url, { countryCode: "ALL" }, { headers });
    if (!Array.isArray(data) || data.length === 0) {
        return [];
    }
    const domains = data[0]?.domain_names ?? data;
    if (!Array.isArray(domains)) {
        return [];
    }
    return domains;
}
async function upsertDomains() {
    await (0, pg_1.ensureRedingtonDomainTable)();
    const domains = await fetchMagentoDomains();
    if (!domains.length) {
        console.log("⚠️  No domain data returned from Magento.");
        return;
    }
    const pool = (0, pg_1.getPgPool)();
    let created = 0;
    let updated = 0;
    for (const entry of domains) {
        const domainName = String(entry.domain_name || "").trim();
        if (!domainName) {
            continue;
        }
        const { rowCount, rows } = await pool.query(`
        INSERT INTO redington_domain (domain_name, is_active)
        VALUES ($1, TRUE)
        ON CONFLICT (domain_name)
        DO UPDATE SET is_active = TRUE, updated_at = NOW()
        RETURNING id, created_at, updated_at
      `, [domainName]);
        if (rowCount && rows[0]?.created_at === rows[0]?.updated_at) {
            created += 1;
        }
        else {
            updated += 1;
        }
    }
    console.log(`✅ Domain migration complete. Created: ${created}, updated: ${updated}`);
}
async function main() {
    try {
        await upsertDomains();
    }
    catch (error) {
        console.error("❌ Failed to migrate domains:", error);
        process.exitCode = 1;
    }
    finally {
        const pool = (0, pg_1.getPgPool)();
        await pool.end().catch(() => void 0);
    }
}
main();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0ZS1kb21haW5zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc2NyaXB0cy9taWdyYXRlLWRvbWFpbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSwwREFBNEI7QUFDNUIsc0RBQXdCO0FBQ3hCLG9EQUEyQjtBQUMzQixrREFBeUI7QUFFekIsc0NBR3NCO0FBRXRCLE1BQU0sU0FBUyxHQUFHO0lBQ2hCLG1CQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxNQUFNLENBQUM7SUFDbkMsbUJBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLFNBQVMsQ0FBQztJQUN0QyxtQkFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsWUFBWSxDQUFDO0NBQzFDLENBQUE7QUFFRCxLQUFLLE1BQU0sT0FBTyxJQUFJLFNBQVMsRUFBRSxDQUFDO0lBQ2hDLElBQUksaUJBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUMzQixnQkFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFBO1FBQ2hDLE1BQUs7SUFDUCxDQUFDO0FBQ0gsQ0FBQztBQUVELE1BQU0sY0FBYyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsSUFBSSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQ3RFLEtBQUssRUFDTCxFQUFFLENBQ0gsQ0FBQTtBQUVELEtBQUssVUFBVSxtQkFBbUI7SUFRaEMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3BCLE1BQU0sSUFBSSxLQUFLLENBQ2IseUVBQXlFLENBQzFFLENBQUE7SUFDSCxDQUFDO0lBRUQsTUFBTSxHQUFHLEdBQUcsR0FBRyxjQUFjLG1DQUFtQyxDQUFBO0lBRWhFLE1BQU0sT0FBTyxHQUEyQjtRQUN0QyxjQUFjLEVBQUUsa0JB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