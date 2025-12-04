import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"

const AttributeEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
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
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [originalData, setOriginalData] = useState<any>(null)

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

  /* --------------------------------------------
               Fetch Attribute Data
  --------------------------------------------- */
  useEffect(() => {
    const fetchAttribute = async () => {
      try {
        setFetching(true)
        setError(null)
        
        const res = await fetch(`/admin/mp/attributes/${id}`, {
          credentials: "include",
        })

        const data = await res.json()
        
        if (!data.success) {
          throw new Error(data.message || "Failed to fetch attribute")
        }

        const attribute = data.attribute
        
        // Format validation_rules if it's an object
        let validationRules = attribute.validation_rules
        if (validationRules && typeof validationRules === 'object') {
          validationRules = JSON.stringify(validationRules, null, 2)
        }

        setFormData({
          attribute_code: attribute.attribute_code || "",
          label: attribute.label || "",
          attribute_type: attribute.attribute_type || "text",
          entity_type: attribute.entity_type || "product",
          is_required: attribute.is_required || false,
          is_unique: attribute.is_unique || false,
          is_filterable: attribute.is_filterable || false,
          is_searchable: attribute.is_searchable !== undefined ? attribute.is_searchable : true,
          is_variant: attribute.is_variant || false,
          is_system: attribute.is_system || false,
          validation_rules: validationRules || "",
          default_value: attribute.default_value || "",
          sort_order: attribute.sort_order || 0
        })

        setOriginalData(attribute)
      } catch (err: any) {
        setError(err.message || "Failed to load attribute")
        console.error("Error fetching attribute:", err)
      } finally {
        setFetching(false)
      }
    }

    if (id) {
      fetchAttribute()
    }
  }, [id])

  /* --------------------------------------------
               Handle Form Changes
  --------------------------------------------- */
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

  /* --------------------------------------------
               Handle Form Submission
  --------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Parse validation_rules if it's a JSON string
      let validationRules = formData.validation_rules
      if (validationRules && validationRules.trim() !== "") {
        try {
          validationRules = JSON.parse(validationRules)
        } catch (err) {
          setError("Invalid JSON in validation rules")
          setLoading(false)
          return
        }
      }

      const payload = {
        ...formData,
        validation_rules: validationRules
      }

      const res = await fetch(`/admin/mp/attributes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      
      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate("/app/catalog/attributes")
        }, 1500)
      } else {
        setError(data.message || "Failed to update attribute")
      }
    } catch (err: any) {
      setError(err.message || "Network error")
    } finally {
      setLoading(false)
    }
  }

  /* --------------------------------------------
               Handle Cancel
  --------------------------------------------- */
  const handleCancel = () => {
    if (window.confirm("Are you sure? All changes will be lost.")) {
      navigate("/app/catalog/attributes")
    }
  }

  /* --------------------------------------------
               Check for Changes
  --------------------------------------------- */
  const hasChanges = () => {
    if (!originalData) return false
    
    const fieldsToCheck = [
      'attribute_code', 'label', 'attribute_type', 'entity_type',
      'is_required', 'is_unique', 'is_filterable', 'is_searchable',
      'is_variant', 'validation_rules', 'default_value', 'sort_order'
    ]
    
    return fieldsToCheck.some(field => {
      if (field === 'validation_rules') {
        const formValue = formData[field] || ""
        const originalValue = originalData[field] || ""
        return formValue.trim() !== originalValue
      }
      return formData[field] !== originalData[field]
    })
  }

  /* --------------------------------------------
               Handle Delete
  --------------------------------------------- */
  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete attribute "${formData.label}"?`)) {
      return
    }

    try {
      const res = await fetch(`/admin/mp/attributes/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await res.json()
      
      if (data.success) {
        alert("Attribute deleted successfully")
        navigate("/app/catalog/attributes")
      } else {
        alert(data.message || "Failed to delete attribute")
      }
    } catch (err: any) {
      alert("Error deleting attribute: " + err.message)
    }
  }

  /* --------------------------------------------
               Handle View Options
  --------------------------------------------- */
  const handleViewOptions = () => {
    if (formData.attribute_type === 'select' || formData.attribute_type === 'multiselect') {
      navigate(`/app/catalog/attributes/options/${id}`)
    } else {
      alert(`Options are only available for select and multiselect attribute types. Current type: ${formData.attribute_type}`)
    }
  }

  if (fetching) {
    return (
      <div style={pageWrapper}>
        <div style={loadingContainer}>
          <p style={loadingText}>Loading attribute data...</p>
        </div>
      </div>
    )
  }

  if (error && !originalData) {
    return (
      <div style={pageWrapper}>
        <div style={errorContainer}>
          <h2 style={errorTitle}>Error Loading Attribute</h2>
          <p style={errorMessage}>{error}</p>
          <button 
            style={backBtn}
            onClick={() => navigate("/app/catalog/attributes")}
          >
            ← Back to Attributes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={pageWrapper}>
      {/* Header */}
      <div style={header}>
        <div>
          <h1 style={title}>
            Edit Attribute
            {originalData && (
              <span style={attributeCode}>
                {originalData.attribute_code}
              </span>
            )}
          </h1>
          {originalData && (
            <p style={subtitle}>
              Last updated: {new Date(originalData.updated_at).toLocaleString()}
            </p>
          )}
        </div>
        
        <div style={headerActions}>
          <button 
            style={backBtn} 
            onClick={() => navigate("/catalog/attributes")}
          >
            ← Back to List
          </button>
          
          {(formData.attribute_type === 'select' || formData.attribute_type === 'multiselect') && (
            <button 
              style={optionsBtn}
              onClick={handleViewOptions}
            >
              Manage Options
            </button>
          )}
        </div>
      </div>

      {/* System Attribute Warning */}
      {formData.is_system && (
        <div style={warningAlert}>
          ⚠️ This is a system attribute. Some properties may be restricted.
        </div>
      )}

      {success && (
        <div style={successAlert}>
          ✓ Attribute updated successfully! Redirecting...
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
                disabled={formData.is_system}
              />
              {formData.is_system && (
                <small style={disabledHint}>System attribute code cannot be changed</small>
              )}
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
                  disabled={formData.is_system}
                >
                  {attributeTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {formData.is_system && (
                  <small style={disabledHint}>System attribute type cannot be changed</small>
                )}
              </div>

              <div style={formGroupHalf}>
                <label style={label}>Entity Type *</label>
                <select
                  name="entity_type"
                  value={formData.entity_type}
                  onChange={handleChange}
                  style={select}
                  required
                  disabled={formData.is_system}
                >
                  {entityTypes.map(entity => (
                    <option key={entity.value} value={entity.value}>
                      {entity.label}
                    </option>
                  ))}
                </select>
                {formData.is_system && (
                  <small style={disabledHint}>System entity type cannot be changed</small>
                )}
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
                  disabled={formData.is_system}
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
                  disabled={formData.is_system}
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
                  disabled
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
          {/* <div style={leftActions}>
            {!formData.is_system && (
              <button
                type="button"
                onClick={handleDelete}
                style={deleteBtn}
                disabled={loading}
              >
                Delete Attribute
              </button>
            )}
          </div> */}
          
          <div style={rightActions}>
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
              disabled={loading || !hasChanges()}
              title={!hasChanges() ? "No changes made" : "Save changes"}
            >
              {loading ? "Saving..." : "Update Attribute"}
            </button>
          </div>
        </div>
      </form>

      {/* Attribute Information */}
      {/* {originalData && (
        <div style={infoCard}>
          <h4 style={infoTitle}>Attribute Information</h4>
          <div style={infoGrid}>
            <div style={infoItem}>
              <span style={infoLabel}>ID:</span>
              <span style={infoValue}>{originalData.id}</span>
            </div>
            <div style={infoItem}>
              <span style={infoLabel}>Created:</span>
              <span style={infoValue}>
                {new Date(originalData.created_at).toLocaleString()}
              </span>
            </div>
            <div style={infoItem}>
              <span style={infoLabel}>Last Updated:</span>
              <span style={infoValue}>
                {new Date(originalData.updated_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )} */}
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
  alignItems: "flex-start",
  marginBottom: 30,
  flexWrap: "wrap" as const,
  gap: "20px",
}

const title = {
  fontSize: 28,
  fontWeight: 700,
  color: "#1c1c1c",
  margin: 0,
  display: "flex",
  alignItems: "center",
  gap: "12px",
}

const attributeCode = {
  fontSize: "16px",
  fontWeight: "normal",
  color: "#666",
  backgroundColor: "#f0f0f0",
  padding: "4px 12px",
  borderRadius: "20px",
}

const subtitle = {
  fontSize: "14px",
  color: "#666",
  marginTop: "8px",
  marginBottom: 0,
}

const headerActions = {
  display: "flex",
  gap: "10px",
  alignItems: "center",
}

const backBtn = {
  padding: "8px 16px",
  background: "white",
  border: "1px solid #d0d0d0",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: "14px",
}

const optionsBtn = {
  padding: "8px 16px",
  background: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 500,
}

const warningAlert = {
  backgroundColor: "#fff3cd",
  color: "#856404",
  padding: "12px 16px",
  borderRadius: "6px",
  marginBottom: "20px",
  border: "1px solid #ffeaa7",
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

const loadingContainer = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "400px",
}

const loadingText = {
  fontSize: "16px",
  color: "#666",
}

const errorContainer = {
  textAlign: "center" as const,
  padding: "40px 20px",
}

const errorTitle = {
  fontSize: "20px",
  color: "#dc3545",
  marginBottom: "10px",
}

const errorMessage = {
  fontSize: "16px",
  color: "#666",
  marginBottom: "20px",
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

const disabledHint = {
  display: "block",
  fontSize: "12px",
  color: "#999",
  fontStyle: "italic",
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
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  paddingTop: "20px",
  borderTop: "1px solid #eee",
  flexWrap: "wrap" as const,
}

const leftActions = {
  display: "flex",
  gap: "10px",
}

const rightActions = {
  display: "flex",
  gap: "12px",
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
  "&:disabled": {
    opacity: 0.6,
    cursor: "not-allowed",
  }
}

const deleteBtn = {
  padding: "10px 20px",
  background: "#dc3545",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 500,
}

const infoCard = {
  backgroundColor: "#f8f9fa",
  borderRadius: "10px",
  padding: "20px",
  marginTop: "30px",
  border: "1px solid #e9ecef",
}

const infoTitle = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#495057",
  marginTop: 0,
  marginBottom: "15px",
}

const infoGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "15px",
}

const infoItem = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "5px",
}

const infoLabel = {
  fontSize: "12px",
  color: "#6c757d",
  fontWeight: 500,
  textTransform: "uppercase" as const,
}

const infoValue = {
  fontSize: "14px",
  color: "#212529",
  fontWeight: 500,
}

/* Sidebar Label */
export const config = defineRouteConfig({
  label: "Edit Attribute",
})

export default AttributeEditPage