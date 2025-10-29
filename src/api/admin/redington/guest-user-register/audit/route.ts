import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import {
  listGuestUserAudits,
  type GuestUserAuditRow,
} from "../../../../../lib/pg"

const clampLimit = (value: unknown, fallback = 25) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return Math.min(Math.trunc(parsed), 100)
}

const clampOffset = (value: unknown) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }
  return Math.trunc(parsed)
}

type GuestAuditQuery = {
  email?: string
  success?: string
  limit?: string
  offset?: string
}

type GuestAuditResponse = {
  audits: GuestUserAuditRow[]
  count: number
  limit: number
  offset: number
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse<GuestAuditResponse>
) => {
  const query = (req.query || {}) as GuestAuditQuery

  const limit = clampLimit(query.limit)
  const offset = clampOffset(query.offset)

  let success: boolean | null = null
  if (typeof query.success === "string" && query.success.trim().length) {
    const normalized = query.success.trim().toLowerCase()
    if (["true", "1", "yes", "success"].includes(normalized)) {
      success = true
    } else if (["false", "0", "no", "fail", "error"].includes(normalized)) {
      success = false
    }
  }

  const [audits, count] = await listGuestUserAudits({
    email: query.email,
    success,
    limit,
    offset,
  })

  res.json({
    audits,
    count,
    limit,
    offset,
  })
}

