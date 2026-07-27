import { Link, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { ROLE_LABELS } from '../roles'

interface Props {
  title: string
  subtitle?: string
  /** Rendered on the title row, e.g. a primary action button. */
  actions?: ReactNode
  children: ReactNode
}

/** Signed-in page frame: top bar with the current user, plus a titled content area. */
export default function PageShell({ title, subtitle, actions, children }: Props) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          BTM Management System
        </Link>
        <div className="topbar-user">
          {user && (
            <span>
              {user.firstName} {user.lastName}{' '}
              <span className="role-badge">{ROLE_LABELS[user.role] ?? user.role}</span>
            </span>
          )}
          <button className="secondary" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="content">
        <div className="page-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="muted">{subtitle}</p>}
          </div>
          {actions}
        </div>
        {children}
      </main>
    </div>
  )
}
