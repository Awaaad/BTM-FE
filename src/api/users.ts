import { apiFetch } from './client'
import type { Member, Role } from '../types'

export interface MemberDetailsInput {
  firstName: string
  lastName: string
  username: string
  email: string
}

export function listMembers(): Promise<Member[]> {
  return apiFetch<Member[]>('/api/users')
}

export function updateMember(userId: number, details: MemberDetailsInput): Promise<Member> {
  return apiFetch<Member>(`/api/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(details),
  })
}

/** Admin reset — signs the member out of any existing session. */
export function resetPassword(userId: number, newPassword: string): Promise<void> {
  return apiFetch<void>(`/api/users/${userId}/password`, {
    method: 'PUT',
    body: JSON.stringify({ newPassword }),
  })
}

export function updateRole(userId: number, role: Role): Promise<Member> {
  return apiFetch<Member>(`/api/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
}

export function updateStatus(userId: number, enabled: boolean): Promise<Member> {
  return apiFetch<Member>(`/api/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  })
}
