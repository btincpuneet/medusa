import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  createBannerSlider,
  listBannerSliders,
} from "../../../../lib/pg"

const parseBoolean = (value: unknown, fallback = true) => {
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
  if (value === undefined || value === null) {
    return fallback
  }
  return Boolean(value)
}

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
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  res.header("Access-Control-Allow-Credentials", "true")
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  const sliders = await listBannerSliders()
  return res.json({ sliders })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const body = (req.body || {}) as {
    title?: string
    identifier?: string
    status?: boolean | string
  }

  const title = (body.title || "").trim()
  if (!title.length) {
    return res.status(400).json({ message: "title is required" })
  }

  try {
    const slider = await createBannerSlider({
      title,
      identifier: body.identifier,
      status: parseBoolean(body.status, true),
    })

    return res.status(201).json({ slider })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create slider"
    return res.status(400).json({ message })
  }
}
