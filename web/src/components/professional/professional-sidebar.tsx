'use client'

import { useEffect, useState } from 'react'
import { PortableText } from 'next-sanity'
import { SanityImage } from '@/components/ui/sanity-image'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { SocialLinks } from '@/components/ui/social-links'
import { ResumeDownloadLink } from '@/components/analytics/resume-download-link'
import { getVisibleLinks, type SectionVisibility } from '@/components/nav'
import type { SITE_SETTINGS_QUERY_RESULT } from '../../../sanity.types'

const LINKS: { key: keyof SectionVisibility | 'contact'; href: string; label: string }[] = [
  { key: 'skills', href: '#skills', label: 'Skills' },
  { key: 'projects', href: '#projects', label: 'Projects' },
  { key: 'experience', href: '#experience', label: 'Experience' },
  { key: 'contact', href: '#contact', label: 'Contact' },
]

export function ProfessionalSidebar({
  settings,
  visibility,
}: {
  settings: NonNullable<SITE_SETTINGS_QUERY_RESULT>
  visibility: SectionVisibility
}) {
  const links = getVisibleLinks(LINKS, visibility)
  const [activeHref, setActiveHref] = useState<string | null>(null)
  const resumeUrl = settings.resumeFile?.asset?.url
  const resumeFileName = settings.resumeFile?.asset?.originalFilename || 'resume.pdf'

  useEffect(() => {
    const sections = links
      .map((link) => document.getElementById(link.href.slice(1)))
      .filter((el): el is HTMLElement => el !== null)

    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (mostVisible) setActiveHref(`#${mostVisible.target.id}`)
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
    // Re-run when the visible link set changes so the observer always
    // watches the sections currently in the sidebar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility])

  return (
    <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:h-fit lg:max-h-[calc(100dvh-6rem)] lg:w-64 lg:overflow-y-auto">
      <SanityImage
        value={settings.profileImage}
        width={96}
        height={96}
        priority
        className="rounded-full border border-border object-cover"
      />
      <div>
        <h1 className="text-2xl font-semibold">{settings.name}</h1>
        <p className="mt-1 text-muted">{settings.title}</p>
      </div>
      {settings.socialLinks && settings.socialLinks.length > 0 && (
        <SocialLinks links={settings.socialLinks} className="flex flex-wrap gap-4 text-sm" />
      )}
      {settings.about && (
        <div className="prose prose-neutral prose-sm max-w-none text-foreground dark:prose-invert">
          <PortableText value={settings.about} />
        </div>
      )}
      <nav>
        <ul className="flex flex-col gap-2 text-sm">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                aria-current={activeHref === link.href ? 'true' : undefined}
                className={`inline-block transition-all duration-200 hover:translate-x-1 hover:text-accent ${
                  activeHref === link.href ? 'font-semibold text-accent' : 'text-muted'
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {resumeUrl && (
        <ResumeDownloadLink href={resumeUrl} fileName={resumeFileName} className="text-sm font-medium text-accent hover:underline">
          Download résumé
        </ResumeDownloadLink>
      )}
      <ThemeToggle />
    </aside>
  )
}
