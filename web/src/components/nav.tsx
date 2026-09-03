import { ThemeToggle } from '@/components/ui/theme-toggle'
import { SocialLinks } from '@/components/ui/social-links'
import type { SITE_SETTINGS_QUERY_RESULT } from '../../sanity.types'

export interface SectionVisibility {
  about: boolean
  skills: boolean
  projects: boolean
  experience: boolean
}

export function getVisibleLinks<T extends { key: keyof SectionVisibility | 'contact' }>(
  links: T[],
  visibility: SectionVisibility,
): T[] {
  return links.filter((link) => link.key === 'contact' || visibility[link.key])
}

const LINKS: { key: keyof SectionVisibility | 'contact'; href: string; label: string }[] = [
  { key: 'about', href: '#about', label: 'About' },
  { key: 'skills', href: '#skills', label: 'Skills' },
  { key: 'projects', href: '#projects', label: 'Projects' },
  { key: 'experience', href: '#experience', label: 'Experience' },
  { key: 'contact', href: '#contact', label: 'Contact' },
]

export function Nav({
  visibility,
  name,
  socialLinks,
}: {
  visibility: SectionVisibility
  name?: string | null
  socialLinks?: NonNullable<SITE_SETTINGS_QUERY_RESULT>['socialLinks']
}) {
  const links = getVisibleLinks(LINKS, visibility)

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <a href="#home" className="text-sm font-semibold">
          {name || 'Portfolio'}
        </a>
        <ul className="hidden gap-6 text-sm text-muted sm:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="relative transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-accent after:transition-all after:duration-300 hover:text-accent hover:after:w-full"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4">
          {socialLinks && socialLinks.length > 0 && (
            <SocialLinks links={socialLinks} className="hidden gap-4 text-sm sm:flex" />
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
