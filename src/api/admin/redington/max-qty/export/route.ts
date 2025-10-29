import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import {
  listMaxQtyCategories,
  listMaxQtyRules,
} from "../../../../../modules/redington-max-qty"

export const GET = async (_req: MedusaRequest, res: MedusaResponse) => {
  const [rules] = await listMaxQtyRules({}, { limit: 1000, offset: 0 })
  const [categories] = await listMaxQtyCategories({}, { limit: 1000, offset: 0 })

  res.json({
    rules,
    categories,
  })
}

