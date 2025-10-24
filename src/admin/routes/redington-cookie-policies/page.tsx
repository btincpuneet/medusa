import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

type CookiePolicy = {
  id: number
  document_url: string | null
  status: string | null
  created_at: string
  updated_at: string
}

type CookiePolicyResponse = {
  cookie_policies?: CookiePolicy[]
  cookie_policy?: CookiePolicy
  message?: string
}

const initialForm = {
  document_url: "",
  status: "",
}

const RedingtonCookiePoliciesPage: React.FC = () => {
  const [policies, setPolicies] = useState<CookiePolicy[]>([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const sortedPolicies = useMemo(() => {
    return [...policies].sort((a, b) => {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }, [policies])

  const loadPolicies = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/admin/redington/cookie-policies", {
        credentials: "include",
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as CookiePolicyResponse
        throw new Error(
          body?.message || `Failed to load cookie policies (${response.status})`
        )
      }

      const body = (await response.json()) as CookiePolicyResponse
      setPolicies(body.cookie_policies ?? [])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load cookie policies."
      setError(message)
      setPolicies([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPolicies()
  }, [loadPolicies])

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
    setStatus(null)
    setError(null)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const payload = {
      document_url: form.document_url.trim() || null,
      status: form.status.trim() || null,
    }

    setIsSubmitting(true)
    setError(null)
    setStatus(null)

    const isEdit = editingId !== null
    const url = isEdit
      ? `/admin/redington/cookie-policies/${editingId}`
      : "/admin/redington/cookie-policies"

    try {
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const body = (await response.json().catch(() => ({}))) as CookiePolicyResponse

      if (!response.ok) {
        throw new Error(
          body?.message ||
            (isEdit
              ? "Failed to update cookie policy."
              : "Failed to create cookie policy.")
        )
      }

      setStatus(isEdit ? "Cookie policy updated." : "Cookie policy created.")
      resetForm()
      await loadPolicies()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : isEdit
          ? "Unable to update cookie policy."
          : "Unable to create cookie policy."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (policy: CookiePolicy) => {
    setEditingId(policy.id)
    setForm({
      document_url: policy.document_url ?? "",
      status: policy.status ?? "",
    })
    setStatus(null)
    setError(null)
  }

  const handleDelete = async (policy: CookiePolicy) => {
    if (
      !window.confirm(
        "Delete this cookie policy record? This cannot be undone."
      )
    ) {
      return
    }

    setError(null)
    setStatus(null)

    try {
      const response = await fetch(`/admin/redington/cookie-policies/${policy.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as CookiePolicyResponse
        throw new Error(
          body?.message || `Failed to delete cookie policy (${response.status})`
        )
      }

      if (editingId === policy.id) {
        resetForm()
      }

      setStatus("Cookie policy deleted.")
      await loadPolicies()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to delete cookie policy."
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
        <h1 style={{ marginBottom: "8px" }}>Cookie Policies</h1>
        <p style={{ margin: 0, color: "#555" }}>
          Track policy documents and publication status synced from Magento.
        </p>
      </header>

      <section
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #e5e5e5",
          padding: "24px",
          maxWidth: "520px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          {editingId ? "Edit Policy" : "Create Policy"}
        </h2>

        {error ? (
          <div style={{ marginBottom: "16px", color: "#a80000" }}>{error}</div>
        ) : null}
        {status ? (
          <div style={{ marginBottom: "16px", color: "#0a7f46" }}>{status}</div>
        ) : null}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span>Document URL</span>
            <input
              name="document_url"
              value={form.document_url}
              onChange={handleChange}
              placeholder="https://example.com/cookie-policy.pdf"
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span>Status</span>
            <input
              name="status"
              value={form.status}
              onChange={handleChange}
              placeholder="e.g. Published"
            />
          </label>

          <div style={{ display: "flex", gap: "12px" }}>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : editingId ? "Update Policy" : "Create Policy"}
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
          <h2 style={{ margin: 0 }}>Existing Policies</h2>
          {isLoading ? <span>Loading…</span> : null}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={headerCellStyle}>Document URL</th>
                <th style={headerCellStyle}>Status</th>
                <th style={headerCellStyle}>Updated</th>
                <th style={headerCellStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!sortedPolicies.length ? (
                <tr>
                  <td style={cellStyle} colSpan={4}>
                    {isLoading ? "Loading policies…" : "No cookie policy records yet."}
                  </td>
                </tr>
              ) : (
                sortedPolicies.map((policy) => (
                  <tr key={policy.id}>
                    <td style={cellStyle}>
                      {policy.document_url ? (
                        <a href={policy.document_url} target="_blank" rel="noreferrer">
                          {policy.document_url}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={cellStyle}>{policy.status ?? "—"}</td>
                    <td style={cellStyle}>{formatDate(policy.updated_at)}</td>
                    <td style={{ ...cellStyle, display: "flex", gap: "8px" }}>
                      <button onClick={() => handleEdit(policy)}>Edit</button>
                      <button
                        onClick={() => handleDelete(policy)}
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

export default RedingtonCookiePoliciesPage
