import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonRetainCartConfigTable,
  upsertRetainCartConfig,
  deleteRetainCartConfig,
} from "../../../../../lib/pg"

type UpdateBody = {
  domain_id?: number | null
  retry_time?: string
  add_bcc?: string[] | string | null
  is_active?: boolean
}

export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  await ensureRedingtonRetainCartConfigTable()

  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid retain cart config id" })
  }

  const body = (req.body || {}) as UpdateBody

  const record = await upsertRetainCartConfig({
    id,
    domain_id: body.domain_id ?? null,
    retry_time: body.retry_time,
    add_bcc: body.add_bcc ?? null,
    is_active: body.is_active,
  })

  return res.json({ retain_cart_config: record })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  await ensureRedingtonRetainCartConfigTable()

  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid retain cart config id" })
  }

  await deleteRetainCartConfig(id)

  return res.status(204).send()
}
