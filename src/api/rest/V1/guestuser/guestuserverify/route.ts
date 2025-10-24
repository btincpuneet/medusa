import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import createSapClient from "../../../../../modules/sap-client"
import { redingtonConfig } from "../../../../../modules/redington-config"
import {
  ensureRedingtonGuestTokenTable,
  recordGuestUserAudit,
  upsertRedingtonCustomerSync,
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

type GuestVerifyRequest = {
  email?: string
}

const extractDomain = (email: string): string | null => {
  const trimmed = email.trim().toLowerCase()
  const at = trimmed.lastIndexOf("@")
  if (at === -1 || at === trimmed.length - 1) {
    return null
  }
  return trimmed.slice(at + 1)
}

const isAllowedDomain = (domain: string | null): boolean => {
  if (!domain) {
    return false
  }

  const allowed = redingtonConfig.guestUsers.allowedDomains ?? []
  if (!allowed.length) {
    return true
  }

  return allowed
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .includes(domain.toLowerCase())
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const body = (req.body || {}) as GuestVerifyRequest
  const email = (body.email || "").trim().toLowerCase()

  if (!email) {
    return res.status(400).json([
      {
        status: "error",
        message: "email is required",
      },
    ])
  }

  const domain = extractDomain(email)
  if (!isAllowedDomain(domain)) {
    await recordGuestUserAudit({
      email,
      success: false,
      message: "Domain is not allowed for guest access.",
      metadata: { domain },
    })

    return res.status(403).json([
      {
        status: "error",
        message: "Email domain is not permitted for guest access.",
      },
    ])
  }

  // ensure guest token table exists because the follow-up flow depends on it
  await ensureRedingtonGuestTokenTable()

  const sapClient = createSapClient()
  let success = false
  let message = "Email verified."
  let sapPayload: Record<string, unknown> | undefined
  let sapCustomerCode: string | null = null

  try {
    const response = await sapClient.createCustomer(email)
    sapPayload = response.data ?? {}

    const status =
      typeof response.data === "object" && response.data
        ? (response.data.Status ??
            response.data.status ??
            response.data.result ??
            response.data.Result ??
            "")
        : ""

    const normalizedStatus = typeof status === "string" ? status.toUpperCase() : ""

    success = normalizedStatus === "PASS" || normalizedStatus === "SUCCESS"
    const potentialCode =
      response.data?.CustomerCode ??
      response.data?.customerCode ??
      response.data?.customer_code ??
      response.data?.customerid ??
      response.data?.CustomerID
    if (typeof potentialCode === "string" && potentialCode.trim().length) {
      sapCustomerCode = potentialCode.trim()
    }
    if (success) {
      message = "Email verified and customer synced with SAP."
    } else if (normalizedStatus) {
      message = `Email verified but SAP returned status ${normalizedStatus}.`
    }
  } catch (error: any) {
    message =
      error?.response?.data?.message ||
      error?.message ||
      "Unexpected error while verifying guest user."
    sapPayload = {
      error: true,
      message,
      status: error?.response?.status,
    }
  }

  try {
    await upsertRedingtonCustomerSync({
      email,
      sapSync: success,
      sapCustomerCode,
    })
  } catch (syncError) {
    console.warn("Failed to upsert SAP customer sync state", syncError)
  }

  await recordGuestUserAudit({
    email,
    success,
    message,
    metadata: {
      domain,
      sap_response: sapPayload,
    },
  })

  if (!success) {
    return res.status(502).json([
      {
        status: "error",
        message,
      },
    ])
  }

  return res.json([
    {
      status: "success",
      message,
    },
  ])
}
