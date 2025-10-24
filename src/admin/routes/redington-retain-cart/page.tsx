import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useEffect, useMemo, useState } from "react"

type DomainOption = {
  id: number
  domain_name: string
}

type RetainCartConfig = {
  id: number
  domain_id: number | null
  domain_name?: string | null
  retry_time: string
  add_bcc: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

type RetainCartResponse = {
  retain_cart_configs?: RetainCartConfig[]
}

const initialForm = {
  domain_id: "",
  retry_time: "02:00:00",
  add_bcc: "",
  is_active: true,
}

const RedingtonRetainCartPage: React.FC = () => {
  const [domains, setDomains] = useState<DomainOption[]>([])
  const [configs, setConfigs] = useState<RetainCartConfig[]>([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadDomains = async () => {
    try {
      const response = await fetch("/admin/redington/domains", {
        credentials: "include",
      })
      const body = await response.json().catch(() => ({}))
      setDomains(body.domains ?? [])
    } catch (err) {
      console.warn("Failed to load domains", err)
    }
  }

  const loadConfigs = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/admin/redington/retain-cart", {
        credentials: "include",
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as Record<string, any>
        throw new Error(body?.message || `Failed to load configs (${response.status})`)
      }
      const body = (await response.json()) as RetainCartResponse
      setConfigs(body.retain_cart_configs ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load retain cart settings"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDomains()
    void loadConfigs()
  }, [])

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = event.target
    const isCheckbox = target instanceof HTMLInputElement && target.type === "checkbox"
    setForm((prev) => ({
      ...prev,
      [target.name]: isCheckbox ? target.checked : target.value,
    }))
  }

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
    setStatus(null)
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setStatus(null)
    setError(null)

    try {
      const payload = {
        domain_id: form.domain_id ? Number(form.domain_id) : null,
        retry_time: form.retry_time.trim() || "02:00:00",
        add_bcc: form.add_bcc,
        is_active: form.is_active,
      }

      const url = editingId
        ? `/admin/redington/retain-cart/${editingId}`
        : "/admin/redington/retain-cart"
      const method = editingId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as Record<string, any>
        throw new Error(body?.message || `Failed to save config (${response.status})`)
      }

      setStatus("Retain cart configuration saved.")
      await loadConfigs()
      if (!editingId) {
        resetForm()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save configuration"
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (config: RetainCartConfig) => {
    setEditingId(config.id)
    setForm({
      domain_id: config.domain_id ? String(config.domain_id) : "",
      retry_time: config.retry_time,
      add_bcc: config.add_bcc.join(", "),
      is_active: config.is_active,
    })
    setStatus(null)
    setError(null)
  }

  const handleDelete = async (config: RetainCartConfig) => {
    if (!window.confirm("Delete this retain cart configuration?")) {
      return
    }

    setError(null)
    setStatus(null)

    try {
      const response = await fetch(`/admin/redington/retain-cart/${config.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as Record<string, any>
        throw new Error(body?.message || `Failed to delete entry (${response.status})`)
      }

      if (editingId === config.id) {
        resetForm()
      }

      setStatus("Retain cart configuration deleted.")
      await loadConfigs()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete configuration"
      setError(message)
    }
  }

  const sortedConfigs = useMemo(() => {
    return [...configs].sort((a, b) => a.id - b.id)
  }, [configs])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        padding: 24,
      }}
    >
      <header>
        <h1 style={{ marginBottom: 8 }}>Retain Cart Retry Settings</h1>
        <p style={{ margin: 0, color: "#475569" }}>
          Configure retry timers and BCC recipients for payment failure follow-up emails.
        </p>
      </header>

      <section
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          padding: 24,
          maxWidth: 720,
        }}
      >
        {error ? (
          <div style={{ marginBottom: 16, color: "#b91c1c" }}>{error}</div>
        ) : null}
        {status ? (
          <div style={{ marginBottom: 16, color: "#047857" }}>{status}</div>
        ) : null}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span>Domain</span>
            <select
              name="domain_id"
              value={form.domain_id}
              onChange={handleChange}
            >
              <option value="">Global (all domains)</option>
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.domain_name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span>Retry Time (HH:MM:SS)</span>
            <input
              type="text"
              name="retry_time"
              value={form.retry_time}
              onChange={handleChange}
              placeholder="02:00:00"
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span>BCC emails (comma or newline separated)</span>
            <textarea
              name="add_bcc"
              rows={4}
              value={form.add_bcc}
              onChange={handleChange}
              placeholder="ops@example.com, finance@example.com"
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            <span>Enable configuration</span>
          </label>

          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : editingId ? "Update" : "Create"}
            </button>
            {editingId ? (
              <button type="button" onClick={resetForm} disabled={submitting}>
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0 }}>Existing configurations</h2>
          {loading ? <span>Loading…</span> : null}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={headerCellStyle}>Domain</th>
                <th style={headerCellStyle}>Retry Time</th>
                <th style={headerCellStyle}>BCC</th>
                <th style={headerCellStyle}>Active</th>
                <th style={headerCellStyle}>Updated</th>
                <th style={headerCellStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!sortedConfigs.length ? (
                <tr>
                  <td style={cellStyle} colSpan={6}>
                    {loading ? "Loading…" : "No retain cart configurations yet."}
                  </td>
                </tr>
              ) : (
                sortedConfigs.map((config) => (
                  <tr key={config.id}>
                    <td style={cellStyle}>
                      {config.domain_name ||
                        (config.domain_id ? `Domain #${config.domain_id}` : "Global")}
                    </td>
                    <td style={cellStyle}>{config.retry_time}</td>
                    <td style={cellStyle}>
                      {config.add_bcc.length ? config.add_bcc.join(", ") : "—"}
                    </td>
                    <td style={cellStyle}>{config.is_active ? "Yes" : "No"}</td>
                    <td style={cellStyle}>{formatDate(config.updated_at)}</td>
                    <td style={{ ...cellStyle, display: "flex", gap: 8 }}>
                      <button type="button" onClick={() => handleEdit(config)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(config)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

const headerCellStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px",
  fontWeight: 600,
  borderBottom: "1px solid #e2e8f0",
}

const cellStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "middle",
}

function formatDate(value?: string) {
  if (!value) {
    return "—"
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

export default RedingtonRetainCartPage
