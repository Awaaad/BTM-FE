import { apiFetch, tokenStore } from './client'
import type { AuthResponse, User } from '../types'

export interface RegisterData {
  firstName: string
  lastName: string
  username: string
  email: string
  password: string
}

/** identifier is a username or an email address. */
export async function login(identifier: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  })
  tokenStore.set(data.accessToken, data.refreshToken)
  return data
}

export async function register(details: RegisterData): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(details),
  })
  tokenStore.set(data.accessToken, data.refreshToken)
  return data
}

export async function logout(): Promise<void> {
  const refreshToken = tokenStore.getRefreshToken()
  if (refreshToken) {
    // Best effort — the server revokes the token; local state is cleared regardless.
    try {
      await apiFetch<void>('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      })
    } catch {
      // ignore
    }
  }
  tokenStore.clear()
}

export function fetchCurrentUser(): Promise<User> {
  return apiFetch<User>('/api/auth/me')
}
