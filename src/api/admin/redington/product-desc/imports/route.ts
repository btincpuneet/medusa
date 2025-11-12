import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { ProductTypes } from "@medusajs/framework/types"

import {
  applyProductDescriptions,
  extractProductDescriptionRows,
} from "../../../../../lib/product-desc-import"
import type { ProductDescriptionRow } from "../../../../../lib/product-desc-import"
import {
  insertProductDescImportLog,
  listProductDescImportLogs,
  updateProductDescImportLog,
} from "../../../../../lib/pg"

const clampLimit = (value: unknown, fallback = 20, max = 50) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return Math.min(Math.trunc(parsed), max)
}

const clampOffset = (value: unknown) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }
  return Math.trunc(parsed)
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const limit = clampLimit(req.query?.limit)
  const offset = clampOffset(req.query?.offset)

  const { logs, count } = await listProductDescImportLogs({
    limit,
    offset,
  })

  res.json({
    imports: logs,
    count,
    limit,
    offset,
  })
}

type ImportRequestBody = {
  filename?: string
  content?: string
  notes?: string
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body || {}) as ImportRequestBody
  const filename = (body.filename || "").trim()
  const content = (body.content || "").trim()
  const notes = body.notes?.trim() || null

  if (!filename.length || !content.length) {
    return res.status(400).json({
      message: "filename and content (base64) are required.",
    })
  }

  let buffer: Buffer
  try {
    buffer = Buffer.from(content, "base64")
  } catch {
    return res.status(400).json({
      message: "content must be a valid base64 string.",
    })
  }

  let rows: ProductDescriptionRow[]
  try {
    rows = extractProductDescriptionRows(buffer, filename)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to parse uploaded file."
    return res.status(400).json({ message })
  }

  if (!rows.length) {
    return res.status(400).json({
      message: "No valid rows were found in the uploaded file.",
    })
  }

  if (rows.length > 5000) {
    return res.status(400).json({
      message: "Import batches are limited to 5,000 rows at a time.",
    })
  }

  const productService = req.scope.resolve(
    "product"
  ) as ProductTypes.IProductModuleService

  const job = await insertProductDescImportLog({
    file_name: filename,
    status: "processing",
    notes,
    total_rows: rows.length,
  })

  try {
    const result = await applyProductDescriptions(productService, rows)

    await updateProductDescImportLog(job.id, {
      status: "completed",
      total_rows: result.summary.total,
      success_rows: result.summary.updated,
      failed_rows: result.summary.failed,
      log: result.results,
    })

    res.status(201).json({
      import_id: job.id,
      summary: result.summary,
      results: result.results,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process import."

    await updateProductDescImportLog(job.id, {
      status: "failed",
      log: [
        {
          status: "failed",
          message,
        },
      ],
    })

    res.status(500).json({ message })
  }
}
