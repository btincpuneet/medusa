import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { ProductTypes } from "@medusajs/framework/types"
import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import createSapClient from "../../../../../modules/sap-client"
import {
  buildMetadataUpdate,
  buildRedingtonProductSummary,
  detectMetadataChanges,
  extractRedingtonProductMetadata,
  normalizeMetadataValue,
  type RedingtonProductMetadata,
  type RedingtonProductSummary,
} from "../../../../../modules/redington-product"

type ProductDetailResponse = {
  product?: RedingtonProductSummary
  metadata_changes?: {
    company_code: boolean
    distribution_channel: boolean
  }
  sap_sync?: {
    triggered: boolean
    results: Array<{
      sku: string
      status: "success" | "error"
      message?: string
    }>
  }
  message?: string
}

type UpdateProductBody = {
  company_code?: string | null
  distribution_channel?: string | null
}

const loadProduct = async (
  productService: ProductTypes.IProductModuleService,
  productId: string
) => {
  return await productService.retrieveProduct(productId, {
    relations: ["variants", "options"],
  })
}

const logWarning = (req: MedusaRequest, message: string) => {
  try {
    const logger = req.scope.resolve(
      ContainerRegistrationKeys.LOGGER
    ) as { warn?: (...args: unknown[]) => void }
    logger?.warn?.(message)
  } catch (_) {
    // ignore logging errors
  }
}

const logError = (req: MedusaRequest, message: string) => {
  try {
    const logger = req.scope.resolve(
      ContainerRegistrationKeys.LOGGER
    ) as { error?: (...args: unknown[]) => void }
    logger?.error?.(message)
  } catch (_) {
    // ignore logging errors
  }
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse<ProductDetailResponse>
) => {
  const productService = req.scope.resolve(
    "product"
  ) as ProductTypes.IProductModuleService

  const { id } = req.params

  try {
    const product = await loadProduct(productService, id)
    res.json({
      product: buildRedingtonProductSummary(product),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Product not found."
    res.status(404).json({ message })
  }
}

export const PATCH = async (
  req: MedusaRequest,
  res: MedusaResponse<ProductDetailResponse>
) => {
  const productService = req.scope.resolve(
    "product"
  ) as ProductTypes.IProductModuleService

  const { id } = req.params
  const body = (req.body || {}) as UpdateProductBody

  const hasCompanyCode = Object.prototype.hasOwnProperty.call(
    body,
    "company_code"
  )
  const hasDistribution = Object.prototype.hasOwnProperty.call(
    body,
    "distribution_channel"
  )

  if (!hasCompanyCode && !hasDistribution) {
    return res.status(400).json({
      message:
        "Provide company_code and/or distribution_channel to update the product metadata.",
    })
  }

  let product: ProductTypes.ProductDTO
  try {
    product = await loadProduct(productService, id)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Product not found."
    return res.status(404).json({ message })
  }

  const currentMetadata = extractRedingtonProductMetadata(product)

  const updates: Partial<RedingtonProductMetadata> = {}
  if (hasCompanyCode) {
    updates.company_code = normalizeMetadataValue(body.company_code)
  }
  if (hasDistribution) {
    updates.distribution_channel = normalizeMetadataValue(
      body.distribution_channel
    )
  }

  const nextMetadata: RedingtonProductMetadata = {
    company_code:
      updates.company_code !== undefined
        ? updates.company_code
        : currentMetadata.company_code,
    distribution_channel:
      updates.distribution_channel !== undefined
        ? updates.distribution_channel
        : currentMetadata.distribution_channel,
  }

  const metadataChanges = detectMetadataChanges(
    currentMetadata,
    nextMetadata
  )

  if (!metadataChanges.company_code && !metadataChanges.distribution_channel) {
    return res.json({
      product: buildRedingtonProductSummary(product),
      metadata_changes: metadataChanges,
      message: "No changes detected.",
    })
  }

  try {
    const metadataPayload = buildMetadataUpdate(product, updates)
    await productService.updateProducts(id, {
      metadata: metadataPayload,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update product metadata."
    return res.status(500).json({ message })
  }

  const updated = await loadProduct(productService, id)
  const summary = buildRedingtonProductSummary(updated)

  const sapSync = {
    triggered: false,
    results: [] as Array<{
      sku: string
      status: "success" | "error"
      message?: string
    }>,
  }

  if (
    (metadataChanges.company_code || metadataChanges.distribution_channel) &&
    summary.company_code &&
    summary.variant_skus.length
  ) {
    const sapClient = createSapClient()
    sapSync.triggered = true

    for (const sku of summary.variant_skus) {
      try {
        await sapClient.createProduct(summary.company_code, sku)
        sapSync.results.push({
          sku,
          status: "success",
        })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown SAP sync error."
        sapSync.results.push({
          sku,
          status: "error",
          message,
        })
        logError(
          req,
          `[redington-product] Failed to sync SKU "${sku}" with SAP: ${message}`
        )
      }
    }
  } else if (
    metadataChanges.company_code &&
    !summary.company_code
  ) {
    logWarning(
      req,
      "[redington-product] company_code removed; SAP sync skipped."
    )
  } else if (!summary.variant_skus.length) {
    logWarning(
      req,
      "[redington-product] Product has no variants with SKUs; SAP sync skipped."
    )
  }

  res.json({
    product: summary,
    metadata_changes: metadataChanges,
    sap_sync: sapSync.triggered ? sapSync : undefined,
  })
}
