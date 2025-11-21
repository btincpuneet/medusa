import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

type AccessMapping = {
  id: number
  access_id: string | null
  country_code: string
  mobile_ext: string
  company_code: string
  brand_ids: string[]
  domain_id?: number
  domain_extention_id?: number
  domain_name?: string
  domain_extention_name?: string
  created_at: string
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

type BrandOption = {
  value: string
  label: string
  path?: string[]
}

type BrandOptionsResponse = {
  brands?: BrandOption[]
}

type FormState = {
  access_id: string
  country_code: string
  mobile_ext: string
  company_code: string
  brand_ids: string[]
  domain_id: string
  domain_extention_id: string
}

type CountryOption = {
  code: string
  name: string
}

// ISO alpha-2 country list (ASCII names)
const COUNTRIES: CountryOption[] = [
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "IN", name: "India" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Kuwait" },
  { code: "OM", name: "Oman" },
  { code: "BH", name: "Bahrain" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "SG", name: "Singapore" },
  { code: "MY", name: "Malaysia" },
  { code: "ID", name: "Indonesia" },
  { code: "PK", name: "Pakistan" },
  { code: "BD", name: "Bangladesh" },
  { code: "PH", name: "Philippines" },
  { code: "VN", name: "Vietnam" },
  { code: "TH", name: "Thailand" },
  { code: "NP", name: "Nepal" },
  { code: "LK", name: "Sri Lanka" },
  { code: "AF", name: "Afghanistan" },
  { code: "CN", name: "China" },
  { code: "HK", name: "Hong Kong" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "ZA", name: "South Africa" },
  { code: "EG", name: "Egypt" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "TZ", name: "Tanzania" },
  { code: "ET", name: "Ethiopia" },
  { code: "GH", name: "Ghana" },
  { code: "AO", name: "Angola" },
  { code: "AR", name: "Argentina" },
  { code: "BR", name: "Brazil" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "MX", name: "Mexico" },
  { code: "PE", name: "Peru" },
  { code: "UY", name: "Uruguay" },
]

const createInitialForm = (): FormState => ({
  access_id: "",
  country_code: "",
  mobile_ext: "",
  company_code: "",
  brand_ids: [],
  domain_id: "",
  domain_extention_id: "",
})

const RedingtonAccessMappingsPage: React.FC = () => {
  const [mappings, setMappings] = useState<AccessMapping[]>([])
  const [domains, setDomains] = useState<DomainOption[]>([])
  const [domainExtensions, setDomainExtensions] = useState<DomainExtOption[]>(
    []
  )
  const [companyCodes, setCompanyCodes] = useState<CompanyCodeOption[]>([])
  const [brandOptions, setBrandOptions] = useState<BrandOption[]>([])
  const [form, setForm] = useState<FormState>(createInitialForm())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const sortedMappings = useMemo(() => {
    return [...mappings].sort((a, b) => {
      const aNum = Number(a.access_id ?? a.id ?? 0)
      const bNum = Number(b.access_id ?? b.id ?? 0)

      if (Number.isFinite(aNum) && Number.isFinite(bNum) && aNum !== bNum) {
        return aNum - bNum
      }

      return String(a.access_id || "").localeCompare(String(b.access_id || ""))
    })
  }, [mappings])

  const brandLabelMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const option of brandOptions) {
      if (option.value) {
        map.set(option.value, option.label || option.value)
      }
    }
    return map
  }, [brandOptions])

  const missingBrandOptions = useMemo(() => {
    const known = new Set(brandOptions.map((option) => option.value))
    return form.brand_ids.filter((id) => id && !known.has(id))
  }, [brandOptions, form.brand_ids])

  const sortedCountries = useMemo(
    () => [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name)),
    []
  )

  const loadMappings = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setFlash(null)
    try {
      const response = await fetch("/admin/redington/access-mappings", {
        credentials: "include",
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as AccessMappingResponse
        throw new Error(body?.message || "Failed to load access mappings")
      }

      const body = (await response.json()) as AccessMappingResponse
      const received = body.access_mappings ?? []

      // Drop any records missing an access_id and de-duplicate by access_id to
      // avoid duplicate/blank rows in the grid.
      const uniqueByAccess = new Map<string, AccessMapping>()
      for (const entry of received) {
        const key = (entry.access_id || "").trim()
        if (!key) continue
        if (!uniqueByAccess.has(key)) {
          uniqueByAccess.set(key, entry)
        }
      }

      setMappings(Array.from(uniqueByAccess.values()))
      setSelectedIds(new Set())
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
      const [domainsRes, extensionsRes, companyRes, brandsRes] = await Promise.all([
        fetch("/admin/redington/domains", { credentials: "include" }),
        fetch("/admin/redington/domain-extensions", { credentials: "include" }),
        fetch("/admin/redington/company-codes", { credentials: "include" }),
        fetch("/admin/redington/brand-options", { credentials: "include" }),
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

      if (brandsRes.ok) {
        const body = (await brandsRes.json()) as BrandOptionsResponse
        setBrandOptions(body.brands ?? [])
      }
    } catch (err) {
      // ignore; errors shown separately
    }
  }, [])

  useEffect(() => {
    loadOptions()
    loadMappings()
  }, [loadOptions, loadMappings])

  const resetForm = () => {
    setForm(createInitialForm())
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

  const handleBrandSelectionChange = (brandIds: string[]) => {
    setForm((prev) => ({
      ...prev,
      brand_ids: brandIds,
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const accessId = form.access_id.trim()
    const countryCode = form.country_code.trim().toUpperCase()
    const companyCode = form.company_code.trim()
    const mobileExt = form.mobile_ext.trim()
    const domainId = Number.parseInt(form.domain_id, 10)
    const domainExtId = Number.parseInt(form.domain_extention_id, 10)
    const brandIds = form.brand_ids.map((entry) => entry.trim()).filter(Boolean)

    if (!accessId || !countryCode || !companyCode || !mobileExt || !domainId || !domainExtId) {
      setError(
        "Access ID, country, company code, mobile extension, domain, and domain extension are required."
      )
      return
    }

    setIsSubmitting(true)
    setError(null)
    setFlash(null)

    const payload = {
      access_id: accessId,
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
      setShowForm(false)
      await loadMappings()
      setFlash(isEdit ? "Access mapping updated." : "Access mapping created.")
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
      access_id: mapping.access_id || "",
      country_code: mapping.country_code || "",
      mobile_ext: mapping.mobile_ext || "",
      company_code: mapping.company_code || "",
      brand_ids: Array.isArray(mapping.brand_ids) ? [...mapping.brand_ids] : [],
      domain_id: mapping.domain_id ? String(mapping.domain_id) : "",
      domain_extention_id: mapping.domain_extention_id
        ? String(mapping.domain_extention_id)
        : "",
    })
    setError(null)
    setFlash(null)
    setShowForm(true)
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
    setFlash(null)

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
      setFlash("Access mapping deleted.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to delete access mapping."
      setError(message)
    }
  }

  const openCreate = () => {
    resetForm()
    setShowForm(true)
  }

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(mappings.map((m) => m.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const toggleRow = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleBulkDelete = async () => {
    if (!selectedIds.size) {
      setError("Select at least one mapping to delete.")
      return
    }
    if (!window.confirm("Delete selected access mappings? This cannot be undone.")) {
      return
    }
    setError(null)
    setFlash(null)

    for (const id of selectedIds) {
      await fetch(`/admin/redington/access-mappings/${id}`, {
        method: "DELETE",
        credentials: "include",
      }).catch(() => {})
    }
    setSelectedIds(new Set())
    await loadMappings()
    setFlash("Selected access mappings deleted.")
  }

  return (
    <div
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        background: "#f4f3ef",
        minHeight: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0 }}>Access Mapping</h1>
          <p style={{ margin: "6px 0 0", color: "#4b5563" }}>
            Manage Redington access rules with bulk actions and inline editing.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => {
              loadOptions()
              loadMappings()
            }}
            disabled={isLoading}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #d0d5dd",
              background: "#fff",
              color: "#0f172a",
            }}
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "none",
              background: "#f2611a",
              color: "#fff",
              fontWeight: 700,
              boxShadow: "0 6px 16px rgba(242, 97, 26, 0.35)",
            }}
          >
            Add New Access Rule
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          background: "#fafafa",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontWeight: 600 }}>Actions</label>
          <select
            onChange={(event) => {
              if (event.target.value === "delete") {
                void handleBulkDelete()
              }
              event.target.value = ""
            }}
            defaultValue=""
            style={{ padding: "8px 10px", borderRadius: 8 }}
          >
            <option value="">Select</option>
            <option value="delete">Delete</option>
          </select>
          <span style={{ color: "#6b7280", fontSize: 13 }}>
            {selectedIds.size} selected
          </span>
        </div>
        <div style={{ color: "#4b5563", fontSize: 13 }}>
          {sortedMappings.length} records found
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            color: "#991b1b",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #fecdd3",
          }}
        >
          {error}
        </div>
      )}

      {flash && (
        <div
          style={{
            background: "#ecfdf3",
            color: "#065f46",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #bbf7d0",
          }}
        >
          {flash}
        </div>
      )}

      <div
        style={{
          overflowX: "auto",
          border: "1px solid #e5e5e5",
          borderRadius: "10px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
          background: "#fff",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f8f6f4" }}>
            <tr>
              <th style={{ ...headerCellStyle, width: 40 }}>
                <input
                  type="checkbox"
                  aria-label="select all"
                  checked={
                    sortedMappings.length > 0 &&
                    selectedIds.size === sortedMappings.length
                  }
                  onChange={(event) => toggleAll(event.target.checked)}
                />
              </th>
              <th style={headerCellStyle}>Access Id</th>
              <th style={headerCellStyle}>Country Code</th>
              <th style={headerCellStyle}>Mobile Extension</th>
              <th style={headerCellStyle}>Company Code</th>
              <th style={headerCellStyle}>Brand IDs</th>
              <th style={headerCellStyle}>Domain Extention Name</th>
              <th style={headerCellStyle}>Domain ID</th>
              <th style={headerCellStyle}>Created At</th>
              <th style={headerCellStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={10} style={cellStyle}>
                  Loading access mappings...
                </td>
              </tr>
            ) : sortedMappings.length === 0 ? (
              <tr>
                <td colSpan={10} style={cellStyle}>
                  No access mappings found.
                </td>
              </tr>
            ) : (
              sortedMappings.map((mapping, idx) => (
                <tr
                  key={mapping.id}
                  style={{
                    background: idx % 2 === 0 ? "#fff" : "#faf7f2",
                  }}
                >
                  <td style={{ ...cellStyle, width: 40 }}>
                    <input
                      type="checkbox"
                      aria-label={`select ${mapping.access_id}`}
                      checked={selectedIds.has(mapping.id)}
                      onChange={(event) => toggleRow(mapping.id, event.target.checked)}
                    />
                  </td>
                  <td style={cellStyle}>{mapping.access_id ?? "-"}</td>
                  <td style={cellStyle}>{mapping.country_code}</td>
                  <td style={cellStyle}>{mapping.mobile_ext}</td>
                  <td style={cellStyle}>{mapping.company_code}</td>
                  <td style={cellStyle}>
                    {(() => {
                      const labels = (mapping.brand_ids || []).map(
                        (id) => brandLabelMap.get(id) ?? id
                      )
                      return labels.length ? labels.join(", ") : "-"
                    })()}
                  </td>
                  <td style={cellStyle}>
                    {mapping.domain_extention_name ??
                      mapping.domain_extention_id ??
                      "-"}
                  </td>
                  <td style={cellStyle}>{mapping.domain_name ?? mapping.domain_id ?? "-"}</td>
                  <td style={cellStyle}>{formatDate(mapping.created_at)}</td>
                  <td style={{ ...cellStyle, display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleEdit(mapping)}
                      style={{
                        color: "#1d4ed8",
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(mapping)}
                      style={{
                        color: "#b91c1c",
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
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

      {showForm ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 40,
            padding: 16,
          }}
        >
          <div
            style={{
              width: "min(980px, 95vw)",
              background: "#fff",
              borderRadius: 14,
              boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
              // allow dropdowns (brands) to overflow the modal card
              overflow: "visible",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderBottom: "1px solid #e5e7eb",
                background: "#f8f6f4",
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {editingId ? "Edit Access Mapping" : "Add Access Mapping"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    resetForm()
                    setShowForm(false)
                  }}
                  style={{
                    border: "none",
                    background: "none",
                    color: "#374151",
                    padding: "8px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    color: "#111827",
                    padding: "8px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  form="access-mapping-form"
                  style={{
                    border: "none",
                    background: "#f2611a",
                    color: "#fff",
                    padding: "8px 14px",
                    borderRadius: 10,
                    fontWeight: 700,
                    boxShadow: "0 6px 16px rgba(242, 97, 26, 0.3)",
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            <form
              id="access-mapping-form"
              onSubmit={handleSubmit}
              style={{
                padding: "20px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "14px",
              }}
            >
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontWeight: 600 }}>
                  Country <span style={{ color: "#e11d48" }}>*</span>
                </span>
                <select
                  name="country_code"
                  value={form.country_code}
                  onChange={handleFormChange}
                  required
                  style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                >
                  <option value="">-- Please Select --</option>
                  {sortedCountries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name} ({country.code})
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontWeight: 600 }}>
                  Company Code <span style={{ color: "#e11d48" }}>*</span>
                </span>
                <select
                  name="company_code"
                  value={form.company_code}
                  onChange={handleFormChange}
                  required
                  style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                >
                  <option value="">-- Please Select --</option>
                  {companyCodes.map((company) => (
                    <option key={company.id} value={company.company_code}>
                      {company.company_code} ({company.country_code})
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontWeight: 600 }}>
                  Mobile Extension <span style={{ color: "#e11d48" }}>*</span>
                </span>
                <input
                  name="mobile_ext"
                  placeholder="971"
                  value={form.mobile_ext}
                  onChange={handleFormChange}
                  required
                  style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontWeight: 600 }}>
                  Access ID <span style={{ color: "#e11d48" }}>*</span>
                </span>
                <input
                  name="access_id"
                  placeholder="1140"
                  value={form.access_id}
                  onChange={handleFormChange}
                  required
                  style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontWeight: 600 }}>
                  Domain <span style={{ color: "#e11d48" }}>*</span>
                </span>
                <select
                  name="domain_id"
                  value={form.domain_id}
                  onChange={handleFormChange}
                  required
                  style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                >
                  <option value="">-- Please Select --</option>
                  {domains.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {domain.domain_name}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontWeight: 600 }}>
                  Domain Extention Name <span style={{ color: "#e11d48" }}>*</span>
                </span>
                <select
                  name="domain_extention_id"
                  value={form.domain_extention_id}
                  onChange={handleFormChange}
                  required
                  style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                >
                  <option value="">-- Please Select --</option>
                  {domainExtensions.map((extension) => (
                    <option key={extension.id} value={extension.id}>
                      {extension.domain_extention_name}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ gridColumn: "1 / -1" }}>
                <BrandMultiSelect
                  label="Brands"
                  options={brandOptions}
                  value={form.brand_ids}
                  onChange={handleBrandSelectionChange}
                  missingOptions={missingBrandOptions}
                  loading={brandOptions.length === 0 && missingBrandOptions.length === 0}
                  labelMap={brandLabelMap}
                />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

type BrandMultiSelectProps = {
  label: string
  options: BrandOption[]
  value: string[]
  onChange: (ids: string[]) => void
  missingOptions: string[]
  loading: boolean
  labelMap: Map<string, string>
}

const BrandMultiSelect: React.FC<BrandMultiSelectProps> = ({
  label,
  options,
  value,
  onChange,
  missingOptions,
  loading,
  labelMap,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")

  const normalizedOptions = useMemo(() => {
    const baseOptions = options.map((option) => ({
      value: option.value,
      label:
        option.path && option.path.length > 1
          ? option.path.join(" › ")
          : option.label,
      isMissing: false,
    }))

    const missing = missingOptions.map((missingValue) => ({
      value: missingValue,
      label: `${missingValue} (not in catalog)`,
      isMissing: true,
    }))

    return [...baseOptions, ...missing]
  }, [missingOptions, options])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return normalizedOptions
    return normalizedOptions.filter((opt) => opt.label.toLowerCase().includes(q))
  }, [normalizedOptions, search])

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const toggleValue = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
    )
  }

  const selectedLabels = useMemo(() => {
    const labels = value.map((id) => labelMap.get(id) ?? id)
    return labels.length ? labels.join(", ") : "Select..."
  }, [labelMap, value])

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #d1d5db",
          background: "#fff",
        }}
      >
        {loading ? "Loading..." : selectedLabels}
      </button>
      {isOpen ? (
        <div
          style={{
            position: "absolute",
            zIndex: 50,
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 6,
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            background: "#fff",
            maxHeight: 260,
            overflowY: "auto",
            boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
          }}
        >
          <div style={{ padding: 10 }}>
            <input
              placeholder="Search brands"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
              }}
            />
          </div>
          {filtered.map((opt) => (
            <label
              key={opt.value}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderTop: "1px solid #f3f4f6",
                cursor: "pointer",
                color: opt.isMissing ? "#b45309" : "#111827",
                background: value.includes(opt.value) ? "#eef2ff" : "#fff",
              }}
            >
              <input
                type="checkbox"
                checked={value.includes(opt.value)}
                onChange={() => toggleValue(opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
          {!filtered.length && (
            <div style={{ padding: "10px 12px", color: "#6b7280" }}>
              No brands found.
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

const headerCellStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px",
  fontWeight: 700,
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
