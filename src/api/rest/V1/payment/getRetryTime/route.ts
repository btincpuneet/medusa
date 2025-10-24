import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  findAccessMappingByAccessId,
  findRetainCartConfigByDomainId,
  ensureRedingtonRetainCartConfigTable,
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

type RetryTimeBody = {
  access_id?: string
  company_code?: string
}

const DEFAULT_RETRY_TIME = "02:00:00"

const normalizeString = (value?: string | null): string | null => {
  if (typeof value !== "string") {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const body = (req.body || {}) as RetryTimeBody
  const accessId = normalizeString(body.access_id)
  const companyCode = normalizeString(body.company_code)

  await ensureRedingtonRetainCartConfigTable()

  if (!accessId || !companyCode) {
    return res.status(400).json([
      {
        success: false,
        message: "access_id and company_code are required.",
      },
    ])
  }

  const accessMapping = await findAccessMappingByAccessId(accessId, {
    companyCode,
  })

  let domainId = accessMapping?.domain_id ?? null
  if (domainId !== null && !Number.isFinite(domainId)) {
    domainId = null
  }

  const config = await findRetainCartConfigByDomainId(domainId)

  const retryTime = config?.retry_time ?? DEFAULT_RETRY_TIME

  return res.json([
    {
      success: true,
      data: [
        {
          retry_time: retryTime,
          domain_id: domainId,
          source: config ? "config" : "default",
        },
      ],
    },
  ])
}
