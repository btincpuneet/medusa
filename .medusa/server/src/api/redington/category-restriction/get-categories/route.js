"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = exports.POST = void 0;
const pg_1 = require("../../../../lib/pg");
const respond_1 = require("../../utils/respond");
const utils_1 = require("../../../../api/rest/V1/category-restriction/utils");
const resolvePayload = (req) => {
    if (req.method && req.method.toUpperCase() === "GET") {
        return (req.query || {});
    }
    return (req.body || {});
};
const handleRequest = async (req, res) => {
    const payload = resolvePayload(req);
    const categoryType = (0, utils_1.normalizeCategoryType)(payload.categoryType ?? payload.category_type);
    const accessId = payload.accessId ?? payload.access_id;
    try {
        const { topLevel, nodes } = await (0, utils_1.buildCategoryTree)();
        if (!topLevel.length) {
            return res.status(404).json({ message: "No categories configured." });
        }
        if (categoryType === "category") {
            return res.json({
                shop_by_category: topLevel.map(utils_1.toCategorySummary),
            });
        }
        if (categoryType === "brand") {
            if (!accessId) {
                return res.status(400).json({
                    message: "access_id is required for brand category requests.",
                });
            }
            const accessMapping = await (0, pg_1.findAccessMappingByAccessId)(accessId);
            if (!accessMapping) {
                return res.status(404).json({ message: "Access mapping not found." });
            }
            const brandSet = new Set(accessMapping.brand_ids ?? []);
            const brandNodes = Array.from(nodes.values()).filter((node) => (0, utils_1.matchesBrand)(node, brandSet));
            brandNodes.sort((a, b) => a.name.localeCompare(b.name));
            return res.json({
                shop_by_brand: brandNodes.map(utils_1.toCategorySummary),
            });
        }
        if (!accessId) {
            return res.status(400).json({
                message: "access_id is required for categoryType=all.",
            });
        }
        const accessMapping = await (0, pg_1.findAccessMappingByAccessId)(accessId);
        if (!accessMapping) {
            return res.status(404).json({ message: "Access mapping not found." });
        }
        const brandSet = new Set(accessMapping.brand_ids ?? []);
        const payloadTree = topLevel.map((node) => {
            const filteredChildren = node.children.filter((child) => (0, utils_1.matchesBrand)(child, brandSet));
            return (0, utils_1.toMagentoCategory)({ ...node, children: filteredChildren });
        });
        return res.json({
            children_data: payloadTree,
        });
    }
    catch (error) {
        return (0, respond_1.sendErrorResponse)(res, error, "Unable to load categories.");
    }
};
exports.POST = handleRequest;
exports.GET = handleRequest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3JlZGluZ3Rvbi9jYXRlZ29yeS1yZXN0cmljdGlvbi9nZXQtY2F0ZWdvcmllcy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFLQSwyQ0FBZ0U7QUFDaEUsaURBQXVEO0FBQ3ZELDhFQU8yRDtBQVMzRCxNQUFNLGNBQWMsR0FBRyxDQUFDLEdBQWtCLEVBQW1CLEVBQUU7SUFDN0QsSUFBSSxHQUFHLENBQUMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLEtBQUssS0FBSyxFQUFFLENBQUM7UUFDckQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFvQixDQUFBO0lBQzdDLENBQUM7SUFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLENBQW9CLENBQUE7QUFDNUMsQ0FBQyxDQUFBO0FBRUQsTUFBTSxhQUFhLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ3RFLE1BQU0sT0FBTyxHQUFHLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUNuQyxNQUFNLFlBQVksR0FBRyxJQUFBLDZCQUFxQixFQUN4QyxPQUFPLENBQUMsWUFBWSxJQUFJLE9BQU8sQ0FBQyxhQUFhLENBQzlDLENBQUE7SUFDRCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsUUFBUSxJQUFJLE9BQU8sQ0FBQyxTQUFTLENBQUE7SUFFdEQsSUFBSSxDQUFDO1FBQ0gsTUFBTSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsR0FBRyxNQUFNLElBQUEseUJBQWlCLEdBQUUsQ0FBQTtRQUVyRCxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3JCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFP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