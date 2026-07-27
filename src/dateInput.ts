/**
 * Parsing helpers for the typed date/time fields.
 *
 * Dates are day-first (14/03/2026). Everything is normalised to the ISO strings
 * the API expects: "yyyy-MM-dd" and "HH:mm".
 */

const pad = (n: number) => `${n}`.padStart(2, '0')

/** Accepts 14/03/2026, 14-3-26, 2026-03-14, 14032026, 140326. */
export function parseDateInput(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  let day: number
  let month: number
  let year: number

  const parts = trimmed.split(/[^\d]+/).filter(Boolean)
  const digits = trimmed.replace(/\D/g, '')

  if (parts.length === 3) {
    if (parts[0].length === 4) {
      ;[year, month, day] = parts.map(Number)
    } else {
      ;[day, month, year] = parts.map(Number)
    }
  } else if (digits.length === 8) {
    day = Number(digits.slice(0, 2))
    month = Number(digits.slice(2, 4))
    year = Number(digits.slice(4))
  } else if (digits.length === 6) {
    day = Number(digits.slice(0, 2))
    month = Number(digits.slice(2, 4))
    year = Number(digits.slice(4))
  } else {
    return null
  }

  if (year < 100) year += 2000
  if (!day || !month || month < 1 || month > 12) return null

  // Round-trip through Date so impossible days (31 February) are rejected.
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }

  return `${year}-${pad(month)}-${pad(day)}`
}

export function formatDateInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return ''
  return `${day}/${month}/${year}`
}

/** Accepts 18:30, 1830, 6.30pm, 6pm, 9h15. */
export function parseTimeInput(input: string): string | null {
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) return null

  const isPm = /p\.?m\.?$/.test(trimmed)
  const isAm = /a\.?m\.?$/.test(trimmed)

  const parts = trimmed.split(/[^\d]+/).filter(Boolean)
  const digits = trimmed.replace(/\D/g, '')

  let hours: number
  let minutes: number

  if (parts.length >= 2) {
    hours = Number(parts[0])
    minutes = Number(parts[1])
  } else if (digits.length === 4) {
    hours = Number(digits.slice(0, 2))
    minutes = Number(digits.slice(2))
  } else if (digits.length === 3) {
    hours = Number(digits.slice(0, 1))
    minutes = Number(digits.slice(1))
  } else if (digits.length > 0 && digits.length <= 2) {
    hours = Number(digits)
    minutes = 0
  } else {
    return null
  }

  if (isPm && hours < 12) hours += 12
  if (isAm && hours === 12) hours = 0
  if (hours > 23 || minutes > 59) return null

  return `${pad(hours)}:${pad(minutes)}`
}

export function formatTimeInput(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : ''
}
