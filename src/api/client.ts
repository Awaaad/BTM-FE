import type { ApiError, AuthResponse } from '../types'

const ACCESS_TOKEN_KEY = 'btm.accessToken'
const REFRESH_TOKEN_KEY = 'btm.refreshToken'

export const tokenStore = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  set(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

export class ApiRequestError extends Error {
  status: number
  errors?: Record<string, string>

  constructor(status: number, message: string, errors?: Record<string, string>) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

/** Called when the session can no longer be refreshed; wired up by AuthContext. */
let onSessionExpired: (() => void) | null = null
export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler
}

// Single-flight refresh: concurrent 401s share one refresh request so the
// single-use refresh token is not burned twice.
let refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = tokenStore.getRefreshToken()
      if (!refreshToken) return false
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!response.ok) return false
      const data: AuthResponse = await response.json()
      tokenStore.set(data.accessToken, data.refreshToken)
      return true
    })().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

async function parseError(response: Response): Promise<ApiRequestError> {
  try {
    const body: ApiError = await response.json()
    return new ApiRequestError(response.status, body.message, body.errors)
  } catch {
    return new ApiRequestError(response.status, `Request failed (${response.status})`)
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const doFetch = () => {
    const headers = new Headers(options.headers)
    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    const accessToken = tokenStore.getAccessToken()
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }
    return fetch(path, { ...options, headers })
  }

  let response = await doFetch()

  if (response.status === 401 && tokenStore.getRefreshToken()) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      response = await doFetch()
    } else {
      tokenStore.clear()
      onSessionExpired?.()
    }
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }
  return response.json() as Promise<T>
}
