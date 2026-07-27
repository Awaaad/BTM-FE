import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import PageShell from '../components/PageShell'

interface Feature {
  title: string
  description: string
  to?: string
  adminOnly?: boolean
}

const FEATURES: Feature[] = [
  {
    title: 'Members',
    description: 'Assign committee roles, enable or disable accounts.',
    to: '/members',
    adminOnly: true,
  },
  {
    title: 'Beneficiaries',
    description: 'People and households the organisation supports.',
    to: '/beneficiaries',
  },
  { title: 'Meeting minutes', description: 'Record what was discussed — coming soon.' },
  { title: 'Allocations', description: 'Provisions & funds for beneficiaries — coming soon.' },
  { title: 'Deliveries', description: 'Monthly delivery assignments — coming soon.' },
]

export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <PageShell
      title={`Welcome, ${user.firstName}!`}
      subtitle={`You are signed in as ${user.username} (${user.email}).`}
    >
      <div className="card-grid">
        {FEATURES.map((feature) => {
          const available = feature.to && (!feature.adminOnly || user.role === 'ADMIN')
          return available ? (
            <Link key={feature.title} to={feature.to!} className="card feature-card card-link">
              <h3>{feature.title}</h3>
              <p className="muted">{feature.description}</p>
            </Link>
          ) : (
            <div key={feature.title} className="card feature-card">
              <h3>{feature.title}</h3>
              <p className="muted">{feature.description}</p>
            </div>
          )
        })}
      </div>
    </PageShell>
  )
}
