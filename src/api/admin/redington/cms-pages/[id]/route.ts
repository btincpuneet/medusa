import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonCmsPageTable,
  ensureRedingtonDomainTable,
  findDomainById,
  getPgPool,
  mapCmsPageRow,
} from "../../../../../lib/pg"

type UpdateCmsPageBody = {
  slug?: string
  title?: string
  content?: string
  country_code?: string | null
  domain_id?: number | string | null
  access_id?: string | null
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

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCmsPageTable()

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid CMS page id" })
  }

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_cms_page
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  )

  if (!rows[0]) {
    return res.status(404).json({ message: "CMS page not found" })
  }

  return res.json({
    cms_page: mapCmsPageRow(rows[0]),
  })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  await Promise.all([
    ensureRedingtonCmsPageTable(),
    ensureRedingtonDomainTable(),
  ])

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid CMS page id" })
  }

  const body = (req.body || {}) as UpdateCmsPageBody
  const updates: string[] = []
  const params: any[] = []

  if (body.slug !== undefined) {
    const slug = body.slug.trim().toLowerCase()
    if (!slug) {
      return res.status(400).json({ message: "slug cannot be empty" })
    }
    updates.push(`slug = $${updates.length + 1}`)
    params.push(slug)
  }

  if (body.title !== undefined) {
    const title = body.title.trim()
    if (!title) {
      return res.status(400).json({ message: "title cannot be empty" })
    }
    updates.push(`title = $${updates.length + 1}`)
    params.push(title)
  }

  if (body.content !== undefined) {
    const content = body.content.trim()
    if (!content) {
      return res.status(400).json({ message: "content cannot be empty" })
    }
    updates.push(`content = $${updates.length + 1}`)
    params.push(content)
  }

  if (body.country_code !== undefined) {
    updates.push(`country_code = $${updates.length + 1}`)
    params.push(body.country_code ? body.country_code.trim() : null)
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

  if (body.access_id !== undefined) {
    updates.push(`access_id = $${updates.length + 1}`)
    params.push(
      typeof body.access_id === "string" ? body.access_id.trim() : null
    )
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

  const { rows } = await getPgPool().query(
    `
      UPDATE redington_cms_page
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${params.length}
      RETURNING *
    `,
    params
  )

  if (!rows[0]) {
    return res.status(404).json({ message: "CMS page not found" })
  }

  return res.json({
    cms_page: mapCmsPageRow(rows[0]),
  })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonCmsPageTable()

  const id = parseId(req.params.id)
  if (!id) {
    return res.status(400).json({ message: "Invalid CMS page id" })
  }

  const { rowCount } = await getPgPool().query(
    `
      DELETE FROM redington_cms_page
      WHERE id = $1
    `,
    [id]
  )

  if (!rowCount) {
    return res.status(404).json({ message: "CMS page not found" })
  }

  return res.status(204).send()
}
