import type { MetadataRoute } from 'next'
import { env } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    // Omit entirely when no canonical URL is configured — a sitemap
    // reference pointing at the wrong domain would be actively wrong,
    // not just missing. See sitemap.ts and README.md's env var table.
    ...(env.siteUrl ? { sitemap: `${env.siteUrl}/sitemap.xml` } : {}),
  }
}
