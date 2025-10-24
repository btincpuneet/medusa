export type LoginMode = "admin" | "partner"

const PARAM_KEY = "mode"

export const getRequestedLoginMode = (): LoginMode => {
  if (typeof window === "undefined") {
    return "admin"
  }

  const url = new URL(window.location.href)
  const mode = (url.searchParams.get(PARAM_KEY) || "").toLowerCase()
  return mode === "partner" ? "partner" : "admin"
}

export const setRequestedLoginMode = (mode: LoginMode) => {
  if (typeof window === "undefined") {
    return
  }

  const url = new URL(window.location.href)
  if (mode === "admin") {
    url.searchParams.delete(PARAM_KEY)
  } else {
    url.searchParams.set(PARAM_KEY, mode)
  }

  window.history.replaceState({}, "", url)
}
