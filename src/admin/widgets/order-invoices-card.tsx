import { defineWidgetConfig } from "@medusajs/admin-sdk"
import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

type MagentoInvoice = {
  id?: string | number | null
  increment_id?: string | null
  order_id?: string | number | null
  order_increment_id?: string | null
  grand_total?: number | null
  currency?: string | null
  created_at?: string | null
  pdf_url?: string | null
}

const formatAmount = (amount?: number | null, currency?: string | null) => {
  if (typeof amount !== "number" || !isFinite(amount)) {
    return null
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: (currency || "USD").toUpperCase(),
    }).format(amount)
  } catch {
    return amount.toFixed(2)
  }
}

const formatDate = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleString()
}

const OrderInvoicesCard: React.FC = () => {
  const { id } = useParams()
  const orderId = id ?? ""

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<MagentoInvoice[]>([])

  useEffect(() => {
    let cancelled = false

    const fetchJson = async (path: string) => {
      const res = await fetch(path, { credentials: "include" })
      if (!res.ok) {
        const text = await res.text()
        const error = new Error(text || res.statusText)
        ;(error as any).status = res.status
        throw error
      }
      return res.json()
    }

    const fetchOrderById = async (identifier: string) => {
      const payload = await fetchJson(`/admin/orders/${identifier}?fields=id,metadata`)
      return payload?.order ?? null
    }

    const fetchOrderByDisplayId = async (displayId: string) => {
      const payload = await fetchJson(
        `/admin/orders?display_id=${encodeURIComponent(displayId)}&limit=1&fields=id,metadata`
      )
      const list = payload?.orders ?? []
      return Array.isArray(list) && list.length ? list[0] : null
    }

    async function load() {
      if (!orderId) {
        setIsLoading(false)
        setInvoices([])
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        let order: any = null

        try {
          order = await fetchOrderById(orderId)
        } catch (err) {
          const status = (err as any)?.status
          const message = (err as Error)?.message || ""
          if (status === 404 || /Order id not found/i.test(message)) {
            order = await fetchOrderByDisplayId(orderId)
          } else {
            throw err
          }
        }

        if (!cancelled) {
          const raw = order?.metadata?.magento_invoices
          setInvoices(Array.isArray(raw) ? raw : [])
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err)
          setError(message)
          setInvoices([])
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [orderId])

  if (isLoading || error) {
    return null
  }

  if (!invoices.length) {
    return null
  }

  return (
    <div className="bg-ui-bg-component shadow-card rounded-lg border border-ui-border-subtle p-4 flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-ui-fg-base text-base font-semibold">Magento Invoices</h3>
        <span className="text-ui-fg-subtle text-sm">
          {invoices.length === 1 ? "1 invoice" : `${invoices.length} invoices`}
        </span>
      </div>

      <div className="flex flex-col gap-y-3">
        {invoices.map((invoice) => {
          const key =
            (invoice.id ?? invoice.increment_id ?? invoice.order_increment_id ?? Math.random()).toString()
          const amount = formatAmount(invoice.grand_total, invoice.currency)
          const createdAt = formatDate(invoice.created_at)

          return (
            <div
              key={key}
              className="flex flex-col gap-y-1 rounded-md border border-ui-border-subtle bg-ui-bg-subtle p-3 md:flex-row md:items-center md:justify-between md:gap-y-0"
            >
              <div className="flex flex-col">
                <span className="text-ui-fg-base font-medium">
                  #{invoice.increment_id || invoice.id || invoice.order_increment_id || "Invoice"}
                </span>
                <span className="text-ui-fg-subtle text-sm">
                  {createdAt ? `Issued ${createdAt}` : "Issue date unavailable"}
                </span>
                {amount && (
                  <span className="text-ui-fg-subtle text-sm">
                    Total: {amount}
                  </span>
                )}
              </div>

              {invoice.pdf_url ? (
                <a
                  href={invoice.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover text-sm font-medium"
                >
                  Download PDF
                </a>
              ) : (
                <span className="text-ui-fg-muted text-sm">PDF not available</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.after",
})

export default OrderInvoicesCard
