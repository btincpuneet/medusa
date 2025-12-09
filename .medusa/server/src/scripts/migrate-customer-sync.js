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
const fetchMagentoCustomers = async () => {
    const mysql = (0, promise_1.createPool)(MYSQL_CONFIG);
    const [rows] = await mysql.query(`
      SELECT ce.entity_id,
             ce.email,
             cei.value AS sap_sync,
             cev.value AS sap_customer_code,
             ce.updated_at
      FROM customer_entity ce
      LEFT JOIN customer_entity_int cei
        ON cei.entity_id = ce.entity_id AND cei.attribute_id = 190
      LEFT JOIN customer_entity_varchar cev
        ON cev.entity_id = ce.entity_id AND cev.attribute_id = 192
      WHERE cei.value IS NOT NULL OR cev.value IS NOT NULL
    `);
    await mysql.end();
    return rows;
};
const main = async () => {
    const pgPool = (0, pg_1.getPgPool)();
    await (0, pg_1.ensureRedingtonCustomerSyncTable)();
    try {
        const customers = await fetchMagentoCustomers();
        if (!customers.length) {
            console.log("No Magento customers with SAP sync metadata found.");
            return;
        }
        for (const customer of customers) {
            const email = (customer.email || "").trim();
            if (!email) {
                continue;
            }
            const sapSync = Boolean(customer.sap_sync && Number(customer.sap_sync) > 0);
            const sapCustomerCode = customer.sap_customer_code?.trim() || null;
            const sapSyncedAt = sapSync
                ? customer.updated_at instanceof Date
                    ? customer.updated_at.toISOString()
                    : null
                : null;
            const inserted = await (0, pg_1.upsertRedingtonCustomerSync)({
                email,
                sapSync,
                sapCustomerCode,
                sapSyncedAt,
            });
            console.log(`Synced SAP flags for ${inserted.customer_email} (sap_sync=${inserted.sap_sync}, code=${inserted.sap_customer_code ?? ""})`);
        }
        const { rows } = await pgPool.query(`
      SELECT COUNT(*) AS count
      FROM redington_customer_sync
    `);
        console.log(`Completed SAP sync migration. Total records in redington_customer_sync: ${rows[0]?.count ?? 0}`);
    }
    catch (error) {
        console.error("Failed to migrate SAP customer sync flags:", error);
        process.exitCode = 1;
    }
    finally {
        await pgPool.end();
    }
};
if (require.main === module) {
    main();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0ZS1jdXN0b21lci1zeW5jLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3NjcmlwdHMvbWlncmF0ZS1jdXN0b21lci1zeW5jLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEseUJBQXNCO0FBRXRCLDRDQUEwRDtBQUUxRCxrQ0FJa0I7QUFFbEIsTUFBTSxZQUFZLEdBQUc7SUFDbkIsSUFBSSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxJQUFJLFdBQVc7SUFDaEQsSUFBSSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsSUFBSSxNQUFNLENBQUM7SUFDbkQsSUFBSSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxJQUFJLE1BQU07SUFDM0MsUUFBUSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLElBQUksTUFBTTtJQUNuRCxRQUFRLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLElBQUksV0FBVztJQUNwRCxjQUFjLEVBQUUsSUFBSTtDQUNyQixDQUFBO0FBVUQsTUFBTSxxQkFBcUIsR0FBRyxLQUFLLElBQUksRUFBRTtJQUN2QyxNQUFNLEtBQUssR0FBRyxJQUFBLG9CQUFVLEVBQUMsWUFBWSxDQUFDLENBQUE7SUFFdEMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sS0FBSyxDQUFDLEtBQUssQ0FDOUI7Ozs7Ozs7Ozs7OztLQVlDLENBQ0YsQ0FBQTtJQUVELE1BQU0sS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFBO0lBRWpCLE9BQU8sSUFBSSxDQUFBO0FBQ2IsQ0FBQyxDQUFBO0FBRUQsTUFBTSxJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUU7SUFDdEIsTUFBTSxNQUFNLEdBQUcsSUFBQSxjQUFTLEdBQUUsQ0FBQTtJQUMxQixNQUFNLElBQUEscUNBQWdDLEdBQUUsQ0FBQTtJQUV4QyxJQUFJLENBQUM7UUFDSCxNQUFNLFNBQVMsR0FBRyxNQUFNLHFCQUFxQixFQUFFLENBQUE7UUFDL0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUN0QixPQUFPLENBQUMsR0FBRyxDQUFDLG9EQUFvRCxDQUFDLENBQUE7WUFDakUsT0FBTTtRQUNSLENBQUM7UUFFRCxLQUFLLE1BQU0sUUFBUSxJQUFJLFNBQVMsRUFBRSxDQUFDO1lBQ2pDLE1BQU0sS0FBSyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtZQUMzQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1gsU0FBUTtZQUNWLENBQUM7WUFFRCxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO1lBQzNFLE1BQU0sZUFBZSxHQUFHLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsSUFBSSxJQUFJLENBQUE7WUFDbEUsTUFBTSxXQUFXLEdBQUcsT0FBTztnQkFDekIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLFlBQVksSUFBSTtvQkFDbkMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsV0FBVyxFQUFFO29CQUNuQyxDQUFDLENBQUMsSUFBSTtnQkFDUixDQUFDLENBQUMsSUFBSSxDQUFBO1lBRVIsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFBLGdDQUEyQixFQUFDO2dCQUNqRCxLQUFLO2dCQUNMLE9BQU87Z0JBQ1AsZUFBZTtnQkFDZixXQUFXO2FBQ1osQ0FBQyxDQUFBO1lBRUYsT0FBTyxDQUFDLEdBQUcsQ0FDVCx3QkFBd0IsUUFBUSxDQUFDLGNBQWMsY0FBYyxRQUFRLENBQUMsUUFBUSxVQUFVLFFBQVEsQ0FBQyxpQkFBaUIsSUFBSSxFQUFFLEdBQUcsQ0FDNUgsQ0FBQTtRQUNILENBQUM7UUFFRCxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDOzs7S0FHbkMsQ0FBQyxDQUFBO1FBRUYsT0FBTyxDQUFDLEdBQUcsQ0FDVCwyRUFBMkUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssSUFBSSxDQUFDLEVBQUUsQ0FDakcsQ0FBQTtJQUNILENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyw0Q0FBNEMsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUNsRSxPQUFPLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQTtJQUN0QixDQUFDO1lBQVMsQ0FBQztRQUNULE1BQU0sTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFBO0lBQ3BCLENBQUM7QUFDSCxDQUFDLENBQUE7QUFFRCxJQUFJLE9BQU8sQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFLENBQUM7SUFDNUIsSUFBSSxFQUFFLENBQUE7QUFDUixDQUFDIn0=