"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = redingtonSapSyncJob;
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
async function redingtonSapSyncJob(container) {
    let logger;
    try {
        logger = container.resolve("logger");
    }
    catch {
        logger = undefined;
    }
    logger?.info?.("redington-sap-sync job is DISABLED temporarily. Skipping SAP sync call.");
    // Do nothing – exit immediately
    return;
}
exports.config = {
    name: "redington-sap-sync",
    schedule: "*/10 * * * *", // still registered, but job body does nothing
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkaW5ndG9uLXNhcC1zeW5jLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2pvYnMvcmVkaW5ndG9uLXNhcC1zeW5jLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQW1DQSxzQ0FtQkM7QUFwREQsc0ZBQXNGO0FBRXRGLHFEQUFxRDtBQUNyRCwrQkFBK0I7QUFDL0IsTUFBTTtBQUNOLDREQUE0RDtBQUM1RCxVQUFVO0FBQ1Ysa0NBQWtDO0FBQ2xDLHVCQUF1QjtBQUN2QiwyQ0FBMkM7QUFDM0MsOEJBQThCO0FBQzlCLFNBQVM7QUFDVCxzQkFBc0I7QUFDdEIsbUVBQW1FO0FBQ25FLFlBQVk7QUFDWixrREFBa0Q7QUFDbEQsMkNBQTJDO0FBQzNDLFVBQVU7QUFDVixnQkFBZ0I7QUFDaEIsMkJBQTJCO0FBQzNCLFFBQVE7QUFDUixtREFBbUQ7QUFDbkQsTUFBTTtBQUNOLElBQUk7QUFFSiwwQkFBMEI7QUFDMUIsZ0NBQWdDO0FBQ2hDLGtEQUFrRDtBQUNsRCxJQUFJO0FBQ0osV0FBVztBQUNYLGlFQUFpRTtBQUNqRSxxRUFBcUU7QUFFdEQsS0FBSyxVQUFVLG1CQUFtQixDQUMvQyxTQUEwQjtJQUUxQixJQUFJLE1BQXVELENBQUE7SUFFM0QsSUFBSSxDQUFDO1FBQ0gsTUFBTSxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUVsQyxDQUFBO0lBQ0gsQ0FBQztJQUFDLE1BQU0sQ0FBQztRQUNQLE1BQU0sR0FBRyxTQUFTLENBQUE7SUFDcEIsQ0FBQztJQUVELE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDWix5RUFBeUUsQ0FDMUUsQ0FBQTtJQUVELGdDQUFnQztJQUNoQyxPQUFNO0FBQ1IsQ0FBQztBQUVZLFFBQUEsTUFBTSxHQUFHO0lBQ3BCLElBQUksRUFBRSxvQkFBb0I7SUFDMUIsUUFBUSxFQUFFLGNBQWMsRUFBRSw4Q0FBOEM7Q0FDekUsQ0FBQSJ9