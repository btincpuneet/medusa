import type { MedusaContainer } from "@medusajs/framework/types"

// import { resolveSapIntegrationService } from "../modules/redington-sap-integration"

// export default async function redingtonSapSyncJob(
//   container: MedusaContainer
// ) {
//   const service = resolveSapIntegrationService(container)
//   try {
//     await service.triggerSync({
//       orderId: null,
//       actorId: "job:redington-sap-sync",
//       runType: "automatic",
//     })
//   } catch (error) {
//     let logger: { error?: (...args: any[]) => void } | undefined
//     try {
//       logger = container.resolve("logger") as {
//         error?: (...args: any[]) => void
//       }
//     } catch {
//       logger = undefined
//     }
//     logger?.error?.("redington-sap-sync", error)
//   }
// }

// export const config = {
//   name: "redington-sap-sync",
//   schedule: "*/10 * * * *", // every 10 minutes
// }
// 🚫 NOTE:
// SAP sync job is temporarily disabled to avoid ETIMEDOUT errors
// No calls will be made to 172.20.37.18 until this file is restored.

export default async function redingtonSapSyncJob(
  container: MedusaContainer
) {
  let logger: { info?: (...args: any[]) => void } | undefined

  try {
    logger = container.resolve("logger") as {
      info?: (...args: any[]) => void
    }
  } catch {
    logger = undefined
  }

  logger?.info?.(
    "redington-sap-sync job is DISABLED temporarily. Skipping SAP sync call."
  )

  // Do nothing – exit immediately
  return
}

export const config = {
  name: "redington-sap-sync",
  schedule: "*/10 * * * *", // still registered, but job body does nothing
}