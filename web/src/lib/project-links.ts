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

/** Where a project card/spotlight should link, and whether that's an external link (new tab) or an internal case-study route. */
export function getProjectPrimaryLink(project: ProjectLinkFields): { href: string; isExternal: boolean } {
  if (project.hasCaseStudy && project.slug) {
    return { href: `/projects/${project.slug}`, isExternal: false }
  }
  return { href: project.liveUrl || project.repoUrl || '#', isExternal: true }
}
