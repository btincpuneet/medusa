import { defineWidgetConfig } from "@medusajs/admin-sdk"
import React, { useEffect, useState } from "react"

import {
  getRequestedLoginMode,
  setRequestedLoginMode,
  type LoginMode,
} from "../utils/login-mode"

const LoginModeToggle: React.FC = () => {
  const [mode, setMode] = useState<LoginMode>("admin")

  useEffect(() => {
    setMode(getRequestedLoginMode())
  }, [])

  const updateMode = (next: LoginMode) => {
    setMode(next)
    setRequestedLoginMode(next)
  }

  return (
    <div style={containerStyle}>
      <span style={titleStyle}>Continue as:</span>
      <div style={optionsStyle}>
        <label style={optionStyle}>
          <input
            type="radio"
            name="redington-login-mode"
            value="admin"
            checked={mode === "admin"}
            onChange={() => updateMode("admin")}
          />
          <span>Admin</span>
        </label>
        <label style={optionStyle}>
          <input
            type="radio"
            name="redington-login-mode"
            value="partner"
            checked={mode === "partner"}
            onChange={() => updateMode("partner")}
          />
          <span>Partner</span>
        </label>
      </div>
      <p style={helperStyle}>
        Choose <strong>Partner</strong> if you have a partner role assigned; otherwise use{" "}
        <strong>Admin</strong>.
      </p>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  marginTop: 16,
  padding: 16,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  background: "#f9fafb",
  display: "flex",
  flexDirection: "column",
  gap: 12,
}

const titleStyle: React.CSSProperties = {
  fontWeight: 600,
  color: "#111827",
}

const optionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 16,
}

const optionStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "#1f2937",
}

const helperStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: "#4b5563",
}

export const config = defineWidgetConfig({
  zone: "login.after",
})

export default LoginModeToggle
