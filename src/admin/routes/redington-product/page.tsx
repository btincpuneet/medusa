import { defineRouteConfig } from "@medusajs/admin-sdk"
import React from "react"

import PlaceholderPage from "../../utils/placeholder-page"

const ProductModulePage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Product Enhancements"
      description="Manage Redington-specific product metadata such as company code and distribution channel."
    >
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        <li>
          Attribute migration handled via `redington_product` module (company_code,
          distribution_channel).
        </li>
        <li>
          Add UI controls to edit/view the additional metadata within Medusa’s
          product forms.
        </li>
        <li>
          Trigger SAP sync hooks (`createProduct` from `sap-client`) when values
          change.
        </li>
      </ul>
    </PlaceholderPage>
  )
}

export const config = defineRouteConfig({})

export default ProductModulePage
