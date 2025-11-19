import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { resolveSapIntegrationService } from "../../../../modules/redington-sap-integration"

const toPlainConfig = (config: any) => ({
  id: config.id,
  api_url: config.api_url,
  client_id: config.client_id,
  client_secret: config.client_secret,
  invoice_api_url: config.invoice_api_url,
  invoice_pdf_api_url: config.invoice_pdf_api_url,
  invoice_client_id: config.invoice_client_id,
  invoice_client_secret: config.invoice_client_secret,
  domain_url: config.domain_url,
  company_codes: config.company_codes ?? [],
  notification_emails: config.notification_emails ?? [],
  updated_by: config.updated_by,
  created_at:
    config.created_at instanceof Date
      ? config.created_at.toISOString()
      : config.created_at,
  updated_at:
    config.updated_at instanceof Date
      ? config.updated_at.toISOString()
      : config.updated_at,
})

const toPlainLog = (log: any) => ({
  id: log.id,
  run_type: log.run_type,
  order_id: log.order_id,
  sap_order_number: log.sap_order_number,
  status: log.status,
  message: log.message,
  actor_id: log.actor_id,
  duration_ms: log.duration_ms,
  payload: log.payload,
  created_at:
    log.created_at instanceof Date
      ? log.created_at.toISOString()
      : log.created_at,
  updated_at:
    log.updated_at instanceof Date
      ? log.updated_at.toISOString()
      : log.updated_at,
})

const parseNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string" && value.trim().length) {
    const parsed = Number.parseInt(value.trim(), 10)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = resolveSapIntegrationService(req.scope)
  const limit = parseNumber(req.query.limit, 20)
  const offset = parseNumber(req.query.offset, 0)

  const [config, logsResult] = await Promise.all([
    service.getConfig(),
    service.listLogs(limit, offset),
  ])

  return res.json({
    config: toPlainConfig(config),
    logs: logsResult.logs.map(toPlainLog),
    count: logsResult.count,
  })
}

export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = resolveSapIntegrationService(req.scope)
  const actorId =
    (req as any).auth_user?.id ??
    (req as any).user?.id ??
    "admin:redington-sap"

  const updates = req.body ?? {}
  const config = await service.updateConfig(updates, actorId)

  return res.json({
    config: toPlainConfig(config),
  })
}
