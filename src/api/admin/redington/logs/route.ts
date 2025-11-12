import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { listLogFiles } from "../../../../lib/log-viewer"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const logs = await listLogFiles()
    return res.json({ logs })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Unable to list log files.",
    })
  }
}
