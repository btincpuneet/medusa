import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonSubscriptionCodeTable,
  findSubscriptionCodeByCode,
  findSubscriptionCodeById,
  getPgPool,
  mapSubscriptionCodeRow,
} from "../../../../../lib/pg"

type UpdateSubscriptionCodeBody = {
  subscription_code?: string
  company_code?: string
  access_id?: string
  first_name?: string
  last_name?: string
  email?: string
  status?: boolean | string
}

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : ""

const normalizeEmail = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : ""

const sanitizeAccessId = (value: string) =>
  value.replace(/[^0-9.]/g, "")

const parseBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") {
    return value
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (["1", "true", "yes", "enable", "enabled"].includes(normalized)) {
      return true
    }
    if (["0", "false", "no", "disable", "disabled"].includes(normalized)) {
      return false
    }
  }
  return undefined
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonSubscriptionCodeTable()

  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid id" })
  }

  const record = await findSubscriptionCodeById(id)
  if (!record) {
    return res.status(404).json({ message: "Subscription code not found" })
  }

  return res.json({ subscription_code: record })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonSubscriptionCodeTable()

  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid id" })
  }

  const existing = await findSubscriptionCodeById(id)
  if (!existing) {
    return res.status(404).json({ message: "Subscription code not found" })
  }

  const body = (req.body || {}) as UpdateSubscriptionCodeBody

  const subscriptionCode = normalizeString(body.subscription_code)
  if (!subscriptionCode) {
    return res.status(400).json({ message: "subscription_code is required" })
  }

  const companyCode = normalizeString(body.company_code)
  if (!companyCode) {
    return res.status(400).json({ message: "company_code is required" })
  }

  const accessId = sanitizeAccessId(normalizeString(body.access_id))
  if (!accessId) {
    return res.status(400).json({ message: "access_id is required" })
  }

  const firstName = normalizeString(body.first_name)
  const lastName = normalizeString(body.last_name)
  const email = normalizeEmail(body.email)

  if (!firstName || !lastName || !email) {
    return res.status(400).json({
      message: "first_name, last_name, and email are required",
    })
  }

  const conflict = await findSubscriptionCodeByCode(subscriptionCode)
  if (conflict && conflict.id !== id) {
    return res.status(409).json({
      message: `Subscription code "${subscriptionCode}" already exists.`,
      subscription_code: conflict,
    })
  }

  const status =
    typeof body.status === "boolean"
      ? body.status
      : parseBoolean(body.status) ?? existing.status

  const { rows } = await getPgPool().query(
    `
      UPDATE redington_subscription_code
      SET
        subscription_code = $1,
        company_code = $2,
        access_id = $3,
        first_name = $4,
        last_name = $5,
        email = $6,
        status = $7,
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `,
    [
      subscriptionCode,
      companyCode,
      accessId,
      firstName,
      lastName,
      email,
      status,
      id,
    ]
  )

  return res.json({ subscription_code: mapSubscriptionCodeRow(rows[0]) })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonSubscriptionCodeTable()

  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid id" })
  }

  await getPgPool().query(
    `
      DELETE FROM redington_subscription_code
      WHERE id = $1
    `,
    [id]
  )

  return res.json({ deleted: true, id })
}
