import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useEffect, useState } from "react"

type Category = {
  id: number
  name: string
}

const AddProductPage: React.FC = () => {
  const [form, setForm] = useState({
    product_code: "",
    name: "",
    short_desc: "",
    base_price: "",
    status: "active",
    categories: [] as number[],
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  /* ---------------------------------------------------
        Fetch Categories on Page Load
  ---------------------------------------------------- */
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch("/admin/product/category", {
        credentials: "include",
      })
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (err) {
      console.log("Category fetch failed", err)
    } finally {
      setLoadingCategories(false)
    }
  }

  /* ---------------------------------------------------
        Form Change Handler
  ---------------------------------------------------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIds = Array.from(e.target.selectedOptions).map((o) =>
      Number(o.value)
    )
    setForm({ ...form, categories: selectedIds })
  }

  /* ---------------------------------------------------
        Submit Handler
  ---------------------------------------------------- */
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

      if (!data.success) throw new Error(data.message || "Failed to add product")

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

  return (
    <div style={wrapper}>
      {/* Header */}
      <div style={header}>
        <h1 style={title}>Add New Product</h1>
        <button style={backBtn} onClick={() => window.history.back()}>
          ← Back
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={formBox}>
        {error && <p style={errorText}>{error}</p>}
        {success && <p style={successText}>{success}</p>}

        {/* Product Code */}
        <div style={fieldRow}>
          <label style={label}>Product Code</label>
          <input
            name="product_code"
            value={form.product_code}
            onChange={handleChange}
            style={input}
            required
          />
        </div>

        {/* Product Name */}
        <div style={fieldRow}>
          <label style={label}>Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            style={input}
            required
          />
        </div>

        {/* Short Description */}
        <div style={fieldRow}>
          <label style={label}>Short Description</label>
          <textarea
            name="short_desc"
            value={form.short_desc}
            onChange={handleChange}
            style={textarea}
          />
        </div>

        {/* Base Price */}
        <div style={fieldRow}>
          <label style={label}>Base Price</label>
          <input
            name="base_price"
            type="number"
            value={form.base_price}
            onChange={handleChange}
            style={input}
            required
          />
        </div>

        {/* Categories */}
        <div style={fieldRow}>
          <label style={label}>Categories</label>
          <select
            multiple
            onChange={handleCategoryChange}
            style={input}
            size={5}
          >
            {loadingCategories && <option>Loading...</option>}

            {!loadingCategories &&
              categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
          </select>
        </div>

        {/* Status */}
        <div style={fieldRow}>
          <label style={label}>Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            style={input}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Submit Button */}
        <button style={submitBtn} disabled={loading}>
          {loading ? "Saving..." : "Save Product"}
        </button>
      </form>
    </div>
  )
}

/* --------------------------------------------
                Styles
--------------------------------------------- */

const wrapper = {
  padding: "24px 0",
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
  fontSize: 28,
  fontWeight: 700,
}

const backBtn = {
  padding: "8px 14px",
  background: "white",
  border: "1px solid #d0d0d0",
  borderRadius: 6,
  cursor: "pointer",
}

const formBox = {
  marginLeft: "100px",
  // maxWidth
  background: "white",
  padding: 25,
  borderRadius: 10,
  maxWidth: 1000,
  width: "100%",
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
}

/* LABEL LEFT — INPUT RIGHT */
const fieldRow = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 18,
  gap: 20,
}

const label = {
  width: 180,
  fontWeight: 600,
}

const input = {
  flex: 1,
  padding: "12px",
  border: "1px solid #dcdcdc",
  borderRadius: 8,
  fontSize: 15,
  outline: "none",
}

const textarea = {
  flex: 1,
  height: 120,
  padding: "12px",
  border: "1px solid #dcdcdc",
  borderRadius: 8,
  fontSize: 15,
  outline: "none",
}

const submitBtn = {
  width: "100%",
  padding: "12px",
  background: "#1f72ff",
  color: "white",
  border: 0,
  borderRadius: 8,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  marginTop: 10,
}

const errorText = { color: "red", marginBottom: 10 }
const successText = { color: "green", marginBottom: 10 }

/* Route Config */
export const config = defineRouteConfig({
  label: "Add Product",
  path: "/redington-product-add",
})

export default AddProductPage
