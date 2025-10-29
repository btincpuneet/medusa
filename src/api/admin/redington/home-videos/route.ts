import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  createHomeVideo,
  listHomeVideos,
} from "../../../../lib/pg"

const parseBoolean = (value: unknown, fallback = true) => {
  if (value === undefined) {
    return fallback
  }
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
  return fallback
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const videos = await listHomeVideos()
  return res.json({
    home_videos: videos,
  })
}

type CreateHomeVideoBody = {
  title?: string
  url?: string
  status?: boolean | string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as CreateHomeVideoBody

  const title = (body.title ?? "").toString().trim()
  const url = (body.url ?? "").toString().trim()

  if (!title || !url) {
    return res.status(400).json({
      message: "title and url are required",
    })
  }

  try {
    const video = await createHomeVideo({
      title,
      url,
      status: parseBoolean(body.status, true),
    })

    return res.status(201).json({
      home_video: video,
    })
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Invalid payload",
    })
  }
}
