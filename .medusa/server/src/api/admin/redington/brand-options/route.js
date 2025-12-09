"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const pg_1 = require("../../../../lib/pg");
const parseMetadata = (input) => {
    if (!input) {
        return null;
    }
    if (typeof input === "object" && !Array.isArray(input)) {
        return input;
    }
    if (typeof input === "string") {
        try {
            const parsed = JSON.parse(input);
            if (parsed && typeof parsed === "object") {
                return parsed;
            }
        }
        catch {
            return null;
        }
    }
    return null;
};
const toStringOrNull = (value) => {
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : null;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
    }
    return null;
};
const loadCollections = async () => {
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT
        id,
        title,
        metadata
      FROM product_collection
      WHERE deleted_at IS NULL
        AND metadata IS NOT NULL
    `);
    const normalized = [];
    for (const row of rows) {
        const metadata = parseMetadata(row.metadata);
        if (!metadata) {
            continue;
        }
        const magentoId = toStringOrNull(metadata.magento_id ?? metadata.magentoId ?? metadata.magentoID);
        if (!magentoId) {
            continue;
        }
        const parentMagentoId = toStringOrNull(metadata.parent_id ?? metadata.parentId ?? metadata.parentID);
        const levelValue = metadata.level;
        const level = typeof levelValue === "number" && Number.isFinite(levelValue)
            ? levelValue
            : null;
        normalized.push({
            collection_id: row.id,
            title: typeof row.title === "string" ? row.title.trim() : "",
            magento_id: magentoId,
            parent_magento_id: parentMagentoId,
            level,
        });
    }
    return normalized;
};
const buildBrandOptions = (collections) => {
    const byMagentoId = new Map();
    const childrenByMagentoId = new Map();
    for (const entry of collections) {
        byMagentoId.set(entry.magento_id, entry);
        if (entry.parent_magento_id) {
            const list = childrenByMagentoId.get(entry.parent_magento_id) ??
                childrenByMagentoId
                    .set(entry.parent_magento_id, [])
                    .get(entry.parent_magento_id);
            list.push(entry);
        }
    }
    const options = [];
    for (const entry of collections) {
        const isLeaf = !childrenByMagentoId.has(entry.magento_id);
        if (!isLeaf) {
            continue;
        }
        const parent = entry.parent_magento_id && byMagentoId.has(entry.parent_magento_id)
            ? byMagentoId.get(entry.parent_magento_id)
            : null;
        const grandParent = parent?.parent_magento_id &&
            byMagentoId.has(parent.parent_magento_id)
            ? byMagentoId.get(parent.parent_magento_id)
            : null;
        const normalizedName = entry.title || entry.magento_id;
        const normalizedParentName = parent?.title || "";
        const normalizedGroupName = grandParent?.title || "";
        let label = normalizedName;
        if (normalizedParentName) {
            label = `${normalizedParentName} - ${normalizedName}`.trim();
        }
        const path = [
            normalizedGroupName,
            normalizedParentName,
            normalizedName,
        ].filter((segment) => segment && segment.length);
        options.push({
            value: entry.magento_id,
            label,
            name: normalizedName,
            parent_name: normalizedParentName || null,
            group_name: normalizedGroupName || null,
            path,
            category_id: entry.collection_id,
        });
    }
    options.sort((a, b) => a.label.localeCompare(b.label));
    const deduped = new Map();
    for (const option of options) {
        const key = option.value.trim();
        if (!key.length || deduped.has(key)) {
            continue;
        }
        deduped.set(key, option);
    }
    return Array.from(deduped.values());
};
async function GET(_req, res) {
    const collections = await loadCollections();
    const options = buildBrandOptions(collections);
    return res.json({
        brands: options,
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9icmFuZC1vcHRpb25zL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBK0xBLGtCQU9DO0FBcE1ELDJDQUE4QztBQTBCOUMsTUFBTSxhQUFhLEdBQUcsQ0FBQyxLQUFjLEVBQWtDLEVBQUU7SUFDdkUsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ1gsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRUQsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDdkQsT0FBTyxLQUFnQyxDQUFBO0lBQ3pDLENBQUM7SUFFRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQzlCLElBQUksQ0FBQztZQUNILE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDaEMsSUFBSSxNQUFNLElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3pDLE9BQU8sTUFBaUMsQ0FBQTtZQUMxQyxDQUFDO1FBQ0gsQ0FBQztRQUFDLE1BQU0sQ0FBQztZQUNQLE9BQU8sSUFBSSxDQUFBO1FBQ2IsQ0FBQztJQUNILENBQUM7SUFFRCxPQUFPLElBQUksQ0FBQTtBQUNiLENBQUMsQ0FBQTtBQUVELE1BQU0sY0FBYyxHQUFHLENBQUMsS0FBYyxFQUFFLEVBQUU7SUFDeEMsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztRQUM5QixNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUE7UUFDNUIsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQTtJQUN4QyxDQUFD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