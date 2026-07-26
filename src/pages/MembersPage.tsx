import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiRequestError } from '../api/client'
import * as usersApi from '../api/users'
import { ALL_ROLES, ROLE_LABELS } from '../roles'
import type { Member, Role } from '../types'

export default function MembersPage() {
  const { user } = useAuth()

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** id of the row with an in-flight request, to disable its controls. */
  const [busyId, setBusyId] = useState<number | null>(null)
  // Synchronous guard: state updates are async, so a rapid double-click could
  // otherwise fire two requests before the disabled attribute renders.
  const inFlight = useRef(false)

  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    if (!isAdmin) return
    usersApi
      .listMembers()
      .then(setMembers)
      .catch((err) =>
        setError(err instanceof ApiRequestError ? err.message : 'Failed to load members'),
      )
      .finally(() => setLoading(false))
  }, [isAdmin])

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

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
    <div className="app-shell">
      <header className="topbar">
        <span className="brand">BTM Management System</span>
        <Link to="/">Back to dashboard</Link>
      </header>

      <main className="content">
        <h2>Members</h2>
        <p className="muted">Assign committee roles and manage account access.</p>

        {error && <div className="alert">{error}</div>}

        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <div className="table-wrap card">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const isSelf = member.id === user?.id
                  const busy = busyId === member.id
                  return (
                    <tr key={member.id} className={member.enabled ? '' : 'row-disabled'}>
                      <td>
                        {member.firstName} {member.lastName}
                        {isSelf && <span className="muted"> (you)</span>}
                      </td>
                      <td>{member.username}</td>
                      <td>{member.email}</td>
                      <td>
                        <select
                          value={member.role}
                          disabled={isSelf || busy}
                          onChange={(e) => handleRoleChange(member, e.target.value as Role)}
                        >
                          {ALL_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="nowrap">
                        <span className={member.enabled ? 'status-badge on' : 'status-badge off'}>
                          {member.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="nowrap">{new Date(member.createdAt).toLocaleDateString()}</td>
                      <td className="nowrap">
                        {!isSelf && (
                          <button
                            className="secondary"
                            disabled={busy}
                            onClick={() => handleStatusToggle(member)}
                          >
                            {member.enabled ? 'Disable' : 'Enable'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
