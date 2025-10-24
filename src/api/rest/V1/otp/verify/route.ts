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

type VerifyOtpBody = {
  customer_email?: string
  action?: string
  otpCode?: string
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const body = (req.body || {}) as VerifyOtpBody
  const email = (body.customer_email || "").trim().toLowerCase()
  const action = (body.action || "login").trim().toLowerCase()
  const otpCode = (body.otpCode || "").trim()

  if (!email || !otpCode) {
    return res.status(400).json({
      message: "customer_email and otpCode are required.",
    })
  }

  await ensureRedingtonOtpTable()

  const { rows } = await getPgPool().query(
    `
      SELECT id, code, expires_at, consumed_at
      FROM redington_otp
      WHERE email = $1 AND action = $2
      LIMIT 1
    `,
    [email, action]
  )

  if (!rows[0]) {
    return res.status(400).json({
      message: "OTP not found. Please request a new code.",
    })
  }

  const record = rows[0]
  const now = new Date()
  const expiresAt = new Date(record.expires_at)

  if (record.consumed_at) {
    return res.status(400).json({
      message: "OTP has already been used. Please request a new code.",
    })
  }

  if (now > expiresAt) {
    return res.status(400).json({
      message: "OTP expired. Please request a new code.",
    })
  }

  if (String(record.code).trim() !== otpCode) {
    return res.status(400).json({
      message: "Invalid OTP code.",
    })
  }

  await getPgPool().query(
    `
      UPDATE redington_otp
      SET consumed_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `,
    [record.id]
  )

  return res.json({
    status: "success",
    message: "OTP verified.",
  })
}
