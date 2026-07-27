import { apiFetch } from './client'
import type { Note, NoteInput } from '../types'

export interface NoteFilters {
  date?: string
  meetingId?: number
  search?: string
}

export function listNotes(filters: NoteFilters = {}): Promise<Note[]> {
  const params = new URLSearchParams()
  if (filters.date) params.set('date', filters.date)
  if (filters.meetingId != null) params.set('meetingId', String(filters.meetingId))
  if (filters.search?.trim()) params.set('search', filters.search.trim())
  const query = params.toString()
  return apiFetch<Note[]>(`/api/notes${query ? `?${query}` : ''}`)
}

export function createNote(input: NoteInput): Promise<Note> {
  return apiFetch<Note>('/api/notes', { method: 'POST', body: JSON.stringify(input) })
}

export function updateNote(id: number, input: NoteInput): Promise<Note> {
  return apiFetch<Note>(`/api/notes/${id}`, { method: 'PUT', body: JSON.stringify(input) })
}

export function deleteNote(id: number): Promise<void> {
  return apiFetch<void>(`/api/notes/${id}`, { method: 'DELETE' })
}
