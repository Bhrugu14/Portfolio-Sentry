import { describe, expect, it } from 'vitest'
import { getProjectPrimaryLink } from './project-links'

describe('getProjectPrimaryLink', () => {
  it('links to the case-study page when hasCaseStudy is true', () => {
    const result = getProjectPrimaryLink({ hasCaseStudy: true, slug: 'my-project', liveUrl: null, repoUrl: null })
    expect(result).toEqual({ href: '/projects/my-project', isExternal: false, linkType: 'case-study' })
  })

  it('links to the live URL when there is no case study but a live URL exists', () => {
    const result = getProjectPrimaryLink({ hasCaseStudy: false, slug: 'my-project', liveUrl: 'https://example.com', repoUrl: null })
    expect(result).toEqual({ href: 'https://example.com', isExternal: true, linkType: 'live' })
  })

  it('falls back to the repo URL when there is no case study or live URL', () => {
    const result = getProjectPrimaryLink({ hasCaseStudy: false, slug: 'my-project', liveUrl: null, repoUrl: 'https://github.com/x/y' })
    expect(result).toEqual({ href: 'https://github.com/x/y', isExternal: true, linkType: 'repo' })
  })

  it('falls back to "#" when nothing is available', () => {
    const result = getProjectPrimaryLink({ hasCaseStudy: false, slug: 'my-project', liveUrl: null, repoUrl: null })
    expect(result).toEqual({ href: '#', isExternal: true, linkType: 'none' })
  })

  it('falls back to live/repo URL when hasCaseStudy is true but slug is missing', () => {
    const result = getProjectPrimaryLink({ hasCaseStudy: true, slug: null, liveUrl: 'https://example.com', repoUrl: null })
    expect(result).toEqual({ href: 'https://example.com', isExternal: true, linkType: 'live' })
  })
})
