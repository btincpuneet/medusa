import React, { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { productApi, type ProductSummary } from "../../utils/productApi"

const BASE_PATH = "/redington-products"

const ProductDetails: React.FC = () => {
  const navigate = useNavigate()
  const params = useParams()
  const productId = params.id
  const [product, setProduct] = useState<ProductSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!productId) {
      setError("Missing product id.")
      setLoading(false)
      return
    }
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await productApi.retrieve(productId)
        if (!data.product) {
          throw new Error(data.message || "Product not found.")
        }
        setProduct(data.product)
      } catch (err: any) {
        setError(err.message || "Failed to load product.")
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [productId])

  if (loading) {
    return (
      <div style={{ padding: 16, color: "#6b7280" }}>Loading product…</div>
    )
  }

  if (error || !product) {
    return (
      <div style={{ padding: 16 }}>
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
          {error || "Product not found."}
        </div>
        <button
          type="button"
          onClick={() => navigate(BASE_PATH)}
          style={{
            background: "#111827",
            color: "#fff",
            border: "none",
            padding: "10px 14px",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Back to list
        </button>
      </div>
    )
  }

  const sku = product.variant_skus?.[0] || "-"

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
          <h1 style={{ margin: 0, fontSize: 24 }}>{product.title}</h1>
          <p style={{ color: "#6b7280", margin: "4px 0 0" }}>
            {product.id}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link
            to={`${BASE_PATH}/${product.id}/edit`}
            style={{
              background: "#1d4ed8",
              color: "#fff",
              padding: "10px 14px",
              borderRadius: 6,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => navigate(BASE_PATH)}
            style={{
              background: "#fff",
              color: "#111827",
              border: "1px solid #d1d5db",
              padding: "10px 14px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Back
          </button>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 16,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Name</div>
          <div style={{ color: "#374151" }}>{product.title || "-"}</div>
        </div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Handle</div>
          <div style={{ color: "#374151" }}>{product.handle || "-"}</div>
        </div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>SKU</div>
          <div style={{ color: "#374151" }}>{sku}</div>
        </div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Status</div>
          <div style={{ color: "#374151" }}>
            {product.status || "unknown"}
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Company Code</div>
          <div style={{ color: "#374151" }}>
            {product.company_code || "-"}
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            Distribution Channel
          </div>
          <div style={{ color: "#374151" }}>
            {product.distribution_channel || "-"}
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Created</div>
          <div style={{ color: "#374151" }}>
            {new Date(product.created_at).toLocaleString()}
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Updated</div>
          <div style={{ color: "#374151" }}>
            {new Date(product.updated_at).toLocaleString()}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 16,
          marginTop: 16,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Description</div>
        <div style={{ color: "#374151", whiteSpace: "pre-wrap" }}>
          {product.description || "No description."}
        </div>
      </div>
    </div>
  )
}

export default ProductDetails
