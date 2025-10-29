import { getPgPool } from "../../../../lib/pg"

export type CategoryNode = {
  id: string
  entityId: string
  name: string
  parentId: string | null
  handle: string | null
  image: string | null
  urlPath: string | null
  rank: number | null
  level: number
  isActive: boolean
  children: CategoryNode[]
  metadata: Record<string, unknown> | null
}

type CategoryRow = {
  id: string
  name: string
  handle: string | null
  parent_category_id: string | null
  metadata: Record<string, unknown> | null
  rank: number | null
  is_active: boolean
  is_internal: boolean
}

export type CategoryType = "all" | "category" | "brand"

const parseMetadata = (value: unknown): Record<string, unknown> | null => {
  if (!value) {
    return null
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed.length) {
      return null
    }
    try {
      return JSON.parse(trimmed)
    } catch {
      return { raw: trimmed }
    }
  }

  return null
}

const selectMetadataString = (
  metadata: Record<string, unknown> | null,
  keys: string[]
): string | null => {
  if (!metadata) {
    return null
  }
  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === "string" && value.trim().length) {
      return value.trim()
    }
  }
  return null
}

const selectMetadataBoolean = (
  metadata: Record<string, unknown> | null,
  keys: string[]
): boolean | null => {
  if (!metadata) {
    return null
  }
  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === "boolean") {
      return value
    }
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase()
      if (["1", "true", "yes", "on"].includes(normalized)) {
        return true
      }
      if (["0", "false", "no", "off"].includes(normalized)) {
        return false
      }
    }
  }
  return null
}

const fetchCategoryRows = async (): Promise<CategoryRow[]> => {
  const { rows } = await getPgPool().query(
    `
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
    `
  )

  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ""),
    handle: row.handle ? String(row.handle) : null,
    parent_category_id: row.parent_category_id ? String(row.parent_category_id) : null,
    metadata: parseMetadata(row.metadata),
    rank: row.rank !== null && row.rank !== undefined ? Number(row.rank) : null,
    is_active: Boolean(row.is_active),
    is_internal: Boolean(row.is_internal),
  }))
}

export const buildCategoryTree = async (): Promise<{
  nodes: Map<string, CategoryNode>
  topLevel: CategoryNode[]
}> => {
  const rows = await fetchCategoryRows()

  const nodes = new Map<string, CategoryNode>()

  for (const row of rows) {
    const metadata = row.metadata
    const entityId =
      selectMetadataString(metadata, [
        "magento_entity_id",
        "magento_id",
        "legacy_id",
        "entity_id",
        "external_id",
      ]) || row.id

    const node: CategoryNode = {
      id: row.id,
      entityId,
      name: row.name,
      parentId: row.parent_category_id,
      handle: row.handle,
      image: selectMetadataString(metadata, ["image", "image_url", "thumbnail"]),
      urlPath:
        selectMetadataString(metadata, ["url_path", "url", "path"]) ||
        (row.handle ? `/category/${row.handle}` : null),
      rank: row.rank,
      level: 1,
      isActive:
        selectMetadataBoolean(metadata, ["is_active", "active"]) ?? row.is_active,
      children: [],
      metadata,
    }

    nodes.set(row.id, node)
  }

  for (const node of nodes.values()) {
    if (!node.parentId) {
      continue
    }

    const parent = nodes.get(node.parentId)
    if (parent) {
      parent.children.push(node)
    }
  }

  const computeLevel = (current: CategoryNode): number => {
    if (!current.parentId) {
      current.level = 1
      return 1
    }
    const parent = nodes.get(current.parentId)
    if (!parent) {
      current.level = 1
      return 1
    }
    const level = computeLevel(parent) + 1
    current.level = level
    return level
  }

  for (const node of nodes.values()) {
    computeLevel(node)
  }

  const topLevel = Array.from(nodes.values())
    .filter((node) => !node.parentId)
    .sort((a, b) => {
      const rankA = a.rank ?? Number.MAX_SAFE_INTEGER
      const rankB = b.rank ?? Number.MAX_SAFE_INTEGER
      if (rankA !== rankB) {
        return rankA - rankB
      }
      return a.name.localeCompare(b.name)
    })

  return { nodes, topLevel }
}

export const getEntityId = (node: CategoryNode): string => {
  return (
    selectMetadataString(node.metadata, [
      "magento_entity_id",
      "magento_id",
      "legacy_id",
      "entity_id",
      "external_id",
    ]) || node.entityId || node.id
  )
}

export const matchesBrand = (
  node: CategoryNode,
  brandSet: Set<string>
): boolean => {
  if (!brandSet.size) {
    return true
  }

  const entityId = getEntityId(node)
  if (brandSet.has(entityId) || brandSet.has(node.id)) {
    return true
  }

  const metadata = node.metadata
  if (metadata) {
    for (const value of Object.values(metadata)) {
      if (typeof value === "string" && brandSet.has(value)) {
        return true
      }
    }
  }

  return false
}

export const toMagentoCategory = (node: CategoryNode): Record<string, unknown> => {
  return {
    parent_id: node.parentId ? getEntityId(node) : null,
    entity_id: getEntityId(node),
    name: node.name,
    image: node.image,
    url_path: node.urlPath,
    children_count: node.children.length,
    children_data: node.children.map(toMagentoCategory),
  }
}

export const toCategorySummary = (node: CategoryNode) => ({
  entity_id: getEntityId(node),
  name: node.name,
  image: node.image,
  url_path: node.urlPath,
})

export const normalizeCategoryType = (value?: CategoryType | string | null): CategoryType => {
  if (!value) {
    return "all"
  }
  const normalized = value.toString().toLowerCase()
  if (["category", "categories"].includes(normalized)) {
    return "category"
  }
  if (["brand", "brands"].includes(normalized)) {
    return "brand"
  }
  return "all"
}

