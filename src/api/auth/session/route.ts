import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  assignRoleToUser,
  countAdminRoles,
  ensureRedingtonAdminRoleAssignmentTable,
  ensureSuperAdminRole,
  getRolesForUser,
  type AdminRoleRow,
} from "../../../lib/pg"

import { fetchAdminUserById } from "../../../lib/admin-users"

type AuthenticatedMedusaRequest = MedusaRequest & {
  auth_context?: any
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

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const request = req as AuthenticatedMedusaRequest
  const authContext = request.auth_context

  if (!authContext) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  if (authContext.actor_type === "user") {
    const userId = authContext.actor_id

    if (!userId) {
      return res.status(403).json({
        message: "Your user account is not fully provisioned. Please contact an administrator.",
      })
    }

    try {
      const actor = await fetchAdminUserById(req.scope, userId)

      if (!actor) {
        return res.status(401).json({
          message: "Unable to locate the user linked to this account.",
        })
      }

      await ensureRedingtonAdminRoleAssignmentTable()

      const existingRoleCount = await countAdminRoles()

      if (existingRoleCount === 0) {
        const defaultRole = await ensureSuperAdminRole()
        await assignRoleToUser({
          user_id: userId,
          role_id: defaultRole.id,
        })
      }

      const assignedRoles = await getRolesForUser(userId)
      const loginRoles = assignedRoles.filter((role) => role.can_login)

      if (!loginRoles.length) {
        return res.status(403).json({
          message:
            "Your account does not have permission to access the admin dashboard. Please contact an administrator.",
        })
      }

      const roleKeys = loginRoles.map((role) => role.role_key)
      const permissions = aggregatePermissions(loginRoles)

      const enrichedContext = {
        ...authContext,
        roles: roleKeys,
        permissions,
        app_metadata: {
          ...(authContext.app_metadata ?? {}),
          roles: roleKeys,
          permissions,
        },
      }

      request.auth_context = enrichedContext
      request.session.auth_context = enrichedContext

      return res.status(200).json({
        user: {
          ...enrichedContext,
          actor,
          roles: loginRoles,
          permissions,
        },
      })
    } catch (error: any) {
      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Unexpected error establishing admin session.",
      })
    }
  }

  request.session.auth_context = authContext

  return res.status(200).json({
    user: authContext,
  })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const request = req as AuthenticatedMedusaRequest
  request.session.destroy((error: unknown) => {
    if (error) {
      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to terminate session.",
      })
    }

    res.json({ success: true })
  })
}
