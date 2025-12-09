"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const createMockAdapter = (collector) => {
    return async (config) => {
        collector.push(config);
        return {
            data: {},
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };
};
describe("createSapClient", () => {
    const baseConfig = {
        apiUrl: "https://sap.example/api",
        clientId: "GENERAL_ID",
        clientSecret: "GENERAL_SECRET",
        invoiceApiUrl: "https://sap.example/invoice",
        invoicePdfApiUrl: "https://sap.example/invoice-pdf",
        invoiceClientId: "INVOICE_ID",
        invoiceClientSecret: "INVOICE_SECRET",
    };
    it("applies general headers to default axios instance", async () => {
        const captured = [];
        const client = (0, __1.createSapClient)({
            config: baseConfig,
            axiosConfig: {
                adapter: createMockAdapter(captured),
            },
        });
        await client.request({ method: "GET", url: "/health" });
        expect(captured).toHaveLength(1);
        expect(captured[0].headers).toMatchObject({
            ClientId: baseConfig.clientId,
            ClientSecret: baseConfig.clientSecret,
        });
        expect(captured[0].baseURL).toBe("https://sap.example/api/");
    });
    it("uses invoice credentials when fetching invoice metadata", async () => {
        const captured = [];
        const client = (0, __1.createSapClient)({
            config: baseConfig,
            axiosConfig: {
                adapter: createMockAdapter(captured),
            },
        });
        await client.fetchInvoice({
            salesOrder: "SO-123",
            companyCode: "COMP-1",
        });
        expect(captured).toHaveLength(1);
        expect(captured[0].headers).toMatchObject({
            Client_Id: baseConfig.invoiceClientId,
            Client_Secret: baseConfig.invoiceClientSecret,
            "Content-Type": "application/json",
        });
        expect(captured[0].data).toEqual(JSON.stringify({
            Customer: "",
            SalesOrg: "COMP-1",
            SalesOrder: "SO-123",
            FromDate: "",
            ToDate: "",
        }));
    });
    it("builds invoice PDF query parameters correctly", async () => {
        const captured = [];
        const client = (0, __1.createSapClient)({
            config: baseConfig,
            axiosConfig: {
                adapter: createMockAdapter(captured),
            },
        });
        await client.fetchInvoicePdf("INV-1", "2024-12-01", "COMP-1");
        expect(captured).toHaveLength(1);
        expect(captured[0].url).toBe("?InvoiceNo=INV-1&CompanyCode=COMP-1&InvoiceDate=2024-12-01");
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FwLWNsaWVudC51bml0LnNwZWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9zYXAtY2xpZW50L19fdGVzdHNfXy9zYXAtY2xpZW50LnVuaXQuc3BlYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLDBCQUFvQztBQUVwQyxNQUFNLGlCQUFpQixHQUFHLENBQUMsU0FBcUIsRUFBRSxFQUFFO0lBQ2xELE9BQU8sS0FBSyxFQUFFLE1BQVcsRUFBMEIsRUFBRTtRQUNuRCxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ3RCLE9BQU87WUFDTCxJQUFJLEVBQUUsRUFBRTtZQUNSLE1BQU0sRUFBRSxHQUFHO1lBQ1gsVUFBVSxFQUFFLElBQUk7WUFDaEIsT0FBTyxFQUFFLEVBQUU7WUFDWCxNQUFNO1NBQ1AsQ0FBQTtJQUNILENBQUMsQ0FBQTtBQUNILENBQUMsQ0FBQTtBQUVELFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7SUFDL0IsTUFBTSxVQUFVLEdBQUc7UUFDakIsTUFBTSxFQUFFLHlCQUF5QjtRQUNqQyxRQUFRLEVBQUUsWUFBWTtRQUN0QixZQUFZLEVBQUUsZ0JBQWdCO1FBQzlCLGFBQWEsRUFBRSw2QkFBNkI7UUFDNUMsZ0JBQWdCLEVBQUUsaUNBQWlDO1FBQ25ELGVBQWUsRUFBRSxZQUFZO1FBQzdCLG1CQUFtQixFQUFFLGdCQUFnQjtLQUN0QyxDQUFBO0lBRUQsRUFBRSxDQUFDLG1EQUFtRCxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ2pFLE1BQU0sUUFBUSxHQUFVLEVBQUUsQ0FBQTtRQUMxQixNQUFNLE1BQU0sR0FBRyxJQUFBLG1CQUFlLEVBQUM7WUFDN0IsTUFBTSxFQUFFLFVBQVU7WUFDbEIsV0FBVyxFQUFFO2dCQUNYLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxRQUFRLENBQUM7YUFDckM7U0FDRixDQUFDLENBQUE7UUFFRixNQUFNLE1B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