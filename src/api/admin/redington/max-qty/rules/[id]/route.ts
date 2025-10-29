import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import {
  deleteMaxQtyRule,
  retrieveMaxQtyRule,
  updateMaxQtyRule,
  type RuleInput,
} from "../../../../../../modules/redington-max-qty"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid rule id" })
  }

  const rule = await retrieveMaxQtyRule(id)
  if (!rule) {
    return res.status(404).json({ message: "Rule not found" })
  }

  res.json({ rule })
}

export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid rule id" })
  }

  const body = (req.body || {}) as Partial<RuleInput>
  const updated = await updateMaxQtyRule(id, body)

  if (!updated) {
    return res.status(404).json({ message: "Rule not found" })
  }

  res.json({ rule: updated })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid rule id" })
  }

  const deleted = await deleteMaxQtyRule(id)
  if (!deleted) {
    return res.status(404).json({ message: "Rule not found" })
  }

  res.status(204).send()
}

