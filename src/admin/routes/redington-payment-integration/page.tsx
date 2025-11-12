import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useCallback, useEffect, useMemo, useState } from "react"

type Transaction = {
  id: number
  order_ref_id: string
  order_increment_id: string
  session_id: string
  transaction_reference: string
  payment_status: string | null
  session_version: string | null
  result_indicator: string | null
  order_status: string | null
  transaction_receipt: string | null
  created_at: string
  updated_at: string
}

type TransactionListResponse = {
  transactions?: Transaction[]
  count?: number
  limit?: number
  offset?: number
  message?: string
}

type TransactionResponse = {
  transaction?: Transaction
  message?: string
}

type ResendResponse = {
  transaction: Transaction
  session: {
    id: string
    version: string | null
    result_indicator: string | null
  }
}

const emptyFilters = {
  order_ref_id: "",
  order_increment_id: "",
  session_id: "",
  transaction_reference: "",
  result_indicator: "",
  payment_status: "",
}

const emptyResendForm = {
  return_url: "",
  amount: "",
  currency: "",
  interaction_operation: "PURCHASE" as "PURCHASE" | "AUTHORIZE",
}

const dateFormatter = (value: string) => {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

const statusBadge = (status?: string | null) => {
  if (!status) {
    return { label: "Unknown", bg: "#e5e7eb", color: "#374151" }
  }
  const normalized = status.toLowerCase()
  if (normalized.includes("success") || normalized === "captured") {
    return { label: status, bg: "#dcfce7", color: "#15803d" }
  }
  if (normalized.includes("fail") || normalized.includes("declined")) {
    return { label: status, bg: "#fee2e2", color: "#b91c1c" }
  }
  if (normalized.includes("pending")) {
    return { label: status, bg: "#fef9c3", color: "#92400e" }
  }
  return { label: status, bg: "#e0e7ff", color: "#3730a3" }
}

const PaymentIntegrationPage: React.FC = () => {
  const [filters, setFilters] = useState(emptyFilters)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [count, setCount] = useState(0)
  const [limit, setLimit] = useState(50)
  const [offset, setOffset] = useState(0)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<Transaction | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [resendForm, setResendForm] = useState(emptyResendForm)
  const [resendAlert, setResendAlert] = useState<{
    text: string
    tone: "success" | "error" | "info"
  } | null>(null)
  const [resendLoading, setResendLoading] = useState(false)

  const fetchJson = useCallback(async (url: string, init?: RequestInit) => {
    const response = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      ...init,
    })

    if (!response.ok) {
      let body: any = null
      try {
        body = await response.json()
      } catch {
        // ignore parse errors
      }
      const message =
        body?.message ||
        `Request failed with status ${response.status.toString()}`
      throw new Error(message)
    }

    if (response.status === 204) {
      return null
    }

    try {
      return await response.json()
    } catch {
      return null
    }
  }, [])

  const buildQuery = useCallback(
    (override?: { limit?: number; offset?: number }) => {
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

  const loadTransactions = useCallback(
    async (paginationOverride?: { limit?: number; offset?: number }) => {
      setListLoading(true)
      setListError(null)
      try {
        const query = buildQuery(paginationOverride)
        const data = (await fetchJson(
          `/admin/redington/payment-integration/transactions?${query}`
        )) as TransactionListResponse
        const items = data?.transactions ?? []
        setTransactions(items)
        setCount(data?.count ?? 0)
        setLimit(data?.limit ?? paginationOverride?.limit ?? limit)
        setOffset(data?.offset ?? paginationOverride?.offset ?? offset)

        setSelectedId((current) => {
          if (current && items.some((item) => item.id === current)) {
            return current
          }
          return items[0]?.id ?? null
        })
      } catch (error: any) {
        setListError(error.message || "Unable to load payment transactions.")
        setTransactions([])
        setCount(0)
        setSelectedId(null)
      } finally {
        setListLoading(false)
      }
    },
    [buildQuery, fetchJson, limit, offset]
  )

  const loadDetail = useCallback(
    async (id: number | null) => {
      if (!id) {
        setDetail(null)
        setDetailError(null)
        return
      }

      setDetailLoading(true)
      setDetailError(null)
      try {
        const data = (await fetchJson(
          `/admin/redington/payment-integration/transactions/${id}`
        )) as TransactionResponse
        setDetail(data?.transaction ?? null)
        setResendForm((current) => ({
          ...current,
          return_url: current.return_url || window.location.origin,
          currency: current.currency || "",
        }))
      } catch (error: any) {
        setDetail(null)
        setDetailError(
          error.message || "Unable to load transaction details."
        )
      } finally {
        setDetailLoading(false)
      }
    },
    [fetchJson]
  )

  useEffect(() => {
    loadTransactions()
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
    loadTransactions({ offset: 0 })
  }

  const handleReset = () => {
    setFilters(emptyFilters)
    loadTransactions({ offset: 0 })
  }

  const handlePaginate = (direction: "prev" | "next") => {
    if (listLoading) {
      return
    }
    const nextOffset =
      direction === "prev"
        ? Math.max(0, offset - limit)
        : Math.min(
            count > 0 ? Math.max(0, count - limit) : offset + limit,
            offset + limit
          )

    if (nextOffset === offset && direction === "next") {
      // avoid fetching beyond available data
      if (count && offset + limit >= count) {
        return
      }
    }

    loadTransactions({ offset: nextOffset })
  }

  const selectedTransaction = useMemo(
    () =>
      detail ||
      transactions.find((transaction) => transaction.id === selectedId) ||
      null,
    [detail, transactions, selectedId]
  )

  const handleResendChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target
    setResendForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleResend = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedId) {
      return
    }
    const trimmedReturnUrl = resendForm.return_url.trim()
    if (!trimmedReturnUrl) {
      setResendAlert({
        text: "Return URL is required.",
        tone: "error",
      })
      return
    }

    setResendLoading(true)
    setResendAlert(null)
    try {
      const payload: Record<string, any> = {
        return_url: trimmedReturnUrl,
      }
      if (resendForm.amount.trim()) {
        payload.amount = Number(resendForm.amount)
      }
      if (resendForm.currency.trim()) {
        payload.currency = resendForm.currency.trim().toUpperCase()
      }
      payload.interaction_operation = resendForm.interaction_operation

      const data = (await fetchJson(
        `/admin/redington/payment-integration/transactions/${selectedId}/resend`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      )) as ResendResponse

      if (data?.transaction) {
        setDetail(data.transaction)
        setResendAlert({
          text: `New session ${data.session?.id ?? ""} created successfully.`,
          tone: "success",
        })
        loadTransactions()
      } else {
        setResendAlert({
          text: "Payment link resent, but no transaction payload.",
          tone: "info",
        })
      }
    } catch (error: any) {
      setResendAlert({
        text: error.message || "Unable to resend payment link.",
        tone: "error",
      })
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div style={{ padding: "24px 16px 64px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Payment Integration</h1>
        <p style={{ color: "#5f6c7b", marginTop: 8, maxWidth: 720 }}>
          Monitor MPGS checkout sessions, verify status polling, and resend
          hosted payment links when customers report failures. The data below
          maps directly to the Magento table <code>redington_mpgs_transaction</code>.
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
        <h2 style={{ marginTop: 0 }}>Search Transactions</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 16,
          }}
        >
          {Object.entries(filters).map(([key, value]) => (
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
                {key.replace(/_/g, " ")}
              </label>
              <input
                id={key}
                name={key}
                value={value}
                onChange={handleFilterChange}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
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
            onClick={handleReset}
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
          <div style={{ marginLeft: "auto", color: "#6b7280", alignSelf: "center" }}>
            Showing {transactions.length} of {count} records
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
          <h2 style={{ margin: 0 }}>Transactions</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => handlePaginate("prev")}
              disabled={listLoading || offset === 0}
              style={{
                border: "1px solid #d1d5db",
                background: offset === 0 ? "#f3f4f6" : "#fff",
                padding: "6px 10px",
                borderRadius: 6,
                cursor: offset === 0 ? "not-allowed" : "pointer",
              }}
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => handlePaginate("next")}
              disabled={
                listLoading || (count > 0 && offset + limit >= count)
              }
              style={{
                border: "1px solid #d1d5db",
                background:
                  count > 0 && offset + limit >= count ? "#f3f4f6" : "#fff",
                padding: "6px 10px",
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
        {listError && (
          <div
            style={{
              padding: 16,
              color: "#b91c1c",
              background: "#fef2f2",
              borderBottom: "1px solid #fecaca",
            }}
          >
            {listError}
          </div>
        )}
        {!listError && (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr style={{ textAlign: "left", background: "#f9fafb" }}>
                  {[
                    "Updated",
                    "Order Ref",
                    "Order Increment",
                    "Session ID",
                    "Payment Status",
                    "Result Indicator",
                  ].map((label) => (
                    <th
                      key={label}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #e5e7eb",
                        fontWeight: 600,
                        color: "#4b5563",
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listLoading && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: 16,
                        textAlign: "center",
                        color: "#6b7280",
                      }}
                    >
                      Loading transactions…
                    </td>
                  </tr>
                )}
                {!listLoading && transactions.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: 16,
                        textAlign: "center",
                        color: "#6b7280",
                      }}
                    >
                      No transactions found for the selected filters.
                    </td>
                  </tr>
                )}
                {!listLoading &&
                  transactions.map((transaction) => {
                    const badge = statusBadge(transaction.payment_status)
                    const isSelected = transaction.id === selectedId
                    return (
                      <tr
                        key={transaction.id}
                        onClick={() => setSelectedId(transaction.id)}
                        style={{
                          background: isSelected ? "#eff6ff" : "#fff",
                          cursor: "pointer",
                          borderBottom: "1px solid #f3f4f6",
                        }}
                      >
                        <td style={{ padding: "10px 16px" }}>
                          {dateFormatter(transaction.updated_at)}
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <strong>{transaction.order_ref_id}</strong>
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          {transaction.order_increment_id}
                        </td>
                        <td
                          style={{
                            padding: "10px 16px",
                            fontFamily: "monospace",
                            fontSize: 13,
                          }}
                        >
                          {transaction.session_id}
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 10px",
                              borderRadius: 999,
                              background: badge.bg,
                              color: badge.color,
                              fontWeight: 600,
                              fontSize: 12,
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          {transaction.result_indicator || "-"}
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
          <h2 style={{ marginTop: 0 }}>Transaction Details</h2>
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
          {detailLoading && (
            <div style={{ color: "#6b7280" }}>Loading details…</div>
          )}
          {!detailLoading && !selectedTransaction && (
            <div style={{ color: "#6b7280" }}>
              Select a transaction from the table to view details.
            </div>
          )}
          {selectedTransaction && (
            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "max-content 1fr",
                rowGap: 12,
                columnGap: 16,
              }}
            >
              {[
                ["Order Ref ID", selectedTransaction.order_ref_id],
                ["Order Increment ID", selectedTransaction.order_increment_id],
                ["Session ID", selectedTransaction.session_id],
                ["Transaction Ref", selectedTransaction.transaction_reference],
                ["Payment Status", selectedTransaction.payment_status || "-"],
                ["Result Indicator", selectedTransaction.result_indicator || "-"],
                ["Order Status", selectedTransaction.order_status || "-"],
                ["Session Version", selectedTransaction.session_version || "-"],
                [
                  "Transaction Receipt",
                  selectedTransaction.transaction_receipt || "-",
                ],
                [
                  "Created At",
                  dateFormatter(selectedTransaction.created_at),
                ],
                [
                  "Updated At",
                  dateFormatter(selectedTransaction.updated_at),
                ],
              ].map(([label, value]) => (
                <React.Fragment key={label}>
                  <dt style={{ fontWeight: 600, color: "#4b5563" }}>{label}</dt>
                  <dd style={{ margin: 0, wordBreak: "break-word" }}>{value}</dd>
                </React.Fragment>
              ))}
            </dl>
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
          <h2 style={{ marginTop: 0 }}>Resend Payment Link</h2>
          {resendAlert && (
            <div
              style={{
                padding: 12,
                background:
                  resendAlert.tone === "success"
                    ? "#ecfdf5"
                    : resendAlert.tone === "error"
                    ? "#fef2f2"
                    : "#eff6ff",
                border: `1px solid ${
                  resendAlert.tone === "success"
                    ? "#bbf7d0"
                    : resendAlert.tone === "error"
                    ? "#fecaca"
                    : "#bfdbfe"
                }`,
                borderRadius: 6,
                color:
                  resendAlert.tone === "success"
                    ? "#15803d"
                    : resendAlert.tone === "error"
                    ? "#b91c1c"
                    : "#1d4ed8",
                marginBottom: 12,
              }}
            >
              {resendAlert.text}
            </div>
          )}
          {!selectedId && (
            <p style={{ color: "#6b7280" }}>
              Select a transaction to enable resend controls.
            </p>
          )}
          <form onSubmit={handleResend}>
            <div style={{ marginBottom: 12 }}>
              <label
                htmlFor="return_url"
                style={{ display: "block", fontWeight: 500, marginBottom: 4 }}
              >
                Return URL
              </label>
              <input
                id="return_url"
                name="return_url"
                value={resendForm.return_url}
                onChange={handleResendChange}
                placeholder="https://example.com/payment/callback"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="amount"
                  style={{
                    display: "block",
                    fontWeight: 500,
                    marginBottom: 4,
                  }}
                >
                  Amount (optional)
                </label>
                <input
                  id="amount"
                  name="amount"
                  value={resendForm.amount}
                  onChange={handleResendChange}
                  placeholder="Leave blank to use order total"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>
              <div style={{ width: 140 }}>
                <label
                  htmlFor="currency"
                  style={{
                    display: "block",
                    fontWeight: 500,
                    marginBottom: 4,
                  }}
                >
                  Currency
                </label>
                <input
                  id="currency"
                  name="currency"
                  value={resendForm.currency}
                  onChange={handleResendChange}
                  placeholder="AED"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                    textTransform: "uppercase",
                  }}
                />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label
                htmlFor="interaction_operation"
                style={{ display: "block", fontWeight: 500, marginBottom: 4 }}
              >
                Interaction
              </label>
              <select
                id="interaction_operation"
                name="interaction_operation"
                value={resendForm.interaction_operation}
                onChange={handleResendChange}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                }}
              >
                <option value="PURCHASE">Purchase (capture)</option>
                <option value="AUTHORIZE">Authorize only</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={!selectedId || resendLoading}
              style={{
                marginTop: 16,
                border: "none",
                borderRadius: 6,
                padding: "10px 16px",
                background: !selectedId || resendLoading ? "#9ca3af" : "#1d4ed8",
                color: "#fff",
                cursor:
                  !selectedId || resendLoading ? "not-allowed" : "pointer",
              }}
            >
              {resendLoading ? "Sending…" : "Resend Payment Link"}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

export const config = defineRouteConfig({})

export default PaymentIntegrationPage
