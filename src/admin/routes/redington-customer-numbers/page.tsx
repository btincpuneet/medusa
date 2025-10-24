import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

type CustomerNumber = {
  id: number
  company_code: string
  distribution_channel: string
  brand_id: string
  domain_id: number
  customer_number: string
  created_at: string
  updated_at: string
}

type CustomerNumberResponse = {
  customer_numbers?: CustomerNumber[]
  customer_number?: CustomerNumber
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
  company_code: "",
  distribution_channel: "",
  brand_id: "",
  domain_id: "",
  customer_number: "",
}

const RedingtonCustomerNumbersPage: React.FC = () => {
  const [entries, setEntries] = useState<CustomerNumber[]>([])
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

  const domainLabel = useCallback(
    (domainId: number) => {
      const match = domains.find((domain) => domain.id === domainId)
      return match ? match.domain_name : `Domain #${domainId}`
    },
    [domains]
  )

  const loadEntries = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/admin/redington/customer-numbers", {
        credentials: "include",
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as CustomerNumberResponse
        throw new Error(
          body?.message || `Failed to load customer numbers (${response.status})`
        )
      }

      const body = (await response.json()) as CustomerNumberResponse
      setEntries(body.customer_numbers ?? [])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load customer numbers."
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
    setError(null)
    setStatus(null)
  }

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const companyCode = form.company_code.trim()
    const distribution = form.distribution_channel.trim()
    const brandId = form.brand_id.trim()
    const domainIdRaw = form.domain_id.trim()
    const customerNumber = form.customer_number.trim()

    if (!companyCode || !distribution || !brandId || !domainIdRaw || !customerNumber) {
      setError("All fields are required.")
      return
    }

    const domainId = Number.parseInt(domainIdRaw, 10)
    if (!Number.isFinite(domainId)) {
      setError("Domain selection is invalid.")
      return
    }

    const payload = {
      company_code: companyCode,
      distribution_channel: distribution,
      brand_id: brandId,
      domain_id: domainId,
      customer_number: customerNumber,
    }

    setIsSubmitting(true)
    setError(null)
    setStatus(null)

    const isEdit = editingId !== null
    const url = isEdit
      ? `/admin/redington/customer-numbers/${editingId}`
      : "/admin/redington/customer-numbers"

    try {
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const body = (await response.json().catch(() => ({}))) as CustomerNumberResponse

      if (!response.ok) {
        throw new Error(
          body?.message ||
            (isEdit
              ? "Failed to update customer number."
              : "Failed to create customer number.")
        )
      }

      setStatus(isEdit ? "Customer number updated." : "Customer number created.")
      resetForm()
      await loadEntries()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : isEdit
          ? "Unable to update customer number."
          : "Unable to create customer number."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (entry: CustomerNumber) => {
    setEditingId(entry.id)
    setForm({
      company_code: entry.company_code,
      distribution_channel: entry.distribution_channel,
      brand_id: entry.brand_id,
      domain_id: String(entry.domain_id),
      customer_number: entry.customer_number,
    })
    setStatus(null)
    setError(null)
  }

  const handleDelete = async (entry: CustomerNumber) => {
    if (
      !window.confirm(
        `Delete customer number ${entry.customer_number} for ${domainLabel(entry.domain_id)}?`
      )
    ) {
      return
    }

    setError(null)
    setStatus(null)

    try {
      const response = await fetch(
        `/admin/redington/customer-numbers/${entry.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      )

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as CustomerNumberResponse
        throw new Error(
          body?.message || `Failed to delete customer number (${response.status})`
        )
      }

      if (editingId === entry.id) {
        resetForm()
      }

      setStatus("Customer number deleted.")
      await loadEntries()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to delete customer number."
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
        <h1 style={{ marginBottom: "8px" }}>Customer Numbers</h1>
        <p style={{ margin: 0, color: "#555" }}>
          Maintain SAP customer numbers mapped by domain, company, and channel.
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
          {editingId ? "Edit Customer Number" : "Create Customer Number"}
        </h2>

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
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span>Company Code</span>
            <input
              name="company_code"
              value={form.company_code}
              onChange={handleChange}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span>Distribution Channel</span>
            <input
              name="distribution_channel"
              value={form.distribution_channel}
              onChange={handleChange}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span>Brand ID</span>
            <input
              name="brand_id"
              value={form.brand_id}
              onChange={handleChange}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span>Domain</span>
            <select
              name="domain_id"
              value={form.domain_id}
              onChange={handleChange}
            >
              <option value="">Select domain</option>
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.domain_name}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span>Customer Number</span>
            <input
              name="customer_number"
              value={form.customer_number}
              onChange={handleChange}
            />
          </label>

          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : editingId ? "Update" : "Create"}
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
          <h2 style={{ margin: 0 }}>Existing Assignments</h2>
          {isLoading ? <span>Loading…</span> : null}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={headerCellStyle}>Company</th>
                <th style={headerCellStyle}>Distribution</th>
                <th style={headerCellStyle}>Brand</th>
                <th style={headerCellStyle}>Domain</th>
                <th style={headerCellStyle}>Customer #</th>
                <th style={headerCellStyle}>Updated</th>
                <th style={headerCellStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!sortedEntries.length ? (
                <tr>
                  <td style={cellStyle} colSpan={7}>
                    {isLoading ? "Loading…" : "No customer numbers configured."}
                  </td>
                </tr>
              ) : (
                sortedEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={cellStyle}>{entry.company_code}</td>
                    <td style={cellStyle}>{entry.distribution_channel}</td>
                    <td style={cellStyle}>{entry.brand_id}</td>
                    <td style={cellStyle}>{domainLabel(entry.domain_id)}</td>
                    <td style={cellStyle}>{entry.customer_number}</td>
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

export default RedingtonCustomerNumbersPage
