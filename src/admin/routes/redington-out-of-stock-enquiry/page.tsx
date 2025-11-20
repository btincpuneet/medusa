import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useCallback, useEffect, useMemo, useState } from "react"

type ProductEnquiry = {
  id: number
  user_id: number | null
  access_id: number | null
  domain_id: number | null
  company_code: string | null
  product_id: number | null
  fullname: string | null
  email: string | null
  product_name: string | null
  domain_name: string | null
  country_name: string | null
  sku: string | null
  price: string | null
  comments: string | null
  status: string | null
  created_at: string
  updated_at: string
}

type ProductEnquiryResponse = {
  product_enquiries?: ProductEnquiry[]
  product_enquiry?: ProductEnquiry
  count?: number
  limit?: number
  offset?: number
  message?: string
}

type FilterState = {
  status: string
  email: string
  sku: string
}

const INITIAL_FILTERS: FilterState = {
  status: "",
  email: "",
  sku: "",
}

const OutOfStockEnquiryPage: React.FC = () => {
  const [entries, setEntries] = useState<ProductEnquiry[]>([])
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [queryFilters, setQueryFilters] = useState<FilterState>(INITIAL_FILTERS)

  const [count, setCount] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [page, setPage] = useState(0)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const activeFilterCount = useMemo(() => {
    let total = 0
    Object.entries(queryFilters).forEach(([_key, value]) => {
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

  const pageStart = count ? page * pageSize + 1 : 0
  const pageEnd = count ? Math.min(count, (page + 1) * pageSize) : 0

  const loadEntries = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (queryFilters.status.trim()) params.set("status", queryFilters.status.trim())
      if (queryFilters.email.trim()) params.set("email", queryFilters.email.trim())
      if (queryFilters.sku.trim()) params.set("sku", queryFilters.sku.trim())
      params.set("limit", String(pageSize))
      params.set("offset", String(page * pageSize))

      const response = await fetch(
        `/admin/redington/product-enquiries${params.toString() ? `?${params.toString()}` : ""}`,
        { credentials: "include" }
      )

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as ProductEnquiryResponse
        throw new Error(body?.message || "Failed to load product enquiries.")
      }

      const body = (await response.json()) as ProductEnquiryResponse
      setEntries(body.product_enquiries ?? [])
      const total = body.count ?? body.product_enquiries?.length ?? 0
      setCount(total)

      if (body.limit && body.limit !== pageSize) {
        setPageSize(body.limit)
      }

      if (total === 0) {
        if (page !== 0) setPage(0)
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
      const message = err instanceof Error ? err.message : "Unable to fetch product enquiries."
      setError(message)
      setEntries([])
      setCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, queryFilters])

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

  const handleStatusChange = async (entry: ProductEnquiry, nextStatus: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/admin/redington/product-enquiries/${entry.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus || null }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as ProductEnquiryResponse
        throw new Error(body?.message || "Failed to update status.")
      }

      await loadEntries()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update enquiry."
      setError(message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (entry: ProductEnquiry) => {
    if (!window.confirm(`Delete enquiry #${entry.id}? This cannot be undone.`)) {
      return
    }
    setIsUpdating(true)
    try {
      const response = await fetch(`/admin/redington/product-enquiries/${entry.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!response.ok && response.status !== 204) {
        const body = (await response.json().catch(() => ({}))) as ProductEnquiryResponse
        throw new Error(body?.message || "Failed to delete enquiry.")
      }
      await loadEntries()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete enquiry."
      setError(message)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0 }}>Out-of-Stock Product Enquiries</h1>
          <p style={{ margin: "4px 0 0", color: "#475569" }}>
            Review and respond to notify-me/product enquiries raised by customers.
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
          <span>Status</span>
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">All</option>
            {["new", "contacted", "resolved", "closed"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label style={filterLabelStyle}>
          <span>Email</span>
          <input
            name="email"
            value={filters.email}
            onChange={handleFilterChange}
            placeholder="customer@example.com"
          />
        </label>

        <label style={filterLabelStyle}>
          <span>SKU</span>
          <input
            name="sku"
            value={filters.sku}
            onChange={handleFilterChange}
            placeholder="SKU"
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
            {[10, 25, 50, 100].map((size) => (
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

      {error && (
        <div style={{ background: "#ffe5e5", color: "#a80000", padding: "12px", borderRadius: "8px" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>
          {count
            ? `Showing ${pageStart.toLocaleString()}–${pageEnd.toLocaleString()} of ${count.toLocaleString()} records`
            : isLoading
            ? "Loading..."
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
              <th style={headerCellStyle}>ID</th>
              <th style={headerCellStyle}>Product</th>
              <th style={headerCellStyle}>Customer</th>
              <th style={headerCellStyle}>SKU / Price</th>
              <th style={headerCellStyle}>Domain / Company</th>
              <th style={headerCellStyle}>Comments</th>
              <th style={headerCellStyle}>Status</th>
              <th style={headerCellStyle}>Created</th>
              <th style={headerCellStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} style={cellStyle}>
                  Loading...
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={9} style={cellStyle}>
                  No product enquiries found.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id}>
                  <td style={cellStyle}>#{entry.id}</td>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 600 }}>{entry.product_name ?? "-"}</div>
                    <div style={{ color: "#64748b" }}>Product ID: {entry.product_id ?? "-"}</div>
                  </td>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 600 }}>{entry.fullname ?? "-"}</div>
                    <div style={{ color: "#64748b" }}>{entry.email ?? "—"}</div>
                  </td>
                  <td style={cellStyle}>
                    <div>{entry.sku ?? "-"}</div>
                    <div style={{ color: "#64748b" }}>{entry.price ?? "—"}</div>
                  </td>
                  <td style={cellStyle}>
                    <div>{entry.domain_name ?? entry.domain_id ?? "-"}</div>
                    <div style={{ color: "#64748b" }}>{entry.company_code ?? "—"}</div>
                  </td>
                  <td style={{ ...cellStyle, maxWidth: 220, wordBreak: "break-word" }}>
                    {entry.comments ?? "—"}
                  </td>
                  <td style={cellStyle}>
                    <select
                      value={entry.status ?? ""}
                      onChange={(event) => handleStatusChange(entry, event.target.value)}
                      disabled={isUpdating}
                    >
                      <option value="">(none)</option>
                      {["new", "contacted", "resolved", "closed"].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={cellStyle}>{formatDate(entry.created_at)}</td>
                  <td style={{ ...cellStyle, display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry)}
                      style={{ color: "#a80000" }}
                      disabled={isUpdating}
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

export const config = defineRouteConfig({})

export default OutOfStockEnquiryPage
