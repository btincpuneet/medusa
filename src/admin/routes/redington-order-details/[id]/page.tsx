import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"

/* --------------------------------------------
                    Types
--------------------------------------------- */
type OrderItem = {
  id: string
  product_id: string
  seller_id: string
  sku: string
  name: string
  quantity: number
  price: number
  row_total: number
  discount_amount: number
  tax_amount: number
  product_name?: string
  seller_name?: string
}

type OrderAddress = {
  id: string
  address_type: 'shipping' | 'billing'
  first_name: string
  last_name: string
  phone: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  postal_code: string
  country_code: string
}

type OrderPayment = {
  id: string
  method: string
  transaction_id: string
  amount: number
  status: string
  created_at: string
}

type OrderShipment = {
  id: string
  seller_id: string
  tracking_number: string
  carrier: string
  shipped_at: string
  delivered_at: string
  seller_name?: string
}

type OrderStatusHistory = {
  id: string
  status: string
  comment: string
  notify_customer: boolean
  created_at: string
}

type Order = {
  id: string
  customer_id: string
  customer_email: string
  customer_first_name: string
  customer_last_name: string
  subtotal: number
  discount_total: number
  tax_total: number
  shipping_total: number
  grand_total: number
  currency: string
  order_status: string
  payment_status: string
  fulfillment_status: string
  notes: string
  created_at: string
  updated_at: string
  items: OrderItem[]
  addresses: OrderAddress[]
  payment: OrderPayment | null
  status_history: OrderStatusHistory[]
  shipments: OrderShipment[]
}

const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  /* --------------------------------------------
              Fetch Order Details
  --------------------------------------------- */
  const fetchOrderDetails = useCallback(async () => {
    if (!id) return
    
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/admin/mp/orders/${id}`, {
        credentials: "include",
      })

      const data = await res.json()
      console.log("Order API Response:", data)

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch order details")
      }

      setOrder(data.order)
    } catch (err: any) {
      setError(err.message || "Unable to load order details")
    } finally {
      setLoading(false)
    }
  }, [id])

  /* --------------------------------------------
              Update Order Status
  --------------------------------------------- */
  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return
    
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/admin/mp/orders/${id}/status`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.message || "Status update failed")

      // Refresh order data
      await fetchOrderDetails()
    } catch (err: any) {
      setError(err.message || "Failed to update status")
    } finally {
      setUpdatingStatus(false)
    }
  }

  /* --------------------------------------------
              Initial Load
  --------------------------------------------- */
  useEffect(() => {
    fetchOrderDetails()
  }, [fetchOrderDetails])

  /* --------------------------------------------
              Helper Functions
  --------------------------------------------- */
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

  const StatusBadge = ({ status }: { status: string }) => (
    <span style={{
      padding: '6px 12px',
      borderRadius: '16px',
      fontSize: '12px',
      fontWeight: 'bold',
      textTransform: 'capitalize',
      background: getStatusColor(status),
      color: 'white',
      display: 'inline-block'
    }}>
      {status.replace('_', ' ')}
    </span>
  )

  const formatCurrency = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getShippingAddress = () => {
    return order?.addresses.find(addr => addr.address_type === 'shipping')
  }

  const getBillingAddress = () => {
    return order?.addresses.find(addr => addr.address_type === 'billing')
  }

  /* --------------------------------------------
              Loading & Error States
  --------------------------------------------- */
  if (loading) return <div style={{ padding: 20 }}>Loading order details...</div>
  if (error) return <div style={{ padding: 20, color: "red" }}>Error: {error}</div>
  if (!order) return <div style={{ padding: 20 }}>Order not found</div>

  return (
    <div style={pageWrapper}>
      {/* Header */}
      <div style={header}>
        <div>
          <h1 style={title}>Order #{order.id}</h1>
          <div style={subtitle}>
            Placed on {formatDate(order.created_at)} • {order.customer_first_name} {order.customer_last_name}
          </div>
        </div>
        
        <div style={headerActions}>
          <button style={backBtn} onClick={() => window.history.back()}>
            ← Back to Orders
          </button>
          <button 
            style={printBtn}
            onClick={() => window.print()}
          >
            📄 Print
          </button>
        </div>
      </div>

      {/* Status Quick Actions */}
      <div style={statusSection}>
        <div style={statusCard}>
          <div style={statusItem}>
            <span style={statusLabel}>Order Status:</span>
            <StatusBadge status={order.order_status} />
          </div>
          <div style={statusItem}>
            <span style={statusLabel}>Payment:</span>
            <StatusBadge status={order.payment_status} />
          </div>
          <div style={statusItem}>
            <span style={statusLabel}>Fulfillment:</span>
            <StatusBadge status={order.fulfillment_status} />
          </div>
        </div>

        {/* Quick Status Update */}
        {/* <div style={quickActions}>
          <select 
            value={order.order_status} 
            onChange={(e) => updateOrderStatus(e.target.value)}
            disabled={updatingStatus}
            style={statusSelect}
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {updatingStatus && <span style={{ marginLeft: 10 }}>Updating...</span>}
        </div> */}
      </div>

      {/* Tabs */}
      <div style={tabsContainer}>
        {["overview", "items", "shipments", "history"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...tabButton,
              borderBottom: activeTab === tab ? "3px solid #1f72ff" : "3px solid transparent",
              color: activeTab === tab ? "#1f72ff" : "#666"
            }}
          >
            {tab === "overview" && "Overview"}
            {tab === "items" && `Items (${order.items.length})`}
            {tab === "shipments" && `Shipments (${order.shipments.length})`}
            {tab === "history" && `History (${order.status_history.length})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={tabContent}>
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div style={overviewGrid}>
            {/* Left Column */}
            <div style={leftColumn}>
              {/* Order Summary */}
              <div style={card}>
                <h3 style={cardTitle}>Order Summary</h3>
                <div style={summaryRow}>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(order.subtotal, order.currency)}</span>
                </div>
                <div style={summaryRow}>
                  <span>Shipping:</span>
                  <span>{formatCurrency(order.shipping_total, order.currency)}</span>
                </div>
                <div style={summaryRow}>
                  <span>Tax:</span>
                  <span>{formatCurrency(order.tax_total, order.currency)}</span>
                </div>
                <div style={summaryRow}>
                  <span>Discount:</span>
                  <span>-{formatCurrency(order.discount_total, order.currency)}</span>
                </div>
                <div style={{ ...summaryRow, ...grandTotal }}>
                  <span><strong>Grand Total:</strong></span>
                  <span><strong>{formatCurrency(order.grand_total, order.currency)}</strong></span>
                </div>
              </div>

              {/* Customer Information */}
              <div style={card}>
                <h3 style={cardTitle}>Customer Information</h3>
                <div style={infoRow}>
                  <span>Name:</span>
                  <span>{order.customer_first_name} {order.customer_last_name}</span>
                </div>
                <div style={infoRow}>
                  <span>Email:</span>
                  <span>{order.customer_email}</span>
                </div>
                <div style={infoRow}>
                  <span>Customer ID:</span>
                  <span>{order.customer_id || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div style={rightColumn}>
              {/* Shipping Address */}
              <div style={card}>
                <h3 style={cardTitle}>Shipping Address</h3>
                {getShippingAddress() ? (
                  <div style={address}>
                    <div><strong>{getShippingAddress()?.first_name} {getShippingAddress()?.last_name}</strong></div>
                    <div>{getShippingAddress()?.address_line_1}</div>
                    {getShippingAddress()?.address_line_2 && (
                      <div>{getShippingAddress()?.address_line_2}</div>
                    )}
                    <div>{getShippingAddress()?.city}, {getShippingAddress()?.state} {getShippingAddress()?.postal_code}</div>
                    <div>{getShippingAddress()?.country_code}</div>
                    <div>📞 {getShippingAddress()?.phone}</div>
                  </div>
                ) : (
                  <div style={{ color: '#666' }}>No shipping address provided</div>
                )}
              </div>

              {/* Billing Address */}
              <div style={card}>
                <h3 style={cardTitle}>Billing Address</h3>
                {getBillingAddress() ? (
                  <div style={address}>
                    <div><strong>{getBillingAddress()?.first_name} {getBillingAddress()?.last_name}</strong></div>
                    <div>{getBillingAddress()?.address_line_1}</div>
                    {getBillingAddress()?.address_line_2 && (
                      <div>{getBillingAddress()?.address_line_2}</div>
                    )}
                    <div>{getBillingAddress()?.city}, {getBillingAddress()?.state} {getBillingAddress()?.postal_code}</div>
                    <div>{getBillingAddress()?.country_code}</div>
                    <div>📞 {getBillingAddress()?.phone}</div>
                  </div>
                ) : (
                  <div style={{ color: '#666' }}>No billing address provided</div>
                )}
              </div>

              {/* Payment Information */}
              {order.payment && (
                <div style={card}>
                  <h3 style={cardTitle}>Payment Information</h3>
                  <div style={infoRow}>
                    <span>Method:</span>
                    <span>{order.payment.method}</span>
                  </div>
                  <div style={infoRow}>
                    <span>Status:</span>
                    <StatusBadge status={order.payment.status} />
                  </div>
                  <div style={infoRow}>
                    <span>Transaction ID:</span>
                    <span style={{ fontFamily: 'monospace' }}>{order.payment.transaction_id}</span>
                  </div>
                  <div style={infoRow}>
                    <span>Amount:</span>
                    <span>{formatCurrency(order.payment.amount, order.currency)}</span>
                  </div>
                  <div style={infoRow}>
                    <span>Paid on:</span>
                    <span>{formatDate(order.payment.created_at)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ITEMS TAB */}
        {activeTab === "items" && (
          <div style={card}>
            <h3 style={cardTitle}>Order Items</h3>
            <div style={itemsTable}>
              <div style={tableHeader}>
                <div style={tableCol}>Product</div>
                <div style={tableCol}>Seller</div>
                <div style={tableCol}>Price</div>
                <div style={tableCol}>Qty</div>
                <div style={tableCol}>Total</div>
              </div>
              {order.items.map((item) => (
                <div key={item.id} style={tableRow}>
                  <div style={tableCol}>
                    <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>SKU: {item.sku}</div>
                  </div>
                  <div style={tableCol}>
                    {item.seller_name || 'N/A'}
                  </div>
                  <div style={tableCol}>
                    {formatCurrency(item.price, order.currency)}
                  </div>
                  <div style={tableCol}>
                    {item.quantity}
                  </div>
                  <div style={tableCol}>
                    <strong>{formatCurrency(item.row_total, order.currency)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SHIPMENTS TAB */}
        {activeTab === "shipments" && (
          <div style={card}>
            <h3 style={cardTitle}>Shipments</h3>
            {order.shipments.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
                No shipments created yet
              </div>
            ) : (
              order.shipments.map((shipment) => (
                <div key={shipment.id} style={shipmentCard}>
                  <div style={shipmentHeader}>
                    <div>
                      <strong>{shipment.carrier}</strong>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        Tracking: {shipment.tracking_number}
                      </div>
                      {shipment.seller_name && (
                        <div style={{ fontSize: '12px', color: '#8b5cf6' }}>
                          Seller: {shipment.seller_name}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div>Shipped: {formatDate(shipment.shipped_at)}</div>
                      {shipment.delivered_at && (
                        <div style={{ color: '#10b981', fontWeight: 'bold' }}>
                          Delivered: {formatDate(shipment.delivered_at)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div style={card}>
            <h3 style={cardTitle}>Status History</h3>
            {order.status_history.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
                No status history available
              </div>
            ) : (
              <div style={timeline}>
                {order.status_history.map((history, index) => (
                  <div key={history.id} style={timelineItem}>
                    <div style={timelineDot}></div>
                    <div style={timelineContent}>
                      <div style={timelineHeader}>
                        <StatusBadge status={history.status} />
                        <span style={timelineDate}>{formatDate(history.created_at)}</span>
                      </div>
                      {history.comment && (
                        <div style={timelineComment}>{history.comment}</div>
                      )}
                      {history.notify_customer && (
                        <div style={timelineNotify}>Customer was notified</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* --------------------------------------------
                 Styles
--------------------------------------------- */
const pageWrapper = {
  padding: "24px",
  fontFamily: "Inter, sans-serif",
}

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "24px",
}

const title = {
  fontSize: "28px",
  fontWeight: 700,
  color: "#1c1c1c",
  margin: 0,
}

const subtitle = {
  fontSize: "14px",
  color: "#666",
  marginTop: "4px",
}

const headerActions = {
  display: "flex",
  gap: "12px",
}

const backBtn = {
  padding: "8px 16px",
  background: "white",
  border: "1px solid #d0d0d0",
  borderRadius: "6px",
  cursor: "pointer",
}

const printBtn = {
  padding: "8px 16px",
  background: "#f8f9fa",
  border: "1px solid #d0d0d0",
  borderRadius: "6px",
  cursor: "pointer",
}

const statusSection = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "24px",
  padding: "16px",
  background: "#f8f9fa",
  borderRadius: "8px",
}

const statusCard = {
  display: "flex",
  gap: "24px",
}

const statusItem = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
}

const statusLabel = {
  fontWeight: "600",
  color: "#374151",
}

const quickActions = {
  display: "flex",
  alignItems: "center",
}

const statusSelect = {
  padding: "8px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  background: "white",
}

const tabsContainer = {
  display: "flex",
  gap: "0",
  borderBottom: "1px solid #e5e7eb",
  marginBottom: "24px",
}

const tabButton = {
  padding: "12px 24px",
  border: "none",
  background: "transparent",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "14px",
}

const tabContent = {
  minHeight: "400px",
}

const overviewGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "24px",
}

const leftColumn = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "20px",
}

const rightColumn = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "20px",
}

const card = {
  background: "white",
  padding: "20px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
}

const cardTitle = {
  margin: "0 0 16px 0",
  fontSize: "18px",
  fontWeight: 600,
  color: "#1f2937",
}

const summaryRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
  borderBottom: "1px solid #f3f4f6",
}

const grandTotal = {
  borderTop: "2px solid #e5e7eb",
  borderBottom: "none",
  paddingTop: "12px",
  marginTop: "8px",
}

const infoRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0",
  borderBottom: "1px solid #f3f4f6",
}

const address = {
  lineHeight: "1.6",
  color: "#374151",
}

const itemsTable = {
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  overflow: "hidden",
}

const tableHeader = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
  background: "#f8f9fa",
  padding: "12px 16px",
  fontWeight: 600,
  borderBottom: "1px solid #e5e7eb",
}

const tableRow = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
  padding: "12px 16px",
  borderBottom: "1px solid #f3f4f6",
  alignItems: "center",
}

const tableCol = {
  padding: "0 8px",
}

const shipmentCard = {
  padding: "16px",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  marginBottom: "12px",
}

const shipmentHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
}

const timeline = {
  position: "relative" as const,
  paddingLeft: "20px",
}

const timelineItem = {
  position: "relative" as const,
  marginBottom: "20px",
  paddingLeft: "20px",
}

const timelineDot = {
  position: "absolute" as const,
  left: "-10px",
  top: "6px",
  width: "12px",
  height: "12px",
  borderRadius: "50%",
  background: "#3b82f6",
}

const timelineContent = {
  background: "#f8f9fa",
  padding: "12px 16px",
  borderRadius: "6px",
}

const timelineHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "8px",
}

const timelineDate = {
  fontSize: "12px",
  color: "#6b7280",
}

const timelineComment = {
  fontSize: "14px",
  color: "#374151",
  marginBottom: "4px",
}

const timelineNotify = {
  fontSize: "12px",
  color: "#10b981",
  fontStyle: "italic",
}

export const config = defineRouteConfig({
  path: "/redington-order-details/:id",
})

export default OrderDetailsPage