import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { getPgPool } from "../../../../lib/pg"

type BrandOption = {
  value: string
  label: string
  name: string
  parent_name: string | null
  group_name: string | null
  path: string[]
  category_id: string | null
}

type CollectionRow = {
  id: string
  title: string
  metadata: Record<string, unknown> | null
}

type NormalizedCollection = {
  collection_id: string
  title: string
  magento_id: string
  parent_magento_id: string | null
  level: number | null
}

const parseMetadata = (input: unknown): Record<string, unknown> | null => {
  if (!input) {
    return null
  }

  if (typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>
  }

  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input)
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, unknown>
      }
    } catch {
      return null
    }
  }

  return null
}

const toStringOrNull = (value: unknown) => {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value)
  }
  return null
}

const loadCollections = async (): Promise<NormalizedCollection[]> => {
  const { rows } = await getPgPool().query(
    `
      SELECT
        id,
        title,
        metadata
      FROM product_collection
      WHERE deleted_at IS NULL
        AND metadata IS NOT NULL
    `
  )

  const normalized: NormalizedCollection[] = []

  for (const row of rows as CollectionRow[]) {
    const metadata = parseMetadata(row.metadata)
    if (!metadata) {
      continue
    }

    const magentoId = toStringOrNull(
      metadata.magento_id ?? metadata.magentoId ?? metadata.magentoID
    )
    if (!magentoId) {
      continue
    }

    const parentMagentoId = toStringOrNull(
      metadata.parent_id ?? metadata.parentId ?? metadata.parentID
    )

    const levelValue = metadata.level
    const level =
      typeof levelValue === "number" && Number.isFinite(levelValue)
        ? levelValue
        : null

    normalized.push({
      collection_id: row.id,
      title: typeof row.title === "string" ? row.title.trim() : "",
      magento_id: magentoId,
      parent_magento_id: parentMagentoId,
      level,
    })
  }

  return normalized
}

const buildBrandOptions = (
  collections: NormalizedCollection[]
): BrandOption[] => {
  const byMagentoId = new Map<string, NormalizedCollection>()
  const childrenByMagentoId = new Map<string, NormalizedCollection[]>()

  for (const entry of collections) {
    byMagentoId.set(entry.magento_id, entry)

    if (entry.parent_magento_id) {
      const list =
        childrenByMagentoId.get(entry.parent_magento_id) ??
        childrenByMagentoId
          .set(entry.parent_magento_id, [])
          .get(entry.parent_magento_id)!
      list.push(entry)
    }
  }

  const options: BrandOption[] = []

  for (const entry of collections) {
    const isLeaf = !childrenByMagentoId.has(entry.magento_id)

    if (!isLeaf) {
      continue
    }

    const parent =
      entry.parent_magento_id && byMagentoId.has(entry.parent_magento_id)
        ? byMagentoId.get(entry.parent_magento_id)!
        : null

    const grandParent =
      parent?.parent_magento_id &&
      byMagentoId.has(parent.parent_magento_id)
        ? byMagentoId.get(parent.parent_magento_id)!
        : null

    const normalizedName = entry.title || entry.magento_id
    const normalizedParentName = parent?.title || ""
    const normalizedGroupName = grandParent?.title || ""

    let label = normalizedName
    if (normalizedParentName) {
      label = `${normalizedParentName} - ${normalizedName}`.trim()
    }

    const path = [
      normalizedGroupName,
      normalizedParentName,
      normalizedName,
    ].filter((segment) => segment && segment.length)

    options.push({
      value: entry.magento_id,
      label,
      name: normalizedName,
      parent_name: normalizedParentName || null,
      group_name: normalizedGroupName || null,
      path,
      category_id: entry.collection_id,
    })
  }

  options.sort((a, b) => a.label.localeCompare(b.label))

  const deduped = new Map<string, BrandOption>()
  for (const option of options) {
    const key = option.value.trim()
    if (!key.length || deduped.has(key)) {
      continue
    }
    deduped.set(key, option)
  }

  return Array.from(deduped.values())
}

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  const collections = await loadCollections()
  const options = buildBrandOptions(collections)

  return res.json({
    brands: options,
  })
}
