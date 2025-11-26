import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"

type CategoryNode = {
  id: number
  name: string
  parent_id?: number | null
  children?: CategoryNode[]
}

type ProductPayload = {
  id: number
  product_code: string
  name: string
  short_desc: string | null
  base_price: string
  status: string
  categories: number[]
}

const EditProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [product, setProduct] = useState<ProductPayload | null>(null)
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [openNodes, setOpenNodes] = useState<Record<number, boolean>>({})

  const [form, setForm] = useState({
    product_code: "",
    name: "",
    short_desc: "",
    base_price: "",
    status: "active",
    categories: [] as number[],
  })

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/admin/product/category", { credentials: "include" })
      const data = await res.json()
      setCategories(data.categories ?? [])
    } catch (err) {
      console.error("Failed to fetch categories", err)
    }
  }, [])

  const fetchProduct = useCallback(async () => {
    if (!id) return
    try {
      const res = await fetch(`/admin/product/products/${id}`, { credentials: "include" })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || "Failed to fetch product")

      const prod: ProductPayload = data.product
      setProduct(prod)

      setForm({
        product_code: prod.product_code ?? "",
        name: prod.name ?? "",
        short_desc: prod.short_desc ?? "",
        base_price: prod.base_price ?? "",
        status: prod.status ?? "active",
        categories: data.categoryIds ?? [], 
      })
    } catch (err: any) {
      setError(err.message || "Unable to load product")
    }
  }, [id])

  const buildParentMap = (nodes: CategoryNode[]) => {
    const map = new Map<number, number | null>()
    const traverse = (node: CategoryNode) => {
      map.set(node.id, node.parent_id ?? null)
      node.children?.forEach(traverse)
    }
    nodes.forEach(traverse)
    return map
  }

  const expandParentsForSelected = (selectedIds: number[], allCategories: CategoryNode[]) => {
    const parentMap = buildParentMap(allCategories)
    const newOpen: Record<number, boolean> = {}

    const visit = (childId: number) => {
      let p = parentMap.get(childId)
      while (p) {
        newOpen[p] = true
        p = parentMap.get(p) ?? null
      }
    }

    selectedIds.forEach(visit)
    setOpenNodes((prev) => ({ ...prev, ...newOpen }))
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchCategories(), fetchProduct()])
      setLoading(false)
    }
    load()
  }, [fetchCategories, fetchProduct])

  // Run only once after categories + product loaded
  useEffect(() => {
    if (!loading && categories.length > 0 && form.categories.length > 0) {
      expandParentsForSelected(form.categories, categories)
    }
  }, [loading])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const toggleCategory = (catId: number) => {
    setForm((prev) => {
      const exists = prev.categories.includes(catId)
      const next = exists ? prev.categories.filter((c) => c !== catId) : [...prev.categories, catId]

      if (!exists) expandParentsForSelected([catId], categories)
      return { ...prev, categories: next }
    })
  }

  const toggleOpen = (nodeId: number) => {
    setOpenNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }))
  }

  const TreeNode: React.FC<{ node: CategoryNode }> = ({ node }) => {
    const hasChildren = node.children && node.children.length > 0
    const isOpen = !!openNodes[node.id]

    return (
      <div style={{ marginLeft: node.parent_id ? 18 : 0, marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {hasChildren && (
            <span
              style={{ width: 14, cursor: "pointer", userSelect: "none" }}
              onClick={() => toggleOpen(node.id)}
            >
              {isOpen ? "▾" : "▸"}
            </span>
          )}

          <input
            type="checkbox"
            checked={form.categories.includes(node.id)}
            onChange={() => toggleCategory(node.id)}
          />

          <span style={{ userSelect: "none" }}>{node.name}</span>
        </div>

        {isOpen && hasChildren && (
          <div style={{ marginLeft: 14 }}>
            {node.children!.map((c) => (
              <TreeNode key={c.id} node={c} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!id) return
    setSaving(true)
    try {
      const payload = {
        product_code: form.product_code,
        name: form.name,
        short_desc: form.short_desc,
        base_price: form.base_price,
        status: form.status,
        categories: form.categories,
      }

      const res = await fetch(`/admin/product/products/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.message || "Update failed")

      navigate("/redington-product-listing")
    } catch (err: any) {
      setError(err.message || "Update failed")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>
  if (error) return <div style={{ padding: 20, color: "red" }}>{error}</div>
  if (!product) return <div style={{ padding: 20 }}>Not Found</div>

  return (
    <div style={{ padding: 24 }}>
      <div style={{display:"flex", gap:"630px"}}>

      {/* <h1>Edit Product — ID: {product.id}</h1> */}
      <h1 style={{fontSize:"30px"}}>Edit Product</h1>
              <button style={backBtn} onClick={() => window.history.back()}>
          ← Back
        </button>
      </div>

      <form onSubmit={handleSave} style={{ marginTop: 20, width: "80%", maxWidth: 900 }}>
        <div style={{ marginBottom: 12 }}>
          <label>Product Code</label>
          <input name="product_code" value={form.product_code} onChange={handleChange} style={input} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Name</label>
          <input name="name" value={form.name} onChange={handleChange} style={input} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Short Description</label>
          <textarea name="short_desc" value={form.short_desc} onChange={handleChange} style={textarea} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Base Price</label>
          <input type="number" name="base_price" value={form.base_price} onChange={handleChange} style={input} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Categories</label>
          <div style={{ border: "1px solid #ccc", padding: 12, borderRadius: 8, maxHeight: 340, overflowY: "auto" }}>
            {categories.map((c) => (
              <TreeNode key={c.id} node={c} />
            ))}
            {categories.length === 0 && <div>No categories</div>}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Status</label>
          <select name="status" value={form.status} onChange={handleChange} style={input}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <button type="submit" disabled={saving} style={saveBtn}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  )
}

const input: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 8,
  border: "1px solid #ddd",
  fontSize: 14,
}

const textarea: React.CSSProperties = {
  ...input,
  minHeight: 120,
}

const saveBtn: React.CSSProperties = {
  padding: "10px 16px",
  background: "#1f72ff",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
}
const backBtn = {
  padding: "8px 14px",
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
}

export const config = defineRouteConfig({
  label: "Edit Product",
  path: "/redington-product-edit/:id",
})

export default EditProductPage
