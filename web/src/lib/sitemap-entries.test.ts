import { describe, expect, it } from 'vitest'
import { buildProjectSitemapUrls } from './sitemap-entries'

describe('buildProjectSitemapUrls', () => {
  it('joins the base URL and each slug with exactly one slash', () => {
    expect(buildProjectSitemapUrls('https://example.com', ['my-project'])).toEqual(['https://example.com/projects/my-project'])
  })

  it('strips a trailing slash from the base URL before joining', () => {
    expect(buildProjectSitemapUrls('https://example.com/', ['my-project'])).toEqual(['https://example.com/projects/my-project'])
  })

  it('preserves slug order across multiple projects', () => {
    expect(buildProjectSitemapUrls('https://example.com', ['first', 'second'])).toEqual([
      'https://example.com/projects/first',
      'https://example.com/projects/second',
    ])
  })

  it('returns an empty array when there are no slugs', () => {
    expect(buildProjectSitemapUrls('https://example.com', [])).toEqual([])
  })
})
