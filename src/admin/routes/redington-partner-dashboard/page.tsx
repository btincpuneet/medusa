import { defineRouteConfig } from "@medusajs/admin-sdk"
import React from "react"

import { useRedingtonAccess } from "../../hooks/useRedingtonAccess"

const PartnerDashboardPage: React.FC = () => {
  const {
    loading,
    error,
    refresh,
    isSuperAdmin,
    accessibleDomains,
    partnerAssignments,
    roles,
    permissions,
    loginMode,
  } = useRedingtonAccess()

  const partnerRoleNames = partnerAssignments
    .map((assignment) => assignment.role?.role_name)
    .filter(Boolean)
    .join(", ")

  if (loading) {
    return <p style={{ padding: 24 }}>Loading partner access…</p>
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <h1 style={{ marginBottom: 12 }}>Partner Console</h1>
        <div style={errorStyle}>
          <div style={{ flex: 1 }}>{error}</div>
          <button type="button" onClick={refresh} style={ghostButtonStyle}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (isSuperAdmin) {
    return (
      <div style={containerStyle}>
        <h1 style={{ marginBottom: 12 }}>Partner Console</h1>
        <p style={{ color: "#4b5563" }}>
          You are currently signed in as a Super Admin. This space previews what partners will
          see. Switch to a partner account to experience the restricted view.
        </p>
        {renderSummary({
          domains: accessibleDomains,
          roles,
          partnerRoleNames,
          permissions,
        })}
      </div>
    )
  }

  if (loginMode !== "partner") {
    return (
      <div style={containerStyle}>
        <h1 style={{ marginBottom: 12 }}>Partner Console</h1>
        <div style={attentionStyle}>
          <strong>Partner mode required.</strong>
          <span>
            This console is only available when you sign in as a partner. Use the Partner option on
            the login screen if you have partner access.
          </span>
        </div>
      </div>
    )
  }

  if (!partnerAssignments.length) {
    return (
      <div style={containerStyle}>
        <h1 style={{ marginBottom: 12 }}>Partner Console</h1>
        <div style={attentionStyle}>
          <strong>No partner access is currently assigned.</strong>
          <span>
            Ask your Redington administrator to assign a partner role and domain before returning
            here.
          </span>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Partner Console</h1>
          <p style={{ margin: 0, color: "#4b5563" }}>
            Manage the catalog, pricing, and inventory scoped to your assigned domain(s).
          </p>
        </div>
        <button type="button" onClick={refresh} style={ghostButtonStyle}>
          Refresh
        </button>
      </header>

      {renderSummary({
        domains: accessibleDomains,
        roles,
        partnerRoleNames,
        permissions,
      })}

      <section style={cardGridStyle}>
        <PartnerCard
          title="Catalog"
          description="Review and request catalog changes for your assigned domain."
          href="/admin/redington/domain-based-authentication"
        />
        <PartnerCard
          title="Pricing"
          description="Adjust partner-specific product pricing within your domain."
          href="/admin/redington/currency-mappings"
        />
        <PartnerCard
          title="Inventory"
          description="Track inventory levels and availability for your assortment."
          href="/admin/redington/access-mappings"
        />
      </section>

      <section style={infoBlockStyle}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Need a feature?</h2>
        <p style={{ margin: "8px 0 0", color: "#4b5563" }}>
          This console is scoped for partners. If you require additional tools (orders, promotions,
          analytics), contact your Redington representative. Super Admins can see all data through
          the regular dashboard.
        </p>
      </section>
    </div>
  )
}

type SummaryProps = {
  domains: Array<{ id: number | null; label: string }>
  roles: Array<{ id: number; role_name: string }>
  partnerRoleNames: string
  permissions: string[]
}

function renderSummary({ domains, roles, partnerRoleNames, permissions }: SummaryProps) {
  return (
    <section style={summaryGridStyle}>
      <div style={summaryCardStyle}>
        <span style={summaryLabelStyle}>Domains</span>
        <strong style={summaryValueStyle}>
          {domains.length ? domains.map((domain) => domain.label).join(", ") : "None"}
        </strong>
      </div>
      <div style={summaryCardStyle}>
        <span style={summaryLabelStyle}>Active Roles</span>
        <strong style={summaryValueStyle}>
          {partnerRoleNames || roles.map((role) => role.role_name).join(", ")}
        </strong>
      </div>
      <div style={summaryCardStyle}>
        <span style={summaryLabelStyle}>Permissions</span>
        <strong style={{ ...summaryValueStyle, fontSize: 14 }}>
          {permissions.length ? permissions.join(", ") : "Inherited from role"}
        </strong>
      </div>
    </section>
  )
}

type PartnerCardProps = {
  title: string
  description: string
  href: string
}

const PartnerCard: React.FC<PartnerCardProps> = ({ title, description, href }) => (
  <a href={href} style={partnerCardStyle}>
    <div>
      <h3 style={{ margin: "0 0 8px" }}>{title}</h3>
      <p style={{ margin: 0, color: "#4b5563" }}>{description}</p>
    </div>
    <span style={{ fontWeight: 600, color: "#4338ca" }}>Open</span>
  </a>
)

const containerStyle: React.CSSProperties = {
  padding: 24,
  display: "flex",
  flexDirection: "column",
  gap: 24,
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
}

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
}

const summaryCardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 16,
  background: "#f9fafb",
  display: "flex",
  flexDirection: "column",
  gap: 8,
}

const summaryLabelStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#6b7280",
}

const summaryValueStyle: React.CSSProperties = {
  fontSize: 16,
  color: "#111827",
}

const cardGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 16,
}

const partnerCardStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: 16,
  textDecoration: "none",
  color: "#111827",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  background: "#ffffff",
  boxShadow: "0px 1px 2px rgba(15, 23, 42, 0.08)",
}

const errorStyle: React.CSSProperties = {
  border: "1px solid #fca5a5",
  borderRadius: 8,
  padding: 16,
  background: "#fef2f2",
  color: "#b91c1c",
  display: "flex",
  alignItems: "center",
  gap: 16,
}

const attentionStyle: React.CSSProperties = {
  border: "1px solid #c7d2fe",
  background: "#eef2ff",
  color: "#312e81",
  borderRadius: 8,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 8,
}

const ghostButtonStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 6,
  background: "#fff",
  padding: "6px 12px",
  cursor: "pointer",
}

const infoBlockStyle: React.CSSProperties = {
  border: "1px dashed #cbd5f5",
  borderRadius: 8,
  padding: 16,
  background: "#f8fafc",
}

export const config = defineRouteConfig({})

export default PartnerDashboardPage
