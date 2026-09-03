export interface ProjectLinkFields {
  hasCaseStudy: boolean | null
  slug: string | null
  liveUrl?: string | null
  repoUrl?: string | null
}

const VISIBILITY_BADGES: Record<string, { label: string; title: string }> = {
  company: { label: 'Company project', title: 'Built for an employer/client — code is private' },
  private: { label: 'Private project', title: 'Personal project kept closed-source' },
}

/** Short badge for non-public projects (explains why there's no repo link). Public/unset projects get no badge. */
export function getVisibilityBadge(visibility?: string | null) {
  return (visibility && VISIBILITY_BADGES[visibility]) || null
}

export type ProjectLinkType = 'case-study' | 'live' | 'repo' | 'none'

/** Where a project card/spotlight should link, whether that's an external link (new tab) or an
 * internal case-study route, and which kind of link it resolved to — so click tracking can tell
 * "went to the live site" apart from "went to the repo", not just which project was clicked. */
export function getProjectPrimaryLink(project: ProjectLinkFields): { href: string; isExternal: boolean; linkType: ProjectLinkType } {
  if (project.hasCaseStudy && project.slug) {
    return { href: `/projects/${project.slug}`, isExternal: false, linkType: 'case-study' }
  }
  if (project.liveUrl) return { href: project.liveUrl, isExternal: true, linkType: 'live' }
  if (project.repoUrl) return { href: project.repoUrl, isExternal: true, linkType: 'repo' }
  return { href: '#', isExternal: true, linkType: 'none' }
}
