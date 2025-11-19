import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  findBannerById,
  updateBanner,
  deleteBanner,
} from "../../../../../../../lib/pg"

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

const resolveBannerId = (req: MedusaRequest) => {
  const paramId = req.params?.bannerId || req.params?.banner_id
  const queryId = req.query?.bannerId
  const bodyId = req.body?.id
  return Number(paramId ?? queryId ?? bodyId)
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const bannerId = resolveBannerId(req)
  if (!bannerId) {
    return res.status(400).json({ message: "banner id is required" })
  }

  const banner = await findBannerById(bannerId)
  if (!banner) {
    return res.status(404).json({ message: "Banner not found" })
  }

  return res.json({ banner })
}

export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const bannerId = resolveBannerId(req)
  if (!bannerId) {
    return res.status(400).json({ message: "banner id is required" })
  }

  const body = (req.body || {}) as {
    title?: string
    image_url?: string | null
    link_url?: string | null
    sort_order?: number
    status?: boolean | string
  }

  try {
    const banner = await updateBanner(bannerId, {
      title: body.title,
      image_url: body.image_url,
      link_url: body.link_url,
      sort_order: body.sort_order,
      status: body.status,
    })

    return res.json({ banner })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update banner"
    return res.status(400).json({ message })
  }
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const bannerId = resolveBannerId(req)
  if (!bannerId) {
    return res.status(400).json({ message: "banner id is required" })
  }

  try {
    await deleteBanner(bannerId)
    return res.status(204).send()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete banner"
    return res.status(400).json({ message })
  }
}
