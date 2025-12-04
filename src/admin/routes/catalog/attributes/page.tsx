import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useEffect, useState, useCallback } from "react"

/* --------------------------------------------
                    Types
--------------------------------------------- */
type Attribute = {
  id: number
  attribute_code: string
  label: string
  attribute_type: string
  entity_type: string
  is_required: boolean
  is_unique: boolean
  is_filterable: boolean
  is_searchable: boolean
  is_variant: boolean
  sort_order: number
  is_system: boolean
  created_at: string
  updated_at: string
}

/* --------------------------------------------
               Native Debounce
--------------------------------------------- */
function debounce(fn: (...args: any[]) => void, delay: number) {
  let timeout: any
  return (...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}

const AttributesPage: React.FC = () => {
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedEntity, setSelectedEntity] = useState<string>("all")


  // Add this function in your component
const handleManageOptions = (attr: Attribute) => {
  if (attr.attribute_type === 'select' || attr.attribute_type === 'multiselect') {
    window.location.href = `/app/catalog/attributes/options/${attr.id}`;
  }
};
  /* --------------------------------------------
            Fetch Attributes (Memoized)
  --------------------------------------------- */
  const fetchAttributes = useCallback(async (query: string = "", type: string = "all", entity: string = "all") => {
    console.log("Fetching attributes with:", { query, type, entity })

    setLoading(true)
    setError(null)

    try {
      const url = new URL(`/admin/mp/attributes`, window.location.origin)

      if (query.trim() !== "") {
        url.searchParams.set("q", query.trim())
      }
      if (type !== "all") {
        url.searchParams.set("type", type)
      }
      if (entity !== "all") {
        url.searchParams.set("entity", entity)
      }

      const res = await fetch(url.toString(), {
        credentials: "include",
      })

      const data = await res.json()
      console.log("API Response:", data)

      if (!data.success) {
        throw new Error(data.message || "API failed")
      }

      setAttributes(data.attributes || [])
    } catch (err: any) {
      setError(err.message || "Unable to load attributes")
    } finally {
      setLoading(false)
    }
  }, [])

  /* --------------------------------------------
            Debounced Search Handler
  --------------------------------------------- */
  const debouncedSearch = useCallback(
    debounce((value: string, type: string, entity: string) => {
      fetchAttributes(value, type, entity)
    }, 350),
    [fetchAttributes]
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    debouncedSearch(value, selectedType, selectedEntity)
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedType(value)
    fetchAttributes(search, value, selectedEntity)
  }

  const handleEntityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedEntity(value)
    fetchAttributes(search, selectedType, value)
  }

  /* --------------------------------------------
               Initial Load
  --------------------------------------------- */
  useEffect(() => {
    fetchAttributes()
  }, [fetchAttributes])

  /* --------------------------------------------
               Delete Attribute
  --------------------------------------------- */
  const handleDelete = async (id: number, attributeCode: string) => {
    if (!confirm(`Are you sure you want to delete attribute "${attributeCode}"?`)) {
      return
    }

    try {
      const res = await fetch(`/admin/mp/attributes/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await res.json()
      
      if (data.success) {
        setAttributes(attributes.filter(attr => attr.id !== id))
        alert("Attribute deleted successfully")
      } else {
        alert(data.message || "Failed to delete attribute")
      }
    } catch (err: any) {
      alert("Error deleting attribute: " + err.message)
    }
  }

  /* --------------------------------------------
               Format Date
  --------------------------------------------- */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  /* --------------------------------------------
               Render Attribute Type Badge
  --------------------------------------------- */
  const renderTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      text: "#4CAF50",
      decimal: "#2196F3",
      integer: "#9C27B0",
      boolean: "#FF9800",
      select: "#E91E63",
      multiselect: "#673AB7",
      date: "#009688",
      datetime: "#795548",
      media: "#607D8B",
    }

    return (
      <span style={{
        padding: "4px 8px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "600",
        backgroundColor: typeColors[type] || "#9E9E9E",
        color: "white",
        textTransform: "uppercase"
      }}>
        {type}
      </span>
    )
  }

  /* --------------------------------------------
               Render Boolean Indicator
  --------------------------------------------- */
  const renderBoolean = (value: boolean) => (
    <span style={{
      color: value ? "#4CAF50" : "#F44336",
      fontWeight: "600"
    }}>
      {value ? "Yes" : "No"}
    </span>
  )

  return (
    <div style={pageWrapper}>

      {/* Header */}
      <div style={header}>
        {/* LEFT — Title */}
        <h1 style={title}>Attributes</h1>

        {/* RIGHT — Back + Add buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={backBtn} onClick={() => window.history.back()}>
            ← Back
          </button>

          <button style={addBtn} onClick={() => (window.location.href = "/app/catalog/attributes/add")}>
            + Add Attribute
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div style={filtersWrapper}>
        <div style={searchWrapper}>
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search attributes by code or label..."
            style={searchInput}
          />
        </div>

        <div style={filterGroup}>
          <div style={filterItem}>
            <label style={filterLabel}>Type:</label>
            <select 
              value={selectedType} 
              onChange={handleTypeChange}
              style={filterSelect}
            >
              <option value="all">All Types</option>
              <option value="text">Text</option>
              <option value="decimal">Decimal</option>
              <option value="integer">Integer</option>
              <option value="boolean">Boolean</option>
              <option value="select">Select</option>
              <option value="multiselect">Multiselect</option>
              <option value="date">Date</option>
              <option value="datetime">Datetime</option>
              <option value="media">Media</option>
            </select>
          </div>

          <div style={filterItem}>
            <label style={filterLabel}>Entity:</label>
            <select 
              value={selectedEntity} 
              onChange={handleEntityChange}
              style={filterSelect}
            >
              <option value="all">All Entities</option>
              <option value="product">Product</option>
              <option value="category">Category</option>
              <option value="customer">Customer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Status */}
      {loading && <p style={loadingText}>Loading attributes…</p>}
      {error && <p style={errorText}>{error}</p>}

      {/* Attributes Table */}
      {!loading && !error && (
        <div style={tableContainer}>
          {attributes.length === 0 ? (
            <div style={emptyState}>
              <p>No attributes found.</p>
              <button 
                style={addBtn} 
                onClick={() => (window.location.href = "/app/catalog/attributes/add")}
              >
                + Create First Attribute
              </button>
            </div>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeader}>
                  <th style={thStyle}>Code</th>
                  <th style={thStyle}>Label</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Entity</th>
                  <th style={thStyle}>Required</th>
                  <th style={thStyle}>Unique</th>
                  <th style={thStyle}>Filterable</th>
                  <th style={thStyle}>Variant</th>
                  <th style={thStyle}>System</th>
                  <th style={thStyle}>Created</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attributes.map((attr) => (
                  <tr key={attr.id} style={tableRow}>
                    <td style={tdStyle}>
                      <strong>{attr.attribute_code}</strong>
                    </td>
                    <td style={tdStyle}>{attr.label}</td>
                    <td style={tdStyle}>{renderTypeBadge(attr.attribute_type)}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        backgroundColor: "#E3F2FD",
                        color: "#1565C0"
                      }}>
                        {attr.entity_type}
                      </span>
                    </td>
                    <td style={tdStyle}>{renderBoolean(attr.is_required)}</td>
                    <td style={tdStyle}>{renderBoolean(attr.is_unique)}</td>
                    <td style={tdStyle}>{renderBoolean(attr.is_filterable)}</td>
                    <td style={tdStyle}>{renderBoolean(attr.is_variant)}</td>
                    <td style={tdStyle}>{renderBoolean(attr.is_system)}</td>
                    <td style={tdStyle}>{formatDate(attr.created_at)}</td>
                    <td style={tdStyle}>
                      <div style={actionButtons}>
                        <button
                          onClick={() => window.location.href = `/app/catalog/attributes/${attr.id}`}
                          style={editBtn}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleManageOptions(attr)}
                          style={optionsBtn}
                          disabled={attr.attribute_type !== 'select' && attr.attribute_type !== 'multiselect'}
                          title={attr.attribute_type === 'select' || attr.attribute_type === 'multiselect' ? "Manage Options" : "Only for select/multiselect types"}
                        >
                          Options
                        </button>
                        {/* <button
                          onClick={() => !attr.is_system && handleDelete(attr.id, attr.attribute_code)}
                          style={deleteBtn}
                          disabled={attr.is_system}
                          title={attr.is_system ? "System attributes cannot be deleted" : "Delete"}
                        >
                          Delete
                        </button> */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Summary */}
      {!loading && !error && attributes.length > 0 && (
        <div style={summary}>
          Total Attributes: {attributes.length}
        </div>
      )}
    </div>
  )
}

/* --------------------------------------------
                 Styles
--------------------------------------------- */
const pageWrapper = {
  padding: "20px",
  margin: "0 auto",
  width: "100%",
  fontFamily: "Inter, sans-serif",
}

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
}

const title = {
  fontSize: 30,
  fontWeight: 700,
  color: "#1c1c1c",
}

const backBtn = {
  padding: "8px 14px",
  background: "white",
  border: "1px solid #d0d0d0",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: "14px",
}

const addBtn = {
  padding: "10px 18px",
  background: "#1f72ff",
  color: "white",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  fontWeight: 500,
  fontSize: "14px",
}

const filtersWrapper = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
  gap: 20,
  flexWrap: "wrap" as const,
}

const searchWrapper = {
  flex: 1,
  minWidth: "300px",
}

const searchInput = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 8,
  border: "1px solid #dcdcdc",
  fontSize: 16,
  outline: "none",
}

const filterGroup = {
  display: "flex",
  gap: 16,
  alignItems: "center",
}

const filterItem = {
  display: "flex",
  alignItems: "center",
  gap: 8,
}

const filterLabel = {
  fontSize: 14,
  fontWeight: 500,
  color: "#555",
}

const filterSelect = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid #dcdcdc",
  fontSize: 14,
  minWidth: "120px",
}

const tableContainer = {
  background: "white",
  borderRadius: 10,
  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
  overflow: "hidden",
  overflowX: "auto" as const,
}

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
}

const tableHeader = {
  backgroundColor: "#f8f9fa",
  borderBottom: "2px solid #e9ecef",
}

const tableRow = {
  borderBottom: "1px solid #f0f0f0",
  "&:hover": {
    backgroundColor: "#fafafa",
  }
}

const thStyle = {
  padding: "16px",
  textAlign: "left" as const,
  fontWeight: 600,
  color: "#555",
  fontSize: "14px",
  whiteSpace: "nowrap" as const,
}

const tdStyle = {
  padding: "16px",
  fontSize: "14px",
  color: "#333",
  verticalAlign: "middle" as const,
}

const actionButtons = {
  display: "flex",
  gap: "8px",
}

const editBtn = {
  padding: "6px 12px",
  fontSize: "12px",
  borderRadius: "4px",
  border: "1px solid #d0d0d0",
  background: "white",
  cursor: "pointer",
  minWidth: "60px",
}

const optionsBtn = {
  padding: "6px 12px",
  fontSize: "12px",
  borderRadius: "4px",
  border: "1px solid #4CAF50",
  background: "#E8F5E9",
  color: "#4CAF50",
  cursor: "pointer",
  minWidth: "70px",
}

const deleteBtn = {
  padding: "6px 12px",
  fontSize: "12px",
  borderRadius: "4px",
  border: "1px solid #F44336",
  background: "#FFEBEE",
  color: "#F44336",
  cursor: "pointer",
  minWidth: "70px",
}

const emptyState = {
  padding: "60px 20px",
  textAlign: "center" as const,
  color: "#666",
}

const loadingText = { 
  fontSize: 16, 
  opacity: 0.7, 
  textAlign: "center" as const,
  padding: "40px" 
}

const errorText = { 
  color: "red", 
  fontSize: 15, 
  textAlign: "center" as const,
  padding: "40px" 
}

const summary = {
  marginTop: 20,
  padding: "12px 16px",
  background: "#f8f9fa",
  borderRadius: 6,
  textAlign: "center" as const,
  color: "#666",
  fontSize: 14,
}

/* Sidebar Label */
export const config = defineRouteConfig({
  label: "Attributes",
})

export default AttributesPage