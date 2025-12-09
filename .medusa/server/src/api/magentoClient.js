"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMagentoB2CClient = createMagentoB2CClient;
const axios_1 = __importDefault(require("axios"));
const apilist_1 = require("./apilist");
function resolvePath(path, pathParams) {
    if (!pathParams) {
        return path;
    }
    return Object.entries(pathParams).reduce((acc, [key, value]) => {
        const token = `:${key}`;
        return acc.includes(token)
            ? acc.replace(token, encodeURIComponent(String(value)))
            : acc;
    }, path);
}
// Builds axios-backed request helpers for every Magento endpoint we catalog.
function buildEndpointHelpers(axiosInstance) {
    const client = {};
    Object.entries(apilist_1.magentoB2cEndpoints).forEach(([group, endpoints]) => {
        client[group] = {};
        endpoints.forEach((endpoint) => {
            const trimmedPath = endpoint.path.startsWith('/')
                ? endpoint.path
                : `/${endpoint.path}`;
            const requestFn = (options = {}) => {
                const { params, data, config, pathParams } = options;
                const url = resolvePath(trimmedPath, pathParams);
                return axiosInstance.request({
                    url,
                    method: endpoint.method,
                    params,
                    data,
                    ...(config || {}),
                });
            };
            requestFn.meta = { ...endpoint };
            client[group][endpoint.name] = requestFn;
        });
    });
    return client;
}
function createMagentoB2CClient({ baseUrl, axiosConfig = {}, }) {
    if (!baseUrl) {
        throw new Error('createMagentoB2CClient: "baseUrl" is required.');
    }
    const normalizedBase = baseUrl.endsWith('/')
        ? baseUrl.slice(0, -1)
        : baseUrl;
    const axiosInstance = axios_1.default.create({
        baseURL: normalizedBase,
        ...axiosConfig,
    });
    const helpers = buildEndpointHelpers(axiosInstance);
    const client = {
        request: axiosInstance.request.bind(axiosInstance),
        axiosInstance,
        ...helpers,
    };
    return client;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFnZW50b0NsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGkvbWFnZW50b0NsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQTRFQSx3REEwQkM7QUF0R0Qsa0RBQWdGO0FBQ2hGLHVDQUFpRTtBQWVqRSxTQUFTLFdBQVcsQ0FDbEIsSUFBWSxFQUNaLFVBQTRDO0lBRTVDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNoQixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUU7UUFDN0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUN4QixPQUFPLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO1lBQ3hCLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN2RCxDQUFDLENBQUMsR0FBRyxDQUFDO0lBQ1YsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ1gsQ0FBQztBQUVELDZFQUE2RTtBQUM3RSxTQUFTLG9CQUFvQixDQUFDLGFBQTRCO0lBQ3hELE1BQU0sTUFBTSxHQUF5QixFQUFFLENBQUM7SUFFeEMsTUFBTSxDQUFDLE9BQU8sQ0FBQyw2QkFBbUIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUU7UUFDakUsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUVuQixTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUU7WUFDN0IsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDO2dCQUMvQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUk7Z0JBQ2YsQ0FBQyxDQUFDLElBQUksUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO1lBRXhCLE1BQU0sU0FBUyxHQUEyQixDQUFDLFVBQTBCLEVBQUUsRUFBRSxFQUFFO2dCQUN6RSxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEdBQUcsT0FBTyxDQUFDO2dCQUVyRCxNQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUVqRCxPQUFPLGFBQWEsQ0FBQyxPQUFPLENBQUM7b0JBQzNCLEdBQUc7b0JBQ0gsTUFBTSxFQUFFLFFBQVEsQ0FBQyxNQUFNO29CQUN2QixNQUFNO29CQUNOLElBQUk7b0JBQ0osR0FBRyxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUM7aUJBQ2xCLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQztZQUVGLFNBQVMsQ0FBQyxJQUFJLEdBQUcsRUFBRSxHQUFHLFFBQVEsRUFBRSxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDO1FBQzNDLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBWUQsU0FBZ0Isc0JBQXNCLENBQUMsRUFDckMsT0FBTyxFQUNQLFdBQVcsR0FBRyxFQUFFLEdBQ1E7SUFDeEIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2IsTUFBTSxJQUFJLEtBQUssQ0FBQyxnREFBZ0QsQ0FBQyxDQUFDO0lBQ3BFLENBQUM7SUFFRCxNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQztRQUMxQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdEIsQ0FBQyxDQUFDLE9BQU8sQ0FBQztJQUVaLE1BQU0sYUFBYSxHQUFHLGVBQUssQ0FBQyxNQUFNLENBQUM7UUFDakMsT0FBTyxFQUFFLGNBQWM7UUFDdkIsR0FBRyxXQUFXO0tBQ2YsQ0FBQyxDQUFDO0lBRUgsTUFBTSxPQUFPLEdBQUcsb0JBQW9CLENBQUMsYUFBYSxDQUFDLENBQUM7SUFFcEQsTUFBTSxNQUFNLEdBQUc7UUFDYixPQUFPLEVBQUUsYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO1FBQ2xELGFBQWE7UUFDYixHQUFHLE9BQU87S0FDaUIsQ0FBQztJQUU5QixPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDIn0=