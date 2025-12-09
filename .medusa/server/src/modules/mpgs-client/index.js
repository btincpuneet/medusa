"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMpgsClient = void 0;
const axios_1 = __importDefault(require("axios"));
const redington_config_1 = require("../redington-config");
const normalizeBaseUrl = (url) => {
    if (!url) {
        return "";
    }
    return url.endsWith("/") ? url.slice(0, -1) : url;
};
const toMpgsConfig = () => {
    const config = (0, redington_config_1.buildRedingtonConfig)();
    return {
        apiUrl: config.payment.apiUrl ?? "",
        merchantId: config.payment.username ?? "",
        password: config.payment.password ?? "",
    };
};
const createMpgsClient = ({ config: overrides = {}, axiosConfig = {}, } = {}) => {
    const envConfig = toMpgsConfig();
    const config = {
        ...envConfig,
        ...overrides,
    };
    const baseUrl = `${normalizeBaseUrl(config.apiUrl)}/${config.merchantId}`;
    const axiosInstance = axios_1.default.create({
        baseURL: baseUrl,
        auth: {
            username: `merchant.${config.merchantId}`,
            password: config.password,
        },
        headers: {
            "Content-Type": "application/json",
        },
        ...axiosConfig,
    });
    return {
        axios: axiosInstance,
        request: axiosInstance.request.bind(axiosInstance),
        createCheckoutSession: ({ amount, currency, orderId, orderReference = `OrderRef${orderId}`, transactionReference = `TxnRef${orderId}`, returnUrl, interactionOperation = "PURCHASE", additionalData = {}, }) => {
            const payload = {
                apiOperation: "INITIATE_CHECKOUT",
                interaction: {
                    operation: interactionOperation,
                    returnUrl,
                },
                order: {
                    amount,
                    currency,
                    id: orderId,
                    reference: orderReference,
                },
                transaction: {
                    reference: transactionReference,
                },
                ...additionalData,
            };
            return axiosInstance.post("/session", payload);
        },
        getPaymentStatus: (sessionId) => {
            return axiosInstance.get(`/session/${encodeURIComponent(sessionId)}`);
        },
    };
};
exports.createMpgsClient = createMpgsClient;
exports.default = exports.createMpgsClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9tcGdzLWNsaWVudC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxrREFJYztBQUNkLDBEQUEwRDtBQTRCMUQsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLEdBQVcsRUFBVSxFQUFFO0lBQy9DLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNULE9BQU8sRUFBRSxDQUFBO0lBQ1gsQ0FBQztJQUNELE9BQU8sR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFBO0FBQ25ELENBQUMsQ0FBQTtBQUVELE1BQU0sWUFBWSxHQUFHLEdBQXFCLEVBQUU7SUFDMUMsTUFBTSxNQUFNLEdBQUcsSUFBQSx1Q0FBb0IsR0FBRSxDQUFBO0lBQ3JDLE9BQU87UUFDTCxNQUFNLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUksRUFBRTtRQUNuQyxVQUFVLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLElBQUksRUFBRTtRQUN6QyxRQUFRLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLElBQUksRUFBRTtLQUN4QyxDQUFBO0FBQ0gsQ0FBQyxDQUFBO0FBSU0sTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLEVBQy9CLE1BQU0sRUFBRSxTQUFTLEdBQUcsRUFBRSxFQUN0QixXQUFXLEdBQUcsRUFBRSxNQUNLLEVBQUUsRUFBRSxFQUFFO0lBQzNCLE1BQU0sU0FBUyxHQUFHLFlBQVksRUFBRSxDQUFBO0lBQ2hDLE1BQU0sTUFBTSxHQUFxQjtRQUMvQixHQUFHLFNBQVM7UUFDWixHQUFHLFNBQVM7S0FDYixDQUFBO0lBRUQsTUFBTSxPQUFPLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFBO0lBRXpFLE1BQU0sYUFBYSxHQUFrQixlQUFLLENBQUMsTUFBTSxDQUFDO1FBQ2hELE9BQU8sRUFBRSxPQUFPO1FBQ2hCLElBQUksRUFBRTtZQUNKLFFBQVEsRUFBRSxZQUFZLE1BQU0sQ0FBQyxVQUFVLEVBQUU7WUFDekMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRO1NBQzFCO1FBQ0QsT0FBTyxFQUFFO1lBQ1AsY0FBYyxFQUFFLGtCQUFrQjtTQUNuQztRQUNELEdBQUcsV0FBVztLQUNmLENBQUMsQ0FBQTtJQUVGLE9BQU87UUFDTCxLQUFLLEVBQUUsYUFBYTtRQUVwQixPQUFPLEVBQUUsYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO1FBRWxELHFCQUFxQixFQUFFLENBQUMsRUFDdEIsTUFBTSxFQUNOLFFBQVEsRUFDUixPQUFPLEVBQ1AsY0FBYyxHQUFHLFdBQVcsT0FBTyxFQUFFLEVBQ3JDLG9CQUFvQixHQUFHLFNBQVMsT0FBTyxFQUFFLEVBQ3pDLFNBQVMsRUFDVCxvQkFBb0IsR0FBRyxVQUFVLEVBQ2pDLGNBQWMsR0FBRyxFQUFFLEdBQ0MsRUFBb0MsRUFBRTtZQUMxRCxNQUFNLE9BQU8sR0FBRztnQkFDZCxZQUFZLEVBQUUsbUJBQW1CO2dCQUNqQyxXQUFXLEVBQUU7b0JBQ1gsU0FBUyxFQUFFLG9CQUFvQjtvQkFDL0IsU0FBUztpQkFDVjtnQkFDRCxLQUFLLEVBQUU7b0JBQ0wsTUFBTTtvQkFDTixRQUFRO29CQUNSLEVBQUUsRUFBRSxPQUFPO29CQUNYLFNBQVMsRUFBRSxjQUFjO2lCQUMxQjtnQkFDRCxXQUFXLEVBQUU7b0JBQ1gsU0FBUyxFQUFFLG9CQUFvQjtpQkFDaEM7Z0JBQ0QsR0FBRyxjQUFjO2FBQ2xCLENBQUE7WUFFRCxPQUFPLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQ2hELENBQUM7UUFFRCxnQkFBZ0IsRUFBRSxDQUNoQixTQUFpQixFQUNlLEVBQUU7WUFDbEMsT0FBTyxhQUFhLENBQUMsR0FBRyxDQUFDLFlBQVksa0JBQWtCLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ3ZFLENBQUM7S0FDRixDQUFBO0FBQ0gsQ0FBQyxDQUFBO0FBbEVZLFFBQUEsZ0JBQWdCLG9CQWtFNUI7QUFFRCxrQkFBZSx3QkFBZ0IsQ0FBQSJ9