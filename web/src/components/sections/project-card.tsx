'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { SanityImage } from '@/components/ui/sanity-image'
import { getProjectPrimaryLink, getVisibilityBadge } from '@/lib/project-links'
import type { PROJECTS_QUERY_RESULT } from '../../../sanity.types'

export function ProjectCard({ project, index = 0 }: { project: PROJECTS_QUERY_RESULT[number]; index?: number }) {
  const { href: primaryHref, isExternal, linkType } = getProjectPrimaryLink(project)
  const visibilityBadge = getVisibilityBadge(project.visibility)

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
      {((project.techStack && project.techStack.length > 0) || visibilityBadge) && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {visibilityBadge && (
            <li
              title={visibilityBadge.title}
              className="whitespace-nowrap rounded-full border border-accent/40 px-2 py-0.5 text-xs text-accent"
            >
              {visibilityBadge.label}
            </li>
          )}
          {project.techStack?.map((tech) => (
            <li key={tech} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
              {tech}
            </li>
          ))}
        </ul>
      )}
    </>
  )

  const className =
    'group block rounded-xl p-2 transition-all duration-200 hover:bg-surface hover:-translate-y-0.5 active:scale-[0.98]'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      {isExternal ? (
        <a
          href={primaryHref}
          target="_blank"
          rel="noopener noreferrer"
          data-umami-event="project_link_click"
          data-umami-event-project={project.title}
          data-umami-event-link-type={linkType}
          className={className}
        >
          {content}
        </a>
      ) : (
        <Link href={primaryHref} className={className}>
          {content}
        </Link>
      )}
    </motion.div>
  )
}
