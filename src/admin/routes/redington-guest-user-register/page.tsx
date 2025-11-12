import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useCallback, useEffect, useMemo, useState } from "react"

type AllowedDomainsSummary = {
  allowed_domains: string[]
  config_domains: string[]
  database_domains: string[]
  domain_extensions: string[]
}

type GuestUserAuditRow = {
  id: number
  email: string
  success: boolean
  message: string | null
  metadata: Record<string, unknown>
  created_at: string
}

type GuestAuditResponse = {
  audits: GuestUserAuditRow[]
  count: number
  limit: number
  offset: number
}

type CustomerSyncRecord = {
  id: number
  customer_email: string
  customer_id: string | null
  sap_sync: boolean
  sap_customer_code: string | null
  sap_synced_at: string | null
  created_at: string
  updated_at: string
}

type CustomerSyncResponse = {
  records: CustomerSyncRecord[]
  count: number
  limit: number
  offset: number
}

const AUDIT_LIMIT = 25
const CUSTOMER_SYNC_LIMIT = 25

const GuestUserRegisterPage: React.FC = () => {
  const [allowedSummary, setAllowedSummary] =
    useState<AllowedDomainsSummary | null>(null)
  const [allowedLoading, setAllowedLoading] = useState(false)
  const [allowedError, setAllowedError] = useState<string | null>(null)

  const [auditData, setAuditData] = useState<GuestAuditResponse | null>(null)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState<string | null>(null)
  const [auditPage, setAuditPage] = useState(0)
  const [auditFilters, setAuditFilters] = useState({ email: "", success: "" })
  const [auditFilterForm, setAuditFilterForm] = useState({
    email: "",
    success: "",
  })

  const [syncData, setSyncData] = useState<CustomerSyncResponse | null>(null)
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncPage, setSyncPage] = useState(0)
  const [syncFilters, setSyncFilters] = useState({ email: "", sap_sync: "" })
  const [syncFilterForm, setSyncFilterForm] = useState({
    email: "",
    sap_sync: "",
  })

  const loadAllowedDomains = useCallback(async () => {
    setAllowedLoading(true)
    setAllowedError(null)
    try {
      const response = await fetch(
        "/admin/redington/guest-user-register/allowed-domains",
        { credentials: "include" }
      )
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          message?: string
        }
        throw new Error(body?.message || "Unable to load allowed domains.")
      }
      const body = (await response.json()) as AllowedDomainsSummary
      setAllowedSummary(body)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load allowed domains."
      setAllowedSummary(null)
      setAllowedError(message)
    } finally {
      setAllowedLoading(false)
    }
  }, [])

  const loadAudits = useCallback(async () => {
    setAuditLoading(true)
    setAuditError(null)
    try {
      const params = new URLSearchParams()
      params.set("limit", String(AUDIT_LIMIT))
      params.set("offset", String(AUDIT_LIMIT * auditPage))
      if (auditFilters.email.trim().length) {
        params.set("email", auditFilters.email.trim())
      }
      if (auditFilters.success) {
        params.set("success", auditFilters.success)
      }

      const response = await fetch(
        `/admin/redington/guest-user-register/audit?${params.toString()}`,
        { credentials: "include" }
      )
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          message?: string
        }
        throw new Error(body?.message || "Unable to load guest user audits.")
      }

      const body = (await response.json()) as GuestAuditResponse
      setAuditData(body)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load guest user audits."
      setAuditData(null)
      setAuditError(message)
    } finally {
      setAuditLoading(false)
    }
  }, [auditFilters, auditPage])

  const loadCustomerSync = useCallback(async () => {
    setSyncLoading(true)
    setSyncError(null)
    try {
      const params = new URLSearchParams()
      params.set("limit", String(CUSTOMER_SYNC_LIMIT))
      params.set("offset", String(CUSTOMER_SYNC_LIMIT * syncPage))
      if (syncFilters.email.trim().length) {
        params.set("email", syncFilters.email.trim())
      }
      if (syncFilters.sap_sync) {
        params.set("sap_sync", syncFilters.sap_sync)
      }

      const response = await fetch(
        `/admin/redington/guest-user-register/customer-sync?${params.toString()}`,
        { credentials: "include" }
      )
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          message?: string
        }
        throw new Error(body?.message || "Unable to load SAP sync status.")
      }

      const body = (await response.json()) as CustomerSyncResponse
      setSyncData(body)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load SAP sync status."
      setSyncData(null)
      setSyncError(message)
    } finally {
      setSyncLoading(false)
    }
  }, [syncFilters, syncPage])

  useEffect(() => {
    void loadAllowedDomains()
  }, [loadAllowedDomains])

  useEffect(() => {
    void loadAudits()
  }, [loadAudits])

  useEffect(() => {
    void loadCustomerSync()
  }, [loadCustomerSync])

  const auditTotalPages = useMemo(() => {
    if (!auditData) {
      return 1
    }
    return Math.max(1, Math.ceil(auditData.count / auditData.limit))
  }, [auditData])

  const syncTotalPages = useMemo(() => {
    if (!syncData) {
      return 1
    }
    return Math.max(1, Math.ceil(syncData.count / syncData.limit))
  }, [syncData])

  const handleAuditFilterSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setAuditFilters({ ...auditFilterForm })
    setAuditPage(0)
  }

  const handleAuditFilterReset = () => {
    const reset = { email: "", success: "" }
    setAuditFilterForm(reset)
    setAuditFilters(reset)
    setAuditPage(0)
  }

  const handleSyncFilterSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setSyncFilters({ ...syncFilterForm })
    setSyncPage(0)
  }

  const handleSyncFilterReset = () => {
    const reset = { email: "", sap_sync: "" }
    setSyncFilterForm(reset)
    setSyncFilters(reset)
    setSyncPage(0)
  }

  return (
    <div
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      <section style={sectionStyle}>
        <SectionHeader
          title="Allowed domains"
          subtitle="Combined list of storefront domains allowed for guest user onboarding."
          onRefresh={loadAllowedDomains}
          refreshing={allowedLoading}
        />
        {allowedError && <ErrorBanner message={allowedError} />}
        <div style={cardsGridStyle}>
          <DomainListCard
            title="Active domains"
            values={allowedSummary?.allowed_domains ?? []}
            emptyText="No domains merged yet."
          />
          <DomainListCard
            title="Config domains"
            values={allowedSummary?.config_domains ?? []}
            emptyText="No domains configured in env."
          />
          <DomainListCard
            title="Database domains"
            values={allowedSummary?.database_domains ?? []}
            emptyText="No domains managed in CMS."
          />
          <DomainListCard
            title="Domain extensions"
            values={allowedSummary?.domain_extensions ?? []}
            emptyText="No domain extensions recorded."
          />
        </div>
      </section>

      <section style={sectionStyle}>
        <SectionHeader
          title="Guest verification audit"
          subtitle="Track SAP guest verification attempts and outcomes."
          onRefresh={() => {
            void loadAudits()
          }}
          refreshing={auditLoading}
        />
        {auditError && <ErrorBanner message={auditError} />}

        <form style={filterRowStyle} onSubmit={handleAuditFilterSubmit}>
          <div style={filterFieldStyle}>
            <label htmlFor="audit-email">Email</label>
            <input
              id="audit-email"
              type="email"
              placeholder="guest@domain.com"
              value={auditFilterForm.email}
              onChange={(event) =>
                setAuditFilterForm((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
            />
          </div>
          <div style={filterFieldStyle}>
            <label htmlFor="audit-success">Result</label>
            <select
              id="audit-success"
              value={auditFilterForm.success}
              onChange={(event) =>
                setAuditFilterForm((prev) => ({
                  ...prev,
                  success: event.target.value,
                }))
              }
            >
              <option value="">All</option>
              <option value="true">Success</option>
              <option value="false">Failed</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <button type="submit" disabled={auditLoading}>
              Apply
            </button>
            <button
              type="button"
              onClick={handleAuditFilterReset}
              disabled={auditLoading}
            >
              Reset
            </button>
          </div>
        </form>

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Result</th>
                <th style={thStyle}>Message</th>
                <th style={thStyle}>Metadata</th>
                <th style={thStyle}>Created</th>
              </tr>
            </thead>
            <tbody>
              {auditLoading ? (
                <EmptyRow message="Loading audits..." colSpan={5} />
              ) : !auditData || auditData.audits.length === 0 ? (
                <EmptyRow message="No guest verifications recorded." colSpan={5} />
              ) : (
                auditData.audits.map((audit) => (
                  <tr key={audit.id}>
                    <td style={tdStyle}>{audit.email}</td>
                    <td style={tdStyle}>
                      <StatusBadge success={audit.success} />
                    </td>
                    <td style={tdStyle}>{audit.message ?? "-"}</td>
                    <td style={{ ...tdStyle, maxWidth: "320px" }}>
                      {formatMetadata(audit.metadata)}
                    </td>
                    <td style={tdStyle}>{formatDate(audit.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          count={auditData?.count ?? 0}
          limit={auditData?.limit ?? AUDIT_LIMIT}
          offset={auditData?.offset ?? auditPage * AUDIT_LIMIT}
          page={auditPage}
          totalPages={auditTotalPages}
          onPageChange={setAuditPage}
          disabled={auditLoading}
        />
      </section>

      <section style={sectionStyle}>
        <SectionHeader
          title="SAP customer sync"
          subtitle="Represents the SAP sync status for guest conversions."
          onRefresh={() => {
            void loadCustomerSync()
          }}
          refreshing={syncLoading}
        />
        {syncError && <ErrorBanner message={syncError} />}

        <form style={filterRowStyle} onSubmit={handleSyncFilterSubmit}>
          <div style={filterFieldStyle}>
            <label htmlFor="sync-email">Email</label>
            <input
              id="sync-email"
              type="email"
              placeholder="guest@domain.com"
              value={syncFilterForm.email}
              onChange={(event) =>
                setSyncFilterForm((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
            />
          </div>
          <div style={filterFieldStyle}>
            <label htmlFor="sync-status">SAP Sync</label>
            <select
              id="sync-status"
              value={syncFilterForm.sap_sync}
              onChange={(event) =>
                setSyncFilterForm((prev) => ({
                  ...prev,
                  sap_sync: event.target.value,
                }))
              }
            >
              <option value="">All</option>
              <option value="true">Completed</option>
              <option value="false">Pending</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <button type="submit" disabled={syncLoading}>
              Apply
            </button>
            <button
              type="button"
              onClick={handleSyncFilterReset}
              disabled={syncLoading}
            >
              Reset
            </button>
          </div>
        </form>

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Customer ID</th>
                <th style={thStyle}>SAP Sync</th>
                <th style={thStyle}>SAP Code</th>
                <th style={thStyle}>SAP Synced</th>
                <th style={thStyle}>Created</th>
                <th style={thStyle}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {syncLoading ? (
                <EmptyRow message="Loading SAP sync records..." colSpan={7} />
              ) : !syncData || syncData.records.length === 0 ? (
                <EmptyRow message="No SAP sync records match the filters." colSpan={7} />
              ) : (
                syncData.records.map((record) => (
                  <tr key={record.id}>
                    <td style={tdStyle}>{record.customer_email}</td>
                    <td style={tdStyle}>{record.customer_id ?? "-"}</td>
                    <td style={tdStyle}>
                      <StatusBadge success={record.sap_sync} />
                    </td>
                    <td style={tdStyle}>{record.sap_customer_code ?? "-"}</td>
                    <td style={tdStyle}>{formatDate(record.sap_synced_at)}</td>
                    <td style={tdStyle}>{formatDate(record.created_at)}</td>
                    <td style={tdStyle}>{formatDate(record.updated_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          count={syncData?.count ?? 0}
          limit={syncData?.limit ?? CUSTOMER_SYNC_LIMIT}
          offset={syncData?.offset ?? syncPage * CUSTOMER_SYNC_LIMIT}
          page={syncPage}
          totalPages={syncTotalPages}
          onPageChange={setSyncPage}
          disabled={syncLoading}
        />
      </section>
    </div>
  )
}

const sectionStyle: React.CSSProperties = {
  border: "1px solid #eff0f2",
  borderRadius: "12px",
  padding: "20px",
  background: "#fff",
  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
}

const cardsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
}

const filterRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
  alignItems: "flex-end",
}

const filterFieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
}

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 600,
  fontSize: "14px",
}

const tdStyle: React.CSSProperties = {
  padding: "10px",
  borderBottom: "1px solid #f1f1f1",
  fontSize: "14px",
  verticalAlign: "top",
}

const SectionHeader: React.FC<{
  title: string
  subtitle?: string
  onRefresh?: () => void
  refreshing?: boolean
}> = ({ title, subtitle, onRefresh, refreshing }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "16px",
    }}
  >
    <div>
      <h2 style={{ margin: 0, fontSize: "18px" }}>{title}</h2>
      {subtitle && (
        <p style={{ margin: "4px 0 0", color: "#6b7280" }}>{subtitle}</p>
      )}
    </div>
    {onRefresh && (
      <button type="button" onClick={onRefresh} disabled={refreshing}>
        {refreshing ? "Refreshing..." : "Refresh"}
      </button>
    )}
  </div>
)

const DomainListCard: React.FC<{
  title: string
  values: string[]
  emptyText: string
}> = ({ title, values, emptyText }) => (
  <div
    style={{
      border: "1px solid #e7e9ee",
      borderRadius: "10px",
      padding: "12px",
      minHeight: "160px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <strong>{title}</strong>
      <span style={{ color: "#6b7280", fontSize: "12px" }}>
        {values.length} item{values.length === 1 ? "" : "s"}
      </span>
    </div>
    {values.length === 0 ? (
      <p style={{ margin: 0, color: "#9ca3af", fontSize: "14px" }}>{emptyText}</p>
    ) : (
      <ul
        style={{
          margin: 0,
          paddingLeft: "18px",
          maxHeight: "140px",
          overflowY: "auto",
          color: "#111827",
        }}
      >
        {values.map((value) => (
          <li key={value} style={{ fontSize: "14px", marginBottom: "4px" }}>
            {value}
          </li>
        ))}
      </ul>
    )}
  </div>
)

const StatusBadge: React.FC<{ success: boolean }> = ({ success }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "2px 8px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 600,
      color: success ? "#065f46" : "#991b1b",
      background: success ? "#d1fae5" : "#fee2e2",
    }}
  >
    {success ? "Success" : "Failed"}
  </span>
)

const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
  <div
    style={{
      background: "#fef2f2",
      border: "1px solid #fecaca",
      borderRadius: "8px",
      padding: "10px 12px",
      color: "#991b1b",
    }}
  >
    {message}
  </div>
)

const PaginationControls: React.FC<{
  count: number
  limit: number
  offset: number
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
}> = ({
  count,
  limit,
  offset,
  page,
  totalPages,
  onPageChange,
  disabled = false,
}) => {
  const start = count === 0 ? 0 : offset + 1
  const end = Math.min(offset + limit, count)

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "12px",
        flexWrap: "wrap",
        gap: "8px",
      }}
    >
      <span style={{ color: "#6b7280", fontSize: "13px" }}>
        Showing {start} - {end} of {count} records
      </span>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={disabled || page === 0}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={disabled || page >= totalPages - 1}
        >
          Next
        </button>
      </div>
    </div>
  )
}

const EmptyRow: React.FC<{ message: string; colSpan: number }> = ({
  message,
  colSpan,
}) => (
  <tr>
    <td colSpan={colSpan} style={{ ...tdStyle, textAlign: "center" }}>
      {message}
    </td>
  </tr>
)

function formatMetadata(metadata: Record<string, unknown>): string {
  const entries = Object.entries(metadata || {})
  if (!entries.length) {
    return "-"
  }

  const preview = entries.slice(0, 3).map(([key, value]) => {
    if (typeof value === "object" && value !== null) {
      return `${key}: ${JSON.stringify(value)}`
    }
    return `${key}: ${String(value)}`
  })

  if (entries.length > preview.length) {
    preview.push(`+${entries.length - preview.length} more`)
  }

  return preview.join(", ")
}

function formatDate(value?: string | null): string {
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

export default GuestUserRegisterPage
