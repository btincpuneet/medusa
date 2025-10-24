import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

type AddBccEntry = {
  id: number
  domain_id: number | null
  domain_name: string | null
  bcc_emails: string[]
  created_at: string
  updated_at: string
}

type AddBccResponse = {
  add_bcc_entries?: AddBccEntry[]
  add_bcc?: AddBccEntry
  message?: string
}

type DomainOption = {
  id: number
  domain_name: string
}

type DomainsResponse = {
  domains?: DomainOption[]
}

const initialForm = {
  domain_id: "",
  bcc_emails: "",
}

const RedingtonAddBccPage: React.FC = () => {
  const [entries, setEntries] = useState<AddBccEntry[]>([])
  const [domains, setDomains] = useState<DomainOption[]>([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }, [entries])

  const loadEntries = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/admin/redington/add-bcc", {
        credentials: "include",
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as AddBccResponse
        throw new Error(
          body?.message || `Failed to load BCC entries (${response.status})`
        )
      }

      const body = (await response.json()) as AddBccResponse
      setEntries(body.add_bcc_entries ?? [])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load BCC entries."
      setError(message)
      setEntries([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadDomains = useCallback(async () => {
    try {
      const response = await fetch("/admin/redington/domains", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to load domains (${response.status})`)
      }

      const body = (await response.json()) as DomainsResponse
      setDomains(body.domains ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load domains."
      setError(message)
      setDomains([])
    }
  }, [])

  useEffect(() => {
    void loadEntries()
    void loadDomains()
  }, [loadEntries, loadDomains])

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
    setStatus(null)
    setError(null)
  }

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const domainIdRaw = form.domain_id.trim()
    if (!domainIdRaw) {
      setError("Please select a domain.")
      return
    }

    const domainId = Number.parseInt(domainIdRaw, 10)
    if (!Number.isFinite(domainId)) {
      setError("Domain selection is invalid.")
      return
    }

    const emails = form.bcc_emails
      .split(/[\n,]+/)
      .map((entry) => entry.trim())
      .filter(Boolean)

    if (!emails.length) {
      setError("Enter at least one BCC email.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setStatus(null)

    const payload = {
      domain_id: domainId,
      bcc_emails: emails,
    }

    const isEdit = editingId !== null
    const url = isEdit
      ? `/admin/redington/add-bcc/${editingId}`
      : "/admin/redington/add-bcc"

    try {
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const body = (await response.json().catch(() => ({}))) as AddBccResponse

      if (!response.ok) {
        throw new Error(
          body?.message ||
            (isEdit
              ? "Failed to update BCC entry."
              : "Failed to create BCC entry.")
        )
      }

      setStatus(isEdit ? "BCC entry updated." : "BCC entry created.")
      resetForm()
      await loadEntries()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : isEdit
          ? "Unable to update BCC entry."
          : "Unable to create BCC entry."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (entry: AddBccEntry) => {
    setEditingId(entry.id)
    setForm({
      domain_id: entry.domain_id ? String(entry.domain_id) : "",
      bcc_emails: entry.bcc_emails.join("\n"),
    })
    setStatus(null)
    setError(null)
  }

  const handleDelete = async (entry: AddBccEntry) => {
    if (
      !window.confirm(
        `Delete BCC settings for ${entry.domain_name ?? "this domain"}?`
      )
    ) {
      return
    }

    setError(null)
    setStatus(null)

    try {
      const response = await fetch(`/admin/redington/add-bcc/${entry.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as AddBccResponse
        throw new Error(
          body?.message || `Failed to delete BCC entry (${response.status})`
        )
      }

      if (editingId === entry.id) {
        resetForm()
      }

      setStatus("BCC entry deleted.")
      await loadEntries()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to delete BCC entry."
      setError(message)
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "24px",
      }}
    >
      <header>
        <h1 style={{ marginBottom: "8px" }}>Add BCC Value</h1>
        <p style={{ margin: 0, color: "#555" }}>
          Maintain domain-specific BCC recipients used when emailing Redington customers.
        </p>
      </header>

      <section
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #e5e5e5",
          padding: "24px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          {editingId ? "Edit BCC Entry" : "Create BCC Entry"}
        </h2>

        {error ? (
          <div style={{ marginBottom: "16px", color: "#a80000" }}>{error}</div>
        ) : null}
        {status ? (
          <div style={{ marginBottom: "16px", color: "#0a7f46" }}>{status}</div>
        ) : null}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span>Domain</span>
            <select
              name="domain_id"
              value={form.domain_id}
              onChange={handleChange}
              required
            >
              <option value="">Select a domain</option>
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.domain_name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span>BCC emails (comma or newline separated)</span>
            <textarea
              name="bcc_emails"
              value={form.bcc_emails}
              onChange={handleChange}
              rows={4}
              placeholder="user@example.com, finance@example.com"
            />
          </label>

          <div style={{ display: "flex", gap: "12px" }}>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
            {editingId ? (
              <button type="button" onClick={resetForm}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #e5e5e5",
          padding: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <h2 style={{ margin: 0 }}>Existing Entries</h2>
          {isLoading ? <span>Loading…</span> : null}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={headerCellStyle}>Domain</th>
                <th style={headerCellStyle}>BCC Emails</th>
                <th style={headerCellStyle}>Updated</th>
                <th style={headerCellStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!sortedEntries.length ? (
                <tr>
                  <td style={cellStyle} colSpan={4}>
                    {isLoading ? "Loading entries…" : "No BCC entries yet."}
                  </td>
                </tr>
              ) : (
                sortedEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={cellStyle}>
                      {entry.domain_name ?? `Domain #${entry.domain_id ?? "-"}`}
                    </td>
                    <td style={cellStyle}>
                      {entry.bcc_emails.length
                        ? entry.bcc_emails.join(", ")
                        : "—"}
                    </td>
                    <td style={cellStyle}>{formatDate(entry.updated_at)}</td>
                    <td style={{ ...cellStyle, display: "flex", gap: "8px" }}>
                      <button onClick={() => handleEdit(entry)}>Edit</button>
                      <button
                        onClick={() => handleDelete(entry)}
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
      </section>
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

function formatDate(value?: string | null) {
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

export default RedingtonAddBccPage
