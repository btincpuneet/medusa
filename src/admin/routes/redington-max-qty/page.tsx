import { defineRouteConfig } from "@medusajs/admin-sdk"
import React from "react"

import PlaceholderPage from "../../utils/placeholder-page"

const MaxQtyPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Max Qty Rules"
      description="Configure per-domain/category max quantity policies mirrored from Magento’s MaxQtyCheck module."
    >
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        <li>
          Backend tables: <code>redington_max_qty_rule</code>,{" "}
          <code>redington_max_qty_category</code>,{" "}
          <code>redington_order_quantity_tracker</code>.
        </li>
        <li>
          Add CRUD endpoints plus enforcement middleware for carts/orders.
        </li>
        <li>
          Provide import/export actions to backfill rules migrated from Magento.
        </li>
      </ul>
    </PlaceholderPage>
  )
}

export const config = defineRouteConfig({})

export default MaxQtyPage
