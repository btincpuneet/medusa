import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

type AdminRole = {
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

type AdminUser = {
  id: string
  email?: string | null
  first_name?: string | null
  last_name?: string | null
  metadata?: Record<string, unknown> | null
}

type AdminRoleAssignment = {
  id: number
  user_id: string
  role_id: number
  domain_id?: number
  domain_name?: string
  created_at: string
  updated_at: string
  role?: AdminRole
  user?: AdminUser
}

type Domain = {
  id: number
  domain_name: string
  is_active: boolean
}

type DomainFilter = "all" | "global" | number

type CurrentUserRoles = {
  user?: {
    id: string
    email?: string | null
    first_name?: string | null
    last_name?: string | null
  }
  roles: AdminRole[]
  login_roles: AdminRole[]
  permissions: string[]
}

type RoleFormState = {
  id: number | null
  role_name: string
  description: string
  permissions: string
  can_login: boolean
  domains: string[]
}

type AssignmentFormState = {
  user_email: string
  role_id: string
  domain_id: string
}

type CreateUserFormState = {
  email: string
  first_name: string
  last_name: string
  password: string
  confirm_password: string
  initial_role_id: string
}

const defaultRoleForm: RoleFormState = {
  id: null,
  role_name: "",
  description: "",
  permissions: "",
  can_login: true,
  domains: [],
}

const defaultAssignmentForm: AssignmentFormState = {
  user_email: "",
  role_id: "",
  domain_id: "",
}

const defaultCreateUserForm: CreateUserFormState = {
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  confirm_password: "",
  initial_role_id: "",
}

const formatDate = (value: string) => {
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return value
    }
    return date.toLocaleString()
  } catch {
    return value
  }
}

const normalizeName = (value?: string | null) => {
  const trimmed = (value ?? "").trim()
  return trimmed
}

const baseFieldStyle: React.CSSProperties = {
  border: "1px solid #000",
  borderRadius: "6px",
  padding: "8px",
  minHeight: "38px",
  background: "#fff",
}

const selectFieldStyle: React.CSSProperties = {
  ...baseFieldStyle,
  paddingRight: "32px",
}

const textareaFieldStyle: React.CSSProperties = {
  ...baseFieldStyle,
  minHeight: "96px",
  resize: "vertical",
}

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  background: "#eef2ff",
  color: "#312e81",
  padding: "6px 10px",
  borderRadius: "999px",
}

const tabButtonBaseStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: "20px",
  padding: "6px 14px",
  background: "#fff",
  cursor: "pointer",
  fontSize: "13px",
}

const AdminRolesPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [assignments, setAssignments] = useState<AdminRoleAssignment[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUserRoles | null>(null)
  const [roleForm, setRoleForm] = useState<RoleFormState>(defaultRoleForm)
  const [assignmentForm, setAssignmentForm] =
    useState<AssignmentFormState>(defaultAssignmentForm)
  const [userForm, setUserForm] =
    useState<CreateUserFormState>(defaultCreateUserForm)
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({})
  const [selectedDomains, setSelectedDomains] =
    useState<Record<string, string>>({})
  const [domainFilter, setDomainFilter] = useState<DomainFilter>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const permissions = currentUser?.permissions ?? []

  const hasSuperAdminRole = useMemo(() => {
    return (currentUser?.roles ?? []).some(
      (role) => role.role_key === "super_admin"
    )
  }, [currentUser])

  const canManageRoles = useMemo(() => {
    return (
      permissions.includes("*") ||
      permissions.includes("admin_roles.manage") ||
      hasSuperAdminRole
    )
  }, [permissions, hasSuperAdminRole])

  const canAssignRoles = useMemo(() => {
    return (
      permissions.includes("*") ||
      permissions.includes("admin_roles.assign") ||
      hasSuperAdminRole
    )
  }, [permissions, hasSuperAdminRole])

  const canCreateUsers = useMemo(() => {
    return (
      permissions.includes("*") ||
      permissions.includes("admin_users.manage") ||
      permissions.includes("admin_users.create") ||
      hasSuperAdminRole
    )
  }, [permissions, hasSuperAdminRole])

  const loadRoles = useCallback(async () => {
    const response = await fetch("/admin/redington/admin-roles", {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Unable to load roles.")
    }

    const body = await response.json()
    setRoles(Array.isArray(body.roles) ? body.roles : [])
  }, [])

  const loadAssignments = useCallback(async () => {
    const response = await fetch(
      "/admin/redington/admin-roles/assignments",
      { credentials: "include" }
    )

    if (!response.ok) {
      throw new Error("Unable to load role assignments.")
    }

    const body = await response.json()
    setAssignments(Array.isArray(body.assignments) ? body.assignments : [])
  }, [])

  const loadUsers = useCallback(async () => {
    const response = await fetch("/admin/users?limit=200", {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Unable to load admin users.")
    }

    const body = await response.json()
    const list = Array.isArray(body.users) ? body.users : []
    list.sort((a: AdminUser, b: AdminUser) => {
      const aEmail = (a.email ?? "").toLowerCase()
      const bEmail = (b.email ?? "").toLowerCase()
      return aEmail.localeCompare(bEmail)
    })
    setUsers(list)
  }, [])

  const loadDomains = useCallback(async () => {
    const response = await fetch("/admin/redington/domains", {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Unable to load domains.")
    }

    const body = await response.json()
    const list = Array.isArray(body.domains) ? body.domains : []
    const activeDomains = list.filter(
      (domain: Domain) => domain && domain.is_active
    )
    activeDomains.sort((a: Domain, b: Domain) =>
      a.domain_name.localeCompare(b.domain_name)
    )
    setDomains(activeDomains)
  }, [])

  const loadCurrentUser = useCallback(async () => {
    const response = await fetch("/admin/redington/admin-roles/me", {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Unable to load current user roles.")
    }

    const body = await response.json()
    setCurrentUser(body)
  }, [])

  const loadAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setStatus(null)
    try {
      await Promise.all([
        loadRoles(),
        loadAssignments(),
        loadCurrentUser(),
        loadUsers(),
        loadDomains(),
      ])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load role data."
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [loadAssignments, loadCurrentUser, loadRoles, loadUsers, loadDomains])

useEffect(() => {
  void loadAll()
}, [loadAll])

useEffect(() => {
  setSelectedRoles((prev) => {
    const next: Record<string, string> = {}
    for (const user of users) {
      next[user.id] = prev[user.id] ?? ""
    }
    return next
  })
  setSelectedDomains((prev) => {
    const next: Record<string, string> = {}
    for (const user of users) {
      if (prev[user.id]) {
        next[user.id] = prev[user.id]
      } else if (typeof domainFilter === "number") {
        next[user.id] = String(domainFilter)
      } else {
        next[user.id] = ""
      }
    }
    return next
  })
}, [users, domainFilter])

useEffect(() => {
  setSelectedRoles((prev) => {
    const next: Record<string, string> = {}
    for (const user of users) {
      next[user.id] = ""
    }
    return next
  })
  setSelectedDomains(() => {
    const next: Record<string, string> = {}
    for (const user of users) {
      next[user.id] =
        typeof domainFilter === "number" ? String(domainFilter) : ""
    }
    return next
  })
}, [domainFilter, users])

useEffect(() => {
  setAssignmentForm((prev) => ({
    ...prev,
    domain_id:
      typeof domainFilter === "number" ? String(domainFilter) : "",
  }))
}, [domainFilter])

  useEffect(() => {
    setRoleForm((prev) => {
      const allowed = new Set(domains.map((domain) => String(domain.id)))
      const filtered = prev.domains.filter((id) => allowed.has(id))
      if (filtered.length === prev.domains.length) {
        return prev
      }
      return { ...prev, domains: filtered }
    })
  }, [domains])

  useEffect(() => {
    if (
      typeof domainFilter === "number" &&
      !domains.some((domain) => domain.id === domainFilter)
    ) {
      setDomainFilter("all")
    }
  }, [domains, domainFilter])

  const domainMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const domain of domains) {
      map.set(domain.id, domain.domain_name)
    }
    return map
  }, [domains])

  const rolesForDisplay = useMemo(() => {
    if (domainFilter === "all") {
      return roles
    }
    if (domainFilter === "global") {
      return roles.filter((role) => role.domains.length === 0)
    }
    return roles.filter(
      (role) =>
        role.domains.includes(domainFilter) || role.domains.length === 0
    )
  }, [roles, domainFilter])

  if (!isLoading && !hasSuperAdminRole) {
    return (
      <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <h1 style={{ margin: 0 }}>Admin Roles</h1>
        <p style={{ color: "#4b5563", margin: 0 }}>
          This area is restricted to Super Admins. Contact your administrator if you need access.
        </p>
      </div>
    )
  }

  const assignmentsForDisplay = useMemo(() => {
    if (domainFilter === "all") {
      return assignments
    }
    if (domainFilter === "global") {
      return assignments.filter(
        (assignment) =>
          assignment.domain_id === undefined || assignment.domain_id === null
      )
    }
    return assignments.filter((assignment) => {
      if (assignment.domain_id === domainFilter) {
        return true
      }
      if (assignment.domain_id === undefined || assignment.domain_id === null) {
        const domainsForRole = assignment.role?.domains ?? []
        if (!domainsForRole.length) {
          return true
        }
        return domainsForRole.includes(domainFilter)
      }
      return false
    })
  }, [assignments, domainFilter])

  const assignmentsByUser = useMemo(() => {
    const map = new Map<string, AdminRoleAssignment[]>()

    for (const assignment of assignmentsForDisplay) {
      const list = map.get(assignment.user_id) ?? []
      list.push(assignment)
      map.set(assignment.user_id, list)
    }

    for (const [key, list] of map.entries()) {
      list.sort((a, b) => {
        const aName = a.role?.role_name ?? ""
        const bName = b.role?.role_name ?? ""
        return aName.localeCompare(bName)
      })
    }

    return map
  }, [assignmentsForDisplay])

  const roleOptions = useMemo(() => {
    const sorted = roles
      .slice()
      .sort((a, b) => a.role_name.localeCompare(b.role_name))

    const prioritized = sorted.sort((a, b) => {
      if (typeof domainFilter !== "number") {
        return 0
      }

      const aMatches =
        a.domains.length === 0 || a.domains.includes(domainFilter) ? 1 : 0
      const bMatches =
        b.domains.length === 0 || b.domains.includes(domainFilter) ? 1 : 0

      if (aMatches === bMatches) {
        return 0
      }
      return bMatches - aMatches
    })

    return prioritized.map((role) => {
      const labels = role.domains.length
        ? role.domains.map((id) => domainMap.get(id) ?? `Domain #${id}`)
        : []

      const suffix = labels.length
        ? labels.join(", ")
        : "All domains"

      const loginTag = role.can_login ? "" : " (view only)"

      return {
        value: String(role.id),
        label: `${role.role_name}${loginTag} – ${suffix}`,
      }
    })
  }, [roles, domainFilter, domainMap])

  useEffect(() => {
    setUserForm((prev) => {
      if (!prev.initial_role_id) {
        return prev
      }

      if (roleOptions.some((option) => option.value === prev.initial_role_id)) {
        return prev
      }

      return { ...prev, initial_role_id: "" }
    })
  }, [roleOptions])

  const domainTabs = useMemo(() => {
    const tabs: Array<{ value: DomainFilter; label: string }> = [
      { value: "all", label: "All Roles" },
      { value: "global", label: "Global" },
    ]

    for (const domain of domains) {
      tabs.push({
        value: domain.id,
        label: domain.domain_name,
      })
    }

    return tabs
  }, [domains])

  const activeTabLabel = useMemo(() => {
    if (domainFilter === "all") {
      return "All Roles"
    }
    if (domainFilter === "global") {
      return "Global"
    }
    return domainMap.get(domainFilter) ?? `Domain #${domainFilter}`
  }, [domainFilter, domainMap])

  const getRoleDomainLabels = useCallback(
    (role?: AdminRole) => {
      if (!role || !Array.isArray(role.domains)) {
        return []
      }
      if (!role.domains.length) {
        return ["All domains"]
      }
      return role.domains.map(
        (id) => domainMap.get(id) ?? `Domain #${id}`
      )
    },
    [domainMap]
  )

  const resetRoleForm = () => {
    setRoleForm(defaultRoleForm)
  }

  const handleRoleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = event.target

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setRoleForm((prev) => ({
        ...prev,
        [target.name]: target.checked,
      }))
      return
    }

    setRoleForm((prev) => ({
      ...prev,
      [target.name]: target.value,
    }))
  }

  const handleRoleDomainToggle = (domainId: number) => {
    const id = String(domainId)
    setRoleForm((prev) => {
      const hasDomain = prev.domains.includes(id)
      const nextDomains = hasDomain
        ? prev.domains.filter((entry) => entry !== id)
        : [...prev.domains, id]
      return { ...prev, domains: nextDomains }
    })
  }

  const handleAssignmentFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target
    setAssignmentForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleUserFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target
    setUserForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus(null)
    setError(null)

    if (!canCreateUsers) {
      setError("You do not have permission to create admin users.")
      return
    }

    if (!userForm.email.trim()) {
      setError("Email is required.")
      return
    }

    if (userForm.password !== userForm.confirm_password) {
      setError("Passwords do not match.")
      return
    }

    if (userForm.password.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }

    const payload: {
      email: string
      password: string
      first_name?: string
      last_name?: string
      role_ids?: number[]
    } = {
      email: userForm.email.trim().toLowerCase(),
      password: userForm.password,
    }

    const firstName = normalizeName(userForm.first_name)
    if (firstName) {
      payload.first_name = firstName
    }

    const lastName = normalizeName(userForm.last_name)
    if (lastName) {
      payload.last_name = lastName
    }

    if (userForm.initial_role_id) {
      const parsed = Number.parseInt(userForm.initial_role_id, 10)
      if (Number.isFinite(parsed)) {
        payload.role_ids = [parsed]
      }
    }

    setIsLoading(true)
    try {
      const response = await fetch("/admin/redington/admin-users", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        const message =
          typeof body?.message === "string"
            ? body.message
            : "Failed to create admin user."
        throw new Error(message)
      }

      await Promise.all([loadUsers(), loadAssignments()])
      setUserForm(defaultCreateUserForm)
      setStatus("Admin user created successfully.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error creating user."
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus(null)
    setError(null)

    const domainIds = roleForm.domains
      .map((entry) => Number.parseInt(entry, 10))
      .filter((value) => Number.isFinite(value))

    const payload = {
      role_name: roleForm.role_name.trim(),
      description: roleForm.description.trim() || null,
      permissions: roleForm.permissions,
      can_login: roleForm.can_login,
      domains: domainIds,
    }

    if (!payload.role_name) {
      setError("Role name is required.")
      return
    }

    const endpoint = roleForm.id
      ? `/admin/redington/admin-roles/${roleForm.id}`
      : "/admin/redington/admin-roles"
    const method = roleForm.id ? "PUT" : "POST"

    try {
      const response = await fetch(endpoint, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.message || "Failed to save role.")
      }

      await loadRoles()
      await loadCurrentUser()
      resetRoleForm()
      setStatus(roleForm.id ? "Role updated." : "Role created.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error saving role."
      setError(message)
    }
  }

  const handleEditRole = (role: AdminRole) => {
    setRoleForm({
      id: role.id,
      role_name: role.role_name,
      description: role.description ?? "",
      permissions: role.permissions.join("\n"),
      can_login: role.can_login,
      domains: (role.domains ?? []).map((id) => String(id)),
    })
    setStatus(null)
    setError(null)
  }

  const handleDeleteRole = async (role: AdminRole) => {
    if (!canManageRoles) {
      return
    }

    if (!window.confirm(`Delete role "${role.role_name}"?`)) {
      return
    }

    try {
      const response = await fetch(
        `/admin/redington/admin-roles/${role.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.message || "Failed to delete role.")
      }

      await loadRoles()
      await loadAssignments()
      await loadCurrentUser()
      if (roleForm.id === role.id) {
        resetRoleForm()
      }
      setStatus("Role deleted.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error deleting role."
      setError(message)
    }
  }

  const handleAssignmentSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus(null)
    setError(null)

    if (!assignmentForm.role_id) {
      setError("Select a role to assign.")
      return
    }

    if (!assignmentForm.user_email.trim()) {
      setError("Enter the user's email.")
      return
    }

    if (!assignmentForm.domain_id) {
      setError("Select a domain to assign.")
      return
    }

    const roleId = Number.parseInt(assignmentForm.role_id, 10)
    const domainId = Number.parseInt(assignmentForm.domain_id, 10)

    if (!Number.isFinite(roleId) || !Number.isFinite(domainId)) {
      setError("Invalid role or domain selection.")
      return
    }

    const role = roles.find((item) => item.id === roleId)
    if (role && role.domains.length && !role.domains.includes(domainId)) {
      setError("The selected role is not available for this domain.")
      return
    }

    try {
      const response = await fetch(
        "/admin/redington/admin-roles/assignments",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role_id: roleId,
            user_email: assignmentForm.user_email.trim(),
            domain_id: domainId,
          }),
        }
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.message || "Failed to assign role.")
      }

      await loadAssignments()
      await loadCurrentUser()
      setAssignmentForm({
        ...defaultAssignmentForm,
        domain_id:
          typeof domainFilter === "number" ? String(domainFilter) : "",
      })
      setStatus("Role assigned.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error assigning role."
      setError(message)
    }
  }

  const handleRemoveAssignment = async (assignment: AdminRoleAssignment) => {
    if (!canAssignRoles) {
      return
    }

    if (
      !window.confirm(
        `Remove role "${assignment.role?.role_name ?? assignment.role_id}" from ${assignment.user?.email ?? assignment.user_id}?`
      )
    ) {
      return
    }

    try {
      const response = await fetch(
        `/admin/redington/admin-roles/assignments/${assignment.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.message || "Failed to remove assignment.")
      }

      await loadAssignments()
      await loadCurrentUser()
      setStatus("Role assignment removed.")
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unexpected error removing assignment."
      setError(message)
    }
  }

  const handleAssignRoleToUser = async (userId: string) => {
    if (!canAssignRoles) {
      setError("You do not have permission to assign roles.")
      return
    }

    const selected = selectedRoles[userId]
    if (!selected) {
      setError("Select a role to assign.")
      return
    }

    const selectedDomain = selectedDomains[userId]
    if (!selectedDomain) {
      setError("Select a domain to assign.")
      return
    }

    const roleId = Number.parseInt(selected, 10)
    const domainId = Number.parseInt(selectedDomain, 10)

    if (!Number.isFinite(roleId) || !Number.isFinite(domainId)) {
      setError("Invalid role or domain selection.")
      return
    }

    const role = roles.find((item) => item.id === roleId)
    if (role && role.domains.length && !role.domains.includes(domainId)) {
      setError("The selected role is not available for this domain.")
      return
    }

    setIsLoading(true)
    setStatus(null)
    setError(null)

    try {
      const response = await fetch(
        "/admin/redington/admin-roles/assignments",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            role_id: roleId,
            domain_id: domainId,
          }),
        }
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        const message =
          typeof body?.message === "string"
            ? body.message
            : "Failed to assign role."
        throw new Error(message)
      }

      await Promise.all([loadAssignments(), loadCurrentUser()])
      setSelectedRoles((prev) => ({ ...prev, [userId]: "" }))
      setSelectedDomains((prev) => ({
        ...prev,
        [userId]:
          typeof domainFilter === "number" ? String(domainFilter) : "",
      }))
      setStatus("Role assigned.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error assigning role."
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ marginBottom: "8px" }}>Admin Roles</h1>
        <p style={{ margin: 0, color: "#555" }}>
          Control which admin users can sign in and what they are allowed to manage.
        </p>
      </div>

      {isLoading && <p>Loading role data…</p>}

      {!isLoading && error && (
        <div style={{ padding: "12px", background: "#ffecec", border: "1px solid #ffb3b3", borderRadius: "4px" }}>
          {error}
        </div>
      )}

      {!isLoading && status && (
        <div style={{ padding: "12px", background: "#e8f5e9", border: "1px solid #b2dfdb", borderRadius: "4px" }}>
          {status}
        </div>
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {domainTabs.map((tab) => {
            const isActive = domainFilter === tab.value
            return (
              <button
                key={typeof tab.value === "number" ? `domain-${tab.value}` : tab.value}
                type="button"
                onClick={() => setDomainFilter(tab.value)}
                style={{
                  ...tabButtonBaseStyle,
                  background: isActive ? "#111827" : "#fff",
                  color: isActive ? "#fff" : "#111827",
                  borderColor: isActive ? "#111827" : "#d1d5db",
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
        <span style={{ fontSize: "12px", color: "#4b5563" }}>
          Viewing: {activeTabLabel}
        </span>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Current Access</h2>
          <button onClick={loadAll} disabled={isLoading}>
            Refresh
          </button>
        </div>
        {currentUser && (
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "4px",
              padding: "12px",
              background: "#fafafa",
            }}
          >
            <strong>Signed in as:</strong>{" "}
            {currentUser.user?.email || currentUser.user?.id || "Unknown"}
            <div style={{ marginTop: "8px" }}>
              <strong>Roles:</strong>{" "}
              {currentUser.roles.length
                ? currentUser.roles.map((role) => role.role_name).join(", ")
                : "None"}
            </div>
            <div style={{ marginTop: "4px" }}>
              <strong>Permissions:</strong>{" "}
              {currentUser.permissions.length
                ? currentUser.permissions.join(", ")
                : "None"}
            </div>
          </div>
        )}
      </section>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "6px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Admin Users</h2>
            <p style={{ margin: 0, color: "#555" }}>
              Create dashboard users and link them with roles that control access.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadAll()}
            disabled={isLoading}
          >
            Refresh
          </button>
        </header>

        <form
          onSubmit={handleCreateUser}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          <div style={{ gridColumn: "1 / -1" }}>
            <h3 style={{ marginBottom: "8px" }}>Create Admin User</h3>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            Email
            <input
              type="email"
              name="email"
              value={userForm.email}
              onChange={handleUserFormChange}
              required
              disabled={!canCreateUsers || isLoading}
              style={baseFieldStyle}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            First Name
            <input
              type="text"
              name="first_name"
              value={userForm.first_name}
              onChange={handleUserFormChange}
              disabled={!canCreateUsers || isLoading}
              style={baseFieldStyle}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            Last Name
            <input
              type="text"
              name="last_name"
              value={userForm.last_name}
              onChange={handleUserFormChange}
              disabled={!canCreateUsers || isLoading}
              style={baseFieldStyle}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            Password
            <input
              type="password"
              name="password"
              value={userForm.password}
              onChange={handleUserFormChange}
              required
              minLength={8}
              disabled={!canCreateUsers || isLoading}
              style={baseFieldStyle}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            Confirm Password
            <input
              type="password"
              name="confirm_password"
              value={userForm.confirm_password}
              onChange={handleUserFormChange}
              required
              minLength={8}
              disabled={!canCreateUsers || isLoading}
              style={baseFieldStyle}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            Initial Role (optional)
            <select
              name="initial_role_id"
              value={userForm.initial_role_id}
              onChange={handleUserFormChange}
              disabled={
                !canCreateUsers || isLoading || roleOptions.length === 0
              }
              style={selectFieldStyle}
            >
              <option value="">Select role</option>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              gridColumn: "1 / -1",
            }}
          >
            <button type="submit" disabled={!canCreateUsers || isLoading}>
              Create User
            </button>
            <button
              type="button"
              onClick={() => setUserForm(defaultCreateUserForm)}
              disabled={isLoading}
            >
              Clear
            </button>
          </div>
        </form>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "720px" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>Name</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>Email</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>Roles</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>Assign Role</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      color: "#666",
                    }}
                  >
                    {isLoading ? "Loading admin users…" : "No admin users found."}
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const userAssignments = assignmentsByUser.get(user.id) ?? []
                  const displayName = `${normalizeName(user.first_name)} ${normalizeName(
                    user.last_name
                  )}`.trim()

                  return (
                    <tr key={user.id}>
                      <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                        {displayName || "—"}
                      </td>
                      <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                        {user.email ?? "—"}
                      </td>
                      <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                        {userAssignments.length === 0 ? (
                          <span style={{ color: "#666" }}>No roles</span>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "8px",
                            }}
                          >
                            {userAssignments.map((assignment) => {
                              const domainLabel = assignment.domain_id
                                ? domainMap.get(assignment.domain_id) ??
                                  assignment.domain_name ??
                                  `Domain #${assignment.domain_id}`
                                : "All domains"
                              return (
                                <span key={assignment.id} style={chipStyle}>
                                  <span
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    <span>
                                      {assignment.role?.role_name ??
                                        `Role ${assignment.role_id}`}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        color: "#4338ca",
                                      }}
                                    >
                                      {domainLabel}
                                    </span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAssignment(assignment)}
                                    disabled={!canAssignRoles || isLoading}
                                    style={{
                                      border: "none",
                                      background: "transparent",
                                      color: "inherit",
                                      cursor:
                                        !canAssignRoles || isLoading ? "not-allowed" : "pointer",
                                      fontSize: "16px",
                                      lineHeight: 1,
                                    }}
                                  >
                                    ×
                                  </button>
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                          }}
                        >
                          <select
                            value={selectedRoles[user.id] ?? ""}
                            onChange={(event) =>
                              setSelectedRoles((prev) => ({
                                ...prev,
                                [user.id]: event.target.value,
                              }))
                            }
                            disabled={
                              !canAssignRoles ||
                              isLoading ||
                              roleOptions.length === 0
                            }
                            style={{ ...selectFieldStyle, minWidth: "180px" }}
                          >
                            <option value="">Select role</option>
                            {roleOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <select
                            value={selectedDomains[user.id] ?? ""}
                            onChange={(event) =>
                              setSelectedDomains((prev) => ({
                                ...prev,
                                [user.id]: event.target.value,
                              }))
                            }
                            disabled={
                              !canAssignRoles ||
                              isLoading ||
                              domains.length === 0
                            }
                            style={{ ...selectFieldStyle, minWidth: "160px" }}
                          >
                            <option value="">Select domain</option>
                            {domains.map((domain) => (
                              <option key={domain.id} value={domain.id}>
                                {domain.domain_name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => void handleAssignRoleToUser(user.id)}
                            disabled={
                              !canAssignRoles ||
                              isLoading ||
                              !selectedDomains[user.id] ||
                              !selectedRoles[user.id] ||
                              roleOptions.length === 0 ||
                              domains.length === 0
                            }
                          >
                            Assign
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "6px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Roles</h2>
        </div>

        {rolesForDisplay.length === 0 ? (
          <p style={{ color: "#6b7280" }}>
            {domainFilter === "all"
              ? "No roles have been created yet."
              : "No roles match the selected filter."}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>Name</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>Description</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>Can Login</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>Domain</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>Permissions</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>Updated</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rolesForDisplay.map((role) => (
                  <tr key={role.id}>
                    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{role.role_name}</td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                      {role.description || "-"}
                    </td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                      {role.can_login ? "Yes" : "No"}
                    </td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                      {(() => {
                        const labels = getRoleDomainLabels(role)
                        if (labels.length) {
                          return labels.join(", ")
                        }
                        return <span style={{ color: "#6b7280" }}>Unknown</span>
                      })()}
                    </td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #eee", whiteSpace: "pre-wrap" }}>
                      {role.permissions.length ? role.permissions.join("\n") : "-"}
                    </td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                      {formatDate(role.updated_at)}
                    </td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #eee", display: "flex", gap: "8px" }}>
                      <button onClick={() => handleEditRole(role)} disabled={!canManageRoles}>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role)}
                        disabled={!canManageRoles || role.role_key === "super_admin"}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <form
          onSubmit={handleRoleSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "12px",
          }}
        >
          <div style={{ gridColumn: "1 / -1" }}>
            <h3 style={{ marginBottom: "8px" }}>
              {roleForm.id ? "Edit Role" : "Create Role"}
            </h3>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            Role Name
            <input
              type="text"
              name="role_name"
              value={roleForm.role_name}
              onChange={handleRoleFormChange}
              disabled={!canManageRoles}
              required
              style={baseFieldStyle}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            Description
            <input
              type="text"
              name="description"
              value={roleForm.description}
              onChange={handleRoleFormChange}
              disabled={!canManageRoles}
              style={baseFieldStyle}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            Permissions (comma or newline separated)
            <textarea
              name="permissions"
              rows={3}
              value={roleForm.permissions}
              onChange={handleRoleFormChange}
              disabled={!canManageRoles}
              style={textareaFieldStyle}
            />
          </label>

          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <span style={{ fontWeight: 500 }}>Domains</span>
            {domains.length === 0 ? (
              <span style={{ fontSize: "13px", color: "#6b7280" }}>
                No active domains found. The role will be available across all domains.
              </span>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                {domains.map((domain) => (
                  <label
                    key={domain.id}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
                  >
                    <input
                      type="checkbox"
                      checked={roleForm.domains.includes(String(domain.id))}
                      onChange={() => handleRoleDomainToggle(domain.id)}
                      disabled={!canManageRoles}
                    />
                    {domain.domain_name}
                  </label>
                ))}
              </div>
            )}
            <span style={{ fontSize: "12px", color: "#6b7280" }}>
              Leave all unchecked to make the role available for every domain.
            </span>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              name="can_login"
              checked={roleForm.can_login}
              onChange={handleRoleFormChange}
              disabled={!canManageRoles}
            />
            Can access admin dashboard
          </label>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button type="submit" disabled={!canManageRoles}>
              {roleForm.id ? "Update Role" : "Create Role"}
            </button>
            {roleForm.id && (
              <button type="button" onClick={resetRoleForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "6px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <h2 style={{ margin: 0 }}>Assignments</h2>

        {assignmentsForDisplay.length === 0 ? (
          <p style={{ color: "#6b7280" }}>
            {domainFilter === "all"
              ? "No users have been assigned to roles yet."
              : "No assignments match the selected filter."}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>User</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>Role</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>Domains</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>Assigned</th>
                  <th style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignmentsForDisplay.map((assignment) => (
                  <tr key={assignment.id}>
                    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                      {assignment.user?.email ||
                        assignment.user?.id ||
                        assignment.user_id}
                    </td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                      {assignment.role?.role_name || assignment.role_id}
                      {!assignment.role?.can_login && (
                        <span style={{ marginLeft: "8px", color: "#666" }}>
                          (view only)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                      {assignment.domain_id
                        ? domainMap.get(assignment.domain_id) ??
                          assignment.domain_name ??
                          `Domain #${assignment.domain_id}`
                        : "All domains"}
                    </td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                      {formatDate(assignment.created_at)}
                    </td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                      <button
                        onClick={() => handleRemoveAssignment(assignment)}
                        disabled={!canAssignRoles}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <form
          onSubmit={handleAssignmentSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "12px",
          }}
        >
          <div style={{ gridColumn: "1 / -1" }}>
            <h3 style={{ marginBottom: "8px" }}>Assign Role</h3>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            User Email
            <input
              type="email"
              name="user_email"
              value={assignmentForm.user_email}
              onChange={handleAssignmentFormChange}
              placeholder="merchant@example.com"
              disabled={!canAssignRoles}
              required
              style={baseFieldStyle}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            Role
            <select
              name="role_id"
              value={assignmentForm.role_id}
              onChange={handleAssignmentFormChange}
              disabled={!canAssignRoles || !roles.length}
              required
              style={selectFieldStyle}
            >
              <option value="">Select role</option>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            Domain
            <select
              name="domain_id"
              value={assignmentForm.domain_id}
              onChange={handleAssignmentFormChange}
              disabled={!canAssignRoles || domains.length === 0}
              required
              style={selectFieldStyle}
            >
              <option value="">Select domain</option>
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.domain_name}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="submit"
              disabled={
                !canAssignRoles ||
                !assignmentForm.role_id ||
                !assignmentForm.domain_id ||
                !assignmentForm.user_email.trim()
              }
            >
              Assign Role
            </button>
            <button
              type="button"
              onClick={() =>
                setAssignmentForm({
                  ...defaultAssignmentForm,
                  domain_id:
                    typeof domainFilter === "number"
                      ? String(domainFilter)
                      : "",
                })
              }
            >
              Clear
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Admin Roles",
  icon: undefined,
})

export default AdminRolesPage
