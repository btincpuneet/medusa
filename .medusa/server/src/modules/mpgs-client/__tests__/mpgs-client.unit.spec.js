"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const captureAdapter = (collector) => {
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
describe("createMpgsClient", () => {
    const overrides = {
        apiUrl: "https://mpgs.example/api/rest/version/66/merchant",
        merchantId: "TEST_MERCHANT",
        password: "secret",
    };
    it("appends merchant id to base URL and configures basic auth", async () => {
        const captured = [];
        const client = (0, __1.createMpgsClient)({
            config: overrides,
            axiosConfig: {
                adapter: captureAdapter(captured),
            },
        });
        await client.request({ method: "GET", url: "/ping" });
        expect(captured).toHaveLength(1);
        expect(captured[0].baseURL).toBe("https://mpgs.example/api/rest/version/66/merchant/TEST_MERCHANT");
        expect(captured[0].auth).toEqual({
            username: `merchant.${overrides.merchantId}`,
            password: overrides.password,
        });
    });
    it("creates checkout session payload with defaults", async () => {
        const captured = [];
        const client = (0, __1.createMpgsClient)({
            config: overrides,
            axiosConfig: {
                adapter: captureAdapter(captured),
            },
        });
        await client.createCheckoutSession({
            amount: 120.5,
            currency: "SAR",
            orderId: "ORDER-1",
            returnUrl: "https://store/return",
        });
        expect(captured).toHaveLength(1);
        expect(captured[0].url).toBe("/session");
        expect(JSON.parse(captured[0].data)).toMatchObject({
            apiOperation: "INITIATE_CHECKOUT",
            interaction: {
                operation: "PURCHASE",
                returnUrl: "https://store/return",
            },
            order: {
                amount: 120.5,
                currency: "SAR",
                id: "ORDER-1",
                reference: "OrderRefORDER-1",
            },
            transaction: {
                reference: "TxnRefORDER-1",
            },
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXBncy1jbGllbnQudW5pdC5zcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21vZHVsZXMvbXBncy1jbGllbnQvX190ZXN0c19fL21wZ3MtY2xpZW50LnVuaXQuc3BlYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLDBCQUFxQztBQUVyQyxNQUFNLGNBQWMsR0FBRyxDQUFDLFNBQXFCLEVBQUUsRUFBRTtJQUMvQyxPQUFPLEtBQUssRUFBRSxNQUFXLEVBQTBCLEVBQUU7UUFDbkQsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUN0QixPQUFPO1lBQ0wsSUFBSSxFQUFFLEVBQUU7WUFDUixNQUFNLEVBQUUsR0FBRztZQUNYLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLE9BQU8sRUFBRSxFQUFFO1lBQ1gsTUFBTTtTQUNQLENBQUE7SUFDSCxDQUFDLENBQUE7QUFDSCxDQUFDLENBQUE7QUFFRCxRQUFRLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO0lBQ2hDLE1BQU0sU0FBUyxHQUFHO1FBQ2hCLE1BQU0sRUFBRSxtREFBbUQ7UUFDM0QsVUFBVSxFQUFFLGVBQWU7UUFDM0IsUUFBUSxFQUFFLFFBQVE7S0FDbkIsQ0FBQTtJQUVELEVBQUUsQ0FBQywyREFBMkQsRUFBRSxLQUFLLElBQUksRUFBRTtRQUN6RSxNQUFNLFFBQVEsR0FBVSxFQUFFLENBQUE7UUFDMUIsTUFBTSxNQUFNLEdBQUcsSUFBQSxvQkFBZ0IsRUFBQztZQUM5QixNQUFNLEVBQUUsU0FBUztZQUNqQixXQUFXLEVBQUU7Z0JBQ1gsT0FBTyxFQUFFLGNBQWMsQ0FBQyxRQUFRLENBQUM7YUFDbEM7U0FDRixDQUFDLENBQUE7UUFFRixNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFBO1FBRXJELE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDaEMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQzlCLGlFQUFpRSxDQUNsRSxDQUFBO1FBQ0QsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUM7WUFDL0IsUUFBUSxFQUFFLFlBQVksU0FBUyxDQUFDLFVBQVUsRUFBRTtZQUM1QyxRQUFRLEVBQUUsU0FBUyxDQUFDLFFBQVE7U0FDN0IsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsZ0RBQWdELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDOUQsTUFBTSxRQUFRLEdBQVUsRUFBRSxDQUFBO1FBQzFCLE1BQU0sTUFBTSxHQUFHLElBQUEsb0JBQWdCLEVBQUM7WUFDOUIsTUFBTSxFQUFFLFNBQVM7WUFDakIsV0FBVyxFQUFFO2dCQUNYLE9BQU8sRUFBRSxjQUFjLENBQUMsUUFBUSxDQUFDO2FBQ2xDO1NBQ0YsQ0FBQyxDQUFBO1FBRUYsTUFBTSxNQUFNLENBQUMscUJBQXFCLENBQUM7WUFDakMsTUFBTSxFQUFFLEtBQUs7WUFDYixRQUFRLEVBQUUsS0FBSztZQUNmLE9BQU8sRUFBRSxTQUFTO1lBQ2xCLFNBQVMsRUFBRSxzQkFBc0I7U0FDbEMsQ0FBQyxDQUFBO1FBRUYsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNoQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQTtRQUN4QyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUM7WUFDakQsWUFBWSxFQUFFLG1CQUFtQjtZQUNqQyxXQUFXLEVBQUU7Z0JBQ1gsU0FBUyxFQUFFLFVBQVU7Z0JBQ3JCLFNBQVMsRUFBRSxzQkFBc0I7YUFDbEM7WUFDRCxLQUFLLEVBQUU7Z0JBQ0wsTUFBTSxFQUFFLEtBQUs7Z0JBQ2IsUUFBUSxFQUFFLEtBQUs7Z0JBQ2YsRUFBRSxFQUFFLFNBQVM7Z0JBQ2IsU0FBUyxFQUFFLGlCQUFpQjthQUM3QjtZQUNELFdBQVcsRUFBRTtnQkFDWCxTQUFTLEVBQUUsZUFBZTthQUMzQjtTQUNGLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUEifQ==