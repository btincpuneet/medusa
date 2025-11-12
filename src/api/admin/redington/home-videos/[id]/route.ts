import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  deleteHomeVideo,
  findHomeVideoById,
  updateHomeVideo,
} from "../../../../../lib/pg"

const parseId = (raw: unknown): number | null => {
  const value = Number.parseInt(String(raw ?? ""), 10)
  return Number.isFinite(value) && value > 0 ? value : null
}

const parseBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined) {
    return undefined
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

  return undefined
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const id = parseId(req.params?.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid home video id" })
  }

  const body = (req.body || {}) as {
    title?: string
    url?: string
    status?: boolean | string
  }

  const updates: { title?: string; url?: string; status?: boolean } = {}

  if (body.title !== undefined) {
    updates.title = String(body.title)
  }

  if (body.url !== undefined) {
    updates.url = String(body.url)
  }

  const status = parseBoolean(body.status)
  if (status !== undefined) {
    updates.status = status
  }

  if (!Object.keys(updates).length) {
    return res.status(400).json({
      message: "Provide at least one field to update.",
    })
  }

  try {
    const video = await updateHomeVideo(id, updates)

    return res.json({ home_video: video })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update home video"

    if (message.toLowerCase().includes("not found")) {
      return res.status(404).json({ message })
    }

    return res.status(400).json({ message })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const id = parseId(req.params?.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid home video id" })
  }

  await deleteHomeVideo(id)

  return res.status(204).send()
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const id = parseId(req.params?.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid home video id" })
  }

  const video = await findHomeVideoById(id)
  if (!video) {
    return res.status(404).json({ message: "Home video not found" })
  }

  return res.json({ home_video: video })
}
