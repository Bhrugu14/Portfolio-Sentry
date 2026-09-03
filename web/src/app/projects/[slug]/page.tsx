import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PortableText } from 'next-sanity'
import { sanityFetch } from '@/sanity/live'
import { PROJECT_BY_SLUG_QUERY, PROJECT_SLUGS_QUERY } from '@/sanity/queries'
import { SanityImage } from '@/components/ui/sanity-image'
import { getVisibilityBadge } from '@/lib/project-links'
import { client } from '@/sanity/client'

export async function generateStaticParams() {
  const slugs = await client.withConfig({ useCdn: false }).fetch(PROJECT_SLUGS_QUERY)
  return slugs.map(({ slug }) => ({ slug }))
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: project } = await sanityFetch({ query: PROJECT_BY_SLUG_QUERY, params: { slug } })

  if (!project) return notFound()

  const visibilityBadge = getVisibilityBadge(project.visibility)

  return (
    <main id="main-content" className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/#projects" className="text-sm text-muted hover:text-accent">
        &larr; Back to projects
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">{project.title}</h1>
      <SanityImage
        value={project.coverImage}
        width={900}
        fit="max"
        priority
        className="mt-6 w-full rounded-lg border border-border"
      />
      {((project.techStack && project.techStack.length > 0) || visibilityBadge) && (
        <ul className="mt-6 flex flex-wrap gap-1.5">
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
      <div className="mt-8 flex gap-4 text-sm">
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-umami-event="project_link_click"
            data-umami-event-project={project.title}
            className="text-accent hover:underline"
          >
            Live site &rarr;
          </a>
        )}
        {project.repoUrl && (
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-umami-event="project_link_click"
            data-umami-event-project={project.title}
            className="text-accent hover:underline"
          >
            Repository &rarr;
          </a>
        )}
      </div>
      {project.body && (
        <div className="prose prose-neutral mt-10 max-w-none text-foreground dark:prose-invert">
          <PortableText value={project.body} />
        </div>
      )}
    </main>
  )
}
