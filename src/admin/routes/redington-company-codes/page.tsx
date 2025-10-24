import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useCallback, useEffect, useMemo, useState } from "react"

type CompanyCode = {
  id: number
  country_code: string
  company_code: string
  status: boolean
  created_at: string
  updated_at: string
}

type CompanyCodeResponse = {
  company_codes?: CompanyCode[]
  company_code?: CompanyCode
  message?: string
}

const initialForm = {
  country_code: "",
  company_code: "",
  status: true,
}

const RedingtonCompanyCodesPage: React.FC = () => {
  const [companyCodes, setCompanyCodes] = useState<CompanyCode[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sortedCompanyCodes = useMemo(() => {
    return [...companyCodes].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [companyCodes])

  const loadCompanyCodes = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/admin/redington/company-codes", {
        credentials: "include",
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as CompanyCodeResponse
        throw new Error(body?.message || `Failed to load company codes (${response.status})`)
      }

      const body = (await response.json()) as CompanyCodeResponse
      setCompanyCodes(body.company_codes ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load company codes."
      setError(message)
      setCompanyCodes([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCompanyCodes()
  }, [loadCompanyCodes])

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "status"
          ? value === "true"
          : name === "country_code"
          ? value.toUpperCase()
          : value,
    }))
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()

    const countryCode = String(form.country_code || "").trim().toUpperCase()
    const companyCode = String(form.company_code || "").trim()

    if (!countryCode) {
      setError("Country code is required.")
      return
    }

    if (countryCode.length !== 2) {
      setError("Country code must be a 2-letter ISO code.")
      return
    }

    if (!companyCode) {
      setError("Company code is required.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/admin/redington/company-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          country_code: countryCode,
          company_code: companyCode,
          status: form.status,
        }),
      })

      const body = (await response.json().catch(() => ({}))) as CompanyCodeResponse

      if (!response.ok) {
        throw new Error(body?.message || `Failed to create company code (${response.status})`)
      }

      if (body.company_code) {
        setCompanyCodes((prev) => [
          body.company_code!,
          ...prev.filter((item) => item.id !== body.company_code!.id),
        ])
      } else {
        await loadCompanyCodes()
      }

      setForm(initialForm)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create company code."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (record: CompanyCode) => {
    setError(null)

    try {
      const response = await fetch(`/admin/redington/company-codes/${record.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: !record.status,
        }),
      })

      const body = (await response.json().catch(() => ({}))) as CompanyCodeResponse

      if (!response.ok) {
        throw new Error(body?.message || `Failed to update company code (${response.status})`)
      }

      if (body.company_code) {
        setCompanyCodes((prev) =>
          prev.map((item) => (item.id === body.company_code!.id ? body.company_code! : item))
        )
      } else {
        await loadCompanyCodes()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to change company code status."
      setError(message)
    }
  }

  const handleEdit = async (record: CompanyCode) => {
    const nextCountry = window
      .prompt("Enter the 2-letter country code:", record.country_code)
      ?.trim()
      .toUpperCase()
    if (!nextCountry) {
      return
    }
    if (nextCountry.length !== 2) {
      setError("Country code must be a 2-letter ISO code.")
      return
    }

    const nextCompany = window.prompt("Enter the company code:", record.company_code)?.trim()
    if (!nextCompany) {
      return
    }

    if (
      nextCountry === record.country_code &&
      nextCompany === record.company_code
    ) {
      return
    }

    setError(null)

    try {
      const response = await fetch(`/admin/redington/company-codes/${record.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          country_code: nextCountry,
          company_code: nextCompany,
        }),
      })

      const body = (await response.json().catch(() => ({}))) as CompanyCodeResponse

      if (!response.ok) {
        throw new Error(body?.message || `Failed to update company code (${response.status})`)
      }

      if (body.company_code) {
        setCompanyCodes((prev) =>
          prev.map((item) => (item.id === body.company_code!.id ? body.company_code! : item))
        )
      } else {
        await loadCompanyCodes()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update company code."
      setError(message)
    }
  }

  const handleDelete = async (record: CompanyCode) => {
    if (
      !window.confirm(
        `Delete company code "${record.company_code}" for ${record.country_code}? This cannot be undone.`
      )
    ) {
      return
    }

    setError(null)

    try {
      const response = await fetch(`/admin/redington/company-codes/${record.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok && response.status !== 204) {
        const body = (await response.json().catch(() => ({}))) as CompanyCodeResponse
        throw new Error(body?.message || `Failed to delete company code (${response.status})`)
      }

      setCompanyCodes((prev) => prev.filter((item) => item.id !== record.id))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete company code."
      setError(message)
    }
  }

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Company Codes</h1>
        <button onClick={loadCompanyCodes} disabled={isLoading}>
          Refresh
        </button>
      </div>

      <form
        onSubmit={handleCreate}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(160px, 1fr)) auto",
          gap: "12px",
          alignItems: "end",
          padding: "16px",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          background: "#fafafa",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>Country Code</span>
          <input
            name="country_code"
            placeholder="e.g. AE"
            value={form.country_code}
            onChange={handleFormChange}
            maxLength={2}
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
          <span>Status</span>
          <select name="status" value={form.status ? "true" : "false"} onChange={handleFormChange}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Create Mapping"}
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
              <th style={headerCellStyle}>Country</th>
              <th style={headerCellStyle}>Company Code</th>
              <th style={headerCellStyle}>Status</th>
              <th style={headerCellStyle}>Created</th>
              <th style={headerCellStyle}>Updated</th>
              <th style={headerCellStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={cellStyle}>
                  Loading company codes...
                </td>
              </tr>
            ) : sortedCompanyCodes.length === 0 ? (
              <tr>
                <td colSpan={6} style={cellStyle}>
                  No company codes found.
                </td>
              </tr>
            ) : (
              sortedCompanyCodes.map((record) => (
                <tr key={record.id}>
                  <td style={cellStyle}>{record.country_code}</td>
                  <td style={cellStyle}>{record.company_code}</td>
                  <td style={cellStyle}>
                    <button onClick={() => handleToggleStatus(record)}>
                      {record.status ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td style={cellStyle}>{formatDate(record.created_at)}</td>
                  <td style={cellStyle}>{formatDate(record.updated_at)}</td>
                  <td style={{ ...cellStyle, display: "flex", gap: "8px" }}>
                    <button onClick={() => handleEdit(record)}>Edit</button>
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

export default RedingtonCompanyCodesPage
