import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  getLogDownloadHandle,
  LogViewerError,
  tailLogFile,
} from "../../../../../lib/log-viewer"

const clampLimit = (value: unknown) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return undefined
  }
  return Math.min(2000, Math.max(50, Math.trunc(parsed)))
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const rawName = req.params?.name

  if (!rawName || !rawName.length) {
    return res.status(400).json({ message: "Log name is required." })
  }

  const wantsDownload =
    "download" in (req.query ?? {}) ||
    (typeof req.query?.download === "string" &&
      req.query.download.toLowerCase() !== "false")

  try {
    if (wantsDownload) {
      const handle = await getLogDownloadHandle(rawName)
      res.setHeader("Content-Type", "text/plain; charset=utf-8")
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${handle.name}"`
      )
      res.setHeader("Content-Length", handle.size.toString())
      handle.stream.on("error", (err) => {
        res.destroy(err)
      })
      handle.stream.pipe(res)
      return
    }

    const limit = clampLimit(req.query?.limit) ?? undefined
    const log = await tailLogFile(rawName, {
      lines: limit,
    })
    return res.json({
      log,
      limit: limit ?? log.lines.length,
    })
  } catch (error: any) {
    if (error instanceof LogViewerError) {
      return res.status(error.status).json({ message: error.message })
    }
    return res.status(500).json({
      message: error?.message || "Unable to read log file.",
    })
  }
}
