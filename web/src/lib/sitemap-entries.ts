/**
 * Builds the absolute /projects/{slug} URL for each given slug, joined to
 * baseUrl with exactly one slash regardless of whether baseUrl itself ends
 * with one. Used by src/app/sitemap.ts.
 */
export function buildProjectSitemapUrls(baseUrl: string, slugs: string[]): string[] {
  const trimmedBase = baseUrl.replace(/\/$/, '')
  return slugs.map((slug) => `${trimmedBase}/projects/${slug}`)
}
