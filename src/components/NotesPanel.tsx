import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiRequestError } from '../api/client'
import * as api from '../api/notes'
import { formatMeetingDate } from '../meetings'
import { DateField } from './DateTimeField'
import Icon from './Icon'
import type { Note, NoteInput } from '../types'

interface Props {
  /** When set, the panel only handles notes for that meeting. */
  meetingId?: number
  /** Default date for new notes (the meeting date, or today). */
  defaultDate: string
  /** Adds a search box and shows which meeting each note belongs to. */
  standalone?: boolean
  /** Hide the panel's own add button when the page supplies one. */
  externalTrigger?: boolean
  /** Lets the page hide its add button while the form is open. */
  onFormOpenChange?: (open: boolean) => void
}

/** Lets a page open the compose form from its own header button or FAB. */
export interface NotesPanelHandle {
  startNewNote: () => void
}

function emptyForm(date: string, meetingId?: number): NoteInput {
  return { noteDate: date, title: '', body: '', meetingId: meetingId ?? null }
}

/**
 * Private notes. Used both on its own page and inside a meeting, so the
 * meeting-specific bits are optional.
 */
const NotesPanel = forwardRef<NotesPanelHandle, Props>(function NotesPanel(
  { meetingId, defaultDate, standalone, externalTrigger, onFormOpenChange },
  ref,
) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [composing, setComposing] = useState(false)
  const [form, setForm] = useState<NoteInput>(() => emptyForm(defaultDate, meetingId))
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const inFlight = useRef(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      setNotes(
        await api.listNotes({
          meetingId,
          search: standalone ? search : undefined,
          date: standalone && dateFilter ? dateFilter : undefined,
        }),
      )
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to load your notes')
    } finally {
      setLoading(false)
    }
  }, [meetingId, search, dateFilter, standalone])

  useEffect(() => {
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [load])

  function openCompose() {
    setEditingId(null)
    setComposing(true)
    setForm(emptyForm(defaultDate, meetingId))
    setFieldErrors({})
  }

  useImperativeHandle(ref, () => ({ startNewNote: openCompose }))

  function openEdit(note: Note) {
    setComposing(false)
    setEditingId(note.id)
    setFieldErrors({})
    setForm({
      noteDate: note.noteDate,
      title: note.title ?? '',
      body: note.body,
      meetingId: note.meetingId,
    })
  }

  function close() {
    setComposing(false)
    setEditingId(null)
    setFieldErrors({})
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (inFlight.current) return
    inFlight.current = true
    setSaving(true)
    setError(null)
    setFieldErrors({})
    try {
      if (editingId !== null) {
        await api.updateNote(editingId, form)
      } else {
        await api.createNote(form)
      }
      close()
      await load()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message)
        setFieldErrors(err.errors ?? {})
      } else {
        setError('Failed to save your note')
      }
    } finally {
      inFlight.current = false
      setSaving(false)
    }
  }

  async function handleDelete(note: Note) {
    if (!window.confirm('Delete this note?') || inFlight.current) return
    inFlight.current = true
    setError(null)
    try {
      await api.deleteNote(note.id)
      await load()
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to delete your note')
    } finally {
      inFlight.current = false
    }
  }

  const formOpen = composing || editingId !== null

  useEffect(() => {
    onFormOpenChange?.(formOpen)
  }, [formOpen, onFormOpenChange])

  return (
    <div className="notes-panel">
      {error && <div className="alert">{error}</div>}

      {standalone && (
        <div className="filters">
          <div className="search">
            <Icon name="search" size={18} />
            <input
              type="search"
              placeholder="Search your notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-date">
            <DateField label="Date" value={dateFilter} onChange={setDateFilter} />
            {dateFilter && (
              <button type="button" className="btn-sm" onClick={() => setDateFilter('')}>
                <Icon name="close" size={15} />
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {!formOpen && !externalTrigger && (
        <button className="btn add-note" onClick={openCompose}>
          <Icon name="plus" size={18} />
          {meetingId ? 'Add a note' : 'Add a note'}
        </button>
      )}

      {formOpen && (
        <form className="card note-form" onSubmit={handleSubmit} noValidate>
          {!meetingId && (
            <DateField
              label="Date"
              value={form.noteDate}
              onChange={(iso) => setForm({ ...form, noteDate: iso })}
              error={fieldErrors.noteDate}
              required
            />
          )}

          <label>
            Title (optional)
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
          </label>

          <label>
            Note
            <textarea
              rows={5}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Only you can see this."
              required
              autoFocus
            />
            {fieldErrors.body && <span className="field-error">{fieldErrors.body}</span>}
          </label>

          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Saving…' : editingId !== null ? 'Save note' : 'Add note'}
            </button>
            <button type="button" className="btn-sm" onClick={close} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : notes.length === 0 ? (
        <p className="muted">
          {meetingId
            ? 'You have no notes for this meeting yet.'
            : search || dateFilter
              ? 'No notes match this filter.'
              : 'You have not written any notes yet.'}
        </p>
      ) : (
        <ul className="note-list">
          {notes.map((note) => (
            <li key={note.id} className="card note-item">
              <div className="note-head">
                <div>
                  {note.title && <strong>{note.title}</strong>}
                  <div className="meeting-meta">
                    <span>{formatMeetingDate(note.noteDate)}</span>
                    {standalone && note.meetingId && (
                      <Link to={`/minutes/${note.meetingId}`} className="contact-line">
                        <Icon name="notes" size={14} />
                        {note.meetingTitle}
                      </Link>
                    )}
                  </div>
                </div>
                <div className="note-actions">
                  <button className="btn-sm" onClick={() => openEdit(note)}>
                    <Icon name="edit" size={16} />
                    Edit
                  </button>
                  <button className="btn-sm danger" onClick={() => handleDelete(note)}>
                    <Icon name="trash" size={16} />
                    Delete
                  </button>
                </div>
              </div>
              <p className="prose">{note.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
})

export default NotesPanel
