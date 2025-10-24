import { defineRouteConfig } from "@medusajs/admin-sdk"
import React from "react"

import PlaceholderPage from "../../utils/placeholder-page"

const PaymentIntegrationPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Payment Integration"
      description="Monitor MPGS session creation, status polling, and fallback behaviour."
    >
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        <li>
          Core tables/APIs: <code>redington_mpgs_transaction</code>, MPGS client
          in <code>src/modules/mpgs-client</code>.
        </li>
        <li>
          Add admin tools to search by order/session and resend payment links.
        </li>
        <li>
          Surface result indicators, retries, and failure reasons for support teams.
        </li>
      </ul>
    </PlaceholderPage>
  )
}

export const config = defineRouteConfig({})

export default PaymentIntegrationPage
