export interface SectionIntersection {
  id: string
  isIntersecting: boolean
}

/**
 * Given a batch of IntersectionObserver entries (reduced to id +
 * isIntersecting) and the set of section ids already tracked this page
 * load, returns the ids that just became visible for the first time —
 * i.e. the ones the caller should fire a `section_view` event for next.
 */
export function pickNewlyVisibleSections(entries: SectionIntersection[], alreadyTracked: ReadonlySet<string>): string[] {
  return entries.filter((entry) => entry.isIntersecting && entry.id && !alreadyTracked.has(entry.id)).map((entry) => entry.id)
}
