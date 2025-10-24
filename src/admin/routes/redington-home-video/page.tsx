import { defineRouteConfig } from "@medusajs/admin-sdk"
import React from "react"

import PlaceholderPage from "../../utils/placeholder-page"

const HomeVideoPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Home Video"
      description="Upload and curate Home page videos mirrored from Magento’s Redington_HomeVideo module."
    >
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        <li>
          Backed by the <code>redington_home_video</code> table (created via{" "}
          <code>ensureRedingtonHomeVideoTable</code>).
        </li>
        <li>
          Plan admin CRUD endpoints and connect this view to the Medusa APIs to
          manage video URLs, titles, and status.
        </li>
        <li>
          Expose a storefront carousel component to consume the same dataset.
        </li>
      </ul>
    </PlaceholderPage>
  )
}

export const config = defineRouteConfig({})

export default HomeVideoPage
