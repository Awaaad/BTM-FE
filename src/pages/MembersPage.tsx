import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { ApiRequestError } from '../api/client'
import * as usersApi from '../api/users'
import { ALL_ROLES, ROLE_LABELS, canManageMembers } from '../roles'
import AppLayout from '../components/AppLayout'
import Icon from '../components/Icon'
import type { Member, Role } from '../types'

export default function MembersPage() {
  const { user } = useAuth()
  const canManage = canManageMembers(user?.role)

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
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
                {canManage && <th>Access</th>}
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
