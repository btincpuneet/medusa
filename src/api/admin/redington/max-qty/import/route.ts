import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import {
  createMaxQtyCategory,
  createMaxQtyRule,
  type MaxQtyCategoryRow,
  type MaxQtyRuleRow,
  type CategoryInput,
  type RuleInput,
} from "../../../../../modules/redington-max-qty"

const isRuleInput = (value: any): value is RuleInput => {
  return (
    value &&
    typeof value.category_id === "string" &&
    typeof value.brand_id === "string" &&
    typeof value.company_code === "string" &&
    value.max_qty !== undefined
  )
}

const isCategoryInput = (value: any): value is CategoryInput => {
  return (
    value &&
    typeof value.category_ids === "string" &&
    typeof value.brand_id === "string" &&
    typeof value.company_code === "string" &&
    value.max_qty !== undefined
  )
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body || {}) as {
    rules?: RuleInput[]
    categories?: CategoryInput[]
  }

  const importedRules: RuleInput[] = Array.isArray(body.rules)
    ? body.rules.filter(isRuleInput)
    : []
  const importedCategories: CategoryInput[] = Array.isArray(body.categories)
    ? body.categories.filter(isCategoryInput)
    : []

  const createdRules: MaxQtyRuleRow[] = []
  for (const rule of importedRules) {
    const created = await createMaxQtyRule(rule)
    createdRules.push(created)
  }

  const createdCategories: MaxQtyCategoryRow[] = []
  for (const category of importedCategories) {
    const created = await createMaxQtyCategory(category)
    createdCategories.push(created)
  }

  res.json({
    imported_rules: createdRules.length,
    imported_categories: createdCategories.length,
    rules: createdRules,
    categories: createdCategories,
  })
}
