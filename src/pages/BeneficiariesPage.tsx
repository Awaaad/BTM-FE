import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { ApiRequestError } from '../api/client'
import * as api from '../api/beneficiaries'
import { canManageRecords } from '../roles'
import AppLayout from '../components/AppLayout'
import Icon from '../components/Icon'
import type { Beneficiary, BeneficiaryInput, BeneficiaryStatus } from '../types'

type StatusFilter = BeneficiaryStatus | 'ALL'

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: 'ALL', label: 'All' },
]

const EMPTY_FORM: BeneficiaryInput = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  address: '',
  householdSize: 1,
  notes: '',
}

export default function BeneficiariesPage() {
  const { user } = useAuth()
  const canManage = canManageRecords(user?.role)
  const isAdmin = user?.role === 'ADMIN'

  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE')

  const [editing, setEditing] = useState<Beneficiary | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<BeneficiaryInput>(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const inFlight = useRef(false)
  const formRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setBeneficiaries(
        await api.listBeneficiaries(search, statusFilter === 'ALL' ? undefined : statusFilter),
      )
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to load beneficiaries')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  // Debounced so typing in the search box doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [load])

  function openCreate() {
    setEditing(null)
    setCreating(true)
    setForm(EMPTY_FORM)
    setFieldErrors({})
    // On a phone the form renders above the fold but below the filters.
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function openEdit(beneficiary: Beneficiary) {
    setCreating(false)
    setEditing(beneficiary)
    setFieldErrors({})
    setForm(toInput(beneficiary))
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function closeForm() {
    setCreating(false)
    setEditing(null)
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
      if (editing) {
        await api.updateBeneficiary(editing.id, form)
      } else {
        await api.createBeneficiary(form)
      }
      closeForm()
      await load()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message)
        setFieldErrors(err.errors ?? {})
      } else {
        setError('Failed to save beneficiary')
      }
    } finally {
      inFlight.current = false
      setSaving(false)
    }
  }

  async function toggleArchive(beneficiary: Beneficiary) {
    if (inFlight.current) return
    inFlight.current = true
    setError(null)
    try {
      await api.updateBeneficiary(beneficiary.id, {
        ...toInput(beneficiary),
        status: beneficiary.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE',
      })
      await load()
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to update status')
    } finally {
      inFlight.current = false
    }
  }

  async function handleDelete(beneficiary: Beneficiary) {
    const confirmed = window.confirm(
      `Permanently delete ${beneficiary.firstName} ${beneficiary.lastName}? ` +
        'Use Archive instead to keep their history.',
    )
    if (!confirmed || inFlight.current) return
    inFlight.current = true
    setError(null)
    try {
      await api.deleteBeneficiary(beneficiary.id)
      await load()
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to delete beneficiary')
    } finally {
      inFlight.current = false
    }
  }

  const formOpen = creating || editing !== null

  return (
    <AppLayout
      title="Beneficiaries"
      subtitle="People and households the organisation supports."
      actions={
        canManage && !formOpen ? (
          <button className="btn" onClick={openCreate}>
            <Icon name="plus" size={18} />
            Add beneficiary
          </button>
        ) : undefined
      }
      fab={
        canManage && !formOpen ? (
          <button className="fab" onClick={openCreate} aria-label="Add beneficiary">
            <Icon name="plus" size={24} />
          </button>
        ) : undefined
      }
    >
      {error && <div className="alert">{error}</div>}

      {formOpen && (
        <div className="card form-card" ref={formRef}>
          <h2>{editing ? 'Edit beneficiary' : 'New beneficiary'}</h2>
          <form onSubmit={handleSubmit} noValidate>
            <div className="field-row">
              <label>
                First name
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                  autoFocus
                />
                {fieldErrors.firstName && <span className="field-error">{fieldErrors.firstName}</span>}
              </label>
              <label>
                Last name
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                />
                {fieldErrors.lastName && <span className="field-error">{fieldErrors.lastName}</span>}
              </label>
            </div>

            <div className="field-row">
              <label>
                Phone
                <input
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
              </label>
              <label>
                Email
                <input
                  type="email"
                  inputMode="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
              </label>
            </div>

            <label>
              Address
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              {fieldErrors.address && <span className="field-error">{fieldErrors.address}</span>}
            </label>

            <div className="field-row">
              <label>
                Household size
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={50}
                  value={form.householdSize}
                  onChange={(e) => setForm({ ...form, householdSize: Number(e.target.value) })}
                />
                {fieldErrors.householdSize && (
                  <span className="field-error">{fieldErrors.householdSize}</span>
                )}
              </label>
              {editing && (
                <label>
                  Status
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as BeneficiaryStatus })
                    }
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </label>
              )}
            </div>

            <label>
              Notes
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
              {fieldErrors.notes && <span className="field-error">{fieldErrors.notes}</span>}
            </label>

            <div className="form-actions">
              <button type="submit" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add beneficiary'}
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
            placeholder="Search name, phone or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : beneficiaries.length === 0 ? (
        <div className="card empty-state">
          <p className="muted">
            {search || statusFilter !== 'ALL'
              ? 'No beneficiaries match this filter.'
              : 'No beneficiaries registered yet.'}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Household</th>
                <th>Status</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {beneficiaries.map((b) => (
                <tr key={b.id} className={b.status === 'ACTIVE' ? '' : 'row-muted'}>
                  <td className="cell-primary">
                    {b.firstName} {b.lastName}
                    {b.notes && <span className="cell-note">{b.notes}</span>}
                  </td>
                  <td data-label="Contact">
                    {b.phone || b.email ? (
                      <span className="stack-lines">
                        {b.phone && (
                          <span className="contact-line">
                            <Icon name="phone" size={14} />
                            {b.phone}
                          </span>
                        )}
                        {b.email && (
                          <span className="contact-line">
                            <Icon name="mail" size={14} />
                            {b.email}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td data-label="Address">
                    {b.address ? (
                      <span className="contact-line">
                        <Icon name="pin" size={14} />
                        {b.address}
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td data-label="Household" className="nowrap">
                    {b.householdSize}
                  </td>
                  <td data-label="Status" className="nowrap">
                    <span className={b.status === 'ACTIVE' ? 'badge on' : 'badge off'}>
                      {b.status === 'ACTIVE' ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  {canManage && (
                    <td className="cell-actions">
                      <button className="btn-sm" onClick={() => openEdit(b)}>
                        <Icon name="edit" size={16} />
                        Edit
                      </button>
                      <button className="btn-sm" onClick={() => toggleArchive(b)}>
                        <Icon name={b.status === 'ACTIVE' ? 'archive' : 'restore'} size={16} />
                        {b.status === 'ACTIVE' ? 'Archive' : 'Restore'}
                      </button>
                      {isAdmin && (
                        <button className="btn-sm danger" onClick={() => handleDelete(b)}>
                          <Icon name="trash" size={16} />
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  )
}

function toInput(beneficiary: Beneficiary): BeneficiaryInput {
  return {
    firstName: beneficiary.firstName,
    lastName: beneficiary.lastName,
    phone: beneficiary.phone ?? '',
    email: beneficiary.email ?? '',
    address: beneficiary.address ?? '',
    householdSize: beneficiary.householdSize,
    notes: beneficiary.notes ?? '',
    status: beneficiary.status,
  }
}
