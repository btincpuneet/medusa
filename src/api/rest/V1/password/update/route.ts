import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { updateMagentoCustomerPassword } from "../../../../utils/magento-customer"

import {
  ensureEmailPasswordIdentity,
  findRegisteredCustomerByEmail,
} from "../../../../../lib/customer-auth"

type UpdatePasswordPayload = {
  customer_email?: string
  email?: string
  password?: string
}

type UpdatePasswordBody = UpdatePasswordPayload & {
  data?: UpdatePasswordPayload | null
}

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

  const body = ((req.body || {}) as UpdatePasswordBody) || {}
  const payload =
    (typeof body.data === "object" && body.data !== null
      ? body.data
      : body) || {}

  const email = (
    payload.customer_email ||
    payload.email ||
    ""
  )
    .trim()
    .toLowerCase()
  const password = (payload.password || "").trim()

  if (!email) {
    return res.status(400).json({
      message: "customer_email is required.",
    })
  }

  if (!password) {
    return res.status(400).json({
      message: "password is required.",
    })
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: "password must be at least 8 characters long.",
    })
  }

  try {
    const customer = await findRegisteredCustomerByEmail(req.scope, email)

    if (!customer?.id) {
      return res.status(404).json({
        message: "Customer not found.",
      })
    }

    await ensureEmailPasswordIdentity(req.scope, email, password, customer.id)
    await updateMagentoCustomerPassword(email, password, {
      id: customer.metadata?.magento_id,
      email: customer.email,
      firstname: customer.first_name,
      lastname: customer.last_name,
      website_id: customer.metadata?.website_id,
    })

    return res.json({
      status: "success",
      message: "Password updated successfully.",
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to update password.",
    })
  }
}
