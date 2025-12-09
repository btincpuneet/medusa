"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const promise_1 = require("mysql2/promise");
const pg_1 = require("../lib/pg");
const MYSQL_CONFIG = {
    host: process.env.MAGENTO_DB_HOST || "localhost",
    port: Number(process.env.MAGENTO_DB_PORT || "3306"),
    user: process.env.MAGENTO_DB_USER || "root",
    password: process.env.MAGENTO_DB_PASSWORD || "root",
    database: process.env.MAGENTO_DB_NAME || "radington",
    decimalNumbers: true,
};
const normalizeBrandIds = (value) => {
    if (!value) {
        return [];
    }
    return value
        .split(/[,\s]+/)
        .map((entry) => entry.trim())
        .filter(Boolean);
};
async function main() {
    const mysql = await (0, promise_1.createPool)(MYSQL_CONFIG);
    const pg = (0, pg_1.getPgPool)();
    await (0, pg_1.ensureRedingtonAccessMappingTable)();
    try {
        const [rows] = await mysql.query(`SELECT access_id, country_code, mobile_ext, company_code, brand_ids, domain_id, domain_extention_id, created_at, updated_at FROM access_mapping`);
        for (const row of rows) {
            const accessId = String(row.access_id);
            const brandIds = normalizeBrandIds(row.brand_ids);
            const domainId = row.domain_id ?? null;
            const domainExtentionId = row.domain_extention_id ?? null;
            await pg.query(`DELETE FROM redington_access_mapping WHERE access_id = $1`, [accessId]);
            await pg.query(`INSERT INTO redington_access_mapping (
            access_id,
            country_code,
            mobile_ext,
            company_code,
            brand_ids,
            domain_id,
            domain_extention_id,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, NOW(), NOW())
        `, [
                accessId,
                row.country_code?.trim() || "",
                row.mobile_ext?.trim() || "",
                row.company_code?.trim() || "",
                JSON.stringify(brandIds),
                domainId,
                domainExtentionId,
            ]);
        }
        console.log(`Synced ${rows.length} access mapping records.`);
    }
    finally {
        await mysql.end();
        await pg.end();
    }
}
main().catch((err) => {
    console.error("Failed to sync access mappings", err);
    process.exit(1);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3luYy1hY2Nlc3MtbWFwcGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvc2NyaXB0cy9zeW5jLWFjY2Vzcy1tYXBwaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHlCQUFzQjtBQUV0Qiw0Q0FBMEQ7QUFFMUQsa0NBR2tCO0FBRWxCLE1BQU0sWUFBWSxHQUFHO0lBQ25CLElBQUksRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsSUFBSSxXQUFXO0lBQ2hELElBQUksRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLElBQUksTUFBTSxDQUFDO0lBQ25ELElBQUksRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsSUFBSSxNQUFNO0lBQzNDLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixJQUFJLE1BQU07SUFDbkQsUUFBUSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxJQUFJLFdBQVc7SUFDcEQsY0FBYyxFQUFFLElBQUk7Q0FDckIsQ0FBQTtBQWNELE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxLQUFvQixFQUFZLEVBQUU7SUFDM0QsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ1gsT0FBTyxFQUFFLENBQUE7SUFDWCxDQUFDO0lBQ0QsT0FBTyxLQUFLO1NBQ1QsS0FBSyxDQUFDLFFBQVEsQ0FBQztTQUNmLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1NBQzVCLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQTtBQUNwQixDQUFDLENBQUE7QUFFRCxLQUFLLFVBQVUsSUFBSTtJQUNqQixNQUFNLEtBQUssR0FBRyxNQUFNLElBQUEsb0JBQVUsRUFBQyxZQUFZLENBQUMsQ0FBQTtJQUM1QyxNQUFNLEVBQUUsR0FBRyxJQUFBLGNBQVMsR0FBRSxDQUFBO0lBQ3RCLE1BQU0sSUFBQSxzQ0FBaUMsR0FBRSxDQUFBO0lBRXpDLElBQUksQ0FBQztRQUNILE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLEtBQUssQ0FBQyxLQUFLLENBQzlCLGlKQUFpSixDQUNsSixDQUFBO1FBRUQsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUN2QixNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFBO1lBQ3RDLE1BQU0sUUFBUSxHQUFHLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQTtZQUNqRCxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQTtZQUN0QyxNQUFNLGlCQUFpQixHQUFHLEdBQUcsQ0FBQyxtQkFBbUIsSUFBSSxJQUFJLENBQUE7WUFFekQsTUFBTSxFQUFFLENBQUMsS0FBSyxDQUFDLDJEQUEyRCxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQTtZQUV2RixNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQ1o7Ozs7Ozs7Ozs7OztTQVlDLEVBQ0Q7Z0JBQ0UsUUFBUTtnQkFDUixHQUFHLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7Z0JBQzlCLEdBQUcsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRTtnQkFDNUIsR0FBRyxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFO2dCQUM5QixJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztnQkFDeEIsUUFBUTtnQkFDUixpQkFBaUI7YUFDbEIsQ0FDRixDQUFBO1FBQ0gsQ0FBQztRQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLENBQUMsTUFBTSwwQkFBMEIsQ0FBQyxDQUFBO0lBQzlELENBQUM7WUFBUyxDQUFDO1FBQ1QsTUFBTSxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUE7UUFDakIsTUFBTSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUE7SUFDaEIsQ0FBQztBQUNILENBQUM7QUFFRCxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtJQUNuQixPQUFPLENBQUMsS0FBSyxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ3BELE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDakIsQ0FBQyxDQUFDLENBQUEifQ==