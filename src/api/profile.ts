import { apiFetch, tokenStore } from './client'
import type { AuthResponse } from '../types'
import type { MemberDetailsInput } from './users'

/**
 * Both calls return a fresh token pair: changing a username or password ends
 * every session, and these keep the current device signed in.
 */
async function storeAndReturn(response: AuthResponse): Promise<AuthResponse> {
  tokenStore.set(response.accessToken, response.refreshToken)
  return response
}

export async function updateOwnDetails(details: MemberDetailsInput): Promise<AuthResponse> {
  return storeAndReturn(
    await apiFetch<AuthResponse>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(details),
    }),
  )
}

export async function changeOwnPassword(
  currentPassword: string,
  newPassword: string,
): Promise<AuthResponse> {
  return storeAndReturn(
    await apiFetch<AuthResponse>('/api/profile/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  )
}
