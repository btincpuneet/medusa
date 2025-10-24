import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useCallback, useEffect, useMemo, useState } from "react"

type Domain = {
  id: number
  domain_name: string
  is_active: boolean
  created_at: string
  updated_at: string
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

  const sortedDomains = useMemo(() => {
    return [...domains].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
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

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()

    const domainName = form.domain_name.trim()
    if (!domainName) {
      setError("Domain name is required.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/admin/redington/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          domain_name: domainName,
          is_active: form.is_active,
        }),
      })

      const body = (await response.json().catch(() => ({}))) as DomainsResponse

      if (!response.ok) {
        throw new Error(body?.message || `Failed to create domain (${response.status})`)
      }

      if (body.domain) {
        setDomains((prev) => [body.domain!, ...prev.filter((d) => d.id !== body.domain!.id)])
      } else {
        await loadDomains()
      }

      setForm(initialForm)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create domain."
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

  const handleRename = async (domain: Domain) => {
    const nextName = window.prompt("Enter a new domain name:", domain.domain_name)
    if (!nextName || !nextName.trim() || nextName.trim() === domain.domain_name) {
      return
    }

    setError(null)

    try {
      const response = await fetch(`/admin/redington/domains/${domain.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          domain_name: nextName.trim(),
        }),
      })

      const body = (await response.json().catch(() => ({}))) as DomainsResponse

      if (!response.ok) {
        throw new Error(body?.message || `Failed to rename domain (${response.status})`)
      }

      if (body.domain) {
        setDomains((prev) => prev.map((item) => (item.id === body.domain!.id ? body.domain! : item)))
      } else {
        await loadDomains()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to rename domain."
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

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Redington Domains</h1>
        <button onClick={loadDomains} disabled={isLoading}>
          Refresh
        </button>
      </div>

      <form
        onSubmit={handleCreate}
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(220px, 1fr) minmax(140px, auto) auto",
          gap: "12px",
          alignItems: "end",
          padding: "16px",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          background: "#fafafa",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>Domain Name</span>
          <input
            name="domain_name"
            placeholder="e.g. redington-ksa"
            value={form.domain_name}
            onChange={handleFormChange}
            required
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>Status</span>
          <select name="is_active" value={form.is_active ? "true" : "false"} onChange={handleFormChange}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Create Domain"}
        </button>
      </form>

      {error && (
        <div style={{ background: "#ffe5e5", color: "#a80000", padding: "12px", borderRadius: "8px" }}>
          {error}
        </div>
      )}

      <div style={{ overflowX: "auto", border: "1px solid #e5e5e5", borderRadius: "8px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f9f9f9" }}>
            <tr>
              <th style={headerCellStyle}>Domain</th>
              <th style={headerCellStyle}>Status</th>
              <th style={headerCellStyle}>Created</th>
              <th style={headerCellStyle}>Updated</th>
              <th style={headerCellStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={cellStyle}>
                  Loading domains...
                </td>
              </tr>
            ) : sortedDomains.length === 0 ? (
              <tr>
                <td colSpan={5} style={cellStyle}>
                  No domains found.
                </td>
              </tr>
            ) : (
              sortedDomains.map((domain) => (
                <tr key={domain.id}>
                  <td style={cellStyle}>{domain.domain_name}</td>
                  <td style={cellStyle}>
                    <button onClick={() => handleToggleActive(domain)}>
                      {domain.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td style={cellStyle}>{formatDate(domain.created_at)}</td>
                  <td style={cellStyle}>{formatDate(domain.updated_at)}</td>
                  <td style={{ ...cellStyle, display: "flex", gap: "8px" }}>
                    <button onClick={() => handleRename(domain)}>Rename</button>
                    <button onClick={() => handleDelete(domain)} style={{ color: "#a80000" }}>
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

export default RedingtonDomainsPage
