import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Heading, Text } from "@medusajs/ui"
import React, { useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"

import { useRedingtonAccess } from "../../hooks/useRedingtonAccess"

type ModuleLink = {
  label: string
  path: string
  description?: string
  permission?: string
  partnerAccessible?: boolean
}

const MODULES: ModuleLink[] = [
  { label: "Manage Domain", path: "/redington-domains", partnerAccessible: true },
  { label: "Manage Domain Extension", path: "/redington-domain-extensions", partnerAccessible: true },
  { label: "Manage Company Code", path: "/redington-company-codes", partnerAccessible: true },
  { label: "Manage Access Mapping", path: "/redington-access-mappings", partnerAccessible: true },
  { label: "Manage Currency Mapping", path: "/redington-currency-mappings" },
  { label: "Manage Subscription Codes", path: "/redington-subscription-codes" },
  {
    label: "SAP Integration",
    path: "/redington-sap-integration",
    description: "Sync stock and orders with the SAP ERP.",
    permission: "sap_integration.manage",
    partnerAccessible: true,
  },
  { label: "Category Restriction", path: "/redington-category-restriction" },
  { label: "Manage Banners", path: "/redington-banner-sliders" },
  { label: "Manage Customer Number", path: "/redington-customer-numbers", partnerAccessible: true },
  { label: "Auto Invoice Email", path: "/redington-auto-invoice-email" },
  { label: "View Customer Enquiry", path: "/redington-get-in-touch" },
  { label: "Manage Product Pricing", path: "/redington-product-pricing" },
  { label: "Manage Maximum Order Quantity", path: "/redington-max-qty" },
  { label: "Manage Order CC Email", path: "/redington-order-cc-email" },
  { label: "Out-of-Stock Product Enquiry", path: "/redington-out-of-stock-enquiry" },
  { label: "Guest User Register", path: "/redington-guest-user-register" },
  { label: "Home Video", path: "/redington-home-video" },
  { label: "Invoice Lookup", path: "/redington-invoice" },
  { label: "Log Viewer", path: "/redington-log" },
  { label: "Order Returns", path: "/redington-order-returns" },
  { label: "Order Shipment", path: "/redington-order-shipment" },
  { label: "OTP Functionality", path: "/redington-otp" },
  { label: "Payment Integration", path: "/redington-payment-integration" },
  { label: "Retain Cart Settings", path: "/redington-retain-cart" },
  { label: "Product Enhancements", path: "/redington-product" },
  { label: "Product Description Import", path: "/redington-product-desc" },
  { label: "Add BCC Value", path: "/redington-add-bcc" },
  { label: "Admin Roles", path: "/redington-admin-roles", permission: "admin_roles.manage" },
  { label: "CMS Pages", path: "/redington-cms-pages" },
  { label: "Cookie Policies", path: "/redington-cookie-policies" },
  { label: "Coupons", path: "/redington-coupons" },
  { label: "Domain Authentication", path: "/redington-domain-authentication" },
  { label: "Domain Out-of-Stock Control", path: "/redington-domain-out-of-stock" },
  {
    label: "Partner Console",
    path: "/redington-partner-dashboard",
    description: "See what partners experience.",
    permission: "partner_console.view",
    partnerAccessible: true,
  },
]

const LinkCard: React.FC<{ module: ModuleLink }> = ({ module }) => {
  return (
    <Link
      to={module.path}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        borderRadius: 12,
        padding: "18px 20px",
        border: "1px solid #e2e8f0",
        background: "#fff",
        color: "inherit",
        textDecoration: "none",
        boxShadow: "0 4px 10px rgba(15, 23, 42, 0.08)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={(event) => {
        const target = event.currentTarget
        target.style.transform = "translateY(-2px)"
        target.style.boxShadow = "0 10px 24px rgba(15, 23, 42, 0.12)"
      }}
      onMouseLeave={(event) => {
        const target = event.currentTarget
        target.style.transform = ""
        target.style.boxShadow = "0 4px 10px rgba(15, 23, 42, 0.08)"
      }}
    >
      <span style={{ fontWeight: 600, fontSize: 16 }}>{module.label}</span>
      {module.description ? (
        <span style={{ fontSize: 13, color: "#64748b" }}>{module.description}</span>
      ) : null}
    </Link>
  )
}

const RedingtonPage: React.FC = () => {
  const { loading, error, refresh, permissions, loginMode, isSuperAdmin } =
    useRedingtonAccess()
  const navigate = useNavigate()

  const isPartnerMode = loginMode === "partner" && !isSuperAdmin

  const hasPermission = useMemo(() => {
    const granted = permissions ?? []
    return (permission?: string) => {
      if (!permission) {
        return true
      }
      if (granted.includes("*") || isSuperAdmin) {
        return true
      }
      return granted.includes(permission)
    }
  }, [permissions, isSuperAdmin])

  const visibleModules = useMemo(() => {
    return MODULES.filter((module) => {
      if (isPartnerMode && !module.partnerAccessible) {
        return false
      }
      return hasPermission(module.permission)
    })
  }, [hasPermission, isPartnerMode])

  const accessCopy = isPartnerMode
    ? "Partner mode shows only the tabs assigned to you. Ask your administrator to grant additional permissions if needed."
    : "Select a Redington tool to manage domains, SAP sync, pricing, and partner access."

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 32 }}>
      <header>
          <Heading level="h1">Redington</Heading>
          <Text style={{ color: "#475569", marginTop: 8 }}>{accessCopy}</Text>
        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button variant="secondary" size="sm" onClick={refresh}>
            Refresh access
          </Button>
        </div>
        {error ? (
          <div style={{ marginTop: 12 }}>
            <Text style={{ color: "#dc2626" }}>{error}</Text>
          </div>
        ) : null}
      </header>

      {loading ? (
        <Text>Loading modules…</Text>
      ) : visibleModules.length ? (
        <section
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          {visibleModules.map((module) => (
            <LinkCard key={module.path} module={module} />
          ))}
        </section>
      ) : (
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: "1px dashed #cbd5f5",
            background: "#f8fafc",
          }}
        >
          <Text style={{ marginBottom: 8 }}>No Redington tools are available.</Text>
          <Text style={{ color: "#475569" }}>
            Verify your permissions via the Admin Roles screen or contact a Redington administrator.
          </Text>
        </div>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Redington",
})

export default RedingtonPage
