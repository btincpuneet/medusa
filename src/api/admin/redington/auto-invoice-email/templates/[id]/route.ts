import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  deleteEmailTemplate,
  findEmailTemplateById,
  updateEmailTemplate,
} from "../../../../../../lib/pg"

const parseId = (value: unknown): number | null => {
  const parsed = Number.parseInt(String(value ?? ""), 10)
  return Number.isFinite(parsed) ? parsed : null
}

const parseNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string" && value.trim().length) {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

const parseJson = (value: unknown): Record<string, unknown> | null => {
  if (!value) {
    return null
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  if (typeof value === "string" && value.trim().length) {
    try {
      return JSON.parse(value)
    } catch {
      return { raw: value }
    }
  }

  return null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid template id" })
  }

  const template = await findEmailTemplateById(id)
  if (!template) {
    return res.status(404).json({ message: "Email template not found" })
  }

  return res.json({ template })
}

type UpdateTemplateBody = {
  template_code?: string
  template_subject?: string | null
  template_text?: string
  template_style?: string | null
  template_type?: number | string | null
  sender_name?: string | null
  sender_email?: string | null
  orig_template_code?: string | null
  orig_template_variables?: unknown
  is_system?: boolean | string
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid template id" })
  }

  const body = (req.body || {}) as UpdateTemplateBody

  const updates: Record<string, unknown> = {}

  if (body.template_code !== undefined) {
    updates.template_code = String(body.template_code)
  }

  if (body.template_subject !== undefined) {
    updates.template_subject = body.template_subject ?? null
  }

  if (body.template_text !== undefined) {
    updates.template_text = String(body.template_text)
  }

  if (body.template_style !== undefined) {
    updates.template_style = body.template_style ?? null
  }

  if (body.template_type !== undefined) {
    updates.template_type = parseNumber(body.template_type) ?? 2
  }

  if (body.sender_name !== undefined) {
    updates.sender_name = body.sender_name ?? null
  }

  if (body.sender_email !== undefined) {
    updates.sender_email = body.sender_email ?? null
  }

  if (body.orig_template_code !== undefined) {
    updates.orig_template_code = body.orig_template_code ?? null
  }

  if (body.orig_template_variables !== undefined) {
    updates.orig_template_variables = parseJson(body.orig_template_variables)
  }

  if (body.is_system !== undefined) {
    updates.is_system =
      typeof body.is_system === "boolean"
        ? body.is_system
        : typeof body.is_system === "string"
        ? ["1", "true", "yes"].includes(body.is_system.trim().toLowerCase())
        : false
  }

  const template = await updateEmailTemplate(id, updates)
  if (!template) {
    return res.status(404).json({ message: "Email template not found" })
  }

  return res.json({ template })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid template id" })
  }

  await deleteEmailTemplate(id)
  return res.status(204).send()
}

