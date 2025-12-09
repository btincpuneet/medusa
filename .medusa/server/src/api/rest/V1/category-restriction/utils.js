"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCategoryType = exports.toCategorySummary = exports.toMagentoCategory = exports.matchesBrand = exports.getEntityId = exports.buildCategoryTree = void 0;
const pg_1 = require("../../../../lib/pg");
const parseMetadata = (value) => {
    if (!value) {
        return null;
    }
    if (typeof value === "object" && !Array.isArray(value)) {
        return value;
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed.length) {
            return null;
        }
        try {
            return JSON.parse(trimmed);
        }
        catch {
            return { raw: trimmed };
        }
    }
    return null;
};
const selectMetadataString = (metadata, keys) => {
    if (!metadata) {
        return null;
    }
    for (const key of keys) {
        const value = metadata[key];
        if (typeof value === "string" && value.trim().length) {
            return value.trim();
        }
    }
    return null;
};
const selectMetadataBoolean = (metadata, keys) => {
    if (!metadata) {
        return null;
    }
    for (const key of keys) {
        const value = metadata[key];
        if (typeof value === "boolean") {
            return value;
        }
        if (typeof value === "string") {
            const normalized = value.trim().toLowerCase();
            if (["1", "true", "yes", "on"].includes(normalized)) {
                return true;
            }
            if (["0", "false", "no", "off"].includes(normalized)) {
                return false;
            }
        }
    }
    return null;
};
const fetchCategoryRows = async () => {
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT
        id,
        name,
        handle,
        parent_category_id,
        metadata,
        rank,
        COALESCE(is_active, TRUE) AS is_active,
        COALESCE(is_internal, FALSE) AS is_internal
      FROM product_category
      WHERE deleted_at IS NULL
    `);
    return rows.map((row) => ({
        id: String(row.id),
        name: String(row.name ?? ""),
        handle: row.handle ? String(row.handle) : null,
        parent_category_id: row.parent_category_id ? String(row.parent_category_id) : null,
        metadata: parseMetadata(row.metadata),
        rank: row.rank !== null && row.rank !== undefined ? Number(row.rank) : null,
        is_active: Boolean(row.is_active),
        is_internal: Boolean(row.is_internal),
    }));
};
const buildCategoryTree = async () => {
    const rows = await fetchCategoryRows();
    const nodes = new Map();
    for (const row of rows) {
        const metadata = row.metadata;
        const entityId = selectMetadataString(metadata, [
            "magento_entity_id",
            "magento_id",
            "legacy_id",
            "entity_id",
            "external_id",
        ]) || row.id;
        const node = {
            id: row.id,
            entityId,
            name: row.name,
            parentId: row.parent_category_id,
            handle: row.handle,
            image: selectMetadataString(metadata, ["image", "image_url", "thumbnail"]),
            urlPath: selectMetadataString(metadata, ["url_path", "url", "path"]) ||
                (row.handle ? `/category/${row.handle}` : null),
            rank: row.rank,
            level: 1,
            isActive: selectMetadataBoolean(metadata, ["is_active", "active"]) ?? row.is_active,
            children: [],
            metadata,
        };
        nodes.set(row.id, node);
    }
    for (const node of nodes.values()) {
        if (!node.parentId) {
            continue;
        }
        const parent = nodes.get(node.parentId);
        if (parent) {
            parent.children.push(node);
        }
    }
    const computeLevel = (current) => {
        if (!current.parentId) {
            current.level = 1;
            return 1;
        }
        const parent = nodes.get(current.parentId);
        if (!parent) {
            current.level = 1;
            return 1;
        }
        const level = computeLevel(parent) + 1;
        current.level = level;
        return level;
    };
    for (const node of nodes.values()) {
        computeLevel(node);
    }
    const topLevel = Array.from(nodes.values())
        .filter((node) => !node.parentId)
        .sort((a, b) => {
        const rankA = a.rank ?? Number.MAX_SAFE_INTEGER;
        const rankB = b.rank ?? Number.MAX_SAFE_INTEGER;
        if (rankA !== rankB) {
            return rankA - rankB;
        }
        return a.name.localeCompare(b.name);
    });
    return { nodes, topLevel };
};
exports.buildCategoryTree = buildCategoryTree;
const getEntityId = (node) => {
    return (selectMetadataString(node.metadata, [
        "magento_entity_id",
        "magento_id",
        "legacy_id",
        "entity_id",
        "external_id",
    ]) || node.entityId || node.id);
};
exports.getEntityId = getEntityId;
const matchesBrand = (node, brandSet) => {
    if (!brandSet.size) {
        return true;
    }
    const entityId = (0, exports.getEntityId)(node);
    if (brandSet.has(entityId) || brandSet.has(node.id)) {
        return true;
    }
    const metadata = node.metadata;
    if (metadata) {
        for (const value of Object.values(metadata)) {
            if (typeof value === "string" && brandSet.has(value)) {
                return true;
            }
        }
    }
    return false;
};
exports.matchesBrand = matchesBrand;
const toMagentoCategory = (node) => {
    return {
        parent_id: node.parentId ? (0, exports.getEntityId)(node) : null,
        entity_id: (0, exports.getEntityId)(node),
        name: node.name,
        image: node.image,
        url_path: node.urlPath,
        children_count: node.children.length,
        children_data: node.children.map(exports.toMagentoCategory),
    };
};
exports.toMagentoCategory = toMagentoCategory;
const toCategorySummary = (node) => ({
    entity_id: (0, exports.getEntityId)(node),
    name: node.name,
    image: node.image,
    url_path: node.urlPath,
});
exports.toCategorySummary = toCategorySummary;
const normalizeCategoryType = (value) => {
    if (!value) {
        return "all";
    }
    const normalized = value.toString().toLowerCase();
    if (["category", "categories"].includes(normalized)) {
        return "category";
    }
    if (["brand", "brands"].includes(normalized)) {
        return "brand";
    }
    return "all";
};
exports.normalizeCategoryType = normalizeCategoryType;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvY2F0ZWdvcnktcmVzdHJpY3Rpb24vdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMkNBQThDO0FBOEI5QyxNQUFNLGFBQWEsR0FBRyxDQUFDLEtBQWMsRUFBa0MsRUFBRTtJQUN2RSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDWCxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztRQUN2RCxPQUFPLEtBQWdDLENBQUE7SUFDekMsQ0FBQztJQUVELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDOUIsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFBO1FBQzVCLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDcEIsT0FBTyxJQUFJLENBQUE7UUFDYixDQUFDO1FBQ0QsSUFBSSxDQUFDO1lBQ0gsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQzVCLENBQUM7UUFBQyxNQUFNLENBQUM7WUFDUCxPQUFPLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxDQUFBO1FBQ3pCLENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTyxJQUFJLENBQUE7QUFDYixDQUFDLENBQUE7QUFFRCxNQUFNLG9CQUFvQixHQUFHLENBQzNCLFFBQXdDLEVBQ3hDLElBQWMsRUFDQyxFQUFFO0lBQ2pCLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNkLE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUNELEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7UUFDdkIsTUFBTSxLQUFLLEdBQUcs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