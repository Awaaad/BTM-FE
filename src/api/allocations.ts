import { apiFetch } from './client'
import type { Allocation, AllocationInput, Cycle, CycleStatus } from '../types'

export function listCycles(): Promise<Cycle[]> {
  return apiFetch<Cycle[]>('/api/allocations/cycles')
}

export function getCycle(id: number): Promise<Cycle> {
  return apiFetch<Cycle>(`/api/allocations/cycles/${id}`)
}

export interface NewCycle {
  year: number
  month: number
  notes?: string
  /** Carries last month's recurring lines and their assigned members across. */
  copyFromCycleId?: number
}

export function createCycle(input: NewCycle): Promise<Cycle> {
  return apiFetch<Cycle>('/api/allocations/cycles', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateCycle(id: number, status?: CycleStatus, notes?: string): Promise<Cycle> {
  return apiFetch<Cycle>(`/api/allocations/cycles/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status, notes }),
  })
}

export function deleteCycle(id: number): Promise<void> {
  return apiFetch<void>(`/api/allocations/cycles/${id}`, { method: 'DELETE' })
}

export function addItem(cycleId: number, input: AllocationInput): Promise<Allocation> {
  return apiFetch<Allocation>(`/api/allocations/cycles/${cycleId}/items`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateItem(itemId: number, input: AllocationInput): Promise<Allocation> {
  return apiFetch<Allocation>(`/api/allocations/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteItem(itemId: number): Promise<void> {
  return apiFetch<void>(`/api/allocations/items/${itemId}`, { method: 'DELETE' })
}

export function markDelivered(itemId: number, note?: string): Promise<Allocation> {
  return apiFetch<Allocation>(`/api/allocations/items/${itemId}/delivered`, {
    method: 'POST',
    body: JSON.stringify({ note: note ?? null }),
  })
}

export function markNotDelivered(itemId: number): Promise<Allocation> {
  return apiFetch<Allocation>(`/api/allocations/items/${itemId}/not-delivered`, { method: 'POST' })
}

export function myTasks(pendingOnly = true): Promise<Allocation[]> {
  return apiFetch<Allocation[]>(`/api/allocations/my-tasks?pendingOnly=${pendingOnly}`)
}

export function pendingCount(): Promise<{ pendingDeliveries: number }> {
  return apiFetch<{ pendingDeliveries: number }>('/api/allocations/my-tasks/count')
}
