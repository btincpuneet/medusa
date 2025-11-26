// import { defineRouteConfig } from "@medusajs/admin-sdk"
// import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

// type CustomerNumber = {
//   id: number
//   company_code: string
//   distribution_channel: string
//   brand_id: string
//   domain_id: number
//   customer_number: string
//   created_at: string
// }

// type CustomerNumberResponse = {
//   customer_numbers?: CustomerNumber[]
//   customer_number?: CustomerNumber
//   message?: string
// }

// type DomainOption = {
//   id: number
//   domain_name: string
// }

// type DomainsResponse = {
//   domains?: DomainOption[]
// }

// type CompanyCodeOption = {
//   id: number
//   country_code: string
//   company_code: string
//   status: boolean
// }

// type CompanyCodesResponse = {
//   company_codes?: CompanyCodeOption[]
// }

// type BrandOption = {
//   value: string
//   label: string
//   path?: string[]
// }

// type BrandOptionsResponse = {
//   brands?: BrandOption[]
// }

// type FormState = {
//   company_code: string
//   distribution_channel: string
//   brand_id: string
//   domain_id: string
//   customer_number: string
// }

// const initialForm: FormState = {
//   company_code: "",
//   distribution_channel: "",
//   brand_id: "",
//   domain_id: "",
//   customer_number: "",
// }

// const RedingtonCustomerNumbersPage: React.FC = () => {
//   const [entries, setEntries] = useState<CustomerNumber[]>([])
//   const [domains, setDomains] = useState<DomainOption[]>([])
//   const [companyCodes, setCompanyCodes] = useState<CompanyCodeOption[]>([])
//   const [brands, setBrands] = useState<BrandOption[]>([])
//   const [form, setForm] = useState<FormState>(initialForm)
//   const [editingId, setEditingId] = useState<number | null>(null)
//   const [isLoading, setIsLoading] = useState(false)
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [flash, setFlash] = useState<string | null>(null)
//   const [showForm, setShowForm] = useState(false)
//   const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

//   const sortedEntries = useMemo(() => {
//     return [...entries].sort((a, b) => a.id - b.id)
//   }, [entries])

//   const brandLabel = useCallback(
//     (id: string) => {
//       const option = brands.find((b) => b.value === id)
//       if (!option) return id || "-"
//       return option.path && option.path.length > 1 ? option.path.join(" › ") : option.label
//     },
//     [brands]
//   )

//   const domainLabel = useCallback(
//     (domainId: number) => {
//       const match = domains.find((domain) => domain.id === domainId)
//       return match ? match.domain_name : `Domain #${domainId}`
//     },
//     [domains]
//   )

//   const loadEntries = useCallback(async () => {
//     setIsLoading(true)
//     setError(null)
//     setFlash(null)

//     try {
//       const response = await fetch("/admin/redington/customer-numbers", {
//         credentials: "include",
//       })

//       if (!response.ok) {
//         const body = (await response.json().catch(() => ({}))) as CustomerNumberResponse
//         throw new Error(
//           body?.message || `Failed to load customer numbers (${response.status})`
//         )
//       }

//       const body = (await response.json()) as CustomerNumberResponse
//       setEntries(body.customer_numbers ?? [])
//       setSelectedIds(new Set())
//     } catch (err) {
//       const message =
//         err instanceof Error ? err.message : "Unable to load customer numbers."
//       setError(message)
//       setEntries([])
//     } finally {
//       setIsLoading(false)
//     }
//   }, [])

//   const loadOptions = useCallback(async () => {
//     try {
//       const [domainsRes, companyRes, brandsRes] = await Promise.all([
//         fetch("/admin/redington/domains", {
//           credentials: "include",
//         }),
//         fetch("/admin/redington/company-codes", {
//           credentials: "include",
//         }),
//         fetch("/admin/redington/brand-options", {
//           credentials: "include",
//         }),
//       ])

//       if (domainsRes.ok) {
//         const body = (await domainsRes.json()) as DomainsResponse
//         setDomains(body.domains ?? [])
//       }

//       if (companyRes.ok) {
//         const body = (await companyRes.json()) as CompanyCodesResponse
//         setCompanyCodes(body.company_codes ?? [])
//       }

//       if (brandsRes.ok) {
//         const body = (await brandsRes.json()) as BrandOptionsResponse
//         setBrands(body.brands ?? [])
//       }
//     } catch {
//       // handled in UI elsewhere when missing
//     }
//   }, [])

//   useEffect(() => {
//     void loadEntries()
//     void loadOptions()
//   }, [loadEntries, loadOptions])

//   const resetForm = () => {
//     setForm(initialForm)
//     setEditingId(null)
//     setError(null)
//   }

//   const handleChange = (
//     event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => {
//     const { name, value } = event.target
//     setForm((prev) => ({
//       ...prev,
//       [name]: value,
//     }))
//   }

//   const handleSubmit = async (event: React.FormEvent) => {
//     event.preventDefault()

//     const companyCode = form.company_code.trim()
//     const distribution = form.distribution_channel.trim()
//     const brandId = form.brand_id.trim()
//     const domainIdRaw = form.domain_id.trim()
//     const customerNumber = form.customer_number.trim()

//     if (!companyCode || !distribution || !brandId || !domainIdRaw || !customerNumber) {
//       setError("All fields are required.")
//       return
//     }

//     const domainId = Number.parseInt(domainIdRaw, 10)
//     if (!Number.isFinite(domainId)) {
//       setError("Domain selection is invalid.")
//       return
//     }

//     const payload = {
//       company_code: companyCode,
//       distribution_channel: distribution,
//       brand_id: brandId,
//       domain_id: domainId,
//       customer_number: customerNumber,
//     }

//     setIsSubmitting(true)
//     setError(null)
//     setFlash(null)

//     const isEdit = editingId !== null
//     const url = isEdit
//       ? `/admin/redington/customer-numbers/${editingId}`
//       : "/admin/redington/customer-numbers"

//     try {
//       const response = await fetch(url, {
//         method: isEdit ? "PUT" : "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify(payload),
//       })

//       const body = (await response.json().catch(() => ({}))) as CustomerNumberResponse

//       if (!response.ok) {
//         throw new Error(
//           body?.message ||
//             (isEdit
//               ? "Failed to update customer number."
//               : "Failed to create customer number.")
//         )
//       }

//       setFlash(isEdit ? "Customer number updated." : "Customer number created.")
//       resetForm()
//       setShowForm(false)
//       await loadEntries()
//     } catch (err) {
//       const message =
//         err instanceof Error
//           ? err.message
//           : isEdit
//           ? "Unable to update customer number."
//           : "Unable to create customer number."
//       setError(message)
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const handleEdit = (entry: CustomerNumber) => {
//     setForm({
//       company_code: entry.company_code,
//       distribution_channel: entry.distribution_channel,
//       brand_id: entry.brand_id || "",
//       domain_id: entry.domain_id ? String(entry.domain_id) : "",
//       customer_number: entry.customer_number,
//     })
//     setEditingId(entry.id)
//     setShowForm(true)
//     setError(null)
//     setFlash(null)
//   }

//   const handleDelete = async (entry: CustomerNumber) => {
//     if (!window.confirm(`Delete customer number ${entry.customer_number}?`)) {
//       return
//     }

//     setError(null)
//     setFlash(null)

//     try {
//       const response = await fetch(
//         `/admin/redington/customer-numbers/${entry.id}`,
//         {
//           method: "DELETE",
//           credentials: "include",
//         }
//       )

//       if (!response.ok && response.status !== 204) {
//         const body = (await response.json().catch(() => ({}))) as CustomerNumberResponse
//         throw new Error(
//           body?.message ||
//             `Failed to delete customer number (${response.status})`
//         )
//       }

//       await loadEntries()
//       setFlash("Customer number deleted.")
//     } catch (err) {
//       const message =
//         err instanceof Error
//           ? err.message
//           : "Unable to delete customer number."
//       setError(message)
//     }
//   }

//   const openCreate = () => {
//     resetForm()
//     setShowForm(true)
//   }

//   const toggleAll = (checked: boolean) => {
//     if (checked) {
//       setSelectedIds(new Set(entries.map((e) => e.id)))
//     } else {
//       setSelectedIds(new Set())
//     }
//   }

//   const toggleRow = (id: number, checked: boolean) => {
//     setSelectedIds((prev) => {
//       const next = new Set(prev)
//       if (checked) next.add(id)
//       else next.delete(id)
//       return next
//     })
//   }

//   const handleBulkDelete = async () => {
//     if (!selectedIds.size) {
//       setError("Select at least one row to delete.")
//       return
//     }
//     if (!window.confirm("Delete selected customer numbers?")) {
//       return
//     }

//     setError(null)
//     setFlash(null)

//     for (const id of selectedIds) {
//       await fetch(`/admin/redington/customer-numbers/${id}`, {
//         method: "DELETE",
//         credentials: "include",
//       }).catch(() => {})
//     }
//     await loadEntries()
//     setFlash("Selected customer numbers deleted.")
//   }

//   return (
//     <div
//       style={{
//         padding: 24,
//         display: "flex",
//         flexDirection: "column",
//         gap: 16,
//         background: "#f5f4f1",
//         minHeight: "100%",
//       }}
//     >
//       <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//         <div>
//           <h1 style={{ margin: 0 }}>Customer Number</h1>
//           <p style={{ margin: "6px 0 0", color: "#4b5563" }}>
//             Manage customer number mappings with add/edit modal and bulk actions.
//           </p>
//         </div>
//         <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
//           <button
//             type="button"
//             onClick={() => {
//               loadOptions()
//               loadEntries()
//             }}
//             disabled={isLoading}
//             style={{
//               padding: "10px 14px",
//               borderRadius: 10,
//               border: "1px solid #d0d5dd",
//               background: "#fff",
//               color: "#0f172a",
//             }}
//           >
//             Refresh
//           </button>
//           <button
//             type="button"
//             onClick={openCreate}
//             style={{
//               padding: "10px 16px",
//               borderRadius: 10,
//               border: "none",
//               background: "#f2611a",
//               color: "#fff",
//               fontWeight: 700,
//               boxShadow: "0 6px 16px rgba(242, 97, 26, 0.35)",
//             }}
//           >
//             Add New Customer Number Rule
//           </button>
//         </div>
//       </div>

//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           gap: 12,
//           flexWrap: "wrap",
//           padding: "10px 12px",
//           borderRadius: 10,
//           border: "1px solid #e5e7eb",
//           background: "#fafafa",
//         }}
//       >
//         <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
//           <label style={{ fontWeight: 600 }}>Actions</label>
//           <select
//             onChange={(event) => {
//               if (event.target.value === "delete") {
//                 void handleBulkDelete()
//               }
//               event.target.value = ""
//             }}
//             defaultValue=""
//             style={{ padding: "8px 10px", borderRadius: 8 }}
//           >
//             <option value="">Select</option>
//             <option value="delete">Delete</option>
//           </select>
//           <span style={{ color: "#6b7280", fontSize: 13 }}>
//             {selectedIds.size} selected
//           </span>
//         </div>
//         <div style={{ color: "#4b5563", fontSize: 13 }}>
//           {sortedEntries.length} records found
//         </div>
//       </div>

//       {error && (
//         <div
//           style={{
//             background: "#fef2f2",
//             color: "#991b1b",
//             padding: "12px",
//             borderRadius: "10px",
//             border: "1px solid #fecdd3",
//           }}
//         >
//           {error}
//         </div>
//       )}

//       {flash && (
//         <div
//           style={{
//             background: "#ecfdf3",
//             color: "#065f46",
//             padding: "12px",
//             borderRadius: "10px",
//             border: "1px solid #bbf7d0",
//           }}
//         >
//           {flash}
//         </div>
//       )}

//       <div
//         style={{
//           overflowX: "auto",
//           border: "1px solid #e5e5e5",
//           borderRadius: "10px",
//           boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
//           background: "#fff",
//         }}
//       >
//         <table style={{ width: "100%", borderCollapse: "collapse" }}>
//           <thead style={{ background: "#f8f6f4" }}>
//             <tr>
//               <th style={{ ...headerCellStyle, width: 40 }}>
//                 <input
//                   type="checkbox"
//                   aria-label="select all"
//                   checked={
//                     sortedEntries.length > 0 &&
//                     selectedIds.size === sortedEntries.length
//                   }
//                   onChange={(event) => toggleAll(event.target.checked)}
//                 />
//               </th>
//               <th style={headerCellStyle}>Id</th>
//               <th style={headerCellStyle}>Company Code</th>
//               <th style={headerCellStyle}>Distribution Channel</th>
//               <th style={headerCellStyle}>Brand ID</th>
//               <th style={headerCellStyle}>Domain ID</th>
//               <th style={headerCellStyle}>Customer Number</th>
//               <th style={headerCellStyle}>Created At</th>
//               <th style={headerCellStyle}>Action</th>
//             </tr>
//           </thead>
//           <tbody>
//             {isLoading ? (
//               <tr>
//                 <td colSpan={9} style={cellStyle}>
//                   Loading customer numbers...
//                 </td>
//               </tr>
//             ) : sortedEntries.length === 0 ? (
//               <tr>
//                 <td colSpan={9} style={cellStyle}>
//                   No customer numbers found.
//                 </td>
//               </tr>
//             ) : (
//               sortedEntries.map((entry, idx) => (
//                 <tr
//                   key={entry.id}
//                   style={{
//                     background: idx % 2 === 0 ? "#fff" : "#faf7f2",
//                   }}
//                 >
//                   <td style={{ ...cellStyle, width: 40 }}>
//                     <input
//                       type="checkbox"
//                       aria-label={`select ${entry.id}`}
//                       checked={selectedIds.has(entry.id)}
//                       onChange={(event) => toggleRow(entry.id, event.target.checked)}
//                     />
//                   </td>
//                   <td style={cellStyle}>{entry.id}</td>
//                   <td style={cellStyle}>{entry.company_code}</td>
//                   <td style={cellStyle}>{entry.distribution_channel}</td>
//                   <td style={cellStyle}>{brandLabel(entry.brand_id)}</td>
//                   <td style={cellStyle}>{domainLabel(entry.domain_id)}</td>
//                   <td style={cellStyle}>{entry.customer_number}</td>
//                   <td style={cellStyle}>{formatDate(entry.created_at)}</td>
//                   <td style={{ ...cellStyle, display: "flex", gap: "8px" }}>
//                     <button
//                       onClick={() => handleEdit(entry)}
//                       style={{
//                         color: "#1d4ed8",
//                         background: "none",
//                         border: "none",
//                         padding: 0,
//                         cursor: "pointer",
//                         fontWeight: 600,
//                       }}
//                     >
//                       Edit
//                     </button>
//                     <button
//                       onClick={() => handleDelete(entry)}
//                       style={{
//                         color: "#b91c1c",
//                         background: "none",
//                         border: "none",
//                         padding: 0,
//                         cursor: "pointer",
//                         fontWeight: 600,
//                       }}
//                     >
//                       Delete
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
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
//             padding: 16,
//           }}
//         >
//           <div
//             style={{
//               width: "min(960px, 95vw)",
//               background: "#fff",
//               borderRadius: 14,
//               boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
//               overflow: "hidden",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 padding: "14px 16px",
//                 borderBottom: "1px solid #e5e7eb",
//                 background: "#f8f6f4",
//               }}
//             >
//               <div>
//                 <div style={{ fontSize: 18, fontWeight: 700 }}>
//                   {editingId ? "Edit Customer Number" : "Add Customer Number"}
//                 </div>
//                 <div style={{ color: "#6b7280", fontSize: 13, marginTop: 2 }}>
//                   Customer Number Mapping
//                 </div>
//               </div>
//               <div style={{ display: "flex", gap: 10 }}>
//                 <button
//                   type="button"
//                   onClick={() => {
//                     resetForm()
//                     setShowForm(false)
//                   }}
//                   style={{
//                     border: "none",
//                     background: "none",
//                     color: "#374151",
//                     padding: "8px 10px",
//                     borderRadius: 8,
//                     cursor: "pointer",
//                   }}
//                 >
//                   Back
//                 </button>
//                 <button
//                   type="button"
//                   onClick={resetForm}
//                   style={{
//                     border: "1px solid #d1d5db",
//                     background: "#fff",
//                     color: "#111827",
//                     padding: "8px 12px",
//                     borderRadius: 8,
//                     cursor: "pointer",
//                   }}
//                 >
//                   Reset
//                 </button>
//                 <button
//                   type="submit"
//                   form="customer-number-form"
//                   style={{
//                     border: "none",
//                     background: "#f2611a",
//                     color: "#fff",
//                     padding: "8px 14px",
//                     borderRadius: 10,
//                     fontWeight: 700,
//                     boxShadow: "0 6px 16px rgba(242, 97, 26, 0.3)",
//                   }}
//                   disabled={isSubmitting}
//                 >
//                   {isSubmitting ? "Saving..." : "Save"}
//                 </button>
//               </div>
//             </div>

//             <form
//               id="customer-number-form"
//               onSubmit={handleSubmit}
//               style={{
//                 padding: "20px",
//                 display: "grid",
//                 gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
//                 gap: "14px",
//               }}
//             >
//               <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
//                 <span style={{ fontWeight: 600 }}>
//                   Company Code <span style={{ color: "#e11d48" }}>*</span>
//                 </span>
//                 <select
//                   name="company_code"
//                   value={form.company_code}
//                   onChange={handleChange}
//                   required
//                   style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
//                 >
//                   <option value="">-- Please Select --</option>
//                   {companyCodes.map((company) => (
//                     <option key={company.id} value={company.company_code}>
//                       {company.company_code} ({company.country_code})
//                     </option>
//                   ))}
//                 </select>
//               </label>

//               <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
//                 <span style={{ fontWeight: 600 }}>
//                   Distribution Channel <span style={{ color: "#e11d48" }}>*</span>
//                 </span>
//                 <input
//                   name="distribution_channel"
//                   value={form.distribution_channel}
//                   onChange={handleChange}
//                   required
//                   style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
//                 />
//               </label>

//               <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
//                 <span style={{ fontWeight: 600 }}>
//                   Customer Number <span style={{ color: "#e11d48" }}>*</span>
//                 </span>
//                 <input
//                   name="customer_number"
//                   value={form.customer_number}
//                   onChange={handleChange}
//                   required
//                   style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
//                 />
//               </label>

//               <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
//                 <span style={{ fontWeight: 600 }}>
//                   Brand <span style={{ color: "#e11d48" }}>*</span>
//                 </span>
//                 <select
//                   name="brand_id"
//                   value={form.brand_id}
//                   onChange={handleChange}
//                   required
//                   style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
//                 >
//                   <option value="">-- Please Select --</option>
//                   {brands.map((brand) => (
//                     <option key={brand.value} value={brand.value}>
//                       {brand.path && brand.path.length > 1
//                         ? brand.path.join(" › ")
//                         : brand.label}
//                     </option>
//                   ))}
//                 </select>
//               </label>

//               <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
//                 <span style={{ fontWeight: 600 }}>
//                   Domain <span style={{ color: "#e11d48" }}>*</span>
//                 </span>
//                 <select
//                   name="domain_id"
//                   value={form.domain_id}
//                   onChange={handleChange}
//                   required
//                   style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
//                 >
//                   <option value="">-- Please Select --</option>
//                   {domains.map((domain) => (
//                     <option key={domain.id} value={domain.id}>
//                       {domain.domain_name}
//                     </option>
//                   ))}
//                 </select>
//               </label>
//             </form>
//           </div>
//         </div>
//       ) : null}
//     </div>
//   )
// }

// const headerCellStyle: React.CSSProperties = {
//   textAlign: "left",
//   padding: "12px",
//   fontWeight: 700,
//   borderBottom: "1px solid #e5e5e5",
// }

// const cellStyle: React.CSSProperties = {
//   padding: "12px",
//   borderBottom: "1px solid #f0f0f0",
//   verticalAlign: "middle",
// }

// function formatDate(value?: string) {
//   if (!value) return "-"
//   const date = new Date(value)
//   if (Number.isNaN(date.getTime())) return value
//   return new Intl.DateTimeFormat(undefined, {
//     year: "numeric",
//     month: "short",
//     day: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   }).format(date)
// }

// export const config = defineRouteConfig({
//   label: "Customer Numbers",
// })

// export default RedingtonCustomerNumbersPage
