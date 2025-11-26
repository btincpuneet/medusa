import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useEffect, useState, useCallback } from "react"
import DataTable from "react-data-table-component"

/* --------------------------------------------
                    Types
--------------------------------------------- */

type Customer = {
  id: number
  email: string
  first_name: string
  last_name: string
  phone: string | null
  gender: string | null
  account_status: string
  created_at: string
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

const CustomerModulePage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  /* --------------------------------------------
            Fetch Customers
  --------------------------------------------- */
  const fetchCustomers = useCallback(async (query: string = "") => {
    setLoading(true)
    setError(null)

    try {
      const url = new URL(`/admin/customers`, window.location.origin)

      if (query.trim() !== "") {
        url.searchParams.set("q", query.trim())
      }

      const res = await fetch(url.toString(), {
        credentials: "include",
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error("API failed")
      }

      setCustomers(data.customers || [])
    } catch (err: any) {
      setError(err.message || "Unable to load customers")
    } finally {
      setLoading(false)
    }
  }, [])

  /* --------------------------------------------
            Debounced Search
  --------------------------------------------- */
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      fetchCustomers(value)
    }, 350),
    [fetchCustomers]
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
    fetchCustomers()
  }, [fetchCustomers])


  return (
    <div style={pageWrapper}>

{/* Header */}
<div style={header}>
  <h1 style={title}>Customers</h1>

  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
    <button style={backBtn} onClick={() => window.history.back()}>
      ← Back
    </button>

    <button
      style={{
        padding: "8px 16px",
        background: "#1f72ff",
        color: "#fff",
        border: 0,
        borderRadius: 6,
        cursor: "pointer",
        fontWeight: 600,
      }}
      onClick={() => (window.location.href = "redington-customers-add")}
    >
      + Add Customer
    </button>
  </div>
</div>


      {/* Search */}
      <div style={searchWrapper}>
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by email, name, phone..."
          style={searchInput}
        />
      </div>

      {/* Status */}
      {loading && <p style={loadingText}>Loading customers…</p>}
      {error && <p style={errorText}>{error}</p>}

      {/* Table */}
      {!loading && !error && (
        <div style={card}>
          <DataTable
            columns={[
              { name: "ID", selector: row => row.id, sortable: true },
              { name: "Email", selector: row => row.email, sortable: true },
              { name: "Name", selector: row => `${row.first_name} ${row.last_name}` },
              { name: "Phone", selector: row => row.phone || "—" },
              { name: "Gender", selector: row => row.gender || "—" },
              { name: "Status", selector: row => row.account_status },
              { 
                name: "Created",
                selector: row => new Date(row.created_at).toLocaleDateString(),
                sortable: true 
              },
              // {
              //   name: "Action",
              //   cell: row => (
              //     <button
              //       onClick={() => window.location.href = `/app/customer-edit/${row.id}`}
              //       style={editBtn}
              //     >
              //       Edit
              //     </button>
              //   ),
              // },
            ]}
            data={customers}
            pagination
            highlightOnHover
            striped
          />
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

const searchWrapper = { marginBottom: 20 }

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
  label: "Customers",
})

export default CustomerModulePage
