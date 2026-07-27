import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import AppLayout from '../components/AppLayout'
import Icon from '../components/Icon'
import type { IconName } from '../components/Icon'

interface Feature {
  title: string
  description: string
  icon: IconName
  to?: string
}

const FEATURES: Feature[] = [
  { title: 'Members', description: 'Committee roles and access.', icon: 'users', to: '/members' },
  {
    title: 'Beneficiaries',
    description: 'People and households we support.',
    icon: 'heart',
    to: '/beneficiaries',
  },
  {
    title: 'Meeting minutes',
    description: 'What was discussed and decided.',
    icon: 'notes',
    to: '/minutes',
  },
  { title: 'My notes', description: 'Private jottings, by date.', icon: 'edit', to: '/notes' },
  { title: 'Allocations', description: 'Provisions and funds.', icon: 'wallet' },
  { title: 'Deliveries', description: 'Monthly delivery duty.', icon: 'truck' },
]

export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <AppLayout
      title={`Welcome, ${user.firstName}`}
      subtitle={`Signed in as ${user.username}`}
    >
      <div className="card-grid">
        {FEATURES.map((feature) => {
          const body = (
            <>
              <span className="tile">
                <Icon name={feature.icon} size={22} />
              </span>
              <span>
                <h3>{feature.title}</h3>
                <p className="muted">{feature.description}</p>
              </span>
            </>
          )

          return feature.to ? (
            <Link key={feature.title} to={feature.to} className="card feature-card is-link">
              {body}
            </Link>
          ) : (
            <div key={feature.title} className="card feature-card locked">
              {body}
            </div>
          )
        })}
      </div>
    </AppLayout>
  )
}
