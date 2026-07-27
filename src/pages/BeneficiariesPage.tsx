import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { ApiRequestError } from '../api/client'
import * as api from '../api/beneficiaries'
import { canManageRecords } from '../roles'
import PageShell from '../components/PageShell'
import type { Beneficiary, BeneficiaryInput, BeneficiaryStatus } from '../types'

type StatusFilter = BeneficiaryStatus | 'ALL'

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

  /** null = form closed; otherwise the record being edited (id 0 = new). */
  const [editing, setEditing] = useState<Beneficiary | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<BeneficiaryInput>(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const inFlight = useRef(false)

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
  }

  function openEdit(beneficiary: Beneficiary) {
    setCreating(false)
    setEditing(beneficiary)
    setFieldErrors({})
    setForm({
      firstName: beneficiary.firstName,
      lastName: beneficiary.lastName,
      phone: beneficiary.phone ?? '',
      email: beneficiary.email ?? '',
      address: beneficiary.address ?? '',
      householdSize: beneficiary.householdSize,
      notes: beneficiary.notes ?? '',
      status: beneficiary.status,
    })
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
        firstName: beneficiary.firstName,
        lastName: beneficiary.lastName,
        phone: beneficiary.phone ?? '',
        email: beneficiary.email ?? '',
        address: beneficiary.address ?? '',
        householdSize: beneficiary.householdSize,
        notes: beneficiary.notes ?? '',
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
    <PageShell
      title="Beneficiaries"
      subtitle="People and households the organisation supports."
      actions={
        canManage && !formOpen ? <button onClick={openCreate}>Add beneficiary</button> : undefined
      }
    >
      {error && <div className="alert">{error}</div>}

      {formOpen && (
        <div className="card form-card">
          <h3>{editing ? 'Edit beneficiary' : 'New beneficiary'}</h3>
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
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
              </label>
              <label>
                Email
                <input
                  type="email"
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
                    onChange={(e) => setForm({ ...form, status: e.target.value as BeneficiaryStatus })}
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
              <button type="button" className="secondary" onClick={closeForm} disabled={saving}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="filters">
        <input
          type="search"
          placeholder="Search name, phone or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
          <option value="ACTIVE">Active only</option>
          <option value="ARCHIVED">Archived only</option>
          <option value="ALL">All</option>
        </select>
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
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Household</th>
                <th>Status</th>
                {canManage && <th></th>}
              </tr>
            </thead>
            <tbody>
              {beneficiaries.map((b) => (
                <tr key={b.id} className={b.status === 'ACTIVE' ? '' : 'row-disabled'}>
                  <td>
                    {b.firstName} {b.lastName}
                    {b.notes && <div className="cell-note">{b.notes}</div>}
                  </td>
                  <td>
                    {b.phone && <div>{b.phone}</div>}
                    {b.email && <div>{b.email}</div>}
                    {!b.phone && !b.email && <span className="muted">—</span>}
                  </td>
                  <td>{b.address ?? <span className="muted">—</span>}</td>
                  <td className="nowrap">{b.householdSize}</td>
                  <td className="nowrap">
                    <span className={b.status === 'ACTIVE' ? 'status-badge on' : 'status-badge off'}>
                      {b.status === 'ACTIVE' ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  {canManage && (
                    <td className="nowrap row-actions">
                      <button className="secondary" onClick={() => openEdit(b)}>
                        Edit
                      </button>
                      <button className="secondary" onClick={() => toggleArchive(b)}>
                        {b.status === 'ACTIVE' ? 'Archive' : 'Restore'}
                      </button>
                      {isAdmin && (
                        <button className="secondary danger" onClick={() => handleDelete(b)}>
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
    </PageShell>
  )
}
