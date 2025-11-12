import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useCallback, useEffect, useMemo, useState } from "react"

type Product = {
  id: string
  title: string
  handle: string | null
  status: string
  subtitle: string | null
  description: string | null
  thumbnail: string | null
  company_code: string | null
  distribution_channel: string | null
  variant_skus: string[]
  updated_at: string | Date
  created_at: string | Date
}

type ProductListResponse = {
  products: Product[]
  count: number
  limit: number
  offset: number
}

type ProductDetailResponse = {
  product?: Product
  metadata_changes?: {
    company_code: boolean
    distribution_channel: boolean
  }
  sap_sync?: {
    triggered: boolean
    results: Array<{ sku: string; status: "success" | "error"; message?: string }>
  }
  message?: string
}

type Filters = {
  q: string
  sku: string
  handle: string
  id: string
}

type MetadataForm = {
  company_code: string
  distribution_channel: string
}

const initialFilters: Filters = {
  q: "",
  sku: "",
  handle: "",
  id: "",
}

const initialMetadataForm: MetadataForm = {
  company_code: "",
  distribution_channel: "",
}

const toDateTime = (value: string | Date) => {
  if (value instanceof Date) {
    return value.toLocaleString()
  }
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

const ProductModulePage: React.FC = () => {
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [products, setProducts] = useState<Product[]>([])
  const [count, setCount] = useState(0)
  const [limit, setLimit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<Product | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [metadataForm, setMetadataForm] = useState<MetadataForm>(
    initialMetadataForm
  )
  const [metadataMessage, setMetadataMessage] = useState<string | null>(null)
  const [metadataBusy, setMetadataBusy] = useState(false)
  const [sapResults, setSapResults] = useState<
    Array<{ sku: string; status: "success" | "error"; message?: string }>
  >([])

  const fetchJson = useCallback(
    async (url: string, init?: RequestInit) => {
      const response = await fetch(url, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        ...init,
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        const message =
          body?.message ||
          `Request failed with status ${response.status.toString()}`
        throw new Error(message)
      }

      return response.json().catch(() => ({}))
    },
    []
  )

  const buildQuery = useCallback(
    (override?: Partial<{ limit: number; offset: number }>) => {
      const params = new URLSearchParams()
      const nextLimit = override?.limit ?? limit
      const nextOffset = override?.offset ?? offset
      params.set("limit", String(nextLimit))
      params.set("offset", String(nextOffset))

      Object.entries(filters).forEach(([key, value]) => {
        if (value.trim()) {
          params.set(key, value.trim())
        }
      })

      return params.toString()
    },
    [filters, limit, offset]
  )

  const loadProducts = useCallback(
    async (override?: Partial<{ limit: number; offset: number }>) => {
      setIsLoading(true)
      setError(null)
      try {
        const query = buildQuery(override)
        const data = (await fetchJson(
          `/admin/redington/product${query ? `?${query}` : ""}`
        )) as ProductListResponse
        setProducts(data.products ?? [])
        setCount(data.count ?? 0)
        setLimit(data.limit ?? 20)
        setOffset(data.offset ?? 0)
        setSelectedId((current) => {
          if (current && data.products?.some((p) => p.id === current)) {
            return current
          }
          return data.products?.[0]?.id ?? null
        })
      } catch (err: any) {
        setError(err.message || "Unable to load products.")
        setProducts([])
        setCount(0)
        setSelectedId(null)
      } finally {
        setIsLoading(false)
      }
    },
    [buildQuery, fetchJson]
  )

  const loadDetail = useCallback(
    async (productId: string | null) => {
      if (!productId) {
        setDetail(null)
        setDetailError(null)
        setMetadataForm(initialMetadataForm)
        setSapResults([])
        return
      }
      setDetailLoading(true)
      setDetailError(null)
      try {
        const data = (await fetchJson(
          `/admin/redington/product/${productId}`
        )) as ProductDetailResponse
        if (data.product) {
          setDetail(data.product)
          setMetadataForm({
            company_code: data.product.company_code ?? "",
            distribution_channel: data.product.distribution_channel ?? "",
          })
          setSapResults([])
        } else {
          throw new Error(data.message || "Product details not available.")
        }
      } catch (err: any) {
        setDetail(null)
        setMetadataForm(initialMetadataForm)
        setDetailError(err.message || "Unable to load product.")
      } finally {
        setDetailLoading(false)
      }
    },
    [fetchJson]
  )

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    loadDetail(selectedId)
  }, [selectedId, loadDetail])

  const handleFilterChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSearch = () => {
    loadProducts({ offset: 0 })
  }

  const handleResetFilters = () => {
    setFilters(initialFilters)
    loadProducts({ offset: 0 })
  }

  const handlePaginate = (direction: "prev" | "next") => {
    if (direction === "prev") {
      const nextOffset = Math.max(0, offset - limit)
      loadProducts({ offset: nextOffset })
    } else {
      if (count && offset + limit >= count) {
        return
      }
      const nextOffset = offset + limit
      loadProducts({ offset: nextOffset })
    }
  }

  const selectedProduct = useMemo(
    () =>
      detail ||
      products.find((product) => product.id === selectedId) ||
      null,
    [detail, products, selectedId]
  )

  const handleMetadataChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target
    setMetadataForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleMetadataSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedId) {
      return
    }

    setMetadataBusy(true)
    setMetadataMessage(null)
    setSapResults([])
    try {
      const payload: Record<string, string | null> = {}
      payload.company_code = metadataForm.company_code.trim() || null
      payload.distribution_channel =
        metadataForm.distribution_channel.trim() || null

      const data = (await fetchJson(
        `/admin/redington/product/${selectedId}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      )) as ProductDetailResponse

      if (data.product) {
        setDetail(data.product)
        setMetadataForm({
          company_code: data.product.company_code ?? "",
          distribution_channel: data.product.distribution_channel ?? "",
        })
      }

      if (data.sap_sync?.results?.length) {
        setSapResults(data.sap_sync.results)
      } else {
        setSapResults([])
      }

      if (data.metadata_changes) {
        const keys = Object.entries(data.metadata_changes)
          .filter(([, changed]) => changed)
          .map(([key]) => key.replace("_", " "))
        setMetadataMessage(
          keys.length
            ? `Updated ${keys.join(" & ")} successfully.`
            : data.message || "No changes detected."
        )
      } else {
        setMetadataMessage(data.message || "Product metadata updated.")
      }
    } catch (err: any) {
      setMetadataMessage(err.message || "Failed to update product metadata.")
    } finally {
      setMetadataBusy(false)
      loadProducts()
    }
  }

  return (
    <div style={{ padding: "24px 16px 64px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Product Enhancements</h1>
        <p style={{ color: "#5f6c7b", marginTop: 8, maxWidth: 720 }}>
          Manage Redington-specific metadata (company code & distribution
          channel) on top of Medusa products. Updates trigger SAP sync via
          the <code>sap-client</code> hooks backed by{" "}
          <code>redington_product</code>.
        </p>
      </div>

      <section
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 20,
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
          marginBottom: 24,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Search Products</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <label
              htmlFor="q"
              style={{ display: "block", fontWeight: 500, marginBottom: 4 }}
            >
              Search (title/description)
            </label>
            <input
              id="q"
              name="q"
              value={filters.q}
              onChange={handleFilterChange}
              placeholder="Laptop bundle"
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
              }}
            />
          </div>
          {["sku", "handle", "id"].map((key) => (
            <div key={key}>
              <label
                htmlFor={key}
                style={{
                  display: "block",
                  fontWeight: 500,
                  marginBottom: 4,
                  textTransform: "capitalize",
                }}
              >
                {key}
              </label>
              <input
                id={key}
                name={key}
                value={(filters as any)[key]}
                onChange={handleFilterChange}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontFamily:
                    key === "id" ? "SFMono-Regular, monospace" : undefined,
                }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={handleSearch}
            style={{
              border: "none",
              borderRadius: 6,
              padding: "10px 16px",
              background: "#111827",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 6,
              padding: "10px 16px",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Reset
          </button>
          <div style={{ marginLeft: "auto", color: "#6b7280" }}>
            Showing {products.length} of {count} results
          </div>
        </div>
      </section>

      <section
        style={{
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0 }}>Products</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => handlePaginate("prev")}
              disabled={isLoading || offset === 0}
              style={{
                border: "1px solid #d1d5db",
                background: offset === 0 ? "#f3f4f6" : "#fff",
                padding: "6px 12px",
                borderRadius: 6,
                cursor: offset === 0 ? "not-allowed" : "pointer",
              }}
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => handlePaginate("next")}
              disabled={isLoading || (count > 0 && offset + limit >= count)}
              style={{
                border: "1px solid #d1d5db",
                background:
                  count > 0 && offset + limit >= count ? "#f3f4f6" : "#fff",
                padding: "6px 12px",
                borderRadius: 6,
                cursor:
                  count > 0 && offset + limit >= count
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              Next
            </button>
          </div>
        </div>
        {error && (
          <div
            style={{
              padding: 16,
              color: "#b91c1c",
              background: "#fef2f2",
              borderBottom: "1px solid #fecaca",
            }}
          >
            {error}
          </div>
        )}
        {!error && (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                  {[
                    "Title",
                    "Company Code",
                    "Distribution Channel",
                    "Variants",
                    "Updated",
                  ].map((label) => (
                    <th
                      key={label}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #e5e7eb",
                        color: "#4b5563",
                        fontWeight: 600,
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: 16,
                        textAlign: "center",
                        color: "#6b7280",
                      }}
                    >
                      Loading products…
                    </td>
                  </tr>
                )}
                {!isLoading && products.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: 16,
                        textAlign: "center",
                        color: "#6b7280",
                      }}
                    >
                      No products found. Adjust filters to broaden your search.
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  products.map((product) => {
                    const selected = product.id === selectedId
                    return (
                      <tr
                        key={product.id}
                        onClick={() => setSelectedId(product.id)}
                        style={{
                          cursor: "pointer",
                          background: selected ? "#eff6ff" : "#fff",
                          borderBottom: "1px solid #f3f4f6",
                        }}
                      >
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ fontWeight: 600 }}>{product.title}</div>
                          <div style={{ color: "#6b7280", fontSize: 12 }}>
                            {product.handle ? `/${product.handle}` : product.id}
                          </div>
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          {product.company_code || "-"}
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          {product.distribution_channel || "-"}
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          {product.variant_skus.length}
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          {toDateTime(product.updated_at)}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
        }}
      >
        <div
          style={{
            flex: "1 1 360px",
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
            padding: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Metadata</h2>
          {detailError && (
            <div
              style={{
                padding: 12,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 6,
                color: "#b91c1c",
                marginBottom: 12,
              }}
            >
              {detailError}
            </div>
          )}
          {detailLoading && <div style={{ color: "#6b7280" }}>Loading…</div>}
          {!detailLoading && !selectedProduct && (
            <div style={{ color: "#6b7280" }}>
              Select a product above to edit metadata.
            </div>
          )}
          {selectedProduct && (
            <>
              <div style={{ marginBottom: 16 }}>
                <strong>{selectedProduct.title}</strong>
                <div style={{ color: "#6b7280", fontSize: 13 }}>
                  {selectedProduct.id}
                </div>
              </div>
              <dl
                style={{
                  display: "grid",
                  gridTemplateColumns: "max-content 1fr",
                  columnGap: 12,
                  rowGap: 8,
                  marginBottom: 16,
                }}
              >
                <dt style={{ fontWeight: 600 }}>Current Company Code</dt>
                <dd style={{ margin: 0 }}>
                  {selectedProduct.company_code || "—"}
                </dd>
                <dt style={{ fontWeight: 600 }}>Current Distribution</dt>
                <dd style={{ margin: 0 }}>
                  {selectedProduct.distribution_channel || "—"}
                </dd>
                <dt style={{ fontWeight: 600 }}>Variant SKUs</dt>
                <dd style={{ margin: 0 }}>
                  {selectedProduct.variant_skus.length
                    ? selectedProduct.variant_skus.join(", ")
                    : "—"}
                </dd>
              </dl>
              <form onSubmit={handleMetadataSubmit}>
                <div style={{ marginBottom: 12 }}>
                  <label
                    htmlFor="company_code"
                    style={{
                      display: "block",
                      fontWeight: 500,
                      marginBottom: 4,
                    }}
                  >
                    Company Code
                  </label>
                  <input
                    id="company_code"
                    name="company_code"
                    value={metadataForm.company_code}
                    onChange={handleMetadataChange}
                    placeholder="e.g. 1140"
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                    }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label
                    htmlFor="distribution_channel"
                    style={{
                      display: "block",
                      fontWeight: 500,
                      marginBottom: 4,
                    }}
                  >
                    Distribution Channel
                  </label>
                  <input
                    id="distribution_channel"
                    name="distribution_channel"
                    value={metadataForm.distribution_channel}
                    onChange={handleMetadataChange}
                    placeholder="e.g. 10"
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                    }}
                  />
                </div>
                {metadataMessage && (
                  <div
                    style={{
                      padding: 10,
                      background: metadataMessage.includes("Failed")
                        ? "#fef2f2"
                        : "#ecfdf5",
                      border: "1px solid",
                      borderColor: metadataMessage.includes("Failed")
                        ? "#fecaca"
                        : "#bbf7d0",
                      borderRadius: 6,
                      color: metadataMessage.includes("Failed")
                        ? "#b91c1c"
                        : "#16a34a",
                      marginBottom: 12,
                    }}
                  >
                    {metadataMessage}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={metadataBusy}
                  style={{
                    border: "none",
                    borderRadius: 6,
                    padding: "10px 16px",
                    background: metadataBusy ? "#9ca3af" : "#1d4ed8",
                    color: "#fff",
                    cursor: metadataBusy ? "not-allowed" : "pointer",
                  }}
                >
                  {metadataBusy ? "Saving…" : "Save Metadata"}
                </button>
              </form>
            </>
          )}
        </div>

        <div
          style={{
            flex: "1 1 360px",
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
            padding: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>SAP Sync Results</h2>
          {sapResults.length === 0 ? (
            <p style={{ color: "#6b7280" }}>
              Update metadata to trigger SAP sync. Latest results will appear
              here, mirroring Magento{"'"}s product export behaviour.
            </p>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    background: "#f9fafb",
                  }}
                >
                  <th style={{ padding: "8px 12px" }}>SKU</th>
                  <th style={{ padding: "8px 12px" }}>Status</th>
                  <th style={{ padding: "8px 12px" }}>Message</th>
                </tr>
              </thead>
              <tbody>
                {sapResults.map((result) => (
                  <tr key={`${result.sku}-${result.status}-${result.message ?? ""}`}>
                    <td
                      style={{
                        padding: "8px 12px",
                        fontFamily: "SFMono-Regular, monospace",
                      }}
                    >
                      {result.sku}
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 8px",
                          borderRadius: 999,
                          fontWeight: 600,
                          background:
                            result.status === "success"
                              ? "#dcfce7"
                              : "#fee2e2",
                          color:
                            result.status === "success"
                              ? "#15803d"
                              : "#b91c1c",
                        }}
                      >
                        {result.status}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", color: "#6b7280" }}>
                      {result.message || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}

export const config = defineRouteConfig({})

export default ProductModulePage
