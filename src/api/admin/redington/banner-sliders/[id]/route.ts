import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  findBannerSliderById,
  updateBannerSlider,
  deleteBannerSlider,
} from "../../../../../lib/pg"

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
  res.header("Access-Control-Allow-Methods", "GET,PUT,DELETE,OPTIONS")
  res.header("Access-Control-Allow-Credentials", "true")
}

const parseBoolean = (value: unknown) => {
  if (typeof value === "boolean") {
    return value
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (["1", "true", "yes", "on"].includes(normalized)) {
      return true
    }
    if (["0", "false", "no", "off"].includes(normalized)) {
      return false
    }
  }
  return undefined
}

const resolveSliderId = (req: MedusaRequest) => {
  const paramId = req.params?.id || req.params?.slider_id
  const queryId = req.query?.id
  const bodyId = req.body?.id
  return Number(paramId ?? queryId ?? bodyId)
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const sliderId = resolveSliderId(req)
  if (!sliderId) {
    return res.status(400).json({ message: "slider id is required" })
  }

  const slider = await findBannerSliderById(sliderId)
  if (!slider) {
    return res.status(404).json({ message: "Banner slider not found" })
  }

  return res.json({ slider })
}

export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const sliderId = resolveSliderId(req)
  if (!sliderId) {
    return res.status(400).json({ message: "slider id is required" })
  }

  const body = (req.body || {}) as {
    title?: string
    identifier?: string
    status?: boolean | string
  }

  try {
    const slider = await updateBannerSlider(sliderId, {
      title: body.title,
      identifier: body.identifier,
      status: body.status !== undefined ? parseBoolean(body.status) : undefined,
    })

    return res.json({ slider })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update slider"
    return res.status(400).json({ message })
  }
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const sliderId = resolveSliderId(req)
  if (!sliderId) {
    return res.status(400).json({ message: "slider id is required" })
  }

  try {
    await deleteBannerSlider(sliderId)
    return res.status(204).send()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete slider"
    return res.status(400).json({ message })
  }
}
