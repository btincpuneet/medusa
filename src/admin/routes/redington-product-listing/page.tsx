import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useEffect, useState, useCallback } from "react"

/* --------------------------------------------
                    Types
--------------------------------------------- */
type Product = {
  id: number
  product_code: string
  name: string
  short_desc: string | null
  base_price: string
  status: string
}

/* --------------------------------------------
               Native Debounce
--------------------------------------------- */
function debounce(fn: (...args: any[]) => void, delay: number) {
  let timeout: any
  return (...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}

const ProductModulePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  /* --------------------------------------------
            Fetch Products (Memoized)
  --------------------------------------------- */
  const fetchProducts = useCallback(async (query: string = "") => {
    console.log("Searching for:", query)

    setLoading(true)
    setError(null)

    try {
      const url = new URL(`/admin/product/products`, window.location.origin)

      if (query.trim() !== "") {
        url.searchParams.set("q", query.trim())
      }

      const res = await fetch(url.toString(), {
        credentials: "include",
      })

      const data = await res.json()
      console.log("API Response:", data)

      if (!data.success) {
        throw new Error("API failed")
      }

      setProducts(data.products || [])
    } catch (err: any) {
      setError(err.message || "Unable to load products")
    } finally {
      setLoading(false)
    }
  }, [])

  /* --------------------------------------------
            Debounced Search Handler
  --------------------------------------------- */
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      fetchProducts(value)
    }, 350),
    [fetchProducts]
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    debouncedSearch(value)
  }

  /* --------------------------------------------
               Initial Load
  --------------------------------------------- */
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])


  return (
    <div style={pageWrapper}>

{/* Header */}
<div style={header}>
  
  {/* LEFT — Title */}
  <h1 style={title}>Products</h1>

  {/* RIGHT — Back + Add buttons side-by-side */}
  <div style={{ display: "flex", gap: "10px" }}>
    <button style={backBtn} onClick={() => window.history.back()}>
      ← Back
    </button>

    <button style={addBtn} onClick={() => (window.location.href = "/app/redington-product-add")}>
      + Add Product
    </button>
  </div>
</div>

{/* Search (left aligned, just above the table) */}
<div style={searchWrapper}>
  <input
    type="text"
    value={search}
    onChange={handleSearchChange}
    placeholder="Search by name or SKU..."
    style={searchInput}
  />
</div>


      {/* Status */}
      {loading && <p style={loadingText}>Loading products…</p>}
      {error && <p style={errorText}>{error}</p>}

      {/* Table */}
      {!loading && !error && (
        <div style={card}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>ID</th>
                <th style={th}>Product Code</th>
                <th style={th}>Name</th>
                <th style={th}>Short Description</th>
                <th style={th}>Price</th>
                <th style={th}>Status</th>
                <th style={th}>Action</th>
              </tr>
            </thead>

            <tbody>
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} style={noData}>
                    No products found
                  </td>
                </tr>
              )}

              {products.map((p) => (
                <tr key={p.id} style={row}>
                  <td style={td}>{p.id}</td>
                  <td style={td}>{p.product_code}</td>
                  <td style={td}>{p.name}</td>
                  <td style={td}>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: p.short_desc || "",
                      }}
                    />
                  </td>
                  <td style={td}>{p.base_price}</td>
                  <td style={td}>{p.status}</td>
                  <td style={td}>
                    <button style={editBtn}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* --------------------------------------------
                 Styles
--------------------------------------------- */

const pageWrapper = {
  padding: "0",
  margin: "0 auto",
  maxWidth: "100%",
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
  fontSize: 30,
  fontWeight: 700,
  color: "#1c1c1c",
}

const backBtn = {
  padding: "8px 14px",
  background: "white",
  border: "1px solid #d0d0d0",
  borderRadius: 6,
  cursor: "pointer",
}

const addBtn = {
  padding: "10px 18px",
  background: "#1f72ff",
  color: "white",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  fontWeight: 500,
  transition: "0.2s",
}

const searchWrapper = {
  marginBottom: 20,
}

const searchInput = {
  width: "100%",
  maxWidth: "400px",
  padding: "12px 16px",
  borderRadius: 8,
  border: "1px solid #dcdcdc",
  fontSize: 16,
  outline: "none",
}


const loadingText = { fontSize: 16, opacity: 0.7 }
const errorText = { color: "red", fontSize: 15 }

const card = {
  background: "white",
  padding: 0,
  borderRadius: 10,
  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
}

const table = {
  width: "100%",
  borderCollapse: "collapse",
}

const th = {
  textAlign: "left",
  padding: "14px",
  background: "#f5f7fb",
  borderBottom: "1px solid #e5e5e5",
  fontWeight: 600,
  fontSize: 14,
}

const td = {
  padding: "14px",
  borderBottom: "1px solid #f1f1f1",
  fontSize: 14,
}

const row = {
  transition: "0.15s",
}

const noData = {
  padding: 20,
  textAlign: "center",
  color: "#888",
  fontSize: 15,
}

const editBtn = {
  padding: "6px 12px",
  fontSize: 14,
  borderRadius: 6,
  border: "1px solid #d0d0d0",
  background: "white",
  cursor: "pointer",
  transition: "0.2s",
}

/* Sidebar Label */
export const config = defineRouteConfig({
  label: "Magento Product",
})

export default ProductModulePage
