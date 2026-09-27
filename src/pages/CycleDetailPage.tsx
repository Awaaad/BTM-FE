import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiRequestError } from '../api/client'
import * as api from '../api/allocations'
import * as usersApi from '../api/users'
import * as beneficiariesApi from '../api/beneficiaries'
import { canManageRecords } from '../roles'
import { CYCLE_STATUS_LABELS, cycleLabel, formatAmount } from '../allocations'
import AppLayout from '../components/AppLayout'
import Icon from '../components/Icon'
import type { Allocation, AllocationInput, Beneficiary, Cycle, CycleStatus, Member } from '../types'

type Filter = 'ALL' | 'PENDING' | 'MINE'

function emptyForm(): AllocationInput {
  return {
    beneficiaryId: 0,
    amount: null,
    committeeDecision: '',
    remark: '',
    action: '',
    assigneeIds: [],
    recurring: true,
  }
}

export default function CycleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const cycleId = Number(id)
  const { user } = useAuth()
  const canManage = canManageRecords(user?.role)

  const [cycle, setCycle] = useState<Cycle | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('ALL')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<AllocationInput>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const inFlight = useRef(false)
  const formRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setCycle(await api.getCycle(cycleId))
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to load this month')
    } finally {
      setLoading(false)
    }
  }, [cycleId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!canManage) return
    usersApi.listMembers().then(setMembers).catch(() => setMembers([]))
    beneficiariesApi
      .listBeneficiaries(undefined, 'ACTIVE')
      .then(setBeneficiaries)
      .catch(() => setBeneficiaries([]))
  }, [canManage])

  function scrollToForm() {
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  }

  function openAdd() {
    setEditingId(null)
    setAdding(true)
    setForm(emptyForm())
    setFieldErrors({})
    scrollToForm()
  }

  function openEdit(item: Allocation) {
    setAdding(false)
    setEditingId(item.id)
    setFieldErrors({})
    setForm({
      beneficiaryId: item.beneficiaryId,
      amount: item.amount,
      committeeDecision: item.committeeDecision ?? '',
      remark: item.remark ?? '',
      action: item.action ?? '',
      assigneeIds: item.assignees.map((a) => a.id),
      recurring: item.recurring,
      recurringUntil: item.recurringUntil,
    })
    scrollToForm()
  }

  function closeForm() {
    setAdding(false)
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
        await api.updateItem(editingId, form)
      } else {
        await api.addItem(cycleId, form)
      }
      closeForm()
      await load()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message)
        setFieldErrors(err.errors ?? {})
      } else {
        setError('Failed to save this line')
      }
    } finally {
      inFlight.current = false
      setSaving(false)
    }
  }

  async function run(action: () => Promise<unknown>, failure: string) {
    if (inFlight.current) return
    inFlight.current = true
    setError(null)
    try {
      await action()
      await load()
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : failure)
    } finally {
      inFlight.current = false
    }
  }

  const toggleDelivered = (item: Allocation) =>
    run(
      () => (item.delivered ? api.markNotDelivered(item.id) : api.markDelivered(item.id)),
      'Failed to update the delivery',
    )

  const changeStatus = (status: CycleStatus) =>
    run(() => api.updateCycle(cycleId, status), 'Failed to change the status')

  function removeItem(item: Allocation) {
    const name = `${item.beneficiaryFirstName} ${item.beneficiaryLastName}`
    if (!window.confirm(`Remove ${name} from this month?`)) return
    run(() => api.deleteItem(item.id), 'Failed to remove the line')
  }

  function toggleAssignee(memberId: number) {
    const current = form.assigneeIds ?? []
    setForm({
      ...form,
      assigneeIds: current.includes(memberId)
        ? current.filter((x) => x !== memberId)
        : [...current, memberId],
    })
  }

  const formOpen = adding || editingId !== null
  const items = cycle?.items ?? []
  const visible = items.filter((item) => {
    if (filter === 'PENDING') return !item.delivered
    if (filter === 'MINE') return item.assignees.some((a) => a.id === user?.id)
    return true
  })

  return (
    <AppLayout
      title={cycle ? cycleLabel(cycle) : 'Distribution'}
      parent={{ label: 'Allocations', to: '/allocations' }}
      subtitle={
        cycle
          ? `${formatAmount(cycle.total)} · ${cycle.deliveredCount} of ${cycle.itemCount} delivered`
          : undefined
      }
      actions={
        canManage && !formOpen ? (
          <button className="btn" onClick={openAdd}>
            <Icon name="plus" size={18} />
            Add beneficiary
          </button>
        ) : undefined
      }
      fab={
        canManage && !formOpen ? (
          <button className="fab" onClick={openAdd} aria-label="Add beneficiary">
            <Icon name="plus" size={24} />
          </button>
        ) : undefined
      }
    >
      {error && <div className="alert">{error}</div>}

      {cycle && (
        <div className="card cycle-bar">
          <div className="cycle-stats">
            <span>
              <strong>{formatAmount(cycle.total)}</strong>
              <small>total voted</small>
            </span>
            <span>
              <strong>{cycle.itemCount}</strong>
              <small>beneficiaries</small>
            </span>
            <span>
              <strong>
                {cycle.deliveredCount}/{cycle.itemCount}
              </strong>
              <small>delivered</small>
            </span>
            {cycle.unassignedCount > 0 && (
              <span className="warn">
                <strong>{cycle.unassignedCount}</strong>
                <small>nobody assigned</small>
              </span>
            )}
          </div>

          <div className="cycle-actions">
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
            {canManage && cycle.status === 'DRAFT' && (
              <button className="btn-sm" onClick={() => changeStatus('PUBLISHED')}>
                <Icon name="check" size={16} />
                Publish
              </button>
            )}
            {canManage && cycle.status === 'PUBLISHED' && (
              <>
                <button className="btn-sm" onClick={() => changeStatus('CLOSED')}>
                  <Icon name="archive" size={16} />
                  Close month
                </button>
                <button className="btn-sm" onClick={() => changeStatus('DRAFT')}>
                  <Icon name="restore" size={16} />
                  Back to draft
                </button>
              </>
            )}
            {canManage && cycle.status === 'CLOSED' && (
              <button className="btn-sm" onClick={() => changeStatus('PUBLISHED')}>
                <Icon name="restore" size={16} />
                Reopen
              </button>
            )}
          </div>
        </div>
      )}

      {cycle?.status === 'DRAFT' && (
        <p className="hint draft-hint">
          <Icon name="notes" size={14} /> This month is a draft. Publish it before the team can
          mark deliveries.
        </p>
      )}

      {formOpen && (
        <div className="card form-card" ref={formRef}>
          <h2>{editingId !== null ? 'Edit line' : 'Add a beneficiary to this month'}</h2>
          <form onSubmit={handleSubmit} noValidate>
            <div className="field-row">
              <label>
                Beneficiary
                <select
                  value={form.beneficiaryId || ''}
                  onChange={(e) => setForm({ ...form, beneficiaryId: Number(e.target.value) })}
                  required
                >
                  <option value="">Choose…</option>
                  {beneficiaries.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.firstName} {b.lastName}
                      {b.address ? ` — ${b.address}` : ''}
                    </option>
                  ))}
                </select>
                {fieldErrors.beneficiaryId && (
                  <span className="field-error">{fieldErrors.beneficiaryId}</span>
                )}
              </label>
              <label>
                Sum voted (Rs)
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="1"
                  value={form.amount ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value === '' ? null : Number(e.target.value) })
                  }
                  placeholder="Leave blank for food only"
                />
                {fieldErrors.amount && <span className="field-error">{fieldErrors.amount}</span>}
              </label>
            </div>

            <label>
              Committee decision
              <input
                type="text"
                value={form.committeeDecision}
                onChange={(e) => setForm({ ...form, committeeDecision: e.target.value })}
                placeholder="e.g. Rs 5,000 was voted"
              />
            </label>

            <div className="field-row">
              <label>
                Remark
                <input
                  type="text"
                  value={form.remark}
                  onChange={(e) => setForm({ ...form, remark: e.target.value })}
                />
              </label>
              <label>
                Action
                <input
                  type="text"
                  value={form.action}
                  onChange={(e) => setForm({ ...form, action: e.target.value })}
                  placeholder="e.g. Remit against voucher"
                />
              </label>
            </div>

            <fieldset className="picker">
              <legend>Responsible for distribution</legend>
              <div className="picker-grid">
                {members.map((member) => (
                  <label key={member.id} className="check">
                    <input
                      type="checkbox"
                      checked={(form.assigneeIds ?? []).includes(member.id)}
                      onChange={() => toggleAssignee(member.id)}
                    />
                    <span>
                      {member.firstName} {member.lastName}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="check">
              <input
                type="checkbox"
                checked={form.recurring ?? true}
                onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
              />
              <span>Repeats — carry this line into next month</span>
            </label>

            <div className="form-actions">
              <button type="submit" disabled={saving}>
                {saving ? 'Saving…' : editingId !== null ? 'Save line' : 'Add to month'}
              </button>
              <button type="button" className="btn-sm" onClick={closeForm} disabled={saving}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="filters">
        <div className="segmented" role="group" aria-label="Filter lines">
          {(
            [
              { value: 'ALL', label: 'All' },
              { value: 'PENDING', label: 'Not delivered' },
              { value: 'MINE', label: 'Mine' },
            ] as { value: Filter; label: string }[]
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : visible.length === 0 ? (
        <div className="card empty-state">
          <p className="muted">
            {items.length === 0 ? 'Nobody on this month’s list yet.' : 'No lines match this filter.'}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Beneficiary</th>
                <th>Sum voted</th>
                <th>Decision &amp; remark</th>
                <th>Responsible</th>
                <th>Delivered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => {
                const mine = item.assignees.some((a) => a.id === user?.id)
                const canTick = mine || canManage
                return (
                  <tr key={item.id} className={item.delivered ? 'row-done' : ''}>
                    <td className="cell-primary">
                      {item.beneficiaryFirstName} {item.beneficiaryLastName}
                      <span className="cell-note">
                        {[item.beneficiaryPhone, item.beneficiaryAddress].filter(Boolean).join(' · ')}
                      </span>
                    </td>
                    <td data-label="Sum voted" className="nowrap amount-strong">
                      {formatAmount(item.amount)}
                    </td>
                    <td data-label="Decision">
                      {item.committeeDecision ?? <span className="muted">—</span>}
                      {item.remark && <span className="cell-note">{item.remark}</span>}
                      {item.action && <span className="cell-note">Action: {item.action}</span>}
                    </td>
                    <td data-label="Responsible">
                      {item.assignees.length === 0 ? (
                        <span className="badge off">Nobody</span>
                      ) : (
                        <span className="chip-row">
                          {item.assignees.map((a) => (
                            <span key={a.id} className={a.id === user?.id ? 'badge on' : 'badge role'}>
                              {a.firstName}
                            </span>
                          ))}
                        </span>
                      )}
                    </td>
                    <td data-label="Delivered" className="nowrap">
                      {item.delivered ? (
                        <span className="badge on">
                          Yes{item.deliveredBy ? ` · ${item.deliveredBy}` : ''}
                        </span>
                      ) : (
                        <span className="badge draft">Pending</span>
                      )}
                    </td>
                    <td className="cell-actions">
                      {canTick && cycle?.status !== 'DRAFT' && (
                        <button
                          className={item.delivered ? 'btn-sm' : 'btn-sm primary-outline'}
                          onClick={() => toggleDelivered(item)}
                        >
                          <Icon name={item.delivered ? 'restore' : 'check'} size={16} />
                          {item.delivered ? 'Undo' : 'Mark delivered'}
                        </button>
                      )}
                      {canManage && (
                        <>
                          <button className="btn-sm" onClick={() => openEdit(item)}>
                            <Icon name="edit" size={16} />
                            Edit
                          </button>
                          <button className="btn-sm danger" onClick={() => removeItem(item)}>
                            <Icon name="trash" size={16} />
                            Remove
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  )
}
