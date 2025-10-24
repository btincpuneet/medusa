import { defineRouteConfig } from "@medusajs/admin-sdk"
import React from "react"

import PlaceholderPage from "../../utils/placeholder-page"

const OutOfStockEnquiryPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Out-of-Stock Product Enquiries"
      description="Review and action customer requests captured through the OutOfStockProductEnquiry module."
    >
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        <li>
          Data source: <code>redington_product_enquiry</code> (mirrors Magento
          `redington_outofstockproductenquiry_productenquiry`).
        </li>
        <li>
          Add CRUD endpoints for admins and customer-facing history.
        </li>
        <li>
          Integrate email templates for notify-me / support workflows.
        </li>
      </ul>
    </PlaceholderPage>
  )
}

export const config = defineRouteConfig({})

export default OutOfStockEnquiryPage
