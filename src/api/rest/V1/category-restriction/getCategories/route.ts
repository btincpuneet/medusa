import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  findAccessMappingByAccessId,
} from "../../../../../lib/pg"
import {
  buildCategoryTree,
  CategoryType,
  matchesBrand,
  normalizeCategoryType,
  toCategorySummary,
  toMagentoCategory,
} from "../utils"

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
  res.header("Access-Control-Allow-Methods", "POST,OPTIONS")
  res.header("Access-Control-Allow-Credentials", "true")
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

type GetCategoriesBody = {
  categoryType?: CategoryType
  category_type?: CategoryType
  accessId?: string
  access_id?: string
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const body = (req.body || {}) as GetCategoriesBody
  const categoryType = normalizeCategoryType(body.categoryType ?? body.category_type)
  const accessId = body.accessId ?? body.access_id ?? undefined

  try {
    const { topLevel, nodes } = await buildCategoryTree()

    if (!topLevel.length) {
      return res.status(404).json({ message: "No categories configured." })
    }

    if (categoryType === "category") {
      return res.json({
        shop_by_category: topLevel.map(toCategorySummary),
      })
    }

    if (categoryType === "brand") {
      if (!accessId) {
        return res.status(400).json({
          message: "access_id is required for brand category requests.",
        })
      }

      const accessMapping = await findAccessMappingByAccessId(accessId)
      if (!accessMapping) {
        return res.status(404).json({ message: "Access mapping not found." })
      }

      const brandSet = new Set(accessMapping.brand_ids ?? [])
      const brandNodes = Array.from(nodes.values()).filter((node) =>
        matchesBrand(node, brandSet)
      )
      brandNodes.sort((a, b) => a.name.localeCompare(b.name))

      return res.json({
        shop_by_brand: brandNodes.map(toCategorySummary),
      })
    }

    if (!accessId) {
      return res.status(400).json({
        message: "access_id is required for categoryType=all.",
      })
    }

    const accessMapping = await findAccessMappingByAccessId(accessId)
    if (!accessMapping) {
      return res.status(404).json({ message: "Access mapping not found." })
    }

    const brandSet = new Set(accessMapping.brand_ids ?? [])

    const payload = topLevel.map((node) => {
      const filteredChildren = node.children.filter((child) =>
        matchesBrand(child, brandSet)
      )
      return toMagentoCategory({ ...node, children: filteredChildren })
    })

    return res.json({
      children_data: payload,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error fetching categories."
    return res.status(500).json({ message })
  }
}
