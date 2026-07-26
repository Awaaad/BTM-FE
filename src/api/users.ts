import { apiFetch } from './client'
import type { Member, Role } from '../types'

export function listMembers(): Promise<Member[]> {
  return apiFetch<Member[]>('/api/users')
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
