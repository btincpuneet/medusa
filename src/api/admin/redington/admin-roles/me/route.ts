import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { fetchAdminUserById } from "../../../../../lib/admin-users"
import {
  assignRoleToUser,
  createAdminRole,
  findAdminRoleByKey,
  listRoleAssignments,
  type AdminRoleAssignmentRow,
  type AdminRoleRow,
} from "../../../../../lib/pg"

const ensureSuperAdminForUser = async (
  userId: string
): Promise<AdminRoleAssignmentRow[]> => {
  let role = await findAdminRoleByKey("super_admin")

  if (!role) {
    role = await createAdminRole({
      role_name: "Super Admin",
      description: "Default role with full access to Redington admin tools.",
      permissions: ["*"],
      can_login: true,
      domains: [],
    })
  }

  const assignments = await listRoleAssignments({ user_id: userId })
  const hasAssignment = assignments.some(
    (assignment) =>
      assignment.role?.role_key === "super_admin" &&
      (assignment.domain_id === null || assignment.domain_id === undefined)
  )

  if (!hasAssignment) {
    await assignRoleToUser({
      user_id: userId,
      role_id: role.id,
      domain_id: null,
    })
    return listRoleAssignments({ user_id: userId })
  }

  return assignments
}

const aggregatePermissions = (roles: AdminRoleRow[]): string[] => {
  const set = new Set<string>()
  for (const role of roles) {
    for (const permission of role.permissions) {
      if (permission) {
        set.add(permission)
      }
    }
  }
  return Array.from(set.values())
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const request = req as MedusaRequest & { auth_context?: any }
  const authContext = request.auth_context

  if (!authContext || authContext.actor_type !== "user") {
    return res.json({
      roles: [],
      login_roles: [],
      permissions: [],
      assignments: [],
    })
  }

  const userId = authContext.actor_id
  if (!userId) {
    return res.json({
      roles: [],
      login_roles: [],
      permissions: [],
      assignments: [],
    })
  }

  try {
    const assignments = await ensureSuperAdminForUser(userId)

    const roleMap = new Map<number, AdminRoleRow>()
    for (const assignment of assignments) {
      if (assignment.role) {
        roleMap.set(assignment.role.id, assignment.role)
      }
    }

    const roles = Array.from(roleMap.values())
    const loginRoles = roles.filter((role) => role.can_login)
    const permissions = aggregatePermissions(loginRoles)
    const user = await fetchAdminUserById(req.scope, userId)

    return res.json({
      user,
      roles,
      login_roles: loginRoles,
      permissions,
      assignments: assignments.map(mapAssignmentForResponse),
    })
  } catch (error: any) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to load role details for the current user.",
    })
  }
}

function mapAssignmentForResponse(
  assignment: AdminRoleAssignmentRow
): Record<string, unknown> {
  return {
    id: assignment.id,
    user_id: assignment.user_id,
    role_id: assignment.role_id,
    domain_id: assignment.domain_id ?? null,
    domain_name: assignment.domain_name ?? null,
    created_at: assignment.created_at,
    updated_at: assignment.updated_at,
    role: assignment.role
      ? {
          id: assignment.role.id,
          role_key: assignment.role.role_key,
          role_name: assignment.role.role_name,
          description: assignment.role.description ?? null,
          can_login: assignment.role.can_login,
          permissions: assignment.role.permissions,
          domains: assignment.role.domains,
          created_at: assignment.role.created_at,
          updated_at: assignment.role.updated_at,
        }
      : null,
  }
}
