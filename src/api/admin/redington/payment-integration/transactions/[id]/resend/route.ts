import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import {
  resendPaymentSession,
  retrieveMpgsTransaction,
} from "../../../../../../../modules/redington-mpgs"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid transaction id" })
  }

  const transaction = await retrieveMpgsTransaction(id)
  if (!transaction) {
    return res.status(404).json({ message: "Transaction not found" })
  }

  const body = (req.body || {}) as {
    return_url?: string
    amount?: number
    currency?: string
    interaction_operation?: "PURCHASE" | "AUTHORIZE"
  }

  const returnUrl = body.return_url?.trim()
  if (!returnUrl) {
    return res.status(400).json({ message: "return_url is required" })
  }

  try {
    const result = await resendPaymentSession({
      scope: req.scope,
      orderRefId: transaction.order_ref_id,
      orderIncrementId: transaction.order_increment_id,
      returnUrl,
      amount: body.amount,
      currency: body.currency,
      interactionOperation: body.interaction_operation,
    })

    res.json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to resend payment link."
    res.status(400).json({ message })
  }
}

