import { apiFetch } from './client'
import type { Meeting, MeetingInput, MeetingStatus, MeetingSummary } from '../types'

export interface MeetingFilters {
  search?: string
  status?: MeetingStatus
  /** ISO dates; the API filters on the meeting date inclusively. */
  from?: string
  to?: string
}

export function listMeetings(filters: MeetingFilters = {}): Promise<MeetingSummary[]> {
  const params = new URLSearchParams()
  if (filters.search?.trim()) params.set('search', filters.search.trim())
  if (filters.status) params.set('status', filters.status)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  const query = params.toString()
  return apiFetch<MeetingSummary[]>(`/api/meetings${query ? `?${query}` : ''}`)
}

export function getMeeting(id: number): Promise<Meeting> {
  return apiFetch<Meeting>(`/api/meetings/${id}`)
}

export function createMeeting(input: MeetingInput): Promise<Meeting> {
  return apiFetch<Meeting>('/api/meetings', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateMeeting(id: number, input: MeetingInput): Promise<Meeting> {
  return apiFetch<Meeting>(`/api/meetings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteMeeting(id: number): Promise<void> {
  return apiFetch<void>(`/api/meetings/${id}`, { method: 'DELETE' })
}
