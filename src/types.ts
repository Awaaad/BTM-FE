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

export interface ApiError {
  timestamp: string
  status: number
  message: string
  errors?: Record<string, string>
}
