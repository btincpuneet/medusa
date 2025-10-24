import { defineRouteConfig } from "@medusajs/admin-sdk"
import React from "react"

import PlaceholderPage from "../../utils/placeholder-page"

const LogPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Log Viewer"
      description="View and download Magento-like log files directly from the Medusa deployment."
    >
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        <li>
          Plan endpoints such as <code>/admin/redington/logs</code> (list) and{" "}
          <code>/admin/redington/logs/:name</code> (tail/download).
        </li>
        <li>
          Implement server-side guardrails before exposing filesystem logs.
        </li>
        <li>
          Reuse Medusa admin UI patterns (tables, filters) once the backend is
          wired.
        </li>
      </ul>
    </PlaceholderPage>
  )
}

export const config = defineRouteConfig({})

export default LogPage
