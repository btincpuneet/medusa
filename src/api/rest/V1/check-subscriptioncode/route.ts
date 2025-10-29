import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonSubscriptionCodeTable,
  findActiveSubscriptionCode,
  findAccessMappingByAccessId,
} from "../../../../lib/pg"

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

type SubscriptionCodeBody = {
  email?: string
  subscription_code?: string
  subscriptionCode?: string
}

const buildResponse = (payload: Record<string, unknown>) => [
  {
    data: payload,
  },
]

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  await ensureRedingtonSubscriptionCodeTable()

  const body = (req.body || {}) as SubscriptionCodeBody
  const email = (body.email || "").trim().toLowerCase()
  const subscriptionCode =
    (body.subscription_code || body.subscriptionCode || "").trim()

  if (!email || !subscriptionCode) {
    return res.json(
      buildResponse({
        data: "",
        status: "failed",
        message: "Please provide the Subscription Code and Email",
      })
    )
  }

  const record = await findActiveSubscriptionCode({ email, subscriptionCode })

  if (!record) {
    return res.json(
      buildResponse({
        subscription_code: subscriptionCode,
        status: "failed",
        message: "Subscription Code or Email not found or not match",
      })
    )
  }

  const accessMapping = await findAccessMappingByAccessId(record.access_id, {
    companyCode: record.company_code,
  })

  return res.json(
    buildResponse({
      subscription_code: record.subscription_code,
      company_code: record.company_code,
      access_id: record.access_id,
      mobile_ext: accessMapping?.mobile_ext ?? null,
      status: "success",
      message: "",
    })
  )
}
