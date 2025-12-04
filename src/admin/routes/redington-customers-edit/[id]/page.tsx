import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"

type CustomerAddress = {
  id: string
  label: string
  address_line_1: string
  address_line_2?: string
  city: string
  state?: string
  country_code: string
  postal_code: string
  phone?: string
}

type CustomerPayload = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  gender?: string
  date_of_birth?: string
  name_prefix?: string
  addresses?: CustomerAddress[]
}

// Order Types
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
  address_type: "shipping" | "billing"
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
  created_at: string
  updated_at: string
  items: OrderItem[]
  addresses: OrderAddress[]
  payment: OrderPayment | null
  status_history: OrderStatusHistory[]
  shipments: OrderShipment[]
}

const EditCustomerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("personal")
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  const [customer, setCustomer] = useState<CustomerPayload | null>(null)

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    gender: "",
    date_of_birth: "",
    name_prefix: "",
    address_label: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    country_code: "",
    postal_code: "",
    address_phone: "",
  })

  // ---- NEW: Address modal state ----
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [addressModalMode, setAddressModalMode] = useState<"add" | "edit">(
    "edit"
  )
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(
    null
  )

  // Fetch customer data
  const fetchCustomer = useCallback(async () => {
    if (!id) return
    try {
      const res = await fetch(`/admin/mp/redington-customers/${id}`, {
        credentials: "include",
      })
      const data = await res.json()
      if (!data.success)
        throw new Error(data.message || "Failed to fetch customer")

      const cust: CustomerPayload = data.customer
      setCustomer(cust)

      const primaryAddress = cust.addresses?.[0] || ({} as CustomerAddress)

      setForm({
        first_name: cust.first_name ?? "",
        last_name: cust.last_name ?? "",
        email: cust.email ?? "",
        phone: cust.phone ?? "",
        gender: cust.gender ?? "",
        date_of_birth: cust.date_of_birth
          ? cust.date_of_birth.split("T")[0]
          : "",
        name_prefix: cust.name_prefix ?? "",
        address_label: primaryAddress.label ?? "",
        address_line_1: primaryAddress.address_line_1 ?? "",
        address_line_2: primaryAddress.address_line_2 ?? "",
        city: primaryAddress.city ?? "",
        state: primaryAddress.state ?? "",
        country_code: primaryAddress.country_code ?? "",
        postal_code: primaryAddress.postal_code ?? "",
        address_phone: primaryAddress.phone ?? "",
      })
    } catch (err: any) {
      setError(err.message || "Unable to load customer")
    }
  }, [id])

  // Fetch customer orders
  const fetchCustomerOrders = useCallback(async () => {
    if (!id) return
    setOrdersLoading(true)
    try {
      const res = await fetch(`/admin/mp/orders/customer/${id}`, {
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) {
        setOrders(data.orders || [])
      }
    } catch (err: any) {
      console.error("Failed to fetch orders:", err)
    } finally {
      setOrdersLoading(false)
    }
  }, [id])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await fetchCustomer()
      await fetchCustomerOrders()
      setLoading(false)
    }
    load()
  }, [fetchCustomer, fetchCustomerOrders])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!id) return

    setSaving(true)
    console.log("handlesave clicked")

    try {
      const payload = {
        ...form,
        addresses: [
          {
            label: form.address_label,
            address_line_1: form.address_line_1,
            address_line_2: form.address_line_2,
            city: form.city,
            state: form.state,
            country_code: form.country_code,
            postal_code: form.postal_code,
            phone: form.address_phone,
          },
        ],
      }

      const res = await fetch(`/admin/mp/redington-customers/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      console.log("API Response:", data)

      if (!data.success)
        throw new Error(data.error || data.message || "Update failed")

      // after successful save we can close modal if open
      setIsAddressModalOpen(false)
      navigate("/redington-customers-list")
    } catch (err: any) {
      console.error("UPDATE CUSTOMER ERROR:", err)
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

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
    }
    return statusColors[status.toLowerCase()] || "#6b7280"
  }

  // Format currency
  const formatCurrency = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>
  if (error) return <div style={{ padding: 20, color: "red" }}>{error}</div>
  if (!customer) return <div style={{ padding: 20 }}>Not Found</div>

  // ---------- Addresses for cards ----------
  const addresses = customer.addresses || []

  const defaultAddress = addresses[0]

  const billingAddress =
    addresses.find(
      (a) => a.label && a.label.toLowerCase().includes("billing")
    ) || addresses[1] || defaultAddress

  const shippingAddress =
    addresses.find(
      (a) => a.label && a.label.toLowerCase().includes("shipping")
    ) || addresses[2] || defaultAddress

  const indexOfAddr = (addr?: CustomerAddress) =>
    addr ? addresses.indexOf(addr) : -1

  // ---------- Modal helpers ----------
  const openAddressModal = (
    mode: "add" | "edit",
    addr?: CustomerAddress | null
  ) => {
    setAddressModalMode(mode)
    if (addr) {
      const idx = indexOfAddr(addr)
      setEditingAddressIndex(idx >= 0 ? idx : null)

      setForm((prev) => ({
        ...prev,
        address_label: addr.label ?? "",
        address_line_1: addr.address_line_1 ?? "",
        address_line_2: addr.address_line_2 ?? "",
        city: addr.city ?? "",
        state: addr.state ?? "",
        country_code: addr.country_code ?? "",
        postal_code: addr.postal_code ?? "",
        address_phone: addr.phone ?? "",
      }))
    } else {
      setEditingAddressIndex(null)
      setForm((prev) => ({
        ...prev,
        address_label: "",
        address_line_1: "",
        address_line_2: "",
        city: "",
        state: "",
        country_code: "",
        postal_code: "",
        address_phone: "",
      }))
    }
    setIsAddressModalOpen(true)
  }

  const closeAddressModal = () => {
    setIsAddressModalOpen(false)
  }

  const renderAddressLines = (addr?: CustomerAddress) => {
    if (!addr) {
      return <div style={{ fontSize: 13, color: "#777" }}>No address set.</div>
    }
    return (
      <div style={{ fontSize: 13, lineHeight: 1.5 }}>
        {addr.label && <div>{addr.label}</div>}
        <div>{addr.address_line_1}</div>
        {addr.address_line_2 && <div>{addr.address_line_2}</div>}
        <div>
          {addr.city}
          {addr.state ? `, ${addr.state}` : ""} {addr.postal_code}
        </div>
        <div>{addr.country_code}</div>
        {addr.phone && <div>T: {addr.phone}</div>}
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: "30px" }}>Edit Customer</h1>
        <button style={backBtn} onClick={() => window.history.back()}>
          ← Back
        </button>
      </div>

      {/* Customer Info Header */}
      <div style={customerHeader}>
        <div style={customerAvatar}>
          {customer.first_name?.[0]}
          {customer.last_name?.[0]}
        </div>
        <div>
          <h2 style={{ margin: 0 }}>
            {customer.first_name} {customer.last_name}
          </h2>
          <p style={{ margin: 0, color: "#666" }}>
            {customer.email} • {customer.phone}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 20,
          borderBottom: "1px solid #ddd",
          marginTop: 20,
        }}
      >
        {["personal", "address", "orders"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 18px",
              border: "none",
              borderBottom:
                activeTab === tab
                  ? "3px solid #1f72ff"
                  : "3px solid transparent",
              background: "transparent",
              fontWeight: 600,
              cursor: "pointer",
              color: activeTab === tab ? "#1f72ff" : "#666",
            }}
          >
            {tab === "personal" && "Personal Information"}
            {tab === "address" && "Addresses"}
            {tab === "orders" && `Orders (${orders.length})`}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} style={{ marginTop: 20 }}>
        {/* PERSONAL TAB */}
        {activeTab === "personal" && (
          <div>
            <div style={field}>
              <label>Name Prefix</label>
              <input
                name="name_prefix"
                value={form.name_prefix}
                onChange={handleChange}
                style={input}
              />
            </div>
            <div style={field}>
              <label>First Name</label>
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                style={input}
              />
            </div>
            <div style={field}>
              <label>Last Name</label>
              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                style={input}
              />
            </div>
            <div style={field}>
              <label>Email</label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                style={input}
              />
            </div>
            <div style={field}>
              <label>Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                style={input}
              />
            </div>
            <div style={field}>
              <label>Gender</label>
              <input
                name="gender"
                value={form.gender}
                onChange={handleChange}
                style={input}
              />
            </div>
            <div style={field}>
              <label>DOB</label>
              <input
                name="date_of_birth"
                value={form.date_of_birth}
                onChange={handleChange}
                style={input}
              />
            </div>
          </div>
        )}

        {/* ADDRESS TAB */}
        {activeTab === "address" && (
          <div>
            {/* 3 cards row */}
            <div style={addrCardsRow}>
              <div style={addrCard}>
                <div style={addrCardHeader}>
                  <h3 style={addrCardTitle}>Default Address</h3>
                  <button
                    type="button"
                    style={addrCardLink}
                    onClick={() => openAddressModal("edit", defaultAddress)}
                  >
                    Edit
                  </button>
                </div>
                {renderAddressLines(defaultAddress)}
              </div>

              <div style={addrCard}>
                <div style={addrCardHeader}>
                  <h3 style={addrCardTitle}>Billing Address</h3>
                  <button
                    type="button"
                    style={addrCardLink}
                    onClick={() => openAddressModal("edit", billingAddress)}
                  >
                    Edit
                  </button>
                </div>
                {renderAddressLines(billingAddress)}
              </div>

              <div style={addrCard}>
                <div style={addrCardHeader}>
                  <h3 style={addrCardTitle}>Shipping Address</h3>
                  <button
                    type="button"
                    style={addrCardLink}
                    onClick={() => openAddressModal("edit", shippingAddress)}
                  >
                    Edit
                  </button>
                </div>
                {renderAddressLines(shippingAddress)}
              </div>

              <button
                type="button"
                style={addrAddButton}
                onClick={() => openAddressModal("add", null)}
              >
                Add New Address
              </button>
            </div>

            {/* you can add table / list here later if needed */}
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div style={{ marginTop: 20 }}>
            {ordersLoading ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div>Loading orders...</div>
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
                <h3>No orders found</h3>
                <p>This customer hasn't placed any orders yet.</p>
              </div>
            ) : (
              <div style={ordersContainer}>
                {orders.map((order) => (
                  <div key={order.id} style={orderCard}>
                    {/* Order Header */}
                    <div style={orderHeader}>
                      <div>
                        <strong>Order #{order.id}</strong>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          {formatDate(order.created_at)}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={statusBadge(order.order_status)}>
                          {order.order_status}
                        </div>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            marginTop: 4,
                          }}
                        >
                          {formatCurrency(order.grand_total, order.currency)}
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div style={orderItems}>
                      {order.items.map((item) => (
                        <div key={item.id} style={orderItem}>
                          <div style={itemInfo}>
                            <div style={{ fontWeight: "bold" }}>
                              {item.name}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#666",
                              }}
                            >
                              SKU: {item.sku} • Qty: {item.quantity} •{" "}
                              {formatCurrency(item.price, order.currency)}
                            </div>
                            {item.seller_name && (
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "#8b5cf6",
                                }}
                              >
                                Seller: {item.seller_name}
                              </div>
                            )}
                          </div>
                          <div style={itemTotal}>
                            {formatCurrency(item.row_total, order.currency)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Footer */}
                    <div style={orderFooter}>
                      <div style={footerSection}>
                        <div style={footerLabel}>Payment</div>
                        <div style={footerValue}>
                          {order.payment?.status === "completed"
                            ? "Paid"
                            : order.payment_status}
                        </div>
                      </div>
                      <div style={footerSection}>
                        <div style={footerLabel}>Fulfillment</div>
                        <div style={footerValue}>
                          {order.fulfillment_status}
                        </div>
                      </div>
                      <div style={footerSection}>
                        <div style={footerLabel}>Items</div>
                        <div style={footerValue}>
                          {order.items.length} item
                          {order.items.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>

                    {/* Shipments */}
                    {order.shipments.length > 0 && (
                      <div style={shipmentsSection}>
                        <div style={sectionTitle}>Shipments</div>
                        {order.shipments.map((shipment) => (
                          <div key={shipment.id} style={shipmentItem}>
                            <div>
                              <strong>{shipment.carrier}</strong>
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "#666",
                                }}
                              >
                                Tracking: {shipment.tracking_number}
                              </div>
                              {shipment.seller_name && (
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "#8b5cf6",
                                  }}
                                >
                                  From: {shipment.seller_name}
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: "12px" }}>
                                Shipped: {formatDate(shipment.shipped_at)}
                              </div>
                              {shipment.delivered_at && (
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "#10b981",
                                  }}
                                >
                                  Delivered:{" "}
                                  {formatDate(shipment.delivered_at)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab !== "orders" && (
          <button type="submit" disabled={saving} style={saveBtn}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        )}

        {/* ADDRESS MODAL (for add / edit) */}
        {activeTab === "address" && isAddressModalOpen && (
          <div style={modalOverlay}>
            <div style={modalContent}>
              <div style={modalHeader}>
                <h3 style={{ margin: 0 }}>
                  {addressModalMode === "add"
                    ? "Add New Address"
                    : "Edit Address"}
                </h3>
                <button
                  type="button"
                  style={modalCloseButton}
                  onClick={closeAddressModal}
                >
                  ✕
                </button>
              </div>

              {/* Same fields as earlier "Primary Address" form */}
              <div style={{ marginTop: 12 }}>
                <div style={field}>
                  <label>Label</label>
                  <input
                    name="address_label"
                    value={form.address_label}
                    onChange={handleChange}
                    style={input}
                  />
                </div>
                <div style={field}>
                  <label>Address Line 1</label>
                  <input
                    name="address_line_1"
                    value={form.address_line_1}
                    onChange={handleChange}
                    style={input}
                  />
                </div>
                <div style={field}>
                  <label>Address Line 2</label>
                  <input
                    name="address_line_2"
                    value={form.address_line_2}
                    onChange={handleChange}
                    style={input}
                  />
                </div>
                <div style={field}>
                  <label>City</label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    style={input}
                  />
                </div>
                <div style={field}>
                  <label>State</label>
                  <input
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    style={input}
                  />
                </div>
                <div style={field}>
                  <label>Country Code</label>
                  <input
                    name="country_code"
                    value={form.country_code}
                    onChange={handleChange}
                    style={input}
                  />
                </div>
                <div style={field}>
                  <label>Postal Code</label>
                  <input
                    name="postal_code"
                    value={form.postal_code}
                    onChange={handleChange}
                    style={input}
                  />
                </div>
                <div style={field}>
                  <label>Phone</label>
                  <input
                    name="address_phone"
                    value={form.address_phone}
                    onChange={handleChange}
                    style={input}
                  />
                </div>
              </div>

              <div style={modalFooter}>
                <button
                  type="button"
                  style={modalSecondaryButton}
                  onClick={closeAddressModal}
                >
                  Cancel
                </button>
                <button type="submit" style={modalPrimaryButton}>
                  {saving ? "Saving..." : "Save Address"}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

// Styles
const field = { marginBottom: 12 }

const input: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 8,
  border: "1px solid #ddd",
  fontSize: 14,
}

const saveBtn: React.CSSProperties = {
  padding: "10px 16px",
  background: "#1f72ff",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  marginTop: 20,
}

const backBtn = {
  padding: "8px 14px",
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
}

const customerHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  padding: "20px 0",
  borderBottom: "1px solid #eee",
}

const customerAvatar: React.CSSProperties = {
  width: 60,
  height: 60,
  borderRadius: "50%",
  background: "#1f72ff",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 20,
  fontWeight: "bold",
}

const ordersContainer: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
}

const orderCard: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 20,
  background: "white",
}

const orderHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 16,
  paddingBottom: 16,
  borderBottom: "1px solid #f3f4f6",
}

const orderItems: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  marginBottom: 16,
}

const orderItem: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
}

const itemInfo: React.CSSProperties = {
  flex: 1,
}

const itemTotal: React.CSSProperties = {
  fontWeight: "bold",
  minWidth: 100,
  textAlign: "right",
}

const orderFooter: React.CSSProperties = {
  display: "flex",
  gap: 24,
  paddingTop: 16,
  borderTop: "1px solid #f3f4f6",
}

const footerSection: React.CSSProperties = {
  flex: 1,
}

const footerLabel: React.CSSProperties = {
  fontSize: 12,
  color: "#666",
  textTransform: "uppercase",
  fontWeight: "bold",
  marginBottom: 4,
}

const footerValue: React.CSSProperties = {
  fontSize: 14,
  fontWeight: "500",
}

const shipmentsSection: React.CSSProperties = {
  marginTop: 16,
  paddingTop: 16,
  borderTop: "1px solid #f3f4f6",
}

const sectionTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: "bold",
  marginBottom: 12,
  color: "#374151",
}

const shipmentItem: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 0",
}

const statusBadge = (status: string): React.CSSProperties => ({
  padding: "4px 8px",
  borderRadius: 12,
  fontSize: 12,
  fontWeight: "bold",
  textTransform: "capitalize",
  background: getStatusColor(status),
  color: "white",
  display: "inline-block",
})

// Helper function for status colors
const getStatusColor = (status: string): string => {
  const statusColors: { [key: string]: string } = {
    pending: "#f59e0b",
    confirmed: "#3b82f6",
    processing: "#8b5cf6",
    shipped: "#06b6d4",
    delivered: "#10b981",
    completed: "#059669",
    cancelled: "#ef4444",
    refunded: "#6b7280",
  }
  return statusColors[status.toLowerCase()] || "#6b7280"
}

/* Address tab card styles */
const addrCardsRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr auto",
  gap: 16,
  alignItems: "stretch",
}

const addrCard: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  padding: 16,
  borderRadius: 4,
}

const addrCardHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
}

const addrCardTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 600,
}

const addrCardLink: React.CSSProperties = {
  border: "none",
  background: "none",
  color: "#1f72ff",
  fontSize: 13,
  cursor: "pointer",
  padding: 0,
}

const addrAddButton: React.CSSProperties = {
  padding: "10px 16px",
  background: "#eb5202",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  alignSelf: "flex-start",
  whiteSpace: "nowrap",
}

/* Modal styles */
const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
}

const modalContent: React.CSSProperties = {
  width: "600px",
  maxWidth: "95%",
  background: "#fff",
  borderRadius: 8,
  padding: 20,
  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
}

const modalHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}

const modalCloseButton: React.CSSProperties = {
  border: "none",
  background: "none",
  fontSize: 18,
  cursor: "pointer",
}

const modalFooter: React.CSSProperties = {
  marginTop: 16,
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
}

const modalSecondaryButton: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  border: "1px solid #ccc",
  background: "#fff",
  cursor: "pointer",
}

const modalPrimaryButton: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 6,
  border: "none",
  background: "#1f72ff",
  color: "#fff",
  cursor: "pointer",
}

export const config = defineRouteConfig({
  path: "/redington-customer-edit/:id",
})

export default EditCustomerPage
