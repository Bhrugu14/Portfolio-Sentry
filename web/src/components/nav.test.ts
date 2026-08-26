import { describe, expect, it } from 'vitest'
import { getVisibleLinks, type SectionVisibility } from './nav'

const noneVisible: SectionVisibility = { about: false, skills: false, projects: false, experience: false }
const allVisible: SectionVisibility = { about: true, skills: true, projects: true, experience: true }

describe('getVisibleLinks', () => {
  it('always includes a contact-keyed link regardless of visibility flags', () => {
    const links = [{ key: 'contact' as const, href: '#contact', label: 'Contact' }]
    expect(getVisibleLinks(links, noneVisible)).toEqual(links)
  })

  it('excludes a link whose section visibility flag is false', () => {
    const links = [{ key: 'projects' as const, href: '#projects', label: 'Projects' }]
    expect(getVisibleLinks(links, noneVisible)).toEqual([])
  })

  it('includes a link whose section visibility flag is true', () => {
    const links = [{ key: 'skills' as const, href: '#skills', label: 'Skills' }]
    expect(getVisibleLinks(links, allVisible)).toEqual(links)
  })

  it('filters a mixed list correctly, preserving order', () => {
    const links = [
      { key: 'about' as const, href: '#about', label: 'About' },
      { key: 'skills' as const, href: '#skills', label: 'Skills' },
      { key: 'projects' as const, href: '#projects', label: 'Projects' },
      { key: 'contact' as const, href: '#contact', label: 'Contact' },
    ]
    const visibility: SectionVisibility = { about: false, skills: true, projects: false, experience: true }
    expect(getVisibleLinks(links, visibility)).toEqual([links[1], links[3]])
  })
})
