import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useCallback, useEffect, useMemo, useState } from "react"

type AccessMapping = {
  id: number
  country_code: string
  mobile_ext: string
  company_code: string
  brand_ids: string[]
  domain_id?: number
  domain_extention_id?: number
  domain_name?: string
  domain_extention_name?: string
  created_at: string
  updated_at: string
}

type DomainOption = {
  id: number
  domain_name: string
}

type DomainExtOption = {
  id: number
  domain_extention_name: string
}

type CompanyCodeOption = {
  id: number
  country_code: string
  company_code: string
  status: boolean
}

type AccessMappingResponse = {
  access_mappings?: AccessMapping[]
  access_mapping?: AccessMapping
  message?: string
}

type DomainsResponse = {
  domains?: DomainOption[]
}

type DomainExtentionsResponse = {
  domain_extentions?: DomainExtOption[]
}

type CompanyCodesResponse = {
  company_codes?: CompanyCodeOption[]
}

const initialForm = {
  country_code: "",
  mobile_ext: "",
  company_code: "",
  brand_ids: "",
  domain_id: "",
  domain_extention_id: "",
}

const RedingtonAccessMappingsPage: React.FC = () => {
  const [mappings, setMappings] = useState<AccessMapping[]>([])
  const [domains, setDomains] = useState<DomainOption[]>([])
  const [domainExtensions, setDomainExtensions] = useState<DomainExtOption[]>(
    []
  )
  const [companyCodes, setCompanyCodes] = useState<CompanyCodeOption[]>([])
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
      const response = await fetch("/admin/redington/access-mappings", {
        credentials: "include",
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as AccessMappingResponse
        throw new Error(body?.message || "Failed to load access mappings")
      }

      const body = (await response.json()) as AccessMappingResponse
      setMappings(body.access_mappings ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load access mappings."
      setError(message)
      setMappings([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadOptions = useCallback(async () => {
    try {
      const [domainsRes, extensionsRes, companyRes] = await Promise.all([
        fetch("/admin/redington/domains", { credentials: "include" }),
        fetch("/admin/redington/domain-extensions", { credentials: "include" }),
        fetch("/admin/redington/company-codes", { credentials: "include" }),
      ])

      if (domainsRes.ok) {
        const body = (await domainsRes.json()) as DomainsResponse
        setDomains(body.domains ?? [])
      }

      if (extensionsRes.ok) {
        const body = (await extensionsRes.json()) as DomainExtentionsResponse
        setDomainExtensions(body.domain_extentions ?? [])
      }

      if (companyRes.ok) {
        const body = (await companyRes.json()) as CompanyCodesResponse
        setCompanyCodes(body.company_codes ?? [])
      }
    } catch (err) {
      // ignore for now, handled elsewhere
    }
  }, [])

  useEffect(() => {
    loadOptions()
    loadMappings()
  }, [loadOptions, loadMappings])

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
  }

  const handleFormChange = (
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

    const countryCode = form.country_code.trim().toUpperCase()
    const companyCode = form.company_code.trim()
    const mobileExt = form.mobile_ext.trim()
    const domainId = Number.parseInt(form.domain_id, 10)
    const domainExtId = Number.parseInt(form.domain_extention_id, 10)
    const brandIds = form.brand_ids
      .split(/[\n,]+/)
      .map((entry) => entry.trim())
      .filter(Boolean)

    if (!countryCode || !companyCode || !mobileExt || !domainId || !domainExtId) {
      setError("Country code, company code, mobile extension, domain, and domain extension are required.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    const payload = {
      country_code: countryCode,
      company_code: companyCode,
      mobile_ext: mobileExt,
      domain_id: domainId,
      domain_extention_id: domainExtId,
      brand_ids: brandIds,
    }

    const isEdit = editingId !== null

    try {
      const response = await fetch(
        isEdit
          ? `/admin/redington/access-mappings/${editingId}`
          : `/admin/redington/access-mappings`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      )

      const body = (await response.json().catch(() => ({}))) as AccessMappingResponse

      if (!response.ok) {
        throw new Error(
          body?.message ||
            (isEdit ? "Failed to update access mapping." : "Failed to create access mapping.")
        )
      }

      resetForm()
      await loadMappings()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : isEdit
          ? "Unable to update access mapping."
          : "Unable to create access mapping."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (mapping: AccessMapping) => {
    setEditingId(mapping.id)
    setForm({
      country_code: mapping.country_code || "",
      mobile_ext: mapping.mobile_ext || "",
      company_code: mapping.company_code || "",
      brand_ids: (mapping.brand_ids || []).join(", "),
      domain_id: mapping.domain_id ? String(mapping.domain_id) : "",
      domain_extention_id: mapping.domain_extention_id
        ? String(mapping.domain_extention_id)
        : "",
    })
    setError(null)
  }

  const handleDelete = async (mapping: AccessMapping) => {
    if (
      !window.confirm(
        `Delete mapping for ${mapping.country_code} / ${mapping.company_code}? This cannot be undone.`
      )
    ) {
      return
    }

    setError(null)

    try {
      const response = await fetch(`/admin/redington/access-mappings/${mapping.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok && response.status !== 204) {
        const body = (await response.json().catch(() => ({}))) as AccessMappingResponse
        throw new Error(body?.message || "Failed to delete access mapping.")
      }

      if (editingId === mapping.id) {
        resetForm()
      }

      await loadMappings()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to delete access mapping."
      setError(message)
    }
  }

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Access Mapping</h1>
        <button onClick={() => { loadOptions(); loadMappings() }} disabled={isLoading}>
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
          <span>Mobile Extension</span>
          <input
            name="mobile_ext"
            placeholder="e.g. +971"
            value={form.mobile_ext}
            onChange={handleFormChange}
            required
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>Company Code</span>
          <select
            name="company_code"
            value={form.company_code}
            onChange={handleFormChange}
            required
          >
            <option value="">Select company code…</option>
            {companyCodes.map((company) => (
              <option key={company.id} value={company.company_code}>
                {company.company_code} ({company.country_code})
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>Domain</span>
          <select
            name="domain_id"
            value={form.domain_id}
            onChange={handleFormChange}
            required
          >
            <option value="">Select domain…</option>
            {domains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.domain_name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>Domain Extension</span>
          <select
            name="domain_extention_id"
            value={form.domain_extention_id}
            onChange={handleFormChange}
            required
          >
            <option value="">Select domain extension…</option>
            {domainExtensions.map((extension) => (
              <option key={extension.id} value={extension.id}>
                {extension.domain_extention_name}
              </option>
            ))}
          </select>
        </label>

        <label
          style={{
            gridColumn: "1 / -1",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <span>Brand IDs (comma or newline separated)</span>
          <textarea
            name="brand_ids"
            value={form.brand_ids}
            onChange={handleFormChange}
            rows={2}
            placeholder="Enter brand IDs, separated by comma or newline"
          />
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
              <th style={headerCellStyle}>Country</th>
              <th style={headerCellStyle}>Company Code</th>
              <th style={headerCellStyle}>Mobile Ext</th>
              <th style={headerCellStyle}>Brands</th>
              <th style={headerCellStyle}>Domain</th>
              <th style={headerCellStyle}>Domain Extension</th>
              <th style={headerCellStyle}>Created</th>
              <th style={headerCellStyle}>Updated</th>
              <th style={headerCellStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} style={cellStyle}>
                  Loading access mappings...
                </td>
              </tr>
            ) : sortedMappings.length === 0 ? (
              <tr>
                <td colSpan={9} style={cellStyle}>
                  No access mappings found.
                </td>
              </tr>
            ) : (
              sortedMappings.map((mapping) => (
                <tr key={mapping.id}>
                  <td style={cellStyle}>{mapping.country_code}</td>
                  <td style={cellStyle}>{mapping.company_code}</td>
                  <td style={cellStyle}>{mapping.mobile_ext}</td>
                  <td style={cellStyle}>
                    {(mapping.brand_ids || []).length
                      ? mapping.brand_ids.join(", ")
                      : "-"}
                  </td>
                  <td style={cellStyle}>{mapping.domain_name ?? mapping.domain_id ?? "-"}</td>
                  <td style={cellStyle}>
                    {mapping.domain_extention_name ?? mapping.domain_extention_id ?? "-"}
                  </td>
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

export default RedingtonAccessMappingsPage
