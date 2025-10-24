import { defineRouteConfig } from "@medusajs/admin-sdk"
import React from "react"

import PlaceholderPage from "../../utils/placeholder-page"

const GuestUserRegisterPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Guest User Register"
      description="Manage guest user verification flows, domain access policies, and SAP sync outcomes."
    >
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        <li>
          Use <code>/rest/V1/guestuser/guestuserverify</code> to trigger SAP guest
          verification.
        </li>
        <li>
          `/rest/V1/redington/allowed_domains` exposes the combined list of
          allowed domains for the storefront.
        </li>
        <li>
          Audit entries are written to the <code>redington_guest_user_audit</code>{" "}
          table via <code>recordGuestUserAudit</code>.
        </li>
      </ul>
    </PlaceholderPage>
  )
}

export const config = defineRouteConfig({})

export default GuestUserRegisterPage
