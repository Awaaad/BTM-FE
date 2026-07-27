import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { ApiRequestError } from '../api/client'
import * as profileApi from '../api/profile'
import { ROLE_LABELS } from '../roles'
import AppLayout from '../components/AppLayout'
import Icon from '../components/Icon'

export default function ProfilePage() {
  const { user, setCurrentUser } = useAuth()

  const [details, setDetails] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
  })
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({})
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailNotice, setDetailNotice] = useState<string | null>(null)
  const [savingDetails, setSavingDetails] = useState(false)

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null)
  const [savingPassword, setSavingPassword] = useState(false)

  const inFlight = useRef(false)

  useEffect(() => {
    if (!user) return
    setDetails({
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
    })
  }, [user])

  if (!user) return null

  async function handleDetailsSubmit(event: FormEvent) {
    event.preventDefault()
    if (inFlight.current) return
    inFlight.current = true
    setSavingDetails(true)
    setDetailError(null)
    setDetailNotice(null)
    setDetailErrors({})
    try {
      const response = await profileApi.updateOwnDetails(details)
      setCurrentUser(response.user)
      setDetailNotice('Your details have been saved.')
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setDetailError(err.message)
        setDetailErrors(err.errors ?? {})
      } else {
        setDetailError('Failed to save your details')
      }
    } finally {
      inFlight.current = false
      setSavingDetails(false)
    }
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault()
    if (inFlight.current) return

    setPasswordError(null)
    setPasswordNotice(null)
    setPasswordErrors({})

    if (passwords.next !== passwords.confirm) {
      setPasswordErrors({ confirm: 'Passwords do not match' })
      return
    }

    inFlight.current = true
    setSavingPassword(true)
    try {
      const response = await profileApi.changeOwnPassword(passwords.current, passwords.next)
      setCurrentUser(response.user)
      setPasswords({ current: '', next: '', confirm: '' })
      setPasswordNotice('Password changed. Any other devices have been signed out.')
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setPasswordError(err.message)
        setPasswordErrors(err.errors ?? {})
      } else {
        setPasswordError('Failed to change your password')
      }
    } finally {
      inFlight.current = false
      setSavingPassword(false)
    }
  }

  return (
    <AppLayout title="My profile" subtitle="Your details and password.">
      <div className="card profile-head">
        <span className="avatar lg">
          {`${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()}
        </span>
        <div>
          <h2>
            {user.firstName} {user.lastName}
          </h2>
          <p className="muted">{user.email}</p>
          <span className="badge role">{ROLE_LABELS[user.role] ?? user.role}</span>
        </div>
      </div>

      <div className="card form-card">
        <h2>Personal details</h2>
        {detailError && <div className="alert">{detailError}</div>}
        {detailNotice && <div className="notice">{detailNotice}</div>}

        <form onSubmit={handleDetailsSubmit} noValidate>
          <div className="field-row">
            <label>
              First name
              <input
                type="text"
                value={details.firstName}
                onChange={(e) => setDetails({ ...details, firstName: e.target.value })}
                required
              />
              {detailErrors.firstName && <span className="field-error">{detailErrors.firstName}</span>}
            </label>
            <label>
              Last name
              <input
                type="text"
                value={details.lastName}
                onChange={(e) => setDetails({ ...details, lastName: e.target.value })}
                required
              />
              {detailErrors.lastName && <span className="field-error">{detailErrors.lastName}</span>}
            </label>
          </div>

          <div className="field-row">
            <label>
              Username
              <input
                type="text"
                value={details.username}
                onChange={(e) => setDetails({ ...details, username: e.target.value })}
                required
              />
              <span className="hint">You sign in with this or your email.</span>
              {detailErrors.username && <span className="field-error">{detailErrors.username}</span>}
            </label>
            <label>
              Email
              <input
                type="email"
                value={details.email}
                onChange={(e) => setDetails({ ...details, email: e.target.value })}
                required
              />
              {detailErrors.email && <span className="field-error">{detailErrors.email}</span>}
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={savingDetails}>
              {savingDetails ? 'Saving…' : 'Save details'}
            </button>
          </div>
        </form>
      </div>

      <div className="card form-card">
        <h2>Change password</h2>
        {passwordError && <div className="alert">{passwordError}</div>}
        {passwordNotice && <div className="notice">{passwordNotice}</div>}

        <form onSubmit={handlePasswordSubmit} noValidate>
          <label>
            Current password
            <input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              autoComplete="current-password"
              required
            />
            {passwordErrors.currentPassword && (
              <span className="field-error">{passwordErrors.currentPassword}</span>
            )}
          </label>

          <div className="field-row">
            <label>
              New password
              <input
                type="password"
                value={passwords.next}
                onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                autoComplete="new-password"
                minLength={8}
                required
              />
              {passwordErrors.newPassword && (
                <span className="field-error">{passwordErrors.newPassword}</span>
              )}
            </label>
            <label>
              Confirm new password
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                autoComplete="new-password"
                required
              />
              {passwordErrors.confirm && <span className="field-error">{passwordErrors.confirm}</span>}
            </label>
          </div>

          <p className="hint">
            <Icon name="logout" size={14} /> Changing your password signs out your other
            devices. You stay signed in here.
          </p>

          <div className="form-actions">
            <button type="submit" disabled={savingPassword}>
              {savingPassword ? 'Saving…' : 'Change password'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
