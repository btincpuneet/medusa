import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom";

type DomainExtention = {
  id: number
  domain_extention_name: string
  status: boolean
  created_at: string
  updated_at: string
}

type DomainExtentionResponse = {
  domain_extentions?: DomainExtention[]
  domain_extention?: DomainExtention
  message?: string
}

const initialForm = {
  domain_extention_name: "",
  status: true,
}

const RedingtonCustomPage: React.FC = () => {
  const [domainExtentions, setDomainExtentions] = useState<DomainExtention[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sortedExtentions = useMemo(() => {
    return [...domainExtentions].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [domainExtentions])

  const loadExtentions = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/admin/redington/domain-extensions", {
        credentials: "include",
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as DomainExtentionResponse
        throw new Error(body?.message || `Failed to load domain extentions (${response.status})`)
      }

      const body = (await response.json()) as DomainExtentionResponse
      setDomainExtentions(body.domain_extentions ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load domain extentions."
      setError(message)
      setDomainExtentions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadExtentions()
  }, [loadExtentions])

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

    const parsedValue =
      target.value === "true"
        ? true
        : target.value === "false"
        ? false
        : target.value

    setForm((prev) => ({
      ...prev,
      [target.name]: parsedValue,
    }))
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()

    const extentionName = String(form.domain_extention_name || "").trim()
    if (!extentionName) {
      setError("Domain extention name is required.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/admin/redington/domain-extensions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          domain_extention_name: extentionName,
          status: form.status,
        }),
      })

      const body = (await response.json().catch(() => ({}))) as DomainExtentionResponse

      if (!response.ok) {
        throw new Error(body?.message || `Failed to create domain extention (${response.status})`)
      }

      if (body.domain_extention) {
        setDomainExtentions((prev) => [
          body.domain_extention!,
          ...prev.filter((item) => item.id !== body.domain_extention!.id),
        ])
      } else {
        await loadExtentions()
      }

      setForm(initialForm)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create domain extention."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (record: DomainExtention) => {
    setError(null)

    try {
      const response = await fetch(`/admin/redington/domain-extensions/${record.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: !record.status,
        }),
      })

      const body = (await response.json().catch(() => ({}))) as DomainExtentionResponse

      if (!response.ok) {
        throw new Error(body?.message || `Failed to update domain extention (${response.status})`)
      }

      if (body.domain_extention) {
        setDomainExtentions((prev) =>
          prev.map((item) => (item.id === body.domain_extention!.id ? body.domain_extention! : item))
        )
      } else {
        await loadExtentions()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to change domain extention status."
      setError(message)
    }
  }

  const handleRename = async (record: DomainExtention) => {
    const nextName = window.prompt("Enter a new domain extention (e.g. .com):", record.domain_extention_name)
    if (!nextName || !nextName.trim() || nextName.trim() === record.domain_extention_name) {
      return
    }

    setError(null)

    try {
      const response = await fetch(`/admin/redington/domain-extensions/${record.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          domain_extention_name: nextName.trim(),
        }),
      })

      const body = (await response.json().catch(() => ({}))) as DomainExtentionResponse

      if (!response.ok) {
        throw new Error(body?.message || `Failed to rename domain extention (${response.status})`)
      }

      if (body.domain_extention) {
        setDomainExtentions((prev) =>
          prev.map((item) => (item.id === body.domain_extention!.id ? body.domain_extention! : item))
        )
      } else {
        await loadExtentions()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to rename domain extention."
      setError(message)
    }
  }

  const handleDelete = async (record: DomainExtention) => {
    if (
      !window.confirm(
        `Delete domain extention "${record.domain_extention_name}"? This action cannot be undone.`
      )
    ) {
      return
    }

    setError(null)

    try {
      const response = await fetch(`/admin/redington/domain-extensions/${record.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok && response.status !== 204) {
        const body = (await response.json().catch(() => ({}))) as DomainExtentionResponse
        throw new Error(body?.message || `Failed to delete domain extention (${response.status})`)
      }

      setDomainExtentions((prev) => prev.filter((item) => item.id !== record.id))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete domain extention."
      setError(message)
    }
  }

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Domain Extensions</h1>
        <div style={{display:"flex", gap:"20px"}}>
        <button onClick={loadExtentions} disabled={isLoading}>
          Refresh
        </button>
        <Link to="/redington">
        Back
        </Link>
        </div>

        
        
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
          <span>Domain Extension</span>
          <input
            name="domain_extention_name"
            placeholder=".com"
            value={form.domain_extention_name}
            onChange={handleFormChange}
            required
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>Status</span>
          <select name="status" value={form.status ? "true" : "false"} onChange={handleFormChange}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Create Extension"}
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
              <th style={headerCellStyle}>Extension</th>
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
                  Loading domain extensions...
                </td>
              </tr>
            ) : sortedExtentions.length === 0 ? (
              <tr>
                <td colSpan={5} style={cellStyle}>
                  No domain extensions found.
                </td>
              </tr>
            ) : (
              sortedExtentions.map((record) => (
                <tr key={record.id}>
                  <td style={cellStyle}>{record.domain_extention_name}</td>
                  <td style={cellStyle}>
                    <button onClick={() => handleToggleStatus(record)}>
                      {record.status ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td style={cellStyle}>{formatDate(record.created_at)}</td>
                  <td style={cellStyle}>{formatDate(record.updated_at)}</td>
                  <td style={{ ...cellStyle, display: "flex", gap: "8px" }}>
                    <button onClick={() => handleRename(record)}>Rename</button>
                    <button onClick={() => handleDelete(record)} style={{ color: "#a80000" }}>
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

export default RedingtonCustomPage
