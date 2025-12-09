"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const magentoClient_1 = require("../../magentoClient");
const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL;
const MAGENTO_ADMIN_TOKEN = process.env.MAGENTO_ADMIN_TOKEN;
function getQueryParam(value) {
    if (Array.isArray(value)) {
        return value[0] ?? "";
    }
    return typeof value === "string" ? value : "";
}
function ensureMagentoConfig() {
    if (!MAGENTO_REST_BASE_URL) {
        throw new Error("MAGENTO_REST_BASE_URL env var is required to query Magento orders.");
    }
    if (!MAGENTO_ADMIN_TOKEN) {
        throw new Error("MAGENTO_ADMIN_TOKEN env var is required to query Magento orders.");
    }
}
async function GET(req, res) {
    try {
        ensureMagentoConfig();
    }
    catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Magento configuration missing",
        });
    }
    const page = Number.parseInt(getQueryParam(req.query.page) || "1", 10) || 1;
    const pageSize = Number.parseInt(getQueryParam(req.query.page_size) || "20", 10) || 20;
    const status = getQueryParam(req.query.status);
    const email = getQueryParam(req.query.customer_email);
    const incrementId = getQueryParam(req.query.increment_id);
    const searchParams = {
        "searchCriteria[currentPage]": page,
        "searchCriteria[pageSize]": pageSize,
        "searchCriteria[sortOrders][0][field]": "created_at",
        "searchCriteria[sortOrders][0][direction]": "DESC",
    };
    let filterGroupIndex = 0;
    if (status) {
        searchParams[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][field]`] = "status";
        searchParams[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][value]`] = status;
        searchParams[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][condition_type]`] = "eq";
        filterGroupIndex += 1;
    }
    if (email) {
        searchParams[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][field]`] = "customer_email";
        searchParams[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][value]`] = email;
        searchParams[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][condition_type]`] = "eq";
        filterGroupIndex += 1;
    }
    if (incrementId) {
        searchParams[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][field]`] = "increment_id";
        searchParams[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][value]`] = incrementId;
        searchParams[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][condition_type]`] = "eq";
    }
    const magentoClient = (0, magentoClient_1.createMagentoB2CClient)({
        baseUrl: MAGENTO_REST_BASE_URL,
        axiosConfig: {
            headers: {
                Authorization: `Bearer ${MAGENTO_ADMIN_TOKEN}`,
                "Content-Type": "application/json",
            },
        },
    });
    try {
        const response = await magentoClient.orders.listOrders({ params: searchParams });
        const { data } = response;
        return res.json({
            page,
            pageSize,
            totalCount: data?.total_count ?? 0,
            orders: data?.items ?? [],
            raw: data,
        });
    }
    catch (error) {
        const message = error instanceof Error
            ? error.message
            : "Unexpected error while fetching Magento orders";
        return res.status(502).json({
            message,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL21hZ2VudG8tb3JkZXJzL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBd0JBLGtCQTJFQztBQWxHRCx1REFBNkQ7QUFFN0QsTUFBTSxxQkFBcUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDO0FBQ2hFLE1BQU0sbUJBQW1CLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQztBQUU1RCxTQUFTLGFBQWEsQ0FBQyxLQUFjO0lBQ25DLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ3pCLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN4QixDQUFDO0lBRUQsT0FBTyxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ2hELENBQUM7QUFFRCxTQUFTLG1CQUFtQjtJQUMxQixJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUMzQixNQUFNLElBQUksS0FBSyxDQUFDLG9FQUFvRSxDQUFDLENBQUM7SUFDeEYsQ0FBQztJQUVELElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQ3pCLE1BQU0sSUFBSSxLQUFLLENBQUMsa0VBQWtFLENBQUMsQ0FBQztJQUN0RixDQUFDO0FBQ0gsQ0FBQztBQUVNLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxJQUFJLENBQUM7UUFDSCxtQkFBbUIsRUFBRSxDQUFDO0lBQ3hCLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUsS0FBSyxZQUFZLEtBQUss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