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

export type MeetingType = 'COMMITTEE' | 'GENERAL' | 'SPECIAL' | 'ANNUAL_GENERAL'
export type MeetingStatus = 'DRAFT' | 'FINALISED'

/** Row shape returned by the list endpoint (no long text bodies). */
export interface MeetingSummary {
  id: number
  title: string
  meetingDate: string
  startTime: string | null
  location: string | null
  type: MeetingType
  status: MeetingStatus
  attendeeCount: number
  /** Short excerpt of the discussion (or agenda) for the list row. */
  summary: string | null
}

export interface MeetingAttendee {
  id: number
  firstName: string
  lastName: string
  username: string
}

export interface Meeting {
  id: number
  title: string
  meetingDate: string
  startTime: string | null
  location: string | null
  type: MeetingType
  status: MeetingStatus
  agenda: string | null
  discussion: string | null
  decisions: string | null
  apologies: string | null
  attendees: MeetingAttendee[]
  lastUpdatedBy: string | null
}

export interface MeetingInput {
  title: string
  meetingDate: string
  startTime?: string | null
  location?: string
  type: MeetingType
  status?: MeetingStatus
  agenda?: string
  discussion?: string
  decisions?: string
  apologies?: string
  attendeeIds?: number[]
}

export interface Note {
  id: number
  noteDate: string
  title: string | null
  body: string
  meetingId: number | null
  meetingTitle: string | null
  updatedAt: string
}

export interface NoteInput {
  noteDate: string
  title?: string
  body: string
  meetingId?: number | null
}

export interface ApiError {
  timestamp: string
  status: number
  message: string
  errors?: Record<string, string>
}
