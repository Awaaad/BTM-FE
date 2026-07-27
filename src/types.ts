export type Role =
  | 'ADMIN'
  | 'PRESIDENT'
  | 'VICE_PRESIDENT'
  | 'SECRETARY'
  | 'ASSISTANT_SECRETARY'
  | 'TREASURER'
  | 'ASSISTANT_TREASURER'
  | 'MEMBER'

export interface User {
  id: number
  firstName: string
  lastName: string
  username: string
  email: string
  role: Role
}

/** Full member record returned by the admin user-management endpoints. */
export interface Member extends User {
  enabled: boolean
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export type BeneficiaryStatus = 'ACTIVE' | 'ARCHIVED'

export interface Beneficiary {
  id: number
  firstName: string
  lastName: string
  phone: string | null
  email: string | null
  address: string | null
  householdSize: number
  status: BeneficiaryStatus
  notes: string | null
  registeredOn: string
  lastUpdatedBy: string | null
}

/** Payload for creating/updating a beneficiary. */
export interface BeneficiaryInput {
  firstName: string
  lastName: string
  phone?: string
  email?: string
  address?: string
  householdSize?: number
  status?: BeneficiaryStatus
  notes?: string
}

export interface ApiError {
  timestamp: string
  status: number
  message: string
  errors?: Record<string, string>
}
