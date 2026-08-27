import { describe, expect, it } from 'vitest'
import { pickNewlyVisibleSections } from './section-view-tracking'

describe('pickNewlyVisibleSections', () => {
  it('returns ids that are intersecting and not already tracked', () => {
    const result = pickNewlyVisibleSections(
      [
        { id: 'about', isIntersecting: true },
        { id: 'skills', isIntersecting: true },
      ],
      new Set(),
    )

    expect(result).toEqual(['about', 'skills'])
  })

  it('excludes ids that are not currently intersecting', () => {
    const result = pickNewlyVisibleSections([{ id: 'about', isIntersecting: false }], new Set())

    expect(result).toEqual([])
  })

  it('excludes ids already tracked, even if intersecting', () => {
    const result = pickNewlyVisibleSections([{ id: 'about', isIntersecting: true }], new Set(['about']))

    expect(result).toEqual([])
  })

  it('excludes entries with an empty id', () => {
    const result = pickNewlyVisibleSections([{ id: '', isIntersecting: true }], new Set())

    expect(result).toEqual([])
  })

  it('returns an empty array when given no entries', () => {
    const result = pickNewlyVisibleSections([], new Set())

    expect(result).toEqual([])
  })
})
