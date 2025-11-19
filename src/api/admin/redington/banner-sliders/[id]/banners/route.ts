import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  listBannersBySlider,
  createBanner,
} from "../../../../../../lib/pg"

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

const resolveSliderId = (req: MedusaRequest) => {
  const paramId = req.params?.id || req.params?.slider_id
  const queryId = req.query?.id
  const bodyId = req.body?.slider_id
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

  const banners = await listBannersBySlider(sliderId)
  return res.json({ banners })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const sliderId = resolveSliderId(req)
  if (!sliderId) {
    return res.status(400).json({ message: "slider id is required" })
  }

  const body = (req.body || {}) as {
    title?: string
    image_url?: string | null
    link_url?: string | null
    sort_order?: number
    status?: boolean | string
  }

  try {
    const banner = await createBanner(sliderId, {
      title: body.title || "",
      image_url: body.image_url || null,
      link_url: body.link_url || null,
      sort_order: body.sort_order,
      status: body.status,
    })

    return res.status(201).json({ banner })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create banner"
    return res.status(400).json({ message })
  }
}
