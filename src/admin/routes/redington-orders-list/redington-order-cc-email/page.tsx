import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

type OrderCcEmail = {
  id: number
  company_code: string | null
  domain_id: number | null
  domain_extention_id: number | null
  domain_name?: string | null
  domain_extention_name?: string | null
  brand_ids: string[]
  cc_emails: string[]
  created_at: string
  updated_at: string
}

type OrderCcEmailResponse = {
  order_cc_email?: OrderCcEmail
  order_cc_emails?: OrderCcEmail[]
  count?: number
  limit?: number
  offset?: number
  message?: string
}

type Domain = {
  id: number
  domain_name: string
  is_active: boolean
}

type DomainExtension = {
  id: number
  domain_extention_name: string
  status: boolean
}

type CompanyCode = {
  id: number
  country_code: string
  company_code: string
  status: boolean
}

type DomainResponse = {
  domains?: Domain[]
  message?: string
}

type DomainExtensionResponse = {
  domain_extensions?: DomainExtension[]
  domain_extentions?: DomainExtension[]
  message?: string
}

type CompanyCodeResponse = {
  company_codes?: CompanyCode[]
  message?: string
}

type BrandOption = {
  value: string
  label: string
  name: string
  parent_name: string | null
  group_name: string | null
  path?: string[]
}

type BrandOptionResponse = {
  brands?: BrandOption[]
}

type FilterState = {
  company_code: string
  domain_id: string
  domain_extention_id: string
  email: string
}

const INITIAL_FILTERS: FilterState = {
  company_code: "",
  domain_id: "",
  domain_extention_id: "",
  email: "",
}

type FormState = {
  company_code: string
  domain_id: string
  domain_extention_id: string
  brand_ids: string[]
  cc_emails: string
}

const INITIAL_FORM: FormState = {
  company_code: "",
  domain_id: "",
  domain_extention_id: "",
  brand_ids: [],
  cc_emails: "",
}

const splitToArray = (value: string) =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)

const OrderCcEmailPage: React.FC = () => {
  const [entries, setEntries] = useState<OrderCcEmail[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [domainExtensions, setDomainExtensions] = useState<DomainExtension[]>([])
  const [companyCodes, setCompanyCodes] = useState<CompanyCode[]>([])
  const [brandOptions, setBrandOptions] = useState<BrandOption[]>([])

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [queryFilters, setQueryFilters] = useState<FilterState>(INITIAL_FILTERS)

  const [count, setCount] = useState(0)
  const [pageSize, setPageSize] = useState(100)
  const [page, setPage] = useState(0)

  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const activeFilterCount = useMemo(() => {
    let total = 0
    Object.entries(queryFilters).forEach(([key, value]) => {
      if (value.trim()) {
        total += 1
      }
    })
    return total
  }, [queryFilters])

  const totalPages = useMemo(
    () => (pageSize ? Math.ceil(count / pageSize) : 0),
    [count, pageSize]
  )

  const brandLabelMap = useMemo(() => {
    const map = new Map<string, string>()
    brandOptions.forEach((option) => {
      const key = String(option.value ?? "").trim()
      if (!key.length) {
        return
      }
      const label =
        option.label?.trim() ||
        option.name?.trim() ||
        (option.path && option.path.length ? option.path.join(" › ") : "") ||
        key
      map.set(key, label)
    })
    return map
  }, [brandOptions])

  const pageStart = count ? page * pageSize + 1 : 0
  const pageEnd = count ? Math.min(count, (page + 1) * pageSize) : 0

  const loadDomains = useCallback(async () => {
    try {
      const response = await fetch("/admin/redington/domains", {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error()
      }
      const body = (await response.json()) as DomainResponse
      setDomains(body.domains ?? [])
    } catch {
      setDomains([])
    }
  }, [])

  const loadDomainExtensions = useCallback(async () => {
    try {
      const response = await fetch("/admin/redington/domain-extensions", {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error()
      }
      const body = (await response.json()) as DomainExtensionResponse
      const items =
        body.domain_extensions ??
        body.domain_extentions ??
        []
      setDomainExtensions(items)
    } catch {
      setDomainExtensions([])
    }
  }, [])

  const loadCompanyCodes = useCallback(async () => {
    try {
      const response = await fetch("/admin/redington/company-codes", {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error()
      }
      const body = (await response.json()) as CompanyCodeResponse
      setCompanyCodes((body.company_codes ?? []).filter((entry) => entry.status !== false))
    } catch {
      setCompanyCodes([])
    }
  }, [])

  const loadBrandOptions = useCallback(async () => {
    try {
      const response = await fetch("/admin/redington/brand-options", {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error()
      }
      const body = (await response.json()) as BrandOptionResponse
      setBrandOptions(body.brands ?? [])
    } catch {
      setBrandOptions([])
    }
  }, [])

  const loadEntries = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (queryFilters.company_code.trim()) {
        params.set("company_code", queryFilters.company_code.trim())
      }
      if (queryFilters.domain_id.trim()) {
        params.set("domain_id", queryFilters.domain_id.trim())
      }
      if (queryFilters.domain_extention_id.trim()) {
        params.set("domain_extention_id", queryFilters.domain_extention_id.trim())
      }
      if (queryFilters.email.trim()) {
        params.set("email", queryFilters.email.trim())
      }

      params.set("limit", String(pageSize))
      params.set("offset", String(page * pageSize))

      const url = `/admin/redington/order-cc-email${params.toString() ? `?${params.toString()}` : ""}`

      const response = await fetch(url, {
        credentials: "include",
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as OrderCcEmailResponse
        throw new Error(body?.message || "Failed to load order CC emails.")
      }

      const body = (await response.json()) as OrderCcEmailResponse
      setEntries(body.order_cc_emails ?? [])
      const total = body.count ?? body.order_cc_emails?.length ?? 0
      setCount(total)

      if (body.limit && body.limit !== pageSize) {
        setPageSize(body.limit)
      }

      if (total === 0) {
        if (page !== 0) {
          setPage(0)
        }
      } else {
        const totalPagesCalc = pageSize ? Math.ceil(total / pageSize) : 0
        if (totalPagesCalc && page >= totalPagesCalc) {
          const nextPage = Math.max(0, totalPagesCalc - 1)
          if (nextPage !== page) {
            setPage(nextPage)
            return
          }
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to fetch order CC emails."
      setError(message)
      setEntries([])
      setCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, queryFilters])

  useEffect(() => {
    loadDomains()
    loadDomainExtensions()
    loadCompanyCodes()
    loadBrandOptions()
  }, [loadDomains, loadDomainExtensions, loadCompanyCodes, loadBrandOptions])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const handleFilterChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const applyFilters = () => {
    setPage(0)
    setQueryFilters({ ...filters })
  }

  const resetFilters = () => {
    setPage(0)
    setFilters(INITIAL_FILTERS)
    setQueryFilters(INITIAL_FILTERS)
  }

  const resetForm = () => {
    setForm(INITIAL_FORM)
    setEditingId(null)
    setFormError(null)
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

  const handleEdit = (entry: OrderCcEmail) => {
    setEditingId(entry.id)
    setForm({
      company_code: entry.company_code ?? "",
      domain_id: entry.domain_id ? String(entry.domain_id) : "",
      domain_extention_id: entry.domain_extention_id
        ? String(entry.domain_extention_id)
        : "",
      brand_ids: [...entry.brand_ids],
      cc_emails: entry.cc_emails.join(", "),
    })
    setFormError(null)
  }

  const handleDelete = async (entry: OrderCcEmail) => {
    if (!window.confirm(`Delete CC configuration for company ${entry.company_code ?? ""}?`)) {
      return
    }

    try {
      const response = await fetch(`/admin/redington/order-cc-email/${entry.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok && response.status !== 204) {
        const body = (await response.json().catch(() => ({}))) as OrderCcEmailResponse
        throw new Error(body?.message || "Failed to delete entry.")
      }

      if (editingId === entry.id) {
        resetForm()
      }

      await loadEntries()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete entry."
      setError(message)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!form.company_code.trim()) {
      setFormError("Company code is required.")
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    const payload = {
      company_code: form.company_code.trim(),
      domain_id: form.domain_id ? Number(form.domain_id) : null,
      domain_extention_id: form.domain_extention_id
        ? Number(form.domain_extention_id)
        : null,
      brand_ids: form.brand_ids,
      cc_emails: splitToArray(form.cc_emails),
    }

    const isEdit = editingId !== null

    try {
      const response = await fetch(
        isEdit
          ? `/admin/redington/order-cc-email/${editingId}`
          : `/admin/redington/order-cc-email`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      )

      const body = (await response.json().catch(() => ({}))) as OrderCcEmailResponse

      if (!response.ok) {
        throw new Error(
          body?.message ||
            (isEdit ? "Failed to update order CC email." : "Failed to create order CC email.")
        )
      }

      resetForm()
      await loadEntries()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : isEdit
          ? "Unable to update order CC email."
          : "Unable to create order CC email."
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0 }}>Order CC Email</h1>
          <p style={{ margin: "4px 0 0", color: "#475569" }}>
            Configure CC recipients used when emailing invoices. Existing data is migrated from Magento’s order_cc_email table.
          </p>
        </div>
        <button onClick={loadEntries} disabled={isLoading}>
          Refresh
        </button>
      </div>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
          padding: "16px",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          background: "#fafafa",
        }}
      >
        <h2 style={{ gridColumn: "1 / -1", margin: 0, fontSize: 16 }}>
          Filters {activeFilterCount ? `(${activeFilterCount})` : ""}
        </h2>

        <label style={filterLabelStyle}>
          <span>Company Code</span>
          <input
            name="company_code"
            value={filters.company_code}
            onChange={handleFilterChange}
            placeholder="e.g. 1000"
          />
        </label>

        <label style={filterLabelStyle}>
          <span>Domain</span>
          <select name="domain_id" value={filters.domain_id} onChange={handleFilterChange}>
            <option value="">All domains</option>
            {domains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.domain_name}
                {!domain.is_active ? " (inactive)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label style={filterLabelStyle}>
          <span>Domain Extension</span>
          <select
            name="domain_extention_id"
            value={filters.domain_extention_id}
            onChange={handleFilterChange}
          >
            <option value="">All extensions</option>
            {domainExtensions.map((extension) => (
              <option key={extension.id} value={extension.id}>
                {extension.domain_extention_name}
                {!extension.status ? " (inactive)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label style={filterLabelStyle}>
          <span>Email Contains</span>
          <input
            name="email"
            value={filters.email}
            onChange={handleFilterChange}
            placeholder="address@example.com"
          />
        </label>

        <label style={filterLabelStyle}>
          <span>Per Page</span>
          <select
            value={pageSize}
            onChange={(event) => {
              const next = Number(event.target.value)
              setPageSize(next)
              setPage(0)
            }}
          >
            {[25, 50, 100, 200].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
          <button type="button" onClick={applyFilters} disabled={isLoading}>
            Apply Filters
          </button>
          <button type="button" onClick={resetFilters}>
            Reset
          </button>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
          padding: "16px",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          background: "#fafafa",
        }}
      >
        <h2 style={{ gridColumn: "1 / -1", margin: 0, fontSize: 16 }}>
          {editingId ? "Edit CC Entry" : "Create CC Entry"}
        </h2>

        <label style={formLabelStyle}>
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
                {company.company_code}
                {company.country_code ? ` (${company.country_code})` : ""}
                {company.status === false ? " (inactive)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label style={formLabelStyle}>
          <span>Domain</span>
          <select name="domain_id" value={form.domain_id} onChange={handleFormChange}>
            <option value="">(None)</option>
            {domains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.domain_name}
                {!domain.is_active ? " (inactive)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label style={formLabelStyle}>
          <span>Domain Extension</span>
          <select
            name="domain_extention_id"
            value={form.domain_extention_id}
            onChange={handleFormChange}
          >
            <option value="">(None)</option>
            {domainExtensions.map((extension) => (
              <option key={extension.id} value={extension.id}>
                {extension.domain_extention_name}
                {!extension.status ? " (inactive)" : ""}
              </option>
            ))}
          </select>
        </label>

        <BrandMultiSelect
          label="Brands"
          options={brandOptions}
          value={form.brand_ids}
          onChange={(ids) =>
            setForm((prev) => ({
              ...prev,
              brand_ids: ids,
            }))
          }
          labelMap={brandLabelMap}
        />

        <label style={{ ...formLabelStyle, gridColumn: "1 / -1" }}>
          <span>CC Emails</span>
          <textarea
            name="cc_emails"
            value={form.cc_emails}
            onChange={handleFormChange}
            placeholder="Comma separated email addresses"
            rows={2}
            required
          />
        </label>

        <div style={{ display: "flex", gap: "12px" }}>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : editingId ? "Update" : "Create"}
          </button>
          {editingId !== null && (
            <button type="button" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>

        {formError && (
          <div style={{ gridColumn: "1 / -1", background: "#ffe5e5", color: "#a80000", padding: "12px", borderRadius: "8px" }}>
            {formError}
          </div>
        )}
      </form>

      {error && (
        <div style={{ background: "#ffe5e5", color: "#a80000", padding: "12px", borderRadius: "8px" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>
          {count
            ? `Showing ${pageStart.toLocaleString()}–${pageEnd.toLocaleString()} of ${count.toLocaleString()} records`
            : "No records found"}
        </strong>
        {activeFilterCount > 0 && (
          <span style={{ color: "#666", fontSize: 13 }}>
            Filters applied: {activeFilterCount}
          </span>
        )}
      </div>

      <div style={{ overflowX: "auto", border: "1px solid #e5e5e5", borderRadius: "8px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f9f9f9" }}>
            <tr>
              <th style={headerCellStyle}>Company Code</th>
              <th style={headerCellStyle}>Domain</th>
              <th style={headerCellStyle}>Domain Extension</th>
              <th style={headerCellStyle}>Brands</th>
              <th style={headerCellStyle}>CC Emails</th>
              <th style={headerCellStyle}>Updated</th>
              <th style={headerCellStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={cellStyle}>
                  Loading...
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={7} style={cellStyle}>
                  No order CC email records found.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id}>
                  <td style={{ ...cellStyle, fontWeight: 600 }}>
                    {entry.company_code ?? "-"}
                  </td>
                  <td style={cellStyle}>
                    {entry.domain_name ?? (entry.domain_id ? `Domain #${entry.domain_id}` : "-")}
                  </td>
                  <td style={cellStyle}>
                {entry.domain_extention_name ??
                  (entry.domain_extention_id
                    ? `Extension #${entry.domain_extention_id}`
                    : "-")}
              </td>
              <td style={{ ...cellStyle, maxWidth: "200px", wordBreak: "break-word" }}>
                    {entry.brand_ids.length
                      ? entry.brand_ids
                          .map((id) => brandLabelMap.get(String(id)) ?? id)
                          .join(", ")
                      : "-"}
              </td>
                  <td style={{ ...cellStyle, maxWidth: "240px", wordBreak: "break-word", fontFamily: "monospace" }}>
                    {entry.cc_emails.join(", ")}
                  </td>
                  <td style={cellStyle}>{formatDate(entry.updated_at)}</td>
                  <td style={{ ...cellStyle, display: "flex", gap: "8px" }}>
                    <button type="button" onClick={() => handleEdit(entry)}>
                      Edit
                    </button>
                    <button
                      type="button"
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

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          Page <strong>{totalPages === 0 ? 0 : page + 1}</strong> / {totalPages}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setPage(0)}
            disabled={page === 0 || totalPages <= 1 || isLoading}
          >
            First
          </button>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            disabled={page === 0 || totalPages <= 1 || isLoading}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
            disabled={totalPages <= 1 || page + 1 >= totalPages || isLoading}
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => setPage(Math.max(0, totalPages - 1))}
            disabled={totalPages <= 1 || page + 1 >= totalPages || isLoading}
          >
            Last
          </button>
        </div>
      </div>
    </div>
  )
}

type BrandMultiSelectProps = {
  label: string
  options: BrandOption[]
  value: string[]
  onChange: (ids: string[]) => void
  labelMap: Map<string, string>
}

const BrandMultiSelect: React.FC<BrandMultiSelectProps> = ({
  label,
  options,
  value,
  onChange,
  labelMap,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const normalizedOptions = useMemo(() => {
    return options.map((option) => {
      const id = String(option.value ?? "").trim()
      const labelText =
        labelMap.get(id) ||
        option.label?.trim() ||
        option.name?.trim() ||
        id
      return {
        id,
        label: labelText,
      }
    })
  }, [labelMap, options])

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return normalizedOptions
    }
    return normalizedOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.id.toLowerCase().includes(query)
    )
  }, [normalizedOptions, search])

  const toggleValue = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((entry) => entry !== id))
    } else {
      onChange([...value, id])
    }
  }

  const removeValue = (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    onChange(value.filter((entry) => entry !== id))
  }

  return (
    <div
      ref={containerRef}
      style={{
        ...formLabelStyle,
        gridColumn: "1 / -1",
        position: "relative",
        gap: 6,
      }}
    >
      <span>{label}</span>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            setIsOpen((prev) => !prev)
          }
        }}
        style={{
          minHeight: "44px",
          border: "1px solid #d0d5dd",
          borderRadius: "6px",
          padding: "6px",
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          alignItems: "center",
          cursor: "pointer",
          background: "#fff",
        }}
      >
        {value.length === 0 ? (
          <span style={{ color: "#888" }}>
            {options.length ? "Select brands…" : "Loading brands…"}
          </span>
        ) : (
          value.map((id) => (
            <span
              key={id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 6px",
                background: "#eef2ff",
                borderRadius: "12px",
                fontSize: "12px",
              }}
            >
              {labelMap.get(id) ?? id}
              <button
                type="button"
                onClick={(event) => removeValue(id, event)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "14px",
                  lineHeight: 1,
                }}
                aria-label={`Remove ${labelMap.get(id) ?? id}`}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #d0d5dd",
            borderRadius: "6px",
            marginTop: "4px",
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.12)",
            zIndex: 10,
            maxHeight: "320px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: "8px" }}>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search brands…"
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #d0d5dd",
              }}
            />
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              borderTop: "1px solid #f0f0f0",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            {filteredOptions.length === 0 ? (
              <div style={{ padding: "12px", color: "#666" }}>
                No brands match "{search}"
              </div>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    cursor: "pointer",
                    borderBottom: "1px solid #f7f7f7",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={value.includes(option.id)}
                    onChange={() => toggleValue(option.id)}
                  />
                  <span>{option.label}</span>
                </label>
              ))
            )}
          </div>

          <div style={{ padding: "8px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button type="button" onClick={() => onChange([])}>
              Clear
            </button>
            <button type="button" onClick={() => setIsOpen(false)}>
              Done
            </button>
          </div>
        </div>
      )}
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

const filterLabelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
}

const formLabelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
}

function formatDate(value?: string | null) {
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

export const config = defineRouteConfig({
  label: "Order CC Email",
  nested: "/orders",
})

export default OrderCcEmailPage
