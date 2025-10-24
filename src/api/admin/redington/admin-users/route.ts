import { removeUserAccountWorkflow } from "@medusajs/core-flows"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import {
  assignRoleToUser,
  findAdminRoleById,
  type AdminRoleRow,
  type AdminRoleAssignmentRow,
} from "../../../../lib/pg"

type CreateAdminUserBody = {
  email?: string | null
  password?: string | null
  first_name?: string | null
  last_name?: string | null
  role_ids?: Array<number | string | null | undefined> | null
}

const parseRoleIds = (
  value: CreateAdminUserBody["role_ids"]
): number[] => {
  if (!Array.isArray(value)) {
    return []
  }

  const parsed = value
    .map((entry) => {
      if (typeof entry === "number" && Number.isFinite(entry)) {
        return entry
      }
      if (typeof entry === "string") {
        const trimmed = entry.trim()
        if (!trimmed) {
          return null
        }
        const asNumber = Number.parseInt(trimmed, 10)
        return Number.isFinite(asNumber) ? asNumber : null
      }
      return null
    })
    .filter((entry): entry is number => entry !== null)

  return Array.from(new Set(parsed))
}

const normalizeName = (value?: string | null) => {
  const trimmed = (value ?? "").trim()
  return trimmed || null
}

const sanitizeUser = (user: any) => ({
  id: user.id,
  email: user.email,
  first_name: user.first_name ?? null,
  last_name: user.last_name ?? null,
  metadata: user.metadata ?? null,
})

const detachUserIfNeeded = async (
  scope: MedusaRequest["scope"],
  userId: string
) => {
  try {
    const workflow = removeUserAccountWorkflow(scope)
    await workflow.run({ input: { userId } })
  } catch (error) {
    const logger =
      scope.resolve(ContainerRegistrationKeys.LOGGER) as {
        error: (...args: unknown[]) => void
      }
    logger?.error?.(
      "Failed to rollback admin user creation",
      error
    )
  }
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const body = (req.body || {}) as CreateAdminUserBody
  const email = (body.email ?? "").trim().toLowerCase()
  const password = (body.password ?? "").trim()
  const firstName = normalizeName(body.first_name)
  const lastName = normalizeName(body.last_name)
  const roleIds = parseRoleIds(body.role_ids)

  if (!email) {
    return res.status(400).json({ message: "email is required" })
  }

  if (!password || password.length < 8) {
    return res.status(400).json({
      message: "password must be at least 8 characters long",
    })
  }

  let validatedRoles: AdminRoleRow[] = []

  if (roleIds.length) {
    const roles: AdminRoleRow[] = []

    for (const id of roleIds) {
      const role = await findAdminRoleById(id)
      if (!role) {
        return res
          .status(404)
          .json({ message: `Role ${id} not found.` })
      }
      roles.push(role)
    }

    validatedRoles = roles
  }

  const userModule = req.scope.resolve(Modules.USER) as {
    createUsers: (data: any) => Promise<any>
  }

  const authModule = req.scope.resolve(Modules.AUTH) as {
    register: (
      provider: string,
      payload: any
    ) => Promise<{ authIdentity?: { id: string } | null; error?: string }>
    updateAuthIdentities: (data: any) => Promise<any>
  }

  let createdUser: any

  try {
    createdUser = await userModule.createUsers({
      email,
      first_name: firstName,
      last_name: lastName,
    })
  } catch (error: any) {
    if (error instanceof MedusaError) {
      const status =
        error.type === MedusaError.Types.DUPLICATE_ERROR ? 409 : 400
      return res.status(status).json({ message: error.message })
    }

    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Unexpected error creating user.",
    })
  }

  try {
    const registration = await authModule.register("emailpass", {
      body: { email, password },
    })

    if (
      !registration ||
      registration.error ||
      !registration.authIdentity?.id
    ) {
      await detachUserIfNeeded(req.scope, createdUser.id)
      return res.status(400).json({
        message:
          registration?.error ??
          "Unable to register credentials for the user.",
      })
    }

    await authModule.updateAuthIdentities({
      id: registration.authIdentity.id,
      app_metadata: {
        user_id: createdUser.id,
      },
    })
  } catch (error: any) {
    await detachUserIfNeeded(req.scope, createdUser.id)

    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Unexpected error registering user credentials.",
    })
  }

  const assignments: AdminRoleAssignmentRow[] = []

  for (const [index, role] of validatedRoles.entries()) {
    try {
      const assignment = await assignRoleToUser({
        user_id: createdUser.id,
        role_id: role.id,
      })

      assignments.push({
        ...assignment,
        role: role ?? assignment.role,
      })
    } catch (error: any) {
      const logger =
        req.scope.resolve(ContainerRegistrationKeys.LOGGER) as {
          warn: (...args: unknown[]) => void
        }
      logger?.warn?.(
        `Failed to assign role ${role.id} to user ${createdUser.id} (index ${index})`,
        error
      )
    }
  }

  return res.status(201).json({
    user: sanitizeUser(createdUser),
    assignments,
  })
}
