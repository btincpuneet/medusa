import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Button,
  Heading,
  Input,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import React, { useCallback, useEffect, useMemo, useState } from "react"

import { useRedingtonAccess } from "../../hooks/useRedingtonAccess"

type SapConfig = {
  id?: string
  api_url?: string | null
  client_id?: string | null
  client_secret?: string | null
  invoice_api_url?: string | null
  invoice_pdf_api_url?: string | null
  invoice_client_id?: string | null
  invoice_client_secret?: string | null
  domain_url?: string | null
  company_codes?: string[]
  notification_emails?: string[]
  updated_at?: string
  updated_by?: string | null
}

type SapLog = {
  id: string
  run_type: string
  order_id?: string | null
  sap_order_number?: string | null
  status: string
  message?: string | null
  actor_id?: string | null
  duration_ms?: number | null
  created_at: string
}

const toCommaString = (list?: string[]) =>
  Array.isArray(list) ? list.join(", ") : ""

const toList = (value: string) =>
  value
    .split(/[,\n]+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)

const formatDate = (value?: string | null) => {
  if (!value) {
    return "-"
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

const statusColor = (status: string) => {
  const normalized = status.toLowerCase()
  if (normalized === "success") {
    return "#16a34a"
  }
  if (normalized === "failed") {
    return "#dc2626"
  }
  return "#0f172a"
}

const INITIAL_FORM_STATE = {
  api_url: "",
  client_id: "",
  client_secret: "",
  invoice_api_url: "",
  invoice_pdf_api_url: "",
  invoice_client_id: "",
  invoice_client_secret: "",
  domain_url: "",
  company_codes: "",
  notification_emails: "",
}

const RedingtonSapIntegrationPage: React.FC = () => {
  const {
    loading: accessLoading,
    error: accessError,
    loginMode,
    permissions,
    isSuperAdmin,
    refresh: refreshAccess,
  } = useRedingtonAccess()

  const [config, setConfig] = useState<SapConfig | null>(null)
  const [logs, setLogs] = useState<SapLog[]>([])
  const [form, setForm] = useState(INITIAL_FORM_STATE)
  const [orderId, setOrderId] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const hasPermission = useMemo(() => {
    const granted = permissions ?? []
    return (permission: string) =>
      isSuperAdmin || granted.includes("*") || granted.includes(permission)
  }, [permissions, isSuperAdmin])

  const canView = useMemo(() => {
    if (isSuperAdmin || loginMode === "admin") {
      return true
    }
    return hasPermission("sap_integration.view") || hasPermission("sap_integration.manage")
  }, [hasPermission, loginMode, isSuperAdmin])

  const canManage = useMemo(() => {
    if (isSuperAdmin || loginMode === "admin") {
      return true
    }
    return hasPermission("sap_integration.manage")
  }, [hasPermission, loginMode, isSuperAdmin])

  const loadConfig = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/admin/redington/sap-integration", {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Unable to load SAP configuration.")
      }
      const body = await response.json()
      setConfig(body.config ?? null)
      setLogs(Array.isArray(body.logs) ? body.logs : [])
      setForm({
        api_url: body.config?.api_url ?? "",
        client_id: body.config?.client_id ?? "",
        client_secret: body.config?.client_secret ?? "",
        invoice_api_url: body.config?.invoice_api_url ?? "",
        invoice_pdf_api_url: body.config?.invoice_pdf_api_url ?? "",
        invoice_client_id: body.config?.invoice_client_id ?? "",
        invoice_client_secret: body.config?.invoice_client_secret ?? "",
        domain_url: body.config?.domain_url ?? "",
        company_codes: toCommaString(body.config?.company_codes),
        notification_emails: toCommaString(body.config?.notification_emails),
      })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load SAP config."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (canView) {
      void loadConfig()
    } else {
      setConfig(null)
      setLogs([])
    }
  }, [canView, loadConfig])

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    if (!canManage) {
      toast.error("You do not have permission to update the SAP configuration.")
      return
    }
    setSaving(true)
    try {
      const response = await fetch("/admin/redington/sap-integration", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          company_codes: toList(form.company_codes),
          notification_emails: toList(form.notification_emails),
        }),
      })
      if (!response.ok) {
        throw new Error("Unable to save SAP configuration.")
      }
      const body = await response.json()
      setConfig(body.config)
      toast.success("SAP configuration saved.")
      await loadConfig()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save the configuration."
      )
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    if (!canManage) {
      toast.error("You do not have permission to test the SAP connection.")
      return
    }
    setTesting(true)
    try {
      const response = await fetch("/admin/redington/sap-integration/test", {
        method: "POST",
        credentials: "include",
      })
      const body = await response.json()
      if (!response.ok || body.ok === false) {
        throw new Error(body?.message ?? "SAP test failed.")
      }
      toast.success(body?.message ?? "SAP connection is healthy.")
      await loadConfig()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to reach SAP."
      )
    } finally {
      setTesting(false)
    }
  }

  const handleSyncNow = async () => {
    if (!canManage) {
      toast.error("You do not have permission to trigger SAP sync.")
      return
    }
    setSyncing(true)
    try {
      const response = await fetch("/admin/redington/sap-integration/sync", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: orderId?.trim() ? orderId.trim() : null,
        }),
      })
      const body = await response.json()
      if (!response.ok) {
        throw new Error(body?.message ?? "SAP sync failed.")
      }
      toast.success(body?.message ?? "SAP sync queued.")
      setOrderId("")
      await loadConfig()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to queue SAP sync."
      )
    } finally {
      setSyncing(false)
    }
  }

  if (accessLoading) {
    return (
      <div style={{ padding: 24 }}>
        <Text>Loading permissions…</Text>
      </div>
    )
  }

  if (!canView) {
    return (
      <div style={{ padding: 24 }}>
        <Heading level="h1">SAP Integration</Heading>
        <Text style={{ marginTop: 8 }}>
          This tool is not available with your current permissions. Ask a Super Admin to grant
          the <strong style={{ fontWeight: 600 }}>sap_integration.manage</strong> permission.
        </Text>
        {accessError ? (
          <Text style={{ marginTop: 16, color: "#dc2626" }}>{accessError}</Text>
        ) : null}
        <div style={{ marginTop: 16 }}>
          <Button variant="secondary" onClick={refreshAccess}>
            Refresh access
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 32 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <Heading level="h1">Redington – SAP Integration</Heading>
          <Text style={{ color: "#475569", marginTop: 8 }}>
            Manage the SAP configuration, test the connection, and queue manual order syncs.
          </Text>
        </div>
        <div>
          <Button variant="secondary" onClick={refreshAccess}>Refresh access</Button>
        </div>
      </header>

      <section style={{ display: "grid", gap: 16 }}>
        <div style={{ padding: 24, borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff" }}>
          <Heading level="h3" style={{ marginTop: 0 }}>Configuration</Heading>
          <div style={{ display: "grid", gap: 12 }}>
            <Input
              label="SAP Base URL"
              value={form.api_url}
              onChange={(event) => handleChange("api_url", event.target.value)}
              placeholder="https://sap.example.com/api"
            />
            <Input
              label="API Client ID"
              value={form.client_id}
              onChange={(event) => handleChange("client_id", event.target.value)}
            />
            <Input
              label="API Client Secret"
              type="password"
              value={form.client_secret}
              onChange={(event) => handleChange("client_secret", event.target.value)}
            />
            <Input
              label="Company Codes (comma separated)"
              value={form.company_codes}
              onChange={(event) => handleChange("company_codes", event.target.value)}
            />
            <Input
              label="Notification Emails"
              value={form.notification_emails}
              onChange={(event) => handleChange("notification_emails", event.target.value)}
            />
            <Input
              label="Domain URL"
              value={form.domain_url}
              onChange={(event) => handleChange("domain_url", event.target.value)}
            />
            <Input
              label="Invoice API URL"
              value={form.invoice_api_url}
              onChange={(event) => handleChange("invoice_api_url", event.target.value)}
            />
            <Input
              label="Invoice Client ID"
              value={form.invoice_client_id}
              onChange={(event) => handleChange("invoice_client_id", event.target.value)}
            />
            <Input
              label="Invoice Client Secret"
              type="password"
              value={form.invoice_client_secret}
              onChange={(event) => handleChange("invoice_client_secret", event.target.value)}
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button onClick={handleSave} loading={saving} disabled={saving || loading || !canManage}>
                Save Config
              </Button>
              <Button variant="secondary" onClick={handleTestConnection} loading={testing} disabled={testing || loading || !canManage}>
                Test Connection
              </Button>
            </div>
          </div>
        </div>

        <div style={{ padding: 24, borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff" }}>
          <Heading level="h3" style={{ marginTop: 0 }}>Manual Sync</Heading>
          <Text style={{ color: "#475569", marginBottom: 12 }}>
            Trigger a one-off SAP order sync. If you leave the Order ID blank, the scheduled job will
            run a stock sync instead.
          </Text>
          <Input
            label="Specific Order ID"
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            placeholder="Optional order id to sync"
          />
          <Button onClick={handleSyncNow} loading={syncing} disabled={syncing || loading || !canManage}>
            Run Sync Now
          </Button>
        </div>
      </section>

      <section>
        <Heading level="h3" style={{ marginTop: 0 }}>Recent Syncs</Heading>
        {logs.length ? (
          <Table>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Date</th>
                <th style={{ textAlign: "left" }}>Type</th>
                <th style={{ textAlign: "left" }}>Status</th>
                <th style={{ textAlign: "left" }}>Message</th>
                <th style={{ textAlign: "left" }}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ padding: "12px 0" }}>{formatDate(log.created_at)}</td>
                  <td>{log.run_type}</td>
                  <td>
                    <Text style={{ color: statusColor(log.status) }}>{log.status}</Text>
                  </td>
                  <td>{log.message ?? "-"}</td>
                  <td>{log.duration_ms != null ? `${log.duration_ms} ms` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Text style={{ color: "#64748b" }}>No syncs have been recorded yet.</Text>
        )}
      </section>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "SAP Integration",
})

export default RedingtonSapIntegrationPage
