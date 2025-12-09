"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const pg_1 = require("../../../../../lib/pg");
const parseAccessId = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
    }
    if (typeof value === "string" && value.trim().length) {
        return value.trim();
    }
    return undefined;
};
const formatCategory = (category, children) => {
    return {
        parent_id: category.parent_id,
        entity_id: category.id,
        name: category.name,
        image: category.image,
        url_path: category.url_path,
        children_count: children.length,
        children_data: children.map((child) => ({
            parent_id: child.parent_id,
            entity_id: child.id,
            name: child.name,
            image: child.image,
            url_path: child.url_path,
            children_count: 0,
            children_data: [],
            metadata: child.metadata,
        })),
        metadata: category.metadata,
    };
};
const extractImage = (metadata) => {
    if (!metadata) {
        return null;
    }
    const candidates = [
        "image",
        "image_url",
        "thumbnail",
        "hero_image",
        "logo",
    ];
    for (const key of candidates) {
        const value = metadata[key];
        if (typeof value === "string" && value.length) {
            return value;
        }
    }
    return null;
};
const extractUrlPath = (category) => {
    const metadata = category.metadata;
    if (metadata) {
        const candidates = ["url_path", "path", "slug"];
        for (const key of candidates) {
            const value = metadata[key];
            if (typeof value === "string" && value.length) {
                return value;
            }
        }
    }
    return category.handle;
};
const loadCategories = async () => {
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT
        id,
        name,
        handle,
        parent_category_id,
        metadata
      FROM product_category
      WHERE deleted_at IS NULL
        AND (is_active = TRUE OR is_active IS NULL)
      ORDER BY rank ASC NULLS LAST, name ASC
    `);
    return rows.map((row) => {
        let metadata = {};
        if (row.metadata) {
            if (typeof row.metadata === "object") {
                metadata = row.metadata;
            }
            else if (typeof row.metadata === "string") {
                try {
                    metadata = JSON.parse(row.metadata);
                }
                catch {
                    metadata = {};
                }
            }
        }
        const record = {
            id: String(row.id),
            name: typeof row.name === "string" ? row.name : "",
            handle: row.handle ? String(row.handle) : null,
            parent_id: row.parent_category_id
                ? String(row.parent_category_id)
                : null,
            image: extractImage(metadata),
            url_path: null,
            metadata,
        };
        record.url_path = extractUrlPath(record);
        return record;
    });
};
const buildCategoryIndex = (categories) => {
    const byId = new Map();
    const children = new Map();
    for (const category of categories) {
        byId.set(category.id, category);
        if (category.parent_id) {
            const list = children.get(category.parent_id) ??
                children.set(category.parent_id, []).get(category.parent_id);
            list.push(category);
        }
    }
    return { byId, children };
};
const normalizeCategoryType = (value) => {
    if (!value) {
        return "ALL";
    }
    return value.trim().toUpperCase();
};
async function POST(req, res) {
    await (0, pg_1.ensureRedingtonAccessMappingTable)();
    await (0, pg_1.ensureRedingtonSettingsTable)();
    const body = (req.body || {});
    const categoryType = normalizeCategoryType(body.category_type);
    const accessId = parseAccessId(body.access_id);
    if (!accessId) {
        return res.status(400).json({
            message: "access_id is required",
        });
    }
    const { rows: mappingRows } = await (0, pg_1.getPgPool)().query(`
      SELECT
        am.*,
        d.domain_name,
        de.domain_extention_name
      FROM redington_access_mapping am
      LEFT JOIN redington_domain d ON d.id = am.domain_id
      LEFT JOIN redington_domain_extention de ON de.id = am.domain_extention_id
      WHERE am.access_id = $1
      LIMIT 1
    `, [accessId]);
    if (!mappingRows[0]) {
        return res.status(404).json({
            message: `Access mapping ${accessId} not found`,
        });
    }
    const access = (0, pg_1.mapAccessMappingRow)(mappingRows[0]);
    const brandIds = access.brand_ids.map((id) => String(id).trim());
    const brandIdSet = new Set(brandIds);
    if (!brandIds.length) {
        return res.status(404).json({
            message: "Access mapping does not contain brand associations. Unable to return categories.",
        });
    }
    const categories = await loadCategories();
    const { children } = buildCategoryIndex(categories);
    if (categoryType === "EPP_BRAND") {
        const brands = categories
            .filter((category) => brandIdSet.has(category.id))
            .map((brand) => ({
            entity_id: brand.id,
            name: brand.name,
            image: brand.image,
            url_path: brand.url_path,
            metadata: brand.metadata,
        }));
        return res.json({
            shop_by_brand: brands,
        });
    }
    const parentCategories = categories.filter((category) => {
        const childList = children.get(category.id);
        if (!childList?.length) {
            return false;
        }
        return childList.some((child) => brandIdSet.has(child.id));
    });
    if (categoryType === "EPP_CATEGORY") {
        const response = parentCategories.map((category) => formatCategory(category, children.get(category.id) ?? []));
        return res.json({
            shop_by_category: response,
        });
    }
    if (categoryType === "ALL") {
        const response = parentCategories.map((category) => {
            const childList = (children.get(category.id) ?? []).filter((child) => brandIdSet.has(child.id));
            return formatCategory(category, childList);
        });
        return res.json({
            categories: response,
        });
    }
    return res.status(400).json({
        message: "Unsupported category_type. Expected ALL, EPP_CATEGORY, or EPP_BRAND.",
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3JlZGluZ3Rvbi9jYXRlZ29yeS1yZXN0cmljdGlvbi9jYXRlZ29yaWVzL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBNktBLG9CQXFHQztBQWhSRCw4Q0FNOEI7QUFpQjlCLE1BQU0sYUFBYSxHQUFHLENBQUMsS0FBYyxFQUFzQixFQUFFO0lBQzNELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztRQUN4RCxPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUN0QixDQUFDO0lBRUQsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3JELE9BQU8sS0FBSyxDQUFDLElBQUksRUFBRSxDQUFBO0lBQ3JCLENBQUM7SUFFRCxPQUFPLFNBQVMsQ0FBQTtBQUNsQixDQUFDLENBQUE7QUFFRCxNQUFNLGNBQWMsR0FBRyxDQUFDLFFBQXdCLEVBQUUsUUFBMEIsRUFBRSxFQUFFO0lBQzlFLE9BQU87UUFDTCxTQUFTLEVBQUUsUUFBUSxDQUFDLFNBQVM7UUFDN0IsU0FBUyxFQUFFLFFBQVEsQ0FBQyxFQUFFO1FBQ3RCLElBQUksRUFBRSxRQUFRLENBQUMsSUFBSTtRQUNuQixLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUs7UUFDckIsUUFBUSxFQUFFLFFBQVEsQ0FBQyxRQUFRO1FBQzNCLGNBQWMsRUFBRSxRQUFRLENBQUMsTUFBTTtRQUMvQixhQUFhLEVBQUUsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0QyxTQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVM7WUFDMUIsU0FBUyxFQUFFLEtBQUssQ0FBQyxFQUFF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