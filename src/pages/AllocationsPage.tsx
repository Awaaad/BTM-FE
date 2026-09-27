import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiRequestError } from '../api/client'
import * as api from '../api/allocations'
import { canManageRecords } from '../roles'
import { CYCLE_STATUS_LABELS, MONTH_NAMES, cycleLabel, formatAmount, nextMonthAfter } from '../allocations'
import AppLayout from '../components/AppLayout'
import Icon from '../components/Icon'
import type { Cycle } from '../types'

export default function AllocationsPage() {
  const { user } = useAuth()
  const canManage = canManageRecords(user?.role)

  const [cycles, setCycles] = useState<Cycle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ year: 0, month: 1, copyPrevious: true })
  const [saving, setSaving] = useState(false)
  const inFlight = useRef(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      setCycles(await api.listCycles())
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to load distributions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    const next = nextMonthAfter(cycles)
    setForm({ ...next, copyPrevious: cycles.length > 0 })
    setCreating(true)
  }

  async function handleCreate() {
    if (inFlight.current) return
    inFlight.current = true
    setSaving(true)
    setError(null)
    try {
      await api.createCycle({
        year: form.year,
        month: form.month,
        copyFromCycleId: form.copyPrevious && cycles.length > 0 ? cycles[0].id : undefined,
      })
      setCreating(false)
      await load()
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to start the month')
    } finally {
      inFlight.current = false
      setSaving(false)
    }
  }

  return (
    <AppLayout
      title="Allocations"
      subtitle="Monthly distribution to beneficiaries."
      actions={
        canManage && !creating ? (
          <button className="btn" onClick={openCreate}>
            <Icon name="plus" size={18} />
            New month
          </button>
        ) : undefined
      }
      fab={
        canManage && !creating ? (
          <button className="fab" onClick={openCreate} aria-label="New month">
            <Icon name="plus" size={24} />
          </button>
        ) : undefined
      }
    >
      {error && <div className="alert">{error}</div>}

      {creating && (
        <div className="card form-card">
          <h2>Start a new month</h2>
          <div className="field-row">
            <label>
              Month
              <select
                value={form.month}
                onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
              >
                {MONTH_NAMES.map((name, index) => (
                  <option key={name} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Year
              <input
                type="number"
                inputMode="numeric"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              />
            </label>
          </div>

          {cycles.length > 0 && (
            <label className="check">
              <input
                type="checkbox"
                checked={form.copyPrevious}
                onChange={(e) => setForm({ ...form, copyPrevious: e.target.checked })}
              />
              <span>
                Copy the lines from {cycleLabel(cycles[0])} — same beneficiaries, amounts and
                responsible members, nothing marked delivered
              </span>
            </label>
          )}

          <div className="form-actions">
            <button className="btn" onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating…' : 'Create month'}
            </button>
            <button className="btn-sm" onClick={() => setCreating(false)} disabled={saving}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : cycles.length === 0 ? (
        <div className="card empty-state">
          <p className="muted">No distribution months yet.</p>
        </div>
      ) : (
        <div className="meeting-list">
          {cycles.map((cycle) => {
            const outstanding = cycle.itemCount - cycle.deliveredCount
            return (
              <div key={cycle.id} className="card meeting-card">
                <div className="meeting-main">
                  <Link to={`/allocations/${cycle.id}`} className="meeting-title">
                    {cycleLabel(cycle)}
                  </Link>
                  <div className="meeting-meta">
                    <span className="amount-strong">{formatAmount(cycle.total)}</span>
                    <span>{cycle.itemCount} beneficiaries</span>
                    <span>
                      {cycle.deliveredCount} of {cycle.itemCount} delivered
                    </span>
                  </div>

                  <div className="progress" aria-hidden="true">
                    <span
                      style={{
                        width: `${cycle.itemCount === 0 ? 0 : (cycle.deliveredCount / cycle.itemCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="meeting-side">
                  <span
                    className={
                      cycle.status === 'PUBLISHED'
                        ? 'badge on'
                        : cycle.status === 'CLOSED'
                          ? 'badge role'
                          : 'badge draft'
                    }
                  >
                    {CYCLE_STATUS_LABELS[cycle.status]}
                  </span>
                  {cycle.unassignedCount > 0 && (
                    <span className="badge off">{cycle.unassignedCount} unassigned</span>
                  )}
                  {outstanding === 0 && cycle.itemCount > 0 && (
                    <span className="badge on">All delivered</span>
                  )}
                </div>

                <div className="meeting-actions">
                  <Link to={`/allocations/${cycle.id}`} className="btn-sm">
                    <Icon name="wallet" size={16} />
                    Open
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}
