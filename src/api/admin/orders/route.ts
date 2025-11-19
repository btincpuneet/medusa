import { getOrdersListWorkflow } from "@medusajs/core-flows"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

type MagentoFilterValue =
  | string
  | { value: string; operator?: "$eq" | "$ilike" | "eq" }
  | Array<string | { value: string }>

const normalizeMagentoFilter = (
  value: MagentoFilterValue
):
  | { $ilike: string }
  | { $in: string[] }
  | undefined => {
  if (!value) {
    return undefined
  }

  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed.length) {
      return undefined
    }
    return { $ilike: `%${trimmed}%` }
  }

  if (Array.isArray(value)) {
    const sanitized = value
      .map((entry) =>
        typeof entry === "string" ? entry.trim() : entry?.value?.trim()
      )
      .filter((entry): entry is string => Boolean(entry && entry.length))

    if (!sanitized.length) {
      return undefined
    }

    return { $in: sanitized }
  }

  if (typeof value === "object") {
    const candidate =
      typeof value.value === "string" ? value.value.trim() : undefined
    if (!candidate) {
      return undefined
    }
    if (value.operator === "$ilike") {
      return { $ilike: candidate }
    }
    if (value.operator === "$eq" || value.operator === "eq") {
      return { $in: [candidate] }
    }
    return { $ilike: `%${candidate}%` }
  }

  return undefined
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const filters: Record<string, unknown> = {
    ...req.filterableFields,
    is_draft_order: false,
  }

  if ("magento_order_id" in filters) {
    const magentoFilter = normalizeMagentoFilter(
      filters.magento_order_id as MagentoFilterValue
    )
    if (magentoFilter) {
      filters.magento_order_id = magentoFilter
    } else {
      delete filters.magento_order_id
    }
  }

  const workflow = getOrdersListWorkflow(req.scope)
  const { result } = await workflow.run({
    input: {
      fields: req.queryConfig.fields,
      variables: {
        filters,
        ...req.queryConfig.pagination,
      },
    },
  })

  const { rows, metadata } = result

  res.json({
    orders: rows,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}

export { POST } from "@medusajs/medusa/api/admin/orders/route"
