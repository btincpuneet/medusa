import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  findRoleAssignmentById,
  getRolesForUser,
  removeRoleAssignment,
} from "../../../../../../lib/pg"
const parseId = (value: string) => {
  const id = Number.parseInt(value, 10)
  return Number.isFinite(id) ? id : undefined
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const id = parseId(req.params.id)

  if (!id) {
    return res.status(400).json({ message: "Invalid assignment id" })
  }

  try {
    const assignment = await findRoleAssignmentById(id)

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" })
    }

    const request = req as MedusaRequest & { auth_context?: any }
    const authContext = request.auth_context

    const actorId =
      authContext?.actor_type === "user" ? authContext.actor_id : undefined

    if (
      actorId &&
      actorId === assignment.user_id &&
      assignment.role?.can_login
    ) {
      const roles = await getRolesForUser(actorId)
      const loginRoles = roles.filter((role) => role.can_login)

      if (loginRoles.length <= 1) {
        return res.status(400).json({
          message: "You cannot remove your last login-enabled role.",
        })
      }
    }

    await removeRoleAssignment(id)

    return res.json({
      id,
      object: "admin_role_assignment",
      deleted: true,
    })
  } catch (error: any) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Unexpected error removing role assignment.",
    })
  }
}
