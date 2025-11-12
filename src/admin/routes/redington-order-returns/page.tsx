import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useCallback, useEffect, useMemo, useState } from "react"

type OrderReturn = {
  id: number
  order_id: string
  user_name: string
  user_email: string
  sku: string
  product_name: string
  qty: number
  price: number | null
  order_status: string | null
  return_status: string | null
  remarks: string | null
  created_at: string
}

type OrderReturnResponse = {
  order_returns?: OrderReturn[]
  count?: number
  limit?: number
  offset?: number
  message?: string
}

const OrderReturnsPage: React.FC = () => {
  const [returns, setReturns] = useState<OrderReturn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({ email: "", orderId: "" })
  const [refreshToken, setRefreshToken] = useState(0)

  const loadReturns = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters.email.trim().length) {
        params.set("email", filters.email.trim())
      }
      if (filters.orderId.trim().length) {
        params.set("order_id", filters.orderId.trim())
      }
      const query = params.toString()
      const response = await fetch(
        `/admin/redington/order-returns${query ? `?${query}` : ""}`,
        {
          credentials: "include",
        }
      )

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as OrderReturnResponse
        throw new Error(body?.message || "Failed to load return records.")
      }

      const body = (await response.json()) as OrderReturnResponse
      setReturns(body.order_returns ?? [])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load return records."
      setError(message)
      setReturns([])
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadReturns()
  }, [loadReturns, refreshToken])

  const handleRefresh = () => {
    setRefreshToken((token) => token + 1)
  }

  const formatDate = (value: string) => {
    if (!value) {
      return "-"
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return value
    }
    return date.toLocaleString()
  }

  const mappedReturns = useMemo(() => {
    return returns.map((entry) => ({
      ...entry,
      order_status: entry.order_status ?? "N/A",
      return_status: entry.return_status ?? "Pending",
    }))
  }, [returns])

  return (
    <div className="flex flex-col gap-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Order Return Management</h1>
        <p className="text-sm text-gray-500">
          Review and track customer return requests mirrored from Lenovo’s storefront
          (table: <code>redington_order_return</code>).
        </p>
      </div>

      <form
        className="flex flex-wrap gap-4 items-end bg-gray-50 rounded-md p-4"
        onSubmit={(event) => {
          event.preventDefault()
          handleRefresh()
        }}
      >
        <div className="flex flex-col">
          <label className="text-xs uppercase tracking-wide text-gray-500 mb-1">
            Customer Email
          </label>
          <input
            type="email"
            value={filters.email}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, email: event.target.value }))
            }
            className="border border-gray-300 rounded px-2 py-1 min-w-[220px]"
            placeholder="customer@example.com"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs uppercase tracking-wide text-gray-500 mb-1">
            Order ID
          </label>
          <input
            type="text"
            value={filters.orderId}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, orderId: event.target.value }))
            }
            className="border border-gray-300 rounded px-2 py-1 min-w-[200px]"
            placeholder="order_..."
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded text-sm"
          >
            Apply Filters
          </button>
          <button
            type="button"
            className="bg-white border border-gray-300 px-4 py-2 rounded text-sm"
            onClick={() => {
              setFilters({ email: "", orderId: "" })
              setRefreshToken((token) => token + 1)
            }}
          >
            Clear
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Loading returns...</div>
      ) : error ? (
        <div className="py-6 text-red-600">{error}</div>
      ) : mappedReturns.length ? (
        <div className="overflow-x-auto border border-gray-200 rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Unit Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Remark</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {mappedReturns.map((entry) => (
                <tr key={entry.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-mono text-xs">{entry.order_id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{entry.user_name}</div>
                    <div className="text-xs text-gray-500">{entry.user_email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{entry.product_name}</div>
                    <div className="text-xs text-gray-500">SKU: {entry.sku}</div>
                  </td>
                  <td className="px-4 py-3">{entry.qty}</td>
                  <td className="px-4 py-3">
                    {typeof entry.price === "number" ? entry.price.toFixed(2) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-gray-500 uppercase">
                      Order: {entry.order_status}
                    </div>
                    <div className="font-medium">{entry.return_status}</div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <span className="text-gray-700">
                      {entry.remarks ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {formatDate(entry.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-6 text-gray-500">No return records found.</div>
      )}
    </div>
  )
}

export const config = defineRouteConfig({})

export default OrderReturnsPage
