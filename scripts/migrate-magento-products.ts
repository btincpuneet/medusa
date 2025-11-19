/**
 * Magento → Medusa product migration.
 * Usage: MYSQL_HOST=127.0.0.1 MYSQL_USER=root MYSQL_PASSWORD=secret MYSQL_DB=magento \
 *        MEDUSA_BACKEND_URL=http://localhost:9000 MEDUSA_API_TOKEN=sk_xxx \
 *        pnpm tsx scripts/migrate-magento-products.ts
 */
import "dotenv/config"

import mysql from "mysql2/promise"

type Row = mysql.RowDataPacket

type AttributeDefinition = {
  attribute_id: number
  attribute_code: string
  backend_type: MagentoBackendType
  label: string | null
}

type MagentoBackendType =
  | "static"
  | "varchar"
  | "int"
  | "text"
  | "decimal"
  | "datetime"

type MagentoProductRow = {
  entity_id: number
  sku: string | null
  type_id: string | null
  created_at: Date | string | null
  updated_at: Date | string | null
}

type MagentoAttribute = {
  attribute_code: string
  backend_type: MagentoBackendType
  label?: string | null
  value: string | number | boolean | null
  magento_attribute_id?: number
}

type MagentoMedia = {
  url: string
  label?: string | null
  position?: number | null
}

type MagentoCategory = {
  id?: number
  name?: string | null
  magento_id?: number
}

type MagentoCollection = {
  id?: number | string | null
  title?: string | null
  magento_id?: number | string | null
}

type MagentoTag = {
  value: string
}

type MagentoProductMetadata = {
  sku: string
  description_html: string
  subtitle: string
  handle: string
  discountable: boolean
  media: MagentoMedia[]
  categories: MagentoCategory[]
  collections: MagentoCollection[]
  tags: MagentoTag[]
  attributes: MagentoAttribute[]
  raw_json: unknown
}

type ExistingProduct = {
  id: string
  metadata: Record<string, unknown> | null
  handle?: string | null
  title?: string | null
}

const MYSQL_HOST = process.env.MYSQL_HOST || "127.0.0.1"
const MYSQL_PORT = Number(process.env.MYSQL_PORT || "3306")
const MYSQL_USER = process.env.MYSQL_USER
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || ""
const MYSQL_DB = process.env.MYSQL_DB
const MAGENTO_STORE_ID = Number(process.env.MAGENTO_STORE_ID || "0")
const MAGENTO_MEDIA_BASE_URL =
  process.env.MAGENTO_MEDIA_BASE_URL?.replace(/\/+$/, "") ?? ""
const MEDUSA_BACKEND_URL = (process.env.MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/+$/, "")
const MEDUSA_API_TOKEN = process.env.MEDUSA_API_TOKEN

if (!MYSQL_USER || !MYSQL_DB) {
  console.error(
    "❌ Missing MySQL config. Set MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD and MYSQL_DB."
  )
  process.exit(1)
}

if (!MEDUSA_API_TOKEN) {
  console.error("❌ MEDUSA_API_TOKEN is required to call the Admin API.")
  process.exit(1)
}

const STORE_PRIORITY = Array.from(
  new Set([Number.isFinite(MAGENTO_STORE_ID) ? MAGENTO_STORE_ID : 0, 0])
)

const ADMIN_BASE = `${MEDUSA_BACKEND_URL}/admin`

const mysqlPool = mysql.createPool({
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DB,
  waitForConnections: true,
  connectionLimit: 10,
})

const medusaDefaultHeaders = {
  Authorization: `Bearer ${MEDUSA_API_TOKEN}`,
  "x-medusa-access-token": MEDUSA_API_TOKEN,
  "Content-Type": "application/json",
}

async function main() {
  console.log("▶ Loading Magento catalog…")
  const [productEntityTypeId, categoryEntityTypeId] = await Promise.all([
    getEntityTypeId("catalog_product"),
    getEntityTypeId("catalog_category"),
  ])

  if (!productEntityTypeId) {
    throw new Error("Magento entity_type_id for products not found.")
  }
  if (!categoryEntityTypeId) {
    throw new Error("Magento entity_type_id for categories not found.")
  }

  const attributeDefinitions = await loadAttributeDefinitions(productEntityTypeId)
  const attributeIdsByType = groupAttributeIdsByType(attributeDefinitions)
  const products = await loadProducts()
  const attributesByProduct = await loadAttributeValues(
    attributeDefinitions,
    attributeIdsByType,
    products
  )
  const categoryNames = await loadCategoryNames(categoryEntityTypeId)
  const categoriesByProduct = await loadProductCategories(categoryNames)
  const mediaByProduct = await loadProductMedia()

  console.log("▶ Indexing existing Medusa products…")
  const existingBySku = await indexExistingMedusaProducts()

  let created = 0
  let updated = 0
  let skipped = 0
  let failed = 0

  for (const row of products) {
    const sku = (row.sku || "").trim()
    if (!sku) {
      skipped++
      continue
    }

    const attributes = attributesByProduct.get(row.entity_id) ?? []
    const categories = categoriesByProduct.get(row.entity_id) ?? []
    const media = mediaByProduct.get(row.entity_id) ?? []

    const magentoPayload = buildMagentoMetadata(
      row,
      attributes,
      categories,
      media
    )
    const medusaHandle = slugify(
      (magentoPayload.handle || sku || `magento-${row.entity_id}`).toString()
    )
    const productTitle =
      (findAttributeValue(attributes, "name") as string | null) ||
      sku ||
      `Magento ${row.entity_id}`
    const descriptionHtml =
      (findAttributeValue(attributes, "description") as string | null) || ""
    const statusValue = findAttributeValue(attributes, "status")
    const medusaStatus =
      statusValue === 1 || statusValue === "1" || statusValue === true
        ? "published"
        : "draft"

    const existing = existingBySku.get(sku.toLowerCase())

    try {
      if (existing) {
        await updateMedusaProduct(existing.id, magentoPayload, existing.metadata)
        existing.metadata = {
          ...(existing.metadata ?? {}),
          magento: magentoPayload,
        }
        updated++
        console.log(`↺ Updated ${sku}`)
      } else {
        const createdProduct = await createMedusaProduct({
          title: productTitle,
          handle: medusaHandle,
          subtitle: magentoPayload.subtitle,
          description: stripHtml(descriptionHtml),
          status: medusaStatus,
          metadata: {
            magento: magentoPayload,
          },
        })
        created++
        console.log(`➕ Created ${sku}`)
        if (createdProduct) {
          existingBySku.set(sku.toLowerCase(), createdProduct)
        }
      }
      if (existing) {
        existingBySku.set(sku.toLowerCase(), {
          ...existing,
          metadata: { magento: magentoPayload },
        })
      }
    } catch (error) {
      failed++
      console.error(`❌ ${sku}:`, (error as Error).message)
    }
  }

  console.log(
    `\n✅ Migration finished. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}, Failed: ${failed}.`
  )

  await mysqlPool.end()
}

async function getEntityTypeId(code: string) {
  const [rows] = await mysqlPool.query<Row[]>(
    `SELECT entity_type_id FROM eav_entity_type WHERE entity_type_code = ? LIMIT 1`,
    [code]
  )
  return rows[0]?.entity_type_id as number | undefined
}

async function loadAttributeDefinitions(entityTypeId: number) {
  const [rows] = await mysqlPool.query<Row[]>(
    `SELECT attribute_id, attribute_code, backend_type, frontend_label
     FROM eav_attribute
     WHERE entity_type_id = ?`,
    [entityTypeId]
  )

  return rows
    .map((row) => ({
      attribute_id: Number(row.attribute_id),
      attribute_code: row.attribute_code as string,
      backend_type: (row.backend_type || "varchar") as MagentoBackendType,
      label: (row.frontend_label as string) ?? null,
    }))
    .filter((row) => !!row.attribute_id && !!row.attribute_code)
}

function groupAttributeIdsByType(definitions: AttributeDefinition[]) {
  const map = new Map<MagentoBackendType, number[]>()
  for (const def of definitions) {
    if (!map.has(def.backend_type)) {
      map.set(def.backend_type, [])
    }
    map.get(def.backend_type)!.push(def.attribute_id)
  }
  return map
}

async function loadProducts(): Promise<MagentoProductRow[]> {
  const [rows] = await mysqlPool.query<Row[]>(
    `SELECT entity_id, sku, type_id, created_at, updated_at
     FROM catalog_product_entity
     ORDER BY entity_id ASC`
  )

  return rows.map((row) => ({
    entity_id: Number(row.entity_id),
    sku: row.sku as string | null,
    type_id: (row.type_id as string) ?? null,
    created_at: row.created_at as Date | string | null,
    updated_at: row.updated_at as Date | string | null,
  }))
}

async function loadAttributeValues(
  definitions: AttributeDefinition[],
  byType: Map<MagentoBackendType, number[]>,
  products: MagentoProductRow[]
) {
  const results = new Map<number, MagentoAttribute[]>()
  const pushAttribute = (entityId: number, attr: MagentoAttribute) => {
    if (!results.has(entityId)) {
      results.set(entityId, [])
    }
    results.get(entityId)!.push(attr)
  }

  const tables: Array<{
    backend_type: MagentoBackendType
    table: string
  }> = [
    { backend_type: "varchar", table: "catalog_product_entity_varchar" },
    { backend_type: "int", table: "catalog_product_entity_int" },
    { backend_type: "text", table: "catalog_product_entity_text" },
    { backend_type: "decimal", table: "catalog_product_entity_decimal" },
    { backend_type: "datetime", table: "catalog_product_entity_datetime" },
  ]

  for (const table of tables) {
    const ids = byType.get(table.backend_type) ?? []
    if (!ids.length) {
      continue
    }
    await loadAttributeGroup(ids, table.table, table.backend_type, definitions, pushAttribute)
  }

  // Include static attributes such as SKU (already in main entity).
  for (const product of products) {
    const attr: MagentoAttribute = {
      attribute_code: "sku",
      backend_type: "static",
      label: "SKU",
      value: product.sku,
    }
    pushAttribute(product.entity_id, attr)
  }

  for (const [, list] of results) {
    list.sort((a, b) =>
      a.attribute_code.localeCompare(b.attribute_code)
    )
  }

  return results
}

async function loadAttributeGroup(
  attributeIds: number[],
  tableName: string,
  backendType: MagentoBackendType,
  definitions: AttributeDefinition[],
  pushAttribute: (entityId: number, attr: MagentoAttribute) => void
) {
  const chunks = chunk(attributeIds, 200)
  const storeIds = STORE_PRIORITY.length ? STORE_PRIORITY : [0]

  for (const chunkIds of chunks) {
    const placeholders = chunkIds.map(() => "?").join(",")
    const storePlaceholders = storeIds.map(() => "?").join(",")
    const [rows] = await mysqlPool.query<Row[]>(
      `SELECT entity_id, attribute_id, value, store_id
       FROM ${tableName}
       WHERE attribute_id IN (${placeholders})
         AND store_id IN (${storePlaceholders})`,
      [...chunkIds, ...storeIds]
    )

    const bestForAttribute = new Map<
      string,
      { row: Row; rank: number }
    >()

    for (const row of rows) {
      const key = `${row.entity_id}:${row.attribute_id}`
      const rank = storeRank(row.store_id as number | null)
      const existing = bestForAttribute.get(key)
      if (!existing || rank < existing.rank) {
        bestForAttribute.set(key, { row, rank })
      }
    }

    for (const entry of bestForAttribute.values()) {
      const entityId = Number(entry.row.entity_id)
      const attributeId = Number(entry.row.attribute_id)
      const def = definitions.find((d) => d.attribute_id === attributeId)
      if (!def || !entityId) {
        continue
      }
      const value = convertAttributeValue(entry.row.value, backendType)
      pushAttribute(entityId, {
        attribute_code: def.attribute_code,
        backend_type: backendType,
        label: def.label,
        value,
        magento_attribute_id: def.attribute_id,
      })
    }
  }
}

async function loadCategoryNames(entityTypeId: number) {
  const [rows] = await mysqlPool.query<Row[]>(
    `SELECT attribute_id FROM eav_attribute
     WHERE entity_type_id = ? AND attribute_code = 'name'
     LIMIT 1`,
    [entityTypeId]
  )
  const attributeId = rows[0]?.attribute_id as number | undefined
  if (!attributeId) {
    return new Map<number, string>()
  }

  const storeIds = STORE_PRIORITY.length ? STORE_PRIORITY : [0]
  const placeholders = storeIds.map(() => "?").join(",")
  const [values] = await mysqlPool.query<Row[]>(
    `SELECT entity_id, value, store_id
     FROM catalog_category_entity_varchar
     WHERE attribute_id = ?
       AND store_id IN (${placeholders})`,
    [attributeId, ...storeIds]
  )

  const names = new Map<number, string>()
  const bestRank = new Map<number, number>()
  for (const row of values) {
    const entityId = Number(row.entity_id)
    if (!entityId) {
      continue
    }
    const rank = storeRank(row.store_id as number | null)
    const currentRank = bestRank.get(entityId)
    if (typeof currentRank === "number" && currentRank <= rank) {
      continue
    }
    names.set(entityId, (row.value as string) ?? "")
    bestRank.set(entityId, rank)
  }

  return names
}

async function loadProductCategories(
  categoryNames: Map<number, string>
): Promise<Map<number, MagentoCategory[]>> {
  const [rows] = await mysqlPool.query<Row[]>(
    `SELECT product_id, category_id, position
     FROM catalog_category_product`
  )

  const categories = new Map<number, MagentoCategory[]>()
  for (const row of rows) {
    const productId = Number(row.product_id)
    const categoryId = Number(row.category_id)
    if (!productId || !categoryId) {
      continue
    }
    const list = categories.get(productId) ?? []
    list.push({
      id: categoryId,
      name: categoryNames.get(categoryId) ?? null,
      magento_id: categoryId,
      position: Number(row.position) || list.length,
    } as MagentoCategory & { position: number })
    categories.set(productId, list)
  }

  for (const [productId, list] of categories) {
    const normalized = list
      .sort((a, b) => {
        const posA = (a as any).position ?? 0
        const posB = (b as any).position ?? 0
        return posA - posB
      })
      .map(({ position, ...rest }) => rest)
    categories.set(productId, normalized)
  }

  return categories
}

async function loadProductMedia(): Promise<Map<number, MagentoMedia[]>> {
  const mediaMap = new Map<number, MagentoMedia[]>()
  const hasLinkTable = await tableExists(
    "catalog_product_entity_media_gallery_value_to_entity"
  )
  const storeIds = STORE_PRIORITY.length ? STORE_PRIORITY : [0]
  const storePlaceholders = storeIds.map(() => "?").join(",")

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
       WHERE mg.media_type = 'image' OR mg.media_type IS NULL`

  const [rows] = await mysqlPool.query<Row[]>(query, storeIds)

  const bestByValueId = new Map<
    number,
    { entity_id: number; url: string; label?: string | null; position?: number | null; rank: number }
  >()

  for (const row of rows) {
    const entityId = Number(row.entity_id)
    const valueId = Number(row.value_id)
    if (!entityId || !valueId || !row.value) {
      continue
    }
    const rank = storeRank(row.store_id as number | null)
    const current = bestByValueId.get(valueId)
    if (current && current.rank <= rank) {
      continue
    }
    bestByValueId.set(valueId, {
      entity_id: entityId,
      url: buildMediaUrl(row.value as string),
      label: (row.label as string) ?? null,
      position: Number(row.position) ?? null,
      rank,
    })
  }

  for (const media of bestByValueId.values()) {
    if (!mediaMap.has(media.entity_id)) {
      mediaMap.set(media.entity_id, [])
    }
    mediaMap.get(media.entity_id)!.push({
      url: media.url,
      label: media.label ?? undefined,
      position: media.position,
    })
  }

  for (const [, list] of mediaMap) {
    list.sort((a, b) => {
      const posA = Number.isFinite(a.position) ? (a.position as number) : 0
      const posB = Number.isFinite(b.position) ? (b.position as number) : 0
      return posA - posB
    })
  }

  return mediaMap
}

async function tableExists(table: string) {
  const [rows] = await mysqlPool.query<Row[]>(
    `SELECT COUNT(*) AS count
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = ?`,
    [MYSQL_DB, table]
  )
  return (rows[0]?.count as number) > 0
}

async function indexExistingMedusaProducts() {
  const bySku = new Map<string, ExistingProduct>()
  let offset = 0
  const limit = 50

  while (true) {
    const params = new URLSearchParams()
    params.set("limit", String(limit))
    params.set("offset", String(offset))
    const response = await medusaRequest<{
      products: any[]
      count?: number
    }>(`/products?${params.toString()}`)

    const products = response?.products ?? []
    if (!products.length) {
      break
    }

    for (const product of products) {
      const entry: ExistingProduct = {
        id: product.id,
        metadata: product.metadata ?? null,
        handle: product.handle,
        title: product.title,
      }
      const metadataSku = product?.metadata?.magento?.sku
      if (typeof metadataSku === "string" && metadataSku.trim()) {
        bySku.set(metadataSku.toLowerCase(), entry)
      }
      const variants = Array.isArray(product.variants)
        ? product.variants
        : []
      for (const variant of variants) {
        if (variant?.sku && typeof variant.sku === "string") {
          bySku.set(variant.sku.toLowerCase(), entry)
        }
      }
    }

    offset += products.length
    if (typeof response.count === "number" && offset >= response.count) {
      break
    }
  }

  return bySku
}

async function medusaRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${ADMIN_BASE}${path}`, {
    ...init,
    headers: {
      ...medusaDefaultHeaders,
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      text ||
        `Medusa request ${path} failed with status ${response.status}.`
    )
  }

  if (response.status === 204) {
    return {} as T
  }

  return (await response.json()) as T
}

async function createMedusaProduct(
  body: Record<string, unknown>
): Promise<ExistingProduct | null> {
  const response = await medusaRequest<{ product?: any }>("/products", {
    method: "POST",
    body: JSON.stringify(body),
  })

  if (!response?.product) {
    return null
  }

  return {
    id: response.product.id,
    metadata: response.product.metadata ?? (body.metadata as any) ?? null,
    handle: response.product.handle,
    title: response.product.title,
  }
}

async function updateMedusaProduct(
  productId: string,
  magentoPayload: MagentoProductMetadata,
  currentMetadata: Record<string, unknown> | null | undefined
) {
  const metadata = {
    ...(currentMetadata ?? {}),
    magento: magentoPayload,
  }

  await medusaRequest(`/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify({ metadata }),
  })
}

function buildMagentoMetadata(
  entity: MagentoProductRow,
  attributes: MagentoAttribute[],
  categories: MagentoCategory[],
  media: MagentoMedia[]
): MagentoProductMetadata {
  const sku = (entity.sku || "").trim()
  const descriptionHtml =
    (findAttributeValue(attributes, "description") as string | null) || ""
  const subtitle =
    (findAttributeValue(attributes, "short_description") as string | null) || ""
  const urlKey =
    (findAttributeValue(attributes, "url_key") as string | null) || ""
  const discountableAttr = findAttributeValue(attributes, "is_discountable")
  const discountable =
    parseMagentoBoolean(discountableAttr) ??
    parseMagentoBoolean(findAttributeValue(attributes, "is_salable")) ??
    true

  const rawAttributeMap = attributes.reduce<Record<string, unknown>>(
    (acc, attribute) => {
      acc[attribute.attribute_code] = attribute.value
      return acc
    },
    {}
  )

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
  }
}

function findAttributeValue(
  attributes: MagentoAttribute[],
  code: string
): string | number | boolean | null | undefined {
  return attributes.find(
    (attribute) =>
      attribute.attribute_code.toLowerCase() === code.toLowerCase()
  )?.value
}

function parseMagentoBoolean(
  value: string | number | boolean | null | undefined
) {
  if (typeof value === "boolean") {
    return value
  }
  if (typeof value === "number") {
    return value > 0
  }
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true
    }
    if (value.toLowerCase() === "false") {
      return false
    }
    return value === "1"
  }
  return null
}

function convertAttributeValue(
  value: unknown,
  backendType: MagentoBackendType
): string | number | boolean | null {
  if (value === null || typeof value === "undefined") {
    return null
  }
  if (Buffer.isBuffer(value)) {
    return value.toString("utf8")
  }
  if (backendType === "int" || backendType === "decimal") {
    const numberValue = Number(value)
    if (Number.isFinite(numberValue)) {
      return backendType === "int" ? Math.trunc(numberValue) : numberValue
    }
  }
  if (backendType === "datetime") {
    const date = new Date(value as any)
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString()
    }
  }
  if (typeof value === "string") {
    return value
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return value
  }
  return String(value)
}

function storeRank(storeId: number | null) {
  if (storeId === null || typeof storeId === "undefined") {
    return STORE_PRIORITY.length + 1
  }
  const idx = STORE_PRIORITY.indexOf(storeId)
  return idx === -1 ? STORE_PRIORITY.length : idx
}

function chunk<T>(values: T[], size: number) {
  const result: T[][] = []
  for (let i = 0; i < values.length; i += size) {
    result.push(values.slice(i, i + size))
  }
  return result
}

function buildMediaUrl(path: string) {
  const normalized = path.trim()
  if (!normalized) {
    return normalized
  }
  if (!MAGENTO_MEDIA_BASE_URL) {
    return normalized
  }
  return `${MAGENTO_MEDIA_BASE_URL}/${normalized.replace(/^\/+/, "")}`
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

main().catch((error) => {
  console.error("❌ Migration aborted.", error)
  mysqlPool.end().catch(() => undefined)
  process.exit(1)
})
