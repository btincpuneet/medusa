import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  createAdminRole,
  listAdminRoles,
} from "../../../../lib/pg"

type CreateRoleBody = {
  role_name?: string
  description?: string | null
  permissions?: string[] | string | null
  can_login?: boolean
  domains?: Array<number | string> | string | null
}

const normalizeDomains = (value: CreateRoleBody["domains"]): number[] => {
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
  try {
    const roles = await listAdminRoles()
    return res.json({ roles })
  } catch (error: any) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to list admin roles.",
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as CreateRoleBody

  try {
    const role = await createAdminRole({
      role_name: body.role_name ?? "",
      description: body.description ?? undefined,
      permissions: body.permissions ?? undefined,
      can_login: body.can_login,
      domains: normalizeDomains(body.domains),
    })

    return res.status(201).json({ role })
  } catch (error: any) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("role_name")
    ) {
      return res.status(400).json({ message: error.message })
    }

    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Unexpected error creating admin role.",
    })
  }
}
