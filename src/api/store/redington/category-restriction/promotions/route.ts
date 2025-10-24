import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonAccessMappingTable,
  ensureRedingtonSettingsTable,
  getPgPool,
  getRedingtonSetting,
} from "../../../../../lib/pg"

type PromotionRequestBody = {
  access_id?: number | string
}

const parseNumeric = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string" && value.trim().length) {
    const parsed = Number.parseInt(value.trim(), 10)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

const loadCategoryWithChildren = async (parentId: string) => {
  const { rows: parentRows } = await getPgPool().query(
    `
      SELECT
        id,
        name,
        handle,
        metadata
      FROM product_category
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [parentId]
  )

  if (!parentRows[0]) {
    return null
  }

  const parentMetadata =
    typeof parentRows[0].metadata === "object" && parentRows[0].metadata !== null
      ? parentRows[0].metadata
      : (() => {
          if (typeof parentRows[0].metadata === "string") {
            try {
              return JSON.parse(parentRows[0].metadata)
            } catch {
              return {}
            }
          }
          return {}
        })()

  const { rows: childRows } = await getPgPool().query(
    `
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
    `,
    [parentId]
  )

  const children = childRows.map((row) => {
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

    return {
      entity_id: String(row.id),
      name: String(row.name ?? ""),
      image:
        typeof metadata.image === "string"
          ? metadata.image
          : typeof metadata.image_url === "string"
          ? metadata.image_url
          : null,
      url_path:
        typeof metadata.url_path === "string"
          ? metadata.url_path
          : typeof row.handle === "string"
          ? row.handle
          : null,
      metadata,
    }
  })

  return {
    entity_id: String(parentRows[0].id),
    name: String(parentRows[0].name ?? ""),
    children_data: children,
    metadata: parentMetadata,
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonAccessMappingTable()
  await ensureRedingtonSettingsTable()

  const body = (req.body || {}) as PromotionRequestBody
  const accessId = parseNumeric(body.access_id)
  if (!accessId) {
    return res.status(400).json({
      message: "access_id is required",
    })
  }

  const { rows: accessRows } = await getPgPool().query(
    `
      SELECT id
      FROM redington_access_mapping
      WHERE id = $1
      LIMIT 1
    `,
    [accessId]
  )

  if (!accessRows[0]) {
    return res.status(404).json({
      message: `Access mapping ${accessId} not found`,
    })
  }

  const config = await getRedingtonSetting<{ promotion_root_category_id?: string }>(
    "category_restriction_promotion_root"
  )
  const rootId = config?.promotion_root_category_id

  if (!rootId) {
    return res.status(404).json({
      message:
        "Promotion root category is not configured. Use the admin config endpoint to set promotion_root_category_id.",
    })
  }

  const category = await loadCategoryWithChildren(rootId)
  if (!category) {
    return res.status(404).json({
      message: "Configured promotion root category was not found.",
    })
  }

  return res.json({
    promotion_category: category,
  })
}
