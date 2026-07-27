import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiRequestError } from '../api/client'
import * as api from '../api/meetings'
import { MEETING_TYPE_LABELS, formatMeetingDate, formatMeetingTime } from '../meetings'
import AppLayout from '../components/AppLayout'
import Icon from '../components/Icon'
import NotesPanel from '../components/NotesPanel'
import type { Meeting } from '../types'

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const meetingId = Number(id)
    if (!Number.isFinite(meetingId)) {
      setError('Unknown meeting')
      setLoading(false)
      return
    }
    api
      .getMeeting(meetingId)
      .then(setMeeting)
      .catch((err) =>
        setError(
          err instanceof ApiRequestError && err.status === 404
            ? 'These minutes are not available.'
            : 'Failed to load these minutes',
        ),
      )
      .finally(() => setLoading(false))
  }, [id])

  const time = formatMeetingTime(meeting?.startTime ?? null)

  return (
    <AppLayout title={meeting?.title ?? 'Minutes'} parent={{ label: 'Meeting minutes', to: '/minutes' }}>
      {error && <div className="alert">{error}</div>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : !meeting ? (
        <div className="card empty-state">
          <p className="muted">
            Nothing to show. <Link to="/minutes">Back to meeting minutes</Link>
          </p>
        </div>
      ) : (
        <article className="card minutes-doc">
          <header className="minutes-head">
            <div className="meeting-meta">
              <span>{formatMeetingDate(meeting.meetingDate)}</span>
              {time && <span>{time}</span>}
              {meeting.location && (
                <span className="contact-line">
                  <Icon name="pin" size={14} />
                  {meeting.location}
                </span>
              )}
            </div>
            <div className="meeting-side">
              <span className="badge role">{MEETING_TYPE_LABELS[meeting.type]}</span>
              <span className={meeting.status === 'FINALISED' ? 'badge on' : 'badge draft'}>
                {meeting.status === 'FINALISED' ? 'Finalised' : 'Draft'}
              </span>
            </div>
          </header>

          <section>
            <h3>Present ({meeting.attendees.length})</h3>
            {meeting.attendees.length === 0 ? (
              <p className="muted">No attendance recorded.</p>
            ) : (
              <ul className="chip-list">
                {meeting.attendees.map((attendee) => (
                  <li key={attendee.id} className="badge role">
                    {attendee.firstName} {attendee.lastName}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {meeting.apologies && (
            <section>
              <h3>Apologies</h3>
              <p className="prose">{meeting.apologies}</p>
            </section>
          )}

          {meeting.agenda && (
            <section>
              <h3>Agenda</h3>
              <p className="prose">{meeting.agenda}</p>
            </section>
          )}

          <section>
            <h3>Discussion</h3>
            {meeting.discussion ? (
              <p className="prose">{meeting.discussion}</p>
            ) : (
              <p className="muted">Nothing recorded.</p>
            )}
          </section>

          {meeting.decisions && (
            <section>
              <h3>Decisions</h3>
              <p className="prose">{meeting.decisions}</p>
            </section>
          )}

          {meeting.lastUpdatedBy && (
            <footer className="minutes-foot muted">Last saved by {meeting.lastUpdatedBy}</footer>
          )}
        </article>
      )}

      {meeting && (
        <section className="card notes-section">
          <h2>My notes</h2>
          <p className="muted">Private to you — not part of the official minutes.</p>
          <NotesPanel meetingId={meeting.id} defaultDate={meeting.meetingDate} />
        </section>
      )}
    </AppLayout>
  )
}
