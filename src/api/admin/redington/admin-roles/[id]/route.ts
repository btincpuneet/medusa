import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  deleteAdminRole,
  findAdminRoleById,
  updateAdminRole,
} from "../../../../../lib/pg"

type UpdateRoleBody = {
  role_name?: string | null
  description?: string | null
  permissions?: string[] | string | null
  can_login?: boolean
  domains?: Array<number | string> | string | null
}

const parseId = (value: string) => {
  const id = Number.parseInt(value, 10)
  return Number.isFinite(id) ? id : undefined
}

const normalizeDomains = (
  value: UpdateRoleBody["domains"]
): number[] | undefined => {
  if (value === undefined) {
    return undefined
  }

  if (!value) {
    return []
  }

  const entries = Array.isArray(value) ? value : String(value).split(/[\s,]+/)
  const ids = entries
    .map((entry) => {
      if (entry === null || entry === undefined) {
        return null
      }
      const parsed =
        typeof entry === "string"
          ? Number.parseInt(entry.trim(), 10)
          : Number(entry)
      return Number.isFinite(parsed) ? parsed : null
    })
    .filter((entry): entry is number => entry !== null)

  return Array.from(new Set(ids))
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const id = parseId(req.params.id)

  if (!id) {
    return res.status(400).json({ message: "Invalid role id" })
  }

  try {
    const role = await findAdminRoleById(id)

    if (!role) {
      return res.status(404).json({ message: "Role not found" })
    }

    return res.json({ role })
  } catch (error: any) {
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to load role.",
    })
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const id = parseId(req.params.id)

  if (!id) {
    return res.status(400).json({ message: "Invalid role id" })
  }

  const body = (req.body || {}) as UpdateRoleBody

  if (body.role_name !== undefined) {
    const trimmed = (body.role_name ?? "").trim()
    if (!trimmed) {
      return res
        .status(400)
        .json({ message: "role_name must contain at least one character" })
    }
  }

  try {
    const updated = await updateAdminRole(id, {
      role_name: body.role_name ?? undefined,
      description: body.description ?? undefined,
      permissions: body.permissions ?? undefined,
      can_login: body.can_login,
      domains: normalizeDomains(body.domains),
    })

    if (!updated) {
      return res.status(404).json({ message: "Role not found" })
    }

    return res.json({ role: updated })
  } catch (error: any) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Unexpected error updating role.",
    })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const id = parseId(req.params.id)

  if (!id) {
    return res.status(400).json({ message: "Invalid role id" })
  }

  try {
    const role = await findAdminRoleById(id)

    if (!role) {
      return res.status(404).json({ message: "Role not found" })
    }

    if (role.role_key === "super_admin") {
      return res.status(400).json({
        message: "The Super Admin role cannot be deleted.",
      })
    }

    await deleteAdminRole(id)

    return res.json({
      id,
      object: "admin_role",
      deleted: true,
    })
  } catch (error: any) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Unexpected error deleting role.",
    })
  }
}
