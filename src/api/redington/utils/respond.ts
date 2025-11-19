import type { MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

const statusByType: Record<string, number> = {
  [MedusaError.Types.INVALID_DATA]: 400,
  [MedusaError.Types.UNAUTHORIZED]: 401,
  [MedusaError.Types.NOT_ALLOWED]: 403,
  [MedusaError.Types.NOT_FOUND]: 404,
}

export const sendErrorResponse = (
  res: MedusaResponse,
  error: unknown,
  fallbackMessage: string
) => {
  if (error instanceof MedusaError) {
    const status = statusByType[error.type] || 500
    return res.status(status).json({ message: error.message })
  }

  if (error instanceof Error) {
    return res.status(500).json({ message: error.message })
  }

  return res.status(500).json({ message: fallbackMessage })
}
