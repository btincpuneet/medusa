"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const core_flows_1 = require("@medusajs/core-flows");
const normalizeMagentoFilter = (value) => {
    if (!value) {
        return undefined;
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed.length) {
            return undefined;
        }
        return { $ilike: `%${trimmed}%` };
    }
    if (Array.isArray(value)) {
        const sanitized = value
            .map((entry) => typeof entry === "string" ? entry.trim() : entry?.value?.trim())
            .filter((entry) => Boolean(entry && entry.length));
        if (!sanitized.length) {
            return undefined;
        }
        return { $in: sanitized };
    }
    if (typeof value === "object") {
        const candidate = typeof value.value === "string" ? value.value.trim() : undefined;
        if (!candidate) {
            return undefined;
        }
        if (value.operator === "$ilike") {
            return { $ilike: candidate };
        }
        if (value.operator === "$eq" || value.operator === "eq") {
            return { $in: [candidate] };
        }
        return { $ilike: `%${candidate}%` };
    }
    return undefined;
};
const GET = async (req, res) => {
    const filters = {
        ...req.filterableFields,
        is_draft_order: false,
    };
    if ("magento_order_id" in filters) {
        const magentoFilter = normalizeMagentoFilter(filters.magento_order_id);
        if (magentoFilter) {
            filters.magento_order_id = magentoFilter;
        }
        else {
            delete filters.magento_order_id;
        }
    }
    const workflow = (0, core_flows_1.getOrdersListWorkflow)(req.scope);
    const { result } = await workflow.run({
        input: {
            fields: req.queryConfig.fields,
            variables: {
                filters,
                ...req.queryConfig.pagination,
            },
        },
    });
    const { rows, metadata } = result;
    res.json({
        orders: rows,
        count: metadata.count,
        offset: metadata.skip,
        limit: metadata.take,
    });
};
exports.GET = GET;
// The v2 core exports POST differently; skip re-export to avoid type issues.
// Exporting nothing keeps our GET override only.
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL29yZGVycy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxREFBNEQ7QUFRNUQsTUFBTSxzQkFBc0IsR0FBRyxDQUM3QixLQUF5QixFQUliLEVBQUU7SUFDZCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDWCxPQUFPLFNBQVMsQ0FBQTtJQUNsQixDQUFDO0lBRUQsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztRQUM5QixNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUE7UUFDNUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNwQixPQUFPLFNBQVMsQ0FBQTtRQUNsQixDQUFDO1FBQ0QsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUE7SUFDbkMsQ0FBQztJQUVELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ3pCLE1BQU0sU0FBUyxHQUFHLEtBQUs7YUFDcEIsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FDYixPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FDaEU7YUFDQSxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQW1CLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO1FBRXJFLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDdEIsT0FBTyxTQUFTLENBQUE7UUFDbEIsQ0FBQztRQUVELE9BQU8sRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLENBQUE7SUFDM0IsQ0FBQztJQUVELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDOUIsTUFBTSxTQUFTLEdBQ2IsT0FBTyxLQUFLLENBQUMsS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFBO1FBQ2xFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNmLE9BQU8sU0FBUyxDQUFBO1FBQ2xCLENBQUM7UUFDRCxJQUFJLEtBQUssQ0FBQyxRQUFRLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDaEMsT0FBTyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQTtRQUM5QixDQUFDO1FBQ0QsSUFBSSxLQUFLLENBQUMsUUFBUSxLQUFLLEtBQUssSUFBSSxLQUFLLENBQUMsUUFBUSxLQUFLLElBQUksRUFBRSxDQUFDO1lBQ3hELE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFBO1FBQzdCLENBQUM7UUFDRCxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQTtJQUNyQyxDQUFDO0lBRUQsT0FBTyxTQUFTLENBQUE7QUFDbEIsQ0FBQyxDQUFBO0FBRU0sTUFBTSxHQUFHLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ25FLE1BQU0sT0FBTyxHQUE0QjtRQUN2QyxHQUFHLEdBQUcsQ0FBQyxnQkFBZ0I7UUFDdkIsY0FBYyxFQUFFLEtBQUs7S0FDdEIsQ0FBQTtJQUVELElBQUksa0JBQWtCLElBQUksT0FBTyxFQUFFLENBQUM7UUFDbEMsTUFBTSxhQUFhLEdBQUcsc0JBQXNCLENBQzFDLE9BQU8sQ0FBQyxnQkFBc0MsQ0FDL0MsQ0FBQTtRQUNELElBQUksYUFBYSxFQUFFLENBQUM7WUFDbEIsT0FBTyxDQUFDLGdCQUFnQixHQUFHLGFBQWEsQ0FBQTtRQUMxQyxDQUFDO2FBQU0sQ0FBQztZQUNOLE9BQU8sT0FBTyxDQUFDLGdCQUFnQixDQUFBO1FBQ2pDLENBQUM7SUFDSCxDQUFDO0lBRUQsTUFBTSxRQUFRLEdBQUcsSUFBQSxrQ0FBcUIsRUFBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDakQsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU0sUUFBUSxDQUFDLEdBQUcsQ0FBQztRQUNwQyxLQUFLLEVBQUU7WUFDTCxNQUFNLEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxNQUFNO1lBQzlCLFNBQVMsRUFBRTtnQkFDVCxPQUFPO2dCQUNQLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxVQUFVO2FBQzlCO1NBQ0Y7S0FDRixDQUFDLENBQUE7SUFFRixNQUFNLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxHQUFHLE1BQWEsQ0FBQTtJQUV4QyxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQ1AsTUFBTSxFQUFFLElBQUk7UUFDWixLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUs7UUFDckIsTUFBTSxFQUFFLFFBQVEsQ0FBQyxJQUFJO1FBQ3JCLEtBQUssRUFBRSxRQUFRLENBQUMsSUFBSTtLQUNyQixDQUFDLENBQUE7QUFDSixDQUFDLENBQUE7QUFwQ1ksUUFBQSxHQUFHLE9Bb0NmO0FBRUQsNkVBQTZFO0FBQzdFLGlEQUFpRCJ9