import Link from 'next/link'
import { SanityImage } from '@/components/ui/sanity-image'
import { getProjectPrimaryLink } from '@/lib/project-links'
import type { PROJECTS_QUERY_RESULT } from '../../../sanity.types'

export function ProjectCard({ project }: { project: PROJECTS_QUERY_RESULT[number] }) {
  const { href: primaryHref, isExternal } = getProjectPrimaryLink(project)

  const content = (
    <>
      <SanityImage
        value={project.coverImage}
        width={600}
        height={360}
        className="w-full rounded-lg border border-border object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
      <div className="mt-4 flex items-center gap-2">
        <h3 className="text-lg font-medium">{project.title}</h3>
        {project.featured && (
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">Featured</span>
        )}
      </div>
      <p className="mt-2 text-sm text-muted">{project.summary}</p>
      {project.techStack && project.techStack.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {project.techStack.map((tech) => (
            <li key={tech} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
              {tech}
            </li>
          ))}
        </ul>
      )}
    </>
  )

  const className = 'group block rounded-xl p-2 transition-colors hover:bg-surface'

  if (isExternal) {
    return (
      <a href={primaryHref} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    )
  }

  return (
    <Link href={primaryHref} className={className}>
      {content}
    </Link>
  )
}
