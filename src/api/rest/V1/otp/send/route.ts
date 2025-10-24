import { randomInt } from "crypto"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonOtpTable,
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

type SendOtpBody = {
  customer_email?: string
  action?: string
}

const OTP_LENGTH = Number(process.env.REDINGTON_OTP_LENGTH || 6)
const OTP_TTL_MINUTES = Number(process.env.REDINGTON_OTP_TTL_MINUTES || 10)

const generateOtp = (length: number) => {
  const max = Math.pow(10, length) - 1
  const min = Math.pow(10, length - 1)
  return String(randomInt(min, max + 1))
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const body = (req.body || {}) as SendOtpBody
  const email = (body.customer_email || "").trim().toLowerCase()
  const action = (body.action || "login").trim().toLowerCase()

  if (!email) {
    return res.json([
      { status: "error", message: "customer_email is required." },
    ])
  }

  await ensureRedingtonOtpTable()

  const otp = generateOtp(Math.max(4, Math.min(OTP_LENGTH, 8)))
  const expiresAt = new Date(
    Date.now() + OTP_TTL_MINUTES * 60 * 1000
  ).toISOString()

  await getPgPool().query(
    `
      INSERT INTO redington_otp (email, action, code, expires_at, consumed_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NULL, NOW(), NOW())
      ON CONFLICT (email, action) DO UPDATE
        SET code = EXCLUDED.code,
            expires_at = EXCLUDED.expires_at,
            consumed_at = NULL,
            updated_at = NOW()
    `,
    [email, action, otp, expiresAt]
  )

  if (process.env.REDINGTON_DEBUG_OTP?.toLowerCase() !== "false") {
    console.log(`[OTP] ${email} (${action}) -> ${otp} (expires ${expiresAt})`)
  }

  return res.json([
    {
      status: "success",
      message: "OTP dispatched successfully.",
      expires_at: expiresAt,
      debug_otp:
        process.env.REDINGTON_DEBUG_OTP?.toLowerCase() === "false"
          ? undefined
          : otp,
    },
  ])
}
