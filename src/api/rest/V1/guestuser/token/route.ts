import { randomUUID } from "crypto"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonGuestTokenTable,
  getPgPool,
} from "../../../../../lib/pg"

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

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const body = (req.body || {}) as GuestTokenRequest
  const email = (body.email || "").trim().toLowerCase()

  if (!email) {
    return res.json(createFailureResponse("email is required"))
  }

  await ensureRedingtonGuestTokenTable()

  const token = randomUUID().replace(/-/g, "")
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

  return res.json([
    {
      success: true,
      token,
      email,
      expires_at: expiresAt,
    },
  ])
}
