import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

type ProductPrice = {
  id: number
  sku: string
  country_code: string
  company_code: string
  brand_id: string | null
  distribution_channel: string
  domain_id: number | null
  product_base_price: number
  product_special_price: number | null
  is_active: boolean
  promotion_channel: string | null
  from_date: string | null
  to_date: string | null
  created_at: string
  updated_at: string
}

type ProductPriceResponse = {
  product_prices?: ProductPrice[]
  product_price?: ProductPrice
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

type DomainResponse = {
  domains?: Domain[]
  message?: string
}

type FormState = {
  sku: string
  country_code: string
  company_code: string
  brand_id: string
  distribution_channel: string
  domain_id: string
  product_base_price: string
  product_special_price: string
  is_active: "true" | "false"
  promotion_channel: string
  from_date: string
  to_date: string
}

type FilterState = {
  sku: string
  country_code: string
  company_code: string
  distribution_channel: string
  domain_id: string
  is_active: "all" | "true" | "false"
}

const createInitialFormState = (): FormState => ({
  sku: "",
  country_code: "",
  company_code: "",
  brand_id: "",
  distribution_channel: "",
  domain_id: "",
  product_base_price: "",
  product_special_price: "",
  is_active: "false",
  promotion_channel: "",
  from_date: "",
  to_date: "",
})

const createInitialFilterState = (): FilterState => ({
  sku: "",
  country_code: "",
  company_code: "",
  distribution_channel: "",
  domain_id: "",
  is_active: "all",
})

const ProductPricingPage: React.FC = () => {
  const [prices, setPrices] = useState<ProductPrice[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [count, setCount] = useState(0)
  const [limit, setLimit] = useState(0)
  const [offset, setOffset] = useState(0)
  const [form, setForm] = useState<FormState>(createInitialFormState)
  const [filters, setFilters] = useState<FilterState>(createInitialFilterState)
  const [queryFilters, setQueryFilters] =
    useState<FilterState>(createInitialFilterState)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [domainError, setDomainError] = useState<string | null>(null)

  const domainLookup = useMemo(() => {
    const map = new Map<number, Domain>()
    domains.forEach((domain) => {
      map.set(domain.id, domain)
    })
    return map
  }, [domains])

  const loadDomains = useCallback(async () => {
    setDomainError(null)
    try {
      const response = await fetch("/admin/redington/domains", {
        credentials: "include",
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as DomainResponse
        throw new Error(body?.message || "Failed to load domains.")
      }

      const body = (await response.json()) as DomainResponse
      setDomains(body.domains ?? [])
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to fetch domains. Domain selection will be limited."
      setDomainError(message)
      setDomains([])
    }
  }, [])

  const loadPrices = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (queryFilters.sku.trim()) {
        params.set("sku", queryFilters.sku.trim())
      }
      if (queryFilters.country_code.trim()) {
        params.set("country_code", queryFilters.country_code.trim())
      }
      if (queryFilters.company_code.trim()) {
        params.set("company_code", queryFilters.company_code.trim())
      }
      if (queryFilters.distribution_channel.trim()) {
        params.set(
          "distribution_channel",
          queryFilters.distribution_channel.trim()
        )
      }
      if (queryFilters.domain_id.trim()) {
        params.set("domain_id", queryFilters.domain_id.trim())
      }
      if (queryFilters.is_active !== "all") {
        params.set("is_active", queryFilters.is_active)
      }

      const queryString = params.toString()
      const url = queryString
        ? `/admin/redington/product-prices?${queryString}`
        : "/admin/redington/product-prices"

      const response = await fetch(url, {
        credentials: "include",
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as ProductPriceResponse
        throw new Error(body?.message || "Failed to load product prices.")
      }

      const body = (await response.json()) as ProductPriceResponse
      setPrices(body.product_prices ?? [])
      setCount(body.count ?? (body.product_prices?.length ?? 0))
      setLimit(body.limit ?? 0)
      setOffset(body.offset ?? 0)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to fetch product prices."
      setError(message)
      setPrices([])
      setCount(0)
      setLimit(0)
      setOffset(0)
    } finally {
      setIsLoading(false)
    }
  }, [queryFilters])

  useEffect(() => {
    loadDomains()
  }, [loadDomains])

  useEffect(() => {
    loadPrices()
  }, [loadPrices])

  const resetForm = () => {
    setForm(createInitialFormState())
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
    setQueryFilters({ ...filters })
  }

  const resetFilters = () => {
    const resetState = createInitialFilterState()
    setFilters(resetState)
    setQueryFilters(resetState)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (
      !form.sku.trim() ||
      !form.country_code.trim() ||
      !form.company_code.trim() ||
      !form.distribution_channel.trim() ||
      !form.product_base_price.trim()
    ) {
      setError("sku, country code, company code, distribution channel, and base price are required.")
      return
    }

    const basePrice = Number(form.product_base_price)
    if (!Number.isFinite(basePrice)) {
      setError("Base price must be a valid number.")
      return
    }

    if (form.product_special_price.trim()) {
      const specialPrice = Number(form.product_special_price)
      if (!Number.isFinite(specialPrice)) {
        setError("Special price must be a valid number.")
        return
      }
    }

    const payload = {
      sku: form.sku.trim(),
      country_code: form.country_code.trim().toUpperCase(),
      company_code: form.company_code.trim(),
      brand_id: form.brand_id.trim() || null,
      distribution_channel: form.distribution_channel.trim(),
      domain_id: form.domain_id ? Number(form.domain_id) : null,
      product_base_price: Number(form.product_base_price),
      product_special_price: form.product_special_price
        ? Number(form.product_special_price)
        : null,
      is_active: form.is_active === "true",
      promotion_channel: form.promotion_channel.trim() || null,
      from_date: form.from_date ? new Date(form.from_date).toISOString() : null,
      to_date: form.to_date ? new Date(form.to_date).toISOString() : null,
    }

    const isEdit = editingId !== null

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(
        isEdit
          ? `/admin/redington/product-prices/${editingId}`
          : `/admin/redington/product-prices`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      )

      const body = (await response.json().catch(() => ({}))) as ProductPriceResponse

      if (!response.ok) {
        throw new Error(
          body?.message ||
            (isEdit
              ? "Failed to update product price."
              : "Failed to create product price.")
        )
      }

      resetForm()
      await loadPrices()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : isEdit
          ? "Unable to update product price."
          : "Unable to create product price."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (price: ProductPrice) => {
    setEditingId(price.id)
    setForm({
      sku: price.sku,
      country_code: price.country_code,
      company_code: price.company_code,
      brand_id: price.brand_id ?? "",
      distribution_channel: price.distribution_channel,
      domain_id: price.domain_id ? String(price.domain_id) : "",
      product_base_price: formatPriceInput(price.product_base_price),
      product_special_price: formatPriceInput(price.product_special_price),
      is_active: price.is_active ? "true" : "false",
      promotion_channel: price.promotion_channel ?? "",
      from_date: toInputDateTime(price.from_date),
      to_date: toInputDateTime(price.to_date),
    })
    setError(null)
  }

  const handleDelete = async (price: ProductPrice) => {
    if (
      !window.confirm(
        `Delete price override for ${price.sku} (${price.company_code}, ${describeDomain(
          price.domain_id,
          domainLookup
        )})? This cannot be undone.`
      )
    ) {
      return
    }

    setError(null)

    try {
      const response = await fetch(
        `/admin/redington/product-prices/${price.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      )

      if (!response.ok && response.status !== 204) {
        const body = (await response.json().catch(() => ({}))) as ProductPriceResponse
        throw new Error(body?.message || "Failed to delete product price.")
      }

      if (editingId === price.id) {
        resetForm()
      }

      await loadPrices()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to delete product price."
      setError(message)
    }
  }

  const activeFilterCount = useMemo(() => {
    let total = 0
    Object.entries(queryFilters).forEach(([key, value]) => {
      if (key === "is_active") {
        if (value !== "all") {
          total += 1
        }
        return
      }
      if (value.trim().length) {
        total += 1
      }
    })
    return total
  }, [queryFilters])

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0 }}>Product Pricing</h1>
          <p style={{ margin: "4px 0 0", color: "#666" }}>
            Manage domain/company/channel price overrides imported from Magento.
          </p>
        </div>
        <button onClick={loadPrices} disabled={isLoading}>
          Refresh
        </button>
      </div>

      {domainError && (
        <div style={{ background: "#fff4e5", color: "#8a4b00", padding: "12px", borderRadius: "8px" }}>
          {domainError}
        </div>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
          padding: "16px",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          background: "#fafafa",
        }}
      >
        <h2 style={{ gridColumn: "1 / -1", margin: 0, fontSize: "16px" }}>
          Filters {activeFilterCount ? `(${activeFilterCount})` : ""}
        </h2>

        <label style={filterLabelStyle}>
          <span>SKU</span>
          <input
            name="sku"
            value={filters.sku}
            onChange={handleFilterChange}
            placeholder="Partial SKU"
          />
        </label>

        <label style={filterLabelStyle}>
          <span>Country Code</span>
          <input
            name="country_code"
            value={filters.country_code}
            onChange={handleFilterChange}
            placeholder="e.g. AE"
          />
        </label>

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
          <span>Distribution Channel</span>
          <input
            name="distribution_channel"
            value={filters.distribution_channel}
            onChange={handleFilterChange}
            placeholder="Channel"
          />
        </label>

        <label style={filterLabelStyle}>
          <span>Domain</span>
          <select name="domain_id" value={filters.domain_id} onChange={handleFilterChange}>
            <option value="">All domains</option>
            <option value="global">Global (no domain)</option>
            {domains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.domain_name}
                {!domain.is_active ? " (inactive)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label style={filterLabelStyle}>
          <span>Status</span>
          <select name="is_active" value={filters.is_active} onChange={handleFilterChange}>
            <option value="all">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
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
          alignItems: "end",
          padding: "16px",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          background: "#fafafa",
        }}
      >
        <h2 style={{ gridColumn: "1 / -1", margin: 0, fontSize: "16px" }}>
          {editingId ? "Edit price override" : "Create price override"}
        </h2>

        <label style={formLabelStyle}>
          <span>SKU</span>
          <input
            name="sku"
            value={form.sku}
            onChange={handleFormChange}
            placeholder="Product SKU"
            required
          />
        </label>

        <label style={formLabelStyle}>
          <span>Country Code</span>
          <input
            name="country_code"
            value={form.country_code}
            onChange={handleFormChange}
            placeholder="e.g. AE"
            required
          />
        </label>

        <label style={formLabelStyle}>
          <span>Company Code</span>
          <input
            name="company_code"
            value={form.company_code}
            onChange={handleFormChange}
            placeholder="e.g. 1000"
            required
          />
        </label>

        <label style={formLabelStyle}>
          <span>Brand ID</span>
          <input
            name="brand_id"
            value={form.brand_id}
            onChange={handleFormChange}
            placeholder="Optional brand identifier"
          />
        </label>

        <label style={formLabelStyle}>
          <span>Distribution Channel</span>
          <input
            name="distribution_channel"
            value={form.distribution_channel}
            onChange={handleFormChange}
            placeholder="Magento channel code"
            required
          />
        </label>

        <label style={formLabelStyle}>
          <span>Domain</span>
          <select name="domain_id" value={form.domain_id} onChange={handleFormChange}>
            <option value="">Global (no domain)</option>
            {domains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.domain_name}
                {!domain.is_active ? " (inactive)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label style={formLabelStyle}>
          <span>Base Price</span>
          <input
            name="product_base_price"
            type="number"
            min="0"
            step="0.0001"
            value={form.product_base_price}
            onChange={handleFormChange}
            required
          />
        </label>

        <label style={formLabelStyle}>
          <span>Special Price</span>
          <input
            name="product_special_price"
            type="number"
            step="0.0001"
            value={form.product_special_price}
            onChange={handleFormChange}
            placeholder="Optional"
          />
        </label>

        <label style={formLabelStyle}>
          <span>Promotion Channel</span>
          <input
            name="promotion_channel"
            value={form.promotion_channel}
            onChange={handleFormChange}
            placeholder="Optional"
          />
        </label>

        <label style={formLabelStyle}>
          <span>Status</span>
          <select name="is_active" value={form.is_active} onChange={handleFormChange}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>

        <label style={formLabelStyle}>
          <span>From</span>
          <input
            name="from_date"
            type="datetime-local"
            value={form.from_date}
            onChange={handleFormChange}
          />
        </label>

        <label style={formLabelStyle}>
          <span>To</span>
          <input
            name="to_date"
            type="datetime-local"
            value={form.to_date}
            onChange={handleFormChange}
          />
        </label>

        <div style={{ display: "flex", gap: "12px" }}>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : editingId ? "Update Price" : "Create Price"}
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>
          Showing {prices.length} of {count} record{count === 1 ? "" : "s"}
          {limit ? ` (limit ${limit}${offset ? `, offset ${offset}` : ""})` : ""}
        </strong>
        {activeFilterCount > 0 && (
          <span style={{ color: "#666", fontSize: "13px" }}>
            Filters applied: {activeFilterCount}
          </span>
        )}
      </div>

      <div style={{ overflowX: "auto", border: "1px solid #e5e5e5", borderRadius: "8px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f9f9f9" }}>
            <tr>
              <th style={headerCellStyle}>SKU</th>
              <th style={headerCellStyle}>Company</th>
              <th style={headerCellStyle}>Country</th>
              <th style={headerCellStyle}>Domain</th>
              <th style={headerCellStyle}>Channel</th>
              <th style={headerCellStyle}>Brand</th>
              <th style={headerCellStyle}>Base Price</th>
              <th style={headerCellStyle}>Special Price</th>
              <th style={headerCellStyle}>Promotion</th>
              <th style={headerCellStyle}>Status</th>
              <th style={headerCellStyle}>Valid</th>
              <th style={headerCellStyle}>Created</th>
              <th style={headerCellStyle}>Updated</th>
              <th style={headerCellStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={14} style={cellStyle}>
                  Loading product prices...
                </td>
              </tr>
            ) : prices.length === 0 ? (
              <tr>
                <td colSpan={14} style={cellStyle}>
                  No product prices found.
                </td>
              </tr>
            ) : (
              prices.map((price) => (
                <tr key={price.id}>
                  <td style={{ ...cellStyle, fontWeight: 600 }}>{price.sku}</td>
                  <td style={cellStyle}>{price.company_code}</td>
                  <td style={cellStyle}>{price.country_code}</td>
                  <td style={cellStyle}>
                    {describeDomain(price.domain_id, domainLookup)}
                  </td>
                  <td style={cellStyle}>{price.distribution_channel}</td>
                  <td style={cellStyle}>{price.brand_id ?? "-"}</td>
                  <td style={cellStyle}>{formatMoney(price.product_base_price)}</td>
                  <td style={cellStyle}>
                    {price.product_special_price !== null
                      ? formatMoney(price.product_special_price)
                      : "-"}
                  </td>
                  <td style={{ ...cellStyle, maxWidth: "200px", wordBreak: "break-word" }}>
                    {price.promotion_channel ?? "-"}
                  </td>
                  <td style={cellStyle}>{price.is_active ? "Active" : "Inactive"}</td>
                  <td style={{ ...cellStyle, maxWidth: "220px" }}>
                    <div>{formatDate(price.from_date)}</div>
                    <div>{formatDate(price.to_date)}</div>
                  </td>
                  <td style={cellStyle}>{formatDate(price.created_at)}</td>
                  <td style={cellStyle}>{formatDate(price.updated_at)}</td>
                  <td style={{ ...cellStyle, display: "flex", gap: "8px" }}>
                    <button onClick={() => handleEdit(price)}>Edit</button>
                    <button onClick={() => handleDelete(price)} style={{ color: "#a80000" }}>
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

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-"
  }
  return new Intl.NumberFormat(undefined, {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value)
}

function toInputDateTime(value?: string | null) {
  if (!value) {
    return ""
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

function formatPriceInput(value?: number | null) {
  if (value === null || value === undefined) {
    return ""
  }
  return String(value)
}

function describeDomain(
  domainId: number | null,
  lookup: Map<number, Domain>
) {
  if (domainId === null) {
    return "Global"
  }
  const domain = lookup.get(domainId)
  if (!domain) {
    return `Domain #${domainId}`
  }
  return domain.is_active ? domain.domain_name : `${domain.domain_name} (inactive)`
}

export const config = defineRouteConfig({})

export default ProductPricingPage
