import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { clearCustomerSession } from "../utils/session"

export const POST = async (_req: MedusaRequest, res: MedusaResponse) => {
  clearCustomerSession(res)
  return res.json({ success: true })
}
