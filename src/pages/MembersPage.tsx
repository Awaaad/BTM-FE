import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { ApiRequestError } from '../api/client'
import * as usersApi from '../api/users'
import { ALL_ROLES, ROLE_LABELS, canManageMembers } from '../roles'
import AppLayout from '../components/AppLayout'
import Icon from '../components/Icon'
import type { Member, Role } from '../types'

interface EditForm {
  firstName: string
  lastName: string
  username: string
  email: string
  /** Blank keeps the current password. */
  newPassword: string
}

export default function MembersPage() {
  const { user } = useAuth()
  const canManage = canManageMembers(user?.role)
  const isAdmin = user?.role === 'ADMIN'

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  const [editing, setEditing] = useState<Member | null>(null)
  const [form, setForm] = useState<EditForm | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  // Synchronous guard: state updates are async, so a rapid double-click could
  // otherwise fire two requests before the disabled attribute renders.
  const inFlight = useRef(false)

  useEffect(() => {
    usersApi
      .listMembers()
      .then(setMembers)
      .catch((err) =>
        setError(err instanceof ApiRequestError ? err.message : 'Failed to load members'),
      )
      .finally(() => setLoading(false))
  }, [])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return members
    return members.filter((m) =>
      `${m.firstName} ${m.lastName} ${m.username} ${m.email}`.toLowerCase().includes(term),
    )
  }, [members, search])

  function replaceMember(updated: Member) {
    setMembers((current) => current.map((m) => (m.id === updated.id ? updated : m)))
  }

  function openEdit(member: Member) {
    setEditing(member)
    setFieldErrors({})
    setError(null)
    setNotice(null)
    setForm({
      firstName: member.firstName,
      lastName: member.lastName,
      username: member.username,
      email: member.email,
      newPassword: '',
    })
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  }

  function closeEdit() {
    setEditing(null)
    setForm(null)
    setFieldErrors({})
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (!editing || !form || inFlight.current) return
    inFlight.current = true
    setSaving(true)
    setError(null)
    setNotice(null)
    setFieldErrors({})

    const editingSelf = editing.id === user?.id
    const usernameChanged = form.username.trim().toLowerCase() !== editing.username
    const password = form.newPassword.trim()

    try {
      const updated = await usersApi.updateMember(editing.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
        email: form.email,
      })
      replaceMember(updated)

      if (password) {
        await usersApi.resetPassword(editing.id, password)
      }

      closeEdit()
      setNotice(
        password
          ? `Saved. ${updated.firstName} must sign in again with the new password.`
          : usernameChanged
            ? `Saved. ${updated.firstName} must sign in again with the new username.`
            : 'Changes saved.',
      )

      // Changing your own username or password invalidates this session too.
      if (editingSelf && (password || usernameChanged)) {
        setNotice('Saved. Your own sign-in details changed — you may need to sign in again.')
      }
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message)
        setFieldErrors(err.errors ?? {})
      } else {
        setError('Failed to save changes')
      }
    } finally {
      inFlight.current = false
      setSaving(false)
    }
  }

  async function handleRoleChange(member: Member, role: Role) {
    if (inFlight.current) return
    inFlight.current = true
    setError(null)
    setBusyId(member.id)
    try {
      replaceMember(await usersApi.updateRole(member.id, role))
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to update role')
    } finally {
      inFlight.current = false
      setBusyId(null)
    }
  }

  async function handleStatusToggle(member: Member) {
    if (inFlight.current) return
    inFlight.current = true
    setError(null)
    setBusyId(member.id)
    try {
      replaceMember(await usersApi.updateStatus(member.id, !member.enabled))
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to update status')
    } finally {
      inFlight.current = false
      setBusyId(null)
    }
  }

  return (
    <AppLayout
      title="Members"
      subtitle={
        canManage
          ? 'Assign committee roles and manage account access.'
          : 'Directory of everyone in the organisation.'
      }
    >
      {error && <div className="alert">{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      {editing && form && (
        <div className="card form-card" ref={formRef}>
          <h2>
            Edit {editing.firstName} {editing.lastName}
          </h2>
          <form onSubmit={handleSave} noValidate>
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
                Username
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
                {fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
              </label>
            </div>

            <label>
              New password
              <input
                type="password"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                autoComplete="new-password"
                placeholder="Leave blank to keep the current password"
              />
              <span className="hint">
                Setting a password signs the member out of any device they are using.
              </span>
              {fieldErrors.newPassword && (
                <span className="field-error">{fieldErrors.newPassword}</span>
              )}
            </label>

            <div className="form-actions">
              <button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" className="btn-sm" onClick={closeEdit} disabled={saving}>
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
            placeholder="Search members…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : visible.length === 0 ? (
        <div className="card empty-state">
          <p className="muted">No members match this search.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {visible.map((member) => {
                const isSelf = member.id === user?.id
                const busy = busyId === member.id
                return (
                  <tr key={member.id} className={member.enabled ? '' : 'row-muted'}>
                    <td className="cell-primary">
                      {member.firstName} {member.lastName}
                      {isSelf && <span className="you-tag"> (you)</span>}
                    </td>
                    <td data-label="Username">{member.username}</td>
                    <td data-label="Email">{member.email}</td>
                    <td data-label="Role">
                      {canManage && !isSelf ? (
                        <select
                          value={member.role}
                          disabled={busy}
                          aria-label={`Role for ${member.firstName} ${member.lastName}`}
                          onChange={(e) => handleRoleChange(member, e.target.value as Role)}
                        >
                          {ALL_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="badge role">{ROLE_LABELS[member.role] ?? member.role}</span>
                      )}
                    </td>
                    <td data-label="Status">
                      <span className={member.enabled ? 'badge on' : 'badge off'}>
                        {member.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    {canManage && (
                      <td className="cell-actions">
                        {isAdmin && (
                          <button className="btn-sm" onClick={() => openEdit(member)}>
                            <Icon name="edit" size={16} />
                            Edit
                          </button>
                        )}
                        {!isSelf && (
                          <button
                            className="btn-sm"
                            disabled={busy}
                            onClick={() => handleStatusToggle(member)}
                          >
                            <Icon name={member.enabled ? 'close' : 'check'} size={16} />
                            {member.enabled ? 'Disable' : 'Enable'}
                          </button>
                        )}
                      </td>
                    )}
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
