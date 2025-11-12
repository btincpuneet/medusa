import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useCallback, useEffect, useMemo, useState } from "react"

type LogSummary = {
  name: string
  size: number
  updated_at: string
  extension: string
}

type LogTailResponse = {
  log?: {
    name: string
    lines: string[]
    truncated: boolean
    size: number
    updated_at: string
  }
  limit?: number
  message?: string
}

type LogListResponse = {
  logs?: LogSummary[]
  message?: string
}

const byteFormatter = (value: number) => {
  if (!Number.isFinite(value)) {
    return "0 B"
  }
  const units = ["B", "KB", "MB", "GB"]
  let index = 0
  let size = value
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index += 1
  }
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "-"
  }
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

const LogPage: React.FC = () => {
  const [logs, setLogs] = useState<LogSummary[]>([])
  const [selectedLog, setSelectedLog] = useState<string | null>(null)
  const [listLoading, setListLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [contentError, setContentError] = useState<string | null>(null)
  const [content, setContent] = useState<string>("")
  const [lineLimit, setLineLimit] = useState(400)
  const [metadata, setMetadata] = useState<{
    updated_at: string
    size: number
    truncated: boolean
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchJson = useCallback(
    async (url: string): Promise<any> => {
      const response = await fetch(url, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        let body: any
        try {
          body = await response.json()
        } catch {
          // ignore
        }
        const message =
          body?.message ||
          `Request failed with status ${response.status.toString()}`
        throw new Error(message)
      }

      try {
        return await response.json()
      } catch {
        return {}
      }
    },
    []
  )

  const loadLogs = useCallback(async () => {
    setListLoading(true)
    setListError(null)
    try {
      const data = (await fetchJson(
        "/admin/redington/logs"
      )) as LogListResponse
      const items = data.logs ?? []
      setLogs(items)
      setSelectedLog((current) => {
        if (current && items.some((entry) => entry.name === current)) {
          return current
        }
        return items[0]?.name ?? null
      })
    } catch (error: any) {
      setListError(error.message || "Failed to load log list.")
      setLogs([])
      setSelectedLog(null)
    } finally {
      setListLoading(false)
    }
  }, [fetchJson])

  const loadContent = useCallback(
    async (name: string | null, limit: number) => {
      if (!name) {
        setContent("")
        setMetadata(null)
        return
      }
      setContentLoading(true)
      setContentError(null)
      try {
        const url = `/admin/redington/logs/${encodeURIComponent(
          name
        )}?limit=${limit}`
        const data = (await fetchJson(url)) as LogTailResponse
        if (!data.log) {
          throw new Error("No log data returned.")
        }
        setContent(data.log.lines.join("\n"))
        setMetadata({
          updated_at: data.log.updated_at,
          size: data.log.size,
          truncated: data.log.truncated,
        })
      } catch (error: any) {
        setContent("")
        setMetadata(null)
        setContentError(error.message || "Failed to load log content.")
      } finally {
        setContentLoading(false)
      }
    },
    [fetchJson]
  )

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  useEffect(() => {
    loadContent(selectedLog, lineLimit)
  }, [selectedLog, lineLimit, loadContent])

  const selectedSummary = useMemo(
    () => logs.find((entry) => entry.name === selectedLog) ?? null,
    [logs, selectedLog]
  )

  const handleCopy = async () => {
    if (!content.length || !navigator?.clipboard) {
      return
    }
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore copy failures
    }
  }

  const limitOptions = [100, 200, 400, 800, 1200, 1600]

  return (
    <div style={{ padding: "24px 16px 64px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Log Viewer</h1>
        <p style={{ color: "#5f6c7b", marginTop: 8, maxWidth: 720 }}>
          Inspect Magento-style error logs without leaving Medusa. Files are
          discovered under <code>REDINGTON_LOG_ROOT</code> (defaults to the{" "}
          <code>logs/</code> folder in this deployment). Select a file to tail
          the latest entries, refresh to pull new data, or download the full log
          for deeper analysis.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
        }}
      >
        <section
          style={{
            flex: "0 0 310px",
            maxWidth: 360,
            minWidth: 260,
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
            overflow: "hidden",
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
            <div>
              <h2 style={{ margin: 0, fontSize: 16 }}>Available logs</h2>
              <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
                Pick a file to preview the latest lines.
              </p>
            </div>
            <button
              type="button"
              onClick={loadLogs}
              disabled={listLoading}
              style={{
                border: "1px solid #d1d5db",
                background: listLoading ? "#f3f4f6" : "#fff",
                padding: "6px 10px",
                borderRadius: 6,
                cursor: listLoading ? "not-allowed" : "pointer",
                fontSize: 13,
              }}
            >
              {listLoading ? "…" : "Refresh"}
            </button>
          </div>
          <div style={{ maxHeight: 420, overflowY: "auto" }}>
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
            {!listError && listLoading && (
              <div style={{ padding: 16, color: "#6b7280" }}>
                Loading log files…
              </div>
            )}
            {!listLoading && !listError && logs.length === 0 && (
              <div style={{ padding: 16, color: "#6b7280" }}>
                No log files found yet. Once Medusa writes to{" "}
                <code>logs/*.log</code>, they will appear here.
              </div>
            )}
            {!listLoading &&
              !listError &&
              logs.map((log) => {
                const isActive = log.name === selectedLog
                return (
                  <button
                    key={log.name}
                    type="button"
                    onClick={() => setSelectedLog(log.name)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      borderBottom: "1px solid #f3f4f6",
                      padding: "12px 16px",
                      background: isActive ? "#eff6ff" : "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        color: isActive ? "#1d4ed8" : "#111827",
                        fontSize: 14,
                      }}
                    >
                      {log.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        marginTop: 2,
                      }}
                    >
                      {byteFormatter(log.size)} • Updated{" "}
                      {formatDateTime(log.updated_at)}
                    </div>
                  </button>
                )
              })}
          </div>
        </section>

        <section
          style={{
            flex: "1 1 480px",
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
            minHeight: 420,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 16 }}>
                {selectedLog || "No log selected"}
              </h2>
              <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
                Showing last {lineLimit} lines.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 13,
                  color: "#4b5563",
                }}
              >
                Lines
                <select
                  value={lineLimit}
                  onChange={(event) =>
                    setLineLimit(Number(event.target.value))
                  }
                  style={{
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    padding: "6px 8px",
                    fontSize: 13,
                  }}
                >
                  {limitOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => loadContent(selectedLog, lineLimit)}
                disabled={contentLoading || !selectedLog}
                style={{
                  border: "1px solid #d1d5db",
                  background: contentLoading ? "#f3f4f6" : "#fff",
                  padding: "6px 12px",
                  borderRadius: 6,
                  cursor:
                    contentLoading || !selectedLog ? "not-allowed" : "pointer",
                  fontSize: 13,
                }}
              >
                {contentLoading ? "…" : "Refresh"}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!content.length}
                style={{
                  border: "1px solid #d1d5db",
                  background: copied ? "#dbeafe" : "#fff",
                  padding: "6px 12px",
                  borderRadius: 6,
                  cursor: !content.length ? "not-allowed" : "pointer",
                  fontSize: 13,
                }}
              >
                {copied ? "Copied" : "Copy"}
              </button>
              <a
                href={
                  selectedLog
                    ? `/admin/redington/logs/${encodeURIComponent(
                        selectedLog
                      )}?download=1`
                    : undefined
                }
                style={{
                  border: "1px solid #1d4ed8",
                  background: selectedLog ? "#1d4ed8" : "#bfdbfe",
                  color: "#fff",
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 13,
                  textDecoration: "none",
                  pointerEvents: selectedLog ? "auto" : "none",
                }}
              >
                Download
              </a>
            </div>
          </div>
          {contentError && (
            <div
              style={{
                padding: 16,
                color: "#b91c1c",
                background: "#fef2f2",
                borderBottom: "1px solid #fecaca",
              }}
            >
              {contentError}
            </div>
          )}
          {!contentError && (
            <div
              style={{
                padding: 16,
                borderBottom: metadata ? "1px solid #f3f4f6" : "none",
                color: "#4b5563",
                fontSize: 13,
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <span>
                Updated: <strong>{formatDateTime(metadata?.updated_at ?? "")}</strong>
              </span>
              <span>
                Size: <strong>{byteFormatter(metadata?.size ?? 0)}</strong>
              </span>
              {metadata?.truncated && (
                <span style={{ color: "#b45309" }}>
                  Showing the last {lineLimit} lines (truncated)
                </span>
              )}
            </div>
          )}
          <div
            style={{
              flex: "1 1 auto",
              overflow: "auto",
              background: "#0f172a",
              color: "#e2e8f0",
              fontFamily: "SFMono-Regular, Consolas, Menlo, monospace",
              fontSize: 12,
              padding: 16,
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              lineHeight: 1.5,
            }}
          >
            {contentLoading && !content.length && (
              <span style={{ color: "#94a3b8" }}>
                Fetching log content…
              </span>
            )}
            {!contentLoading && !content.length && (
              <span style={{ color: "#94a3b8" }}>
                Select a log file to preview its contents.
              </span>
            )}
            {!!content.length && content}
          </div>
        </section>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({})

export default LogPage
