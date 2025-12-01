import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"

type CategoryNode = {
  id: number
  name: string
  parent_id?: number | null
  children?: CategoryNode[]
}

type Attribute = {
  id: number
  label: string
  attribute_type: string
  values?: Array<{ id: number; label: string }>
  required?: boolean
}

type AttributeValue = {
  attribute_id: number
  text_value?: string
  decimal_value?: number
  integer_value?: number
  boolean_value?: boolean
  attribute_value_id?: number
  attribute_value_ids?: number[]
  media_path?: string
}

type GalleryImage = {
  id?: number
  image_type: string
  label: string
  image: string
  file?: File
}

type ProductPayload = {
  id: number
  product_code: string
  name: string
  short_desc: string | null
  base_price: string
  status: string
  categories: number[]
  attributes?: AttributeValue[]
  gallery?: GalleryImage[]
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
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [attributeValues, setAttributeValues] = useState<Record<number, AttributeValue>>({})
  const [gallery, setGallery] = useState<GalleryImage[]>([])
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([])

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
      const res = await fetch("/admin/mp/product/category", { credentials: "include" })
      const data = await res.json()
      setCategories(data.categories ?? [])
    } catch (err) {
      console.error("Failed to fetch categories", err)
    }
  }, [])

  const fetchProduct = useCallback(async () => {
    if (!id) return
    try {
      const res = await fetch(`/admin/mp/product/products/${id}`, { credentials: "include" })
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

      // Set gallery images
      if (data.gallery) {
        setGallery(data.gallery)
      }

      // Set attribute values
      if (data.attributes) {
        const attrValues: Record<number, AttributeValue> = {}
        data.attributes.forEach((attr: AttributeValue) => {
          attrValues[attr.attribute_id] = attr
        })
        setAttributeValues(attrValues)
      }
    } catch (err: any) {
      setError(err.message || "Unable to load product")
    }
  }, [id])

  // Fetch category attributes when categories change
  useEffect(() => {
    if (form.categories.length === 0) {
      setAttributes([])
      return
    }

    const lastSelected = form.categories[form.categories.length - 1]
    fetchCategoryAttributes(lastSelected)
  }, [form.categories])

  const fetchCategoryAttributes = async (categoryId: number) => {
    try {
      const res = await fetch(`/admin/mp/product/product-category/${categoryId}/attributes`, {
        credentials: "include",
      })
      const data = await res.json()
      setAttributes(data.attributes || [])
    } catch (error) {
      console.error("Failed to load category attributes", error)
    }
  }

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

  // Attribute handling
  const renderAttributeInput = (attr: Attribute) => {
    const value = attributeValues[attr.id] || {}

    switch (attr.attribute_type) {
      case "text":
        return (
          <input
            style={input}
            value={value.text_value || ""}
            onChange={(e) =>
              updateAttribute(attr.id, { text_value: e.target.value })
            }
          />
        )
      case "textarea":
        return (
          <textarea
            style={textarea}
            value={value.text_value || ""}
            onChange={(e) =>
              updateAttribute(attr.id, { text_value: e.target.value })
            }
          />
        )
      case "integer":
      case "decimal":
        return (
          <input
            style={input}
            type="number"
            step={attr.attribute_type === "decimal" ? "0.01" : "1"}
            value={value.decimal_value || value.integer_value || ""}
            onChange={(e) =>
              updateAttribute(attr.id, {
                [attr.attribute_type === "integer"
                  ? "integer_value"
                  : "decimal_value"]: e.target.value,
              })
            }
          />
        )
      case "boolean":
        return (
          <select
            style={input}
            value={value.boolean_value ?? ""}
            onChange={(e) =>
              updateAttribute(attr.id, { boolean_value: e.target.value === "true" })
            }
          >
            <option value="">Select</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        )
      case "select":
        return (
          <select
            style={input}
            value={value.attribute_value_id || ""}
            onChange={(e) =>
              updateAttribute(attr.id, { attribute_value_id: Number(e.target.value) })
            }
          >
            <option value="">Select</option>
            {attr.values?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        )
      case "multiselect":
        return (
          <select
            multiple
            style={{ ...input, height: "auto", minHeight: "100px" }}
            value={value.attribute_value_ids || []}
            onChange={(e) => {
              const arr = [...e.target.selectedOptions].map((o) => Number(o.value))
              updateAttribute(attr.id, { attribute_value_ids: arr })
            }}
          >
            {attr.values?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        )
      case "media":
        return (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                updateAttribute(attr.id, { media_path: URL.createObjectURL(file) })
              }
            }}
          />
        )
      default:
        return null
    }
  }

  const updateAttribute = (attribute_id: number, newValue: Partial<AttributeValue>) => {
    setAttributeValues((prev) => ({
      ...prev,
      [attribute_id]: { attribute_id, ...prev[attribute_id], ...newValue },
    }))
  }

  // Gallery handling
  const handleGalleryUpload = (files: FileList | null) => {
    if (!files) return
    const newImages: GalleryImage[] = Array.from(files).map((file) => ({
      image_type: "gallery",
      label: file.name,
      image: URL.createObjectURL(file),
      file
    }))
    setGallery((prev) => [...prev, ...newImages])
  }

  const removeGalleryImage = (index: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== index))
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
    setError(null)

    try {
      const formData = new FormData()
      
      // Append basic fields
      formData.append('product_code', form.product_code)
      formData.append('name', form.name)
      formData.append('short_desc', form.short_desc)
      formData.append('base_price', form.base_price)
      formData.append('status', form.status)

      // Append categories as array
      form.categories.forEach(catId => {
        formData.append('categories[]', catId.toString())
      })

      // Append attributes as JSON strings
      Object.values(attributeValues).forEach(attr => {
        formData.append('attributes', JSON.stringify(attr))
      })

      // Append new gallery files
      gallery.forEach((img, index) => {
        if (img.file) {
          formData.append('gallery', img.file)
        }
      })

      // Append existing gallery images (those without files)
      const existingGallery = gallery.filter(img => !img.file)
      formData.append('existing_gallery', JSON.stringify(existingGallery))

      const res = await fetch(`/admin/mp/product/products/${id}`, {
        method: "PUT",
        credentials: "include",
        body: formData,
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
    <div style={wrapper}>
      <div style={header}>
        <h1 style={title}>Edit Product</h1>
        <button style={backBtn} onClick={() => window.history.back()}>
          ← Back
        </button>
      </div>

      <form onSubmit={handleSave} style={formBox}>
        {error && <div style={errorAlert}>{error}</div>}

        <div style={formGrid}>
          {/* Basic Information Section */}
          <div style={formSection}>
            <h3 style={sectionTitle}>Basic Information</h3>
            
            <FormField label="Product Code *">
              <input
                name="product_code"
                value={form.product_code}
                onChange={handleChange}
                style={input}
                required
              />
            </FormField>

            <FormField label="Product Name *">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                style={input}
                required
              />
            </FormField>

            <FormField label="Short Description">
              <textarea
                name="short_desc"
                value={form.short_desc}
                onChange={handleChange}
                style={textarea}
                rows={4}
              />
            </FormField>

            <FormField label="Base Price *">
              <input
                type="number"
                step="0.01"
                name="base_price"
                value={form.base_price}
                onChange={handleChange}
                style={input}
                required
              />
            </FormField>

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
          </div>

          {/* Categories & Attributes Section */}
          <div style={formSection}>
            <h3 style={sectionTitle}>Categories & Attributes</h3>

            <FormField label="Categories *">
              <div style={treeBox}>
                {categories.map((c) => (
                  <TreeNode key={c.id} node={c} />
                ))}
                {categories.length === 0 && <div>No categories</div>}
              </div>
            </FormField>

            {attributes.length > 0 && (
              <FormField label="Attributes">
                <div style={attributesBox}>
                  {attributes.map((attr) => (
                    <div key={attr.id} style={attributeItem}>
                      <label style={attributeLabel}>{attr.label}</label>
                      {renderAttributeInput(attr)}
                    </div>
                  ))}
                </div>
              </FormField>
            )}
          </div>

          {/* Media Section */}
          <div style={formSection}>
            <h3 style={sectionTitle}>Media</h3>
            
            <FormField label="Gallery Images">
              <div style={gallerySection}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleGalleryUpload(e.target.files)}
                  style={fileInput}
                />
                <div style={galleryGrid}>
                  {gallery.map((img, idx) => (
                    <div key={idx} style={galleryItem}>
                      <img 
                        src={img.image} 
                        style={galleryImage} 
                        alt={img.label}
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(idx)}
                        style={removeImageBtn}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                {gallery.length === 0 && (
                  <div style={emptyState}>No images uploaded yet</div>
                )}
              </div>
            </FormField>
          </div>
        </div>

        <div style={submitSection}>
          <button 
            type="submit" 
            disabled={saving} 
            style={submitBtn}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  )
}

// Reusable Form Field Component
const FormField: React.FC<{ 
  label: string; 
  children: React.ReactNode;
  required?: boolean;
}> = ({ label, children, required }) => (
  <div style={fieldRow}>
    <label style={labelStyle}>
      {label}
      {required && <span style={requiredStar}> *</span>}
    </label>
    {children}
  </div>
)

// Styles (same as your Add Product component)
const wrapper: React.CSSProperties = {
  padding: "24px",
  fontFamily: "Inter, sans-serif",
  backgroundColor: "#f8f9fa",
  minHeight: "100vh",
}

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
}

const title = {
  fontSize: 28,
  fontWeight: 700,
  color: "#1f2937",
  margin: 0,
}

const backBtn = {
  padding: "8px 16px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 500,
}

const formBox = {
  background: "#fff",
  padding: 32,
  borderRadius: 12,
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
}

const formGrid = {
  display: "grid",
  gap: "32px",
}

const formSection = {
  padding: 24,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  backgroundColor: "#fafafa",
}

const sectionTitle = {
  fontSize: 18,
  fontWeight: 600,
  color: "#374151",
  marginTop: 0,
  marginBottom: 20,
  paddingBottom: 12,
  borderBottom: "2px solid #e5e7eb",
}

const fieldRow = {
  display: "flex",
  alignItems: "flex-start",
  marginBottom: 20,
  gap: 20,
}

const labelStyle = {
  width: 180,
  fontWeight: 500,
  fontSize: "14px",
  color: "#374151",
  flexShrink: 0,
}

const input = {
  flex: 1,
  padding: "10px 12px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  fontSize: "14px",
  fontFamily: "inherit",
}

const textarea = {
  ...input,
  height: "auto",
  minHeight: "80px",
  resize: "vertical" as const,
}

const treeBox = {
  border: "1px solid #e5e7eb",
  borderRadius: 6,
  padding: 16,
  maxHeight: 300,
  overflowY: "auto" as const,
  backgroundColor: "#fff",
  fontSize: "14px",
}

const attributesBox = {
  padding: "16px",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  backgroundColor: "#fff",
}

const attributeItem = {
  marginBottom: 20,
}

const attributeLabel = {
  display: "block",
  fontWeight: 500,
  marginBottom: 6,
  fontSize: "14px",
  color: "#374151",
}

const gallerySection = {
  flex: 1,
}

const fileInput = {
  width: "100%",
  marginBottom: 16,
}

const galleryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
  gap: 12,
  marginTop: 12,
}

const galleryItem = {
  position: "relative" as const,
}

const galleryImage = {
  width: "100%",
  height: 80,
  objectFit: "cover" as const,
  borderRadius: 6,
  border: "1px solid #e5e7eb",
}

const removeImageBtn = {
  position: "absolute" as const,
  top: -8,
  right: -8,
  width: 24,
  height: 24,
  borderRadius: "50%",
  background: "#ef4444",
  color: "white",
  border: "none",
  cursor: "pointer",
  fontSize: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}

const submitSection = {
  marginTop: 32,
  paddingTop: 24,
  borderTop: "1px solid #e5e7eb",
}

const submitBtn = {
  width: "100%",
  padding: "12px 24px",
  background: "#2563eb",
  color: "#fff",
  border: 0,
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "16px",
}

const errorAlert = {
  padding: "12px 16px",
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: 6,
  color: "#dc2626",
  marginBottom: 24,
  fontSize: "14px",
}

const emptyState = {
  color: "#6b7280",
  fontStyle: "italic",
  textAlign: "center" as const,
  padding: "20px",
}

const requiredStar = {
  color: "#dc2626",
}

export const config = defineRouteConfig({
  label: "Edit Product",
  path: "/redington-product-edit/:id",
})

export default EditProductPage