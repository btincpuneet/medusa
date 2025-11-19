import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { resolveSapIntegrationService } from "../../../../../modules/redington-sap-integration"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = resolveSapIntegrationService(req.scope)
  const actorId =
    (req as any).auth_user?.id ??
    (req as any).user?.id ??
    "admin:redington-sap"

  try {
    const result = await service.testConnection(actorId)
    return res.json(result)
  } catch (error: any) {
    return res.status(502).json({
      ok: false,
      message: error?.message ?? "Unable to reach SAP endpoint",
    })
  }
}
