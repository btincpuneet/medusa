"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMagentoCustomerPassword = exports.fetchMagentoCustomerByEmail = void 0;
const axios_1 = __importDefault(require("axios"));
const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL || "";
const MAGENTO_ADMIN_TOKEN = process.env.MAGENTO_ADMIN_TOKEN || "";
const createMagentoAdminClient = () => {
    if (!MAGENTO_REST_BASE_URL || !MAGENTO_ADMIN_TOKEN) {
        return null;
    }
    const normalizedBase = MAGENTO_REST_BASE_URL.replace(/\/$/, "");
    return axios_1.default.create({
        baseURL: normalizedBase,
        timeout: 10000,
        headers: {
            Authorization: `Bearer ${MAGENTO_ADMIN_TOKEN}`,
            "Content-Type": "application/json",
        },
        validateStatus: () => true,
    });
};
const fetchMagentoCustomerByEmail = async (email) => {
    const client = createMagentoAdminClient();
    if (!client) {
        return null;
    }
    try {
        const response = await client.get("customers/search", {
            params: {
                "searchCriteria[filter_groups][0][filters][0][field]": "email",
                "searchCriteria[filter_groups][0][filters][0][value]": email,
                "searchCriteria[filter_groups][0][filters][0][condition_type]": "eq",
            },
        });
        if (response.status >= 200 && response.status < 300) {
            const items = Array.isArray(response.data?.items)
                ? response.data.items
                : [];
            return items[0] ?? null;
        }
    }
    catch (error) {
        console.warn("Failed to fetch Magento customer by email.", error);
    }
    return null;
};
exports.fetchMagentoCustomerByEmail = fetchMagentoCustomerByEmail;
const updateMagentoCustomerPassword = async (email, password, existing) => {
    const client = createMagentoAdminClient();
    if (!client) {
        return false;
    }
    let customer = existing ?? null;
    if (!customer?.id) {
        customer = (await (0, exports.fetchMagentoCustomerByEmail)(email)) ?? null;
    }
    if (!customer?.id) {
        console.warn(`Unable to locate Magento customer for ${email}; password sync skipped.`);
        return false;
    }
    const payload = {
        customer: {
            id: customer.id,
            email: customer.email ?? email,
            firstname: customer.firstname ?? "",
            lastname: customer.lastname ?? "",
            website_id: customer.website_id ?? 1,
        },
        password,
    };
    try {
        const response = await client.put(`customers/${customer.id}`, payload);
        if (response.status >= 200 && response.status < 300) {
            return true;
        }
        console.warn(`Magento password update failed for ${email}:`, response.status, response.data);
    }
    catch (error) {
        console.warn("Magento password update threw an error.", error);
    }
    return false;
};
exports.updateMagentoCustomerPassword = updateMagentoCustomerPassword;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFnZW50by1jdXN0b21lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9hcGkvdXRpbHMvbWFnZW50by1jdXN0b21lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxrREFBNEM7QUFFNUMsTUFBTSxxQkFBcUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixJQUFJLEVBQUUsQ0FBQTtBQUNyRSxNQUFNLG1CQUFtQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLElBQUksRUFBRSxDQUFBO0FBRWpFLE1BQU0sd0JBQXdCLEdBQUcsR0FBeUIsRUFBRTtJQUMxRCxJQUFJLENBQUMscUJBQXFCLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQ25ELE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUVELE1BQU0sY0FBYyxHQUFHLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFFL0QsT0FBTyxlQUFLLENBQUMsTUFBTSxDQUFDO1FBQ2xCLE9BQU8sRUFBRSxjQUFjO1FBQ3ZCLE9BQU8sRUFBRSxLQUFLO1FBQ2QsT0FBTyxFQUFFO1lBQ1AsYUFBYSxFQUFFLFVBQVUsbUJBQW1CLEVBQUU7WUFDOUMsY0FBYyxFQUFFLGtCQUFrQjtTQUNuQztRQUNELGNBQWMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJO0tBQzNCLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQTtBQUVNLE1BQU0sMkJBQTJCLEdBQUcsS0FBSyxFQUFFLEtBQWEsRUFBRSxFQUFFO0lBQ2pFLE1BQU0sTUFBTSxHQUFHLHdCQUF3QixFQUFFLENBQUE7SUFDekMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ1osT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRUQsSUFBSSxDQUFDO1FBQ0gsTUFBTSxRQUFRLEdBQUcsTUFBTSxNQUFNLENBQUMsR0FBRyxDQUFDLGtCQUFr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