import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  deleteProductEnquiry,
  ensureRedingtonProductEnquiryTable,
  retrieveProductEnquiry,
  updateProductEnquiry,
} from "../../../../../lib/pg"

const parseId = (value: unknown): number | null => {
  const parsed = Number.parseInt(String(value ?? ""), 10)
  return Number.isFinite(parsed) ? parsed : null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonProductEnquiryTable()

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid enquiry id" })
  }

  const enquiry = await retrieveProductEnquiry(id)
  if (!enquiry) {
    return res.status(404).json({ message: "Product enquiry not found" })
  }

  return res.json({ product_enquiry: enquiry })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonProductEnquiryTable()

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid enquiry id" })
  }

  const body = (req.body || {}) as Record<string, unknown>

  const updated = await updateProductEnquiry(id, body)
  if (!updated) {
    return res.status(404).json({ message: "Product enquiry not found" })
  }

  return res.json({ product_enquiry: updated })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonProductEnquiryTable()

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid enquiry id" })
  }

  const removed = await deleteProductEnquiry(id)
  if (!removed) {
    return res.status(404).json({ message: "Product enquiry not found" })
  }

  return res.status(204).send()
}
