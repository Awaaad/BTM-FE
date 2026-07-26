import type { Role } from './types'

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrator',
  PRESIDENT: 'President',
  VICE_PRESIDENT: 'Vice President',
  SECRETARY: 'Secretary',
  ASSISTANT_SECRETARY: 'Assistant Secretary',
  TREASURER: 'Treasurer',
  ASSISTANT_TREASURER: 'Assistant Treasurer',
  MEMBER: 'Member',
}

/** Every role an admin can assign, in display order. */
export const ALL_ROLES: Role[] = [
  'ADMIN',
  'PRESIDENT',
  'VICE_PRESIDENT',
  'SECRETARY',
  'ASSISTANT_SECRETARY',
  'TREASURER',
  'ASSISTANT_TREASURER',
  'MEMBER',
]
