import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ROLE_LABELS } from '../roles'
import Icon from './Icon'
import type { IconName } from './Icon'
import TaskBell from './TaskBell'

interface NavItem {
  label: string
  to?: string
  icon: IconName
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: 'home' },
  { label: 'Members', to: '/members', icon: 'users' },
  { label: 'Beneficiaries', to: '/beneficiaries', icon: 'heart' },
  { label: 'Meeting minutes', to: '/minutes', icon: 'notes' },
  { label: 'My notes', to: '/notes', icon: 'edit' },
  { label: 'Allocations', to: '/allocations', icon: 'wallet' },
  { label: 'My deliveries', to: '/my-tasks', icon: 'truck' },
]

interface Props {
  title: string
  subtitle?: string
  /** Adds an intermediate breadcrumb link, for pages nested under a section. */
  parent?: { label: string; to: string }
  /** Desktop header action; on mobile pass the same intent through `fab`. */
  actions?: ReactNode
  fab?: ReactNode
  children: ReactNode
}

export default function AppLayout({ title, subtitle, parent, actions, fab, children }: Props) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Navigating on mobile should dismiss the drawer.
  useEffect(() => {
    setMenuOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.classList.add('no-scroll')
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('no-scroll')
    }
  }, [menuOpen])

  useEffect(() => {
    if (!userMenuOpen) return
    const onPointerDown = (e: MouseEvent) => {
      if (!userMenuRef.current?.contains(e.target as Node)) setUserMenuOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [userMenuOpen])

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : ''
  const isHome = location.pathname === '/'

  return (
    <div className="layout">
      <div
        className={`scrim ${menuOpen ? 'show' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
        <div className="sidebar-head">
          <span className="logo">API&nbsp;BTM</span>
          <span className="sidebar-title">Management</span>
          <button
            className="icon-btn sidebar-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <Icon name="close" />
          </button>
        </div>

        <nav className="nav">
          {NAV_ITEMS.map((item) =>
            item.to ? (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            ) : (
              <span key={item.label} className="nav-link disabled">
                <Icon name={item.icon} />
                <span>{item.label}</span>
                <span className="soon">Soon</span>
              </span>
            ),
          )}
        </nav>

        {user && (
          <div className="sidebar-foot">
            <div className="user-chip">
              <span className="avatar">{initials}</span>
              <span className="user-meta">
                <strong>
                  {user.firstName} {user.lastName}
                </strong>
                <small>{ROLE_LABELS[user.role] ?? user.role}</small>
              </span>
            </div>
            <button className="btn-ghost full" onClick={handleLogout}>
              <Icon name="logout" size={18} />
              Sign out
            </button>
          </div>
        )}
      </aside>

      <div className="main">
        <header className="appbar">
          <button
            className="icon-btn menu-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Icon name="menu" size={22} />
          </button>

          <span className="appbar-title">{title}</span>

          <nav className="breadcrumb" aria-label="Breadcrumb">
            {isHome ? (
              <span aria-current="page">Home</span>
            ) : (
              <>
                <NavLink to="/">Home</NavLink>
                <Icon name="chevronRight" size={15} />
                {parent && (
                  <>
                    <NavLink to={parent.to}>{parent.label}</NavLink>
                    <Icon name="chevronRight" size={15} />
                  </>
                )}
                <span aria-current="page">{title}</span>
              </>
            )}
          </nav>

          {user && <TaskBell />}

          {user && (
            <div className="user-menu" ref={userMenuRef}>
              <button
                className="user-btn"
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <span className="avatar sm">{initials}</span>
                <span className="user-btn-text">
                  <strong>
                    {user.firstName} {user.lastName}
                  </strong>
                  <small>{ROLE_LABELS[user.role] ?? user.role}</small>
                </span>
                <Icon name="chevronDown" size={16} className="user-btn-caret" />
              </button>

              {userMenuOpen && (
                <div className="menu" role="menu">
                  <div className="menu-head">
                    <span className="avatar">{initials}</span>
                    <span className="user-meta">
                      <strong>
                        {user.firstName} {user.lastName}
                      </strong>
                      <small>{user.email}</small>
                    </span>
                  </div>
                  <div className="menu-row">
                    <Icon name="user" size={16} />
                    <span>{user.username}</span>
                    <span className="badge role">{ROLE_LABELS[user.role] ?? user.role}</span>
                  </div>
                  <NavLink to="/profile" className="menu-item" role="menuitem">
                    <Icon name="user" size={17} />
                    My profile
                  </NavLink>
                  <button className="menu-item" role="menuitem" onClick={handleLogout}>
                    <Icon name="logout" size={17} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </header>

        <main className="content">
          <div className="page-head">
            <div>
              <h1>{title}</h1>
              {subtitle && <p className="muted">{subtitle}</p>}
            </div>
            {actions && <div className="head-actions">{actions}</div>}
          </div>
          {children}
        </main>

        {fab}
      </div>
    </div>
  )
}
