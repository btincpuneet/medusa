import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  assignRoleToUser,
  findAdminRoleById,
  findDomainById,
  listRoleAssignments,
} from "../../../../../lib/pg"
import {
  fetchAdminUserByEmail,
  fetchAdminUserById,
  fetchAdminUsersByIds,
} from "../../../../../lib/admin-users"

type AssignRoleBody = {
  user_id?: string
  user_email?: string
  role_id?: number | string
  domain_id?: number | string
}

const parseRoleId = (value: number | string | undefined): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

const parseDomainId = (value: number | string | undefined): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const assignments = await listRoleAssignments()
    const userIds = Array.from(new Set(assignments.map((assignment) => assignment.user_id)))
    const userMap = await fetchAdminUsersByIds(req.scope, userIds)

    const enriched = assignments.map((assignment) => ({
      ...assignment,
      user: userMap.get(assignment.user_id) ?? {
        id: assignment.user_id,
      },
    }))

    return res.json({ assignments: enriched })
  } catch (error: any) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to list role assignments.",
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as AssignRoleBody

  const roleId = parseRoleId(body.role_id)
  if (!roleId) {
    return res.status(400).json({ message: "role_id must be provided" })
  }

  const role = await findAdminRoleById(roleId)
  if (!role) {
    return res.status(404).json({ message: "Role not found" })
  }

  let userId = body.user_id?.trim()
  let userSummary = userId ? await fetchAdminUserById(req.scope, userId) : null

  if (!userId) {
    const email = (body.user_email || "").trim().toLowerCase()
    if (!email) {
      return res
        .status(400)
        .json({ message: "user_id or user_email must be provided" })
    }

    userSummary = await fetchAdminUserByEmail(req.scope, email)
    userId = userSummary?.id
  }

  if (!userId || !userSummary) {
    return res.status(404).json({
      message: "Unable to locate the specified user.",
    })
  }

  const domainId = parseDomainId(body.domain_id)
  if (!domainId) {
    return res.status(400).json({ message: "domain_id must be provided" })
  }

  const domain = await findDomainById(domainId)
  if (!domain) {
    return res.status(404).json({ message: "Domain not found" })
  }

  if (Array.isArray(role.domains) && role.domains.length && !role.domains.includes(domainId)) {
    return res
      .status(400)
      .json({ message: "Role cannot be assigned to the selected domain." })
  }

  try {
    const assignment = await assignRoleToUser({
      user_id: userId,
      role_id: roleId,
      domain_id: domainId,
    })

    return res.json({
      assignment: {
        ...assignment,
        role,
        user: userSummary,
        domain_name: domain.domain_name,
      },
    })
  } catch (error: any) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Unexpected error assigning role.",
    })
  }
}
