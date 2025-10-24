import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useCallback, useEffect, useMemo, useState } from "react"

type CurrencyMapping = {
  id: number
  name: string
  company_code: string
  country_name: string
  country_code: string
  currency_code: string
  decimal_place: number
  payment_method: string
  shipment_tracking_url: string
  is_active: boolean
  created_at: string
  updated_at: string
}

type CurrencyMappingResponse = {
  currency_mappings?: CurrencyMapping[]
  currency_mapping?: CurrencyMapping
  message?: string
}

const initialForm = {
  name: "",
  company_code: "",
  country_name: "",
  country_code: "",
  currency_code: "",
  decimal_place: "2",
  payment_method: "",
  shipment_tracking_url: "",
  is_active: "true",
}

const RedingtonCurrencyMappingsPage: React.FC = () => {
  const [mappings, setMappings] = useState<CurrencyMapping[]>([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortedMappings = useMemo(() => {
    return [...mappings].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [mappings])

  const loadMappings = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/admin/redington/currency-mappings", {
        credentials: "include",
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as CurrencyMappingResponse
        throw new Error(body?.message || "Failed to load currency mappings.")
      }

      const body = (await response.json()) as CurrencyMappingResponse
      setMappings(body.currency_mappings ?? [])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load currency mappings."
      setError(message)
      setMappings([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMappings()
  }, [loadMappings])

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
  }

  const handleFormChange = (
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

    if (
      !form.name.trim() ||
      !form.company_code.trim() ||
      !form.country_name.trim() ||
      !form.country_code.trim() ||
      !form.currency_code.trim() ||
      !form.payment_method.trim() ||
      !form.shipment_tracking_url.trim()
    ) {
      setError("All fields are required.")
      return
    }

    const decimalPlace = Number(form.decimal_place)
    if (!Number.isFinite(decimalPlace) || decimalPlace < 0) {
      setError("Decimal place must be a non-negative number.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    const payload = {
      name: form.name.trim(),
      company_code: form.company_code.trim(),
      country_name: form.country_name.trim(),
      country_code: form.country_code.trim().toUpperCase(),
      currency_code: form.currency_code.trim().toUpperCase(),
      decimal_place: decimalPlace,
      payment_method: form.payment_method.trim(),
      shipment_tracking_url: form.shipment_tracking_url.trim(),
      is_active: form.is_active === "true",
    }

    const isEdit = editingId !== null

    try {
      const response = await fetch(
        isEdit
          ? `/admin/redington/currency-mappings/${editingId}`
          : `/admin/redington/currency-mappings`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      )

      const body = (await response.json().catch(() => ({}))) as CurrencyMappingResponse

      if (!response.ok) {
        throw new Error(
          body?.message ||
            (isEdit
              ? "Failed to update currency mapping."
              : "Failed to create currency mapping.")
        )
      }

      resetForm()
      await loadMappings()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : isEdit
          ? "Unable to update currency mapping."
          : "Unable to create currency mapping."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (mapping: CurrencyMapping) => {
    setEditingId(mapping.id)
    setForm({
      name: mapping.name,
      company_code: mapping.company_code,
      country_name: mapping.country_name,
      country_code: mapping.country_code,
      currency_code: mapping.currency_code,
      decimal_place: String(mapping.decimal_place ?? 0),
      payment_method: mapping.payment_method,
      shipment_tracking_url: mapping.shipment_tracking_url,
      is_active: mapping.is_active ? "true" : "false",
    })
    setError(null)
  }

  const handleDelete = async (mapping: CurrencyMapping) => {
    if (
      !window.confirm(
        `Delete mapping for ${mapping.country_code} (${mapping.company_code})? This cannot be undone.`
      )
    ) {
      return
    }

    setError(null)

    try {
      const response = await fetch(`/admin/redington/currency-mappings/${mapping.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok && response.status !== 204) {
        const body = (await response.json().catch(() => ({}))) as CurrencyMappingResponse
        throw new Error(body?.message || "Failed to delete currency mapping.")
      }

      if (editingId === mapping.id) {
        resetForm()
      }

      await loadMappings()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to delete currency mapping."
      setError(message)
    }
  }

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Currency Mapping</h1>
        <button onClick={loadMappings} disabled={isLoading}>
          Refresh
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
          alignItems: "end",
          padding: "16px",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          background: "#fafafa",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>Company Name</span>
          <input
            name="name"
            placeholder="e.g. Redington Gulf"
            value={form.name}
            onChange={handleFormChange}
            required
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>Company Code</span>
          <input
            name="company_code"
            placeholder="e.g. 1000"
            value={form.company_code}
            onChange={handleFormChange}
            required
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>Country Name</span>
          <input
            name="country_name"
            placeholder="e.g. United Arab Emirates"
            value={form.country_name}
            onChange={handleFormChange}
            required
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>Country Code</span>
          <input
            name="country_code"
            placeholder="e.g. AE"
            value={form.country_code}
            onChange={handleFormChange}
            required
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>Currency Code</span>
          <input
            name="currency_code"
            placeholder="e.g. AED"
            value={form.currency_code}
            onChange={handleFormChange}
            required
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>Decimal Place</span>
          <input
            name="decimal_place"
            type="number"
            min="0"
            value={form.decimal_place}
            onChange={handleFormChange}
            required
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>Payment Method Code</span>
          <input
            name="payment_method"
            placeholder="Payment method identifier"
            value={form.payment_method}
            onChange={handleFormChange}
            required
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>Shipment Tracking URL</span>
          <input
            name="shipment_tracking_url"
            placeholder="https://..."
            value={form.shipment_tracking_url}
            onChange={handleFormChange}
            required
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>Status</span>
          <select name="is_active" value={form.is_active} onChange={handleFormChange}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>

        <div style={{ display: "flex", gap: "12px" }}>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : editingId ? "Update Mapping" : "Create Mapping"}
          </button>
          {editingId !== null && (
            <button type="button" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>
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
              <th style={headerCellStyle}>Company</th>
              <th style={headerCellStyle}>Company Code</th>
              <th style={headerCellStyle}>Country</th>
              <th style={headerCellStyle}>Currency</th>
              <th style={headerCellStyle}>Decimal</th>
              <th style={headerCellStyle}>Payment</th>
              <th style={headerCellStyle}>Shipment URL</th>
              <th style={headerCellStyle}>Status</th>
              <th style={headerCellStyle}>Created</th>
              <th style={headerCellStyle}>Updated</th>
              <th style={headerCellStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={11} style={cellStyle}>
                  Loading currency mappings...
                </td>
              </tr>
            ) : sortedMappings.length === 0 ? (
              <tr>
                <td colSpan={11} style={cellStyle}>
                  No currency mappings found.
                </td>
              </tr>
            ) : (
              sortedMappings.map((mapping) => (
                <tr key={mapping.id}>
                  <td style={cellStyle}>{mapping.name}</td>
                  <td style={cellStyle}>{mapping.company_code}</td>
                  <td style={cellStyle}>
                    {mapping.country_name} ({mapping.country_code})
                  </td>
                  <td style={cellStyle}>{mapping.currency_code}</td>
                  <td style={cellStyle}>{mapping.decimal_place}</td>
                  <td style={cellStyle}>{mapping.payment_method}</td>
                  <td style={{ ...cellStyle, maxWidth: "220px", wordBreak: "break-word" }}>
                    {mapping.shipment_tracking_url}
                  </td>
                  <td style={cellStyle}>{mapping.is_active ? "Active" : "Inactive"}</td>
                  <td style={cellStyle}>{formatDate(mapping.created_at)}</td>
                  <td style={cellStyle}>{formatDate(mapping.updated_at)}</td>
                  <td style={{ ...cellStyle, display: "flex", gap: "8px" }}>
                    <button onClick={() => handleEdit(mapping)}>Edit</button>
                    <button onClick={() => handleDelete(mapping)} style={{ color: "#a80000" }}>
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

export default RedingtonCurrencyMappingsPage
