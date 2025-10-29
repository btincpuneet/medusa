import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  buildCategoryTree,
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

type GetPromotionsBody = {
  accessId?: string
  access_id?: string
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const _body = (req.body || {}) as GetPromotionsBody
  const promotionParentEnv = process.env.REDINGTON_PROMOTION_PARENT_CATEGORY

  try {
    const { nodes, topLevel } = await buildCategoryTree()

    if (!topLevel.length) {
      return res.status(404).json({ message: "No categories configured." })
    }

    let parent = topLevel[0]

    if (promotionParentEnv) {
      const match = Array.from(nodes.values()).find((node) => {
        return (
          node.id === promotionParentEnv ||
          promotionParentEnv === node.entityId
        )
      })

      if (match) {
        parent = match
      }
    }

    const children = parent.children.length
      ? parent.children
      : parent.children.flatMap((child) => child.children)

    return res.json({
      children_data: children.map(toMagentoCategory),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error fetching promotions."
    return res.status(500).json({ message })
  }
}

