import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

type CouponRule = {
  id: number
  coupon_code: string
  company_code: string
  domain_id: number
  domain_extention_id: number | null
  is_active: boolean
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

type CouponResponse = {
  coupon_rules?: CouponRule[]
  coupon_rule?: CouponRule
  message?: string
}

type DomainOption = {
  id: number
  domain_name: string
}

type DomainsResponse = {
  domains?: DomainOption[]
}

type DomainExtention = {
  id: number
  domain_extention_name: string
  status: boolean
}

type DomainExtentionResponse = {
  domain_extentions?: DomainExtention[]
}

const initialForm = {
  coupon_code: "",
  company_code: "",
  domain_id: "",
  domain_extention_id: "",
  is_active: "true",
  metadata: "",
}

const RedingtonCouponsPage: React.FC = () => {
  const [rules, setRules] = useState<CouponRule[]>([])
  const [domains, setDomains] = useState<DomainOption[]>([])
  const [extentions, setExtentions] = useState<DomainExtention[]>([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const sortedRules = useMemo(() => {
    return [...rules].sort((a, b) => {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }, [rules])

  const domainLabel = useCallback(
    (domainId: number) => {
      const match = domains.find((domain) => domain.id === domainId)
      return match ? match.domain_name : `Domain #${domainId}`
    },
    [domains]
  )

  const extentionLabel = useCallback(
    (extentionId: number | null) => {
      if (!extentionId) {
        return "—"
      }
      const match = extentions.find((ext) => ext.id === extentionId)
      return match ? match.domain_extention_name : `Extension #${extentionId}`
    },
    [extentions]
  )

  const loadRules = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/admin/redington/coupons", {
        credentials: "include",
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as CouponResponse
        throw new Error(
          body?.message || `Failed to load coupon rules (${response.status})`
        )
      }

      const body = (await response.json()) as CouponResponse
      setRules(body.coupon_rules ?? [])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load coupon rules."
      setError(message)
      setRules([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadDomains = useCallback(async () => {
    try {
      const response = await fetch("/admin/redington/domains", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to load domains (${response.status})`)
      }

      const body = (await response.json()) as DomainsResponse
      setDomains(body.domains ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load domains."
      setError(message)
      setDomains([])
    }
  }, [])

  const loadDomainExtentions = useCallback(async () => {
    try {
      const response = await fetch("/admin/redington/domain-extensions", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to load domain extensions (${response.status})`)
      }

      const body = (await response.json()) as DomainExtentionResponse
      setExtentions(body.domain_extentions ?? [])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load domain extensions."
      setError(message)
      setExtentions([])
    }
  }, [])

  useEffect(() => {
    void loadRules()
    void loadDomains()
    void loadDomainExtentions()
  }, [loadRules, loadDomains, loadDomainExtentions])

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
    setError(null)
    setStatus(null)
  }

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const parseMetadata = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed.length) {
      return {}
    }

    try {
      const parsed = JSON.parse(trimmed)
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
      throw new Error("Metadata must be a JSON object.")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Metadata must be valid JSON."
      throw new Error(message)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const couponCode = form.coupon_code.trim()
    const companyCode = form.company_code.trim()
    const domainIdRaw = form.domain_id.trim()

    if (!couponCode || !companyCode || !domainIdRaw) {
      setError("Coupon code, company code, and domain are required.")
      return
    }

    const domainId = Number.parseInt(domainIdRaw, 10)
    if (!Number.isFinite(domainId)) {
      setError("Domain selection is invalid.")
      return
    }

    const domainExtRaw = form.domain_extention_id.trim()
    const domainExtentionId = domainExtRaw
      ? Number.parseInt(domainExtRaw, 10)
      : null
    if (domainExtRaw && !Number.isFinite(Number(domainExtentionId))) {
      setError("Domain extension selection is invalid.")
      return
    }

    let metadata: Record<string, unknown>
    try {
      metadata = parseMetadata(form.metadata)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Metadata must be valid JSON.")
      return
    }

    const payload = {
      coupon_code: couponCode,
      company_code: companyCode,
      domain_id: domainId,
      domain_extention_id: domainExtentionId,
      is_active: form.is_active === "true",
      metadata,
    }

    setIsSubmitting(true)
    setError(null)
    setStatus(null)

    const isEdit = editingId !== null
    const url = isEdit
      ? `/admin/redington/coupons/${editingId}`
      : "/admin/redington/coupons"

    try {
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const body = (await response.json().catch(() => ({}))) as CouponResponse

      if (!response.ok) {
        throw new Error(
          body?.message ||
            (isEdit
              ? "Failed to update coupon rule."
              : "Failed to create coupon rule.")
        )
      }

      setStatus(isEdit ? "Coupon rule updated." : "Coupon rule created.")
      resetForm()
      await loadRules()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : isEdit
          ? "Unable to update coupon rule."
          : "Unable to create coupon rule."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (rule: CouponRule) => {
    setEditingId(rule.id)
    setForm({
      coupon_code: rule.coupon_code,
      company_code: rule.company_code,
      domain_id: String(rule.domain_id),
      domain_extention_id: rule.domain_extention_id
        ? String(rule.domain_extention_id)
        : "",
      is_active: rule.is_active ? "true" : "false",
      metadata: JSON.stringify(rule.metadata ?? {}, null, 2),
    })
    setStatus(null)
    setError(null)
  }

  const handleDelete = async (rule: CouponRule) => {
    if (
      !window.confirm(
        `Delete coupon ${rule.coupon_code} for ${domainLabel(rule.domain_id)}?`
      )
    ) {
      return
    }

    setError(null)
    setStatus(null)

    try {
      const response = await fetch(`/admin/redington/coupons/${rule.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as CouponResponse
        throw new Error(
          body?.message || `Failed to delete coupon rule (${response.status})`
        )
      }

      if (editingId === rule.id) {
        resetForm()
      }

      setStatus("Coupon rule deleted.")
      await loadRules()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to delete coupon rule."
      setError(message)
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "24px",
      }}
    >
      <header>
        <h1 style={{ marginBottom: "8px" }}>Coupon Customization</h1>
        <p style={{ margin: 0, color: "#555" }}>
          Configure coupon rules synced between Medusa and Magento.
        </p>
      </header>

      <section
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #e5e5e5",
          padding: "24px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          {editingId ? "Edit Coupon Rule" : "Create Coupon Rule"}
        </h2>

        {error ? (
          <div style={{ marginBottom: "16px", color: "#a80000" }}>{error}</div>
        ) : null}
        {status ? (
          <div style={{ marginBottom: "16px", color: "#0a7f46" }}>{status}</div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: "16px",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span>Coupon Code</span>
              <input
                name="coupon_code"
                value={form.coupon_code}
                onChange={handleChange}
                placeholder="COUPON2025"
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span>Company Code</span>
              <input
                name="company_code"
                value={form.company_code}
                onChange={handleChange}
                placeholder="Company identifier"
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span>Domain</span>
              <select
                name="domain_id"
                value={form.domain_id}
                onChange={handleChange}
              >
                <option value="">Select domain</option>
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.domain_name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span>Domain Extension (optional)</span>
              <select
                name="domain_extention_id"
                value={form.domain_extention_id}
                onChange={handleChange}
              >
                <option value="">None</option>
                {extentions.map((ext) => (
                  <option key={ext.id} value={ext.id}>
                    {ext.domain_extention_name}
                    {!ext.status ? " (inactive)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span>Status</span>
              <select
                name="is_active"
                value={form.is_active}
                onChange={handleChange}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span>Metadata (JSON object)</span>
            <textarea
              name="metadata"
              value={form.metadata}
              onChange={handleChange}
              rows={6}
              placeholder='{"channel": "online"}'
            />
          </label>

          <div style={{ display: "flex", gap: "12px" }}>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : editingId ? "Update Rule" : "Create Rule"}
            </button>
            {editingId ? (
              <button type="button" onClick={resetForm}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #e5e5e5",
          padding: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <h2 style={{ margin: 0 }}>Existing Rules</h2>
          {isLoading ? <span>Loading…</span> : null}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={headerCellStyle}>Coupon</th>
                <th style={headerCellStyle}>Company</th>
                <th style={headerCellStyle}>Domain</th>
                <th style={headerCellStyle}>Extension</th>
                <th style={headerCellStyle}>Status</th>
                <th style={headerCellStyle}>Updated</th>
                <th style={headerCellStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!sortedRules.length ? (
                <tr>
                  <td style={cellStyle} colSpan={7}>
                    {isLoading ? "Loading coupon rules…" : "No coupon rules configured."}
                  </td>
                </tr>
              ) : (
                sortedRules.map((rule) => (
                  <tr key={rule.id}>
                    <td style={cellStyle}>{rule.coupon_code}</td>
                    <td style={cellStyle}>{rule.company_code}</td>
                    <td style={cellStyle}>{domainLabel(rule.domain_id)}</td>
                    <td style={cellStyle}>{extentionLabel(rule.domain_extention_id)}</td>
                    <td style={cellStyle}>{rule.is_active ? "Active" : "Inactive"}</td>
                    <td style={cellStyle}>{formatDate(rule.updated_at)}</td>
                    <td style={{ ...cellStyle, display: "flex", gap: "8px" }}>
                      <button onClick={() => handleEdit(rule)}>Edit</button>
                      <button
                        onClick={() => handleDelete(rule)}
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
      </section>
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

export default RedingtonCouponsPage
