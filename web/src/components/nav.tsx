import { ThemeToggle } from '@/components/ui/theme-toggle'

const LINKS = [
  { href: '#about', label: 'About' },
  { href: '#skills', label: 'Skills' },
  { href: '#projects', label: 'Projects' },
  { href: '#experience', label: 'Experience' },
  { href: '#contact', label: 'Contact' },
]

export function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <a href="#home" className="text-sm font-semibold">
          Portfolio
        </a>
        <ul className="hidden gap-6 text-sm text-muted sm:flex">
          {LINKS.map((link) => (
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
