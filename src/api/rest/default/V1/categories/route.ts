import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { getPgPool } from "../../../../../lib/pg"

const setCors = (req: MedusaRequest, res: MedusaResponse) => {
  const origin = req.headers.origin
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin)
    res.header("Vary", "Origin")
  } else {
    res.header("Access-Control-Allow-Origin", "*")
  }

  res.header(
    "Access-Control-Allow-Headers",
    req.headers["access-control-request-headers"] ||
      "Content-Type, Authorization"
  )
  res.header("Access-Control-Allow-Methods", "GET,OPTIONS")
  res.header("Access-Control-Allow-Credentials", "true")
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

type CategoryRecord = {
  id: string
  name: string
  handle: string | null
  parent_id: string | null
  metadata: Record<string, unknown> & {
    image?: string | null
    url_path?: string | null
  }
}

const extractImage = (metadata: Record<string, unknown>) => {
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

const extractUrlPath = (
  category: CategoryRecord & { metadata: Record<string, unknown> }
) => {
  const metadata = category.metadata
  const candidates = ["url_path", "path", "slug"]
  for (const key of candidates) {
    const value = metadata[key]
    if (typeof value === "string" && value.length) {
      return value
    }
  }

  return category.handle
}

const parseMetadata = (value: unknown): Record<string, unknown> => {
  if (!value) {
    return {}
  }

  if (typeof value === "object") {
    return value as Record<string, unknown>
  }

  if (typeof value === "string" && value.length) {
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, unknown>
      }
    } catch {
      // ignore parse errors
    }
  }

  return {}
}

const loadCategories = async (): Promise<CategoryRecord[]> => {
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
      ORDER BY rank ASC NULLS LAST, name ASC
    `
  )

  return rows.map((row) => {
    const metadata = parseMetadata(row.metadata)
    const normalizedMetadata = {
      ...metadata,
      image: extractImage(metadata),
    } as CategoryRecord["metadata"]

    const record: CategoryRecord = {
      id: String(row.id),
      name: typeof row.name === "string" ? row.name : "",
      handle: row.handle ? String(row.handle) : null,
      parent_id: row.parent_category_id
        ? String(row.parent_category_id)
        : null,
      metadata: normalizedMetadata,
    }

    record.metadata.url_path = extractUrlPath(record)

    return record
  })
}

const buildTree = (categories: CategoryRecord[]) => {
  const children = new Map<string, CategoryRecord[]>()

  for (const category of categories) {
    if (!category.parent_id) {
      continue
    }
    const list =
      children.get(category.parent_id) ??
      children.set(category.parent_id, []).get(category.parent_id)!
    list.push(category)
  }

  const toMagentoNode = (
    category: CategoryRecord,
    level: number
  ): Record<string, unknown> => {
    const descendants = children.get(category.id) ?? []
    return {
      id: Number.parseInt(category.id, 10) || category.id,
      parent_id: category.parent_id
        ? Number.parseInt(category.parent_id, 10) || category.parent_id
        : 0,
      name: category.name,
      is_active: true,
      position: 0,
      level,
      product_count: 0,
      image: category.metadata.image ?? null,
      url_path: category.metadata.url_path ?? null,
      children_data: descendants.map((child) =>
        toMagentoNode(child, level + 1)
      ),
      metadata: category.metadata,
    }
  }

  const topLevel = categories.filter((category) => !category.parent_id)

  return topLevel.map((category) => toMagentoNode(category, 2))
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  try {
    const categories = await loadCategories()
    const tree = buildTree(categories)

    return res.json({
      id: 2,
      parent_id: 1,
      name: "Default Category",
      is_active: true,
      position: 0,
      level: 1,
      product_count: tree.length,
      children_data: tree,
    })
  } catch (error: any) {
    return res.status(500).json({
      message:
        error?.message ||
        "Unexpected error while loading categories.",
    })
  }
}
