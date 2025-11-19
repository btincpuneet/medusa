import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { findAccessMappingByAccessId } from "../../../../lib/pg"
import { sendErrorResponse } from "../../utils/respond"
import {
  buildCategoryTree,
  CategoryType,
  matchesBrand,
  normalizeCategoryType,
  toCategorySummary,
  toMagentoCategory,
} from "../../../../api/rest/V1/category-restriction/utils"

type CategoryRequest = {
  categoryType?: CategoryType
  category_type?: CategoryType
  accessId?: string
  access_id?: string
}

const resolvePayload = (req: MedusaRequest): CategoryRequest => {
  if (req.method && req.method.toUpperCase() === "GET") {
    return (req.query || {}) as CategoryRequest
  }
  return (req.body || {}) as CategoryRequest
}

const handleRequest = async (req: MedusaRequest, res: MedusaResponse) => {
  const payload = resolvePayload(req)
  const categoryType = normalizeCategoryType(
    payload.categoryType ?? payload.category_type
  )
  const accessId = payload.accessId ?? payload.access_id

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

    const payloadTree = topLevel.map((node) => {
      const filteredChildren = node.children.filter((child) =>
        matchesBrand(child, brandSet)
      )
      return toMagentoCategory({ ...node, children: filteredChildren })
    })

    return res.json({
      children_data: payloadTree,
    })
  } catch (error) {
    return sendErrorResponse(res, error, "Unable to load categories.")
  }
}

export const POST = handleRequest
export const GET = handleRequest

