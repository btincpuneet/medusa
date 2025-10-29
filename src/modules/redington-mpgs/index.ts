import { Modules } from "@medusajs/framework/utils"
import type { MedusaRequest } from "@medusajs/framework/http"
import type { OrderDTO } from "@medusajs/types"

import createMpgsClient from "../mpgs-client"
import {
  ensureRedingtonMpgsTransactionTable,
  getPgPool,
  mapMpgsTransactionRow,
  type MpgsTransactionRow,
} from "../../lib/pg"

const clampLimit = (value: unknown, fallback = 25, max = 100) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return Math.min(Math.trunc(parsed), max)
}

const clampOffset = (value: unknown) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }
  return Math.trunc(parsed)
}

const normalizeString = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim()
  }
  if (value === null || value === undefined) {
    return ""
  }
  return String(value).trim()
}

const normalizeOptional = (value: unknown): string | null => {
  const normalized = normalizeString(value)
  return normalized.length ? normalized : null
}

const toNumber = (value: any): number => {
  if (value === null || value === undefined) {
    return 0
  }
  if (typeof value === "number") {
    return value
  }
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  if (typeof value === "object") {
    if (value && typeof value.value === "string") {
      const parsed = Number(value.value)
      return Number.isFinite(parsed) ? parsed : 0
    }
    if (value && typeof value.amount === "string") {
      const parsed = Number(value.amount)
      return Number.isFinite(parsed) ? parsed : 0
    }
  }
  return 0
}

export type MpgsTransactionFilters = {
  order_ref_id?: string
  order_increment_id?: string
  session_id?: string
  transaction_reference?: string
  result_indicator?: string
  payment_status?: string
}

export const listMpgsTransactions = async (
  filters: Partial<MpgsTransactionFilters> = {},
  pagination: { limit?: number; offset?: number } = {}
): Promise<[MpgsTransactionRow[], number]> => {
  await ensureRedingtonMpgsTransactionTable()

  const conditions: string[] = []
  const params: Array<string> = []

  const pushCondition = (field: string, value?: string) => {
    if (!value) {
      return
    }
    params.push(value)
    conditions.push(`${field} = $${params.length}`)
  }

  pushCondition("order_ref_id", normalizeString(filters.order_ref_id))
  pushCondition("order_increment_id", normalizeString(filters.order_increment_id))
  pushCondition("session_id", normalizeString(filters.session_id))
  pushCondition("transaction_reference", normalizeString(filters.transaction_reference))
  pushCondition("result_indicator", normalizeString(filters.result_indicator))
  pushCondition("payment_status", normalizeString(filters.payment_status))

  const limit = clampLimit(pagination.limit, 25, 200)
  const offset = clampOffset(pagination.offset)

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : ""

  const listParams = [...params, limit, offset]
  const { rows } = await getPgPool().query(
    `
      SELECT id,
             order_ref_id,
             session_id,
             transaction_reference,
             order_increment_id,
             payment_status,
             session_version,
             result_indicator,
             order_status,
             transaction_receipt,
             created_at,
             updated_at
      FROM redington_mpgs_transaction
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT $${listParams.length - 1}
      OFFSET $${listParams.length}
    `,
    listParams
  )

  const countResult = await getPgPool().query(
    `
      SELECT COUNT(*) AS count
      FROM redington_mpgs_transaction
      ${whereClause}
    `,
    params
  )

  const count = Number(countResult.rows[0]?.count ?? 0)

  return [rows.map(mapMpgsTransactionRow), count]
}

export const retrieveMpgsTransaction = async (id: number) => {
  await ensureRedingtonMpgsTransactionTable()

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_mpgs_transaction
      WHERE id = $1
    `,
    [id]
  )

  return rows[0] ? mapMpgsTransactionRow(rows[0]) : null
}

export const retrieveMpgsTransactionBySession = async (sessionId: string) => {
  await ensureRedingtonMpgsTransactionTable()

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_mpgs_transaction
      WHERE session_id = $1
    `,
    [sessionId]
  )

  return rows[0] ? mapMpgsTransactionRow(rows[0]) : null
}

export type UpsertMpgsTransactionInput = {
  order_ref_id: string
  session_id: string
  transaction_reference: string
  order_increment_id: string
  payment_status?: string | null
  session_version?: string | null
  result_indicator?: string | null
  order_status?: string | null
  transaction_receipt?: string | null
}

export const upsertMpgsTransaction = async (
  input: UpsertMpgsTransactionInput
): Promise<MpgsTransactionRow> => {
  await ensureRedingtonMpgsTransactionTable()

  const createdAt = new Date().toISOString()

  const { rows } = await getPgPool().query(
    `
      INSERT INTO redington_mpgs_transaction (
        order_ref_id,
        session_id,
        transaction_reference,
        order_increment_id,
        payment_status,
        session_version,
        result_indicator,
        order_status,
        transaction_receipt,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)
      ON CONFLICT (session_id) DO UPDATE SET
        order_ref_id = EXCLUDED.order_ref_id,
        transaction_reference = EXCLUDED.transaction_reference,
        order_increment_id = EXCLUDED.order_increment_id,
        payment_status = EXCLUDED.payment_status,
        session_version = EXCLUDED.session_version,
        result_indicator = EXCLUDED.result_indicator,
        order_status = EXCLUDED.order_status,
        transaction_receipt = EXCLUDED.transaction_receipt,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `,
    [
      normalizeString(input.order_ref_id),
      normalizeString(input.session_id),
      normalizeString(input.transaction_reference),
      normalizeString(input.order_increment_id),
      normalizeOptional(input.payment_status),
      normalizeOptional(input.session_version),
      normalizeOptional(input.result_indicator),
      normalizeOptional(input.order_status),
      normalizeOptional(input.transaction_receipt),
      createdAt,
    ]
  )

  return mapMpgsTransactionRow(rows[0])
}

export const updateMpgsTransactionStatus = async (
  sessionId: string,
  updates: Partial<Pick<UpsertMpgsTransactionInput, "payment_status" | "result_indicator" | "order_status" | "transaction_receipt" | "session_version">>
) => {
  await ensureRedingtonMpgsTransactionTable()

  const fields: string[] = []
  const params: Array<string | null> = []

  const push = (column: string, value: unknown) => {
    params.push(normalizeOptional(value))
    fields.push(`${column} = $${params.length}`)
  }

  if (updates.payment_status !== undefined) {
    push("payment_status", updates.payment_status)
  }
  if (updates.result_indicator !== undefined) {
    push("result_indicator", updates.result_indicator)
  }
  if (updates.order_status !== undefined) {
    push("order_status", updates.order_status)
  }
  if (updates.transaction_receipt !== undefined) {
    push("transaction_receipt", updates.transaction_receipt)
  }
  if (updates.session_version !== undefined) {
    push("session_version", updates.session_version)
  }

  if (!fields.length) {
    return null
  }

  params.push(normalizeString(sessionId))

  const { rows } = await getPgPool().query(
    `
      UPDATE redington_mpgs_transaction
      SET ${fields.join(", ")},
          updated_at = NOW()
      WHERE session_id = $${params.length}
      RETURNING *
    `,
    params
  )

  return rows[0] ? mapMpgsTransactionRow(rows[0]) : null
}

const resolveOrderAmount = (order: OrderDTO | null | undefined) => {
  if (!order) {
    return { amount: 0, currency: "" }
  }

  const summary = (order as any)?.summary
  const amount =
    toNumber(summary?.total) ||
    toNumber(order.item_total) ||
    toNumber(order.original_item_total)

  return {
    amount,
    currency: order.currency_code || "",
  }
}

export type ResendPaymentSessionOptions = {
  scope: MedusaRequest["scope"]
  orderRefId: string
  orderIncrementId?: string | null
  amount?: number
  currency?: string
  returnUrl: string
  interactionOperation?: "PURCHASE" | "AUTHORIZE"
}

export const resendPaymentSession = async (
  options: ResendPaymentSessionOptions
) => {
  const {
    scope,
    orderRefId,
    orderIncrementId,
    returnUrl,
    amount,
    currency,
    interactionOperation = "PURCHASE",
  } = options

  const orderModule = scope.resolve(Modules.ORDER) as any

  let order: OrderDTO | null = null
  try {
    order = await orderModule.retrieve(orderRefId, {
      select: ["id", "currency_code", "summary", "item_total", "original_item_total", "metadata"],
    })
  } catch (_) {
    order = null
  }

  const resolved = resolveOrderAmount(order)
  const resolvedAmount = amount ?? resolved.amount
  const resolvedCurrency = currency ?? resolved.currency

  if (!resolvedCurrency) {
    throw new Error("Unable to determine order currency.")
  }

  if (!resolvedAmount || resolvedAmount <= 0) {
    throw new Error("Unable to determine order amount. Provide amount explicitly.")
  }

  const client = createMpgsClient()

  const sanitizedOrderIncrement =
    orderIncrementId ||
    (order?.metadata &&
      (order.metadata as Record<string, any>)?.order_increment_id) ||
    orderRefId

  const transactionReference = `txn-${sanitizedOrderIncrement}-${Date.now()}`

  const response = await client.createCheckoutSession({
    amount: Number(resolvedAmount.toFixed(2)),
    currency: resolvedCurrency,
    orderId: sanitizedOrderIncrement,
    orderReference: orderRefId,
    transactionReference,
    returnUrl,
    interactionOperation,
  })

  const data = response.data ?? {}
  const session = data.session ?? data
  const sessionId = session?.id ?? data.sessionId
  if (!sessionId) {
    throw new Error("MPGS response missing session id.")
  }
  const sessionVersion = session?.version ?? data.sessionVersion ?? null
  const resultIndicator =
    data.successIndicator ??
    data.resultIndicator ??
    session?.resultIndicator ??
    null

  const transaction = await upsertMpgsTransaction({
    order_ref_id: orderRefId,
    session_id: sessionId,
    transaction_reference: transactionReference,
    order_increment_id: sanitizedOrderIncrement,
    payment_status: "pending",
    session_version: sessionVersion ? String(sessionVersion) : null,
    result_indicator: resultIndicator ? String(resultIndicator) : null,
    order_status: null,
    transaction_receipt: null,
  })

  return {
    transaction,
    session: {
      id: sessionId,
      version: sessionVersion,
      result_indicator: resultIndicator,
    },
    raw: data,
  }
}
