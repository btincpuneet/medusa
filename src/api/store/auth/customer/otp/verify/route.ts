import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  findRegisteredCustomerByEmail,
} from "../../../../../../lib/customer-auth"
import { verifyCustomerOtp } from "../../../../../../services/otp-service"
import { issueCustomerToken } from "../../../../../../api/utils/legacy-auth"

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

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const body = (req.body || {}) as { email?: string; otp?: string }
  const email = (body.email || "").trim().toLowerCase()
  const otp = (body.otp || "").trim()

  if (!email || !otp) {
    return res
      .status(400)
      .json({ message: "Email and OTP are required." })
  }

  const isValid = await verifyCustomerOtp(email, otp)
  if (!isValid) {
    return res.status(401).json({ message: "Invalid or expired OTP." })
  }

  const customer = await findRegisteredCustomerByEmail(req.scope, email)
  if (!customer || !customer.id) {
    return res.status(404).json({ message: "Customer not found." })
  }

  const token = issueCustomerToken(customer.email || email, customer.id)

  return res.json({
    success: true,
    token,
    customer: {
      id: customer.id,
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      metadata: customer.metadata,
    },
  })
}
