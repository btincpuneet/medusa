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
const loadCategoryWithChildren = async (parentId) => {
    const { rows: parentRows } = await (0, pg_1.getPgPool)().query(`
      SELECT
        id,
        name,
        handle,
        metadata
      FROM product_category
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `, [parentId]);
    if (!parentRows[0]) {
        return null;
    }
    const parentMetadata = typeof parentRows[0].metadata === "object" && parentRows[0].metadata !== null
        ? parentRows[0].metadata
        : (() => {
            if (typeof parentRows[0].metadata === "string") {
                try {
                    return JSON.parse(parentRows[0].metadata);
                }
                catch {
                    return {};
                }
            }
            return {};
        })();
    const { rows: childRows } = await (0, pg_1.getPgPool)().query(`
      SELECT
        id,
        name,
        handle,
        metadata
      FROM product_category
      WHERE parent_category_id = $1
        AND deleted_at IS NULL
        AND (is_active = TRUE OR is_active IS NULL)
      ORDER BY rank ASC NULLS LAST, name ASC
    `, [parentId]);
    const children = childRows.map((row) => {
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
        return {
            entity_id: String(row.id),
            name: String(row.name ?? ""),
            image: typeof metadata.image === "string"
                ? metadata.image
                : typeof metadata.image_url === "string"
                    ? metadata.image_url
                    : null,
            url_path: typeof metadata.url_path === "string"
                ? metadata.url_path
                : typeof row.handle === "string"
                    ? row.handle
                    : null,
            metadata,
        };
    });
    return {
        entity_id: String(parentRows[0].id),
        name: String(parentRows[0].name ?? ""),
        children_data: children,
        metadata: parentMetadata,
    };
};
async function POST(req, res) {
    await (0, pg_1.ensureRedingtonAccessMappingTable)();
    await (0, pg_1.ensureRedingtonSettingsTable)();
    const body = (req.body || {});
    const accessId = parseAccessId(body.access_id);
    if (!accessId) {
        return res.status(400).json({
            message: "access_id is required",
        });
    }
    const { rows: accessRows } = await (0, pg_1.getPgPool)().query(`
      SELECT id
      FROM redington_access_mapping
      WHERE access_id = $1
      LIMIT 1
    `, [accessId]);
    if (!accessRows[0]) {
        return res.status(404).json({
            message: `Access mapping ${accessId} not found`,
        });
    }
    const config = await (0, pg_1.getRedingtonSetting)("category_restriction_promotion_root");
    const rootId = config?.promotion_root_category_id;
    if (!rootId) {
        return res.status(404).json({
            message: "Promotion root category is not configured. Use the admin config endpoint to set promotion_root_category_id.",
        });
    }
    const category = await loadCategoryWithChildren(rootId);
    if (!category) {
        return res.status(404).json({
            message: "Configured promotion root category was not found.",
        });
    }
    return res.json({
        promotion_category: category,
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3JlZGluZ3Rvbi9jYXRlZ29yeS1yZXN0cmljdGlvbi9wcm9tb3Rpb25zL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBa0hBLG9CQWtEQztBQWxLRCw4Q0FLOEI7QUFNOUIsTUFBTSxhQUFhLEdBQUcsQ0FBQyxLQUFjLEVBQXNCLEVBQUU7SUFDM0QsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ3hELE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQ3RCLENBQUM7SUFDRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDckQsT0FBTyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDckIsQ0FBQztJQUNELE9BQU8sU0FBUyxDQUFBO0FBQ2xCLENBQUMsQ0FBQTtBQUVELE1BQU0sd0JBQXdCLEdBQUcsS0FBSyxFQUFFLFFBQWdCLEVBQUUsRUFBRTtJQUMxRCxNQUFNLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxHQUFHLE1BQU0sSUFBQSxjQUFTLEdBQUUsQ0FBQyxLQUFLLENBQ2xEOzs7Ozs7Ozs7O0tBVUMsRUFDRCxDQUFDLFFBQVEsQ0FBQyxDQUNYLENBQUE7SUFFRCxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDbkIsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRUQsTUFBTSxjQUFjLEdBQ2xCLE9BQU8sVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsS0FBSyxRQUFRLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsS0FBSyxJQUFJO1FBQzNFLENBQUMsQ0FBQyxVQUFV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