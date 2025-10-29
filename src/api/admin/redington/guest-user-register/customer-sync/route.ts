import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import {
  listRedingtonCustomerSync,
  type CustomerSyncRow,
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

type CustomerSyncQuery = {
  email?: string
  sap_sync?: string
  limit?: string
  offset?: string
}

type CustomerSyncResponse = {
  records: CustomerSyncRow[]
  count: number
  limit: number
  offset: number
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse<CustomerSyncResponse>
) => {
  const query = (req.query || {}) as CustomerSyncQuery

  const limit = clampLimit(query.limit)
  const offset = clampOffset(query.offset)

  let sapSync: boolean | null = null
  if (typeof query.sap_sync === "string" && query.sap_sync.trim().length) {
    const normalized = query.sap_sync.trim().toLowerCase()
    if (["true", "1", "yes", "success"].includes(normalized)) {
      sapSync = true
    } else if (["false", "0", "no", "fail", "error"].includes(normalized)) {
      sapSync = false
    }
  }

  const [records, count] = await listRedingtonCustomerSync({
    email: query.email,
    sapSync,
    limit,
    offset,
  })

  res.json({
    records,
    count,
    limit,
    offset,
  })
}

