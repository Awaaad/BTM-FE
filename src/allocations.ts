import type { Cycle, CycleStatus } from './types'

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const CYCLE_STATUS_LABELS: Record<CycleStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  CLOSED: 'Closed',
}

/** "July 2026", matching the spreadsheet tab names. */
export function cycleLabel(cycle: { year: number; month: number }): string {
  return `${MONTH_NAMES[cycle.month - 1]} ${cycle.year}`
}

/** Rupee amounts, with a dash for food-only lines that carry no cash. */
export function formatAmount(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—'
  return `Rs ${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

/** The month after the newest existing cycle, so "new month" is one click. */
export function nextMonthAfter(cycles: Cycle[]): { year: number; month: number } {
  if (cycles.length === 0) {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  }
  const newest = cycles[0]
  return newest.month === 12
    ? { year: newest.year + 1, month: 1 }
    : { year: newest.year, month: newest.month + 1 }
}
