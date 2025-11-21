import React, { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { productApi, type ProductFormPayload, type ProductSummary } from "../../utils/productApi"

type ProductFormProps = {
  mode: "create" | "edit"
}

type Category = {
  id: number
  name: string
}

const DEFAULT_STATUS = "draft"

const ProductForm: React.FC<ProductFormProps> = ({ mode }) => {
  const navigate = useNavigate()
  const params = useParams()
  const productId = params.id
  const BASE_PATH = "/redington-products"

  const [form, setForm] = useState<ProductFormPayload>({
    title: "",
    handle: "",
    subtitle: "",
    description: "",
    status: DEFAULT_STATUS,
    thumbnail: "",
    company_code: "",
    distribution_channel: "",
    sku: "",
    price: "",
    weight: "",
    attribute_set: "Default",
    tax_class: "Taxable Goods",
    visibility: "Catalog, Search",
    categories: [],
    brand: "",
    country_of_manufacture: "",
    enable_rma: false,
    on_home: false,
    product_delivery_tag: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesError, setCategoriesError] = useState<string | null>(null)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/admin/product/category", {
          credentials: "include",
        })
        if (!res.ok) {
          throw new Error("Failed to load categories")
        }
        const body = (await res.json()) as { categories?: Category[] }
        setCategories(body.categories ?? [])
        setCategoriesError(null)
      } catch (err: any) {
        setCategoriesError(err.message || "Unable to load categories.")
        setCategories([])
      }
    }
    loadCategories()
  }, [])

  useEffect(() => {
    if (mode === "edit" && productId) {
      const load = async () => {
        setLoading(true)
        setError(null)
        try {
          const data = await productApi.retrieve(productId)
          if (data.product) {
            const product = data.product as ProductSummary
            setForm({
              title: product.title || "",
              handle: product.handle || "",
              subtitle: product.subtitle || "",
              description: product.description || "",
              status: product.status || DEFAULT_STATUS,
              thumbnail: product.thumbnail || "",
              company_code: product.company_code || "",
              distribution_channel: product.distribution_channel || "",
              sku: (product.metadata as any)?.sku_input || "",
              price: (product.metadata as any)?.price || "",
              weight: (product.metadata as any)?.weight || "",
              attribute_set: (product.metadata as any)?.attribute_set || "Default",
              tax_class: (product.metadata as any)?.tax_class || "Taxable Goods",
              visibility: (product.metadata as any)?.visibility || "Catalog, Search",
              categories: Array.isArray((product.metadata as any)?.categories)
                ? ((product.metadata as any)?.categories as any[])
                : [],
              brand: (product.metadata as any)?.brand || "",
              country_of_manufacture:
                (product.metadata as any)?.country_of_manufacture || "",
              enable_rma: Boolean((product.metadata as any)?.enable_rma) || false,
              on_home: Boolean((product.metadata as any)?.on_home) || false,
              product_delivery_tag:
                (product.metadata as any)?.product_delivery_tag || "",
            })
          } else {
            throw new Error("Product not found.")
          }
        } catch (err: any) {
          setError(err.message || "Failed to load product.")
        } finally {
          setLoading(false)
        }
      }
      load()
    }
  }, [mode, productId])

  const handleChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const toggleCategory = (id: number) => {
    setForm((prev) => {
      const current = new Set(prev.categories || [])
      if (current.has(id)) {
        current.delete(id)
      } else {
        current.add(id)
      }
      return {
        ...prev,
        categories: Array.from(current),
      }
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (loading) return
    if (!form.title.trim()) {
      setError("Title is required.")
      return
    }
    if (!form.sku?.toString().trim()) {
      setError("SKU is required.")
      return
    }
    if (!form.price?.toString().trim()) {
      setError("Price is required.")
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(null)

    const payload: ProductFormPayload = {
      ...form,
      company_code: form.company_code?.trim() || null,
      distribution_channel: form.distribution_channel?.trim() || null,
      thumbnail: form.thumbnail?.trim() || null,
      sku: form.sku?.toString().trim() || null,
      price: form.price?.toString().trim() || null,
      weight: form.weight?.toString().trim() || null,
      attribute_set: form.attribute_set?.toString().trim() || null,
      tax_class: form.tax_class?.toString().trim() || null,
      visibility: form.visibility?.toString().trim() || null,
      categories: form.categories ?? [],
      brand: form.brand?.toString().trim() || null,
      country_of_manufacture: form.country_of_manufacture?.toString().trim() || null,
      enable_rma: !!form.enable_rma,
      on_home: !!form.on_home,
      product_delivery_tag: form.product_delivery_tag?.toString().trim() || null,
      status: form.status || (form.enable_rma ? "published" : "draft"),
    }

    try {
      let product: ProductSummary
      if (mode === "create") {
        product = await productApi.create(payload)
        setSuccess("Product created.")
        navigate(`${BASE_PATH}/${product.id}`)
        return
      }

      if (!productId) {
        throw new Error("Missing product id.")
      }

      product = await productApi.update(productId, payload)

      // Ensure SAP sync path is triggered when metadata changes.
      await productApi.updateMetadata(productId, {
        company_code: payload.company_code,
        distribution_channel: payload.distribution_channel,
      })

      setSuccess("Product updated.")
      navigate(`${BASE_PATH}/${product.id}`)
    } catch (err: any) {
      setError(err.message || "Save failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: "16px 12px 48px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>
            {mode === "create" ? "Create Product" : "Edit Product"}
          </h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280" }}>
            {mode === "create"
              ? "Create a new product with basic details and metadata."
              : "Update product details and Redington metadata."}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 16,
          maxWidth: 900,
        }}
      >
        {error && (
          <div
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
              padding: 12,
              border: "1px solid #fecaca",
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            style={{
              background: "#ecfdf3",
              color: "#166534",
              padding: 12,
              border: "1px solid #bbf7d0",
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            {success}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontWeight: 600, color: "#111827" }}>Enable Product</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="checkbox"
                checked={(form.status || DEFAULT_STATUS) !== "draft"}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.checked ? "published" : "draft",
                  }))
                }
              />
              <span style={{ color: "#374151" }}>
                {(form.status || DEFAULT_STATUS) !== "draft" ? "Yes" : "No"}
              </span>
            </div>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontWeight: 600, color: "#111827" }}>Attribute Set</span>
            <input
              name="attribute_set"
              value={form.attribute_set as string}
              onChange={handleChange}
              placeholder="Default"
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "10px 12px",
              }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontWeight: 600, color: "#111827" }}>Tax Class</span>
            <input
              name="tax_class"
              value={form.tax_class as string}
              onChange={handleChange}
              placeholder="Taxable Goods"
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "10px 12px",
              }}
            />
          </label>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontWeight: 600, color: "#111827" }}>Product Name *</span>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Product name"
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "10px 12px",
              }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontWeight: 600, color: "#111827" }}>SKU *</span>
            <input
              name="sku"
              value={(form.sku as string) || ""}
              onChange={handleChange}
              placeholder="Unique SKU"
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "10px 12px",
              }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontWeight: 600, color: "#111827" }}>Handle</span>
            <input
              name="handle"
              value={form.handle}
              onChange={handleChange}
              placeholder="slug-for-product"
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "10px 12px",
              }}
            />
          </label>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontWeight: 600, color: "#111827" }}>Price *</span>
            <input
              name="price"
              value={(form.price as string) || ""}
              onChange={handleChange}
              placeholder="0.00"
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "10px 12px",
              }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontWeight: 600, color: "#111827" }}>Weight</span>
            <input
              name="weight"
              value={(form.weight as string) || ""}
              onChange={handleChange}
              placeholder="This item has weight"
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "10px 12px",
              }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontWeight: 600, color: "#111827" }}>Visibility</span>
            <input
              name="visibility"
              value={(form.visibility as string) || ""}
              onChange={handleChange}
              placeholder="Catalog, Search"
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "10px 12px",
              }}
            />
          </label>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontWeight: 600, color: "#111827" }}>Subtitle</span>
            <input
              name="subtitle"
              value={form.subtitle}
              onChange={handleChange}
              placeholder="Short subtitle"
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "10px 12px",
              }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontWeight: 600, color: "#111827" }}>
              Thumbnail URL
            </span>
            <input
              name="thumbnail"
              value={form.thumbnail || ""}
              onChange={handleChange}
              placeholder="https://..."
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "10px 12px",
              }}
            />
          </label>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontWeight: 600, color: "#111827" }}>Description</span>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 6,
              padding: "10px 12px",
              resize: "vertical",
              minHeight: 120,
            }}
          />
        </label>

        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#fbfbfa",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Categories</div>
          {categoriesError && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                padding: 10,
                borderRadius: 6,
                marginBottom: 10,
              }}
            >
              {categoriesError}
            </div>
          )}
          <div
            style={{
              maxHeight: 240,
              overflowY: "auto",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: 10,
              background: "#fff",
            }}
          >
            {categories.length === 0 ? (
              <div style={{ color: "#6b7280", fontSize: 14 }}>
                No categories available.
              </div>
            ) : (
              categories.map((cat) => (
                <label
                  key={cat.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 4px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={(form.categories || []).includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                  />
                  <span style={{ color: "#374151" }}>{cat.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            Redington Metadata
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            <label
              style={{ display: "flex", flexDirection: "column", gap: 6 }}
            >
              <span style={{ fontWeight: 600, color: "#111827" }}>
                Company Code
              </span>
              <input
                name="company_code"
                value={form.company_code ?? ""}
                onChange={handleChange}
                placeholder="e.g. 1140"
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  padding: "10px 12px",
                }}
              />
            </label>
            <label
              style={{ display: "flex", flexDirection: "column", gap: 6 }}
            >
              <span style={{ fontWeight: 600, color: "#111827" }}>
                Distribution Channel
              </span>
              <input
                name="distribution_channel"
                value={form.distribution_channel ?? ""}
                onChange={handleChange}
                placeholder="e.g. 10"
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  padding: "10px 12px",
                }}
              />
            </label>
            <label
              style={{ display: "flex", flexDirection: "column", gap: 6 }}
            >
              <span style={{ fontWeight: 600, color: "#111827" }}>
                Brand
              </span>
              <input
                name="brand"
                value={(form.brand as string) || ""}
                onChange={handleChange}
                placeholder="Brand name"
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  padding: "10px 12px",
                }}
              />
            </label>
            <label
              style={{ display: "flex", flexDirection: "column", gap: 6 }}
            >
              <span style={{ fontWeight: 600, color: "#111827" }}>
                Country of Manufacture
              </span>
              <input
                name="country_of_manufacture"
                value={(form.country_of_manufacture as string) || ""}
                onChange={handleChange}
                placeholder="Country"
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  padding: "10px 12px",
                }}
              />
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                paddingTop: 6,
              }}
            >
              <input
                type="checkbox"
                checked={!!form.on_home}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    on_home: e.target.checked,
                  }))
                }
              />
              <span style={{ fontWeight: 600, color: "#111827" }}>
                on_home
              </span>
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                paddingTop: 6,
              }}
            >
              <input
                type="checkbox"
                checked={!!form.enable_rma}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    enable_rma: e.target.checked,
                  }))
                }
              />
              <span style={{ fontWeight: 600, color: "#111827" }}>
                Enable RMA
              </span>
            </label>
            <label
              style={{ display: "flex", flexDirection: "column", gap: 6 }}
            >
              <span style={{ fontWeight: 600, color: "#111827" }}>
                Product Delivery Tag
              </span>
              <input
                name="product_delivery_tag"
                value={(form.product_delivery_tag as string) || ""}
                onChange={handleChange}
                placeholder="Tag label"
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  padding: "10px 12px",
                }}
              />
            </label>
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#1d4ed8",
              color: "#fff",
              border: "none",
              padding: "10px 16px",
              borderRadius: 6,
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: "#fff",
              color: "#111827",
              border: "1px solid #d1d5db",
              padding: "10px 16px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProductForm
