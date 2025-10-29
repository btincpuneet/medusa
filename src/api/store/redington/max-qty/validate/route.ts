import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  type MaxQtyValidateItem,
  type MaxQtyValidationResult,
  validateItemsAgainstMaxQty,
} from "../../../../../modules/redington-max-qty"

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

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const body = (req.body || {}) as { items?: MaxQtyValidateItem[] }
  if (!Array.isArray(body.items) || !body.items.length) {
    return res.status(400).json({
      valid: false,
      violations: [],
      message: "items array is required",
    })
  }

  try {
    const result: MaxQtyValidationResult = await validateItemsAgainstMaxQty(
      body.items
    )
    res.json(result)
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to validate max quantity rules."
    res.status(500).json({
      valid: false,
      violations: [],
      message,
    })
  }
}
