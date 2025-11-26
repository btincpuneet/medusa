import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useEffect, useState } from "react"

type CategoryNode = {
  id: number
  name: string
  parent_id: number | null
  source: "magento" | "medusa"
  magento_category_id: number | null
  children: CategoryNode[]
}


type FormType = {
  product_code: string
  name: string
  short_desc: string
  base_price: string
  status: string
  categories: number[]
}

const AddProductPage: React.FC = () => {
  const [form, setForm] = useState<FormType>({
    product_code: "",
    name: "",
    short_desc: "",
    base_price: "",
    status: "active",
    categories: [],
  })
const [openNodes, setOpenNodes] = useState<Record<number, boolean>>({});
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // ---------------------------------------------------
  // Fetch Categories
  // ---------------------------------------------------
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch("/admin/product/category", { credentials: "include" })
      const data = await res.json()
      setCategories(data.categories ?? [])
    } catch (err) {
      console.error("Failed to load categories", err)
    } finally {
      setLoadingCategories(false)
    }
  }

  // ---------------------------------------------------
  // Form Handler
  // ---------------------------------------------------
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // ---------------------------------------------------
  // Toggle category selection
  // ---------------------------------------------------
  const toggleCategory = (id: number) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(id)
        ? prev.categories.filter((c) => c !== id)
        : [...prev.categories, id],
    }))
  }

  // ---------------------------------------------------
  // Recursive Category Tree Node
  // ---------------------------------------------------
const TreeNode: React.FC<{ node: CategoryNode }> = ({ node }) => {
  const hasChildren = node.children?.length
  const isOpen = openNodes[node.id] || false

  return (
    <div style={{ marginLeft: node.parent_id ? 18 : 0, marginBottom: 4 }}>
      
      {/* Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: hasChildren ? "pointer" : "default",
        }}
        onClick={() => hasChildren && toggleOpen(node.id)}
      >
        <div
          style={{
            width: 14,
            userSelect: "none",
            textAlign: "center",
          }}
        >
          {hasChildren ? (isOpen ? "▾" : "▸") : ""}
        </div>

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={form.categories.includes(node.id)}
          onChange={() => toggleCategory(node.id)}
          onClick={(e) => e.stopPropagation()}
        />

        <span style={{ userSelect: "none" }}>{node.name}</span>
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
      const res = await fetch("/admin/product/products", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.message)

      setSuccess("Product added successfully!")

      setForm({
        product_code: "",
        name: "",
        short_desc: "",
        base_price: "",
        status: "active",
        categories: [],
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
const toggleOpen = (id: number) => {
  setOpenNodes(prev => ({
    ...prev,
    [id]: !prev[id]
  }));
};

  return (
    <div style={wrapper}>
      <div style={header}>
        <h1 style={title}>Add New Product</h1>
        <button style={backBtn} onClick={() => window.history.back()}>
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} style={formBox}>
        {error && <p style={errorText}>{error}</p>}
        {success && <p style={successText}>{success}</p>}

        {/* Product Code */}
        <FormField label="Product Code">
          <input
            name="product_code"
            value={form.product_code}
            onChange={handleChange}
            style={input}
            required
          />
        </FormField>

        {/* Name */}
        <FormField label="Name">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            style={input}
            required
          />
        </FormField>

        {/* Short Description */}
        <FormField label="Short Description">
          <textarea
            name="short_desc"
            value={form.short_desc}
            onChange={handleChange}
            style={textarea}
          />
        </FormField>

        {/* Price */}
        <FormField label="Base Price">
          <input
            name="base_price"
            type="number"
            value={form.base_price}
            onChange={handleChange}
            style={input}
            required
          />
        </FormField>

        {/* Category Tree */}
        <FormField label="Categories">
          {loadingCategories ? (
            <p>Loading...</p>
          ) : (
            <div style={treeBox}>
              {categories.map((cat) => (
                <TreeNode key={cat.id} node={cat} />
              ))}
            </div>
          )}
        </FormField>

        {/* Status */}
        <FormField label="Status">
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            style={input}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </FormField>

        {/* Submit */}
        <button style={submitBtn} disabled={loading}>
          {loading ? "Saving..." : "Save Product"}
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
    {children}
  </div>
)

// --------------------------------------------
// Styles
// --------------------------------------------
const wrapper: React.CSSProperties = {
  padding: "24px",
  fontFamily: "Inter, sans-serif",
}

const header = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 20,
}

const title = {
  fontSize: 28,
  fontWeight: 700,
}

const backBtn = {
  padding: "8px 14px",
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
}

const formBox = {
  background: "#fff",
  padding: 25,
  borderRadius: 10,
  width: "100%",
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
}

const fieldRow = {
  display: "flex",
  alignItems: "center",
  marginBottom: 18,
  gap: 20,
}

const labelStyle = {
  width: 180,
  fontWeight: 600,
}

const input = {
  flex: 1,
  padding: "12px",
  borderRadius: 8,
  border: "1px solid #ddd",
  fontSize: 15,
}

const textarea = {
  ...input,
  height: 120,
}

const treeBox = {
  border: "1px solid #ccc",
  borderRadius: 8,
  padding: 12,
  maxHeight: 300,
  overflowY: "auto",
}

const errorText = { color: "red" }
const successText = { color: "green" }

const submitBtn = {
  width: "100%",
  padding: 12,
  background: "#1f72ff",
  color: "#fff",
  border: 0,
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer",
}

export const config = defineRouteConfig({
  // label: "Add Product",
  path: "/redington-product-add",
})

export default AddProductPage
