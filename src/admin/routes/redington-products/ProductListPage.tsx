import React, { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { productApi, type ProductSummary } from "../../utils/productApi"

type QueryState = {
  q: string
  sku: string
}

type PaginationState = {
  limit: number
  offset: number
}

const DEFAULT_PAGE_SIZE = 20
const BASE_PATH = "/redington-products"

const ProductListPage: React.FC = () => {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<QueryState>({ q: "", sku: "" })
  const [pagination, setPagination] = useState<PaginationState>({
    limit: DEFAULT_PAGE_SIZE,
    offset: 0,
  })
  const [items, setItems] = useState<ProductSummary[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const totalPages = useMemo(() => {
    if (!count || pagination.limit <= 0) {
      return 1
    }
    return Math.max(1, Math.ceil(count / pagination.limit))
  }, [count, pagination.limit])

  const currentPage = useMemo(() => {
    if (pagination.limit <= 0) {
      return 1
    }
    return Math.floor(pagination.offset / pagination.limit) + 1
  }, [pagination.offset, pagination.limit])

  const fetchProducts = async (override?: Partial<PaginationState>) => {
    setLoading(true)
    setError(null)
    try {
      const nextPagination = {
        ...pagination,
        ...override,
      }
      const data = await productApi.list({
        q: filters.q.trim(),
        sku: filters.sku.trim(),
        limit: nextPagination.limit,
        offset: nextPagination.offset,
      })
      setItems(data.products ?? [])
      setCount(data.count ?? 0)
      setPagination({
        limit: data.limit ?? nextPagination.limit,
        offset: data.offset ?? nextPagination.offset,
      })
    } catch (err: any) {
      setError(err.message || "Failed to load products.")
      setItems([])
      setCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = () => {
    fetchProducts({ offset: 0 })
  }

  const handleReset = () => {
    setFilters({ q: "", sku: "" })
    fetchProducts({ offset: 0 })
  }

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Delete this product?")
    if (!confirmDelete) {
      return
    }
    setDeletingId(id)
    try {
      await productApi.remove(id)
      await fetchProducts({ offset: 0 })
    } catch (err: any) {
      alert(err.message || "Failed to delete product.")
    } finally {
      setDeletingId(null)
    }
  }

  const renderStatus = (status: string | undefined) => {
    if (!status) {
      return "-"
    }
    const isActive = ["published", "active", "enabled"].includes(
      status.toLowerCase()
    )
    return (
      <span
        style={{
          display: "inline-block",
          padding: "4px 10px",
          borderRadius: 999,
          background: isActive ? "#f6ffed" : "#fff7ed",
          color: isActive ? "#15803d" : "#b45309",
          border: `1px solid ${isActive ? "#bbf7d0" : "#fed7aa"}`,
          fontWeight: 700,
          fontSize: 12,
          textTransform: "capitalize",
        }}
      >
        {status}
      </span>
    )
  }

  const renderCell = (value: React.ReactNode) => (
    <td
      style={{
        padding: "11px 14px",
        borderBottom: "1px solid #e8e2db",
        color: "#2f2a25",
        fontSize: 13,
        background: "#fff",
      }}
    >
      {value}
    </td>
  )

  return (
    <div style={{ padding: "16px 12px 48px", background: "#f4f1ed" }}>
      <div style={{ marginBottom: 12 }}>
        <h1 style={{ margin: 0, fontSize: 26, color: "#2f2a25" }}>Products</h1>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            style={{
              background: "#4b3a2f",
              color: "#fff",
              border: "1px solid #4b3a2f",
              padding: "10px 14px",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Import Description
          </button>
          <button
            type="button"
            onClick={() => navigate(`${BASE_PATH}/new`)}
            style={{
              background: "#d75a1a",
              color: "#fff",
              border: "1px solid #c54e12",
              padding: "10px 14px",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Add Product ▾
          </button>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            style={{
              background: "#f8f7f5",
              color: "#4b3a2f",
              border: "1px solid #d1c7bd",
              padding: "8px 12px",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Filters
          </button>
          <button
            type="button"
            style={{
              background: "#f8f7f5",
              color: "#4b3a2f",
              border: "1px solid #d1c7bd",
              padding: "8px 12px",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Columns ▾
          </button>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #d1c7bd",
          padding: 14,
          marginBottom: 10,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: "1px solid #d1c7bd",
            borderRadius: 4,
            overflow: "hidden",
            flex: "1 1 280px",
            maxWidth: 440,
          }}
        >
          <input
            value={filters.q}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, q: e.target.value }))
            }
            placeholder="Search by keyword"
            style={{
              flex: 1,
              border: "none",
              padding: "8px 10px",
              outline: "none",
              fontSize: 14,
            }}
          />
          <button
            type="button"
            onClick={handleSearch}
            style={{
              background: "#f8f7f5",
              border: "none",
              borderLeft: "1px solid #d1c7bd",
              padding: "8px 10px",
              cursor: "pointer",
              color: "#4b3a2f",
              fontWeight: 600,
            }}
          >
            🔍
          </button>
        </div>

        <select
          value={filters.sku}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, sku: e.target.value }))
          }
          style={{
            border: "1px solid #d1c7bd",
            borderRadius: 4,
            padding: "8px 10px",
            minWidth: 180,
            background: "#fff",
          }}
        >
          <option value="">Actions</option>
          <option value="">Filter by SKU</option>
        </select>

        <div style={{ marginLeft: "auto", color: "#4b3a2f", fontWeight: 600 }}>
          {count ? `${count} records found` : "0 records"}
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "#fef3f2",
            color: "#b42318",
            padding: 12,
            border: "1px solid #fecdca",
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          background: "#fff",
          border: "1px solid #d1c7bd",
          borderRadius: 6,
          overflow: "hidden",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 14px",
            background: "#f8f7f5",
            gap: 10,
            borderBottom: "1px solid #d1c7bd",
          }}
        >
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <label style={{ color: "#4b3a2f", fontSize: 13 }}>Rows per page</label>
            <select
              value={pagination.limit}
              onChange={(e) =>
                fetchProducts({ limit: Number(e.target.value), offset: 0 })
              }
              style={{
                border: "1px solid #d1c7bd",
                borderRadius: 4,
                padding: "6px 8px",
                background: "#fff",
              }}
            >
              {[20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginLeft: "auto", color: "#4b3a2f", fontSize: 13 }}>
            Page {currentPage} of {totalPages}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              color: "#2f2a25",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#4b3a2f",
                  color: "#fff",
                  textAlign: "left",
                }}
              >
                {[
                  "ID",
                  "Thumbnail",
                  "Name",
                  "Type",
                  "Attribute Set",
                  "SKU",
                  "Price",
                  "Quantity per Source",
                  "Salable Quantity",
                  "Visibility",
                  "Status",
                  "Websites",
                  "on_home",
                  "Featured Product",
                  "Top Rated Product",
                  "OnSale Product",
                  "Bestsellers Product",
                  "Action",
                ].map((label) => (
                  <th
                    key={label}
                    style={{
                      padding: "11px 14px",
                      borderBottom: "1px solid #d1c7bd",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={18}
                    style={{
                      padding: 16,
                      textAlign: "center",
                      color: "#6b6a67",
                      background: "#fff",
                    }}
                  >
                    Loading products...
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td
                    colSpan={18}
                    style={{
                      padding: 16,
                      textAlign: "center",
                      color: "#6b6a67",
                      background: "#fff",
                    }}
                  >
                    No products found.
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((item) => {
                  const sku = item.variant_skus?.[0] || "-"
                  return (
                    <tr key={item.id} style={{ background: "#fff" }}>
                      {renderCell(item.id)}
                      {renderCell(
                        item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            style={{
                              width: 48,
                              height: 48,
                              objectFit: "cover",
                              borderRadius: 4,
                              border: "1px solid #d1c7bd",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 4,
                              border: "1px solid #d1c7bd",
                              display: "grid",
                              placeItems: "center",
                              color: "#9ca3af",
                              fontSize: 12,
                              background: "#f8f7f5",
                            }}
                          >
                            —
                          </div>
                        )
                      )}
                      {renderCell(
                        <div>
                          <div style={{ fontWeight: 700 }}>{item.title}</div>
                          <div style={{ color: "#6b6a67", fontSize: 12 }}>
                            {item.handle || "No handle"}
                          </div>
                        </div>
                      )}
                      {renderCell("Simple Product")}
                      {renderCell("Default")}
                      {renderCell(sku)}
                      {renderCell("—")}
                      {renderCell("—")}
                      {renderCell("—")}
                      {renderCell("Catalog, Search")}
                      {renderCell(renderStatus(item.status as string))}
                      {renderCell("Main Website")}
                      {renderCell("—")}
                      {renderCell("—")}
                      {renderCell("—")}
                      {renderCell("—")}
                      {renderCell("—")}
                      {renderCell(
                        <div style={{ display: "flex", gap: 8 }}>
                          <Link
                            to={`${BASE_PATH}/${item.id}/edit`}
                            style={{ color: "#2563eb", textDecoration: "none" }}
                          >
                            Edit
                          </Link>
                          <span style={{ color: "#d1c7bd" }}>|</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            style={{
                              padding: 0,
                              border: "none",
                              background: "none",
                              color:
                                deletingId === item.id ? "#9ca3af" : "#b91c1c",
                              cursor:
                                deletingId === item.id
                                  ? "not-allowed"
                                  : "pointer",
                              fontWeight: 600,
                            }}
                          >
                            {deletingId === item.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      )}
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            padding: "10px 14px",
            borderTop: "1px solid #d1c7bd",
            background: "#f8f7f5",
          }}
        >
          <button
            type="button"
            onClick={() =>
              fetchProducts({
                offset: Math.max(0, pagination.offset - pagination.limit),
              })
            }
            disabled={pagination.offset === 0 || loading}
            style={{
              background: "#fff",
              border: "1px solid #d1c7bd",
              padding: "8px 12px",
              borderRadius: 4,
              cursor:
                pagination.offset === 0 || loading ? "not-allowed" : "pointer",
              color: "#4b3a2f",
            }}
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() =>
              fetchProducts({
                offset: pagination.offset + pagination.limit,
              })
            }
            disabled={
              loading || (count > 0 && pagination.offset + pagination.limit >= count)
            }
            style={{
              background: "#fff",
              border: "1px solid #d1c7bd",
              padding: "8px 12px",
              borderRadius: 4,
              cursor:
                loading ||
                (count > 0 && pagination.offset + pagination.limit >= count)
                  ? "not-allowed"
                  : "pointer",
              color: "#4b3a2f",
            }}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductListPage
