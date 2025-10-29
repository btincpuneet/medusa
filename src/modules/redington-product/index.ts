import type { ProductTypes } from "@medusajs/framework/types"

export type RedingtonProductMetadata = {
  company_code: string | null
  distribution_channel: string | null
}

export type RedingtonProductSummary = {
  id: string
  title: string
  handle: string | null
  status: ProductTypes.ProductStatus
  subtitle: string | null
  description: string | null
  thumbnail: string | null
  company_code: string | null
  distribution_channel: string | null
  variant_skus: string[]
  updated_at: string | Date
  created_at: string | Date
  metadata: Record<string, unknown>
}

const META_KEYS = {
  company_code: "company_code",
  distribution_channel: "distribution_channel",
} as const

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export const normalizeMetadataValue = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null
  }

  const stringValue =
    typeof value === "string" ? value : String(value)
  const trimmed = stringValue.trim()
  return trimmed.length ? trimmed : null
}

export const extractRedingtonProductMetadata = (
  product: ProductTypes.ProductDTO
): RedingtonProductMetadata => {
  const metadata = isRecord(product.metadata)
    ? product.metadata
    : {}

  return {
    company_code: normalizeMetadataValue(metadata[META_KEYS.company_code]),
    distribution_channel: normalizeMetadataValue(
      metadata[META_KEYS.distribution_channel]
    ),
  }
}

export const buildMetadataUpdate = (
  product: ProductTypes.ProductDTO,
  updates: Partial<RedingtonProductMetadata>
): Record<string, unknown> => {
  const metadata = isRecord(product.metadata)
    ? { ...product.metadata }
    : {}

  if (updates.company_code !== undefined) {
    const normalized = normalizeMetadataValue(updates.company_code)
    if (normalized === null) {
      delete metadata[META_KEYS.company_code]
    } else {
      metadata[META_KEYS.company_code] = normalized
    }
  }

  if (updates.distribution_channel !== undefined) {
    const normalized = normalizeMetadataValue(
      updates.distribution_channel
    )
    if (normalized === null) {
      delete metadata[META_KEYS.distribution_channel]
    } else {
      metadata[META_KEYS.distribution_channel] = normalized
    }
  }

  return metadata
}

export const buildRedingtonProductSummary = (
  product: ProductTypes.ProductDTO
): RedingtonProductSummary => {
  const { company_code, distribution_channel } =
    extractRedingtonProductMetadata(product)

  const variantSkus = Array.isArray(product.variants)
    ? Array.from(
        new Set(
          product.variants
            .map((variant) => normalizeMetadataValue(variant.sku))
            .filter((sku): sku is string => sku !== null)
        )
      )
    : []

  const metadata = isRecord(product.metadata)
    ? { ...product.metadata }
    : {}

  return {
    id: product.id,
    title: product.title,
    handle: product.handle ?? null,
    status: product.status,
    subtitle: product.subtitle ?? null,
    description: product.description ?? null,
    thumbnail: product.thumbnail ?? null,
    company_code,
    distribution_channel,
    variant_skus: variantSkus,
    updated_at: product.updated_at,
    created_at: product.created_at,
    metadata,
  }
}

export const detectMetadataChanges = (
  current: RedingtonProductMetadata,
  next: RedingtonProductMetadata
) => ({
  company_code: current.company_code !== next.company_code,
  distribution_channel:
    current.distribution_channel !== next.distribution_channel,
})
