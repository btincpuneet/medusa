"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Magento → Medusa product migration.
 * Usage: MYSQL_HOST=127.0.0.1 MYSQL_USER=root MYSQL_PASSWORD=secret MYSQL_DB=magento \
 *        MEDUSA_BACKEND_URL=http://localhost:9000 MEDUSA_API_TOKEN=sk_xxx \
 *        pnpm tsx scripts/migrate-magento-products.ts
 */
require("dotenv/config");
const promise_1 = __importDefault(require("mysql2/promise"));
const MYSQL_HOST = process.env.MYSQL_HOST || "127.0.0.1";
const MYSQL_PORT = Number(process.env.MYSQL_PORT || "3306");
const MYSQL_USER = process.env.MYSQL_USER;
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || "";
const MYSQL_DB = process.env.MYSQL_DB;
const MAGENTO_STORE_ID = Number(process.env.MAGENTO_STORE_ID || "0");
const MAGENTO_MEDIA_BASE_URL = process.env.MAGENTO_MEDIA_BASE_URL?.replace(/\/+$/, "") ?? "";
const MEDUSA_BACKEND_URL = (process.env.MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/+$/, "");
const MEDUSA_API_TOKEN = process.env.MEDUSA_API_TOKEN;
if (!MYSQL_USER || !MYSQL_DB) {
    console.error("❌ Missing MySQL config. Set MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD and MYSQL_DB.");
    process.exit(1);
}
if (!MEDUSA_API_TOKEN) {
    console.error("❌ MEDUSA_API_TOKEN is required to call the Admin API.");
    process.exit(1);
}
const STORE_PRIORITY = Array.from(new Set([Number.isFinite(MAGENTO_STORE_ID) ? MAGENTO_STORE_ID : 0, 0]));
const ADMIN_BASE = `${MEDUSA_BACKEND_URL}/admin`;
const mysqlPool = promise_1.default.createPool({
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DB,
    waitForConnections: true,
    connectionLimit: 10,
});
const medusaDefaultHeaders = {
    Authorization: `Bearer ${MEDUSA_API_TOKEN}`,
    "x-medusa-access-token": MEDUSA_API_TOKEN,
    "Content-Type": "application/json",
};
async function main() {
    console.log("▶ Loading Magento catalog…");
    const [productEntityTypeId, categoryEntityTypeId] = await Promise.all([
        getEntityTypeId("catalog_product"),
        getEntityTypeId("catalog_category"),
    ]);
    if (!productEntityTypeId) {
        throw new Error("Magento entity_type_id for products not found.");
    }
    if (!categoryEntityTypeId) {
        throw new Error("Magento entity_type_id for categories not found.");
    }
    const attributeDefinitions = await loadAttributeDefinitions(productEntityTypeId);
    const attributeIdsByType = groupAttributeIdsByType(attributeDefinitions);
    const products = await loadProducts();
    const attributesByProduct = await loadAttributeValues(attributeDefinitions, attributeIdsByType, products);
    const categoryNames = await loadCategoryNames(categoryEntityTypeId);
    const categoriesByProduct = await loadProductCategories(categoryNames);
    const mediaByProduct = await loadProductMedia();
    console.log("▶ Indexing existing Medusa products…");
    const existingBySku = await indexExistingMedusaProducts();
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    for (const row of products) {
        const sku = (row.sku || "").trim();
        if (!sku) {
            skipped++;
            continue;
        }
        const attributes = attributesByProduct.get(row.entity_id) ?? [];
        const categories = categoriesByProduct.get(row.entity_id) ?? [];
        const media = mediaByProduct.get(row.entity_id) ?? [];
        const magentoPayload = buildMagentoMetadata(row, attributes, categories, media);
        const medusaHandle = slugify((magentoPayload.handle || sku || `magento-${row.entity_id}`).toString());
        const productTitle = findAttributeValue(attributes, "name") ||
            sku ||
            `Magento ${row.entity_id}`;
        const descriptionHtml = findAttributeValue(attributes, "description") || "";
        const statusValue = findAttributeValue(attributes, "status");
        const medusaStatus = statusValue === 1 || statusValue === "1" || statusValue === true
            ? "published"
            : "draft";
        const existing = existingBySku.get(sku.toLowerCase());
        try {
            if (existing) {
                await updateMedusaProduct(existing.id, magentoPayload, existing.metadata);
                existing.metadata = {
                    ...(existing.metadata ?? {}),
                    magento: magentoPayload,
                };
                updated++;
                console.log(`↺ Updated ${sku}`);
            }
            else {
                const createdProduct = await createMedusaProduct({
                    title: productTitle,
                    handle: medusaHandle,
                    subtitle: magentoPayload.subtitle,
                    description: stripHtml(descriptionHtml),
                    status: medusaStatus,
                    metadata: {
                        magento: magentoPayload,
                    },
                });
                created++;
                console.log(`➕ Created ${sku}`);
                if (createdProduct) {
                    existingBySku.set(sku.toLowerCase(), createdProduct);
                }
            }
            if (existing) {
                existingBySku.set(sku.toLowerCase(), {
                    ...existing,
                    metadata: { magento: magentoPayload },
                });
            }
        }
        catch (error) {
            failed++;
            console.error(`❌ ${sku}:`, error.message);
        }
    }
    console.log(`\n✅ Migration finished. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}, Failed: ${failed}.`);
    await mysqlPool.end();
}
async function getEntityTypeId(code) {
    const [rows] = await mysqlPool.query(`SELECT entity_type_id FROM eav_entity_type WHERE entity_type_code = ? LIMIT 1`, [code]);
    return rows[0]?.entity_type_id;
}
async function loadAttributeDefinitions(entityTypeId) {
    const [rows] = await mysqlPool.query(`SELECT attribute_id, attribute_code, backend_type, frontend_label
     FROM eav_attribute
     WHERE entity_type_id = ?`, [entityTypeId]);
    return rows
        .map((row) => ({
        attribute_id: Number(row.attribute_id),
        attribute_code: row.attribute_code,
        backend_type: (row.backend_type || "varchar"),
        label: row.frontend_label ?? null,
    }))
        .filter((row) => !!row.attribute_id && !!row.attribute_code);
}
function groupAttributeIdsByType(definitions) {
    const map = new Map();
    for (const def of definitions) {
        if (!map.has(def.backend_type)) {
            map.set(def.backend_type, []);
        }
        map.get(def.backend_type).push(def.attribute_id);
    }
    return map;
}
async function loadProducts() {
    const [rows] = await mysqlPool.query(`SELECT entity_id, sku, type_id, created_at, updated_at
     FROM catalog_product_entity
     ORDER BY entity_id ASC`);
    return rows.map((row) => ({
        entity_id: Number(row.entity_id),
        sku: row.sku,
        type_id: row.type_id ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at,
    }));
}
async function loadAttributeValues(definitions, byType, products) {
    const results = new Map();
    const pushAttribute = (entityId, attr) => {
        if (!results.has(entityId)) {
            results.set(entityId, []);
        }
        results.get(entityId).push(attr);
    };
    const tables = [
        { backend_type: "varchar", table: "catalog_product_entity_varchar" },
        { backend_type: "int", table: "catalog_product_entity_int" },
        { backend_type: "text", table: "catalog_product_entity_text" },
        { backend_type: "decimal", table: "catalog_product_entity_decimal" },
        { backend_type: "datetime", table: "catalog_product_entity_datetime" },
    ];
    for (const table of tables) {
        const ids = byType.get(table.backend_type) ?? [];
        if (!ids.length) {
            continue;
        }
        await loadAttributeGroup(ids, table.table, table.backend_type, definitions, pushAttribute);
    }
    // Include static attributes such as SKU (already in main entity).
    for (const product of products) {
        const attr = {
            attribute_code: "sku",
            backend_type: "static",
            label: "SKU",
            value: product.sku,
        };
        pushAttribute(product.entity_id, attr);
    }
    for (const [, list] of results) {
        list.sort((a, b) => a.attribute_code.localeCompare(b.attribute_code));
    }
    return results;
}
async function loadAttributeGroup(attributeIds, tableName, backendType, definitions, pushAttribute) {
    const chunks = chunk(attributeIds, 200);
    const storeIds = STORE_PRIORITY.length ? STORE_PRIORITY : [0];
    for (const chunkIds of chunks) {
        const placeholders = chunkIds.map(() => "?").join(",");
        const storePlaceholders = storeIds.map(() => "?").join(",");
        const [rows] = await mysqlPool.query(`SELECT entity_id, attribute_id, value, store_id
       FROM ${tableName}
       WHERE attribute_id IN (${placeholders})
         AND store_id IN (${storePlaceholders})`, [...chunkIds, ...storeIds]);
        const bestForAttribute = new Map();
        for (const row of rows) {
            const key = `${row.entity_id}:${row.attribute_id}`;
            const rank = storeRank(row.store_id);
            const existing = bestForAttribute.get(key);
            if (!existing || rank < existing.rank) {
                bestForAttribute.set(key, { row, rank });
            }
        }
        for (const entry of bestForAttribute.values()) {
            const entityId = Number(entry.row.entity_id);
            const attributeId = Number(entry.row.attribute_id);
            const def = definitions.find((d) => d.attribute_id === attributeId);
            if (!def || !entityId) {
                continue;
            }
            const value = convertAttributeValue(entry.row.value, backendType);
            pushAttribute(entityId, {
                attribute_code: def.attribute_code,
                backend_type: backendType,
                label: def.label,
                value,
                magento_attribute_id: def.attribute_id,
            });
        }
    }
}
async function loadCategoryNames(entityTypeId) {
    const [rows] = await mysqlPool.query(`SELECT attribute_id FROM eav_attribute
     WHERE entity_type_id = ? AND attribute_code = 'name'
     LIMIT 1`, [entityTypeId]);
    const attributeId = rows[0]?.attribute_id;
    if (!attributeId) {
        return new Map();
    }
    const storeIds = STORE_PRIORITY.length ? STORE_PRIORITY : [0];
    const placeholders = storeIds.map(() => "?").join(",");
    const [values] = await mysqlPool.query(`SELECT entity_id, value, store_id
     FROM catalog_category_entity_varchar
     WHERE attribute_id = ?
       AND store_id IN (${placeholders})`, [attributeId, ...storeIds]);
    const names = new Map();
    const bestRank = new Map();
    for (const row of values) {
        const entityId = Number(row.entity_id);
        if (!entityId) {
            continue;
        }
        const rank = storeRank(row.store_id);
        const currentRank = bestRank.get(entityId);
        if (typeof currentRank === "number" && currentRank <= rank) {
            continue;
        }
        names.set(entityId, row.value ?? "");
        bestRank.set(entityId, rank);
    }
    return names;
}
async function loadProductCategories(categoryNames) {
    const [rows] = await mysqlPool.query(`SELECT product_id, category_id, position
     FROM catalog_category_product`);
    const categories = new Map();
    for (const row of rows) {
        const productId = Number(row.product_id);
        const categoryId = Number(row.category_id);
        if (!productId || !categoryId) {
            continue;
        }
        const list = categories.get(productId) ?? [];
        list.push({
            id: categoryId,
            name: categoryNames.get(categoryId) ?? null,
            magento_id: categoryId,
            position: Number(row.position) || list.length,
        });
        categories.set(productId, list);
    }
    for (const [productId, list] of categories) {
        const normalized = list
            .sort((a, b) => {
            const posA = a.position ?? 0;
            const posB = b.position ?? 0;
            return posA - posB;
        })
            .map((item) => {
            const { position: _pos, ...rest } = item ?? {};
            return rest;
        });
        categories.set(productId, normalized);
    }
    return categories;
}
async function loadProductMedia() {
    const mediaMap = new Map();
    const hasLinkTable = await tableExists("catalog_product_entity_media_gallery_value_to_entity");
    const storeIds = STORE_PRIORITY.length ? STORE_PRIORITY : [0];
    const storePlaceholders = storeIds.map(() => "?").join(",");
    const query = hasLinkTable
        ? `SELECT l.entity_id, mg.value_id, mg.value, mg.media_type, mgv.label, mgv.position, mgv.store_id
       FROM catalog_product_entity_media_gallery AS mg
       INNER JOIN catalog_product_entity_media_gallery_value_to_entity AS l
         ON l.value_id = mg.value_id
       LEFT JOIN catalog_product_entity_media_gallery_value AS mgv
         ON mgv.value_id = mg.value_id AND mgv.store_id IN (${storePlaceholders})
       WHERE mg.media_type = 'image' OR mg.media_type IS NULL`
        : `SELECT mg.entity_id, mg.value_id, mg.value, mg.media_type, mgv.label, mgv.position, mgv.store_id
       FROM catalog_product_entity_media_gallery AS mg
       LEFT JOIN catalog_product_entity_media_gallery_value AS mgv
         ON mgv.value_id = mg.value_id AND mgv.store_id IN (${storePlaceholders})
       WHERE mg.media_type = 'image' OR mg.media_type IS NULL`;
    const [rows] = await mysqlPool.query(query, storeIds);
    const bestByValueId = new Map();
    for (const row of rows) {
        const entityId = Number(row.entity_id);
        const valueId = Number(row.value_id);
        if (!entityId || !valueId || !row.value) {
            continue;
        }
        const rank = storeRank(row.store_id);
        const current = bestByValueId.get(valueId);
        if (current && current.rank <= rank) {
            continue;
        }
        bestByValueId.set(valueId, {
            entity_id: entityId,
            url: buildMediaUrl(row.value),
            label: row.label ?? null,
            position: Number(row.position) ?? null,
            rank,
        });
    }
    for (const media of bestByValueId.values()) {
        if (!mediaMap.has(media.entity_id)) {
            mediaMap.set(media.entity_id, []);
        }
        mediaMap.get(media.entity_id).push({
            url: media.url,
            label: media.label ?? undefined,
            position: media.position,
        });
    }
    for (const [, list] of mediaMap) {
        list.sort((a, b) => {
            const posA = Number.isFinite(a.position) ? a.position : 0;
            const posB = Number.isFinite(b.position) ? b.position : 0;
            return posA - posB;
        });
    }
    return mediaMap;
}
async function tableExists(table) {
    const [rows] = await mysqlPool.query(`SELECT COUNT(*) AS count
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = ?`, [MYSQL_DB, table]);
    return rows[0]?.count > 0;
}
async function indexExistingMedusaProducts() {
    const bySku = new Map();
    let offset = 0;
    const limit = 50;
    while (true) {
        const params = new URLSearchParams();
        params.set("limit", String(limit));
        params.set("offset", String(offset));
        const response = await medusaRequest(`/products?${params.toString()}`);
        const products = response?.products ?? [];
        if (!products.length) {
            break;
        }
        for (const product of products) {
            const entry = {
                id: product.id,
                metadata: product.metadata ?? null,
                handle: product.handle,
                title: product.title,
            };
            const metadataSku = product?.metadata?.magento?.sku;
            if (typeof metadataSku === "string" && metadataSku.trim()) {
                bySku.set(metadataSku.toLowerCase(), entry);
            }
            const variants = Array.isArray(product.variants)
                ? product.variants
                : [];
            for (const variant of variants) {
                if (variant?.sku && typeof variant.sku === "string") {
                    bySku.set(variant.sku.toLowerCase(), entry);
                }
            }
        }
        offset += products.length;
        if (typeof response.count === "number" && offset >= response.count) {
            break;
        }
    }
    return bySku;
}
async function medusaRequest(path, init) {
    const response = await fetch(`${ADMIN_BASE}${path}`, {
        ...init,
        headers: {
            ...medusaDefaultHeaders,
            ...(init?.headers ?? {}),
        },
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text ||
            `Medusa request ${path} failed with status ${response.status}.`);
    }
    if (response.status === 204) {
        return {};
    }
    return (await response.json());
}
async function createMedusaProduct(body) {
    const response = await medusaRequest("/products", {
        method: "POST",
        body: JSON.stringify(body),
    });
    if (!response?.product) {
        return null;
    }
    return {
        id: response.product.id,
        metadata: response.product.metadata ?? body.metadata ?? null,
        handle: response.product.handle,
        title: response.product.title,
    };
}
async function updateMedusaProduct(productId, magentoPayload, currentMetadata) {
    const metadata = {
        ...(currentMetadata ?? {}),
        magento: magentoPayload,
    };
    await medusaRequest(`/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify({ metadata }),
    });
}
function buildMagentoMetadata(entity, attributes, categories, media) {
    const sku = (entity.sku || "").trim();
    const descriptionHtml = findAttributeValue(attributes, "description") || "";
    const subtitle = findAttributeValue(attributes, "short_description") || "";
    const urlKey = findAttributeValue(attributes, "url_key") || "";
    const discountableAttr = findAttributeValue(attributes, "is_discountable");
    const discountable = parseMagentoBoolean(discountableAttr) ??
        parseMagentoBoolean(findAttributeValue(attributes, "is_salable")) ??
        true;
    const rawAttributeMap = attributes.reduce((acc, attribute) => {
        acc[attribute.attribute_code] = attribute.value;
        return acc;
    }, {});
    return {
        sku,
        description_html: descriptionHtml,
        subtitle,
        handle: urlKey || sku || `magento-${entity.entity_id}`,
        discountable,
        media,
        categories,
        collections: [],
        tags: [],
        attributes,
        raw_json: {
            entity,
            attributes: rawAttributeMap,
            categories,
            media,
        },
    };
}
function findAttributeValue(attributes, code) {
    return attributes.find((attribute) => attribute.attribute_code.toLowerCase() === code.toLowerCase())?.value;
}
function parseMagentoBoolean(value) {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "number") {
        return value > 0;
    }
    if (typeof value === "string") {
        if (value.toLowerCase() === "true") {
            return true;
        }
        if (value.toLowerCase() === "false") {
            return false;
        }
        return value === "1";
    }
    return null;
}
function convertAttributeValue(value, backendType) {
    if (value === null || typeof value === "undefined") {
        return null;
    }
    if (Buffer.isBuffer(value)) {
        return value.toString("utf8");
    }
    if (backendType === "int" || backendType === "decimal") {
        const numberValue = Number(value);
        if (Number.isFinite(numberValue)) {
            return backendType === "int" ? Math.trunc(numberValue) : numberValue;
        }
    }
    if (backendType === "datetime") {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
            return date.toISOString();
        }
    }
    if (typeof value === "string") {
        return value;
    }
    if (typeof value === "number" || typeof value === "boolean") {
        return value;
    }
    return String(value);
}
function storeRank(storeId) {
    if (storeId === null || typeof storeId === "undefined") {
        return STORE_PRIORITY.length + 1;
    }
    const idx = STORE_PRIORITY.indexOf(storeId);
    return idx === -1 ? STORE_PRIORITY.length : idx;
}
function chunk(values, size) {
    const result = [];
    for (let i = 0; i < values.length; i += size) {
        result.push(values.slice(i, i + size));
    }
    return result;
}
function buildMediaUrl(path) {
    const normalized = path.trim();
    if (!normalized) {
        return normalized;
    }
    if (!MAGENTO_MEDIA_BASE_URL) {
        return normalized;
    }
    return `${MAGENTO_MEDIA_BASE_URL}/${normalized.replace(/^\/+/, "")}`;
}
function slugify(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
function stripHtml(html) {
    return html
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
main().catch((error) => {
    console.error("❌ Migration aborted.", error);
    mysqlPool.end().catch(() => undefined);
    process.exit(1);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0ZS1tYWdlbnRvLXByb2R1Y3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc2NyaXB0cy9taWdyYXRlLW1hZ2VudG8tcHJvZHVjdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQTs7Ozs7R0FLRztBQUNILHlCQUFzQjtBQUV0Qiw2REFBa0M7QUE4RWxDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLFdBQVcsQ0FBQTtBQUN4RCxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksTUFBTSxDQUFDLENBQUE7QUFDM0QsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUE7QUFDekMsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLElBQUksRUFBRSxDQUFBO0FBQ3ZELE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFBO0FBQ3JDLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLElBQUksR0FBRyxDQUFDLENBQUE7QUFDcEUsTUFBTSxzQkFBc0IsR0FDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsRUFBRSxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtBQUMvRCxNQUFNLGtCQUFrQixHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsSUFBSSx1QkFBdUIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUE7QUFDMUcsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFBO0FBRXJELElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM3QixPQUFPLENB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