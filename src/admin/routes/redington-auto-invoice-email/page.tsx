import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useEffect, useMemo, useState } from "react"

type EmailTemplate = {
  id: number
  template_code: string
  template_subject: string | null
  template_text: string
  template_style: string | null
  template_type: number
  sender_name: string | null
  sender_email: string | null
  orig_template_code: string | null
  orig_template_variables: Record<string, unknown> | null
  is_system: boolean
  created_at: string | null
  updated_at: string
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 24,
  padding: 32,
}

const panelStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  background: "#fff",
  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
  padding: 24,
}

const buttonStyle: React.CSSProperties = {
  border: "1px solid #1d4ed8",
  background: "#2563eb",
  color: "#fff",
  borderRadius: 8,
  padding: "8px 14px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13,
}

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  background: "#f3f4f6",
  color: "#111827",
  borderRadius: 8,
  padding: "8px 14px",
  cursor: "pointer",
  fontWeight: 500,
  fontSize: 13,
}

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 240,
  borderRadius: 8,
  border: "1px solid #d1d5db",
  padding: 12,
  fontFamily: "monospace",
  background: "#f9fafb",
  whiteSpace: "pre-wrap",
}

const AutoInvoiceEmailPage: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetch("/admin/redington/auto-invoice-email/templates", {
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load templates (${response.status})`)
        }
        const body = await response.json()
        if (!mounted) {
          return
        }
        setTemplates(Array.isArray(body.templates) ? body.templates : [])
        setError(null)
      })
      .catch((err) => {
        if (!mounted) {
          return
        }
        setError(err instanceof Error ? err.message : "Unable to load email templates")
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  const sortedTemplates = useMemo(() => {
    return templates.slice().sort((a, b) => a.template_code.localeCompare(b.template_code))
  }, [templates])

  return (
    <div style={containerStyle}>
      <header>
        <h1 style={{ margin: 0 }}>Auto Invoice Email Templates</h1>
        <p style={{ margin: "12px 0 0 0", color: "#475569", lineHeight: 1.6 }}>
          These templates were imported from Magento’s <code>email_template</code> table
          and power automated invoice notifications. Review the content below and edit as needed.
        </p>
      </header>

      <section style={panelStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0 }}>Templates</h2>
            <p style={{ margin: "4px 0 0 0", color: "#64748b" }}>
              {loading ? "Loading templates…" : `${sortedTemplates.length} template(s) available.`}
            </p>
          </div>
          <button
            style={secondaryButtonStyle}
            disabled={loading}
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>

        {error ? (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid #fca5a5",
              background: "#fee2e2",
              color: "#b91c1c",
            }}
          >
            {error}
          </div>
        ) : null}

        {sortedTemplates.length === 0 && !loading ? (
          <p style={{ color: "#6b7280" }}>No templates found. Run the migration to import Magento email templates.</p>
        ) : null}

        {sortedTemplates.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Code</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Subject</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>System</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Updated</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTemplates.map((template) => (
                  <tr key={template.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 500 }}>{template.template_code}</td>
                    <td style={{ padding: "10px 12px" }}>{template.template_subject ?? "—"}</td>
                    <td style={{ padding: "10px 12px" }}>{template.is_system ? "Yes" : "No"}</td>
                    <td style={{ padding: "10px 12px", color: "#64748b" }}>
                      {new Date(template.updated_at).toLocaleString()}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <button
                        style={buttonStyle}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {selectedTemplate ? (
        <section style={panelStyle}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0 }}>{selectedTemplate.template_code}</h2>
              <p style={{ margin: "4px 0 0 0", color: "#64748b" }}>
                Last updated {new Date(selectedTemplate.updated_at).toLocaleString()}
              </p>
            </div>
            <button style={secondaryButtonStyle} onClick={() => setSelectedTemplate(null)}>
              Close
            </button>
          </header>

          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <strong>Subject:</strong> {selectedTemplate.template_subject ?? "—"}
            </div>
            <div>
              <strong>Sender:</strong> {selectedTemplate.sender_name ?? "—"}
              {selectedTemplate.sender_email ? ` <${selectedTemplate.sender_email}>` : ""}
            </div>
            <div>
              <strong>Original Template Code:</strong> {selectedTemplate.orig_template_code ?? "—"}
            </div>
            {selectedTemplate.orig_template_variables ? (
              <div>
                <strong>Original Variables:</strong>
                <pre
                  style={{
                    marginTop: 4,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    padding: 12,
                    background: "#f8fafc",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {JSON.stringify(selectedTemplate.orig_template_variables, null, 2)}
                </pre>
              </div>
            ) : null}
            <div>
              <strong>Template Body:</strong>
              <textarea
                readOnly
                value={selectedTemplate.template_text}
                style={textareaStyle}
              />
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}

export const config = defineRouteConfig({})

export default AutoInvoiceEmailPage
