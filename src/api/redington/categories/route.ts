import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { loadCategoryTree } from "../../../lib/redington/category-tree"
import { sendErrorResponse } from "../utils/respond"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const manager = req.scope.resolve("manager") as {
      query: (sql: string, parameters?: any[]) => Promise<any>
    }
    const tree = await loadCategoryTree(manager)
    const root = tree[0] ?? null
    return res.json(root)
  } catch (error) {
    return sendErrorResponse(res, error, "Unable to load categories.")
  }
}
