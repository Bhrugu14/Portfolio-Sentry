import type { MetadataRoute } from 'next'
import { client } from '@/sanity/client'
import { PROJECT_SLUGS_QUERY } from '@/sanity/queries'
import { buildProjectSitemapUrls } from '@/lib/sitemap-entries'
import { env } from '@/lib/env'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // No canonical site URL configured — degrade to an empty (still valid)
  // sitemap rather than emitting URLs that point at the wrong domain. See
  // README.md's "Environment variables" section for NEXT_PUBLIC_SITE_URL.
  if (!env.siteUrl) return []

  const slugs = await client.withConfig({ useCdn: false }).fetch(PROJECT_SLUGS_QUERY)
  // The GROQ query already filters to defined(slug.current), but the
  // generated type is conservative about that — narrow it here too.
  const definedSlugs = slugs.map(({ slug }) => slug).filter((slug): slug is string => slug !== null)
  const projectUrls = buildProjectSitemapUrls(env.siteUrl, definedSlugs)

  return [
    { url: env.siteUrl, lastModified: new Date() },
    ...projectUrls.map((url) => ({ url, lastModified: new Date() })),
  ]
}
