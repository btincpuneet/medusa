import type { ProductTypes } from "@medusajs/framework/types"
import AdmZip from "adm-zip"
import { parse } from "csv-parse/sync"

const SKU_KEYS = ["sku", "product_sku", "item_sku"]
const DESCRIPTION_KEYS = [
  "description",
  "product_description",
  "html",
  "desc",
  "content",
]

export type ProductDescriptionRow = {
  sku: string
  description: string
  source: string
}

export type ProductDescriptionImportResult = {
  summary: {
    total: number
    updated: number
    skipped: number
    failed: number
  }
  results: Array<{
    sku: string
    status: "updated" | "skipped" | "failed"
    message?: string
    source: string
  }>
}

const toUtfString = (buffer: Buffer): string => {
  if (buffer.length >= 2) {
    const b0 = buffer[0]
    const b1 = buffer[1]
    if (b0 === 0xff && b1 === 0xfe) {
      return buffer.toString("utf16le")
    }
    if (b0 === 0xfe && b1 === 0xff) {
      return buffer.swap16().toString("utf16le")
    }
  }
  return buffer.toString("utf8")
}

const pickField = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of Object.keys(record)) {
    const normalized = key.trim().toLowerCase()
    if (keys.includes(normalized)) {
      const value = record[key]
      if (value === null || value === undefined) {
        return ""
      }
      return String(value)
    }
  }
  return ""
}

const parseCsvBuffer = (
  buffer: Buffer,
  source: string
): ProductDescriptionRow[] => {
  const text = toUtfString(buffer)
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  }) as Record<string, unknown>[]

  const rows: ProductDescriptionRow[] = []

  records.forEach((record, index) => {
    const sku = pickField(record, SKU_KEYS).trim()
    const description = pickField(record, DESCRIPTION_KEYS)
    if (!sku || !description.trim().length) {
      return
    }
    rows.push({
      sku,
      description,
      source: `${source}#${index + 2}`,
    })
  })

  return rows
}

export const extractProductDescriptionRows = (
  buffer: Buffer,
  filename: string
): ProductDescriptionRow[] => {
  const normalizedName = filename.toLowerCase()

  if (normalizedName.endsWith(".zip")) {
    const archive = new AdmZip(buffer)
    const rows: ProductDescriptionRow[] = []
    archive.getEntries().forEach((entry) => {
      if (entry.isDirectory) {
        return
      }
      if (!entry.entryName.toLowerCase().endsWith(".csv")) {
        return
      }
      const data = entry.getData()
      rows.push(...parseCsvBuffer(data, entry.entryName))
    })

    if (!rows.length) {
      throw new Error("ZIP archive does not contain any CSV files.")
    }

    return rows
  }

  if (normalizedName.endsWith(".csv")) {
    return parseCsvBuffer(buffer, filename)
  }

  throw new Error("Only .zip or .csv files are supported.")
}

export const applyProductDescriptions = async (
  productService: ProductTypes.IProductModuleService,
  rows: ProductDescriptionRow[]
): Promise<ProductDescriptionImportResult> => {
  const results: ProductDescriptionImportResult["results"] = []
  let updated = 0
  let skipped = 0
  let failed = 0

  for (const row of rows) {
    const sku = row.sku.trim()
    if (!sku || !row.description.trim().length) {
      skipped++
      results.push({
        sku,
        status: "skipped",
        message: "Missing SKU or description.",
        source: row.source,
      })
      continue
    }

    try {
      const products = await productService.listProducts(
        { sku },
        {
          take: 1,
          order: { created_at: "DESC" },
          relations: [],
        }
      )

      const product = products[0]
      if (!product) {
        failed++
        results.push({
          sku,
          status: "failed",
          message: "Product not found for SKU.",
          source: row.source,
        })
        continue
      }

      const currentDescription = (product.description || "").trim()
      if (currentDescription === row.description.trim()) {
        skipped++
        results.push({
          sku,
          status: "skipped",
          message: "Description already up to date.",
          source: row.source,
        })
        continue
      }

      await productService.updateProducts(product.id, {
        description: row.description,
      })

      updated++
      results.push({
        sku,
        status: "updated",
        source: row.source,
      })
    } catch (error) {
      failed++
      const message =
        error instanceof Error ? error.message : "Unknown update error."
      results.push({
        sku,
        status: "failed",
        message,
        source: row.source,
      })
    }
  }

  return {
    summary: {
      total: rows.length,
      updated,
      skipped,
      failed,
    },
    results,
  }
}
