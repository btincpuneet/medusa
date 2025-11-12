import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonAccessMappingTable,
  ensureRedingtonSettingsTable,
  getPgPool,
  getRedingtonSetting,
  mapAccessMappingRow,
} from "../../../../../lib/pg"

type CategoryRequestBody = {
  category_type?: string
  access_id?: number | string
}

type CategoryRecord = {
  id: string
  name: string
  handle: string | null
  parent_id: string | null
  image: string | null
  url_path: string | null
  metadata: Record<string, unknown>
}

const parseAccessId = (value: unknown): string | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value)
  }

  if (typeof value === "string" && value.trim().length) {
    return value.trim()
  }

  return undefined
}

const formatCategory = (category: CategoryRecord, children: CategoryRecord[]) => {
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
  }
}

const extractImage = (metadata: Record<string, unknown>) => {
  if (!metadata) {
    return null
  }

  const candidates = [
    "image",
    "image_url",
    "thumbnail",
    "hero_image",
    "logo",
  ]

  for (const key of candidates) {
    const value = metadata[key]
    if (typeof value === "string" && value.length) {
      return value
    }
  }

  return null
}

const extractUrlPath = (category: {
  metadata: Record<string, unknown>
  handle: string | null
}) => {
  const metadata = category.metadata
  if (metadata) {
    const candidates = ["url_path", "path", "slug"]
    for (const key of candidates) {
      const value = metadata[key]
      if (typeof value === "string" && value.length) {
        return value
      }
    }
  }

  return category.handle
}

const loadCategories = async () => {
  const { rows } = await getPgPool().query(
    `
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
    `
  )

  return rows.map((row) => {
    let metadata: Record<string, unknown> = {}
    if (row.metadata) {
      if (typeof row.metadata === "object") {
        metadata = row.metadata
      } else if (typeof row.metadata === "string") {
        try {
          metadata = JSON.parse(row.metadata)
        } catch {
          metadata = {}
        }
      }
    }

    const record: CategoryRecord = {
      id: String(row.id),
      name: typeof row.name === "string" ? row.name : "",
      handle: row.handle ? String(row.handle) : null,
      parent_id: row.parent_category_id
        ? String(row.parent_category_id)
        : null,
      image: extractImage(metadata),
      url_path: null,
      metadata,
    }

    record.url_path = extractUrlPath(record)

    return record
  })
}

const buildCategoryIndex = (categories: CategoryRecord[]) => {
  const byId = new Map<string, CategoryRecord>()
  const children = new Map<string, CategoryRecord[]>()

  for (const category of categories) {
    byId.set(category.id, category)

    if (category.parent_id) {
      const list =
        children.get(category.parent_id) ??
        children.set(category.parent_id, []).get(category.parent_id)!
      list.push(category)
    }
  }

  return { byId, children }
}

const normalizeCategoryType = (value: string | undefined) => {
  if (!value) {
    return "ALL"
  }
  return value.trim().toUpperCase()
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonAccessMappingTable()
  await ensureRedingtonSettingsTable()

  const body = (req.body || {}) as CategoryRequestBody
  const categoryType = normalizeCategoryType(body.category_type)

  const accessId = parseAccessId(body.access_id)
  if (!accessId) {
    return res.status(400).json({
      message: "access_id is required",
    })
  }

  const { rows: mappingRows } = await getPgPool().query(
    `
      SELECT
        am.*,
        d.domain_name,
        de.domain_extention_name
      FROM redington_access_mapping am
      LEFT JOIN redington_domain d ON d.id = am.domain_id
      LEFT JOIN redington_domain_extention de ON de.id = am.domain_extention_id
      WHERE am.access_id = $1
      LIMIT 1
    `,
    [accessId]
  )

  if (!mappingRows[0]) {
    return res.status(404).json({
      message: `Access mapping ${accessId} not found`,
    })
  }

  const access = mapAccessMappingRow(mappingRows[0])
  const brandIds = access.brand_ids.map((id) => String(id).trim())
  const brandIdSet = new Set(brandIds)

  if (!brandIds.length) {
    return res.status(404).json({
      message:
        "Access mapping does not contain brand associations. Unable to return categories.",
    })
  }

  const categories = await loadCategories()
  const { children } = buildCategoryIndex(categories)

  if (categoryType === "EPP_BRAND") {
    const brands = categories
      .filter((category) => brandIdSet.has(category.id))
      .map((brand) => ({
        entity_id: brand.id,
        name: brand.name,
        image: brand.image,
        url_path: brand.url_path,
        metadata: brand.metadata,
      }))

    return res.json({
      shop_by_brand: brands,
    })
  }

  const parentCategories = categories.filter((category) => {
    const childList = children.get(category.id)
    if (!childList?.length) {
      return false
    }

    return childList.some((child) => brandIdSet.has(child.id))
  })

  if (categoryType === "EPP_CATEGORY") {
    const response = parentCategories.map((category) =>
      formatCategory(category, children.get(category.id) ?? [])
    )

    return res.json({
      shop_by_category: response,
    })
  }

  if (categoryType === "ALL") {
    const response = parentCategories.map((category) => {
      const childList = (children.get(category.id) ?? []).filter((child) =>
        brandIdSet.has(child.id)
      )
      return formatCategory(category, childList)
    })

    return res.json({
      categories: response,
    })
  }

  return res.status(400).json({
    message:
      "Unsupported category_type. Expected ALL, EPP_CATEGORY, or EPP_BRAND.",
  })
}
