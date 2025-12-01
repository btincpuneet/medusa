import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"

type CategoryNode = {
  id: number
  name: string
  parent_id?: number | null
  children?: CategoryNode[]
}

type FormType = {
  name: string
  parent_id: number | null
  status: boolean
}

const EditCategoryPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState<FormType>({
    name: "",
    parent_id: null,
    status: true,
  })

  const [openNodes, setOpenNodes] = useState<Record<number, boolean>>({})
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // --------------------------------------------
  // Load existing category
  // --------------------------------------------
  useEffect(() => {
    fetchCategory()
    fetchCategories()
  }, [])

  const fetchCategory = async () => {
    try {
      const res = await fetch(`/admin/mp/product/category/${id}`, {
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) {
        setForm({
          name: data.category.name || "",
          parent_id: data.category.parent_id,
          status: data.category.status,
        })
      } else {
        setError("Failed to load category")
      }
    } catch (err) {
      setError("Failed to load category")
    }
  }

  // --------------------------------------------
  // Fetch category tree list
  // --------------------------------------------
  const fetchCategories = async () => {
    try {
      const res = await fetch("/admin/mp/product/category", { credentials: "include" })
      const data = await res.json()

      if (data.success) {
        setCategories(data.categories ?? [])
      } else {
        throw new Error(data.error || "Failed to load categories")
      }
    } catch (err) {
      setError("Failed to load categories")
    } finally {
      setLoadingCategories(false)
    }
  }

  // --------------------------------------------
  // Tree utility
  // --------------------------------------------
  const toggleOpen = (id: number) => {
    setOpenNodes((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const selectParentCategory = (id: number | null) => {
    setForm((prev) => ({ ...prev, parent_id: id }))
  }

  const TreeNode: React.FC<{ node: CategoryNode }> = ({ node }) => {
    const hasChildren = node.children?.length
    const isOpen = openNodes[node.id] || false
    const isSelected = form.parent_id === node.id

    return (
      <div style={{ marginLeft: node.parent_id ? 18 : 0, marginBottom: 4 }}>
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
            style={{ width: 14, textAlign: "center" }}
            onClick={(e) => {
              e.stopPropagation()
              if (hasChildren) toggleOpen(node.id)
            }}
          >
            {hasChildren ? (isOpen ? "▾" : "▸") : ""}
          </div>

          <span>{node.name}</span>
          {isSelected && <span style={{ marginLeft: "auto", color: "#1f72ff" }}>✓</span>}
        </div>

        {isOpen &&
          hasChildren &&
          node.children!.map((child) => (
            <TreeNode key={child.id} node={child} />
          ))}
      </div>
    )
  }

  // --------------------------------------------
  // Save Updated Category
  // --------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch(`/admin/mp/product/category/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to update category")
      }

      setSuccess("Category Updated Successfully!")
      setTimeout(() => navigate(-1), 1200)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={wrapper}>
      <div style={header}>
        <h1 style={title}>Edit Category</h1>
        <button style={backBtn} onClick={() => navigate(-1)}>← Back</button>
      </div>

      <form onSubmit={handleSubmit} style={formBox}>
        {error && <div style={errorText}>{error}</div>}
        {success && <div style={successText}>{success}</div>}

        <FormField label="Category Name">
          <input
            name="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={input}
            required
          />
        </FormField>

        <FormField label="Parent Category (Optional)">
          {loadingCategories ? <p>Loading...</p> : (
            <div style={treeBox}>
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
                <span>↳ Root Category (No Parent)</span>
                {form.parent_id === null && <span style={{ marginLeft: "auto", color: "#1f72ff" }}>✓</span>}
              </div>

              {categories.map((cat) => (
                <TreeNode key={cat.id} node={cat} />
              ))}

              {categories.length === 0 && (
                <p style={{ color: "#666", fontStyle: "italic" }}>
                  No categories found
                </p>
              )}
            </div>
          )}
        </FormField>

        <button
          style={submitBtn}
          disabled={loading || !form.name.trim()}
          type="submit"
        >
          {loading ? "Updating..." : "Save"}
        </button>
      </form>
    </div>
  )
}

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={fieldRow}>
    <label style={labelStyle}>{label}</label>
    <div style={inputContainer}>{children}</div>
  </div>
)

// --------------------------------------------
// Styles (same as Add Page)
// --------------------------------------------
const wrapper = { padding: "24px", fontFamily: "Inter, sans-serif", width: "100%" }
const header = { display: "flex", justifyContent: "space-between", marginBottom: "20px" }
const title = { fontSize: "28px", fontWeight: 700 }
const backBtn = { padding: "8px 14px", borderRadius: "6px", border: "1px solid #ccc", cursor: "pointer" }
const formBox = { background: "#fff", padding: "25px", borderRadius: "10px", boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }
const fieldRow = { display: "flex", marginBottom: 18, gap: "20px" }
const labelStyle = { width: 180, fontWeight: 600, paddingTop: 12 }
const inputContainer = { flex: 1 }
const input = { width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ddd" }
const treeBox = { border: "1px solid #ccc", borderRadius: 8, padding: 12, maxHeight: 300, overflowY: "auto", background: "#fafafa" }
const submitBtn = { width: "100%", padding: 12, background: "#1f72ff", color: "#fff", borderRadius: 8, border: 0, marginTop: 14, cursor: "pointer" }
const errorText = { color: "#d32f2f", background: "#ffebee", padding: 12, borderRadius: 6, marginBottom: 12 }
const successText = { color: "#2e7d32", background: "#e8f5e9", padding: 12, borderRadius: 6, marginBottom: 12 }

export const config = defineRouteConfig({
  path: "/redington-category-edit/:id",
})

export default EditCategoryPage
