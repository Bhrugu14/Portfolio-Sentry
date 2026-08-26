export interface ProjectLinkFields {
  hasCaseStudy: boolean | null
  slug: string | null
  liveUrl?: string | null
  repoUrl?: string | null
}

/** Where a project card/spotlight should link, and whether that's an external link (new tab) or an internal case-study route. */
export function getProjectPrimaryLink(project: ProjectLinkFields): { href: string; isExternal: boolean } {
  if (project.hasCaseStudy && project.slug) {
    return { href: `/projects/${project.slug}`, isExternal: false }
  }
  return { href: project.liveUrl || project.repoUrl || '#', isExternal: true }
}
