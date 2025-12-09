"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const pg_1 = require("../../../lib/pg");
const respond_1 = require("../utils/respond");
const STATUS_FILTER_KEY = "searchCriteria[filter_groups][0][filters][0][value]";
const normalizeStatus = (value) => {
    if (value === null || value === undefined) {
        return undefined;
    }
    const normalized = String(value).trim().toLowerCase();
    if (!normalized.length) {
        return undefined;
    }
    if (["1", "true", "yes", "active", "enabled"].includes(normalized)) {
        return true;
    }
    if (["0", "false", "no", "inactive", "disabled"].includes(normalized)) {
        return false;
    }
    return undefined;
};
const parseStatusFilter = (query) => {
    if (!query) {
        return undefined;
    }
    const direct = normalizeStatus(query.status ?? query.value);
    if (direct !== undefined) {
        return direct;
    }
    const criteriaValue = query[STATUS_FILTER_KEY] || query[STATUS_FILTER_KEY.toLowerCase()];
    return normalizeStatus(criteriaValue);
};
const buildSearchCriteria = (status) => {
    if (status === undefined) {
        return { filter_groups: [] };
    }
    return {
        filter_groups: [
            {
                filters: [
                    {
                        field: "status",
                        value: status ? "yes" : "no",
                        condition_type: "eq",
                    },
                ],
            },
        ],
    };
};
const serializeVideo = (video) => ({
    homevideo_id: video.id,
    title: video.title,
    url: video.url,
    status: video.status ? "yes" : "no",
    created_at: video.created_at,
    updateAt: video.updated_at,
});
const GET = async (req, res) => {
    try {
        const statusFilter = parseStatusFilter(req.query || {});
        const videos = await (0, pg_1.listHomeVideos)();
        const filtered = statusFilter === undefined
            ? videos
            : videos.filter((video) => video.status === statusFilter);
        return res.json({
            items: filtered.map(serializeVideo),
            total_count: filtered.length,
            search_criteria: buildSearchCriteria(statusFilter),
        });
    }
    catch (error) {
        return (0, respond_1.sendErrorResponse)(res, error, "Unable to load home videos.");
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3JlZGluZ3Rvbi9ob21lLXZpZGVvcy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFLQSx3Q0FBZ0Q7QUFDaEQsOENBQW9EO0FBRXBELE1BQU0saUJBQWlCLEdBQUcscURBQXFELENBQUE7QUFFL0UsTUFBTSxlQUFlLEdBQUcsQ0FBQyxLQUFjLEVBQXVCLEVBQUU7SUFDOUQsSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUMxQyxPQUFPLFNBQVMsQ0FBQTtJQUNsQixDQUFDO0lBQ0QsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFBO0lBQ3JELElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDdkIsT0FBTyxTQUFTLENBQUE7SUFDbEIsQ0FBQztJQUNELElBQUksQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7UUFDbkUsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBQ0QsSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztRQUN0RSxPQUFPLEtBQUssQ0FBQTtJQUNkLENBQUM7SUFDRCxPQUFPLFNBQVMsQ0FBQTtBQUNsQixDQUFDLENBQUE7QUFFRCxNQUFNLGlCQUFpQixHQUFHLENBQUMsS0FBMEIsRUFBRSxFQUFFO0lBQ3ZELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNYLE9BQU8sU0FBUyxDQUFBO0lBQ2xCLENBQUM7SUFDRCxNQUFNLE1BQU0s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