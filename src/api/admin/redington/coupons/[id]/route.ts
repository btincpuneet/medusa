import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonCouponRuleTable,
  ensureRedingtonDomainExtentionTable,
  ensureRedingtonDomainTable,
  findDomainById,
  getPgPool,
  mapCouponRuleRow,
} from "../../../../../lib/pg"

type UpdateCouponRuleBody = {
  coupon_code?: string
  company_code?: string
  domain_id?: number | string | null
  domain_extention_id?: number | string | null
  is_active?: boolean | string
  metadata?: Record<string, unknown> | null
}

const parseId = (value: string) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

const parseNumeric = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string" && value.trim().length) {
    const parsed = Number.parseInt(value.trim(), 10)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

const parseBoolean = (value: unknown) => {
  if (value === undefined) {
    return undefined
  }
  if (typeof value === "boolean") {
    return value
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true
    }
    if (["false", "0", "no", "off"].includes(normalized)) {
      return false
    }
  }
  return undefined
}

const ensureDomainExtentionExists = async (domainExtentionId: number) => {
  await ensureRedingtonDomainExtentionTable()

  const { rows } = await getPgPool().query(
    `
      SELECT id
      FROM redington_domain_extention
      WHERE id = $1
      LIMIT 1
    `,
    [domainExtentionId]
  )

  return rows[0]?.id ? Number(rows[0].id) : null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCouponRuleTable()

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid coupon rule id" })
  }

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_coupon_rule
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  )

  if (!rows[0]) {
    return res.status(404).json({ message: "Coupon rule not found" })
  }

  return res.json({
    coupon_rule: mapCouponRuleRow(rows[0]),
  })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  await Promise.all([
    ensureRedingtonCouponRuleTable(),
    ensureRedingtonDomainTable(),
    ensureRedingtonDomainExtentionTable(),
  ])

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid coupon rule id" })
  }

  const body = (req.body || {}) as UpdateCouponRuleBody
  const updates: string[] = []
  const params: any[] = []

  if (body.coupon_code !== undefined) {
    const code = body.coupon_code.trim()
    if (!code) {
      return res
        .status(400)
        .json({ message: "coupon_code cannot be empty" })
    }
    updates.push(`coupon_code = $${updates.length + 1}`)
    params.push(code)
  }

  if (body.company_code !== undefined) {
    const company = body.company_code.trim()
    if (!company) {
      return res
        .status(400)
        .json({ message: "company_code cannot be empty" })
    }
    updates.push(`company_code = $${updates.length + 1}`)
    params.push(company)
  }

  if (body.domain_id !== undefined) {
    if (body.domain_id === null) {
      updates.push(`domain_id = NULL`)
    } else {
      const domainId = parseNumeric(body.domain_id)
      if (!domainId) {
        return res
          .status(400)
          .json({ message: "domain_id must be a valid number" })
      }

      const domain = await findDomainById(domainId)
      if (!domain) {
        return res.status(404).json({
          message: `Domain with id ${domainId} not found`,
        })
      }

      updates.push(`domain_id = $${updates.length + 1}`)
      params.push(domainId)
    }
  }

  if (body.domain_extention_id !== undefined) {
    if (body.domain_extention_id === null) {
      updates.push(`domain_extention_id = NULL`)
    } else {
      const domainExtentionId = parseNumeric(body.domain_extention_id)
      if (!domainExtentionId) {
        return res.status(400).json({
          message: "domain_extention_id must be a valid number",
        })
      }

      const exists = await ensureDomainExtentionExists(domainExtentionId)
      if (!exists) {
        return res.status(404).json({
          message: `Domain extension with id ${domainExtentionId} not found`,
        })
      }

      updates.push(`domain_extention_id = $${updates.length + 1}`)
      params.push(domainExtentionId)
    }
  }

  const isActive = parseBoolean(body.is_active)
  if (isActive !== undefined) {
    updates.push(`is_active = $${updates.length + 1}`)
    params.push(isActive)
  }

  if (body.metadata !== undefined) {
    updates.push(`metadata = $${updates.length + 1}::jsonb`)
    params.push(JSON.stringify(body.metadata ?? {}))
  }

  if (!updates.length) {
    return res.status(400).json({ message: "No updatable fields provided" })
  }

  params.push(id)

  try {
    const { rows } = await getPgPool().query(
      `
        UPDATE redington_coupon_rule
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE id = $${params.length}
        RETURNING *
      `,
      params
    )

    if (!rows[0]) {
      return res.status(404).json({ message: "Coupon rule not found" })
    }

    return res.json({
      coupon_rule: mapCouponRuleRow(rows[0]),
    })
  } catch (error: any) {
    if (error?.code === "23505") {
      return res.status(409).json({
        message:
          "Coupon rule already exists for this combination of company, domain, and extension.",
      })
    }

    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Unexpected error updating coupon rule",
    })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCouponRuleTable()

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid coupon rule id" })
  }

  const { rowCount } = await getPgPool().query(
    `
      DELETE FROM redington_coupon_rule
      WHERE id = $1
    `,
    [id]
  )

  if (!rowCount) {
    return res.status(404).json({ message: "Coupon rule not found" })
  }

  return res.status(204).send()
}
