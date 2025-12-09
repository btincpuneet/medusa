import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"

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
  attribute_set: string
  visibility: string 
  categories: number[]
}

type Attribute = {
  id: number
  label: string
  attribute_type: string
  values?: AttributeValueOption[]
  required?: boolean
}

type AttributeValue = {
  attribute_id: number
  text_value?: string | null
  decimal_value?: number | null
  integer_value?: number | null
  boolean_value?: boolean | null
  attribute_value_id?: number | null
  attribute_value_ids?: number[]
  media_path?: string | null
  date_value?: string | null
}

type AttributeValueOption = {
  id: number
  value: string  
  label: string  
}

type AttributeSets = {
  id: number
  name: string
  values?: Array<{ id: number; label: string }>
}

type GalleryImage = {
  id?: number
  image_type: string
  label: string
  image: string
  file?: File
  existing?: boolean
}

const EditProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [form, setForm] = useState<FormType>({
    product_code: "",
    name: "",
    short_desc: "",
    base_price: "",
    status: "active",
    attribute_set: "",
    visibility: "catalogsearch",
    categories: [],
  })
  
  const [openNodes, setOpenNodes] = useState<Record<number, boolean>>({})
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [attributeValues, setAttributeValues] = useState<Record<number, AttributeValue>>({})
  const [gallery, setGallery] = useState<GalleryImage[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredCategories, setFilteredCategories] = useState<CategoryNode[]>([])
  const [attributeSets, setAttributeSets] = useState<AttributeSets[]>([])

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

  useEffect(() => {
    if (!form.attribute_set) {
      setAttributes([])
      setAttributeValues({})
      return
    }

    fetchAttributeSetAttributes(form.attribute_set)
  }, [form.attribute_set])

  const fetchAttributeSetAttributes = async (attributeSetId: string) => {
    try {
      setError("")
      const res = await fetch(`/admin/mp/attribute-sets/${attributeSetId}/attributes`, {
        credentials: "include",
      })

      if (!res.ok) throw new Error(`Failed to fetch attributes: ${res.status}`)
      
      const data = await res.json()
      
      const mappedAttributes: Attribute[] = data.attributes.map((attr: any) => ({
        id: attr.id,
        label: attr.label,
        attribute_type: attr.attribute_type,
        values: attr.values?.map((v: any) => ({
          id: v.id,
          label: v.value,
          value: v.value
        })),
        required: attr.is_required
      }))
      
      setAttributes(mappedAttributes)

      // Initialize attribute values for new attributes, preserve existing values
      const initialValues: Record<number, AttributeValue> = {}
      mappedAttributes.forEach((attr: Attribute) => {
        // Keep existing value if available, otherwise initialize
        if (attributeValues[attr.id]) {
          initialValues[attr.id] = attributeValues[attr.id]
        } else {
          initialValues[attr.id] = { 
            attribute_id: attr.id,
            text_value: null,
            decimal_value: null,
            integer_value: null,
            boolean_value: null,
            attribute_value_id: null,
            attribute_value_ids: [],
            media_path: null,
            date_value: null
          }
        }
      })
      
      setAttributeValues(initialValues)
    } catch (error) {
      console.error("Failed to load attribute set attributes", error)
      setError("Failed to load attribute set attributes")
    }
  }
  
  useEffect(() => {
    fetchCategories()
    fetchAttributeSets()
  }, [])

  useEffect(() => {
    if (id) {
      fetchProduct()
    }
  }, [id])

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

  const fetchAttributeSets = async () => {
    try {
      const res = await fetch("/admin/mp/attribute-sets", { 
        credentials: "include" 
      })
      
      if (!res.ok) throw new Error(`Failed to fetch attribute sets: ${res.status}`)
      
      const data = await res.json()
      setAttributeSets(data.attributesets ?? [])
    } catch (err: any) {
      console.error("Failed to load attribute sets", err)
      setError("Failed to load attribute sets")
    }
  }

  const fetchProduct = async () => {
    try {
      setLoading(true)
      setError("")
      const res = await fetch(`/admin/mp/product/products/${id}`, {
        credentials: "include",
      })

      if (!res.ok) throw new Error(`Failed to fetch product: ${res.status}`)
      
      const data = await res.json()
      
      if (!data.success) {
        throw new Error(data.message || "Failed to load product")
      }

      const product = data.product
      
      // Set form data
      setForm({
        product_code: product.product_code || "",
        name: product.name || "",
        short_desc: product.short_desc || "",
        base_price: product.base_price || "",
        status: product.status || "active",
        attribute_set: product.attribute_set?.id?.toString() || "",
        visibility: product.visibility || "catalogsearch",
        categories: product.categories?.map((cat: any) => cat.id) || []
      })

      // Set attribute values
      if (product.attributes) {
        const values: Record<number, AttributeValue> = {}
        product.attributes.forEach((attr: any) => {
          if (attr.attribute_id) {
            values[attr.attribute_id] = {
              attribute_id: attr.attribute_id,
              text_value: attr.text_value || null,
              decimal_value: attr.decimal_value ?? null,
              integer_value: attr.integer_value ?? null,
              boolean_value: attr.boolean_value ?? null,
              attribute_value_id: attr.attribute_value_id ?? null,
              attribute_value_ids: attr.attribute_value_ids || [],
              media_path: attr.media_path || null,
              date_value: attr.date_value || null
            }
          }
        })
        setAttributeValues(values)
      }

      // Set gallery images
      if (product.gallery) {
        const galleryImages: GalleryImage[] = product.gallery.map((img: any) => ({
          id: img.id,
          image_type: "gallery",
          label: img.label || `Image ${img.id}`,
          image: img.image_url || img.path || "",
          existing: true
        }))
        setGallery(galleryImages)
      }

      // Expand parent nodes for selected categories
      if (product.categories?.length > 0) {
        const selectedIds = product.categories.map((cat: any) => cat.id)
        expandParentNodes(selectedIds)
      }

      // If product has attribute set, fetch its attributes
      if (product.attribute_set?.id) {
        await fetchAttributeSetAttributes(product.attribute_set.id.toString())
      }

    } catch (err: any) {
      console.error("Failed to load product", err)
      setError(err.message || "Failed to load product")
      navigate("/redington-product-listing")
    } finally {
      setLoading(false)
    }
  }

  const expandParentNodes = (selectedIds: number[]) => {
    const parentMap = new Map<number, number | null>()
    
    const buildParentMap = (nodes: CategoryNode[]) => {
      nodes.forEach(node => {
        parentMap.set(node.id, node.parent_id)
        if (node.children.length > 0) {
          buildParentMap(node.children)
        }
      })
    }
    
    buildParentMap(categories)
    
    const newOpenNodes: Record<number, boolean> = {}
    
    const expandParents = (categoryId: number) => {
      let parentId = parentMap.get(categoryId)
      while (parentId !== null && parentId !== undefined) {
        newOpenNodes[parentId] = true
        parentId = parentMap.get(parentId)
      }
    }
    
    selectedIds.forEach(expandParents)
    setOpenNodes(prev => ({ ...prev, ...newOpenNodes }))
  }

  const renderAttributeInput = (attr: Attribute) => {
    const value = attributeValues[attr.id] || {}
    const hasPredefinedValues = attr.values && attr.values.length > 0

    switch (attr.attribute_type) {
      case "text":
        if (hasPredefinedValues) {
          return (
            <select
              style={input}
              value={value.attribute_value_id || ""}
              onChange={(e) =>
                updateAttribute(attr.id, {
                  attribute_value_id: e.target.value ? Number(e.target.value) : null,
                  text_value: null
                })
              }
              required={attr.required}
            >
              <option value="">Select</option>
              {attr.values?.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label || v.value}
                </option>
              ))}
            </select>
          )
        }

        return (
          <input
            style={input}
            type="text"
            value={value.text_value || ""}
            onChange={(e) =>
              updateAttribute(attr.id, { 
                text_value: e.target.value,
                attribute_value_id: null
              })
            }
            required={attr.required}
            placeholder={`Enter ${attr.label}`}
          />
        )

      case "textarea":
        return (
          <textarea
            style={textarea}
            value={value.text_value || ""}
            onChange={(e) =>
              updateAttribute(attr.id, { 
                text_value: e.target.value,
                attribute_value_id: null
              })
            }
            required={attr.required}
            placeholder={`Enter ${attr.label}`}
            rows={4}
          />
        )

      case "integer":
        return (
          <input
            style={input}
            type="number"
            step="1"
            value={value.integer_value !== null && value.integer_value !== undefined ? value.integer_value : ""}
            onChange={(e) => {
              const val = e.target.value;
              updateAttribute(attr.id, {
                integer_value: val ? parseInt(val, 10) : null,
                text_value: null,
                attribute_value_id: null
              })
            }}
            required={attr.required}
            placeholder={`Enter ${attr.label}`}
          />
        )

      case "decimal":
      case "price":
        return (
          <input
            style={input}
            type="number"
            step="0.01"
            value={value.decimal_value !== null && value.decimal_value !== undefined ? value.decimal_value : ""}
            onChange={(e) => {
              const val = e.target.value;
              updateAttribute(attr.id, {
                decimal_value: val ? parseFloat(val) : null,
                text_value: null,
                attribute_value_id: null
              })
            }}
            required={attr.required}
            placeholder={`Enter ${attr.label}`}
          />
        )

      case "boolean":
        return (
          <select
            style={input}
            value={value.boolean_value === undefined || value.boolean_value === null ? "" : String(value.boolean_value)}
            onChange={(e) => {
              const val = e.target.value;
              updateAttribute(attr.id, { 
                boolean_value: val === "" ? null : val === "true",
                text_value: null,
                attribute_value_id: null
              })
            }}
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
            onChange={(e) => {
              const val = e.target.value;
              updateAttribute(attr.id, { 
                attribute_value_id: val ? Number(val) : null,
                text_value: null
              })
            }}
            required={attr.required}
          >
            <option value="">Select</option>
            {attr.values?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label || v.value}
              </option>
            ))}
          </select>
        )

      case "multiselect":
        return (
          <select
            multiple
            style={{ ...input, height: "auto", minHeight: "100px" }}
            value={value.attribute_value_ids?.map(String) || []}
            onChange={(e) => {
              const selectedOptions = Array.from(e.target.selectedOptions);
              const arr = selectedOptions.map((o) => Number(o.value));
              updateAttribute(attr.id, { 
                attribute_value_ids: arr,
                text_value: null
              })
            }}
            required={attr.required}
          >
            {attr.values?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label || v.value}
              </option>
            ))}
          </select>
        )

      case "date":
        return (
          <input
            style={input}
            type="date"
            value={value.date_value || ""}
            onChange={(e) => {
              updateAttribute(attr.id, { 
                date_value: e.target.value,
                text_value: null,
                attribute_value_id: null
              })
            }}
            required={attr.required}
          />
        )

      case "media":
      case "media_image":
        return (
          <div>
            {value.media_path && (
              <div style={{ marginBottom: 8 }}>
                <img 
                  src={value.media_path} 
                  alt="Preview" 
                  style={{ maxWidth: 100, maxHeight: 100, borderRadius: 4 }}
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  updateAttribute(attr.id, { 
                    media_path: URL.createObjectURL(file),
                    text_value: null,
                    attribute_value_id: null
                  })
                }
              }}
              required={attr.required}
            />
          </div>
        )

      default:
        return (
          <div>
            <input
              style={input}
              type="text"
              value={value.text_value || ""}
              onChange={(e) =>
                updateAttribute(attr.id, { 
                  text_value: e.target.value,
                  attribute_value_id: null
                })
              }
              placeholder={`Enter ${attr.label} (${attr.attribute_type})`}
            />
            <small style={{ color: "#6b7280", fontSize: "12px" }}>
              Unsupported attribute type: {attr.attribute_type} - using text input as fallback
            </small>
          </div>
        )
    }
  }

  const updateAttribute = useCallback((attribute_id: number, newValue: Partial<AttributeValue>) => {
    setAttributeValues((prev) => {
      const current = prev[attribute_id] || { attribute_id };
      return {
        ...prev,
        [attribute_id]: { 
          ...current, 
          ...newValue 
        },
      };
    });
  }, [])

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
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
    const hasChildren = node.children && node.children.length > 0
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

  // Find selected category names
  const selectedCategoryNames = form.categories
    .map(catId => {
      const findCategory = (nodes: CategoryNode[]): string | undefined => {
        for (const node of nodes) {
          if (node.id === catId) return node.name;
          if (node.children) {
            const found = findCategory(node.children);
            if (found) return found;
          }
        }
        return undefined;
      };
      return findCategory(categories);
    })
    .filter(Boolean) as string[];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      if (!form.product_code.trim() || !form.name.trim() || !form.base_price) {
        throw new Error("Please fill in all required fields")
      }

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

      // Append attributes - only include attributes with values
      Object.values(attributeValues).forEach(attr => {
        if (attr.attribute_id) {
          // Create a clean attribute object with only defined values
          const cleanAttr: any = { attribute_id: attr.attribute_id }
          
          // Only add fields that have values
          if (attr.text_value !== undefined && attr.text_value !== null && attr.text_value !== '') {
            cleanAttr.text_value = attr.text_value
          }
          if (attr.decimal_value !== undefined && attr.decimal_value !== null) {
            cleanAttr.decimal_value = attr.decimal_value
          }
          if (attr.integer_value !== undefined && attr.integer_value !== null) {
            cleanAttr.integer_value = attr.integer_value
          }
          if (attr.boolean_value !== undefined && attr.boolean_value !== null) {
            cleanAttr.boolean_value = attr.boolean_value
          }
          if (attr.attribute_value_id !== undefined && attr.attribute_value_id !== null) {
            cleanAttr.attribute_value_id = attr.attribute_value_id
          }
          if (attr.attribute_value_ids !== undefined && attr.attribute_value_ids.length > 0) {
            cleanAttr.attribute_value_ids = attr.attribute_value_ids
          }
          if (attr.media_path !== undefined && attr.media_path !== null) {
            cleanAttr.media_path = attr.media_path
          }
          if (attr.date_value !== undefined && attr.date_value !== null && attr.date_value !== '') {
            cleanAttr.date_value = attr.date_value
          }
          
          // Only add attribute if it has at least one value field (besides attribute_id)
          if (Object.keys(cleanAttr).length > 1) {
            formData.append('attributes[]', JSON.stringify(cleanAttr))
          }
        }
      })

      // Append gallery images - separate new and existing
      gallery.forEach((img, index) => {
        if (img.file) {
          // New image file
          formData.append(`new_gallery[]`, img.file)
        } else if (img.existing) {
          // Existing image ID
          formData.append(`existing_gallery[]`, img.id?.toString() || "")
        }
      })

      console.log('Updating product with attributes:', Array.from(formData.entries()))

      const res = await fetch(`/admin/mp/product/products/${id}`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update product")
      }

      setSuccess("Product updated successfully!")
      
      // Refresh product data
      await fetchProduct()
      
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setSaving(false)
    }
  }

  const clearForm = () => {
    if (id) {
      fetchProduct()
    }
  }

  if (loading) {
    return (
      <div style={wrapper}>
        <div style={header}>
          <h1 style={title}>Edit Product</h1>
          <div style={headerActions}>
            <button type="button" style={backBtn} onClick={() => navigate("/redington-product-listing")}>
              ← Back to List
            </button>
          </div>
        </div>
        <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
          Loading product data...
        </div>
      </div>
    )
  }

  return (
    <div style={wrapper}>
      <div style={header}>
        <h1 style={title}>Edit Product</h1>
        <div style={headerActions}>
          <button type="button" style={secondaryBtn} onClick={clearForm}>
            Reset Changes
          </button>
          <button type="button" style={backBtn} onClick={() => navigate("/redington-product-listing")}>
            ← Back to List
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
            
            <FormField label="Attribute Set">
              <select
                name="attribute_set"
                value={form.attribute_set}
                onChange={handleChange}
                style={input}
              >
                <option value="">Select Attribute Set</option>
                {attributeSets.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.name}
                  </option>
                ))}
              </select>
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
            
            <FormField label="Visibility">
              <select
                name="visibility"
                value={form.visibility}
                onChange={handleChange}
                style={input}
              >
                <option value="catalogsearch">Catalog, Search</option>
                <option value="not_visible">Not Visible Individually</option>
                <option value="catalog">Catalog</option>
                <option value="search">Search</option>
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
                  <div style={selectedCategories}>
                    <strong>Selected: </strong>
                    {selectedCategoryNames.length === 0 
                      ? "None" 
                      : selectedCategoryNames.join(", ")
                    }
                  </div>
                </div>
              )}
            </FormField>

            {attributes.length > 0 && (
              <FormField label="Attributes">
                <div style={attributesBox}>
                  {attributes.map((attr) => (
                    <div key={attr.id} style={attributeItem}>
                      <label style={attributeLabel}>
                        {attr.label} ({attr.attribute_type})
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
                  onChange={handleGalleryUpload}
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
            disabled={saving}
            type="submit"
          >
            {saving ? (
              <>
                <span style={spinner}></span>
                Updating...
              </>
            ) : (
              "Update Product"
            )}
          </button>
        </div>
      </form>
      
      {/* Add CSS for spinner animation */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
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

const backBtn: React.CSSProperties = {
  padding: "8px 16px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 500,
}

const secondaryBtn: React.CSSProperties = {
  ...backBtn,
  color: "#6b7280",
}

const formBox: React.CSSProperties = {
  background: "#fff",
  padding: 32,
  borderRadius: 12,
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
}

const formGrid: React.CSSProperties = {
  display: "grid",
  gap: "32px",
}

const formSection: React.CSSProperties = {
  padding: 24,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  backgroundColor: "#fafafa",
}

const sectionTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: "#374151",
  marginTop: 0,
  marginBottom: 20,
  paddingBottom: 12,
  borderBottom: "2px solid #e5e7eb",
}

const fieldRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  marginBottom: 20,
  gap: 20,
}

const labelStyle: React.CSSProperties = {
  width: 180,
  fontWeight: 500,
  fontSize: "14px",
  color: "#374151",
  flexShrink: 0,
}

const input: React.CSSProperties = {
  flex: 1,
  padding: "10px 12px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  fontSize: "14px",
  fontFamily: "inherit",
  width: "100%"
}

const textarea: React.CSSProperties = {
  ...input,
  height: "auto",
  minHeight: "80px",
  resize: "vertical" as const,
}

const searchInput: React.CSSProperties = {
  ...input,
  marginBottom: "12px",
}

const treeBox: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 6,
  padding: 16,
  maxHeight: 300,
  overflowY: "auto" as const,
  backgroundColor: "#fff",
  fontSize: "14px",
}

const categorySection: React.CSSProperties = {
  flex: 1,
}

const selectedCategories: React.CSSProperties = {
  marginTop: "12px",
  padding: "8px 12px",
  backgroundColor: "#f3f4f6",
  borderRadius: 4,
  fontSize: "14px",
}

const attributesBox: React.CSSProperties = {
  padding: "16px",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  backgroundColor: "#fff",
  width: "100%",
}

const attributeItem: React.CSSProperties = {
  marginBottom: 20,
}

const attributeLabel: React.CSSProperties = {
  display: "block",
  fontWeight: 500,
  marginBottom: 6,
  fontSize: "14px",
  color: "#374151",
}

const gallerySection: React.CSSProperties = {
  flex: 1,
}

const fileInput: React.CSSProperties = {
  width: "100%",
  marginBottom: 16,
}

const galleryGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
  gap: 12,
  marginTop: 12,
}

const galleryItem: React.CSSProperties = {
  position: "relative" as const,
}

const galleryImage: React.CSSProperties = {
  width: "100%",
  height: 80,
  objectFit: "cover" as const,
  borderRadius: 6,
  border: "1px solid #e5e7eb",
}

const removeImageBtn: React.CSSProperties = {
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

const submitSection: React.CSSProperties = {
  marginTop: 32,
  paddingTop: 24,
  borderTop: "1px solid #e5e7eb",
}

const submitBtn: React.CSSProperties = {
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

const errorAlert: React.CSSProperties = {
  padding: "12px 16px",
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: 6,
  color: "#dc2626",
  marginBottom: 24,
  fontSize: "14px",
}

const successAlert: React.CSSProperties = {
  padding: "12px 16px",
  backgroundColor: "#f0fdf4",
  border: "1px solid #bbf7d0",
  borderRadius: 6,
  color: "#16a34a",
  marginBottom: 24,
  fontSize: "14px",
}

const loadingText: React.CSSProperties = {
  color: "#6b7280",
  fontStyle: "italic",
  padding: "20px",
  textAlign: "center" as const,
}

const emptyState: React.CSSProperties = {
  color: "#6b7280",
  fontStyle: "italic",
  textAlign: "center" as const,
  padding: "20px",
}

const requiredStar: React.CSSProperties = {
  color: "#dc2626",
}

const spinner: React.CSSProperties = {
  width: 16,
  height: 16,
  border: "2px solid rgba(255,255,255,0.3)",
  borderTop: "2px solid currentColor",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
}

export const config = defineRouteConfig({
  path: "/redington-product-edit/:id",
})

export default EditProductPage