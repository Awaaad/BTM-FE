import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiRequestError } from '../api/client'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' })
      return
    }

    setSubmitting(true)
    try {
      await register({ firstName, lastName, username, email, password })
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message)
        setFieldErrors(err.errors ?? {})
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <span className="logo">BTM</span>
        <span>Management&nbsp;System</span>
      </div>

      <div className="card auth-card">
        <h1>Create your account</h1>
        <p className="muted">New accounts join as members.</p>

        {error && <div className="alert">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field-row">
            <label>
              First name
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                required
                autoFocus
              />
              {fieldErrors.firstName && <span className="field-error">{fieldErrors.firstName}</span>}
            </label>

            <label>
              Last name
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                required
              />
              {fieldErrors.lastName && <span className="field-error">{fieldErrors.lastName}</span>}
            </label>
          </div>

          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              minLength={3}
              maxLength={30}
            />
            {fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
          </label>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
          </label>

          <div className="field-row">
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
              {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
            </label>

            <label>
              Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              {fieldErrors.confirmPassword && (
                <span className="field-error">{fieldErrors.confirmPassword}</span>
              )}
            </label>
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p className="auth-foot muted">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
