import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useCallback, useEffect, useMemo, useState } from "react"

type Domain = {
  id: number
  domain_name: string
  is_active: boolean
}

type DomainsResponse = {
  domains?: Domain[]
  domain?: Domain
  message?: string
}

const initialForm = {
  domain_name: "",
  is_active: true,
}

const RedingtonDomainsPage: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [editing, setEditing] = useState<Domain | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const sortedDomains = useMemo(() => {
    return [...domains].sort((a, b) =>
      a.domain_name.localeCompare(b.domain_name)
    )
  }, [domains])

  const loadDomains = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/admin/redington/domains", {
        credentials: "include",
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as DomainsResponse
        throw new Error(body?.message || `Failed to load domains (${response.status})`)
      }

      const body = (await response.json()) as DomainsResponse
      setDomains(body.domains ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load domains."
      setError(message)
      setDomains([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDomains()
  }, [loadDomains])

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = event.target

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        [target.name]: target.checked,
      }))
      return
    }

    setForm((prev) => ({
      ...prev,
      [target.name]: target.value,
    }))
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()

    const domainName = form.domain_name.trim()
    if (!domainName) {
      setError("Domain name is required.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setFlash(null)

    try {
      const isEdit = Boolean(editing)
      const url = isEdit
        ? `/admin/redington/domains/${editing?.id}`
        : "/admin/redington/domains"
      const method = isEdit ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          domain_name: domainName,
          is_active: form.is_active,
        }),
      })

      const body = (await response.json().catch(() => ({}))) as DomainsResponse

      if (!response.ok) {
        throw new Error(
          body?.message ||
            (isEdit
              ? `Failed to update domain (${response.status})`
              : `Failed to create domain (${response.status})`)
        )
      }

      if (body.domain) {
        setDomains((prev) =>
          prev.some((d) => d.id === body.domain!.id)
            ? prev.map((d) => (d.id === body.domain!.id ? body.domain! : d))
            : [body.domain!, ...prev]
        )
      } else {
        await loadDomains()
      }

      setForm(initialForm)
      setEditing(null)
      setShowDrawer(false)
      setFlash(isEdit ? "Domain updated." : "Domain created.")
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to save domain."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (domain: Domain) => {
    setError(null)

    try {
      const response = await fetch(`/admin/redington/domains/${domain.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          is_active: !domain.is_active,
        }),
      })

      const body = (await response.json().catch(() => ({}))) as DomainsResponse

      if (!response.ok) {
        throw new Error(body?.message || `Failed to update domain (${response.status})`)
      }

      if (body.domain) {
        setDomains((prev) => prev.map((item) => (item.id === body.domain!.id ? body.domain! : item)))
      } else {
        await loadDomains()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to change domain status."
      setError(message)
    }
  }

  const handleDelete = async (domain: Domain) => {
    if (!window.confirm(`Delete domain "${domain.domain_name}"? This cannot be undone.`)) {
      return
    }

    setError(null)

    try {
      const response = await fetch(`/admin/redington/domains/${domain.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok && response.status !== 204) {
        const body = (await response.json().catch(() => ({}))) as DomainsResponse
        throw new Error(body?.message || `Failed to delete domain (${response.status})`)
      }

      setDomains((prev) => prev.filter((item) => item.id !== domain.id))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete domain."
      setError(message)
    }
  }

  const openCreate = () => {
    setForm(initialForm)
    setEditing(null)
    setShowDrawer(true)
    setError(null)
    setFlash(null)
  }

  const openEdit = (domain: Domain) => {
    setForm({
      domain_name: domain.domain_name,
      is_active: domain.is_active,
    })
    setEditing(domain)
    setShowDrawer(true)
    setError(null)
    setFlash(null)
  }

  return (
    <div
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        background: "#f5f4f1",
        minHeight: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0 }}>Add Domain</h1>
          <p style={{ margin: "6px 0 0", color: "#4b5563" }}>
            Toggle status and manage Redington domains without created/updated columns.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={loadDomains}
            disabled={isLoading}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #d0d5dd",
              background: "#fff",
              color: "#0f172a",
            }}
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "none",
              background: "#f2611a",
              color: "#fff",
              fontWeight: 700,
              boxShadow: "0 6px 16px rgba(242, 97, 26, 0.35)",
            }}
          >
            Add Domain
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            color: "#991b1b",
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid #fecdd3",
          }}
        >
          {error}
        </div>
      )}

      {flash && (
        <div
          style={{
            background: "#ecfdf3",
            color: "#065f46",
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid #bbf7d0",
          }}
        >
          {flash}
        </div>
      )}

      <div
        style={{
          overflowX: "auto",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#fff",
          boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f8f6f4" }}>
            <tr>
              <th style={headerCellStyle}>S. No</th>
              <th style={headerCellStyle}>Domain</th>
              <th style={headerCellStyle}>Status</th>
              <th style={headerCellStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} style={cellStyle}>
                  Loading domains...
                </td>
              </tr>
            ) : sortedDomains.length === 0 ? (
              <tr>
                <td colSpan={4} style={cellStyle}>
                  No domains found.
                </td>
              </tr>
            ) : (
              sortedDomains.map((domain, idx) => (
                <tr
                  key={domain.id}
                  style={{
                    background: idx % 2 === 0 ? "#fff" : "#faf7f2",
                  }}
                >
                  <td style={{ ...cellStyle, width: 80 }}>{idx + 1}</td>
                  <td style={cellStyle}>{domain.domain_name}</td>
                  <td style={cellStyle}>
                    <button
                      onClick={() => handleToggleActive(domain)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        border: "1px solid transparent",
                        background: domain.is_active ? "#d1fae5" : "#fee2e2",
                        color: domain.is_active ? "#047857" : "#b91c1c",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      {domain.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td style={{ ...cellStyle, display: "flex", gap: 12 }}>
                    <button
                      onClick={() => openEdit(domain)}
                      style={{
                        color: "#1d4ed8",
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(domain)}
                      style={{
                        color: "#c53030",
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
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

      {showDrawer ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 40,
            padding: 16,
          }}
        >
          <div
            style={{
              width: "min(780px, 95vw)",
              background: "#fff",
              borderRadius: 14,
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderBottom: "1px solid #e5e7eb",
                background: "#f8f6f4",
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {editing ? "Edit Domain" : "Add Domain"}
                </div>
                <div style={{ color: "#6b7280", fontSize: 13, marginTop: 2 }}>
                  Redington Domain Details
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setForm(initialForm)
                    setEditing(null)
                  }}
                  style={{
                    border: "none",
                    background: "none",
                    color: "#374151",
                    cursor: "pointer",
                    padding: "8px 10px",
                    borderRadius: 8,
                  }}
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  style={{
                    border: "none",
                    background: "#ede9e2",
                    color: "#1f2937",
                    padding: "8px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  form="domain-form"
                  style={{
                    border: "none",
                    background: "#f2611a",
                    color: "#fff",
                    padding: "8px 14px",
                    borderRadius: 10,
                    fontWeight: 700,
                    boxShadow: "0 6px 16px rgba(242, 97, 26, 0.3)",
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            <form
              id="domain-form"
              onSubmit={handleSave}
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleFormChange}
                  />
                  <span style={{ fontWeight: 600 }}>Status</span>
                  <span style={{ color: "#374151" }}>{form.is_active ? "Yes" : "No"}</span>
                </label>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontWeight: 600 }}>
                  Domain Name <span style={{ color: "#e11d48" }}>*</span>
                </span>
                <input
                  name="domain_name"
                  placeholder="example.com"
                  value={form.domain_name}
                  onChange={handleFormChange}
                  required
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                  }}
                />
              </label>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

const headerCellStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px",
  fontWeight: 700,
  borderBottom: "1px solid #e5e7eb",
}

const cellStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "middle",
}

export const config = defineRouteConfig({})

export default RedingtonDomainsPage
