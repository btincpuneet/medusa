import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  createEmailTemplate,
  listEmailTemplates,
} from "../../../../../lib/pg"

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
  const search = typeof req.query.search === "string" ? req.query.search : undefined
  const limit = parseNumber(req.query.limit)
  const offset = parseNumber(req.query.offset)

  const { templates, count } = await listEmailTemplates({
    search,
    limit,
    offset,
  })

  return res.json({ templates, count })
}

type CreateTemplateBody = {
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

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as CreateTemplateBody

  const templateCode = (body.template_code ?? "").trim()
  const templateText = (body.template_text ?? "").toString()

  if (!templateCode) {
    return res.status(400).json({ message: "template_code is required" })
  }

  if (!templateText.trim().length) {
    return res.status(400).json({ message: "template_text is required" })
  }

  const templateType = parseNumber(body.template_type) ?? 2
  const isSystem =
    typeof body.is_system === "boolean"
      ? body.is_system
      : typeof body.is_system === "string"
      ? ["1", "true", "yes"].includes(body.is_system.trim().toLowerCase())
      : false

  const template = await createEmailTemplate({
    template_code: templateCode,
    template_subject: body.template_subject ?? null,
    template_text: templateText,
    template_style: body.template_style ?? null,
    template_type: templateType,
    sender_name: body.sender_name ?? null,
    sender_email: body.sender_email ?? null,
    orig_template_code: body.orig_template_code ?? null,
    orig_template_variables: parseJson(body.orig_template_variables),
    is_system: isSystem,
  })

  return res.status(201).json({ template })
}

