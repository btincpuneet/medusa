import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useCallback, useEffect, useState } from "react"

type CategoryRestrictionConfig = {
  promotion_root_category_id: string | null
}

type ConfigResponse = {
  config?: CategoryRestrictionConfig
  message?: string
}

const RedingtonCategoryRestrictionPage: React.FC = () => {
  const [value, setValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const loadConfig = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        "/admin/redington/category-restrictions/config",
        { credentials: "include" }
      )

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as ConfigResponse
        throw new Error(
          body?.message ||
            `Failed to load category restriction config (${response.status})`
        )
      }

      const body = (await response.json()) as ConfigResponse
      const current =
        body.config?.promotion_root_category_id ??
        body.config?.promotion_root_category_id ??
        ""
      setValue(current ?? "")
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load category restriction settings."
      setError(message)
      setValue("")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadConfig()
  }, [loadConfig])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    setIsSaving(true)
    setStatus(null)
    setError(null)

    const payload = {
      promotion_root_category_id: value.trim() ? value.trim() : null,
    }

    try {
      const response = await fetch(
        "/admin/redington/category-restrictions/config",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      )

      const body = (await response.json().catch(() => ({}))) as ConfigResponse

      if (!response.ok) {
        throw new Error(
          body?.message || `Failed to save config (${response.status})`
        )
      }

      const updatedId =
        body.config?.promotion_root_category_id ??
        payload.promotion_root_category_id ??
        ""
      setValue(updatedId ?? "")
      setStatus("Category restriction updated.")
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to save category restriction."
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "24px",
      }}
    >
      <header>
        <h1 style={{ marginBottom: "8px" }}>Category Restriction</h1>
        <p style={{ margin: 0, color: "#555" }}>
          Configure which Magento category ID acts as the root for restricted
          promotional content surfaced in the storefront.
        </p>
      </header>

      <section
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #e5e5e5",
          padding: "24px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Promotion Root Category</h2>

        {isLoading ? <p>Loading configuration…</p> : null}
        {error ? <p style={{ color: "#a80000" }}>{error}</p> : null}
        {status ? <p style={{ color: "#0a7f46" }}>{status}</p> : null}

        <form
          onSubmit={handleSubmit}
          style={{ display: "grid", gap: "16px", maxWidth: "420px" }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span>Promotion Root Category ID</span>
            <input
              type="text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="e.g. 123"
            />
          </label>

          <div style={{ display: "flex", gap: "12px" }}>
            <button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => void loadConfig()}
              disabled={isSaving}
            >
              Reset
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export const config = defineRouteConfig({})

export default RedingtonCategoryRestrictionPage
