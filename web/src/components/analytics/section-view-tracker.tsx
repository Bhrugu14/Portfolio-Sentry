'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/umami'
import { pickNewlyVisibleSections } from '@/lib/section-view-tracking'

/**
 * Fires a `section_view` analytics event the first time each page section
 * (any `<section id="...">`, e.g. #about, #projects) scrolls at least half
 * into view. Each section only fires once per page load. Purely additive —
 * trackEvent() already no-ops safely when analytics isn't configured, so
 * this never affects rendering or breaks the page either way.
 */
export function SectionViewTracker() {
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section[id]'))
    if (sections.length === 0) return

    const tracked = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        const newlyVisible = pickNewlyVisibleSections(
          entries.map((entry) => ({ id: entry.target.id, isIntersecting: entry.isIntersecting })),
          tracked,
        )

        for (const id of newlyVisible) {
          tracked.add(id)
          trackEvent('section_view', { section: id })
          const target = sections.find((section) => section.id === id)
          if (target) observer.unobserve(target)
        }
      },
      { threshold: 0.5 },
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  return null
}
