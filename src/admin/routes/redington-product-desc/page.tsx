import { defineRouteConfig } from "@medusajs/admin-sdk"
import React from "react"

import PlaceholderPage from "../../utils/placeholder-page"

const ProductDescPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Product Description Import"
      description="Upload the ZIP/CSV bundles used to enrich product descriptions."
    >
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        <li>
          Mirror Magento’s ZIP importer (see `Redington_ProductDesc` controller)
          using a Medusa script or UI flow.
        </li>
        <li>
          Store imported files temporarily and update Medusa product descriptions
          via the product service.
        </li>
        <li>
          Provide audit logs/status per upload job for support teams.
        </li>
      </ul>
    </PlaceholderPage>
  )
}

export const config = defineRouteConfig({})

export default ProductDescPage
