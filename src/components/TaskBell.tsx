import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import * as api from '../api/allocations'
import { cycleLabel, formatAmount } from '../allocations'
import Icon from './Icon'
import type { Allocation } from '../types'

/** How often to re-check in the background while the app is open. */
const POLL_MS = 60_000

/**
 * Pending-delivery indicator. Shows how many beneficiaries the signed-in member
 * still has to reach, and lists them without leaving the page.
 */
export default function TaskBell() {
  const [count, setCount] = useState(0)
  const [tasks, setTasks] = useState<Allocation[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null)
  const location = useLocation()

  const refreshCount = useCallback(async () => {
    try {
      const { pendingDeliveries } = await api.pendingCount()
      setCount(pendingDeliveries)
    } catch {
      // A failed poll should never break the page.
    }
  }, [])

  useEffect(() => {
    refreshCount()
    const timer = setInterval(refreshCount, POLL_MS)
    // Marking something delivered elsewhere in the app updates the badge.
    const onChange = () => refreshCount()
    window.addEventListener('btm:tasks-changed', onChange)
    return () => {
      clearInterval(timer)
      window.removeEventListener('btm:tasks-changed', onChange)
    }
  }, [refreshCount])

  useEffect(() => setOpen(false), [location.pathname])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  async function toggleOpen() {
    const next = !open
    setOpen(next)
    if (!next) return
    setLoading(true)
    try {
      setTasks(await api.myTasks(true))
    } catch {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bell-wrap" ref={wrapper}>
      <button
        className="icon-btn bell"
        onClick={toggleOpen}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={count === 0 ? 'No deliveries pending' : `${count} deliveries pending`}
      >
        <Icon name="bell" size={21} />
        {count > 0 && <span className="bell-badge">{count > 9 ? '9+' : count}</span>}
      </button>

      {open && (
        <div className="menu bell-menu" role="menu">
          <div className="menu-row bell-head">
            <Icon name="truck" size={16} />
            <span>{count === 0 ? 'Nothing to deliver' : `${count} to deliver`}</span>
          </div>

          {loading ? (
            <p className="muted bell-empty">Loading…</p>
          ) : tasks.length === 0 ? (
            <p className="muted bell-empty">You are all caught up.</p>
          ) : (
            <ul className="bell-list">
              {tasks.slice(0, 6).map((task) => (
                <li key={task.id}>
                  <Link to="/my-tasks" className="bell-item">
                    <strong>
                      {task.beneficiaryFirstName} {task.beneficiaryLastName}
                    </strong>
                    <small>
                      {formatAmount(task.amount)} ·{' '}
                      {cycleLabel({ year: task.cycleYear, month: task.cycleMonth })}
                    </small>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Link to="/my-tasks" className="menu-item">
            <Icon name="truck" size={17} />
            {tasks.length > 6 ? `See all ${count} deliveries` : 'Open my deliveries'}
          </Link>
        </div>
      )}
    </div>
  )
}
