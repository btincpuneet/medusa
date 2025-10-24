import { defineRouteConfig } from "@medusajs/admin-sdk"
import React from "react"
import { Link } from "react-router-dom"

type ModuleLink = {
  label: string
  path: string
  description?: string
}

const MODULES: ModuleLink[] = [
  { label: "Manage Domain", path: "/redington-domains" },
  { label: "Manage Domain Extension", path: "/redington-domain-extensions" },
  { label: "Manage Company Code", path: "/redington-company-codes" },
  { label: "Manage Access Mapping", path: "/redington-access-mappings" },
  { label: "Manage Currency Mapping", path: "/redington-currency-mappings" },
  { label: "Manage Customer Number", path: "/redington-customer-numbers" },
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
  { label: "Admin Roles", path: "/redington-admin-roles" },
  { label: "CMS Pages", path: "/redington-cms-pages" },
  { label: "Cookie Policies", path: "/redington-cookie-policies" },
  { label: "Coupons", path: "/redington-coupons" },
  { label: "Domain Authentication", path: "/redington-domain-authentication" },
  { label: "Domain Out-of-Stock Control", path: "/redington-domain-out-of-stock" },
  { label: "Partner Console", path: "/redington-partner-dashboard" },
]

const RedingtonPage: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 32,
        padding: 32,
      }}
    >
      <header>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Redington</h1>
        <p style={{ margin: "12px 0 0 0", color: "#475569", lineHeight: 1.6 }}>
          Access the Redington-specific management tools migrated from Magento.
          Select a module below to open the detailed interface.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        }}
      >
        {MODULES.map((module) => (
          <Link
            key={module.path}
            to={module.path}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "18px 20px",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              background: "#fff",
              color: "inherit",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
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
              target.style.boxShadow = "0 4px 14px rgba(15, 23, 42, 0.08)"
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 16 }}>{module.label}</span>
            {module.description ? (
              <span style={{ fontSize: 13, color: "#64748b" }}>
                {module.description}
              </span>
            ) : null}
          </Link>
        ))}
      </section>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Redington",
})

export default RedingtonPage
