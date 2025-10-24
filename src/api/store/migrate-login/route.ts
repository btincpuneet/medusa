// src/api/store/migrate-login/route.ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { authenticateWithLegacySupport } from "../../utils/legacy-auth"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { email, password } = req.body as { email?: string; password?: string }
  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" })
  }

  try {
    const token = await authenticateWithLegacySupport(req, email, password)
    return res.status(200).json(token)
  } catch (error: any) {
    const status =
      error?.name === "UnauthorizedError" || error?.message === "Unauthorized"
        ? 401
        : 500

    return res.status(status).json({
      message:
        status === 401
          ? "Unauthorized"
          : error?.message || "Unexpected error during authentication.",
    })
  }
}
