import { describe, expect, it } from 'vitest'
import { formatDateRange } from './format-date-range'

describe('formatDateRange', () => {
  it('formats a closed range', () => {
    expect(formatDateRange('2021-06-01', '2023-09-01')).toBe('Jun 2021 — Sep 2023')
  })

  it('formats an open-ended range as Present', () => {
    expect(formatDateRange('2023-10-01', null)).toBe('Oct 2023 — Present')
  })

  it('formats a missing start date as Unknown', () => {
    expect(formatDateRange(null, '2023-09-01')).toBe('Unknown — Sep 2023')
  })
})
