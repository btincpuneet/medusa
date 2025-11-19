import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { resolveSapIntegrationService } from "../../../../../modules/redington-sap-integration"

type TriggerSyncBody = {
  order_id?: string | null
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = resolveSapIntegrationService(req.scope)
  const actorId =
    (req as any).auth_user?.id ??
    (req as any).user?.id ??
    "admin:redington-sap"

  const body = (req.body || {}) as TriggerSyncBody
  const orderId = typeof body.order_id === "string" ? body.order_id : null

  try {
    const log = await service.triggerSync({
      orderId,
      actorId,
      runType: "manual",
    })

    return res.status(202).json({
      message: orderId
        ? `Order ${orderId} queued for SAP sync`
        : "SAP stock sync queued",
      log_id: log.id,
    })
  } catch (error: any) {
    return res.status(502).json({
      message: error?.message ?? "Failed to trigger SAP sync",
    })
  }
}
