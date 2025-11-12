import {
  ensureRedingtonMaxQtyCategoryTable,
  ensureRedingtonMaxQtyRuleTable,
  ensureRedingtonOrderQuantityTrackerTable,
  findAccessMappingByAccessId,
  getPgPool,
  mapMaxQtyCategoryRow,
  mapMaxQtyRuleRow,
  mapOrderQuantityTrackerRow,
  type MaxQtyCategoryRow,
  type MaxQtyRuleRow,
  type OrderQuantityTrackerRow,
} from "../../lib/pg"
import type {
  CartDTO,
  CartLineItemDTO,
} from "@medusajs/types"

const normalizeString = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim()
  }
  if (value === null || value === undefined) {
    return ""
  }
  return String(value).trim()
}

const normalizeNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return fallback
  }
  return parsed
}

const normalizeOptionalNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const buildRuleWhereClauses = (filters: Partial<MaxQtyRuleFilters>) => {
  const conditions: string[] = []
  const params: Array<string | number> = []

  if (filters.category_id) {
    params.push(filters.category_id.trim())
    conditions.push(`category_id = $${params.length}`)
  }

  if (filters.brand_id) {
    params.push(filters.brand_id.trim())
    conditions.push(`brand_id = $${params.length}`)
  }

  if (filters.company_code) {
    params.push(filters.company_code.trim())
    conditions.push(`company_code = $${params.length}`)
  }

  if (filters.domain_id !== undefined) {
    if (filters.domain_id === null) {
      conditions.push(`domain_id IS NULL`)
    } else {
      params.push(filters.domain_id)
      conditions.push(`domain_id = $${params.length}`)
    }
  }

  return { conditions, params }
}

const buildCategoryWhereClauses = (
  filters: Partial<MaxQtyCategoryFilters>
) => {
  const conditions: string[] = []
  const params: Array<string | number> = []

  if (filters.category_ids) {
    params.push(filters.category_ids.trim())
    conditions.push(`category_ids = $${params.length}`)
  }

  if (filters.brand_id) {
    params.push(filters.brand_id.trim())
    conditions.push(`brand_id = $${params.length}`)
  }

  if (filters.company_code) {
    params.push(filters.company_code.trim())
    conditions.push(`company_code = $${params.length}`)
  }

  if (filters.domain_id !== undefined) {
    if (filters.domain_id === null) {
      conditions.push(`domain_id IS NULL`)
    } else {
      params.push(filters.domain_id)
      conditions.push(`domain_id = $${params.length}`)
    }
  }

  return { conditions, params }
}

export type MaxQtyRuleFilters = {
  category_id?: string
  brand_id?: string
  company_code?: string
  domain_id?: number | null
}

export type MaxQtyCategoryFilters = {
  category_ids?: string
  brand_id?: string
  company_code?: string
  domain_id?: number | null
}

export type RuleInput = {
  category_id: string
  brand_id: string
  company_code: string
  domain_id?: number | null
  max_qty: number
}

export type CategoryInput = {
  category_ids: string
  brand_id: string
  company_code: string
  domain_id?: number | null
  max_qty: number
}

export type OrderTrackerInput = {
  customer_id: number
  order_increment_id: string
  sku: string
  quantity: number
  brand_id?: string | null
}

export type MaxQtyValidateItem = {
  sku: string
  quantity: number
  brand_id?: string | null
  company_code?: string | null
  category_id?: string | null
  category_ids?: string[]
  domain_id?: number | null
}

export type MaxQtyViolation = {
  key: string
  sku: string
  quantity: number
  max_qty: number
  rule_type: "rule" | "category"
  rule_id: number
  company_code: string
  brand_id: string
  domain_id: number | null
  category_ids: string[]
  message: string
}

export type MaxQtyValidationResult = {
  valid: boolean
  violations: MaxQtyViolation[]
}

const buildRuleKey = (
  categoryId: string,
  brandId: string,
  companyCode: string,
  domainId: number | null
) => `${categoryId}::${brandId}::${companyCode}::${domainId ?? "null"}`

const parseCategoryIdsFromString = (value: string): string[] => {
  return value
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

const toDomainId = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null
}

const clampPagination = (
  limit: unknown,
  offset: unknown,
  maxLimit = 100,
  defaultLimit = 25
) => {
  const parsedLimit = clampLimit(limit, defaultLimit, maxLimit)
  const parsedOffset = clampOffset(offset)
  return { limit: parsedLimit, offset: parsedOffset }
}

const clampLimit = (
  value: unknown,
  fallback = 25,
  max = 100
): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return Math.min(Math.trunc(parsed), max)
}

const clampOffset = (value: unknown): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }
  return Math.trunc(parsed)
}

export const listMaxQtyRules = async (
  filters: Partial<MaxQtyRuleFilters> = {},
  pagination: { limit?: number; offset?: number } = {}
): Promise<[MaxQtyRuleRow[], number]> => {
  await ensureRedingtonMaxQtyRuleTable()

  const { conditions, params } = buildRuleWhereClauses(filters)
  const { limit, offset } = clampPagination(
    pagination.limit,
    pagination.offset
  )

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : ""

  const dataParams = [...params, limit, offset]
  const { rows } = await getPgPool().query(
    `
      SELECT id,
             category_id,
             brand_id,
             company_code,
             domain_id,
             max_qty,
             created_at,
             updated_at
      FROM redington_max_qty_rule
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${dataParams.length - 1}
      OFFSET $${dataParams.length}
    `,
    dataParams
  )

  const countResult = await getPgPool().query(
    `
      SELECT COUNT(*) AS count
      FROM redington_max_qty_rule
      ${whereClause}
    `,
    params
  )

  const count = Number(countResult.rows[0]?.count ?? 0)

  return [rows.map(mapMaxQtyRuleRow), count]
}

export const createMaxQtyRule = async (
  input: RuleInput
): Promise<MaxQtyRuleRow> => {
  await ensureRedingtonMaxQtyRuleTable()

  const payload = {
    category_id: normalizeString(input.category_id),
    brand_id: normalizeString(input.brand_id),
    company_code: normalizeString(input.company_code),
    domain_id: normalizeOptionalNumber(input.domain_id),
    max_qty: normalizeNumber(input.max_qty, 0),
  }

  const { rows } = await getPgPool().query(
    `
      INSERT INTO redington_max_qty_rule (
        category_id,
        brand_id,
        company_code,
        domain_id,
        max_qty
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (category_id, brand_id, company_code, domain_id) DO UPDATE
        SET max_qty = EXCLUDED.max_qty,
            updated_at = NOW()
      RETURNING *
    `,
    [
      payload.category_id,
      payload.brand_id,
      payload.company_code,
      payload.domain_id,
      payload.max_qty,
    ]
  )

  return mapMaxQtyRuleRow(rows[0])
}

export const updateMaxQtyRule = async (
  id: number,
  input: Partial<RuleInput>
): Promise<MaxQtyRuleRow | null> => {
  await ensureRedingtonMaxQtyRuleTable()

  const fields: string[] = []
  const params: Array<string | number | null> = []

  if (input.category_id !== undefined) {
    params.push(normalizeString(input.category_id))
    fields.push(`category_id = $${params.length}`)
  }
  if (input.brand_id !== undefined) {
    params.push(normalizeString(input.brand_id))
    fields.push(`brand_id = $${params.length}`)
  }
  if (input.company_code !== undefined) {
    params.push(normalizeString(input.company_code))
    fields.push(`company_code = $${params.length}`)
  }
  if (input.domain_id !== undefined) {
    params.push(normalizeOptionalNumber(input.domain_id))
    fields.push(`domain_id = $${params.length}`)
  }
  if (input.max_qty !== undefined) {
    params.push(normalizeNumber(input.max_qty, 0))
    fields.push(`max_qty = $${params.length}`)
  }

  if (!fields.length) {
    const existing = await getPgPool().query(
      `
        SELECT *
        FROM redington_max_qty_rule
        WHERE id = $1
      `,
      [id]
    )
    return existing.rows[0] ? mapMaxQtyRuleRow(existing.rows[0]) : null
  }

  params.push(id)

  const { rows } = await getPgPool().query(
    `
      UPDATE redington_max_qty_rule
      SET ${fields.join(", ")},
          updated_at = NOW()
      WHERE id = $${params.length}
      RETURNING *
    `,
    params
  )

  return rows[0] ? mapMaxQtyRuleRow(rows[0]) : null
}

export const deleteMaxQtyRule = async (id: number): Promise<boolean> => {
  await ensureRedingtonMaxQtyRuleTable()

  const result = await getPgPool().query(
    `
      DELETE FROM redington_max_qty_rule
      WHERE id = $1
    `,
    [id]
  )

  return result.rowCount > 0
}

export const retrieveMaxQtyRule = async (
  id: number
): Promise<MaxQtyRuleRow | null> => {
  await ensureRedingtonMaxQtyRuleTable()

  const { rows } = await getPgPool().query(
    `
      SELECT id,
             category_id,
             brand_id,
             company_code,
             domain_id,
             max_qty,
             created_at,
             updated_at
      FROM redington_max_qty_rule
      WHERE id = $1
    `,
    [id]
  )

  return rows[0] ? mapMaxQtyRuleRow(rows[0]) : null
}

export const listMaxQtyCategories = async (
  filters: Partial<MaxQtyCategoryFilters> = {},
  pagination: { limit?: number; offset?: number } = {}
): Promise<[MaxQtyCategoryRow[], number]> => {
  await ensureRedingtonMaxQtyCategoryTable()

  const { conditions, params } = buildCategoryWhereClauses(filters)
  const { limit, offset } = clampPagination(
    pagination.limit,
    pagination.offset
  )

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : ""

  const dataParams = [...params, limit, offset]
  const { rows } = await getPgPool().query(
    `
      SELECT id,
             category_ids,
             brand_id,
             company_code,
             domain_id,
             max_qty,
             created_at,
             updated_at
      FROM redington_max_qty_category
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${dataParams.length - 1}
      OFFSET $${dataParams.length}
    `,
    dataParams
  )

  const countResult = await getPgPool().query(
    `
      SELECT COUNT(*) AS count
      FROM redington_max_qty_category
      ${whereClause}
    `,
    params
  )

  const count = Number(countResult.rows[0]?.count ?? 0)

  return [rows.map(mapMaxQtyCategoryRow), count]
}

export const createMaxQtyCategory = async (
  input: CategoryInput
): Promise<MaxQtyCategoryRow> => {
  await ensureRedingtonMaxQtyCategoryTable()

  const payload = {
    category_ids: normalizeString(input.category_ids),
    brand_id: normalizeString(input.brand_id),
    company_code: normalizeString(input.company_code),
    domain_id: normalizeOptionalNumber(input.domain_id),
    max_qty: normalizeNumber(input.max_qty, 0),
  }

  const { rows } = await getPgPool().query(
    `
      INSERT INTO redington_max_qty_category (
        category_ids,
        brand_id,
        company_code,
        domain_id,
        max_qty
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (category_ids, brand_id, company_code, domain_id) DO UPDATE
        SET max_qty = EXCLUDED.max_qty,
            updated_at = NOW()
      RETURNING *
    `,
    [
      payload.category_ids,
      payload.brand_id,
      payload.company_code,
      payload.domain_id,
      payload.max_qty,
    ]
  )

  return mapMaxQtyCategoryRow(rows[0])
}

export const updateMaxQtyCategory = async (
  id: number,
  input: Partial<CategoryInput>
): Promise<MaxQtyCategoryRow | null> => {
  await ensureRedingtonMaxQtyCategoryTable()

  const fields: string[] = []
  const params: Array<string | number | null> = []

  if (input.category_ids !== undefined) {
    params.push(normalizeString(input.category_ids))
    fields.push(`category_ids = $${params.length}`)
  }
  if (input.brand_id !== undefined) {
    params.push(normalizeString(input.brand_id))
    fields.push(`brand_id = $${params.length}`)
  }
  if (input.company_code !== undefined) {
    params.push(normalizeString(input.company_code))
    fields.push(`company_code = $${params.length}`)
  }
  if (input.domain_id !== undefined) {
    params.push(normalizeOptionalNumber(input.domain_id))
    fields.push(`domain_id = $${params.length}`)
  }
  if (input.max_qty !== undefined) {
    params.push(normalizeNumber(input.max_qty, 0))
    fields.push(`max_qty = $${params.length}`)
  }

  if (!fields.length) {
    const existing = await getPgPool().query(
      `
        SELECT *
        FROM redington_max_qty_category
        WHERE id = $1
      `,
      [id]
    )
    return existing.rows[0] ? mapMaxQtyCategoryRow(existing.rows[0]) : null
  }

  params.push(id)

  const { rows } = await getPgPool().query(
    `
      UPDATE redington_max_qty_category
      SET ${fields.join(", ")},
          updated_at = NOW()
      WHERE id = $${params.length}
      RETURNING *
    `,
    params
  )

  return rows[0] ? mapMaxQtyCategoryRow(rows[0]) : null
}

export const deleteMaxQtyCategory = async (
  id: number
): Promise<boolean> => {
  await ensureRedingtonMaxQtyCategoryTable()

  const result = await getPgPool().query(
    `
      DELETE FROM redington_max_qty_category
      WHERE id = $1
    `,
    [id]
  )

  return result.rowCount > 0
}

export const retrieveMaxQtyCategory = async (
  id: number
): Promise<MaxQtyCategoryRow | null> => {
  await ensureRedingtonMaxQtyCategoryTable()

  const { rows } = await getPgPool().query(
    `
      SELECT id,
             category_ids,
             brand_id,
             company_code,
             domain_id,
             max_qty,
             created_at,
             updated_at
      FROM redington_max_qty_category
      WHERE id = $1
    `,
    [id]
  )

  return rows[0] ? mapMaxQtyCategoryRow(rows[0]) : null
}

export const upsertOrderQuantityTracker = async (
  input: OrderTrackerInput
): Promise<OrderQuantityTrackerRow> => {
  await ensureRedingtonOrderQuantityTrackerTable()

  const payload = {
    customer_id: normalizeNumber(input.customer_id),
    order_increment_id: normalizeString(input.order_increment_id),
    sku: normalizeString(input.sku),
    quantity: normalizeNumber(input.quantity, 0),
    brand_id: normalizeString(input.brand_id ?? "") || null,
  }

  const { rows } = await getPgPool().query(
    `
      INSERT INTO redington_order_quantity_tracker (
        customer_id,
        order_increment_id,
        sku,
        quantity,
        brand_id
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (customer_id, order_increment_id, sku) DO UPDATE
        SET quantity = EXCLUDED.quantity,
            brand_id = EXCLUDED.brand_id,
            updated_at = NOW()
      RETURNING *
    `,
    [
      payload.customer_id,
      payload.order_increment_id,
      payload.sku,
      payload.quantity,
      payload.brand_id,
    ]
  )

  return mapOrderQuantityTrackerRow(rows[0])
}

export const purgeOrderQuantityTracker = async (
  before: Date
): Promise<number> => {
  await ensureRedingtonOrderQuantityTrackerTable()

  const { rowCount } = await getPgPool().query(
    `
      DELETE FROM redington_order_quantity_tracker
      WHERE created_at < $1
    `,
    [before.toISOString()]
  )

  return rowCount ?? 0
}

export type OrderTrackerFilters = {
  customer_id?: number
  order_increment_id?: string
  sku?: string
  brand_id?: string
}

export const listOrderQuantityTracker = async (
  filters: Partial<OrderTrackerFilters> = {},
  pagination: { limit?: number; offset?: number } = {}
): Promise<[OrderQuantityTrackerRow[], number]> => {
  await ensureRedingtonOrderQuantityTrackerTable()

  const conditions: string[] = []
  const params: Array<string | number> = []

  if (typeof filters.customer_id === "number") {
    params.push(filters.customer_id)
    conditions.push(`customer_id = $${params.length}`)
  }

  if (filters.order_increment_id) {
    params.push(filters.order_increment_id.trim())
    conditions.push(`order_increment_id = $${params.length}`)
  }

  if (filters.sku) {
    params.push(filters.sku.trim())
    conditions.push(`sku = $${params.length}`)
  }

  if (filters.brand_id) {
    params.push(filters.brand_id.trim())
    conditions.push(`brand_id = $${params.length}`)
  }

  const { limit, offset } = clampPagination(
    pagination.limit,
    pagination.offset
  )

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : ""

  const dataParams = [...params, limit, offset]

  const { rows } = await getPgPool().query(
    `
      SELECT id,
             customer_id,
             order_increment_id,
             sku,
             quantity,
             brand_id,
             created_at,
             updated_at
      FROM redington_order_quantity_tracker
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${dataParams.length - 1}
      OFFSET $${dataParams.length}
    `,
    dataParams
  )

  const countResult = await getPgPool().query(
    `
      SELECT COUNT(*) AS count
      FROM redington_order_quantity_tracker
      ${whereClause}
    `,
    params
  )

  const count = Number(countResult.rows[0]?.count ?? 0)

  return [rows.map(mapOrderQuantityTrackerRow), count]
}

export type {
  MaxQtyRuleRow,
  MaxQtyCategoryRow,
  OrderQuantityTrackerRow,
} from "../../lib/pg"

const fetchRulesAndCategories = async () => {
  const [rules] = await listMaxQtyRules({}, { limit: 1000, offset: 0 })
  const [categories] = await listMaxQtyCategories({}, { limit: 1000, offset: 0 })

  const ruleMap = new Map<
    string,
    {
      id: number
      max_qty: number
      company_code: string
      brand_id: string
      domain_id: number | null
      category_id: string
    }
  >()

  for (const rule of rules) {
    const key = buildRuleKey(
      rule.category_id,
      normalizeString(rule.brand_id),
      normalizeString(rule.company_code),
      rule.domain_id
    )
    ruleMap.set(key, {
      id: rule.id,
      max_qty: rule.max_qty,
      company_code: normalizeString(rule.company_code),
      brand_id: normalizeString(rule.brand_id),
      domain_id: rule.domain_id ?? null,
      category_id: normalizeString(rule.category_id),
    })
  }

  const categoryRules = categories.map((category) => ({
    id: category.id,
    max_qty: category.max_qty,
    brand_id: normalizeString(category.brand_id),
    company_code: normalizeString(category.company_code),
    domain_id: category.domain_id ?? null,
    category_ids: parseCategoryIdsFromString(category.category_ids),
  }))

  return { ruleMap, categoryRules }
}

export const validateItemsAgainstMaxQty = async (
  items: MaxQtyValidateItem[]
): Promise<MaxQtyValidationResult> => {
  const { ruleMap, categoryRules } = await fetchRulesAndCategories()

  type AggregatedEntry = {
    key: string
    quantity: number
    max_qty: number
    rule_type: "rule" | "category"
    rule_id: number
    company_code: string
    brand_id: string
    domain_id: number | null
    category_ids: string[]
    skus: Set<string>
  }

  const aggregates = new Map<string, AggregatedEntry>()

  for (const item of items) {
    const quantity = Number(item.quantity)
    if (!Number.isFinite(quantity) || quantity <= 0) {
      continue
    }

    const brandId = normalizeString(item.brand_id)
    const companyCode = normalizeString(item.company_code)
    const domainId = toDomainId(item.domain_id)

    const categoryIds = new Set<string>()
    if (item.category_id) {
      categoryIds.add(normalizeString(item.category_id))
    }
    if (Array.isArray(item.category_ids)) {
      for (const cid of item.category_ids) {
        const normalized = normalizeString(cid)
        if (normalized) {
          categoryIds.add(normalized)
        }
      }
    }

    if (!categoryIds.size) {
      continue
    }

    let matchedRule: AggregatedEntry | null = null

    for (const categoryId of categoryIds) {
      const key = buildRuleKey(categoryId, brandId, companyCode, domainId)
      const rule = ruleMap.get(key)
      if (rule) {
        const agg = aggregates.get(key)
        if (agg) {
          agg.quantity += quantity
          agg.skus.add(item.sku)
        } else {
          aggregates.set(key, {
            key,
            quantity,
            max_qty: rule.max_qty,
            rule_type: "rule",
            rule_id: rule.id,
            company_code: companyCode,
            brand_id: brandId,
            domain_id: domainId,
            category_ids: [rule.category_id],
            skus: new Set([item.sku]),
          })
        }
        matchedRule = aggregates.get(key) ?? null
        break
      }
    }

    if (matchedRule) {
      continue
    }

    for (const categoryRule of categoryRules) {
      if (
        categoryRule.brand_id === brandId &&
        categoryRule.company_code === companyCode &&
        categoryRule.domain_id === domainId
      ) {
        const intersects = categoryRule.category_ids.some((cid) =>
          categoryIds.has(cid)
        )
        if (intersects) {
          const key = `${categoryRule.id}::category::${brandId}::${companyCode}::${domainId ?? "null"}`
          const agg = aggregates.get(key)
          if (agg) {
            agg.quantity += quantity
            agg.skus.add(item.sku)
          } else {
            aggregates.set(key, {
              key,
              quantity,
              max_qty: categoryRule.max_qty,
              rule_type: "category",
              rule_id: categoryRule.id,
            company_code: companyCode,
            brand_id: brandId,
            domain_id: domainId,
            category_ids: categoryRule.category_ids,
            skus: new Set([item.sku]),
          })
          }
          break
        }
      }
    }
  }

  const violations: MaxQtyViolation[] = []

  for (const entry of aggregates.values()) {
    if (entry.quantity > entry.max_qty) {
      violations.push({
        key: entry.key,
        sku: Array.from(entry.skus)[0] ?? "",
        quantity: entry.quantity,
        max_qty: entry.max_qty,
        rule_type: entry.rule_type,
        rule_id: entry.rule_id,
        company_code: entry.company_code,
        brand_id: entry.brand_id,
        domain_id: entry.domain_id,
        category_ids: entry.category_ids,
        message: `Quantity ${entry.quantity} exceeds allowed maximum ${entry.max_qty}.`,
      })
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  }
}

const extractMetadataString = (
  metadata: any,
  ...keys: string[]
): string | null => {
  if (!metadata) {
    return null
  }

  for (const key of keys) {
    const value = metadata[key]
    if (value === undefined || value === null) {
      continue
    }
    if (typeof value === "string") {
      const trimmed = value.trim()
      if (trimmed.length) {
        return trimmed
      }
    }
  }

  return null
}

const extractMetadataArray = (
  metadata: any,
  ...keys: string[]
): string[] | undefined => {
  if (!metadata) {
    return undefined
  }

  for (const key of keys) {
    const value = metadata[key]
    if (Array.isArray(value)) {
      return value
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(Boolean)
    }
    if (typeof value === "string") {
      const parsed = parseCategoryIdsFromString(value)
      if (parsed.length) {
        return parsed
      }
    }
  }

  return undefined
}

const mapLineItemToValidationItem = (
  item: CartLineItemDTO
): MaxQtyValidateItem => {
  const rawItem = item as any
  const metadata = rawItem?.metadata ?? {}

  const sku =
    (typeof rawItem?.variant?.sku === "string" && rawItem.variant.sku) ||
    (typeof metadata.sku === "string" && metadata.sku) ||
    (typeof rawItem?.sku === "string" ? rawItem.sku : undefined) ||
    rawItem?.title ||
    ""

  const companyCode =
    extractMetadataString(
      metadata,
      "company_code",
      "companyCode",
      "companycode"
    ) ?? null

  const brandId =
    extractMetadataString(metadata, "brand_id", "brandId", "brandid") ?? null

  const domainIdValue =
    metadata.domain_id ??
    metadata.domainId ??
    metadata.domain ??
    metadata.domainID

  const categoryId =
    extractMetadataString(
      metadata,
      "category_id",
      "categoryId",
      "magento_category_id"
    ) ?? null

  const categoryIds =
    extractMetadataArray(
      metadata,
      "category_ids",
      "categoryIds",
      "magento_category_ids"
    ) ??
    (categoryId ? [categoryId] : undefined)

  return {
    sku,
    quantity: Number(rawItem?.quantity ?? 0),
    brand_id: brandId,
    company_code: companyCode,
    category_id: categoryId ?? undefined,
    category_ids: categoryIds,
    domain_id: toDomainId(domainIdValue) ?? undefined,
  }
}

export const buildValidationItemsFromCart = (cart: CartDTO) => {
  const items = Array.isArray(cart?.items) ? cart.items : []
  return items.map(mapLineItemToValidationItem)
}

export const validateCart = async (cart: CartDTO) => {
  const items = buildValidationItemsFromCart(cart)
  return validateItemsAgainstMaxQty(items)
}

export const mergeValidationItems = (
  base: MaxQtyValidateItem[],
  extras: MaxQtyValidateItem[]
) => {
  const merged = [...base]
  for (const item of extras) {
    if (!item || !item.sku) {
      continue
    }
    merged.push(item)
  }
  return merged
}

export const purgeOrderQuantityTrackerBefore = async (
  before: Date
) => {
  return purgeOrderQuantityTracker(before)
}

export const purgeOrderQuantityTrackerByMonths = async (
  months: number
) => {
  if (!Number.isFinite(months) || months <= 0) {
    return 0
  }
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - Math.trunc(months))
  return purgeOrderQuantityTracker(cutoff)
}

export const buildValidationItemFromPayload = (
  payload: Record<string, unknown>
): MaxQtyValidateItem | null => {
  if (!payload) {
    return null
  }

  const metadata = (payload.metadata ?? payload.additional_data) as
    | Record<string, unknown>
    | undefined

  const quantity =
    typeof (payload as any).quantity === "number"
      ? (payload as any).quantity
      : Number((payload as any).quantity)

  const sku =
    (payload as any).sku ??
    (typeof metadata?.sku === "string" ? metadata.sku : undefined) ??
    ""

  return {
    sku: String(sku || ""),
    quantity: Number.isFinite(quantity) ? quantity : 0,
    brand_id:
      extractMetadataString(metadata, "brand_id", "brandId", "brandid") ?? undefined,
    company_code:
      extractMetadataString(
        metadata,
        "company_code",
        "companyCode",
        "companycode"
      ) ?? undefined,
    category_id:
      extractMetadataString(
        metadata,
        "category_id",
        "categoryId",
        "magento_category_id"
      ) ?? undefined,
    category_ids:
      extractMetadataArray(
        metadata,
        "category_ids",
        "categoryIds",
        "magento_category_ids"
      ) ?? undefined,
    domain_id: toDomainId(
      metadata?.domain_id ?? metadata?.domainId ?? metadata?.domain
    ) ?? undefined,
  }
}

const sumTrackedQuantityForBrand = async (
  brandId: string,
  customerId?: number | null
) => {
  await ensureRedingtonOrderQuantityTrackerTable()

  const params: Array<string | number> = [brandId]
  let whereClause = "brand_id = $1"

  if (typeof customerId === "number" && Number.isFinite(customerId)) {
    params.push(Math.trunc(customerId))
    whereClause += ` AND customer_id = $${params.length}`
  }

  const { rows } = await getPgPool().query(
    `
      SELECT COALESCE(SUM(quantity), 0) AS qty
      FROM redington_order_quantity_tracker
      WHERE ${whereClause}
    `,
    params
  )

  return Number(rows[0]?.qty ?? 0)
}

const extractFirstCategoryId = (value?: string | null) => {
  if (!value) {
    return ""
  }

  return value
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)[0] || ""
}

export type MaxOrderQtySummaryInput = {
  brand_id: string
  access_id: string
  customer_id?: string | number | null
}

export type MaxOrderQtySummaryRow = {
  brand_id: string
  category_id: string
  allowed_qty: string
  ordered_qty: string
}

export const getMaxOrderQtySummary = async (
  input: MaxOrderQtySummaryInput
): Promise<MaxOrderQtySummaryRow[]> => {
  const brandId = normalizeString(input.brand_id)
  const accessId = normalizeString(input.access_id)

  if (!brandId) {
    throw new Error("brand_id is required.")
  }

  if (!accessId) {
    throw new Error("accessId is required.")
  }

  const accessMapping = await findAccessMappingByAccessId(accessId)
  if (!accessMapping) {
    throw new Error("Access mapping not found for the provided accessId.")
  }

  const companyCode = normalizeString(accessMapping.company_code ?? "")
  const domainId =
    typeof accessMapping.domain_id === "number"
      ? accessMapping.domain_id
      : null

  let allowedQty: number | null = null
  let categoryId = ""

  const [rules] = await listMaxQtyRules(
    {
      brand_id: brandId,
      company_code: companyCode,
      domain_id: domainId,
    },
    { limit: 1, offset: 0 }
  )

  if (rules.length) {
    allowedQty = rules[0].max_qty
    categoryId = rules[0].category_id ?? ""
  } else {
    const [categoryRules] = await listMaxQtyCategories(
      {
        brand_id: brandId,
        company_code: companyCode,
        domain_id: domainId,
      },
      { limit: 1, offset: 0 }
    )

    if (categoryRules.length) {
      allowedQty = categoryRules[0].max_qty
      categoryId = extractFirstCategoryId(categoryRules[0].category_ids)
    }
  }

  const customerIdNumeric = normalizeOptionalNumber(input.customer_id)
  const orderedQty = await sumTrackedQuantityForBrand(
    brandId,
    customerIdNumeric
  )

  return [
    {
      brand_id: brandId,
      category_id: categoryId,
      allowed_qty:
        allowedQty !== null && allowedQty !== undefined
          ? String(allowedQty)
          : "",
      ordered_qty: orderedQty > 0 ? String(orderedQty) : "",
    },
  ]
}
