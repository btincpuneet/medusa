import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { findBannerSliderById } from "../../../../../lib/pg"

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
  res.header("Access-Control-Allow-Methods", "GET,OPTIONS")
  res.header("Access-Control-Allow-Credentials", "true")
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const rawId = req.params?.sliderId ?? req.params?.slider_id
  const sliderId = Number.parseInt(String(rawId ?? ""), 10)

  if (!Number.isFinite(sliderId)) {
    return res.status(400).json({
      message: "Invalid slider id",
    })
  }

  const slider = await findBannerSliderById(sliderId)
  if (!slider) {
    return res.status(404).json({
      message: `Slider ${sliderId} not found`,
    })
  }

  return res.json(slider)
}
