import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

type AttributeOption = {
  id: number
  attribute_id: number
  value: string
  label: string
  meta: string
  swatch_type: string
  swatch_value: string
  sort_order: number
  is_default: boolean
  created_at: string
  updated_at: string
}

const AttributeOptionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const attributeId = parseInt(id || "0")
  
  const [options, setOptions] = useState<AttributeOption[]>([])
  const [attribute, setAttribute] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<AttributeOption>>({})
  const [newOption, setNewOption] = useState({
    value: "",
    label: "",
    swatch_type: "text",
    swatch_value: "",
    sort_order: 0,
    is_default: false
  })

  const swatchTypes = [
    { value: "text", label: "Text" },
    { value: "color", label: "Color" },
    { value: "image", label: "Image" }
  ]

  useEffect(() => {
    fetchAttributeAndOptions()
  }, [attributeId])

  const fetchAttributeAndOptions = async () => {
    setLoading(true)
    try {
      // Fetch attribute details
      const attrRes = await fetch(`/admin/mp/attributes/${attributeId}`, {
        credentials: "include"
      })
      const attrData = await attrRes.json()
      
      if (attrData.success) {
        setAttribute(attrData.attribute)
      } else {
        throw new Error("Failed to load attribute")
      }

      // Fetch options
      const optRes = await fetch(`/admin/mp/attributes/${attributeId}/options`, {
        credentials: "include"
      })
      const optData = await optRes.json()
      
      if (optData.success) {
        setOptions(optData.options || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddOption = async () => {
    if (!newOption.value.trim()) {
      alert("Value is required")
      return
    }

    try {
      const res = await fetch(`/admin/mp/attributes/${attributeId}/options`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newOption)
      })

      const data = await res.json()
      
      if (data.success) {
        setOptions([...options, data.option])
        setNewOption({
          value: "",
          label: "",
          swatch_type: "text",
          swatch_value: "",
          sort_order: options.length * 10,
          is_default: false
        })
      } else {
        alert(data.message || "Failed to add option")
      }
    } catch (err: any) {
      alert("Error: " + err.message)
    }
  }

  const startEdit = (option: AttributeOption) => {
    setEditingId(option.id)
    setEditForm({ ...option })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const saveEdit = async () => {
    if (!editingId) return

    try {
      const res = await fetch(`/admin/mp/attributes/${attributeId}/options/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editForm)
      })

      const data = await res.json()
      
      if (data.success) {
        setOptions(options.map(opt => 
          opt.id === editingId ? { ...opt, ...editForm } : opt
        ))
        setEditingId(null)
        setEditForm({})
      } else {
        alert(data.message || "Failed to update option")
      }
    } catch (err: any) {
      alert("Error: " + err.message)
    }
  }

  const handleDelete = async (optionId: number) => {
    if (!confirm("Are you sure you want to delete this option?")) {
      return
    }

    try {
      const res = await fetch(`/admin/mp/attributes/${attributeId}/options/${optionId}`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await res.json()
      
      if (data.success) {
        setOptions(options.filter(opt => opt.id !== optionId))
      } else {
        alert(data.message || "Failed to delete option")
      }
    } catch (err: any) {
      alert("Error: " + err.message)
    }
  }

  const handleSetDefault = async (optionId: number) => {
    try {
      const res = await fetch(`/admin/mp/attributes/${attributeId}/options/${optionId}/set-default`, {
        method: "POST",
        credentials: "include",
      })

      const data = await res.json()
      
      if (data.success) {
        setOptions(options.map(opt => ({
          ...opt,
          is_default: opt.id === optionId
        })))
      }
    } catch (err: any) {
      alert("Error: " + err.message)
    }
  }

  const renderSwatch = (option: AttributeOption) => {
    if (option.swatch_type === "color" && option.swatch_value) {
      return (
        <div style={{
          width: "24px",
          height: "24px",
          borderRadius: "4px",
          backgroundColor: option.swatch_value,
          border: "1px solid #ddd"
        }} />
      )
    } else if (option.swatch_type === "image" && option.swatch_value) {
      return (
        <img
          src={option.swatch_value}
          alt=""
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "4px",
            objectFit: "cover",
            border: "1px solid #ddd"
          }}
        />
      )
    }
    return null
  }

  if (loading) {
    return <div style={loadingStyle}>Loading...</div>
  }

  if (error) {
    return <div style={errorStyle}>{error}</div>
  }

  if (!attribute) {
    return <div style={errorStyle}>Attribute not found</div>
  }

  return (
    <div style={pageWrapper}>
      {/* Header */}
      <div style={header}>
        <div>
          <h1 style={title}>
            {attribute.label} Options
            <span style={subtitle}>({attribute.attribute_code})</span>
          </h1>
          <p style={description}>Manage options for {attribute.attribute_type} attribute</p>
        </div>
        
        <div style={headerButtons}>
          <button style={backBtn} onClick={() => window.history.back()}>
            ← Back
          </button>
          {/* <button style={backToAttributesBtn} onClick={() => window.location.href = "/app/mp-attributes"}>
            All Attributes
          </button> */}
        </div>
      </div>

      {/* Add New Option Card */}
      <div style={card}>
        <h3 style={cardTitle}>Add New Option</h3>
        
        <div style={addForm}>
          <div style={formRow}>
            <div style={formGroup}>
              <label style={label}>Value *</label>
              <input
                type="text"
                value={newOption.value}
                onChange={(e) => setNewOption({...newOption, value: e.target.value})}
                style={input}
                placeholder="e.g., red, blue, large"
              />
            </div>
            
            <div style={formGroup}>
              <label style={label}>Label</label>
              <input
                type="text"
                value={newOption.label}
                onChange={(e) => setNewOption({...newOption, label: e.target.value})}
                style={input}
                placeholder="Display name (optional)"
              />
            </div>
          </div>

          <div style={formRow}>
            <div style={formGroup}>
              <label style={label}>Swatch Type</label>
              <select
                value={newOption.swatch_type}
                onChange={(e) => setNewOption({...newOption, swatch_type: e.target.value})}
                style={select}
              >
                {swatchTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            
            <div style={formGroup}>
              <label style={label}>
                {newOption.swatch_type === 'color' ? 'Color Code' : 
                 newOption.swatch_type === 'image' ? 'Image URL' : 'Text'}
              </label>
              <input
                type="text"
                value={newOption.swatch_value}
                onChange={(e) => setNewOption({...newOption, swatch_value: e.target.value})}
                style={input}
                placeholder={newOption.swatch_type === 'color' ? '#FF0000' : 
                           newOption.swatch_type === 'image' ? 'https://...' : 'Text value'}
              />
            </div>
          </div>

          <div style={formRow}>
            <div style={formGroup}>
              <label style={label}>Sort Order</label>
              <input
                type="number"
                value={newOption.sort_order}
                onChange={(e) => setNewOption({...newOption, sort_order: parseInt(e.target.value)})}
                style={input}
                min="0"
              />
            </div>
            
            <div style={formGroup}>
              <label style={checkboxLabelInline}>
                <input
                  type="checkbox"
                  checked={newOption.is_default}
                  onChange={(e) => setNewOption({...newOption, is_default: e.target.checked})}
                  style={checkbox}
                />
                Set as default option
              </label>
            </div>
          </div>

          <div style={formActions}>
            <button onClick={handleAddOption} style={addButton}>
              + Add Option
            </button>
          </div>
        </div>
      </div>

      {/* Options List Card */}
      <div style={card}>
        <h3 style={cardTitle}>
          Existing Options ({options.length})
        </h3>
        
        {options.length === 0 ? (
          <div style={emptyState}>
            <p>No options added yet. Add your first option above.</p>
          </div>
        ) : (
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Value</th>
                <th style={th}>Label</th>
                <th style={th}>Swatch</th>
                <th style={th}>Sort Order</th>
                <th style={th}>Default</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...options].sort((a, b) => a.sort_order - b.sort_order).map(option => (
                <tr key={option.id} style={tableRow}>
                  {editingId === option.id ? (
                    <>
                      <td style={td}>
                        <input
                          type="text"
                          value={editForm.value || ""}
                          onChange={(e) => setEditForm({...editForm, value: e.target.value})}
                          style={editInput}
                        />
                      </td>
                      <td style={td}>
                        <input
                          type="text"
                          value={editForm.label || ""}
                          onChange={(e) => setEditForm({...editForm, label: e.target.value})}
                          style={editInput}
                        />
                      </td>
                      <td style={td}>
                        <select
                          value={editForm.swatch_type || "text"}
                          onChange={(e) => setEditForm({...editForm, swatch_type: e.target.value})}
                          style={editSelect}
                        >
                          {swatchTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </td>
                      <td style={td}>
                        <input
                          type="number"
                          value={editForm.sort_order || 0}
                          onChange={(e) => setEditForm({...editForm, sort_order: parseInt(e.target.value)})}
                          style={editInput}
                        />
                      </td>
                      <td style={td}>
                        <input
                          type="checkbox"
                          checked={editForm.is_default || false}
                          onChange={(e) => setEditForm({...editForm, is_default: e.target.checked})}
                          style={checkbox}
                        />
                      </td>
                      <td style={td}>
                        <button onClick={saveEdit} style={saveBtn}>
                          Save
                        </button>
                        <button onClick={cancelEdit} style={cancelBtnSmall}>
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={td}>
                        <strong>{option.value}</strong>
                      </td>
                      <td style={td}>
                        {option.label || "-"}
                      </td>
                      <td style={td}>
                        <div style={swatchCell}>
                          {renderSwatch(option)}
                          <span style={swatchType}>
                            {option.swatch_type}
                          </span>
                        </div>
                      </td>
                      <td style={td}>
                        {option.sort_order}
                      </td>
                      <td style={td}>
                        {option.is_default ? (
                          <span style={defaultBadge}>✓ Default</span>
                        ) : (
                          <button 
                            onClick={() => handleSetDefault(option.id)}
                            style={setDefaultBtn}
                          >
                            Set Default
                          </button>
                        )}
                      </td>
                      <td style={td}>
                        <div style={actionButtons}>
                          <button 
                            onClick={() => startEdit(option)}
                            style={editBtnSmall}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(option.id)}
                            style={deleteBtnSmall}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
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

const subtitle = {
  fontSize: "16px",
  color: "#666",
  fontWeight: "normal",
}

const description = {
  fontSize: "14px",
  color: "#666",
  marginTop: "8px",
}

const headerButtons = {
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

const backToAttributesBtn = {
  padding: "8px 16px",
  background: "#f8f9fa",
  border: "1px solid #d0d0d0",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: "14px",
  color: "#555",
}

const card = {
  backgroundColor: "white",
  borderRadius: "10px",
  padding: "24px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  border: "1px solid #f0f0f0",
  marginBottom: "20px",
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

const addForm = {
  marginBottom: "10px",
}

const formRow = {
  display: "flex",
  gap: "20px",
  marginBottom: "16px",
}

const formGroup = {
  flex: 1,
}

const label = {
  display: "block",
  marginBottom: "8px",
  fontSize: "14px",
  fontWeight: 500,
  color: "#333",
}

const input = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "6px",
  border: "1px solid #ddd",
  fontSize: "14px",
}

const select = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "6px",
  border: "1px solid #ddd",
  fontSize: "14px",
  backgroundColor: "white",
}

const checkboxLabelInline = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "14px",
  color: "#333",
  cursor: "pointer",
  marginTop: "24px",
}

const checkbox = {
  margin: 0,
}

const formActions = {
  marginTop: "20px",
}

const addButton = {
  padding: "10px 24px",
  background: "#1f72ff",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 600,
}

const table = {
  width: "100%",
  borderCollapse: "collapse" as const,
}

const th = {
  padding: "12px",
  textAlign: "left" as const,
  fontWeight: 600,
  color: "#555",
  fontSize: "14px",
  borderBottom: "2px solid #eee",
}

const td = {
  padding: "12px",
  fontSize: "14px",
  color: "#333",
  verticalAlign: "middle" as const,
  borderBottom: "1px solid #f0f0f0",
}

const tableRow = {
  "&:hover": {
    backgroundColor: "#fafafa",
  }
}

const swatchCell = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
}

const swatchType = {
  fontSize: "12px",
  color: "#666",
}

const defaultBadge = {
  padding: "4px 8px",
  backgroundColor: "#4CAF50",
  color: "white",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: 600,
}

const setDefaultBtn = {
  padding: "4px 8px",
  backgroundColor: "transparent",
  color: "#4CAF50",
  border: "1px solid #4CAF50",
  borderRadius: "4px",
  fontSize: "12px",
  cursor: "pointer",
}

const actionButtons = {
  display: "flex",
  gap: "8px",
}

const editBtnSmall = {
  padding: "4px 8px",
  fontSize: "12px",
  borderRadius: "4px",
  border: "1px solid #2196F3",
  background: "#E3F2FD",
  color: "#2196F3",
  cursor: "pointer",
}

const deleteBtnSmall = {
  padding: "4px 8px",
  fontSize: "12px",
  borderRadius: "4px",
  border: "1px solid #F44336",
  background: "#FFEBEE",
  color: "#F44336",
  cursor: "pointer",
}

const editInput = {
  padding: "6px 8px",
  borderRadius: "4px",
  border: "1px solid #ddd",
  fontSize: "14px",
  width: "100%",
}

const editSelect = {
  padding: "6px 8px",
  borderRadius: "4px",
  border: "1px solid #ddd",
  fontSize: "14px",
  width: "100%",
  backgroundColor: "white",
}

const saveBtn = {
  padding: "4px 8px",
  fontSize: "12px",
  borderRadius: "4px",
  border: "1px solid #4CAF50",
  background: "#4CAF50",
  color: "white",
  cursor: "pointer",
  marginRight: "4px",
}

const cancelBtnSmall = {
  padding: "4px 8px",
  fontSize: "12px",
  borderRadius: "4px",
  border: "1px solid #999",
  background: "white",
  color: "#333",
  cursor: "pointer",
}

const emptyState = {
  padding: "40px 20px",
  textAlign: "center" as const,
  color: "#666",
}

const loadingStyle = {
  padding: "40px",
  textAlign: "center" as const,
  fontSize: "16px",
  color: "#666",
}

const errorStyle = {
  padding: "40px",
  textAlign: "center" as const,
  fontSize: "16px",
  color: "#F44336",
}

/* Sidebar Label */
export const config = defineRouteConfig({
  label: "Attribute Options",
})

export default AttributeOptionsPage