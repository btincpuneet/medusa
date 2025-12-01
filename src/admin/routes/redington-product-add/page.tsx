import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useEffect, useState, useCallback } from "react"

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
  image_type: string
  label: string
  image: string
  file?: File
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
  
  const [openNodes, setOpenNodes] = useState<Record<number, boolean>>({})
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [attributeValues, setAttributeValues] = useState<Record<number, AttributeValue>>({})
  const [gallery, setGallery] = useState<GalleryImage[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredCategories, setFilteredCategories] = useState<CategoryNode[]>([])

  // Filter categories based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categories)
      return
    }

    const filterCategories = (nodes: CategoryNode[], term: string): CategoryNode[] => {
      return nodes
        .map(node => {
          const matches = node.name.toLowerCase().includes(term.toLowerCase())
          const children = node.children ? filterCategories(node.children, term) : []
          
          if (matches || children.length > 0) {
            return {
              ...node,
              children
            }
          }
          return null
        })
        .filter(Boolean) as CategoryNode[]
    }

    setFilteredCategories(filterCategories(categories, searchTerm))
  }, [categories, searchTerm])

  // Fetch category attributes when categories change
  useEffect(() => {
    if (form.categories.length === 0) {
      setAttributes([])
      setAttributeValues({})
      return
    }

    const lastSelected = form.categories[form.categories.length - 1]
    fetchCategoryAttributes(lastSelected)
  }, [form.categories])

  const fetchCategoryAttributes = async (categoryId: number) => {
    try {
      setError("")
      const res = await fetch(`/admin/mp/product/product-category/${categoryId}/attributes`, {
        credentials: "include",
      })

      if (!res.ok) throw new Error(`Failed to fetch attributes: ${res.status}`)
      
      const data = await res.json()
      setAttributes(data.attributes || [])

      // Initialize attribute values
      const initialValues: Record<number, AttributeValue> = {}
      data.attributes?.forEach((attr: Attribute) => {
        initialValues[attr.id] = { attribute_id: attr.id }
      })
      setAttributeValues(initialValues)
    } catch (error) {
      console.error("Failed to load category attributes", error)
      setError("Failed to load category attributes")
    }
  }

  // Fetch Categories
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      setError("")
      const res = await fetch("/admin/mp/product/category", { 
        credentials: "include" 
      })
      
      if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`)
      
      const data = await res.json()
      setCategories(data.categories ?? [])
      setFilteredCategories(data.categories ?? [])
    } catch (err: any) {
      console.error("Failed to load categories", err)
      setError("Failed to load categories")
    } finally {
      setLoadingCategories(false)
    }
  }

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
            required={attr.required}
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
            required={attr.required}
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
            required={attr.required}
          />
        )

      case "boolean":
        return (
          <select
            style={input}
            value={value.boolean_value ?? ""}
            onChange={(e) =>
              updateAttribute(attr.id, { 
                boolean_value: e.target.value === "true" 
              })
            }
            required={attr.required}
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
              updateAttribute(attr.id, { 
                attribute_value_id: Number(e.target.value) 
              })
            }
            required={attr.required}
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
              const arr = [...e.target.selectedOptions].map((o) => 
                Number(o.value)
              )
              updateAttribute(attr.id, { attribute_value_ids: arr })
            }}
            required={attr.required}
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
                updateAttribute(attr.id, { 
                  media_path: URL.createObjectURL(file) 
                })
              }
            }}
            required={attr.required}
          />
        )

      default:
        return <div>Unsupported attribute type: {attr.attribute_type}</div>
    }
  }

  const updateAttribute = useCallback((attribute_id: number, newValue: Partial<AttributeValue>) => {
    setAttributeValues((prev) => ({
      ...prev,
      [attribute_id]: { 
        attribute_id, 
        ...prev[attribute_id], 
        ...newValue 
      },
    }))
  }, [])

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const toggleCategory = (id: number) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(id)
        ? prev.categories.filter((c) => c !== id)
        : [...prev.categories, id],
    }))
  }

  const TreeNode: React.FC<{ node: CategoryNode }> = ({ node }) => {
    const hasChildren = node.children?.length
    const isOpen = openNodes[node.id] || false

    return (
      <div style={{ 
        marginLeft: node.parent_id ? 18 : 0, 
        marginBottom: 4 
      }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: hasChildren ? "pointer" : "default",
            padding: "4px 0",
          }}
          onClick={() => hasChildren && toggleOpen(node.id)}
        >
          <div style={{
            width: 14,
            userSelect: "none",
            textAlign: "center",
            fontSize: "12px",
          }}>
            {hasChildren ? (isOpen ? "▾" : "▸") : ""}
          </div>

          <input
            type="checkbox"
            checked={form.categories.includes(node.id)}
            onChange={() => toggleCategory(node.id)}
            onClick={(e) => e.stopPropagation()}
          />

          <span style={{ 
            userSelect: "none",
            fontSize: "14px",
          }}>
            {node.name}
          </span>
        </div>

        {isOpen && hasChildren && node.children!.map((child) => (
          <TreeNode key={child.id} node={child} />
        ))}
      </div>
    )
  }

  const toggleOpen = (id: number) => {
    setOpenNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validate required fields
      if (!form.product_code.trim() || !form.name.trim() || !form.base_price) {
        throw new Error("Please fill in all required fields")
      }

      // Validate at least one category is selected
      if (form.categories.length === 0) {
        throw new Error("Please select at least one category")
      }

      const formData = new FormData()
      
      // Append form fields
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'categories') {
          (value as number[]).forEach(catId => {
            formData.append('categories[]', catId.toString())
          })
        } else {
          formData.append(key, value as string)
        }
      })

      // Append attributes
      Object.values(attributeValues).forEach(attr => {
        formData.append('attributes', JSON.stringify(attr))
      })

      // Append gallery images
      gallery.forEach((img, index) => {
        if (img.file) {
          formData.append(`gallery_${index}`, img.file)
        }
      })

      const res = await fetch("/admin/mp/product/products", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create product")
      }

      setSuccess("Product added successfully!")
      
      // Reset form
      setForm({
        product_code: "",
        name: "",
        short_desc: "",
        base_price: "",
        status: "active",
        categories: [],
      })
      setAttributeValues({})
      setGallery([])
      setOpenNodes({})
      
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const clearForm = () => {
    setForm({
      product_code: "",
      name: "",
      short_desc: "",
      base_price: "",
      status: "active",
      categories: [],
    })
    setAttributeValues({})
    setGallery([])
    setOpenNodes({})
    setError("")
    setSuccess("")
  }

  return (
    <div style={wrapper}>
      <div style={header}>
        <h1 style={title}>Add New Product</h1>
        <div style={headerActions}>
          <button style={secondaryBtn} onClick={clearForm}>
            Clear Form
          </button>
          <button style={backBtn} onClick={() => window.history.back()}>
            ← Back
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={formBox}>
        {error && (
          <div style={errorAlert}>
            <strong>Error:</strong> {error}
          </div>
        )}
        {success && (
          <div style={successAlert}>
            <strong>Success:</strong> {success}
          </div>
        )}

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
                placeholder="Enter unique product code"
              />
            </FormField>

            <FormField label="Product Name *">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                style={input}
                required
                placeholder="Enter product name"
              />
            </FormField>

            <FormField label="Short Description">
              <textarea
                name="short_desc"
                value={form.short_desc}
                onChange={handleChange}
                style={textarea}
                placeholder="Enter product description"
                rows={4}
              />
            </FormField>

            <FormField label="Base Price *">
              <input
                name="base_price"
                type="number"
                step="0.01"
                min="0"
                value={form.base_price}
                onChange={handleChange}
                style={input}
                required
                placeholder="0.00"
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
              {loadingCategories ? (
                <div style={loadingText}>Loading categories...</div>
              ) : (
                <div style={categorySection}>
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={searchInput}
                  />
                  <div style={treeBox}>
                    {filteredCategories.length === 0 ? (
                      <div style={emptyState}>
                        {searchTerm ? "No categories found" : "No categories available"}
                      </div>
                    ) : (
                      filteredCategories.map((cat) => (
                        <TreeNode key={cat.id} node={cat} />
                      ))
                    )}
                  </div>
                  {/* <div style={selectedCategories}>
                    <strong>Selected: </strong>
                    {form.categories.length === 0 
                      ? "None" 
                      : form.categories.join(", ")
                    }
                  </div> */}
                </div>
              )}
            </FormField>

            {attributes.length > 0 && (
              <FormField label="Attributes">
                <div style={attributesBox}>
                  {attributes.map((attr) => (
                    <div key={attr.id} style={attributeItem}>
                      <label style={attributeLabel}>
                        {attr.label}
                        {attr.required && <span style={requiredStar}> *</span>}
                      </label>
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
                  <div style={emptyState}>
                    No images uploaded yet
                  </div>
                )}
              </div>
            </FormField>
          </div>
        </div>

        {/* Submit Button */}
        <div style={submitSection}>
          <button 
            style={submitBtn} 
            disabled={loading}
            type="submit"
          >
            {loading ? (
              <>
                <span style={spinner}></span>
                Saving...
              </>
            ) : (
              "Save Product"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// Reusable Form Row
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

// Enhanced Styles
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
  flexWrap: "wrap" as const,
  gap: "16px",
}

const headerActions = {
  display: "flex",
  gap: "12px",
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

const secondaryBtn = {
  ...backBtn,
  color: "#6b7280",
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

const searchInput = {
  ...input,
  marginBottom: "12px",
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

const categorySection = {
  flex: 1,
}

const selectedCategories = {
  marginTop: "12px",
  padding: "8px 12px",
  backgroundColor: "#f3f4f6",
  borderRadius: 4,
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
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
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

const successAlert = {
  padding: "12px 16px",
  backgroundColor: "#f0fdf4",
  border: "1px solid #bbf7d0",
  borderRadius: 6,
  color: "#16a34a",
  marginBottom: 24,
  fontSize: "14px",
}

const loadingText = {
  color: "#6b7280",
  fontStyle: "italic",
  padding: "20px",
  textAlign: "center" as const,
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

const spinner = {
  width: 16,
  height: 16,
  border: "2px solid transparent",
  borderTop: "2px solid currentColor",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
}

// Add CSS animation for spinner
const styles = document.createElement('style')
styles.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`
document.head.appendChild(styles)

export const config = defineRouteConfig({
  path: "/redington-product-add",
})

export default AddProductPage