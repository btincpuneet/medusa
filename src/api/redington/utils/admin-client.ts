import { MedusaError } from "@medusajs/framework/utils"

type FetchInit = Parameters<typeof fetch>[1]
type FetchResponse = Awaited<ReturnType<typeof fetch>>

const ADMIN_BASE_URL = (
  process.env.MEDUSA_ADMIN_URL ||
  process.env.MEDUSA_BASE_URL ||
  process.env.MEDUSA_BACKEND_URL ||
  "http://localhost:9000"
)
  .trim()
  .replace(/\/+$/, "")

const ADMIN_TOKEN = (
  process.env.MEDUSA_ADMIN_TOKEN ||
  process.env.MEDUSA_ADMIN_API_KEY ||
  process.env.MEDUSA_SECRET_API_KEY ||
  ""
).trim()

const ensureAdminToken = () => {
  if (!ADMIN_TOKEN) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Missing MEDUSA_ADMIN_TOKEN environment variable."
    )
  }
}

const buildUrl = (path: string) => {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${ADMIN_BASE_URL}${normalized}`
}

const normalizeHeaders = (init?: FetchInit) => {
  const headers: Record<string, string> = {}
  const raw = init?.headers

  const assignHeader = (key: string, value: string) => {
    headers[key] = value
  }

  if (raw) {
    if (Array.isArray(raw)) {
      raw.forEach(([key, value]) => assignHeader(key, String(value)))
    } else if (typeof (raw as any)?.forEach === "function") {
      ;(raw as any).forEach((value: string, key: string) =>
        assignHeader(key, value)
      )
    } else {
      Object.entries(raw as Record<string, string | number>).forEach(
        ([key, value]) => assignHeader(key, String(value))
      )
    }
  }

  if (!headers["Accept"]) {
    headers["Accept"] = "application/json"
  }

  headers["Authorization"] = `Bearer ${ADMIN_TOKEN}`
  headers["x-medusa-access-token"] = ADMIN_TOKEN

  if (init?.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json"
  }

  return headers
}

const parseResponseBody = async (response: FetchResponse) => {
  const contentType = response.headers?.get?.("content-type") || ""
  if (contentType.includes("application/json")) {
    return response.json().catch(() => undefined)
  }

  const text = await response.text().catch(() => "")
  if (!text) {
    return undefined
  }

  try {
    return JSON.parse(text)
  } catch (_) {
    return text
  }
}

export const adminFetch = async <T = any>(
  path: string,
  init?: FetchInit
): Promise<T> => {
  ensureAdminToken()

  const response = await fetch(buildUrl(path), {
    ...init,
    headers: normalizeHeaders(init),
  })

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "message" in payload
        ? (payload as Record<string, any>).message
        : undefined) ||
      `Admin request failed with status ${response.status}`

    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, message)
  }

  return payload as T
}
