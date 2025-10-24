import React from "react"

type PlaceholderPageProps = {
  title: string
  description?: React.ReactNode
  children?: React.ReactNode
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "32px auto",
        padding: "32px",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 6px 20px rgba(15, 23, 42, 0.08)",
        border: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            style={{
              margin: "12px 0 0 0",
              fontSize: 16,
              lineHeight: 1.6,
              color: "#475569",
            }}
          >
            {description}
          </p>
        )}
      </div>

      {children && (
        <div
          style={{
            padding: "20px",
            borderRadius: 10,
            background: "#f8fafc",
            border: "1px dashed #cbd5f5",
            color: "#1e293b",
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          {children}
        </div>
      )}

      <div
        style={{
          padding: "16px 20px",
          borderRadius: 10,
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          color: "#1d4ed8",
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        This view is a placeholder. Hook it up to the relevant Medusa APIs and
        design components as you flesh out the feature.
      </div>
    </div>
  )
}

export default PlaceholderPage
