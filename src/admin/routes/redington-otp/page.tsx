import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useCallback, useEffect, useMemo, useState } from "react"

type OtpRecord = {
  id: number
  email: string
  action: string
  code: string
  expires_at: string
  consumed_at: string | null
  created_at: string
  updated_at: string
  status: "pending" | "consumed" | "expired"
  is_expired: boolean
  is_consumed: boolean
  activity_at?: string | null
}

type OtpStats = {
  pending: number
  expired: number
  consumed: number
  total: number
  last_created_at: string | null
  last_consumed_at: string | null
}

type OtpResponse = {
  otps?: OtpRecord[]
  count?: number
  limit?: number
  offset?: number
  stats?: OtpStats
  message?: string
}

type FilterState = {
  email: string
  action: string
  status: "all" | "pending" | "consumed" | "expired"
}

const INITIAL_FILTERS: FilterState = {
  email: "",
  action: "",
  status: "all",
}

const EMPTY_STATS: OtpStats = {
  pending: 0,
  expired: 0,
  consumed: 0,
  total: 0,
  last_created_at: null,
  last_consumed_at: null,
}

const OtpPage: React.FC = () => {
  const [records, setRecords] = useState<OtpRecord[]>([])
  const [stats, setStats] = useState<OtpStats>(EMPTY_STATS)
  const [count, setCount] = useState(0)
  const [limit, setLimit] = useState(0)
  const [offset, setOffset] = useState(0)
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [queryFilters, setQueryFilters] =
    useState<FilterState>(INITIAL_FILTERS)
  const [visibleCodes, setVisibleCodes] = useState<Record<number, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeFilterCount = useMemo(() => {
    let totalActive = 0
    Object.entries(queryFilters).forEach(([key, value]) => {
      if (key === "status") {
        if (value !== "all") {
          totalActive += 1
        }
      } else if (value.trim().length) {
        totalActive += 1
      }
    })
    return totalActive
  }, [queryFilters])

  const successRate = useMemo(() => {
    if (!stats.total) {
      return 0
    }
    return Math.round((stats.consumed / stats.total) * 1000) / 10
  }, [stats])

  const loadOtps = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      if (queryFilters.email.trim()) {
        params.set("email", queryFilters.email.trim())
      }
      if (queryFilters.action.trim()) {
        params.set("action", queryFilters.action.trim())
      }
      if (queryFilters.status !== "all") {
        params.set("status", queryFilters.status)
      }

      const queryString = params.toString()
      const url = queryString
        ? `/admin/redington/otp?${queryString}`
        : "/admin/redington/otp"

      const response = await fetch(url, {
        credentials: "include",
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as OtpResponse
        throw new Error(body?.message || "Failed to load OTP activity.")
      }

      const body = (await response.json()) as OtpResponse
      setRecords(body.otps ?? [])
      setStats(body.stats ?? EMPTY_STATS)
      setCount(body.count ?? body.otps?.length ?? 0)
      setLimit(body.limit ?? 0)
      setOffset(body.offset ?? 0)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to fetch OTP data."
      setError(message)
      setRecords([])
      setStats(EMPTY_STATS)
      setCount(0)
      setLimit(0)
      setOffset(0)
    } finally {
      setIsLoading(false)
    }
  }, [queryFilters])

  useEffect(() => {
    loadOtps()
  }, [loadOtps])

  const toggleCodeVisibility = (id: number) => {
    setVisibleCodes((prev) => ({
      ...prev,
      [id]: !prev[id],
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
    setFilters(INITIAL_FILTERS)
    setQueryFilters(INITIAL_FILTERS)
  }

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0 }}>OTP Functionality</h1>
          <p style={{ margin: "4px 0 0", color: "#475569" }}>
            Monitor OTP issuance, verification attempts, and expiry outcomes migrated from Magento.
          </p>
        </div>
        <button onClick={loadOtps} disabled={isLoading}>
          Refresh
        </button>
      </div>

      <section
        style={{
          display: "grid",
          gap: "12px",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        }}
      >
        <StatCard label="Pending" value={stats.pending} tone="default" />
        <StatCard label="Consumed" value={stats.consumed} tone="success" />
        <StatCard label="Expired" value={stats.expired} tone="danger" />
        <StatCard
          label="Success Rate"
          value={`${successRate.toFixed(1)}%`}
          tone="success"
        />
        <StatCard
          label="Last Sent"
          value={formatDate(stats.last_created_at) ?? "-"}
          tone="default"
        />
        <StatCard
          label="Last Verified"
          value={formatDate(stats.last_consumed_at) ?? "-"}
          tone="default"
        />
      </section>

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
          <span>Email</span>
          <input
            name="email"
            value={filters.email}
            onChange={handleFilterChange}
            placeholder="customer@example.com"
          />
        </label>

        <label style={filterLabelStyle}>
          <span>Action</span>
          <input
            name="action"
            value={filters.action}
            onChange={handleFilterChange}
            placeholder="e.g. password_reset"
          />
        </label>

        <label style={filterLabelStyle}>
          <span>Status</span>
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="consumed">Consumed</option>
            <option value="expired">Expired</option>
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
          Showing {records.length} of {count} record{count === 1 ? "" : "s"}
          {limit ? ` (limit ${limit}${offset ? `, offset ${offset}` : ""})` : ""}
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
              <th style={headerCellStyle}>Email</th>
              <th style={headerCellStyle}>Action</th>
              <th style={headerCellStyle}>OTP</th>
              <th style={headerCellStyle}>Status</th>
              <th style={headerCellStyle}>Expires</th>
              <th style={headerCellStyle}>Consumed</th>
              <th style={headerCellStyle}>Created</th>
              <th style={headerCellStyle}>Updated</th>
              <th style={headerCellStyle}>Activity</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} style={cellStyle}>
                  Loading OTP records...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={9} style={cellStyle}>
                  No OTP activity found.
                </td>
              </tr>
            ) : (
              records.map((record) => {
                const reveal = Boolean(visibleCodes[record.id])
                return (
                  <tr key={record.id}>
                    <td style={{ ...cellStyle, fontWeight: 600 }}>{record.email}</td>
                    <td style={cellStyle}>{record.action}</td>
                    <td style={{ ...cellStyle, display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontFamily: "monospace" }}>
                        {maskCode(record.code, reveal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleCodeVisibility(record.id)}
                      >
                        {reveal ? "Hide" : "Show"}
                      </button>
                    </td>
                    <td style={cellStyle}>
                      <StatusBadge status={record.status} />
                    </td>
                    <td style={cellStyle}>{formatDate(record.expires_at)}</td>
                    <td style={cellStyle}>{formatDate(record.consumed_at)}</td>
                    <td style={cellStyle}>{formatDate(record.created_at)}</td>
                    <td style={cellStyle}>{formatDate(record.updated_at)}</td>
                    <td style={cellStyle}>{formatRelative(record.activity_at)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type StatCardProps = {
  label: string
  value: string | number
  tone: "default" | "success" | "danger"
}

const StatCard: React.FC<StatCardProps> = ({ label, value, tone }) => {
  const toneStyles =
    tone === "success"
      ? { color: "#065f46", background: "#ecfdf5" }
      : tone === "danger"
      ? { color: "#b91c1c", background: "#fef2f2" }
      : { color: "#1f2937", background: "#f3f4f6" }

  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "10px",
        border: "1px solid #e5e7eb",
        ...toneStyles,
      }}
    >
      <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>{value}</div>
    </div>
  )
}

type StatusBadgeProps = {
  status: "pending" | "consumed" | "expired"
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const style =
    status === "consumed"
      ? { background: "#dcfce7", color: "#166534" }
      : status === "expired"
      ? { background: "#fee2e2", color: "#b91c1c" }
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
        ...style,
      }}
    >
      {status.toUpperCase()}
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

function maskCode(code: string, reveal: boolean) {
  if (reveal || !code.length) {
    return code || "-"
  }
  if (code.length <= 2) {
    return "•".repeat(code.length)
  }
  const masked = "•".repeat(code.length - 2) + code.slice(-2)
  return masked
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

function formatRelative(value?: string | null) {
  if (!value) {
    return "-"
  }
  const target = new Date(value)
  if (Number.isNaN(target.getTime())) {
    return value
  }
  const now = Date.now()
  const diffMs = target.getTime() - now
  const diffMinutes = Math.round(diffMs / 60000)

  if (diffMinutes === 0) {
    return "now"
  }

  const absMinutes = Math.abs(diffMinutes)
  if (absMinutes < 60) {
    return diffMinutes > 0 ? `in ${absMinutes}m` : `${absMinutes}m ago`
  }

  const absHours = Math.round(absMinutes / 60)
  if (absHours < 48) {
    return diffMinutes > 0 ? `in ${absHours}h` : `${absHours}h ago`
  }

  const absDays = Math.round(absHours / 24)
  return diffMinutes > 0 ? `in ${absDays}d` : `${absDays}d ago`
}

export const config = defineRouteConfig({})

export default OtpPage
