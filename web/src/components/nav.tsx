import { ThemeToggle } from '@/components/ui/theme-toggle'

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

export function Nav({ visibility }: { visibility: SectionVisibility }) {
  const links = getVisibleLinks(LINKS, visibility)

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <a href="#home" className="text-sm font-semibold">
          Portfolio
        </a>
        <ul className="hidden gap-6 text-sm text-muted sm:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="transition-colors hover:text-accent">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <ThemeToggle />
      </nav>
    </header>
  )
}
