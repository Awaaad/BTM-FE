import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiRequestError } from '../api/client'
import * as api from '../api/meetings'
import * as usersApi from '../api/users'
import { canManageRecords } from '../roles'
import { MEETING_TYPES, MEETING_TYPE_LABELS, formatMeetingDate, formatMeetingTime } from '../meetings'
import AppLayout from '../components/AppLayout'
import Icon from '../components/Icon'
import { DateField, TimeField } from '../components/DateTimeField'
import type { Meeting, MeetingInput, MeetingStatus, MeetingSummary, Member } from '../types'

type StatusFilter = MeetingStatus | 'ALL'

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'DRAFT', label: 'Drafts' },
  { value: 'FINALISED', label: 'Finalised' },
]

function todayIso(): string {
  const now = new Date()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function emptyForm(): MeetingInput {
  return {
    title: '',
    meetingDate: todayIso(),
    startTime: '',
    location: '',
    type: 'COMMITTEE',
    status: 'DRAFT',
    agenda: '',
    discussion: '',
    decisions: '',
    apologies: '',
    attendeeIds: [],
  }
}

export default function MinutesPage() {
  const { user } = useAuth()
  const canManage = canManageRecords(user?.role)
  const isAdmin = user?.role === 'ADMIN'

  const [meetings, setMeetings] = useState<MeetingSummary[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<MeetingInput>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const inFlight = useRef(false)
  const formRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setMeetings(
        await api.listMeetings({
          search,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          // A single day: the API range is inclusive at both ends.
          from: dateFilter || undefined,
          to: dateFilter || undefined,
        }),
      )
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to load minutes')
    } finally {
      setLoading(false)
    }
  }, [search, dateFilter, statusFilter])

  // Debounced so typing in the search box doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [load])

  // Attendees are picked from the member directory, which every user can read.
  useEffect(() => {
    if (!canManage) return
    usersApi.listMembers().then(setMembers).catch(() => setMembers([]))
  }, [canManage])

  function scrollToForm() {
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  }

  function openCreate() {
    setEditingId(null)
    setCreating(true)
    setForm(emptyForm())
    setFieldErrors({})
    scrollToForm()
  }

  async function openEdit(id: number) {
    setError(null)
    try {
      const meeting = await api.getMeeting(id)
      setCreating(false)
      setEditingId(id)
      setFieldErrors({})
      setForm(toInput(meeting))
      scrollToForm()
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to open these minutes')
    }
  }

  function closeForm() {
    setCreating(false)
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

    // An empty time input must be omitted, not sent as "".
    const payload: MeetingInput = { ...form, startTime: form.startTime || null }

    try {
      if (editingId !== null) {
        await api.updateMeeting(editingId, payload)
      } else {
        await api.createMeeting(payload)
      }
      closeForm()
      await load()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message)
        setFieldErrors(err.errors ?? {})
      } else {
        setError('Failed to save these minutes')
      }
    } finally {
      inFlight.current = false
      setSaving(false)
    }
  }

  async function handleDelete(meeting: MeetingSummary) {
    const confirmed = window.confirm(
      `Permanently delete the minutes for "${meeting.title}"? This cannot be undone.`,
    )
    if (!confirmed || inFlight.current) return
    inFlight.current = true
    setError(null)
    try {
      await api.deleteMeeting(meeting.id)
      await load()
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to delete these minutes')
    } finally {
      inFlight.current = false
    }
  }

  function toggleAttendee(memberId: number) {
    const current = form.attendeeIds ?? []
    setForm({
      ...form,
      attendeeIds: current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    })
  }

  const formOpen = creating || editingId !== null

  return (
    <AppLayout
      title="Meeting minutes"
      subtitle={
        canManage
          ? 'Record what was discussed and decided.'
          : 'Approved minutes of past meetings.'
      }
      actions={
        canManage && !formOpen ? (
          <button className="btn" onClick={openCreate}>
            <Icon name="plus" size={18} />
            Record a meeting
          </button>
        ) : undefined
      }
      fab={
        canManage && !formOpen ? (
          <button className="fab" onClick={openCreate} aria-label="Record a meeting">
            <Icon name="plus" size={24} />
          </button>
        ) : undefined
      }
    >
      {error && <div className="alert">{error}</div>}

      {formOpen && (
        <div className="card form-card" ref={formRef}>
          <h2>{editingId !== null ? 'Edit minutes' : 'Record a meeting'}</h2>
          <form onSubmit={handleSubmit} noValidate>
            <label>
              Title
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. March committee meeting"
                required
                autoFocus
              />
              {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
            </label>

            <div className="field-row">
              <DateField
                label="Date"
                value={form.meetingDate}
                onChange={(iso) => setForm({ ...form, meetingDate: iso })}
                error={fieldErrors.meetingDate}
                required
              />
              <TimeField
                label="Start time"
                value={form.startTime ?? ''}
                onChange={(iso) => setForm({ ...form, startTime: iso })}
                error={fieldErrors.startTime}
              />
            </div>

            <div className="field-row">
              <label>
                Type
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as MeetingInput['type'] })}
                >
                  {MEETING_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {MEETING_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Location
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </label>
            </div>

            <label>
              Agenda
              <textarea
                rows={3}
                value={form.agenda}
                onChange={(e) => setForm({ ...form, agenda: e.target.value })}
              />
              {fieldErrors.agenda && <span className="field-error">{fieldErrors.agenda}</span>}
            </label>

            <label>
              Discussion
              <textarea
                rows={7}
                value={form.discussion}
                onChange={(e) => setForm({ ...form, discussion: e.target.value })}
                placeholder="What was discussed…"
              />
              {fieldErrors.discussion && <span className="field-error">{fieldErrors.discussion}</span>}
            </label>

            <label>
              Decisions
              <textarea
                rows={3}
                value={form.decisions}
                onChange={(e) => setForm({ ...form, decisions: e.target.value })}
                placeholder="What was agreed…"
              />
              {fieldErrors.decisions && <span className="field-error">{fieldErrors.decisions}</span>}
            </label>

            <fieldset className="picker">
              <legend>Present</legend>
              {members.length === 0 ? (
                <p className="muted">No members to choose from.</p>
              ) : (
                <div className="picker-grid">
                  {members.map((member) => (
                    <label key={member.id} className="check">
                      <input
                        type="checkbox"
                        checked={(form.attendeeIds ?? []).includes(member.id)}
                        onChange={() => toggleAttendee(member.id)}
                      />
                      <span>
                        {member.firstName} {member.lastName}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            <label>
              Apologies
              <textarea
                rows={2}
                value={form.apologies}
                onChange={(e) => setForm({ ...form, apologies: e.target.value })}
                placeholder="Who sent apologies…"
              />
              {fieldErrors.apologies && <span className="field-error">{fieldErrors.apologies}</span>}
            </label>

            <label>
              Status
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as MeetingStatus })}
              >
                <option value="DRAFT">Draft — visible to the committee only</option>
                <option value="FINALISED">Finalised — visible to all members</option>
              </select>
              <span className="hint">
                Finalising publishes these minutes; only an administrator can reopen them
                afterwards.
              </span>
            </label>

            <div className="form-actions">
              <button type="submit" disabled={saving}>
                {saving ? 'Saving…' : editingId !== null ? 'Save changes' : 'Save minutes'}
              </button>
              <button type="button" className="btn-sm" onClick={closeForm} disabled={saving}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="filters">
        <div className="search">
          <Icon name="search" size={18} />
          <input
            type="search"
            placeholder="Search title or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-date">
          <DateField label="Meeting date" value={dateFilter} onChange={setDateFilter} />
          {dateFilter && (
            <button type="button" className="btn-sm" onClick={() => setDateFilter('')}>
              <Icon name="close" size={15} />
              Clear
            </button>
          )}
        </div>

        {canManage && (
          <div className="segmented" role="group" aria-label="Filter by status">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={statusFilter === filter.value}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : meetings.length === 0 ? (
        <div className="card empty-state">
          <p className="muted">
            {search || dateFilter || statusFilter !== 'ALL'
              ? 'No meetings match this filter.'
              : 'No meetings recorded yet.'}
          </p>
        </div>
      ) : (
        <div className="meeting-list">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="card meeting-card">
              <div className="meeting-main">
                <Link to={`/minutes/${meeting.id}`} className="meeting-title">
                  {meeting.title}
                </Link>
                <div className="meeting-meta">
                  <span>{formatMeetingDate(meeting.meetingDate)}</span>
                  {formatMeetingTime(meeting.startTime) && (
                    <span>{formatMeetingTime(meeting.startTime)}</span>
                  )}
                  {meeting.location && (
                    <span className="contact-line">
                      <Icon name="pin" size={14} />
                      {meeting.location}
                    </span>
                  )}
                  <span className="contact-line">
                    <Icon name="users" size={14} />
                    {meeting.attendeeCount} present
                  </span>
                </div>

                {meeting.summary ? (
                  <p className="meeting-summary">{meeting.summary}</p>
                ) : (
                  <p className="meeting-summary muted">No notes recorded yet.</p>
                )}
              </div>

              <div className="meeting-side">
                <span className="badge role">{MEETING_TYPE_LABELS[meeting.type]}</span>
                <span className={meeting.status === 'FINALISED' ? 'badge on' : 'badge draft'}>
                  {meeting.status === 'FINALISED' ? 'Finalised' : 'Draft'}
                </span>
              </div>

              <div className="meeting-actions">
                <Link to={`/minutes/${meeting.id}`} className="btn-sm">
                  <Icon name="notes" size={16} />
                  Read
                </Link>
                {canManage && (
                  <button className="btn-sm" onClick={() => openEdit(meeting.id)}>
                    <Icon name="edit" size={16} />
                    Edit
                  </button>
                )}
                {isAdmin && (
                  <button className="btn-sm danger" onClick={() => handleDelete(meeting)}>
                    <Icon name="trash" size={16} />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}

function toInput(meeting: Meeting): MeetingInput {
  return {
    title: meeting.title,
    meetingDate: meeting.meetingDate,
    startTime: meeting.startTime ? meeting.startTime.slice(0, 5) : '',
    location: meeting.location ?? '',
    type: meeting.type,
    status: meeting.status,
    agenda: meeting.agenda ?? '',
    discussion: meeting.discussion ?? '',
    decisions: meeting.decisions ?? '',
    apologies: meeting.apologies ?? '',
    attendeeIds: meeting.attendees.map((a) => a.id),
  }
}
