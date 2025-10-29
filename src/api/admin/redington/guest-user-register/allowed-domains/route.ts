import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { collectAllowedGuestDomains } from "../../../../../modules/redington-guest-user"

export const GET = async (
  _req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const summary = await collectAllowedGuestDomains()
    res.json({
      allowed_domains: summary.allowed,
      config_domains: summary.config,
      database_domains: summary.database,
      domain_extensions: summary.extensions,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load allowed domains."
    res.status(500).json({ message })
  }
}

