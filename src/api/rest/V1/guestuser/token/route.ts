import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonGuestTokenTable,
  getPgPool,
} from "../../../../../lib/pg"
import { createMagentoB2CClient } from "../../../../../api/magentoClient"

const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL

const setCors = (req: MedusaRequest, res: MedusaResponse) => {
  const origin = req.headers.origin
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin)
    res.header("Vary", "Origin")
  } else {
    res.header("Access-Control-Allow-Origin", "*")
  }

  res.header(
    "Access-Control-Allow-Headers",
    req.headers["access-control-request-headers"] ||
      "Content-Type, Authorization"
  )
  res.header("Access-Control-Allow-Methods", "POST,OPTIONS")
  res.header("Access-Control-Allow-Credentials", "true")
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

type GuestTokenRequest = {
  email?: string
}

const createFailureResponse = (message: string) => [
  {
    success: false,
    message,
  },
]

const TOKEN_TTL_MINUTES = Number(
  process.env.REDINGTON_GUEST_TOKEN_TTL_MINUTES || 60
)

const ensureMagentoConfig = () => {
  if (!MAGENTO_REST_BASE_URL) {
    throw new Error("MAGENTO_REST_BASE_URL is required for guest tokens.")
  }
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const body = (req.body || {}) as GuestTokenRequest
  const email = (body.email || "").trim().toLowerCase()

  if (!email) {
    return res.json(createFailureResponse("email is required"))
  }

  try {
    ensureMagentoConfig()
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Magento configuration missing.",
    })
  }

  try {
    const magentoClient = createMagentoB2CClient({
      baseUrl: MAGENTO_REST_BASE_URL!,
    })

    const response = await magentoClient.request({
      url: "guestuser/token",
      method: "POST",
      data: body,
    })

    const magentoPayload = response.data

    const extractToken = (payload: any): string | null => {
      if (!payload) {
        return null
      }
      if (typeof payload === "string") {
        return payload
      }
      if (Array.isArray(payload)) {
        return extractToken(payload[0])
      }
      if (typeof payload === "object") {
        return (
          typeof payload.token === "string"
            ? payload.token
            : typeof payload.access_token === "string"
            ? payload.access_token
            : null
        )
      }
      return null
    }

    const token = extractToken(magentoPayload)
    if (token) {
      await ensureRedingtonGuestTokenTable()
      const expiresAt = new Date(
        Date.now() + TOKEN_TTL_MINUTES * 60 * 1000
      ).toISOString()

      await getPgPool().query(
        `
          INSERT INTO redington_guest_token (email, token, expires_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (email) DO UPDATE
            SET token = EXCLUDED.token,
                expires_at = EXCLUDED.expires_at,
                updated_at = NOW()
        `,
        [email, token, expiresAt]
      )
    }

    return res.status(response.status).json(magentoPayload)
  } catch (error: any) {
    const status = error?.response?.status ?? 502
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to request Magento guest token."
    return res.status(status).json(createFailureResponse(message))
  }
}
