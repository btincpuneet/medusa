import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

type DomainAuthRecord = {
  id: number
  domain_id?: number
  domain_name?: string
  auth_type?: number
  email_otp?: boolean
  mobile_otp?: boolean
  created_at?: string
  updated_at?: string
}

type DomainOption = {
  id: number
  domain_name: string
}

type DomainAuthResponse = {
  domain_auth_controls?: DomainAuthRecord[]
  domain_auth_control?: DomainAuthRecord
  message?: string
}

type DomainsResponse = {
  domains?: DomainOption[]
}

const AUTH_TYPE_OPTIONS = [
  { value: "1", label: "OTP-only" },
  { value: "2", label: "Password + OTP" },
]

const initialFormState = {
  domain_id: "",
  auth_type: "2",
  email_otp: true,
  mobile_otp: true,
}

const DomainAuthenticationPage: React.FC = () => {
  const [entries, setEntries] = useState<DomainAuthRecord[]>([])
  const [domains, setDomains] = useState<DomainOption[]>([])
  const [form, setForm] = useState(initialFormState)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0
      return bDate - aDate
    })
  }, [entries])

  const getAuthTypeLabel = useCallback((value?: number) => {
    const match = AUTH_TYPE_OPTIONS.find(
      (option) => Number(option.value) === Number(value)
    )
    return match ? match.label : "-"
  }, [])

  const loadDomains = useCallback(async () => {
    try {
      const response = await fetch("/admin/redington/domains", {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Failed to load domains.")
      }
      const body = (await response.json()) as DomainsResponse
      setDomains(body.domains ?? [])
    } catch (err) {
      console.error(err)
    }
  }, [])

  const loadEntries = useCallback(async () => {
    const response = await fetch("/admin/redington/domain-based-authentication", {
      credentials: "include",
    })

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as DomainAuthResponse
      throw new Error(body?.message || "Failed to load domain authentication settings.")
    }

    const body = (await response.json()) as DomainAuthResponse
    setEntries(body.domain_auth_controls ?? [])
  }, [])

  const loadAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setStatus(null)

    try {
      await Promise.all([loadDomains(), loadEntries()])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load domain authentication settings."
      setError(message)
      setEntries([])
    } finally {
      setIsLoading(false)
    }
  }, [loadDomains, loadEntries])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const resetForm = () => {
    setForm(initialFormState)
    setEditingId(null)
  }

  const handleSelectChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setStatus(null)

    const domainId = Number.parseInt(form.domain_id, 10)
    const authType = Number.parseInt(form.auth_type, 10)

    if (!Number.isFinite(domainId)) {
      setError("Please choose a domain.")
      return
    }

    if (![1, 2].includes(authType)) {
      setError("Select a valid authentication type.")
      return
    }

    setIsSubmitting(true)

    const payload = {
      domain_id: domainId,
      auth_type: authType,
      email_otp: form.email_otp,
      mobile_otp: form.mobile_otp,
    }

    const isEdit = editingId !== null

    try {
      const response = await fetch(
        isEdit
          ? `/admin/redington/domain-based-authentication/${editingId}`
          : "/admin/redington/domain-based-authentication",
        {
          method: isEdit ? "PUT" : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      )

      const body = (await response.json().catch(() => ({}))) as DomainAuthResponse

      if (!response.ok) {
        throw new Error(
          body?.message ||
            (isEdit
              ? "Failed to update authentication settings."
              : "Failed to create authentication settings.")
        )
      }

      await loadEntries()
      resetForm()
      setStatus(isEdit ? "Authentication settings updated." : "Authentication settings created.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error saving authentication settings."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (record: DomainAuthRecord) => {
    setEditingId(record.id)
    setForm({
      domain_id: record.domain_id ? String(record.domain_id) : "",
      auth_type: record.auth_type ? String(record.auth_type) : "2",
      email_otp: Boolean(record.email_otp),
      mobile_otp: Boolean(record.mobile_otp),
    })
    setError(null)
    setStatus(null)
  }

  const handleDelete = async (record: DomainAuthRecord) => {
    if (
      !window.confirm(
        `Remove authentication settings for ${record.domain_name ?? "this domain"}?`
      )
    ) {
      return
    }

    try {
      const response = await fetch(
        `/admin/redington/domain-based-authentication/${record.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      )

      if (!response.ok && response.status !== 204) {
        const body = (await response.json().catch(() => ({}))) as DomainAuthResponse
        throw new Error(body?.message || "Failed to delete authentication settings.")
      }

      if (editingId === record.id) {
        resetForm()
      }

      await loadEntries()
      setStatus("Authentication settings removed.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error deleting authentication settings."
      setError(message)
    }
  }

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>Domain Authentication</h1>
          <p style={{ margin: "4px 0 0", color: "#555" }}>
            Manage domain-specific authentication requirements for Redington portals.
          </p>
        </div>
        <button onClick={() => void loadAll()} disabled={isLoading}>
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: "#ffe5e5", color: "#a80000", padding: "12px", borderRadius: "8px" }}>
          {error}
        </div>
      )}

      {status && (
        <div style={{ background: "#e8f5e9", color: "#1b5e20", padding: "12px", borderRadius: "8px" }}>
          {status}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
          padding: "16px",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          background: "#fafafa",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>Domain</span>
          <select
            name="domain_id"
            value={form.domain_id}
            onChange={handleSelectChange}
            required
          >
            <option value="">Select domain…</option>
            {domains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.domain_name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>Authentication Type</span>
          <select
            name="auth_type"
            value={form.auth_type}
            onChange={handleSelectChange}
            required
          >
            {AUTH_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            name="email_otp"
            checked={form.email_otp}
            onChange={handleCheckboxChange}
          />
          <span>Email OTP required</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            name="mobile_otp"
            checked={form.mobile_otp}
            onChange={handleCheckboxChange}
          />
          <span>Mobile OTP required</span>
        </label>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : editingId ? "Update Settings" : "Create Settings"}
          </button>
          {editingId !== null && (
            <button type="button" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div style={{ border: "1px solid #e5e5e5", borderRadius: "8px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f9f9f9" }}>
            <tr>
              <th style={headerCellStyle}>Domain</th>
              <th style={headerCellStyle}>Auth Type</th>
              <th style={headerCellStyle}>Email OTP</th>
              <th style={headerCellStyle}>Mobile OTP</th>
              <th style={headerCellStyle}>Updated</th>
              <th style={headerCellStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td style={cellStyle} colSpan={6}>
                  Loading authentication settings...
                </td>
              </tr>
            ) : sortedEntries.length === 0 ? (
              <tr>
                <td style={cellStyle} colSpan={6}>
                  No authentication rules configured.
                </td>
              </tr>
            ) : (
              sortedEntries.map((record) => (
                <tr key={record.id}>
                  <td style={cellStyle}>{record.domain_name ?? `Domain #${record.domain_id}`}</td>
                  <td style={cellStyle}>{getAuthTypeLabel(record.auth_type)}</td>
                  <td style={cellStyle}>{record.email_otp ? "Yes" : "No"}</td>
                  <td style={cellStyle}>{record.mobile_otp ? "Yes" : "No"}</td>
                  <td style={cellStyle}>{formatDate(record.updated_at)}</td>
                  <td style={{ ...cellStyle, display: "flex", gap: "8px" }}>
                    <button onClick={() => handleEdit(record)}>Edit</button>
                    <button
                      onClick={() => void handleDelete(record)}
                      style={{ color: "#a80000" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const headerCellStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px",
  fontWeight: 600,
  borderBottom: "1px solid #e5e5e5",
}

const cellStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #f0f0f0",
  verticalAlign: "middle",
}

function formatDate(value?: string) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export const config = defineRouteConfig({})

export default DomainAuthenticationPage
