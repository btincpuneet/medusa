// import { defineRouteConfig } from "@medusajs/admin-sdk"
// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react"

// type SubscriptionCode = {
//   id: number
//   subscription_code: string
//   company_code: string
//   access_id: string
//   first_name: string
//   last_name: string
//   email: string
//   status: boolean
//   created_at: string
//   updated_at: string
// }

// type SubscriptionCodeListResponse = {
//   subscription_codes?: SubscriptionCode[]
//   count?: number
//   limit?: number
//   offset?: number
//   message?: string
// }

// type ImportResponse = {
//   created?: number
//   updated?: number
//   errors?: string[]
// }

// type FormState = {
//   subscription_code: string
//   company_code: string
//   access_id: string
//   first_name: string
//   last_name: string
//   email: string
//   status: boolean
// }

// const emptyForm: FormState = {
//   subscription_code: "",
//   company_code: "",
//   access_id: "",
//   first_name: "",
//   last_name: "",
//   email: "",
//   status: true,
// }

// const formatDateTime = (value: string) => {
//   try {
//     const date = new Date(value)
//     if (Number.isNaN(date.valueOf())) {
//       return value
//     }
//     return date.toLocaleString("en-GB", {
//       year: "numeric",
//       month: "2-digit",
//       day: "2-digit",
//       hour: "2-digit",
//       minute: "2-digit",
//       second: "2-digit",
//     })
//   } catch {
//     return value
//   }
// }

// const statusLabel = (enabled: boolean) => (enabled ? "Enable" : "Disable")

// const RedingtonSubscriptionCodesPage: React.FC = () => {
//   const [codes, setCodes] = useState<SubscriptionCode[]>([])
//   const [count, setCount] = useState(0)
//   const [pageSize, setPageSize] = useState(20)
//   const [page, setPage] = useState(1)
//   const [search, setSearch] = useState("")
//   const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
//     "all"
//   )
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [flash, setFlash] = useState<string | null>(null)
//   const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
//   const [showForm, setShowForm] = useState(false)
//   const [editingId, setEditingId] = useState<number | null>(null)
//   const [form, setForm] = useState<FormState>(emptyForm)
//   const [showImport, setShowImport] = useState(false)
//   const [importing, setImporting] = useState(false)
//   const [importResult, setImportResult] = useState<ImportResponse | null>(null)
//   const [importError, setImportError] = useState<string | null>(null)
//   const fileInputRef = useRef<HTMLInputElement | null>(null)

//   const totalPages = useMemo(() => {
//     return Math.max(1, Math.ceil(count / pageSize) || 1)
//   }, [count, pageSize])

//   const loadCodes = useCallback(async () => {
//     setLoading(true)
//     setError(null)

//     const params = new URLSearchParams()
//     params.set("limit", String(pageSize))
//     params.set("offset", String((page - 1) * pageSize))
//     if (search.trim()) {
//       params.set("q", search.trim())
//     }
//     if (statusFilter !== "all") {
//       params.set("status", statusFilter === "active" ? "true" : "false")
//     }

//     try {
//       const response = await fetch(
//         `/admin/redington/subscription-codes?${params.toString()}`,
//         { credentials: "include" }
//       )
//       const body = (await response
//         .json()
//         .catch(() => ({}))) as SubscriptionCodeListResponse

//       if (!response.ok) {
//         throw new Error(
//           body?.message || `Failed to load subscription codes (${response.status})`
//         )
//       }

//       setCodes(body.subscription_codes || [])
//       setCount(body.count || 0)
//       setSelectedIds(new Set())
//     } catch (err) {
//       const message =
//         err instanceof Error ? err.message : "Unable to load subscription codes."
//       setError(message)
//       setCodes([])
//       setCount(0)
//     } finally {
//       setLoading(false)
//     }
//   }, [page, pageSize, search, statusFilter])

//   useEffect(() => {
//     void loadCodes()
//   }, [loadCodes])

//   const handleSelectAll = (checked: boolean) => {
//     if (checked) {
//       const next = new Set<number>()
//       codes.forEach((code) => next.add(code.id))
//       setSelectedIds(next)
//     } else {
//       setSelectedIds(new Set())
//     }
//   }

//   const handleRowSelect = (id: number, checked: boolean) => {
//     setSelectedIds((prev) => {
//       const next = new Set(prev)
//       if (checked) {
//         next.add(id)
//       } else {
//         next.delete(id)
//       }
//       return next
//     })
//   }

//   const openCreateForm = () => {
//     setForm(emptyForm)
//     setEditingId(null)
//     setShowForm(true)
//     setFlash(null)
//     setError(null)
//   }

//   const openEditForm = (record: SubscriptionCode) => {
//     setForm({
//       subscription_code: record.subscription_code,
//       company_code: record.company_code,
//       access_id: record.access_id,
//       first_name: record.first_name,
//       last_name: record.last_name,
//       email: record.email,
//       status: record.status,
//     })
//     setEditingId(record.id)
//     setShowForm(true)
//     setFlash(null)
//     setError(null)
//   }

//   const closeForm = () => {
//     setShowForm(false)
//     setForm(emptyForm)
//     setEditingId(null)
//   }

//   const handleFormChange = (
//     event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => {
//     const { name, value, type, checked } = event.target
//     setForm((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }))
//   }

//   const handleSave = async (event: React.FormEvent) => {
//     event.preventDefault()
//     setFlash(null)
//     setError(null)

//     const payload = { ...form }
//     const url = editingId
//       ? `/admin/redington/subscription-codes/${editingId}`
//       : "/admin/redington/subscription-codes"
//     const method = editingId ? "PUT" : "POST"

//     try {
//       const response = await fetch(url, {
//         method,
//         credentials: "include",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       })

//       const body = await response.json().catch(() => ({}))

//       if (!response.ok) {
//         throw new Error(body?.message || "Unable to save subscription code.")
//       }

//       setFlash(editingId ? "Subscription code updated." : "Subscription code created.")
//       closeForm()
//       await loadCodes()
//     } catch (err) {
//       const message =
//         err instanceof Error ? err.message : "Unable to save subscription code."
//       setError(message)
//     }
//   }

//   const handleDelete = async (id: number) => {
//     setFlash(null)
//     setError(null)

//     try {
//       const response = await fetch(
//         `/admin/redington/subscription-codes/${id}`,
//         {
//           method: "DELETE",
//           credentials: "include",
//         }
//       )

//       const body = await response.json().catch(() => ({}))

//       if (!response.ok) {
//         throw new Error(body?.message || "Unable to delete subscription code.")
//       }

//       setFlash("Subscription code removed.")
//       await loadCodes()
//     } catch (err) {
//       const message =
//         err instanceof Error ? err.message : "Unable to delete subscription code."
//       setError(message)
//     }
//   }

//   const applyBulkAction = async (action: "enable" | "disable" | "delete") => {
//     if (!selectedIds.size) {
//       setError("Select at least one row to apply an action.")
//       return
//     }

//     setError(null)
//     setFlash(null)

//     try {
//       const response = await fetch(
//         "/admin/redington/subscription-codes/bulk",
//         {
//           method: "POST",
//           credentials: "include",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ action, ids: Array.from(selectedIds) }),
//         }
//       )

//       const body = await response.json().catch(() => ({}))

//       if (!response.ok) {
//         throw new Error(body?.message || "Bulk action failed.")
//       }

//       const label =
//         action === "delete"
//           ? "deleted"
//           : action === "enable"
//           ? "enabled"
//           : "disabled"
//       const countResult = body?.updated ?? body?.deleted ?? selectedIds.size
//       setFlash(`Bulk action applied: ${label} ${countResult} record(s).`)
//       await loadCodes()
//     } catch (err) {
//       const message =
//         err instanceof Error ? err.message : "Bulk action failed."
//       setError(message)
//     }
//   }

//   const handleImportClick = () => {
//     setImportError(null)
//     setImportResult(null)
//     setShowImport(true)
//     setShowForm(false)
//     if (fileInputRef.current) {
//       fileInputRef.current.value = ""
//     }
//   }

//   const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0]
//     if (!file) {
//       return
//     }

//     setImporting(true)
//     setImportError(null)
//     setImportResult(null)

//     try {
//       const csv = await file.text()
//       const response = await fetch(
//         "/admin/redington/subscription-codes/import",
//         {
//           method: "POST",
//           credentials: "include",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ csv }),
//         }
//       )

//       const body = (await response.json().catch(() => ({}))) as ImportResponse

//       if (!response.ok) {
//         throw new Error(
//           (body as any)?.message || "Import failed. Please check the file."
//         )
//       }

//       setImportResult(body)
//       setFlash("Import completed.")
//       await loadCodes()
//     } catch (err) {
//       const message =
//         err instanceof Error ? err.message : "Import failed. Please try again."
//       setImportError(message)
//     } finally {
//       setImporting(false)
//     }
//   }

//   const headerStyle: React.CSSProperties = {
//     background: "#3f3527",
//     color: "#fff",
//     textTransform: "uppercase",
//     letterSpacing: "0.02em",
//   }

//   const zebra = (index: number): React.CSSProperties => ({
//     background: index % 2 === 0 ? "#f7f5f2" : "#fff",
//   })

//   const selectionCount = selectedIds.size

//   return (
//     <div
//       style={{
//         padding: 24,
//         display: "flex",
//         flexDirection: "column",
//         gap: 16,
//         background: "#f4f3ef",
//         minHeight: "100%",
//       }}
//     >
//       <div
//         style={{
//           display: "flex",
//           alignItems: "flex-start",
//           justifyContent: "space-between",
//           gap: 12,
//         }}
//       >
//         <div>
//           <h1 style={{ margin: 0 }}>Add Subscription Code</h1>
//           <p style={{ margin: "6px 0 0", color: "#555" }}>
//             Mirror of the Magento grid with import, bulk actions, and edit support.
//           </p>
//         </div>
//         <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//           <a
//             href="/admin/redington/subscription-codes/sample"
//             style={{
//               padding: "10px 14px",
//               borderRadius: 10,
//               border: "1px solid #d0d5dd",
//               background: "#fff",
//               color: "#0f172a",
//               textDecoration: "none",
//             }}
//           >
//             Download sample CSV
//           </a>
//           <button
//             type="button"
//             onClick={handleImportClick}
//             style={{
//               padding: "10px 14px",
//               borderRadius: 10,
//               border: "1px solid #353028",
//               background: "#ece7df",
//               color: "#20160f",
//               fontWeight: 600,
//             }}
//           >
//             Import Subscription Code
//           </button>
//           <button
//             type="button"
//             onClick={openCreateForm}
//             style={{
//               padding: "10px 16px",
//               borderRadius: 10,
//               border: "none",
//               background: "#e76f1c",
//               color: "#fff",
//               fontWeight: 700,
//               boxShadow: "0 6px 16px rgba(231, 111, 28, 0.35)",
//             }}
//           >
//             Add New Subscription Code
//           </button>
//         </div>
//       </div>

//       <div
//         style={{
//           display: "flex",
//           gap: 12,
//           alignItems: "center",
//           flexWrap: "wrap",
//           background: "#fff",
//           padding: "12px 14px",
//           border: "1px solid #e2e8f0",
//           borderRadius: 12,
//         }}
//       >
//         <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
//           <span style={{ fontWeight: 600 }}>Actions</span>
//           <select
//             onChange={(event) => {
//               const value = event.target.value as
//                 | "enable"
//                 | "disable"
//                 | "delete"
//                 | ""
//               if (value) {
//                 void applyBulkAction(value)
//                 event.target.value = ""
//               }
//             }}
//             defaultValue=""
//             style={{ padding: "8px 10px", borderRadius: 8 }}
//           >
//             <option value="">Select</option>
//             <option value="enable">Enable</option>
//             <option value="disable">Disable</option>
//             <option value="delete">Delete</option>
//           </select>
//           <span style={{ color: "#6b7280", fontSize: 13 }}>
//             {selectionCount} selected
//           </span>
//         </div>
//         <div style={{ flex: 1, display: "flex", gap: 10, alignItems: "center" }}>
//           <input
//             placeholder="Search subscription code, email, or name"
//             value={search}
//             onChange={(event) => {
//               setSearch(event.target.value)
//               setPage(1)
//             }}
//             style={{
//               flex: 1,
//               padding: "8px 12px",
//               borderRadius: 8,
//               border: "1px solid #d0d5dd",
//             }}
//           />
//           <select
//             value={statusFilter}
//             onChange={(event) => {
//               setStatusFilter(event.target.value as "all" | "active" | "inactive")
//               setPage(1)
//             }}
//             style={{ padding: "8px 10px", borderRadius: 8 }}
//           >
//             <option value="all">All status</option>
//             <option value="active">Enable</option>
//             <option value="inactive">Disable</option>
//           </select>
//           <button
//             type="button"
//             onClick={() => void loadCodes()}
//             disabled={loading}
//             style={{
//               padding: "8px 12px",
//               borderRadius: 8,
//               border: "1px solid #d0d5dd",
//               background: "#fafafa",
//             }}
//           >
//             Refresh
//           </button>
//         </div>
//         <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
//           <label style={{ color: "#4b5563", fontSize: 13 }}>Per page</label>
//           <select
//             value={pageSize}
//             onChange={(event) => {
//               setPageSize(Number(event.target.value))
//               setPage(1)
//             }}
//             style={{ padding: "6px 8px", borderRadius: 8 }}
//           >
//             {[10, 20, 50, 100].map((size) => (
//               <option key={size} value={size}>
//                 {size}
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>

//       {error ? (
//         <div
//           style={{
//             background: "#fef2f2",
//             color: "#991b1b",
//             padding: "12px 14px",
//             borderRadius: 12,
//             border: "1px solid #fecdd3",
//           }}
//         >
//           {error}
//         </div>
//       ) : null}

//       {flash ? (
//         <div
//           style={{
//             background: "#ecfdf3",
//             color: "#065f46",
//             padding: "12px 14px",
//             borderRadius: 12,
//             border: "1px solid #bbf7d0",
//           }}
//         >
//           {flash}
//         </div>
//       ) : null}

//       <div
//         style={{
//           overflowX: "auto",
//           borderRadius: 12,
//           border: "1px solid #d4d4d8",
//           boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
//           background: "#fff",
//         }}
//       >
//         <table
//           style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}
//         >
//           <thead style={headerStyle}>
//             <tr>
//               <th style={{ padding: "10px 8px", border: "1px solid #2f2419" }}>
//                 <input
//                   type="checkbox"
//                   aria-label="select all"
//                   checked={
//                     codes.length > 0 && selectedIds.size === codes.length
//                   }
//                   onChange={(event) => handleSelectAll(event.target.checked)}
//                 />
//               </th>
//               {[
//                 "Id",
//                 "Subscription Code",
//                 "Company Code",
//                 "Access Id",
//                 "First Name",
//                 "Last Name",
//                 "Email",
//                 "Created At",
//                 "Status",
//                 "Action",
//               ].map((label) => (
//                 <th
//                   key={label}
//                   style={{
//                     padding: "10px 12px",
//                     textAlign: "left",
//                     border: "1px solid #2f2419",
//                     fontWeight: 700,
//                   }}
//                 >
//                   {label}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr>
//                 <td colSpan={11} style={{ padding: 16, textAlign: "center" }}>
//                   Loading…
//                 </td>
//               </tr>
//             ) : codes.length === 0 ? (
//               <tr>
//                 <td colSpan={11} style={{ padding: 16, textAlign: "center" }}>
//                   No records found.
//                 </td>
//               </tr>
//             ) : (
//               codes.map((record, index) => (
//                 <tr key={record.id} style={zebra(index)}>
//                   <td style={{ padding: "10px 8px", borderRight: "1px solid #e5e7eb" }}>
//                     <input
//                       type="checkbox"
//                       aria-label={`Select ${record.subscription_code}`}
//                       checked={selectedIds.has(record.id)}
//                       onChange={(event) =>
//                         handleRowSelect(record.id, event.target.checked)
//                       }
//                     />
//                   </td>
//                   <td style={{ padding: "10px 12px" }}>{record.id}</td>
//                   <td style={{ padding: "10px 12px", fontWeight: 600 }}>
//                     {record.subscription_code}
//                   </td>
//                   <td style={{ padding: "10px 12px" }}>{record.company_code}</td>
//                   <td style={{ padding: "10px 12px" }}>{record.access_id}</td>
//                   <td style={{ padding: "10px 12px" }}>{record.first_name}</td>
//                   <td style={{ padding: "10px 12px" }}>{record.last_name}</td>
//                   <td style={{ padding: "10px 12px" }}>{record.email}</td>
//                   <td style={{ padding: "10px 12px" }}>
//                     {formatDateTime(record.created_at)}
//                   </td>
//                   <td style={{ padding: "10px 12px" }}>
//                     <span
//                       style={{
//                         display: "inline-flex",
//                         alignItems: "center",
//                         gap: 6,
//                         padding: "4px 10px",
//                         borderRadius: 999,
//                         background: record.status ? "#d1fae5" : "#fee2e2",
//                         color: record.status ? "#047857" : "#b91c1c",
//                         fontWeight: 700,
//                         fontSize: 12,
//                       }}
//                     >
//                       <span
//                         style={{
//                           width: 8,
//                           height: 8,
//                           borderRadius: "50%",
//                           background: record.status ? "#16a34a" : "#ef4444",
//                         }}
//                       />
//                       {statusLabel(record.status)}
//                     </span>
//                   </td>
//                   <td style={{ padding: "10px 12px" }}>
//                     <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
//                       <button
//                         type="button"
//                         onClick={() => openEditForm(record)}
//                         style={{
//                           color: "#1d4ed8",
//                           background: "none",
//                           border: "none",
//                           padding: 0,
//                           cursor: "pointer",
//                         }}
//                       >
//                         Edit
//                       </button>
//                       <span style={{ color: "#9ca3af" }}>|</span>
//                       <button
//                         type="button"
//                         onClick={() => void handleDelete(record.id)}
//                         style={{
//                           color: "#b91c1c",
//                           background: "none",
//                           border: "none",
//                           padding: 0,
//                           cursor: "pointer",
//                         }}
//                       >
//                         Delete
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           gap: 12,
//           justifyContent: "flex-end",
//           color: "#374151",
//         }}
//       >
//         {(() => {
//           const start = count ? (page - 1) * pageSize + 1 : 0
//           const end = count ? Math.min(page * pageSize, count) : 0
//           return (
//             <span style={{ fontSize: 13 }}>
//               Showing {start}-{end} of {count} records
//             </span>
//           )
//         })()}
//         <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
//           <button
//             type="button"
//             onClick={() => setPage((prev) => Math.max(1, prev - 1))}
//             disabled={page === 1}
//             style={{
//               padding: "8px 10px",
//               borderRadius: 8,
//               border: "1px solid #d0d5dd",
//               background: page === 1 ? "#f3f4f6" : "#fff",
//               cursor: page === 1 ? "not-allowed" : "pointer",
//             }}
//           >
//             ←
//           </button>
//           <span style={{ minWidth: 60, textAlign: "center" }}>
//             Page {page} / {totalPages}
//           </span>
//           <button
//             type="button"
//             onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
//             disabled={page >= totalPages}
//             style={{
//               padding: "8px 10px",
//               borderRadius: 8,
//               border: "1px solid #d0d5dd",
//               background: page >= totalPages ? "#f3f4f6" : "#fff",
//               cursor: page >= totalPages ? "not-allowed" : "pointer",
//             }}
//           >
//             →
//           </button>
//         </div>
//       </div>

//       {showForm ? (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             background: "rgba(0,0,0,0.35)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             zIndex: 40,
//           }}
//         >
//           <div
//             style={{
//               width: "min(760px, 90vw)",
//               background: "#fff",
//               borderRadius: 16,
//               padding: 20,
//               boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
//               maxHeight: "90vh",
//               overflowY: "auto",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//                 marginBottom: 12,
//               }}
//             >
//               <h2 style={{ margin: 0 }}>
//                 {editingId ? "Edit Subscription Code" : "Add Subscription Code"}
//               </h2>
//               <button
//                 type="button"
//                 onClick={closeForm}
//                 style={{
//                   background: "none",
//                   border: "none",
//                   fontSize: 18,
//                   cursor: "pointer",
//                 }}
//               >
//                 ✕
//               </button>
//             </div>

//             <form
//               onSubmit={handleSave}
//               style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}
//             >
//               {[
//                 { name: "subscription_code", label: "Subscription Code" },
//                 { name: "company_code", label: "Company Code" },
//                 { name: "access_id", label: "Access Id" },
//                 { name: "first_name", label: "First Name" },
//                 { name: "last_name", label: "Last Name" },
//                 { name: "email", label: "Email", type: "email" },
//               ].map((field) => (
//                 <label
//                   key={field.name}
//                   style={{ display: "flex", flexDirection: "column", gap: 6 }}
//                 >
//                   <span style={{ fontWeight: 600 }}>{field.label}</span>
//                   <input
//                     required
//                     name={field.name}
//                     type={field.type || "text"}
//                     value={(form as any)[field.name]}
//                     onChange={handleFormChange}
//                     style={{
//                       padding: "10px 12px",
//                       borderRadius: 10,
//                       border: "1px solid #d0d5dd",
//                     }}
//                   />
//                 </label>
//               ))}

//               <label
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 10,
//                   gridColumn: "1 / -1",
//                   marginTop: 6,
//                 }}
//               >
//                 <input
//                   type="checkbox"
//                   name="status"
//                   checked={form.status}
//                   onChange={handleFormChange}
//                 />
//                 <span style={{ fontWeight: 600 }}>
//                   Status ({form.status ? "Enable" : "Disable"})
//                 </span>
//               </label>

//               <div
//                 style={{
//                   display: "flex",
//                   gap: 10,
//                   gridColumn: "1 / -1",
//                   marginTop: 8,
//                 }}
//               >
//                 <button
//                   type="submit"
//                   style={{
//                     padding: "10px 14px",
//                     border: "none",
//                     borderRadius: 10,
//                     background: "#e76f1c",
//                     color: "#fff",
//                     fontWeight: 700,
//                   }}
//                 >
//                   {editingId ? "Update" : "Create"}
//                 </button>
//                 <button
//                   type="button"
//                   onClick={closeForm}
//                   style={{
//                     padding: "10px 14px",
//                     borderRadius: 10,
//                     border: "1px solid #d0d5dd",
//                     background: "#fff",
//                   }}
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       ) : null}

//       {showImport ? (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             background: "rgba(0,0,0,0.3)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             zIndex: 40,
//           }}
//         >
//           <div
//             style={{
//               width: "min(640px, 90vw)",
//               background: "#fff",
//               borderRadius: 16,
//               padding: 20,
//               boxShadow: "0 18px 40px rgba(0,0,0,0.2)",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//               }}
//             >
//               <h2 style={{ margin: 0 }}>Import Subscription Codes</h2>
//               <button
//                 type="button"
//                 onClick={() => setShowImport(false)}
//                 style={{
//                   background: "none",
//                   border: "none",
//                   fontSize: 18,
//                   cursor: "pointer",
//                 }}
//               >
//                 ✕
//               </button>
//             </div>
//             <p style={{ color: "#4b5563", margin: "8px 0 12px" }}>
//               Upload a CSV with columns: Subscription Code, Access Id, Company Code,
//               First Name, Last Name, Email, Status. Status defaults to 1 (enable).
//             </p>
//             <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 accept=".csv,text/csv"
//                 onChange={handleImportFile}
//               />
//               {importing ? <span>Uploading…</span> : null}
//             </div>
//             {importError ? (
//               <div
//                 style={{
//                   marginTop: 12,
//                   background: "#fef2f2",
//                   color: "#991b1b",
//                   padding: "10px 12px",
//                   borderRadius: 10,
//                   border: "1px solid #fecdd3",
//                 }}
//               >
//                 {importError}
//               </div>
//             ) : null}
//             {importResult ? (
//               <div
//                 style={{
//                   marginTop: 12,
//                   background: "#ecfdf3",
//                   color: "#065f46",
//                   padding: "10px 12px",
//                   borderRadius: 10,
//                   border: "1px solid #bbf7d0",
//                   display: "flex",
//                   flexDirection: "column",
//                   gap: 6,
//                 }}
//               >
//                 <div>
//                   Created: {importResult.created ?? 0} | Updated:{" "}
//                   {importResult.updated ?? 0}
//                 </div>
//                 {importResult.errors?.length ? (
//                   <details>
//                     <summary style={{ cursor: "pointer" }}>
//                       View {importResult.errors.length} error(s)
//                     </summary>
//                     <ul style={{ marginTop: 6 }}>
//                       {importResult.errors.map((err, idx) => (
//                         <li key={idx}>{err}</li>
//                       ))}
//                     </ul>
//                   </details>
//                 ) : (
//                   <div>No errors</div>
//                 )}
//               </div>
//             ) : null}
//           </div>
//         </div>
//       ) : null}
//     </div>
//   )
// }

// export const config = defineRouteConfig({
//   label: "Subscription Codes",
// })

// export default RedingtonSubscriptionCodesPage
