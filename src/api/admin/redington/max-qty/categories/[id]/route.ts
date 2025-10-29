import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import {
  deleteMaxQtyCategory,
  retrieveMaxQtyCategory,
  updateMaxQtyCategory,
  type CategoryInput,
} from "../../../../../../modules/redington-max-qty"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid category id" })
  }

  const category = await retrieveMaxQtyCategory(id)
  if (!category) {
    return res.status(404).json({ message: "Category rule not found" })
  }

  res.json({ category })
}

export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid category id" })
  }

  const body = (req.body || {}) as Partial<CategoryInput>
  const updated = await updateMaxQtyCategory(id, body)

  if (!updated) {
    return res.status(404).json({ message: "Category rule not found" })
  }

  res.json({ category: updated })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid category id" })
  }

  const deleted = await deleteMaxQtyCategory(id)
  if (!deleted) {
    return res.status(404).json({ message: "Category rule not found" })
  }

  res.status(204).send()
}

