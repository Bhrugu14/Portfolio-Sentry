import Link from 'next/link'
import { SanityImage } from '@/components/ui/sanity-image'
import { getProjectPrimaryLink } from '@/lib/project-links'
import type { PROJECTS_QUERY_RESULT } from '../../../sanity.types'

/** A larger "spotlight" treatment for one project, used only by the Professional theme's Projects section. */
export function FeaturedProjectCard({ project }: { project: PROJECTS_QUERY_RESULT[number] }) {
  const { href: primaryHref, isExternal } = getProjectPrimaryLink(project)

  const content = (
    <div className="grid overflow-hidden rounded-xl border border-border bg-surface sm:grid-cols-2">
      <SanityImage
        value={project.coverImage}
        width={800}
        height={480}
        className="h-full w-full object-cover"
      />
      <div className="flex flex-col justify-center gap-3 p-6">
        <span className="text-xs font-semibold uppercase tracking-widest text-accent">Featured</span>
        <h3 className="text-xl font-semibold">{project.title}</h3>
        <p className="text-sm text-muted">{project.summary}</p>
        {project.techStack && project.techStack.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {project.techStack.map((tech) => (
              <li key={tech} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                {tech}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )

  if (isExternal) {
    return (
      <a href={primaryHref} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    )
  }

  return (
    <Link href={primaryHref} className="block">
      {content}
    </Link>
  )
}
