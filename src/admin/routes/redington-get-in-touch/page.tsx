import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useCallback, useEffect, useMemo, useState } from "react"

type GetInTouchEntry = {
  id: number
  name: string
  email: string
  mobile_number: string
  company_name: string | null
  enquiry_type: string | null
  enquiry_details: string | null
  created_at: string
  updated_at: string
}

type GetInTouchResponse = {
  enquiries?: GetInTouchEntry[]
  message?: string
}

const RedingtonGetInTouchPage: React.FC = () => {
  const [entries, setEntries] = useState<GetInTouchEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [entries])

  const loadEntries = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/admin/redington/get-in-touch", {
        credentials: "include",
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as GetInTouchResponse
        throw new Error(
          body?.message || `Failed to load enquiries (${response.status})`
        )
      }

      const body = (await response.json()) as GetInTouchResponse
      setEntries(body.enquiries ?? [])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load enquiries."
      setError(message)
      setEntries([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadEntries()
  }, [loadEntries])

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
        <h1 style={{ marginBottom: "8px" }}>Get In Touch</h1>
        <p style={{ margin: 0, color: "#555" }}>
          Review leads captured via the storefront contact form.
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <h2 style={{ margin: 0 }}>Recent enquiries</h2>
          {isLoading ? <span>Loading…</span> : null}
        </div>

        {error ? (
          <div style={{ marginBottom: "16px", color: "#a80000" }}>{error}</div>
        ) : null}

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={headerCellStyle}>Name</th>
                <th style={headerCellStyle}>Email</th>
                <th style={headerCellStyle}>Mobile</th>
                <th style={headerCellStyle}>Company</th>
                <th style={headerCellStyle}>Type</th>
                <th style={headerCellStyle}>Details</th>
                <th style={headerCellStyle}>Created</th>
              </tr>
            </thead>
            <tbody>
              {!sortedEntries.length ? (
                <tr>
                  <td style={cellStyle} colSpan={7}>
                    {isLoading ? "Loading enquiries…" : "No enquiries yet."}
                  </td>
                </tr>
              ) : (
                sortedEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={cellStyle}>{entry.name}</td>
                    <td style={cellStyle}>
                      <a href={`mailto:${entry.email}`}>{entry.email}</a>
                    </td>
                    <td style={cellStyle}>{entry.mobile_number}</td>
                    <td style={cellStyle}>{entry.company_name ?? "—"}</td>
                    <td style={cellStyle}>{entry.enquiry_type ?? "—"}</td>
                    <td style={cellStyle}>
                      {entry.enquiry_details ? (
                        <span style={{ whiteSpace: "pre-wrap" }}>
                          {entry.enquiry_details}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={cellStyle}>{formatDate(entry.created_at)}</td>
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
  verticalAlign: "top",
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

export default RedingtonGetInTouchPage
