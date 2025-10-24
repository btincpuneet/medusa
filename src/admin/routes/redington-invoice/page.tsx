import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useEffect, useMemo, useState } from "react"

type DomainOption = {
  id: number
  domain_name: string
}

type InvoiceResponse = {
  success: boolean
  message?: string
  invoice_number?: string
  invoice_date?: string
  pdf?: string
  bcc?: string[]
}

const initialForm = {
  salesOrder: "",
  companyCode: "",
  domainId: "",
  accessId: "",
}

const InvoiceLookupPage: React.FC = () => {
  const [form, setForm] = useState(initialForm)
  const [domains, setDomains] = useState<DomainOption[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingDomains, setIsLoadingDomains] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<InvoiceResponse | null>(null)

  useEffect(() => {
    const loadDomains = async () => {
      setIsLoadingDomains(true)
      try {
        const response = await fetch("/admin/redington/domains", {
          credentials: "include",
        })
        const body = await response.json().catch(() => ({}))
        setDomains(body.domains ?? [])
      } catch (err) {
        console.warn("Failed to load domains", err)
      } finally {
        setIsLoadingDomains(false)
      }
    }

    loadDomains()
  }, [])

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setForm(initialForm)
    setResult(null)
    setStatus(null)
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setStatus(null)
    setResult(null)

    if (!form.salesOrder.trim()) {
      setError("Sales order number is required.")
      return
    }

    setIsSubmitting(true)

    const payload: Record<string, unknown> = {
      sales_order: form.salesOrder.trim(),
    }

    if (form.companyCode.trim()) {
      payload.company_code = form.companyCode.trim()
    }

    if (form.domainId.trim()) {
      payload.domain_id = Number(form.domainId)
    }

    if (form.accessId.trim()) {
      payload.access_id = Number(form.accessId)
    }

    try {
      const response = await fetch("/rest/V1/b2cgetinvoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const body = (await response.json().catch(() => ({}))) as InvoiceResponse

      if (!response.ok || !body.success) {
        setResult(body)
        const message =
          body?.message || `Failed to fetch invoice (${response.status}).`
        setError(message)
        return
      }

      setResult(body)
      setStatus("Invoice retrieved successfully.")
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unexpected error while fetching invoice."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const pdfDownloadUrl = useMemo(() => {
    if (!result?.pdf || typeof result.pdf !== "string") {
      return null
    }
    try {
      const base64 = result.pdf.replace(/^data:application\/pdf;base64,/, "")
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
      const blob = new Blob([bytes], { type: "application/pdf" })
      return URL.createObjectURL(blob)
    } catch (err) {
      console.warn("Invalid PDF payload", err)
      return null
    }
  }, [result?.pdf])

  useEffect(() => {
    return () => {
      if (pdfDownloadUrl) {
        URL.revokeObjectURL(pdfDownloadUrl)
      }
    }
  }, [pdfDownloadUrl])

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
        <h1 style={{ marginBottom: 8 }}>Invoice Lookup</h1>
        <p style={{ margin: 0, color: "#475569" }}>
          Query SAP for invoice metadata/PDF and review associated BCC
          recipients.
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
          <div style={{ color: "#b91c1c", marginBottom: 16 }}>{error}</div>
        ) : null}
        {status ? (
          <div style={{ color: "#0f766e", marginBottom: 16 }}>{status}</div>
        ) : null}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span>Sales Order *</span>
            <input
              type="text"
              name="salesOrder"
              value={form.salesOrder}
              onChange={handleChange}
              required
              placeholder="Enter SAP sales order number"
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span>Company Code</span>
            <input
              type="text"
              name="companyCode"
              value={form.companyCode}
              onChange={handleChange}
              placeholder="Defaults to configured SAP customer number"
            />
          </label>

          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span>Domain</span>
              <select
                name="domainId"
                value={form.domainId}
                onChange={handleChange}
              >
                <option value="">(optional) Select domain</option>
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.domain_name}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span>Access ID</span>
              <input
                type="text"
                name="accessId"
                value={form.accessId}
                onChange={handleChange}
                placeholder="Optional access mapping ID"
              />
            </label>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Fetching…" : "Fetch Invoice"}
            </button>
            <button type="button" onClick={resetForm} disabled={isSubmitting}>
              Reset
            </button>
            {isLoadingDomains ? <span>Loading domains…</span> : null}
          </div>
        </form>
      </section>

      {result ? (
        <section
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            padding: 24,
            display: "grid",
            gap: 16,
            maxWidth: 720,
          }}
        >
          <header>
            <h2 style={{ margin: 0 }}>Invoice Result</h2>
            {result.message ? (
              <p style={{ margin: "8px 0 0 0", color: "#475569" }}>
                {result.message}
              </p>
            ) : null}
          </header>

          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr",
              gap: 8,
          }}
          >
            <dt style={{ fontWeight: 600 }}>Invoice #</dt>
            <dd style={{ margin: 0 }}>{result.invoice_number ?? "—"}</dd>

            <dt style={{ fontWeight: 600 }}>Invoice Date</dt>
            <dd style={{ margin: 0 }}>{result.invoice_date ?? "—"}</dd>

            <dt style={{ fontWeight: 600 }}>BCC</dt>
            <dd style={{ margin: 0 }}>
              {Array.isArray(result.bcc) && result.bcc.length ? (
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {result.bcc.map((email) => (
                    <li key={email}>{email}</li>
                  ))}
                </ul>
              ) : (
                "—"
              )}
            </dd>
          </dl>

          {pdfDownloadUrl ? (
            <a
              href={pdfDownloadUrl}
              download={`invoice-${result.invoice_number ?? form.salesOrder}.pdf`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #1d4ed8",
                color: "#1d4ed8",
                textDecoration: "none",
                fontWeight: 600,
                width: "fit-content",
              }}
            >
              Download PDF
            </a>
          ) : (
            <p style={{ margin: 0, color: "#9ca3af" }}>
              PDF content not available.
            </p>
          )}
        </section>
      ) : null}
    </div>
  )
}

export const config = defineRouteConfig({})

export default InvoiceLookupPage
