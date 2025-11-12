import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useCallback, useEffect, useMemo, useState } from "react"

type ImportSummary = {
  id: number
  file_name: string
  status: string
  notes: string | null
  total_rows: number
  success_rows: number
  failed_rows: number
  created_at: string
  updated_at: string
}

type ImportListResponse = {
  imports?: ImportSummary[]
  count?: number
  limit?: number
  offset?: number
  message?: string
}

type ImportDetail = ImportSummary & {
  log: Array<{
    sku: string
    status: string
    message?: string
    source?: string
  }> | null
}

type ImportDetailResponse = {
  import?: ImportDetail
  message?: string
}

type UploadResponse = {
  import_id: number
  summary: {
    total: number
    updated: number
    skipped: number
    failed: number
  }
  results: Array<{
    sku: string
    status: string
    message?: string
    source?: string
  }>
  message?: string
}

const formatDate = (value: string) => {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

const readFileAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === "string") {
        const base64 = result.split(",").pop() || ""
        resolve(base64)
      } else {
        reject(new Error("Unable to process file."))
      }
    }
    reader.onerror = () => reject(reader.error || new Error("File read error."))
    reader.readAsDataURL(file)
  })

const ProductDescPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [notes, setNotes] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)

  const [imports, setImports] = useState<ImportSummary[]>([])
  const [importsCount, setImportsCount] = useState(0)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [selectedImportId, setSelectedImportId] = useState<number | null>(null)
  const [detail, setDetail] = useState<ImportDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const fetchJson = useCallback(
    async (url: string, init?: RequestInit) => {
      const response = await fetch(url, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        ...init,
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        const message =
          body?.message ||
          `Request failed with status ${response.status.toString()}`
        throw new Error(message)
      }

      return response.json().catch(() => ({}))
    },
    []
  )

  const loadImports = useCallback(async () => {
    setListLoading(true)
    setListError(null)
    try {
      const data = (await fetchJson(
        "/admin/redington/product-desc/imports?limit=20"
      )) as ImportListResponse
      setImports(data.imports ?? [])
      setImportsCount(data.count ?? (data.imports?.length ?? 0))
      setSelectedImportId((current) => {
        if (current && data.imports?.some((log) => log.id === current)) {
          return current
        }
        return data.imports?.[0]?.id ?? null
      })
    } catch (error: any) {
      setListError(error.message || "Unable to load import logs.")
      setImports([])
      setImportsCount(0)
      setSelectedImportId(null)
    } finally {
      setListLoading(false)
    }
  }, [fetchJson])

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
          `/admin/redington/product-desc/imports/${id}`
        )) as ImportDetailResponse
        if (!data.import) {
          throw new Error(data.message || "Log not found.")
        }
        setDetail(data.import)
      } catch (error: any) {
        setDetail(null)
        setDetailError(error.message || "Unable to load log details.")
      } finally {
        setDetailLoading(false)
      }
    },
    [fetchJson]
  )

  useEffect(() => {
    loadImports()
  }, [loadImports])

  useEffect(() => {
    loadDetail(selectedImportId)
  }, [selectedImportId, loadDetail])

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault()
    setUploadResult(null)
    setUploadError(null)

    if (!selectedFile) {
      setUploadError("Please select a ZIP or CSV file to upload.")
      return
    }

    const allowed =
      selectedFile.name.toLowerCase().endsWith(".zip") ||
      selectedFile.name.toLowerCase().endsWith(".csv")
    if (!allowed) {
      setUploadError("Only .zip or .csv files are supported.")
      return
    }

    setUploading(true)
    try {
      const content = await readFileAsBase64(selectedFile)
      const data = (await fetchJson(
        "/admin/redington/product-desc/imports",
        {
          method: "POST",
          body: JSON.stringify({
            filename: selectedFile.name,
            content,
            notes: notes.trim() || undefined,
          }),
        }
      )) as UploadResponse

      setUploadResult(data)
      setSelectedFile(null)
      setNotes("")
      await loadImports()
    } catch (error: any) {
      setUploadError(error.message || "Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const summaryRows = useMemo(() => {
    if (!detail?.log?.length) {
      return []
    }
    return detail.log.slice(0, 200)
  }, [detail])

  return (
    <div style={{ padding: "24px 16px 64px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Product Description Import</h1>
        <p style={{ color: "#5f6c7b", marginTop: 8, maxWidth: 720 }}>
          Upload the Magento-style ZIP bundle (or a single CSV) to bulk update
          product descriptions. Each row should include <code>sku</code> and{" "}
          <code>description</code>. Results are logged so support can audit past
          imports.
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
        <form onSubmit={handleUpload}>
          <h2 style={{ marginTop: 0 }}>Upload ZIP/CSV</h2>
          <div style={{ marginBottom: 12 }}>
            <input
              type="file"
              accept=".zip,.csv"
              onChange={(event) => {
                const file = event.target.files?.[0]
                setSelectedFile(file || null)
                setUploadError(null)
              }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="notes"
              style={{ display: "block", fontWeight: 500, marginBottom: 4 }}
            >
              Notes (optional)
            </label>
            <input
              id="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="e.g. November marketing copy refresh"
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
              }}
            />
          </div>
          {uploadError && (
            <div
              style={{
                padding: 10,
                borderRadius: 6,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                marginBottom: 12,
              }}
            >
              {uploadError}
            </div>
          )}
          <button
            type="submit"
            disabled={uploading}
            style={{
              border: "none",
              borderRadius: 6,
              padding: "10px 16px",
              background: uploading ? "#9ca3af" : "#111827",
              color: "#fff",
              cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? "Uploading…" : "Start Import"}
          </button>
        </form>
        {uploadResult && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ marginTop: 0 }}>Latest upload summary</h3>
            <p style={{ marginBottom: 8, color: "#374151" }}>
              Updated {uploadResult.summary.updated} /{" "}
              {uploadResult.summary.total} rows (Skipped{" "}
              {uploadResult.summary.skipped}, Failed{" "}
              {uploadResult.summary.failed}).
            </p>
            <div style={{ maxHeight: 220, overflowY: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#f9fafb",
                      textAlign: "left",
                    }}
                  >
                    <th style={{ padding: "8px 12px" }}>SKU</th>
                    <th style={{ padding: "8px 12px" }}>Status</th>
                    <th style={{ padding: "8px 12px" }}>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadResult.results.slice(0, 50).map((row, index) => (
                    <tr key={`${row.sku}-${index}`}>
                      <td
                        style={{
                          padding: "8px 12px",
                          fontFamily: "SFMono-Regular, monospace",
                        }}
                      >
                        {row.sku}
                      </td>
                      <td style={{ padding: "8px 12px" }}>{row.status}</td>
                      <td style={{ padding: "8px 12px", color: "#6b7280" }}>
                        {row.message || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
          <h2 style={{ margin: 0 }}>Import History</h2>
          <button
            type="button"
            onClick={loadImports}
            disabled={listLoading}
            style={{
              border: "1px solid #d1d5db",
              background: listLoading ? "#f3f4f6" : "#fff",
              padding: "6px 12px",
              borderRadius: 6,
              cursor: listLoading ? "not-allowed" : "pointer",
            }}
          >
            {listLoading ? "Refreshing…" : "Refresh"}
          </button>
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
                <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                  {[
                    "Created",
                    "File",
                    "Status",
                    "Totals",
                    "Notes",
                  ].map((label) => (
                    <th
                      key={label}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #e5e7eb",
                        color: "#4b5563",
                        fontWeight: 600,
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
                      colSpan={5}
                      style={{
                        padding: 16,
                        textAlign: "center",
                        color: "#6b7280",
                      }}
                    >
                      Loading…
                    </td>
                  </tr>
                )}
                {!listLoading && imports.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: 16,
                        textAlign: "center",
                        color: "#6b7280",
                      }}
                    >
                      No imports yet. Upload a file above to get started.
                    </td>
                  </tr>
                )}
                {!listLoading &&
                  imports.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedImportId(log.id)}
                      style={{
                        cursor: "pointer",
                        background:
                          log.id === selectedImportId ? "#eff6ff" : "#fff",
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      <td style={{ padding: "10px 16px" }}>
                        {formatDate(log.created_at)}
                      </td>
                      <td style={{ padding: "10px 16px" }}>{log.file_name}</td>
                      <td style={{ padding: "10px 16px" }}>{log.status}</td>
                      <td style={{ padding: "10px 16px" }}>
                        {log.success_rows}/{log.total_rows} updated (
                        {log.failed_rows} failed)
                      </td>
                      <td style={{ padding: "10px 16px", color: "#6b7280" }}>
                        {log.notes || "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: "12px 20px", color: "#6b7280", fontSize: 13 }}>
          Total imports recorded: {importsCount}
        </div>
      </section>

      <section
        style={{
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
          padding: 20,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Import Details</h2>
        {detailError && (
          <div
            style={{
              padding: 12,
              borderRadius: 6,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              marginBottom: 12,
            }}
          >
            {detailError}
          </div>
        )}
        {detailLoading && <div style={{ color: "#6b7280" }}>Loading…</div>}
        {!detailLoading && !detail && (
          <p style={{ color: "#6b7280" }}>
            Select an import from the history table to inspect its logs.
          </p>
        )}
        {detail && (
          <>
            <p style={{ marginBottom: 12, color: "#374151" }}>
              <strong>File:</strong> {detail.file_name} •{" "}
              <strong>Status:</strong> {detail.status} •{" "}
              <strong>Updated:</strong> {formatDate(detail.updated_at)}
            </p>
            <div style={{ overflowX: "auto", maxHeight: 360 }}>
              {summaryRows.length === 0 ? (
                <p style={{ color: "#6b7280" }}>No row-level logs recorded.</p>
              ) : (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                      <th style={{ padding: "8px 12px" }}>SKU</th>
                      <th style={{ padding: "8px 12px" }}>Status</th>
                      <th style={{ padding: "8px 12px" }}>Message</th>
                      <th style={{ padding: "8px 12px" }}>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryRows.map((row, index) => (
                      <tr key={`${row.sku}-${index}`}>
                        <td
                          style={{
                            padding: "8px 12px",
                            fontFamily: "SFMono-Regular, monospace",
                          }}
                        >
                          {row.sku}
                        </td>
                        <td style={{ padding: "8px 12px" }}>{row.status}</td>
                        <td style={{ padding: "8px 12px", color: "#6b7280" }}>
                          {row.message || "—"}
                        </td>
                        <td style={{ padding: "8px 12px", color: "#6b7280" }}>
                          {row.source || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {detail.log && detail.log.length > summaryRows.length && (
              <p style={{ color: "#6b7280", marginTop: 8 }}>
                Showing first {summaryRows.length} of {detail.log.length} rows.
                Use the CLI or API to download the full log if needed.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export const config = defineRouteConfig({})

export default ProductDescPage
