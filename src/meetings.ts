import type { MeetingType } from './types'

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  COMMITTEE: 'Committee',
  GENERAL: 'General',
  SPECIAL: 'Special',
  ANNUAL_GENERAL: 'Annual general',
}

export const MEETING_TYPES: MeetingType[] = ['COMMITTEE', 'GENERAL', 'SPECIAL', 'ANNUAL_GENERAL']

/** "14 March 2026" — unambiguous, and avoids day/month confusion. */
export function formatMeetingDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Backend sends "18:30:00"; show "18:30". */
export function formatMeetingTime(time: string | null): string | null {
  return time ? time.slice(0, 5) : null
}
