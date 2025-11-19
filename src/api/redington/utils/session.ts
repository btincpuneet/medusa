import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import type { CookieOptions } from "express"

import {
  CUSTOMER_SESSION_COOKIE,
  verifyCustomerToken,
  type CustomerSessionPayload,
} from "../../utils/legacy-auth"

const COOKIE_NAME = CUSTOMER_SESSION_COOKIE
const DEFAULT_MAX_AGE = 24 * 60 * 60 * 1000 // 1 day fallback

type RequestWithCookies = MedusaRequest & {
  cookies?: Record<string, string>
  session?: Record<string, unknown>
}

type ResponseWithCookies = MedusaResponse & {
  cookie?: (name: string, value: string, options: CookieOptions) => void
  clearCookie?: (name: string, options: CookieOptions) => void
}

const resolveSecureFlag = () => {
  const secureEnv = process.env.CUSTOMER_SESSION_SECURE?.toLowerCase()
  if (secureEnv === "true") {
    return true
  }
  if (secureEnv === "false") {
    return false
  }
  return process.env.NODE_ENV === "production"
}

const resolveSameSite = (secure: boolean): CookieOptions["sameSite"] => {
  const configured = process.env.CUSTOMER_SESSION_SAMESITE?.toLowerCase()
  if (configured === "strict" || configured === "lax") {
    return configured
  }
  if (configured === "none" && secure) {
    return "none"
  }
  if (secure) {
    return "none"
  }
  return "lax"
}

const resolveMaxAge = () => {
  const raw = process.env.CUSTOMER_SESSION_MAX_AGE_MS
  const parsed = raw ? Number(raw) : NaN
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed)
  }
  return DEFAULT_MAX_AGE
}

const COOKIE_OPTIONS: CookieOptions = (() => {
  const secure = resolveSecureFlag()
  const sameSite = resolveSameSite(secure)
  const maxAge = resolveMaxAge()

  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge,
    path: "/",
  }
})()

const readTokenFromRequest = (req: RequestWithCookies): string | null => {
  const cookieToken = req.cookies?.[COOKIE_NAME]
  if (cookieToken) {
    return cookieToken
  }

  const authHeader =
    typeof req.headers["authorization"] === "string"
      ? req.headers["authorization"].trim()
      : ""

  if (authHeader) {
    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i)
    if (bearerMatch) {
      return bearerMatch[1].trim()
    }
    return authHeader
  }

  const sessionToken = req.session?.["customer_token"]
  if (typeof sessionToken === "string") {
    return sessionToken
  }

  return null
}

export type RedingtonCustomerSession = CustomerSessionPayload & {
  email: string
}

export const getCustomerSession = (
  req: MedusaRequest
): RedingtonCustomerSession | null => {
  const token = readTokenFromRequest(req as RequestWithCookies)
  const payload = verifyCustomerToken(token)

  if (!payload || typeof payload.email !== "string") {
    return null
  }

  if (payload.actor_type && payload.actor_type !== "customer") {
    return null
  }

  return {
    ...payload,
    email: payload.email,
  }
}

export const requireCustomerSession = (
  req: MedusaRequest
): RedingtonCustomerSession => {
  const session = getCustomerSession(req)

  if (!session) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Customer session is missing or invalid."
    )
  }

  return session
}

export const persistCustomerSession = (
  res: MedusaResponse,
  token: string
) => {
  const response = res as ResponseWithCookies
  if (typeof response.cookie === "function") {
    response.cookie(COOKIE_NAME, token, COOKIE_OPTIONS)
    return
  }

  const cookieString = `${COOKIE_NAME}=${token}; Max-Age=${COOKIE_OPTIONS.maxAge}; Path=/; HttpOnly${
    COOKIE_OPTIONS.secure ? "; Secure" : ""
  }${
    COOKIE_OPTIONS.sameSite ? `; SameSite=${COOKIE_OPTIONS.sameSite}` : ""
  }`
  res.setHeader("Set-Cookie", cookieString)
}

export const clearCustomerSession = (res: MedusaResponse) => {
  const response = res as ResponseWithCookies
  if (typeof response.clearCookie === "function") {
    response.clearCookie(COOKIE_NAME, {
      ...COOKIE_OPTIONS,
      maxAge: 0,
    })
    return
  }

  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly${
      COOKIE_OPTIONS.secure ? "; Secure" : ""
    }`
  )
}
