import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useState } from "react"

type CustomerForm = {
  first_name: string
  last_name: string
  email: string
  phone: string
  // Remove account_status from form since Medusa doesn't accept it
}

const AddCustomerPage: React.FC = () => {
  const [form, setForm] = useState<CustomerForm>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    // Remove account_status from state
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    if (!form.email || !form.first_name || !form.last_name) {
      setError("Email, first name, and last name are required")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/admin/customers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form), // Only sends fields that Medusa expects
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to create customer")
      }

      if (!data.success) {
        throw new Error(data.message)
      }

      setSuccess("Customer added successfully!")
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={wrapper}>
      <div style={header}>
        <h1 style={title}>Add New Customer</h1>

        <button style={backBtn} onClick={() => window.history.back()}>
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} style={formBox}>
        {error && (
          <div style={errorAlert}>
            <strong>Error:</strong> {error}
          </div>
        )}
        {success && (
          <div style={successAlert}>
            <strong>Success:</strong> {success}
          </div>
        )}

        <div style={requiredNote}>
          Fields marked with <span style={requiredStar}>*</span> are required
        </div>

        {/* First Name */}
        <FormField label="First Name" required>
          <input
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            style={input}
            required
            placeholder="Enter first name"
          />
        </FormField>

        {/* Last Name */}
        <FormField label="Last Name" required>
          <input
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            style={input}
            required
            placeholder="Enter last name"
          />
        </FormField>

        {/* Email */}
        <FormField label="Email" required>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            style={input}
            required
            placeholder="Enter email address"
          />
        </FormField>

        {/* Phone */}
        <FormField label="Phone">
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            style={input}
            placeholder="Enter phone number (optional)"
          />
        </FormField>

        {/* Status Info Note - Removed the select but kept info */}
        <div style={infoNote}>
          <strong>Note:</strong> All new customers will be created with "Active" status by default.
          You can change the status later in the customer management section.
        </div>

        <button 
          style={submitBtn} 
          disabled={loading || !form.email || !form.first_name || !form.last_name}
          type="submit"
        >
          {loading ? "Saving..." : "Save Customer"}
        </button>
      </form>
    </div>
  )
}

const FormField: React.FC<{ 
  label: string; 
  required?: boolean;
  children: React.ReactNode 
}> = ({
  label,
  required = false,
  children,
}) => (
  <div style={fieldRow}>
    <label style={labelStyle}>
      {label}
      {required && <span style={requiredStar}> *</span>}
    </label>
    {children}
  </div>
)

/* ------------------------------ Styles ------------------------------ */
const wrapper = { 
  padding: "24px", 
  fontFamily: "Inter, sans-serif",
  Width: "100%",
  // margin: "0 auto"
}

const header = { 
  display: "flex", 
  justifyContent: "space-between", 
  alignItems: "center",
  marginBottom: 30 
}

const title = { 
  fontSize: 28, 
  fontWeight: 700,
  margin: 0
}

const backBtn = {
  padding: "8px 14px",
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
  fontSize: 14
}

const formBox = {
  background: "#fff",
  padding: 30,
  borderRadius: 10,
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  border: "1px solid #e5e7eb"
}

const fieldRow = {
  display: "flex",
  alignItems: "center",
  marginBottom: 20,
  gap: 20,
}

const labelStyle = {
  width: 180,
  fontWeight: 600,
  fontSize: 14
}

const input = {
  flex: 1,
  padding: "12px",
  borderRadius: 8,
  border: "1px solid #ddd",
  fontSize: 15,
  minWidth: 300
}

const requiredNote = {
  fontSize: 14,
  color: "#666",
  marginBottom: 20,
  fontStyle: "italic"
}

const requiredStar = {
  color: "#ef4444"
}

const infoNote = {
  background: "#f0f9ff",
  border: "1px solid #bae6fd",
  color: "#0369a1",
  padding: "12px 16px",
  borderRadius: 8,
  marginBottom: 20,
  fontSize: 14,
  lineHeight: 1.5
}

const errorAlert = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#dc2626",
  padding: "12px 16px",
  borderRadius: 8,
  marginBottom: 20,
  fontSize: 14
}

const successAlert = {
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  color: "#16a34a",
  padding: "12px 16px",
  borderRadius: 8,
  marginBottom: 20,
  fontSize: 14
}

const submitBtn = {
  width: "100%",
  padding: 14,
  background: "#1f72ff",
  color: "#fff",
  border: 0,
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 16,
  marginTop: 10
}

export const config = defineRouteConfig({
  path: "/redington-customer-add",
})

export default AddCustomerPage