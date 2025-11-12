import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { findProductDescImportLog } from "../../../../../../lib/pg"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const id = Number(req.params?.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid import id." })
  }

  const log = await findProductDescImportLog(id)
  if (!log) {
    return res.status(404).json({ message: "Import log not found." })
  }

  res.json({ import: log })
}
