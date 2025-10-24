import { defineRouteConfig } from "@medusajs/admin-sdk"
import React from "react"

import PlaceholderPage from "../../utils/placeholder-page"

const OrderReturnsPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Order Return Management"
      description="List, approve, and track order return requests previously managed through Magento."
    >
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        <li>
          Target table: <code>redington_order_return</code> (backfilled via the
          migration script).
        </li>
        <li>
          Wire Medusa REST endpoints mirroring Magento’s returnView / request
          / check APIs.
        </li>
        <li>
          Reuse Medusa notification system to send admin/customer emails based
          on status changes.
        </li>
      </ul>
    </PlaceholderPage>
  )
}

export const config = defineRouteConfig({})

export default OrderReturnsPage
