import { ProjectCard } from './project-card'
import { FeaturedProjectCard } from './featured-project-card'
import type { ThemeName } from '@/lib/theme'
import type { PROJECTS_QUERY_RESULT } from '../../../sanity.types'

export function Projects({ projects, theme }: { projects: PROJECTS_QUERY_RESULT; theme: ThemeName }) {
  if (projects.length === 0) return null

  const featured = theme === 'professional' ? projects.find((project) => project.featured) : undefined
  const rest = featured ? projects.filter((project) => project._id !== featured._id) : projects

  return (
    <section id="projects" className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="mb-10 text-sm font-semibold uppercase tracking-widest text-accent">Projects</h2>
      {featured && (
        <div className="mb-8">
          <FeaturedProjectCard project={featured} />
        </div>
      )}
      <div className="grid gap-6 sm:grid-cols-2">
        {rest.map((project) => (
          <ProjectCard key={project._id} project={project} />
        ))}
      </div>
    </section>
  )
}
