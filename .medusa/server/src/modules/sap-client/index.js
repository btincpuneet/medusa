"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSapClient = void 0;
const axios_1 = __importStar(require("axios"));
const redington_config_1 = require("../redington-config");
const normalizeUrl = (url) => {
    if (!url) {
        return "";
    }
    return url.endsWith("/") ? url : `${url}/`;
};
const toSapClientConfig = (cfg) => ({
    apiUrl: cfg.sap.apiUrl ?? "",
    clientId: cfg.sap.clientId ?? "",
    clientSecret: cfg.sap.clientSecret ?? "",
    invoiceApiUrl: cfg.sap.invoiceApiUrl ?? "",
    invoicePdfApiUrl: cfg.sap.invoicePdfApiUrl ?? "",
    invoiceClientId: cfg.sap.invoiceClientId ?? cfg.sap.clientId ?? "",
    invoiceClientSecret: cfg.sap.invoiceClientSecret ?? cfg.sap.clientSecret ?? "",
});
const applyGeneralHeaders = (instance, config) => {
    instance.interceptors.request.use((request) => {
        const headers = request.headers instanceof axios_1.AxiosHeaders
            ? request.headers
            : new axios_1.AxiosHeaders(request.headers ?? {});
        headers.set("Content-Type", "application/json");
        headers.set("ClientId", config.clientId);
        headers.set("ClientSecret", config.clientSecret);
        request.headers = headers;
        return request;
    });
};
const applyInvoiceHeaders = (instance, config) => {
    instance.interceptors.request.use((request) => {
        const headers = request.headers instanceof axios_1.AxiosHeaders
            ? request.headers
            : new axios_1.AxiosHeaders(request.headers ?? {});
        headers.set("Content-Type", "application/json");
        headers.set("Client_Id", config.invoiceClientId);
        headers.set("Client_Secret", config.invoiceClientSecret);
        request.headers = headers;
        return request;
    });
};
const createSapClient = ({ config: overrides = {}, axiosConfig = {}, } = {}) => {
    const envConfig = toSapClientConfig((0, redington_config_1.buildRedingtonConfig)());
    const config = {
        ...envConfig,
        ...overrides,
    };
    const generalAxios = axios_1.default.create({
        baseURL: normalizeUrl(config.apiUrl),
        ...axiosConfig,
    });
    applyGeneralHeaders(generalAxios, config);
    const invoiceAxios = axios_1.default.create({
        baseURL: normalizeUrl(config.invoiceApiUrl),
        ...axiosConfig,
    });
    applyInvoiceHeaders(invoiceAxios, config);
    const invoicePdfAxios = axios_1.default.create({
        baseURL: normalizeUrl(config.invoicePdfApiUrl),
        ...axiosConfig,
    });
    applyInvoiceHeaders(invoicePdfAxios, config);
    const postGeneral = (path, payload, requestConfig = {}) => generalAxios.post(path, payload, requestConfig);
    return {
        axios: generalAxios,
        invoiceAxios,
        invoicePdfAxios,
        request: generalAxios.request.bind(generalAxios),
        fetchInvoice: ({ salesOrder, companyCode, }) => {
            const payload = {
                Customer: "",
                SalesOrg: companyCode,
                SalesOrder: salesOrder,
                FromDate: "",
                ToDate: "",
            };
            return invoiceAxios.post("", payload);
        },
        fetchInvoicePdf: (invoiceNo, invoiceDate, companyCode) => {
            const query = new URLSearchParams({
                InvoiceNo: invoiceNo,
                CompanyCode: companyCode,
                InvoiceDate: invoiceDate,
            });
            return invoicePdfAxios.post(`?${query.toString()}`, {});
        },
        calculateVat: (companyCode, totalPrice) => {
            const payload = {
                Company_Code: companyCode,
                Total_Price: totalPrice,
            };
            return postGeneral("CalculateVat", payload);
        },
        createProduct: (companyCode, sku) => {
            const payload = {
                Im_Application: "B2C",
                Im_Indicator: "",
                Status: "SET",
                ATPItems: [
                    {
                        Companycode: companyCode,
                        Material: sku,
                    },
                ],
            };
            return postGeneral("SystemATP", payload);
        },
        createCustomer: (email) => {
            const payload = {
                Email: email,
                Source: "B2C",
            };
            return postGeneral("CreateCustomer", payload);
        },
    };
};
exports.createSapClient = createSapClient;
exports.default = exports.createSapClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9zYXAtY2xpZW50L2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLCtDQUtjO0FBQ2QsMERBQTJFO0FBZ0MzRSxNQUFNLFlBQVksR0FBRyxDQUFDLEdBQVcsRUFBVSxFQUFFO0lBQzNDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNULE9BQU8sRUFBRSxDQUFBO0lBQ1gsQ0FBQztJQUNELE9BQU8sR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFBO0FBQzVDLENBQUMsQ0FBQTtBQUVELE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxHQUFvQixFQUFtQixFQUFFLENBQUMsQ0FBQztJQUNwRSxNQUFNLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLElBQUksRUFBRTtJQUM1QixRQUFRLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFRLElBQUksRUFBRTtJQUNoQyxZQUFZLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxZQUFZLElBQUksRUFBRTtJQUN4QyxhQUFhLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxhQUFhLElBQUksRUFBRTtJQUMxQyxnQkFBZ0IsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLGdCQUFnQixJQUFJLEVBQUU7SUFDaEQsZUFBZSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsZUFBZSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxJQUFJLEVBQUU7SUFDbEUsbUJBQW1CLEVBQ2pCLEdBQUcsQ0FBQyxHQUFHLENBQUMsbUJBQW1CLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxZQUFZLElBQUksRUFBRTtDQUM1RCxDQUFDLENBQUE7QUFFRixNQUFNLG1CQUFtQixHQUFHLENBQzFCLFFBQXVCLEVBQ3ZCLE1BQXVCLEVBQ3ZCLEVBQUU7SUFDRixRQUFRLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtRQUM1QyxNQUFNLE9BQU8sR0FDWCxPQUFPLENBQUMsT0FBTyxZQUFZLG9CQUFZO1lBQ3JDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTztZQUNqQixDQUFDLENBQUMsSUFBSSxvQkFBWSxDQUFDLE9BQU8sQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDLENBQUE7UUFFN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsa0JBQWtCLENBQUMsQ0FBQTtRQUMvQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDeEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFBO1FBRWhELE9BQU8sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO1FBQ3pCLE9BQU8sT0FBTyxDQUFBO0lBQ2hCLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFBO0FBRUQsTUFBTSxtQkFBbUIsR0FBRyxDQUMxQixRQUF1QixFQUN2QixNQUF1QixFQUN2QixFQUFFO0lBQ0YsUUFBUSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7UUFDNUMsTUFBTSxPQUFPLEdBQ1gsT0FBTyxDQUFDLE9BQU8sWUFBWSxvQkFBWTtZQUNyQyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU87WUFDakIsQ0FBQyxDQUFDLElBQUksb0JBQVksQ0FBQyxPQUFPLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFBO1FBRTdDLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLGtCQUFrQixDQUFDLENBQUE7UUFDL0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFBO1FBQ2hELE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFBO1FBRXhELE9BQU8sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO1FBQ3pCLE9BQU8sT0FBTyxDQUFBO0lBQ2hCLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFBO0FBSU0sTUFBTSxlQUFlLEdBQUcsQ0FBQyxFQUM5QixNQUFNLEVBQUUsU0FBUyxHQUFHLEVBQUUsRUFDdEIsV0FBVyxHQUFHLEVBQUUsTUFDSSxFQUFFLEVBQUUsRUFBRTtJQUMxQixNQUFNLFNBQVMsR0FBRyxpQkFBaUIsQ0FBQyxJQUFBLHVDQUFvQixHQUFFLENBQUMsQ0FBQTtJQUMzRCxNQUFNLE1BQU0sR0FBb0I7UUFDOUIsR0FBRyxTQUFTO1FBQ1osR0FBRyxTQUFTO0tBQ2IsQ0FBQTtJQUVELE1BQU0sWUFBWSxHQUFHLGVBQUssQ0FBQyxNQUFNLENBQUM7UUFDaEMsT0FBTyxFQUFFLFlBQVksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ3BDLEdBQUcsV0FBVztLQUNmLENBQUMsQ0FBQTtJQUNGLG1CQUFtQixDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQTtJQUV6QyxNQUFNLFlBQVksR0FBRyxlQUFLLENBQUMsTUFBTSxDQUFDO1FBQ2hDLE9BQU8sRUFBRSxZQUFZLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQztRQUMzQyxHQUFHLFdBQVc7S0FDZixDQUFDLENBQUE7SUFDRixtQkFBbUIsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUE7SUFFekMsTUFBTSxlQUFlLEdBQUcsZUFBSyxDQUFDLE1BQU0sQ0FBQztRQUNuQyxPQUFPLEVBQUUsWUFBWSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztRQUM5QyxHQUFHLFdBQVc7S0FDZixDQUFDLENBQUE7SUFDRixtQkFBbUIsQ0FBQyxlQUFlLEVBQUUsTUFBTSxDQUFDLENBQUE7SUFFNUMsTUFBTSxXQUFXLEdBQUcsQ0FDbEIsSUFBWSxFQUNaLE9BQWdCLEVBQ2hCLGdCQUFvQyxFQUFFLEVBQ3RDLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFJLElBQUksRUFBRSxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUE7SUFFdkQsT0FBTztRQUNMLEtBQUssRUFBRSxZQUFZO1FBQ25CLFlBQVk7UUFDWixlQUFlO1FBRWYsT0FBTyxFQUFFLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQztRQUVoRCxZQUFZLEVBQUUsQ0FBQyxFQUNiLFVBQVUsRUFDVixXQUFXLEdBQ08sRUFBK0IsRUFBRTtZQUNuRCxNQUFNLE9BQU8sR0FBRztnQkFDZCxRQUFRLEVBQUUsRUFBRTtnQkFDWixRQUFRLEVBQUUsV0FBVztnQkFDckIsVUFBVSxFQUFFLFVBQVU7Z0JBQ3RCLFFBQVEsRUFBRSxFQUFFO2dCQUNaLE1BQU0sRUFBRSxFQUFFO2FBQ1gsQ0FBQTtZQUNELE9BQU8sWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDdkMsQ0FBQztRQUVELGVBQWUsRUFBRSxDQUNmLFNBQWlCLEVBQ2pCLFdBQW1CLEVBQ25CLFdBQW1CLEVBQ2EsRUFBRTtZQUNsQyxNQUFNLEtBQUssR0FBRyxJQUFJLGVBQWUsQ0FBQztnQkFDaEMsU0FBUyxFQUFFLFNBQVM7Z0JBQ3BCLFdBQVcsRUFBRSxXQUFXO2dCQUN4QixXQUFXLEVBQUUsV0FBVzthQUN6QixDQUFDLENBQUE7WUFDRixPQUFPLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUN6RCxDQUFDO1FBRUQsWUFBWSxFQUFFLENBQ1osV0FBbUIsRUFDbkIsVUFBa0IsRUFDTyxFQUFFO1lBQzNCLE1BQU0sT0FBTyxHQUFHO2dCQUNkLFlBQVksRUFBRSxXQUFXO2dCQUN6QixXQUFXLEVBQUUsVUFBVTthQUN4QixDQUFBO1lBQ0QsT0FBTyxXQUFXLENBQUMsY0FBYyxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQzdDLENBQUM7UUFFRCxhQUFhLEVBQUUsQ0FDYixXQUFtQixFQUNuQixHQUFXLEVBQ3NCLEVBQUU7WUFDbkMsTUFBTSxPQUFPLEdBQUc7Z0JBQ2QsY0FBYyxFQUFFLEtBQUs7Z0JBQ3JCLFlBQVksRUFBRSxFQUFFO2dCQUNoQixNQUFNLEVBQUUsS0FBSztnQkFDYixRQUFRLEVBQUU7b0JBQ1I7d0JBQ0UsV0FBVyxFQUFFLFdBQVc7d0JBQ3hCLFFBQVEsRUFBRSxHQUFHO3FCQUNkO2lCQUNGO2FBQ0YsQ0FBQTtZQUNELE9BQU8sV0FBVyxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUMxQyxDQUFDO1FBRUQsY0FBYyxFQUFFLENBQUMsS0FBYSxFQUFvQyxFQUFFO1lBQ2xFLE1BQU0sT0FBTyxHQUFHO2dCQUNkLEtBQUssRUFBRSxLQUFLO2dCQUNaLE1BQU0sRUFBRSxLQUFLO2FBQ2QsQ0FBQTtZQUNELE9BQU8sV0FBVyxDQUFDLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQy9DLENBQUM7S0FDRixDQUFBO0FBQ0gsQ0FBQyxDQUFBO0FBekdZLFFBQUEsZUFBZSxtQkF5RzNCO0FBRUQsa0JBQWUsdUJBQWUsQ0FBQSJ9