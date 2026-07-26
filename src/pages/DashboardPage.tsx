import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ROLE_LABELS } from '../roles'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="brand">BTM Management System</span>
        <div className="topbar-user">
          <span>
            {user.firstName} {user.lastName}{' '}
            <span className="role-badge">{ROLE_LABELS[user.role] ?? user.role}</span>
          </span>
          <button className="secondary" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="content">
        <h2>Welcome, {user.firstName}!</h2>
        <p className="muted">
          You are signed in as <strong>{user.username}</strong> ({user.email}).
        </p>

        <div className="card-grid">
          {user.role === 'ADMIN' ? (
            <Link to="/members" className="card feature-card card-link">
              <h3>Members</h3>
              <p className="muted">Assign committee roles, enable or disable accounts.</p>
            </Link>
          ) : (
            <div className="card feature-card">
              <h3>Members</h3>
              <p className="muted">Committee roles &amp; membership.</p>
            </div>
          )}
          <div className="card feature-card">
            <h3>Beneficiaries</h3>
            <p className="muted">Beneficiary registry — coming soon.</p>
          </div>
          <div className="card feature-card">
            <h3>Meeting minutes</h3>
            <p className="muted">Record what was discussed — coming soon.</p>
          </div>
          <div className="card feature-card">
            <h3>Allocations</h3>
            <p className="muted">Provisions &amp; funds for beneficiaries — coming soon.</p>
          </div>
          <div className="card feature-card">
            <h3>Deliveries</h3>
            <p className="muted">Monthly delivery assignments — coming soon.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
