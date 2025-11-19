import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  authenticateWithLegacySupport,
  verifyCustomerToken,
} from "../../utils/legacy-auth"
import {
  persistCustomerSession,
  clearCustomerSession,
} from "../utils/session"
import { sendErrorResponse } from "../utils/respond"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body || {}) as {
    email?: string
    password?: string
  }

  const email = (body.email || "").trim().toLowerCase()
  const password = body.password || ""

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." })
  }

  try {
    const token = await authenticateWithLegacySupport(req, email, password)
    persistCustomerSession(res, token)

    const payload = verifyCustomerToken(token)

    return res.status(200).json({
      success: true,
      token,
      customer: {
        id: payload?.customer_id || null,
        email: payload?.email || email,
      },
    })
  } catch (error: any) {
    if (error?.name === "UnauthorizedError") {
      clearCustomerSession(res)
      return res.status(401).json({ message: "Invalid email or password." })
    }

    return sendErrorResponse(res, error, "Unable to log in.")
  }
}
