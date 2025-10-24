import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonRetainCartConfigTable,
  listRetainCartConfigs,
  upsertRetainCartConfig,
} from "../../../../lib/pg"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  await ensureRedingtonRetainCartConfigTable()
  const configs = await listRetainCartConfigs()

  return res.json({
    retain_cart_configs: configs,
  })
}

type CreateRetainCartBody = {
  domain_id?: number | null
  retry_time?: string
  add_bcc?: string[] | string | null
  is_active?: boolean
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  await ensureRedingtonRetainCartConfigTable()

  const body = (req.body || {}) as CreateRetainCartBody

  const record = await upsertRetainCartConfig({
    domain_id: body.domain_id ?? null,
    retry_time: body.retry_time,
    add_bcc: body.add_bcc ?? null,
    is_active: body.is_active,
  })

  return res.status(201).json({ retain_cart_config: record })
}
