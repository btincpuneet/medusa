import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useState } from "react"

const AttributeAddPage: React.FC = () => {
  const [formData, setFormData] = useState({
    attribute_code: "",
    label: "",
    attribute_type: "text",
    entity_type: "product",
    is_required: false,
    is_unique: false,
    is_filterable: false,
    is_searchable: true,
    is_variant: false,
    is_system: false,
    validation_rules: "",
    default_value: "",
    sort_order: 0
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const attributeTypes = [
    { value: "text", label: "Text" },
    { value: "decimal", label: "Decimal" },
    { value: "integer", label: "Integer" },
    { value: "boolean", label: "Boolean" },
    { value: "select", label: "Select" },
    { value: "multiselect", label: "Multiselect" },
    { value: "date", label: "Date" },
    { value: "datetime", label: "Datetime" },
    { value: "media", label: "Media" }
  ]

  const entityTypes = [
    { value: "product", label: "Product" },
    { value: "category", label: "Category" },
    { value: "customer", label: "Customer" }
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/admin/mp/attributes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      
      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          if (formData.attribute_type === 'select' || formData.attribute_type === 'multiselect') {
            window.location.href = `/app/mp-attribute-options/${data.attribute.id}`
          } else {
            window.location.href = "/app/catalog/attributes"
          }
        }, 1500)
      } else {
        setError(data.message || "Failed to create attribute")
      }
    } catch (err: any) {
      setError(err.message || "Network error")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (window.confirm("Are you sure? All changes will be lost.")) {
      window.location.href = "/app/catalog/attributes"
    }
  }

  return (
    <div style={pageWrapper}>
      {/* Header */}
      <div style={header}>
        <h1 style={title}>Add New Attribute</h1>
        <button style={backBtn} onClick={() => window.history.back()}>
          ← Back
        </button>
      </div>

      {success && (
        <div style={successAlert}>
          ✓ Attribute created successfully! Redirecting...
        </div>
      )}

      {error && (
        <div style={errorAlert}>
          ✗ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={formGrid}>
          {/* Basic Information Card */}
          <div style={card}>
            <h3 style={cardTitle}>Basic Information</h3>
            
            <div style={formGroup}>
              <label style={label}>
                Attribute Code *
                <span style={hint}>Unique identifier (lowercase, underscores)</span>
              </label>
              <input
                type="text"
                name="attribute_code"
                value={formData.attribute_code}
                onChange={handleChange}
                style={input}
                placeholder="e.g., color, size, price"
                required
                pattern="[a-z_]+"
                title="Lowercase letters and underscores only"
              />
            </div>

            <div style={formGroup}>
              <label style={label}>
                Label *
                <span style={hint}>Display name for the attribute</span>
              </label>
              <input
                type="text"
                name="label"
                value={formData.label}
                onChange={handleChange}
                style={input}
                placeholder="e.g., Color, Size, Price"
                required
              />
            </div>

            <div style={formRow}>
              <div style={formGroupHalf}>
                <label style={label}>Attribute Type *</label>
                <select
                  name="attribute_type"
                  value={formData.attribute_type}
                  onChange={handleChange}
                  style={select}
                  required
                >
                  {attributeTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={formGroupHalf}>
                <label style={label}>Entity Type *</label>
                <select
                  name="entity_type"
                  value={formData.entity_type}
                  onChange={handleChange}
                  style={select}
                  required
                >
                  {entityTypes.map(entity => (
                    <option key={entity.value} value={entity.value}>
                      {entity.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Settings Card */}
          <div style={card}>
            <h3 style={cardTitle}>Settings</h3>
            
            <div style={checkboxGrid}>
              <div style={checkboxGroup}>
                <input
                  type="checkbox"
                  id="is_required"
                  name="is_required"
                  checked={formData.is_required}
                  onChange={handleChange}
                  style={checkbox}
                />
                <label htmlFor="is_required" style={checkboxLabel}>
                  <strong>Required</strong>
                  <span style={checkboxHint}>Attribute must have a value</span>
                </label>
              </div>

              <div style={checkboxGroup}>
                <input
                  type="checkbox"
                  id="is_unique"
                  name="is_unique"
                  checked={formData.is_unique}
                  onChange={handleChange}
                  style={checkbox}
                />
                <label htmlFor="is_unique" style={checkboxLabel}>
                  <strong>Unique</strong>
                  <span style={checkboxHint}>Values must be unique across products</span>
                </label>
              </div>

              <div style={checkboxGroup}>
                <input
                  type="checkbox"
                  id="is_filterable"
                  name="is_filterable"
                  checked={formData.is_filterable}
                  onChange={handleChange}
                  style={checkbox}
                />
                <label htmlFor="is_filterable" style={checkboxLabel}>
                  <strong>Filterable</strong>
                  <span style={checkboxHint}>Show in layered navigation</span>
                </label>
              </div>

              <div style={checkboxGroup}>
                <input
                  type="checkbox"
                  id="is_searchable"
                  name="is_searchable"
                  checked={formData.is_searchable}
                  onChange={handleChange}
                  style={checkbox}
                />
                <label htmlFor="is_searchable" style={checkboxLabel}>
                  <strong>Searchable</strong>
                  <span style={checkboxHint}>Include in search results</span>
                </label>
              </div>

              <div style={checkboxGroup}>
                <input
                  type="checkbox"
                  id="is_variant"
                  name="is_variant"
                  checked={formData.is_variant}
                  onChange={handleChange}
                  style={checkbox}
                />
                <label htmlFor="is_variant" style={checkboxLabel}>
                  <strong>Variant</strong>
                  <span style={checkboxHint}>Used for product variants</span>
                </label>
              </div>

              <div style={checkboxGroup}>
                <input
                  type="checkbox"
                  id="is_system"
                  name="is_system"
                  checked={formData.is_system}
                  onChange={handleChange}
                  style={checkbox}
                />
                <label htmlFor="is_system" style={checkboxLabel}>
                  <strong>System</strong>
                  <span style={checkboxHint}>Cannot be deleted</span>
                </label>
              </div>
            </div>
          </div>

          {/* Advanced Card */}
          <div style={card}>
            <h3 style={cardTitle}>Advanced</h3>
            
            <div style={formGroup}>
              <label style={label}>
                Validation Rules (JSON)
                <span style={hint}>Optional validation rules</span>
              </label>
              <textarea
                name="validation_rules"
                value={formData.validation_rules}
                onChange={handleChange}
                style={textarea}
                placeholder='{"min": 0, "max": 100}'
                rows={3}
              />
            </div>

            <div style={formGroup}>
              <label style={label}>
                Default Value
                <span style={hint}>Pre-filled value for new products</span>
              </label>
              <input
                type="text"
                name="default_value"
                value={formData.default_value}
                onChange={handleChange}
                style={input}
                placeholder="Default value"
              />
            </div>

            <div style={formGroup}>
              <label style={label}>
                Sort Order
                <span style={hint}>Display order in forms</span>
              </label>
              <input
                type="number"
                name="sort_order"
                value={formData.sort_order}
                onChange={handleChange}
                style={input}
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div style={formActions}>
          <button
            type="button"
            onClick={handleCancel}
            style={cancelBtn}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={submitBtn}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Attribute"}
          </button>
          {(formData.attribute_type === 'select' || formData.attribute_type === 'multiselect') && (
            <button
              type="submit"
              name="add_options"
              style={submitWithOptionsBtn}
              disabled={loading}
              title="Create attribute and add options"
            >
              {loading ? "Creating..." : "Create & Add Options"}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

/* --------------------------------------------
                 Styles
--------------------------------------------- */
const pageWrapper = {
  padding: "20px",
  width: "100%",
  margin: "0 auto",
  fontFamily: "Inter, sans-serif",
}

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 30,
}

const title = {
  fontSize: 28,
  fontWeight: 700,
  color: "#1c1c1c",
  margin: 0,
}

const backBtn = {
  padding: "8px 16px",
  background: "white",
  border: "1px solid #d0d0d0",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: "14px",
}

const successAlert = {
  backgroundColor: "#d4edda",
  color: "#155724",
  padding: "12px 16px",
  borderRadius: "6px",
  marginBottom: "20px",
  border: "1px solid #c3e6cb",
}

const errorAlert = {
  backgroundColor: "#f8d7da",
  color: "#721c24",
  padding: "12px 16px",
  borderRadius: "6px",
  marginBottom: "20px",
  border: "1px solid #f5c6cb",
}

const formGrid = {
  display: "grid",
  gap: "20px",
  marginBottom: "30px",
}

const card = {
  backgroundColor: "white",
  borderRadius: "10px",
  padding: "24px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  border: "1px solid #f0f0f0",
}

const cardTitle = {
  fontSize: "18px",
  fontWeight: 600,
  color: "#333",
  marginTop: 0,
  marginBottom: "20px",
  paddingBottom: "12px",
  borderBottom: "2px solid #f0f0f0",
}

const formGroup = {
  marginBottom: "20px",
}

const formRow = {
  display: "flex",
  gap: "20px",
  marginBottom: "20px",
}

const formGroupHalf = {
  flex: 1,
}

const label = {
  display: "block",
  marginBottom: "8px",
  fontSize: "14px",
  fontWeight: 500,
  color: "#333",
}

const hint = {
  display: "block",
  fontSize: "12px",
  color: "#666",
  fontWeight: "normal",
  marginTop: "4px",
}

const input = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "6px",
  border: "1px solid #ddd",
  fontSize: "14px",
  boxSizing: "border-box" as const,
}

const select = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "6px",
  border: "1px solid #ddd",
  fontSize: "14px",
  backgroundColor: "white",
}

const textarea = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "6px",
  border: "1px solid #ddd",
  fontSize: "14px",
  fontFamily: "monospace",
  resize: "vertical" as const,
  minHeight: "60px",
}

const checkboxGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: "16px",
}

const checkboxGroup = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
}

const checkbox = {
  marginTop: "4px",
}

const checkboxLabel = {
  fontSize: "14px",
  color: "#333",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column" as const,
}

const checkboxHint = {
  fontSize: "12px",
  color: "#666",
  fontWeight: "normal",
  marginTop: "2px",
}

const formActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  paddingTop: "20px",
  borderTop: "1px solid #eee",
}

const cancelBtn = {
  padding: "10px 20px",
  background: "white",
  border: "1px solid #d0d0d0",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 500,
}

const submitBtn = {
  padding: "10px 24px",
  background: "#1f72ff",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 600,
}

const submitWithOptionsBtn = {
  padding: "10px 24px",
  background: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 600,
}

/* Sidebar Label */
export const config = defineRouteConfig({
  label: "Add Attribute",
})

export default AttributeAddPage