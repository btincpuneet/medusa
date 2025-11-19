import type { MedusaContainer } from "@medusajs/framework/types"

import { resolveSapIntegrationService } from "../modules/redington-sap-integration"

export default async function redingtonSapSyncJob(
  container: MedusaContainer
) {
  const service = resolveSapIntegrationService(container)
  try {
    await service.triggerSync({
      orderId: null,
      actorId: "job:redington-sap-sync",
      runType: "automatic",
    })
  } catch (error) {
    let logger: { error?: (...args: any[]) => void } | undefined
    try {
      logger = container.resolve("logger") as {
        error?: (...args: any[]) => void
      }
    } catch {
      logger = undefined
    }
    logger?.error?.("redington-sap-sync", error)
  }
}

export const config = {
  name: "redington-sap-sync",
  schedule: "*/10 * * * *", // every 10 minutes
}
