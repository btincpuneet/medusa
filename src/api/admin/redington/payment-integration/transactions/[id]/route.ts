import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { retrieveMpgsTransaction } from "~modules/redington-mpgs"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid transaction id" })
  }

  const transaction = await retrieveMpgsTransaction(id)
  if (!transaction) {
    return res.status(404).json({ message: "Transaction not found" })
  }

  res.json({ transaction })
}
