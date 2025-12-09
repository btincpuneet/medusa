import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useEffect, useState, useCallback } from "react"

/* --------------------------------------------
                    Types
--------------------------------------------- */
type Category = {
  id: number
  name: string
  parent_id: number | null
  magento_category_id: string
  children: Category[]
  level?: number
  status?: string
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

const CategoryModulePage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({})

  /* --------------------------------------------
            Fetch Categories (Memoized)
  --------------------------------------------- */
  const fetchCategories = useCallback(async (query: string = "") => {
    console.log("Searching for:", query)

    setLoading(true)
    setError(null)

    try {
      const url = new URL(`/admin/mp/product/category`, window.location.origin)

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

      setCategories(data.categories || [])
    } catch (err: any) {
      setError(err.message || "Unable to load categories")
    } finally {
      setLoading(false)
    }
  }, [])

  /* --------------------------------------------
            Debounced Search Handler
  --------------------------------------------- */
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      fetchCategories(value)
    }, 350),
    [fetchCategories]
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
    fetchCategories()
  }, [fetchCategories])

  /* --------------------------------------------
               Tree View Functions
  --------------------------------------------- */
  const toggleExpand = (id: number) => {
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const TreeNode: React.FC<{ node: Category; level?: number }> = ({ node, level = 0 }) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes[node.id] || false

    return (
      <div style={{ marginBottom: 4 }}>
        {/* Category Row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          marginLeft: level * 20,
          backgroundColor: level % 2 === 0 ? "#fafafa" : "#ffffff",
          border: "1px solid #f0f0f0",
          borderRadius: 4,
        }}>
          {/* Expand/Collapse Button */}
          <div
            style={{
              width: 20,
              height: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: hasChildren ? "pointer" : "default",
              userSelect: "none",
              fontSize: 12,
              color: "#666",
            }}
            onClick={() => hasChildren && toggleExpand(node.id)}
          >
            {hasChildren ? (isExpanded ? "▾" : "▸") : "•"}
          </div>

          {/* Category Name */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontWeight: 500 }}>{node.name}</span>

 
            {node.status && (
              <span style={{
                fontSize: 12,
                color: node.status === "active" ? "#0a0" : "#a00",
                backgroundColor: node.status === "active" ? "#e6ffe6" : "#ffe6e6",
                padding: "2px 6px",
                borderRadius: 4
              }}>
                {node.status}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => window.location.href = `/app/redington-category-edit/${node.id}`}
              style={editBtn}
            >
              Edit
            </button>
            {/* <button
              onClick={() => handleViewProducts(node.id)}
              style={viewProductsBtn}
            >
              View Products
            </button> */}
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div style={{ marginTop: 4 }}>
            {node.children!.map((child) => (
              <TreeNode key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const handleViewProducts = (categoryId: number) => {
    // Navigate to products page filtered by this category
    window.location.href = `/app/redington-products?category=${categoryId}`
  }

  const expandAll = () => {
    const expandAllNodes = (cats: Category[]): Record<number, boolean> => {
      let expanded: Record<number, boolean> = {}
      cats.forEach(cat => {
        expanded[cat.id] = true
        if (cat.children && cat.children.length > 0) {
          expanded = { ...expanded, ...expandAllNodes(cat.children) }
        }
      })
      return expanded
    }
    setExpandedNodes(expandAllNodes(categories))
  }

  const collapseAll = () => {
    setExpandedNodes({})
  }

  return (
    <div style={pageWrapper}>

      {/* Header */}
      <div style={header}>
        
        {/* LEFT — Title */}
        <h1 style={title}>Categories</h1>

        {/* RIGHT — Back + Add buttons side-by-side */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={backBtn} onClick={() => window.history.back()}>
            ← Back
          </button>

          <button style={addBtn} onClick={() => (window.location.href = "/app/redington-category-add")}>
            + Add Category
          </button>
        </div>
      </div>

      {/* Search and Controls */}
      <div style={controlsWrapper}>
        <div style={searchWrapper}>
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search categories..."
            style={searchInput}
          />
        </div>

        <div style={treeControls}>
          <button style={controlBtn} onClick={expandAll}>
            Expand All
          </button>
          <button style={controlBtn} onClick={collapseAll}>
            Collapse All
          </button>
        </div>
      </div>

      {/* Status */}
      {loading && <p style={loadingText}>Loading categories…</p>}
      {error && <p style={errorText}>{error}</p>}

      {/* Tree View */}
      {!loading && !error && (
        <div style={treeContainer}>
          {categories.length === 0 ? (
            <div style={emptyState}>
              <p>No categories found.</p>
              <button 
                style={addBtn} 
                onClick={() => (window.location.href = "/app/redington-category-add")}
              >
                + Create First Category
              </button>
            </div>
          ) : (
            <div style={treeBox}>
              {categories.map((category) => (
                <TreeNode key={category.id} node={category} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {!loading && !error && categories.length > 0 && (
        <div style={summary}>
          Total Categories: {countCategories(categories)}
        </div>
      )}
    </div>
  )
}

/* --------------------------------------------
               Helper Functions
--------------------------------------------- */
const countCategories = (categories: Category[]): number => {
  let count = 0
  const countRecursive = (cats: Category[]) => {
    cats.forEach(cat => {
      count++
      if (cat.children && cat.children.length > 0) {
        countRecursive(cat.children)
      }
    })
  }
  countRecursive(categories)
  return count
}

/* --------------------------------------------
                 Styles
--------------------------------------------- */

const pageWrapper = {
  padding: "20px",
  margin: "0 auto",
  // maxWidth: "1200px",  
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
}

const controlsWrapper = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
  gap: 20,
}

const searchWrapper = {
  flex: 1,
  maxWidth: "400px",
}

const searchInput = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 8,
  border: "1px solid #dcdcdc",
  fontSize: 16,
  outline: "none",
}

const treeControls = {
  display: "flex",
  gap: 10,
}

const controlBtn = {
  padding: "8px 16px",
  background: "#f8f9fa",
  border: "1px solid #dcdcdc",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 14,
}

const treeContainer = {
  background: "white",
  borderRadius: 10,
  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
  overflow: "hidden",
}

const treeBox = {
  padding: "20px",
  maxHeight: "600px",
  overflowY: "auto" as const,
}

const emptyState = {
  padding: "40px 20px",
  textAlign: "center" as const,
  color: "#666",
}

const loadingText = { 
  fontSize: 16, 
  opacity: 0.7, 
  textAlign: "center" as const,
  padding: "40px" 
}

const errorText = { 
  color: "red", 
  fontSize: 15, 
  textAlign: "center" as const,
  padding: "40px" 
}

const editBtn = {
  padding: "6px 12px",
  fontSize: 12,
  borderRadius: 4,
  border: "1px solid #d0d0d0",
  background: "white",
  cursor: "pointer",
}

const viewProductsBtn = {
  padding: "6px 12px",
  fontSize: 12,
  borderRadius: 4,
  border: "1px solid #1f72ff",
  background: "#e8f4fd",
  color: "#1f72ff",
  cursor: "pointer",
}

const summary = {
  marginTop: 20,
  padding: "12px 16px",
  background: "#f8f9fa",
  borderRadius: 6,
  textAlign: "center" as const,
  color: "#666",
  fontSize: 14,
}

/* Sidebar Label */
export const config = defineRouteConfig({
  label: "Magento Category",
})

export default CategoryModulePage