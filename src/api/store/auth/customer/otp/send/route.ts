import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { findRegisteredCustomerByEmail } from "../../../../../../lib/customer-auth"
import { generateCustomerOtp } from "../../../../../../services/otp-service"

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

const sendOtpNotification = (email: string, otp: string) => {
  console.log(`[Customer OTP] ${email} -> ${otp}`)
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const body = (req.body || {}) as { email?: string }
  const email = (body.email || "").trim().toLowerCase()

  if (!email) {
    return res
      .status(400)
      .json({ message: "Email is required to send an OTP." })
  }

  const customer = await findRegisteredCustomerByEmail(req.scope, email)
  if (!customer || !customer.id) {
    return res.status(404).json({ message: "Customer not found." })
  }

  const otp = await generateCustomerOtp(email)
  sendOtpNotification(email, otp)

  return res.json({
    success: true,
    message: "OTP sent successfully.",
  })
}
