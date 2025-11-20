import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  deleteProductEnquiry,
  retrieveProductEnquiry,
  updateProductEnquiry,
} from "../../../../../../lib/pg"

const parseId = (value: unknown) => {
  const parsed = Number.parseInt(String(value ?? ""), 10)
  return Number.isFinite(parsed) ? parsed : null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid enquiry id" })
  }

  const enquiry = await retrieveProductEnquiry(id)
  if (!enquiry) {
    return res.status(404).json({ message: "Enquiry not found" })
  }

  return res.json(enquiry)
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid enquiry id" })
  }

  const updated = await updateProductEnquiry(id, req.body || {})
  if (!updated) {
    return res.status(404).json({ message: "Enquiry not found" })
  }

  return res.json(updated)
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid enquiry id" })
  }

  const removed = await deleteProductEnquiry(id)
  if (!removed) {
    return res.status(404).json({ message: "Enquiry not found" })
  }

  return res.status(204).send()
}
