import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useEffect, useState } from "react"

type CategoryNode = {
  id: number
  name: string
  parent_id?: number | null
  children?: CategoryNode[]
}

type FormType = {
  name: string
  parent_id: number | null
}

const AddCategoryPage: React.FC = () => {
  const [form, setForm] = useState<FormType>({
    name: "",
    parent_id: null,
  })
  const [openNodes, setOpenNodes] = useState<Record<number, boolean>>({})
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // ---------------------------------------------------
  // Fetch Categories for Parent Selection
  // ---------------------------------------------------
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch("/admin/product/category", { credentials: "include" })
      const data = await res.json()
      
      if (data.success) {
        setCategories(data.categories ?? [])
      } else {
        throw new Error(data.error || "Failed to load categories")
      }
    } catch (err) {
      console.error("Failed to load categories", err)
      setError("Failed to load categories")
    } finally {
      setLoadingCategories(false)
    }
  }

  // ---------------------------------------------------
  // Form Handler
  // ---------------------------------------------------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setForm((prev) => ({ ...prev, name: value }))
  }

  // ---------------------------------------------------
  // Toggle category tree nodes
  // ---------------------------------------------------
  const toggleOpen = (id: number) => {
    setOpenNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // ---------------------------------------------------
  // Select Parent Category
  // ---------------------------------------------------
  const selectParentCategory = (id: number | null) => {
    setForm((prev) => ({
      ...prev,
      parent_id: id
    }))
  }

  // ---------------------------------------------------
  // Recursive Category Tree Node for Parent Selection
  // ---------------------------------------------------
  const TreeNode: React.FC<{ node: CategoryNode }> = ({ node }) => {
    const hasChildren = node.children?.length
    const isOpen = openNodes[node.id] || false
    const isSelected = form.parent_id === node.id

    return (
      <div style={{ marginLeft: node.parent_id ? 18 : 0, marginBottom: 4 }}>
        
        {/* Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            backgroundColor: isSelected ? "#e3f2fd" : "transparent",
            padding: "4px 8px",
            borderRadius: "4px",
            border: isSelected ? "1px solid #1f72ff" : "1px solid transparent",
          }}
          onClick={() => selectParentCategory(node.id)}
        >
          <div
            style={{
              width: 14,
              userSelect: "none",
              textAlign: "center",
            }}
            onClick={(e) => {
              e.stopPropagation()
              if (hasChildren) toggleOpen(node.id)
            }}
          >
            {hasChildren ? (isOpen ? "▾" : "▸") : ""}
          </div>

          <span style={{ userSelect: "none" }}>{node.name}</span>
          {isSelected && <span style={{ marginLeft: "auto", color: "#1f72ff" }}>✓</span>}
        </div>

        {/* Children */}
        {isOpen &&
          hasChildren &&
          node.children!.map((child) => (
            <TreeNode key={child.id} node={child} />
          ))}
      </div>
    )
  }

  // ---------------------------------------------------
  // Submit Handler
  // ---------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validate form
      if (!form.name.trim()) {
        throw new Error("Category name is required")
      }

      const res = await fetch("/admin/product/category", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          parent_id: form.parent_id,
          status: true, // Default to active
          source: 'medusa' // Default to active
        }),
      })

      const data = await res.json()
      
      if (!data.success) {
        throw new Error(data.error || "Failed to create category")
      }

      setSuccess("Category Added!")
      
      // Reset form
      setForm({
        name: "",
        parent_id: null,
      })
      
      // Refresh categories list
      fetchCategories()
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={wrapper}>
      <div style={header}>
        <h1 style={title}>Add New Category</h1>
        <button style={backBtn} onClick={() => window.history.back()}>
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} style={formBox}>
        {error && <div style={errorText}>{error}</div>}
        {success && <div style={successText}>{success}</div>}

        {/* Category Name - Field 1 */}
        <FormField label="Category Name">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            style={input}
            placeholder="Enter category name"
            required
          />
        </FormField>

        {/* Parent Category Selection - Field 2 */}
        <FormField label="Parent Category (Optional)">
          {loadingCategories ? (
            <p>Loading categories...</p>
          ) : (
            <div style={treeBox}>
              {/* Option for no parent (root category) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                  backgroundColor: form.parent_id === null ? "#e3f2fd" : "transparent",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  border: form.parent_id === null ? "1px solid #1f72ff" : "1px solid transparent",
                  marginBottom: "8px",
                }}
                onClick={() => selectParentCategory(null)}
              >
                <span style={{ userSelect: "none" }}>↳ Root Category (No Parent)</span>
                {form.parent_id === null && <span style={{ marginLeft: "auto", color: "#1f72ff" }}>✓</span>}
              </div>

              {/* Category Tree */}
              {categories.map((cat) => (
                <TreeNode key={cat.id} node={cat} />
              ))}
              
              {categories.length === 0 && (
                <p style={{ color: "#666", fontStyle: "italic" }}>
                  No existing categories found. This will be created as a root category.
                </p>
              )}
            </div>
          )}
        </FormField>

        {/* Submit */}
        <button 
          style={submitBtn} 
          disabled={loading || !form.name.trim()}
          type="submit"
        >
          {loading ? "Creating..." : "Create Category"}
        </button>
      </form>
    </div>
  )
}

// --------------------------------------------
// Reusable Form Row
// --------------------------------------------
const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={fieldRow}>
    <label style={labelStyle}>{label}</label>
    <div style={inputContainer}>
      {children}
    </div>
  </div>
)

// --------------------------------------------
// Styles
// --------------------------------------------
const wrapper: React.CSSProperties = {
  padding: "24px",
  fontFamily: "Inter, sans-serif",
  // maxWidth: "800px",
  width: "100%",
  margin: "0 auto",
}

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
}

const title = {
  fontSize: "28px",
  fontWeight: 700,
  margin: 0,
}

const backBtn = {
  padding: "8px 14px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  background: "#fff",
  cursor: "pointer",
  fontSize: "14px",
}

const formBox = {
  background: "#fff",
  padding: "25px",
  borderRadius: "10px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
}

const fieldRow = {
  display: "flex",
  marginBottom: "18px",
  gap: "20px",
}

const labelStyle = {
  width: "180px",
  fontWeight: 600,
  paddingTop: "12px",
}

const inputContainer = {
  flex: 1,
}

const input = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "15px",
  boxSizing: "border-box" as const,
}

const treeBox = {
  border: "1px solid #ccc",
  borderRadius: "8px",
  padding: "12px",
  maxHeight: "300px",
  overflowY: "auto" as const,
  backgroundColor: "#fafafa",
}

const errorText = { 
  color: "#d32f2f", 
  backgroundColor: "#ffebee",
  padding: "12px",
  borderRadius: "6px",
  border: "1px solid #ffcdd2",
  marginBottom: "16px",
}

const successText = { 
  color: "#2e7d32", 
  backgroundColor: "#e8f5e9",
  padding: "12px",
  borderRadius: "6px",
  border: "1px solid #c8e6c9",
  marginBottom: "16px",
}

const submitBtn = {
  width: "100%",
  padding: "12px",
  background: "#1f72ff",
  color: "#fff",
  border: 0,
  borderRadius: "8px",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "16px",
  marginTop: "10px",
}

export const config = defineRouteConfig({
  path: "/redington-category-add",
})

export default AddCategoryPage