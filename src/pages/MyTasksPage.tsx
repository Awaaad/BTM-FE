import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiRequestError } from '../api/client'
import * as api from '../api/allocations'
import { cycleLabel, formatAmount } from '../allocations'
import AppLayout from '../components/AppLayout'
import Icon from '../components/Icon'
import type { Allocation } from '../types'

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Allocation[]>([])
  const [pendingOnly, setPendingOnly] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      setTasks(await api.myTasks(pendingOnly))
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to load your tasks')
    } finally {
      setLoading(false)
    }
  }, [pendingOnly])

  useEffect(() => {
    load()
  }, [load])

  async function toggle(task: Allocation) {
    if (inFlight.current) return
    inFlight.current = true
    setError(null)
    try {
      if (task.delivered) {
        await api.markNotDelivered(task.id)
      } else {
        await api.markDelivered(task.id)
      }
      await load()
      // The bell count changes as a result.
      window.dispatchEvent(new Event('btm:tasks-changed'))
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to update the delivery')
    } finally {
      inFlight.current = false
    }
  }

  return (
    <AppLayout title="My deliveries" subtitle="Beneficiaries you are responsible for this month.">
      {error && <div className="alert">{error}</div>}

      <div className="filters">
        <div className="segmented" role="group" aria-label="Filter deliveries">
          <button type="button" aria-pressed={pendingOnly} onClick={() => setPendingOnly(true)}>
            To do
          </button>
          <button type="button" aria-pressed={!pendingOnly} onClick={() => setPendingOnly(false)}>
            Everything assigned to me
          </button>
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : tasks.length === 0 ? (
        <div className="card empty-state">
          <p className="muted">
            {pendingOnly
              ? 'Nothing to deliver — you are all caught up.'
              : 'You have no deliveries assigned.'}
          </p>
        </div>
      ) : (
        <div className="meeting-list">
          {tasks.map((task) => (
            <div key={task.id} className={`card meeting-card ${task.delivered ? 'row-done' : ''}`}>
              <div className="meeting-main">
                <span className="meeting-title">
                  {task.beneficiaryFirstName} {task.beneficiaryLastName}
                </span>
                <div className="meeting-meta">
                  <span className="amount-strong">{formatAmount(task.amount)}</span>
                  <Link to={`/allocations/${task.cycleId}`}>
                    {cycleLabel({ year: task.cycleYear, month: task.cycleMonth })}
                  </Link>
                  {task.beneficiaryPhone && (
                    <a className="contact-line" href={`tel:${task.beneficiaryPhone}`}>
                      <Icon name="phone" size={14} />
                      {task.beneficiaryPhone}
                    </a>
                  )}
                  {task.beneficiaryAddress && (
                    <span className="contact-line">
                      <Icon name="pin" size={14} />
                      {task.beneficiaryAddress}
                    </span>
                  )}
                </div>
                {(task.committeeDecision || task.action) && (
                  <p className="meeting-summary">{task.action ?? task.committeeDecision}</p>
                )}
              </div>

              <div className="meeting-side">
                {task.delivered ? (
                  <span className="badge on">Delivered</span>
                ) : (
                  <span className="badge draft">To do</span>
                )}
                {task.assignees.length > 1 && (
                  <span className="badge role">
                    with {task.assignees.filter((a) => a.username).map((a) => a.firstName).join(', ')}
                  </span>
                )}
              </div>

              <div className="meeting-actions">
                <button
                  className={task.delivered ? 'btn-sm' : 'btn'}
                  onClick={() => toggle(task)}
                >
                  <Icon name={task.delivered ? 'restore' : 'check'} size={16} />
                  {task.delivered ? 'Undo' : 'Mark delivered'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
