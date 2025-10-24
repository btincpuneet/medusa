import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticateWithLegacySupport } from "../../../../../utils/legacy-auth"

type MagentoLoginBody = {
  username?: string
  password?: string
}

const extractTokenString = (payload: any): string | null => {
  if (!payload) {
    return null
  }

  if (typeof payload === "string") {
    return payload
  }

  if (typeof payload === "object") {
    if (typeof payload.token === "string") {
      return payload.token
    }

    if (typeof payload.access_token === "string") {
      return payload.access_token
    }

    if (typeof payload.jwt === "string") {
      return payload.jwt
    }

    if (payload.token && typeof payload.token.token === "string") {
      return payload.token.token
    }
  }

  return null
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { username, password } = req.body as MagentoLoginBody

  if (!username || !password) {
    return res.status(400).json({ message: "username and password are required" })
  }

  const email = String(username).trim().toLowerCase()

  try {
    const authPayload = await authenticateWithLegacySupport(req, email, password)
    const tokenString = extractTokenString(authPayload)

    if (!tokenString) {
      return res.status(500).json({
        message: "Authentication succeeded but no token was returned.",
      })
    }

    return res.status(200).json(tokenString)
  } catch (error: any) {
    const status =
      error?.name === "UnauthorizedError" || error?.message === "Unauthorized"
        ? 401
        : 500

    return res.status(status).json({
      message:
        status === 401
          ? "The credentials provided are invalid."
          : error?.message || "Unexpected error during authentication.",
    })
  }
}
