import { ProjectCard } from './project-card'
import type { PROJECTS_QUERY_RESULT } from '../../../sanity.types'

export function Projects({ projects }: { projects: PROJECTS_QUERY_RESULT }) {
  if (projects.length === 0) return null

  return (
    <section id="projects" className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="mb-10 text-sm font-semibold uppercase tracking-widest text-accent">Projects</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project._id} project={project} />
        ))}
      </div>
    </section>
  )
}
