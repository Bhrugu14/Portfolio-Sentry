const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })

export function formatDateRange(startDate: string | null, endDate: string | null): string {
  const start = startDate ? formatter.format(new Date(startDate)) : 'Unknown'
  const end = endDate ? formatter.format(new Date(endDate)) : 'Present'
  return `${start} — ${end}`
}
