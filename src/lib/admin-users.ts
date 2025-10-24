import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

export type AdminUserSummary = {
  id: string
  email?: string
  first_name?: string | null
  last_name?: string | null
  metadata?: Record<string, unknown> | null
}

type Scope = {
  resolve<T = unknown>(containerKey: string | symbol): T
}

const mapResultToSummary = (user: any): AdminUserSummary => ({
  id: user.id,
  email: user.email,
  first_name: user.first_name ?? null,
  last_name: user.last_name ?? null,
  metadata: user.metadata ?? null,
})

export const fetchAdminUserById = async (
  scope: Scope,
  userId: string
): Promise<AdminUserSummary | null> => {
  const remoteQuery = scope.resolve(
    ContainerRegistrationKeys.REMOTE_QUERY
  ) as (query: unknown) => Promise<any[]>

  const query = remoteQueryObjectFromString({
    entryPoint: "user",
    variables: {
      filters: { id: userId },
    },
    fields: ["id", "email", "first_name", "last_name", "metadata"],
  })

  const result = await remoteQuery(query)
  const user = result?.[0]

  return user ? mapResultToSummary(user) : null
}

export const fetchAdminUsersByIds = async (
  scope: Scope,
  userIds: string[]
): Promise<Map<string, AdminUserSummary>> => {
  if (!userIds.length) {
    return new Map()
  }

  const remoteQuery = scope.resolve(
    ContainerRegistrationKeys.REMOTE_QUERY
  ) as (query: unknown) => Promise<any[]>

  const query = remoteQueryObjectFromString({
    entryPoint: "user",
    variables: {
      filters: { id: userIds },
    },
    fields: ["id", "email", "first_name", "last_name", "metadata"],
  })

  const result = await remoteQuery(query)
  const map = new Map<string, AdminUserSummary>()

  for (const entry of result ?? []) {
    if (entry?.id) {
      map.set(entry.id, mapResultToSummary(entry))
    }
  }

  return map
}

export const fetchAdminUserByEmail = async (
  scope: Scope,
  email: string
): Promise<AdminUserSummary | null> => {
  if (!email) {
    return null
  }

  const remoteQuery = scope.resolve(
    ContainerRegistrationKeys.REMOTE_QUERY
  ) as (query: unknown) => Promise<any[]>

  const query = remoteQueryObjectFromString({
    entryPoint: "user",
    variables: {
      filters: { email },
    },
    fields: ["id", "email", "first_name", "last_name", "metadata"],
  })

  const result = await remoteQuery(query)
  const user = result?.[0]

  return user ? mapResultToSummary(user) : null
}
