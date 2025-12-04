import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useCallback, useEffect, useMemo, useState } from "react"

type OrderShipment = {
  id: number
  order_id: string | null
  order_increment_id: string
  order_status: string
  awb_number: string | null
  sap_order_numbers: string | null
  last_synced_at: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

type OrderShipmentResponse = {
  order_shipments?: OrderShipment[]
  count?: number
  limit?: number
  offset?: number
  message?: string
}

type FilterState = {
  order_increment_id: string
  awb_number: string
  status: "all" | "preparing_delivery" | "invoiced" | "complete" | "pending"
}

const INITIAL_FILTERS: FilterState = {
  order_increment_id: "",
  awb_number: "",
  status: "all",
}

const OrderShipmentPage: React.FC = () => {
  const [shipments, setShipments] = useState<OrderShipment[]>([])
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [queryFilters, setQueryFilters] =
    useState<FilterState>(INITIAL_FILTERS)
  const [count, setCount] = useState(0)
  const [pageSize, setPageSize] = useState(100)
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeFilterCount = useMemo(() => {
    let total = 0
    Object.entries(queryFilters).forEach(([key, value]) => {
      if (key === "status") {
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

  const loadShipments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (queryFilters.order_increment_id.trim()) {
        params.set(
          "order_increment_id",
          queryFilters.order_increment_id.trim()
        )
      }
      if (queryFilters.awb_number.trim()) {
        params.set("awb_number", queryFilters.awb_number.trim())
      }
      if (queryFilters.status !== "all") {
        params.set("status", queryFilters.status)
      }

      params.set("limit", String(pageSize))
      params.set("offset", String(page * pageSize))

      const query = params.toString()
      const url = query
        ? `/admin/redington/order-shipments?${query}`
        : "/admin/redington/order-shipments"

      const response = await fetch(url, {
        credentials: "include",
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as OrderShipmentResponse
        throw new Error(body?.message || "Failed to load order shipments.")
      }

      const body = (await response.json()) as OrderShipmentResponse
      setShipments(body.order_shipments ?? [])
      const total = body.count ?? body.order_shipments?.length ?? 0
      setCount(total)

      if (body.limit && body.limit !== pageSize) {
        setPageSize(body.limit)
      }

      if (total === 0) {
        if (page !== 0) {
          setPage(0)
        }
      } else {
        const totalPagesCalc = pageSize > 0 ? Math.ceil(total / pageSize) : 0
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
        err instanceof Error ? err.message : "Unable to fetch order shipments."
      setError(message)
      setShipments([])
      setCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, queryFilters])

  useEffect(() => {
    loadShipments()
  }, [loadShipments])

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

  const totalPages = useMemo(
    () => (pageSize ? Math.ceil(count / pageSize) : 0),
    [count, pageSize]
  )

  const pageStart = count ? page * pageSize + 1 : 0
  const pageEnd = count ? Math.min(count, (page + 1) * pageSize) : 0

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0 }}>Order Shipment</h1>
          <p style={{ margin: "4px 0 0", color: "#475569" }}>
            Display SAP AWB numbers and shipment sync status for imported orders.
          </p>
        </div>
        <button onClick={loadShipments} disabled={isLoading}>
          Refresh
        </button>
      </div>

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
        <h2 style={{ gridColumn: "1 / -1", margin: 0, fontSize: 16 }}>
          Filters {activeFilterCount ? `(${activeFilterCount})` : ""}
        </h2>

        <label style={filterLabelStyle}>
          <span>Order Increment Id</span>
          <input
            name="order_increment_id"
            value={filters.order_increment_id}
            onChange={handleFilterChange}
            placeholder="e.g. 100000123"
          />
        </label>

        <label style={filterLabelStyle}>
          <span>AWB Number</span>
          <input
            name="awb_number"
            value={filters.awb_number}
            onChange={handleFilterChange}
            placeholder="Partial AWB"
          />
        </label>

        <label style={filterLabelStyle}>
          <span>Status</span>
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="all">All statuses</option>
            <option value="preparing_delivery">Preparing delivery</option>
            <option value="invoiced">Invoiced</option>
            <option value="complete">Complete</option>
            <option value="pending">Pending</option>
          </select>
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
              <th style={headerCellStyle}>Order Increment Id</th>
              <th style={headerCellStyle}>Status</th>
              <th style={headerCellStyle}>AWB Number</th>
              <th style={headerCellStyle}>SAP Order Numbers</th>
              <th style={headerCellStyle}>Last Synced</th>
              <th style={headerCellStyle}>Updated</th>
              <th style={headerCellStyle}>Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={cellStyle}>
                  Loading order shipments...
                </td>
              </tr>
            ) : shipments.length === 0 ? (
              <tr>
                <td colSpan={7} style={cellStyle}>
                  No order shipments found.
                </td>
              </tr>
            ) : (
              shipments.map((shipment) => (
                <tr key={shipment.id}>
                  <td style={{ ...cellStyle, fontWeight: 600 }}>
                    {shipment.order_increment_id}
                  </td>
                  <td style={cellStyle}>
                    <StatusBadge status={shipment.order_status} />
                  </td>
                  <td style={cellStyle}>
                    {shipment.awb_number ? (
                      <span style={{ fontFamily: "monospace" }}>
                        {shipment.awb_number}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={{ ...cellStyle, maxWidth: "220px", wordBreak: "break-word" }}>
                    {shipment.sap_order_numbers ?? "-"}
                  </td>
                  <td style={cellStyle}>{formatDate(shipment.last_synced_at)}</td>
                  <td style={cellStyle}>{formatDate(shipment.updated_at)}</td>
                  <td style={cellStyle}>{formatDate(shipment.created_at)}</td>
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
            onClick={() =>
              setPage((prev) => Math.min(totalPages - 1, prev + 1))
            }
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

type StatusBadgeProps = {
  status: string
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = (status || "unknown").toLowerCase()
  const style =
    normalized === "invoiced"
      ? { background: "#dcfce7", color: "#166534" }
      : normalized === "preparing_delivery"
      ? { background: "#fef3c7", color: "#92400e" }
      : { background: "#e0f2fe", color: "#0369a1" }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 10px",
        borderRadius: "999px",
        fontSize: 12,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        ...style,
      }}
    >
      {normalized}
    </span>
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

export const config = defineRouteConfig({
  label: "Order Shipments",
  nested: "/orders",
})

export default OrderShipmentPage
