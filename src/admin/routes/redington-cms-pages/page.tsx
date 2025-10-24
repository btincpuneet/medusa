import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

type CmsPage = {
  id: number
  slug: string
  title: string
  content: string
  country_code: string | null
  domain_id: number | null
  access_id: string | null
  is_active: boolean
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

type CmsPageResponse = {
  cms_pages?: CmsPage[]
  cms_page?: CmsPage
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
  slug: "",
  title: "",
  content: "",
  country_code: "",
  domain_id: "",
  access_id: "",
  is_active: "true",
  metadata: "",
}

const RedingtonCmsPagesPage: React.FC = () => {
  const [pages, setPages] = useState<CmsPage[]>([])
  const [domains, setDomains] = useState<DomainOption[]>([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const domainLabel = useCallback(
    (domainId: number | null) => {
      if (domainId === null || domainId === undefined) {
        return "All domains"
      }
      const match = domains.find((domain) => domain.id === domainId)
      return match ? match.domain_name : `Domain #${domainId}`
    },
    [domains]
  )

  const sortedPages = useMemo(() => {
    return [...pages].sort((a, b) => {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }, [pages])

  const loadPages = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/admin/redington/cms-pages", {
        credentials: "include",
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as CmsPageResponse
        throw new Error(
          body?.message || `Failed to load CMS pages (${response.status})`
        )
      }

      const body = (await response.json()) as CmsPageResponse
      setPages(body.cms_pages ?? [])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load CMS pages."
      setError(message)
      setPages([])
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
    void loadPages()
    void loadDomains()
  }, [loadPages, loadDomains])

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
    setError(null)
    setStatus(null)
  }

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const parseMetadata = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed.length) {
      return {}
    }

    try {
      const parsed = JSON.parse(trimmed)
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
      throw new Error("Metadata must be a JSON object.")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Metadata must be valid JSON."
      throw new Error(message)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const slug = form.slug.trim().toLowerCase()
    const title = form.title.trim()
    const content = form.content.trim()

    if (!slug || !title || !content) {
      setError("Slug, title, and content are required.")
      return
    }

    let metadata: Record<string, unknown>
    try {
      metadata = parseMetadata(form.metadata)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Metadata must be valid JSON.")
      return
    }

    const domainId = form.domain_id.trim()
    const payload = {
      slug,
      title,
      content,
      country_code: form.country_code.trim() || null,
      domain_id: domainId ? Number(domainId) : null,
      access_id: form.access_id.trim() || null,
      is_active: form.is_active === "true",
      metadata,
    }

    if (payload.domain_id !== null && !Number.isFinite(payload.domain_id)) {
      setError("Domain selection is invalid.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setStatus(null)

    const isEdit = editingId !== null
    const url = isEdit
      ? `/admin/redington/cms-pages/${editingId}`
      : "/admin/redington/cms-pages"

    try {
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const body = (await response.json().catch(() => ({}))) as CmsPageResponse

      if (!response.ok) {
        throw new Error(
          body?.message ||
            (isEdit
              ? "Failed to update CMS page."
              : "Failed to create CMS page.")
        )
      }

      setStatus(isEdit ? "CMS page updated." : "CMS page created.")
      resetForm()
      await loadPages()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : isEdit
          ? "Unable to update CMS page."
          : "Unable to create CMS page."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (page: CmsPage) => {
    setEditingId(page.id)
    setForm({
      slug: page.slug,
      title: page.title,
      content: page.content,
      country_code: page.country_code ?? "",
      domain_id: page.domain_id !== null ? String(page.domain_id) : "",
      access_id: page.access_id ?? "",
      is_active: page.is_active ? "true" : "false",
      metadata: JSON.stringify(page.metadata ?? {}, null, 2),
    })
    setError(null)
    setStatus(null)
  }

  const handleDelete = async (page: CmsPage) => {
    if (
      !window.confirm(
        `Delete CMS page "${page.title}" (${page.slug})? This cannot be undone.`
      )
    ) {
      return
    }

    setError(null)
    setStatus(null)

    try {
      const response = await fetch(`/admin/redington/cms-pages/${page.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as CmsPageResponse
        throw new Error(
          body?.message || `Failed to delete CMS page (${response.status})`
        )
      }

      if (editingId === page.id) {
        resetForm()
      }

      setStatus("CMS page deleted.")
      await loadPages()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to delete CMS page."
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
        <h1 style={{ marginBottom: "8px" }}>CMS Pages</h1>
        <p style={{ margin: 0, color: "#555" }}>
          Manage Redington-specific CMS content mirrored from Magento.
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
        <h2 style={{ marginTop: 0 }}>{editingId ? "Edit CMS Page" : "Create CMS Page"}</h2>

        {error ? (
          <div style={{ marginBottom: "16px", color: "#a80000" }}>{error}</div>
        ) : null}
        {status ? (
          <div style={{ marginBottom: "16px", color: "#0a7f46" }}>{status}</div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: "16px",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span>Slug</span>
              <input
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="unique-identifier"
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span>Title</span>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Landing page title"
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span>Country Code</span>
              <input
                name="country_code"
                value={form.country_code}
                onChange={handleChange}
                placeholder="Optional"
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span>Access ID</span>
              <input
                name="access_id"
                value={form.access_id}
                onChange={handleChange}
                placeholder="Optional access identifier"
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span>Domain</span>
              <select
                name="domain_id"
                value={form.domain_id}
                onChange={handleChange}
              >
                <option value="">All domains</option>
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.domain_name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span>Status</span>
              <select
                name="is_active"
                value={form.is_active}
                onChange={handleChange}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span>Content</span>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              rows={8}
              placeholder="HTML content mirrored from Magento"
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span>Metadata (JSON object)</span>
            <textarea
              name="metadata"
              value={form.metadata}
              onChange={handleChange}
              rows={6}
              placeholder='{"key": "value"}'
            />
          </label>

          <div style={{ display: "flex", gap: "12px" }}>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : editingId ? "Update Page" : "Create Page"}
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
          <h2 style={{ margin: 0 }}>Existing Pages</h2>
          {isLoading ? <span>Loading…</span> : null}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={headerCellStyle}>Title</th>
                <th style={headerCellStyle}>Slug</th>
                <th style={headerCellStyle}>Domain</th>
                <th style={headerCellStyle}>Access ID</th>
                <th style={headerCellStyle}>Status</th>
                <th style={headerCellStyle}>Updated</th>
                <th style={headerCellStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!sortedPages.length ? (
                <tr>
                  <td style={cellStyle} colSpan={7}>
                    {isLoading ? "Loading pages…" : "No CMS pages yet."}
                  </td>
                </tr>
              ) : (
                sortedPages.map((page) => (
                  <tr key={page.id}>
                    <td style={cellStyle}>{page.title}</td>
                    <td style={cellStyle}>{page.slug}</td>
                    <td style={cellStyle}>{domainLabel(page.domain_id)}</td>
                    <td style={cellStyle}>{page.access_id ?? "—"}</td>
                    <td style={cellStyle}>{page.is_active ? "Active" : "Inactive"}</td>
                    <td style={cellStyle}>{formatDate(page.updated_at)}</td>
                    <td style={{ ...cellStyle, display: "flex", gap: "8px" }}>
                      <button onClick={() => handleEdit(page)}>Edit</button>
                      <button
                        onClick={() => handleDelete(page)}
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

export default RedingtonCmsPagesPage
