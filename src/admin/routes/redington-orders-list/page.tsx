import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useEffect, useState, useCallback } from "react"
import DataTable from "react-data-table-component"

/* --------------------------------------------
                    Types
--------------------------------------------- */
type Order = {
  id: number
  order_number: string
  customer_email: string
  customer_first_name: string
  customer_last_name: string
  grand_total: string
  currency: string
  order_status: string
  payment_status: string
  fulfillment_status: string
  created_at: string
  items_count: number
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

const OrdersModulePage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  /* --------------------------------------------
            Fetch Orders (Memoized)
  --------------------------------------------- */
  const fetchOrders = useCallback(async (query: string = "") => {
    console.log("Searching for:", query)

    setLoading(true)
    setError(null)

    try {
      const url = new URL(`/admin/mp/orders`, window.location.origin)

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

      setOrders(data.orders || [])
    } catch (err: any) {
      setError(err.message || "Unable to load orders")
    } finally {
      setLoading(false)
    }
  }, [])

  /* --------------------------------------------
            Debounced Search Handler
  --------------------------------------------- */
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      fetchOrders(value)
    }, 350),
    [fetchOrders]
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
    fetchOrders()
  }, [fetchOrders])

  /* --------------------------------------------
            Status Badge Component
  --------------------------------------------- */
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusColor = (status: string) => {
      const statusColors: { [key: string]: string } = {
        pending: "#f59e0b",
        confirmed: "#3b82f6", 
        processing: "#8b5cf6",
        shipped: "#06b6d4",
        delivered: "#10b981",
        completed: "#059669",
        cancelled: "#ef4444",
        refunded: "#6b7280",
        paid: "#10b981",
        unpaid: "#ef4444",
        unfulfilled: "#f59e0b",
        partially_fulfilled: "#8b5cf6",
        fulfilled: "#10b981"
      }
      return statusColors[status.toLowerCase()] || "#6b7280"
    }

    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        textTransform: 'capitalize',
        background: getStatusColor(status),
        color: 'white',
        display: 'inline-block'
      }}>
        {status}
      </span>
    )
  }

  /* --------------------------------------------
            Format Currency
  --------------------------------------------- */
  const formatCurrency = (amount: string, currency: string = "INR") => {
    const numAmount = parseFloat(amount)
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(numAmount)
  }

  /* --------------------------------------------
            Format Date
  --------------------------------------------- */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div style={pageWrapper}>

      {/* Header */}
      <div style={header}>
        
        {/* LEFT — Title */}
        <h1 style={title}>Orders</h1>

        {/* RIGHT — Back button only (no Add button for orders) */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={backBtn} onClick={() => window.history.back()}>
            ← Back
          </button>
        </div>
      </div>

      {/* Search (left aligned, just above the table) */}
      <div style={searchWrapper}>
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by order ID, customer name or email..."
          style={searchInput}
        />
      </div>

      {/* Status */}
      {loading && <p style={loadingText}>Loading orders…</p>}
      {error && <p style={errorText}>{error}</p>}

      {/* Table */}
      {!loading && !error && (
        <div style={card}>
          <DataTable
            columns={[
              { 
                name: "Order ID", 
                selector: (row: Order) => row.id,
                sortable: true,
                width: "100px"
              },
              { 
                name: "Customer", 
                cell: (row: Order) => (
                  <div>
                    <div style={{ fontWeight: 'bold' }}>
                      {row.customer_first_name} {row.customer_last_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {row.customer_email}
                    </div>
                  </div>
                ),
                minWidth: "200px"
              },
              { 
                name: "Date", 
                selector: (row: Order) => formatDate(row.created_at),
                sortable: true,
                width: "120px"
              },
              { 
                name: "Amount", 
                cell: (row: Order) => (
                  <div style={{ fontWeight: 'bold' }}>
                    {formatCurrency(row.grand_total, row.currency)}
                  </div>
                ),
                sortable: true,
                width: "120px"
              },
              { 
                name: "Items", 
                selector: (row: Order) => row.items_count || 0,
                sortable: true,
                width: "80px",
                center: true
              },
              { 
                name: "Order Status", 
                cell: (row: Order) => <StatusBadge status={row.order_status} />,
                sortable: true,
                width: "150px"
              },
              { 
                name: "Payment", 
                cell: (row: Order) => <StatusBadge status={row.payment_status} />,
                sortable: true,
                width: "120px"
              },
              { 
                name: "Fulfillment", 
                cell: (row: Order) => <StatusBadge status={row.fulfillment_status} />,
                sortable: true,
                width: "140px"
              },
              { 
                name: "Action", 
                cell: (row: Order) => (
                  <button
                    onClick={() => window.location.href = `/app/redington-order-details/${row.id}`}
                    style={viewBtn}
                  >
                    View
                  </button>
                ),
                width: "100px"
              },
            ]}
            data={orders}
            pagination
            highlightOnHover
            striped
            responsive
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

const viewBtn = {
  padding: "6px 12px",
  fontSize: 14,
  borderRadius: 6,
  border: "1px solid #1f72ff",
  background: "#1f72ff",
  color: "white",
  cursor: "pointer",
  transition: "0.2s",
}

/* Sidebar Label */
export const config = defineRouteConfig({
  label: "Magento Orders",
})

export default OrdersModulePage