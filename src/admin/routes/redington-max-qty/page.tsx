import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useCallback, useEffect, useMemo, useState } from "react"

type RuleRow = {
  id: number
  category_id: string
  brand_id: string
  company_code: string
  domain_id: number | null
  max_qty: number
  created_at: string
  updated_at: string
}

type CategoryRow = {
  id: number
  category_ids: string
  brand_id: string
  company_code: string
  domain_id: number | null
  max_qty: number
  created_at: string
  updated_at: string
}

type TrackerRow = {
  id: number
  customer_id: number
  order_increment_id: string
  sku: string
  quantity: number
  brand_id: string | null
  created_at: string
}

type RulesResponse = {
  rules?: RuleRow[]
  count?: number
  message?: string
}

type CategoriesResponse = {
  categories?: CategoryRow[]
  count?: number
  message?: string
}

type TrackerResponse = {
  records?: TrackerRow[]
  trackers?: TrackerRow[]
  count?: number
  message?: string
}

const initialRuleForm = {
  category_id: "",
  brand_id: "",
  company_code: "",
  domain_id: "",
  max_qty: "",
}

const initialCategoryForm = {
  category_ids: "",
  brand_id: "",
  company_code: "",
  domain_id: "",
  max_qty: "",
}

const MaxQtyPage: React.FC = () => {
  const [rules, setRules] = useState<RuleRow[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [trackerRows, setTrackerRows] = useState<TrackerRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ruleForm, setRuleForm] = useState(initialRuleForm)
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm)
  const [savingRule, setSavingRule] = useState(false)
  const [savingCategory, setSavingCategory] = useState(false)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const fetchJson = async (
    url: string,
    init?: RequestInit
  ): Promise<any> => {
    const response = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      ...init,
    })

    if (!response.ok) {
      let body: any = null
      try {
        body = await response.json()
      } catch {
        // noop
      }
      const message =
        body?.message ||
        `Request failed with status ${response.status.toString()}`
      throw new Error(message)
    }

    try {
      return await response.json()
    } catch {
      return null
    }
  }

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [ruleRes, categoryRes, trackerRes] = await Promise.all([
        fetchJson("/admin/redington/max-qty/rules?limit=200") as Promise<RulesResponse>,
        fetchJson("/admin/redington/max-qty/categories?limit=200") as Promise<CategoriesResponse>,
        fetchJson("/admin/redington/max-qty/tracker?limit=20") as Promise<TrackerResponse>,
      ])

      setRules(ruleRes.rules ?? [])
      setCategories(categoryRes.categories ?? [])
      setTrackerRows(
        (trackerRes as any)?.records ??
          trackerRes.trackers ??
          []
      )
    } catch (err: any) {
      setError(err.message || "Failed to load Max Qty data.")
      setRules([])
      setCategories([])
      setTrackerRows([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRuleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (
      !ruleForm.category_id.trim() ||
      !ruleForm.brand_id.trim() ||
      !ruleForm.company_code.trim() ||
      !ruleForm.max_qty.trim()
    ) {
      setInfoMessage("Please fill category, brand, company code, and max qty.")
      return
    }
    setSavingRule(true)
    setInfoMessage(null)
    try {
      await fetchJson("/admin/redington/max-qty/rules", {
        method: "POST",
        body: JSON.stringify({
          category_id: ruleForm.category_id.trim(),
          brand_id: ruleForm.brand_id.trim(),
          company_code: ruleForm.company_code.trim(),
          domain_id: ruleForm.domain_id.trim()
            ? Number(ruleForm.domain_id)
            : null,
          max_qty: Number(ruleForm.max_qty),
        }),
      })
      setRuleForm(initialRuleForm)
      loadData()
      setInfoMessage("Rule saved successfully.")
    } catch (err: any) {
      setInfoMessage(err.message || "Failed to save rule.")
    } finally {
      setSavingRule(false)
    }
  }

  const handleCategorySubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (
      !categoryForm.category_ids.trim() ||
      !categoryForm.brand_id.trim() ||
      !categoryForm.company_code.trim() ||
      !categoryForm.max_qty.trim()
    ) {
      setInfoMessage("Please fill category list, brand, company code, and max qty.")
      return
    }
    setSavingCategory(true)
    setInfoMessage(null)
    try {
      await fetchJson("/admin/redington/max-qty/categories", {
        method: "POST",
        body: JSON.stringify({
          category_ids: categoryForm.category_ids.trim(),
          brand_id: categoryForm.brand_id.trim(),
          company_code: categoryForm.company_code.trim(),
          domain_id: categoryForm.domain_id.trim()
            ? Number(categoryForm.domain_id)
            : null,
          max_qty: Number(categoryForm.max_qty),
        }),
      })
      setCategoryForm(initialCategoryForm)
      loadData()
      setInfoMessage("Category rule saved successfully.")
    } catch (err: any) {
      setInfoMessage(err.message || "Failed to save category rule.")
    } finally {
      setSavingCategory(false)
    }
  }

  const handleDeleteRule = async (id: number) => {
    if (!window.confirm("Delete this rule?")) {
      return
    }
    try {
      await fetchJson(`/admin/redington/max-qty/rules/${id}`, {
        method: "DELETE",
      })
      loadData()
      setInfoMessage("Rule deleted.")
    } catch (err: any) {
      setInfoMessage(err.message || "Failed to delete rule.")
    }
  }

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm("Delete this category rule?")) {
      return
    }
    try {
      await fetchJson(`/admin/redington/max-qty/categories/${id}`, {
        method: "DELETE",
      })
      loadData()
      setInfoMessage("Category rule deleted.")
    } catch (err: any) {
      setInfoMessage(err.message || "Failed to delete category rule.")
    }
  }

  const formattedTrackerRows = useMemo(() => {
    return trackerRows.map((row) => ({
      ...row,
      created_at: new Date(row.created_at).toLocaleString(),
    }))
  }, [trackerRows])

  return (
    <div className="flex flex-col gap-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Max Qty Rules</h1>
        <p className="text-gray-600 text-sm">
          Configure the same brand/category limits that existed in Magento. Data
          lives in <code>redington_max_qty_rule</code>,{" "}
          <code>redington_max_qty_category</code>, and{" "}
          <code>redington_order_quantity_tracker</code>. Use the migrate script
          (<code>pnpm medusa exec src/scripts/migrate-redington-tables.ts</code>
          ) to boot strap data from Magento before editing.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded">
          {error}
        </div>
      )}

      {infoMessage && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded">
          {infoMessage}
        </div>
      )}

      <section className="bg-white border border-gray-200 rounded-md p-4">
        <div className="flex flex-col gap-y-4">
          <div>
            <h2 className="text-xl font-semibold">Rule Based Limits</h2>
            <p className="text-sm text-gray-500">
              Single category per brand + company + domain.
            </p>
          </div>

          <form
            className="grid grid-cols-1 md:grid-cols-5 gap-3"
            onSubmit={handleRuleSubmit}
          >
            <input
              className="border rounded px-2 py-1"
              placeholder="Category ID"
              value={ruleForm.category_id}
              onChange={(e) =>
                setRuleForm((prev) => ({ ...prev, category_id: e.target.value }))
              }
            />
            <input
              className="border rounded px-2 py-1"
              placeholder="Brand ID"
              value={ruleForm.brand_id}
              onChange={(e) =>
                setRuleForm((prev) => ({ ...prev, brand_id: e.target.value }))
              }
            />
            <input
              className="border rounded px-2 py-1"
              placeholder="Company Code"
              value={ruleForm.company_code}
              onChange={(e) =>
                setRuleForm((prev) => ({ ...prev, company_code: e.target.value }))
              }
            />
            <input
              className="border rounded px-2 py-1"
              placeholder="Domain ID (optional)"
              value={ruleForm.domain_id}
              onChange={(e) =>
                setRuleForm((prev) => ({ ...prev, domain_id: e.target.value }))
              }
            />
            <div className="flex gap-2">
              <input
                className="border rounded px-2 py-1 flex-1"
                placeholder="Max Qty"
                value={ruleForm.max_qty}
                onChange={(e) =>
                  setRuleForm((prev) => ({ ...prev, max_qty: e.target.value }))
                }
              />
              <button
                type="submit"
                className="bg-black text-white px-3 py-1 rounded text-sm"
                disabled={savingRule}
              >
                {savingRule ? "Saving..." : "Save"}
              </button>
            </div>
          </form>

          {isLoading ? (
            <div className="text-gray-500 text-sm">Loading rules…</div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">Category</th>
                    <th className="px-3 py-2 text-left">Brand</th>
                    <th className="px-3 py-2 text-left">Company</th>
                    <th className="px-3 py-2 text-left">Domain</th>
                    <th className="px-3 py-2 text-left">Max Qty</th>
                    <th className="px-3 py-2 text-left">Updated</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id} className="border-b">
                      <td className="px-3 py-2 font-mono text-xs">{rule.id}</td>
                      <td className="px-3 py-2">{rule.category_id}</td>
                      <td className="px-3 py-2">{rule.brand_id}</td>
                      <td className="px-3 py-2">{rule.company_code}</td>
                      <td className="px-3 py-2">
                        {rule.domain_id ?? "—"}
                      </td>
                      <td className="px-3 py-2">{rule.max_qty}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {new Date(rule.updated_at).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          className="text-red-600 text-xs"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!rules.length && (
                    <tr>
                      <td className="px-3 py-4 text-center text-gray-500" colSpan={8}>
                        No rules configured yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-md p-4">
        <div className="flex flex-col gap-y-4">
          <div>
            <h2 className="text-xl font-semibold">Category Group Limits</h2>
            <p className="text-sm text-gray-500">
              Fallback limits defined for multiple categories.
            </p>
          </div>

          <form
            className="grid grid-cols-1 md:grid-cols-5 gap-3"
            onSubmit={handleCategorySubmit}
          >
            <input
              className="border rounded px-2 py-1"
              placeholder="Category IDs (comma separated)"
              value={categoryForm.category_ids}
              onChange={(e) =>
                setCategoryForm((prev) => ({
                  ...prev,
                  category_ids: e.target.value,
                }))
              }
            />
            <input
              className="border rounded px-2 py-1"
              placeholder="Brand ID"
              value={categoryForm.brand_id}
              onChange={(e) =>
                setCategoryForm((prev) => ({
                  ...prev,
                  brand_id: e.target.value,
                }))
              }
            />
            <input
              className="border rounded px-2 py-1"
              placeholder="Company Code"
              value={categoryForm.company_code}
              onChange={(e) =>
                setCategoryForm((prev) => ({
                  ...prev,
                  company_code: e.target.value,
                }))
              }
            />
            <input
              className="border rounded px-2 py-1"
              placeholder="Domain ID (optional)"
              value={categoryForm.domain_id}
              onChange={(e) =>
                setCategoryForm((prev) => ({
                  ...prev,
                  domain_id: e.target.value,
                }))
              }
            />
            <div className="flex gap-2">
              <input
                className="border rounded px-2 py-1 flex-1"
                placeholder="Max Qty"
                value={categoryForm.max_qty}
                onChange={(e) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    max_qty: e.target.value,
                  }))
                }
              />
              <button
                type="submit"
                className="bg-black text-white px-3 py-1 rounded text-sm"
                disabled={savingCategory}
              >
                {savingCategory ? "Saving..." : "Save"}
              </button>
            </div>
          </form>

          {isLoading ? (
            <div className="text-gray-500 text-sm">Loading category rules…</div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">Category IDs</th>
                    <th className="px-3 py-2 text-left">Brand</th>
                    <th className="px-3 py-2 text-left">Company</th>
                    <th className="px-3 py-2 text-left">Domain</th>
                    <th className="px-3 py-2 text-left">Max Qty</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-b">
                      <td className="px-3 py-2 font-mono text-xs">{category.id}</td>
                      <td className="px-3 py-2">{category.category_ids}</td>
                      <td className="px-3 py-2">{category.brand_id}</td>
                      <td className="px-3 py-2">{category.company_code}</td>
                      <td className="px-3 py-2">
                        {category.domain_id ?? "—"}
                      </td>
                      <td className="px-3 py-2">{category.max_qty}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          className="text-red-600 text-xs"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!categories.length && (
                    <tr>
                      <td className="px-3 py-4 text-center text-gray-500" colSpan={7}>
                        No category rules configured yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-md p-4">
        <h2 className="text-xl font-semibold mb-2">Recent Order Tracker Entries</h2>
        <p className="text-sm text-gray-500 mb-4">
          Snapshot from <code>redington_order_quantity_tracker</code>. These rows
          keep historical usage for enforcement and migration.
        </p>
        {isLoading ? (
          <div className="text-gray-500 text-sm">Loading tracker entries…</div>
        ) : formattedTrackerRows.length ? (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-3 py-2 text-left">Order</th>
                  <th className="px-3 py-2 text-left">Customer</th>
                  <th className="px-3 py-2 text-left">SKU</th>
                  <th className="px-3 py-2 text-left">Brand</th>
                  <th className="px-3 py-2 text-left">Qty</th>
                  <th className="px-3 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {formattedTrackerRows.map((row) => (
                  <tr key={row.id} className="border-b">
                    <td className="px-3 py-2 font-mono text-xs">
                      {row.order_increment_id}
                    </td>
                    <td className="px-3 py-2">{row.customer_id}</td>
                    <td className="px-3 py-2">{row.sku}</td>
                    <td className="px-3 py-2">{row.brand_id ?? "—"}</td>
                    <td className="px-3 py-2">{row.quantity}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {row.created_at}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-500 text-sm">No tracker entries.</div>
        )}
      </section>
    </div>
  )
}

export const config = defineRouteConfig({})

export default MaxQtyPage
