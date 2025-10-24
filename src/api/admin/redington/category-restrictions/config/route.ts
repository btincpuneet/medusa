import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonSettingsTable,
  getRedingtonSetting,
  setRedingtonSetting,
} from "../../../../../lib/pg"

const PROMOTION_ROOT_KEY = "category_restriction_promotion_root"

type UpdateConfigBody = {
  promotion_root_category_id?: string | null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonSettingsTable()

  const existing = await getRedingtonSetting<{ promotion_root_category_id?: string }>(
    PROMOTION_ROOT_KEY
  )

  return res.json({
    config: {
      promotion_root_category_id: existing?.promotion_root_category_id ?? null,
    },
  })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonSettingsTable()

  const body = (req.body || {}) as UpdateConfigBody
  const value =
    typeof body.promotion_root_category_id === "string"
      ? body.promotion_root_category_id.trim()
      : null

  await setRedingtonSetting(PROMOTION_ROOT_KEY, {
    promotion_root_category_id: value,
  })

  return res.json({
    config: {
      promotion_root_category_id: value,
    },
  })
}
