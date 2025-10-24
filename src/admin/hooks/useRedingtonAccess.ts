import { useCallback, useEffect, useMemo, useState } from "react"

import {
  getRequestedLoginMode,
  type LoginMode,
  setRequestedLoginMode,
} from "../utils/login-mode"

type AccessRole = {
  id: number
  role_key: string
  role_name: string
  description?: string | null
  can_login: boolean
  permissions: string[]
  domains: number[]
  created_at: string
  updated_at: string
}

type AccessAssignment = {
  id: number
  user_id: string
  role_id: number
  domain_id: number | null
  domain_name: string | null
  created_at: string
  updated_at: string
  role: AccessRole | null
}

type AccessResponse = {
  user?: {
    id: string
    email?: string | null
    first_name?: string | null
    last_name?: string | null
  }
  roles: AccessRole[]
  login_roles: AccessRole[]
  permissions: string[]
  assignments: AccessAssignment[]
}

type AccessDomain = {
  id: number | null
  label: string
}

export function useRedingtonAccess() {
  const [data, setData] = useState<AccessResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [loginMode, setLoginMode] = useState<LoginMode>("admin")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/admin/redington/admin-roles/me", {
        credentials: "include",
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(
          typeof body?.message === "string"
            ? body.message
            : `Failed to load access information (${response.status})`
        )
      }

      const body = (await response.json()) as AccessResponse

      const requestedMode = getRequestedLoginMode()
      const hasPartner = body.roles.some((role) =>
        role.role_key?.toLowerCase().includes("partner")
      )

      if (requestedMode === "partner" && !hasPartner) {
        setRequestedLoginMode("admin")
        throw new Error(
          "You selected Partner mode, but your account does not have partner access. Please sign in as Admin instead."
        )
      }

      setLoginMode(requestedMode === "partner" ? "partner" : "admin")
      setData(body)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load access information."
      setError(message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const roles = data?.roles ?? []
  const assignments = data?.assignments ?? []
  const permissions = data?.permissions ?? []

  const isSuperAdmin = useMemo(() => {
    return roles.some((role) => role.role_key === "super_admin")
  }, [roles])

  const hasGlobalAccess = useMemo(() => {
    if (isSuperAdmin) {
      return true
    }
    return assignments.some((assignment) => assignment.domain_id === null)
  }, [assignments, isSuperAdmin])

  const partnerAssignments = useMemo(() => {
    return assignments.filter((assignment) =>
      assignment.role?.role_key?.toLowerCase().includes("partner")
    )
  }, [assignments])

  const hasPartnerRole = partnerAssignments.length > 0

  const accessibleDomains: AccessDomain[] = useMemo(() => {
    if (isSuperAdmin) {
      return [{ id: null, label: "All domains" }]
    }

    const labels = new Map<number | null, string>()

    const source = loginMode === "partner" ? partnerAssignments : assignments

    for (const assignment of source) {
      if (assignment.domain_id === null) {
        labels.set(null, "All domains")
        continue
      }
      const label =
        assignment.domain_name ??
        (assignment.domain_id !== null ? `Domain #${assignment.domain_id}` : "All domains")
      labels.set(assignment.domain_id, label)
    }

    if (!labels.size) {
      return []
    }

    return Array.from(labels.entries()).map(([id, label]) => ({
      id,
      label,
    }))
  }, [assignments, isSuperAdmin, hasPartnerRole, partnerAssignments, loginMode])

  return {
    loading,
    error,
    refresh: load,
    user: data?.user ?? null,
    roles,
    assignments,
    partnerAssignments,
    permissions,
    isSuperAdmin,
    hasGlobalAccess,
    hasPartnerRole,
    accessibleDomains,
    loginMode,
  }
}
