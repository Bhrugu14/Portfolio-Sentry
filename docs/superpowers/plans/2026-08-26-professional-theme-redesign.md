# Professional Theme Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Professional theme a real structural transformation (fixed sidebar layout, numbered sections, featured-project spotlight) instead of today's CSS-only tweaks, and make both themes' navigation only show links for sections that actually have content.

**Architecture:** `web/src/app/page.tsx` branches its top-level composition on `settings.appearance?.activeTheme`. Minimal keeps rendering exactly what it does today (`Nav` + stacked sections). Professional renders a new `ProfessionalLayout` (sidebar + scrolling content) that absorbs Hero/About into the sidebar and reuses Skills/Experience/Contact as shared components restyled via existing `.theme-professional` CSS. Projects branches internally (shared data, different presentation) to add a featured-project spotlight for Professional only. A small pure `getVisibleLinks` helper (Vitest-tested) filters both Nav's and the new Sidebar's link lists against which sections actually have content.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Vitest. No new dependencies, no Sanity schema changes.

**Spec:** `docs/superpowers/specs/2026-08-26-professional-theme-redesign-design.md`

## Global Constraints

- No Sanity schema changes — this is 100% frontend.
- Minimal's existing visual appearance must not change (only gains conditional nav-link filtering, which is itself a bug fix, not a visual change, when all sections have content).
- Experience stays a plain chronological list — no tabs (explicitly out of scope).
- No copying of any specific site's exact colors/branding — only the sidebar/numbered-section *structural pattern* is being adapted; colors remain Studio-configured via the existing multi-theme system.
- `getVisibleLinks` and any other new pure logic get Vitest unit tests, matching this project's existing convention (colocated `*.test.ts` files, `environment: 'node'` — no component-rendering test infra exists in this repo, so verification of actual rendered UI is done via Playwright, not React Testing Library).

---

### Task 1: Conditional nav visibility (Minimal)

**Files:**
- Modify: `web/src/components/nav.tsx`
- Create: `web/src/components/nav.test.ts`
- Modify: `web/src/app/page.tsx`

**Interfaces:**
- Produces (used by Task 3): `export interface SectionVisibility { about: boolean; skills: boolean; projects: boolean; experience: boolean }` and `export function getVisibleLinks<T extends { key: keyof SectionVisibility | 'contact' }>(links: T[], visibility: SectionVisibility): T[]`, both exported from `web/src/components/nav.tsx`.

- [ ] **Step 1: Write the failing tests**

Create `web/src/components/nav.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web && npx vitest run src/components/nav.test.ts`
Expected: FAIL with "does not provide an export named 'getVisibleLinks'" (function doesn't exist yet).

- [ ] **Step 3: Implement**

Replace the full contents of `web/src/components/nav.tsx`:

```tsx
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd web && npx vitest run src/components/nav.test.ts`
Expected: PASS, all 4 tests green.

- [ ] **Step 5: Wire visibility into page.tsx**

Modify `web/src/app/page.tsx` — replace the whole file:

```tsx
import { notFound } from "next/navigation";
import { sanityFetch } from "@/sanity/live";
import {
  EXPERIENCE_QUERY,
  PROJECTS_QUERY,
  SITE_SETTINGS_QUERY,
} from "@/sanity/queries";
import { Nav, type SectionVisibility } from "@/components/nav";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Skills } from "@/components/sections/skills";
import { Projects } from "@/components/sections/projects";
import { Experience } from "@/components/sections/experience";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";

export default async function Home() {
  const [{ data: settings }, { data: projects }, { data: experience }] =
    await Promise.all([
      sanityFetch({ query: SITE_SETTINGS_QUERY, stega: false }),
      sanityFetch({ query: PROJECTS_QUERY, stega: false }),
      sanityFetch({ query: EXPERIENCE_QUERY, stega: false }),
    ]);

  if (!settings) return notFound();

  const visibility: SectionVisibility = {
    about: Boolean(settings.about),
    skills: (settings.skillCategories?.length ?? 0) > 0,
    projects: projects.length > 0,
    experience: experience.length > 0,
  };

  return (
    <>
      <Nav visibility={visibility} />
      <main>
        <Hero settings={settings} />
        <About settings={settings} />
        <Skills settings={settings} />
        <Projects projects={projects} />
        <Experience items={experience} />
        <Contact settings={settings} />
      </main>
      <Footer name={settings.name} />
    </>
  );
}
```

(`<Projects>`'s call site is unchanged here — Task 2 adds a required `theme` prop to `Projects` and updates this call site as part of that task, and Task 4 replaces this whole file anyway. Keeping this step's edit scoped to just the `visibility`/`Nav` wiring keeps this task independently typechecking on its own.)

- [ ] **Step 6: Run the full web test suite and typecheck**

Run: `cd web && npx vitest run && npx tsc --noEmit`
Expected: PASS — the new `nav.test.ts` tests plus all existing tests green, no type errors.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/nav.tsx web/src/components/nav.test.ts web/src/app/page.tsx
git commit -m "Filter nav links to sections that actually have content"
```

---

### Task 2: Featured-project spotlight for Projects (Professional only)

**Files:**
- Create: `web/src/lib/project-links.ts`
- Create: `web/src/lib/project-links.test.ts`
- Create: `web/src/lib/theme.ts`
- Modify: `web/src/components/sections/project-card.tsx`
- Create: `web/src/components/sections/featured-project-card.tsx`
- Modify: `web/src/components/sections/projects.tsx`

**Interfaces:**
- Consumes: `PROJECTS_QUERY_RESULT` type from `sanity.types.ts` (unchanged).
- Produces (used by Task 4): `Projects` now requires a `theme: ThemeName` prop. `ThemeName` (`'minimal' | 'professional'`) exported from `web/src/lib/theme.ts`.

- [ ] **Step 1: Write the failing test for the extracted link-resolution helper**

Create `web/src/lib/project-links.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getProjectPrimaryLink } from './project-links'

describe('getProjectPrimaryLink', () => {
  it('links to the case-study page when hasCaseStudy is true', () => {
    const result = getProjectPrimaryLink({ hasCaseStudy: true, slug: 'my-project', liveUrl: null, repoUrl: null })
    expect(result).toEqual({ href: '/projects/my-project', isExternal: false })
  })

  it('links to the live URL when there is no case study but a live URL exists', () => {
    const result = getProjectPrimaryLink({ hasCaseStudy: false, slug: 'my-project', liveUrl: 'https://example.com', repoUrl: null })
    expect(result).toEqual({ href: 'https://example.com', isExternal: true })
  })

  it('falls back to the repo URL when there is no case study or live URL', () => {
    const result = getProjectPrimaryLink({ hasCaseStudy: false, slug: 'my-project', liveUrl: null, repoUrl: 'https://github.com/x/y' })
    expect(result).toEqual({ href: 'https://github.com/x/y', isExternal: true })
  })

  it('falls back to "#" when nothing is available', () => {
    const result = getProjectPrimaryLink({ hasCaseStudy: false, slug: 'my-project', liveUrl: null, repoUrl: null })
    expect(result).toEqual({ href: '#', isExternal: true })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/lib/project-links.test.ts`
Expected: FAIL with "Cannot find module './project-links'".

- [ ] **Step 3: Implement the helper**

Create `web/src/lib/project-links.ts`:

```ts
export interface ProjectLinkFields {
  hasCaseStudy: boolean
  slug: string
  liveUrl?: string | null
  repoUrl?: string | null
}

/** Where a project card/spotlight should link, and whether that's an external link (new tab) or an internal case-study route. */
export function getProjectPrimaryLink(project: ProjectLinkFields): { href: string; isExternal: boolean } {
  if (project.hasCaseStudy) {
    return { href: `/projects/${project.slug}`, isExternal: false }
  }
  return { href: project.liveUrl || project.repoUrl || '#', isExternal: true }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run src/lib/project-links.test.ts`
Expected: PASS, all 4 tests green.

- [ ] **Step 5: Create the shared theme-name type**

Create `web/src/lib/theme.ts`:

```ts
export type ThemeName = 'minimal' | 'professional'
```

- [ ] **Step 6: Refactor ProjectCard to use the extracted helper**

Modify `web/src/components/sections/project-card.tsx` — replace the whole file:

```tsx
import Link from 'next/link'
import { SanityImage } from '@/components/ui/sanity-image'
import { getProjectPrimaryLink } from '@/lib/project-links'
import type { PROJECTS_QUERY_RESULT } from '../../../sanity.types'

export function ProjectCard({ project }: { project: PROJECTS_QUERY_RESULT[number] }) {
  const { href: primaryHref, isExternal } = getProjectPrimaryLink(project)

  const content = (
    <>
      <SanityImage
        value={project.coverImage}
        width={600}
        height={360}
        className="w-full rounded-lg border border-border object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
      <div className="mt-4 flex items-center gap-2">
        <h3 className="text-lg font-medium">{project.title}</h3>
        {project.featured && (
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">Featured</span>
        )}
      </div>
      <p className="mt-2 text-sm text-muted">{project.summary}</p>
      {project.techStack && project.techStack.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {project.techStack.map((tech) => (
            <li key={tech} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
              {tech}
            </li>
          ))}
        </ul>
      )}
    </>
  )

  const className = 'group block rounded-xl p-2 transition-colors hover:bg-surface'

  if (isExternal) {
    return (
      <a href={primaryHref} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    )
  }

  return (
    <Link href={primaryHref} className={className}>
      {content}
    </Link>
  )
}
```

(This is a pure refactor — behavior is identical to before, just delegating the link computation to `getProjectPrimaryLink`.)

- [ ] **Step 7: Create FeaturedProjectCard**

Create `web/src/components/sections/featured-project-card.tsx`:

```tsx
import Link from 'next/link'
import { SanityImage } from '@/components/ui/sanity-image'
import { getProjectPrimaryLink } from '@/lib/project-links'
import type { PROJECTS_QUERY_RESULT } from '../../../sanity.types'

/** A larger "spotlight" treatment for one project, used only by the Professional theme's Projects section. */
export function FeaturedProjectCard({ project }: { project: PROJECTS_QUERY_RESULT[number] }) {
  const { href: primaryHref, isExternal } = getProjectPrimaryLink(project)

  const content = (
    <div className="grid overflow-hidden rounded-xl border border-border bg-surface sm:grid-cols-2">
      <SanityImage
        value={project.coverImage}
        width={800}
        height={480}
        className="h-full w-full object-cover"
      />
      <div className="flex flex-col justify-center gap-3 p-6">
        <span className="text-xs font-semibold uppercase tracking-widest text-accent">Featured</span>
        <h3 className="text-xl font-semibold">{project.title}</h3>
        <p className="text-sm text-muted">{project.summary}</p>
        {project.techStack && project.techStack.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {project.techStack.map((tech) => (
              <li key={tech} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                {tech}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )

  if (isExternal) {
    return (
      <a href={primaryHref} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    )
  }

  return (
    <Link href={primaryHref} className="block">
      {content}
    </Link>
  )
}
```

- [ ] **Step 8: Branch Projects on theme**

Modify `web/src/components/sections/projects.tsx` — replace the whole file:

```tsx
import { ProjectCard } from './project-card'
import { FeaturedProjectCard } from './featured-project-card'
import type { ThemeName } from '@/lib/theme'
import type { PROJECTS_QUERY_RESULT } from '../../../sanity.types'

export function Projects({ projects, theme }: { projects: PROJECTS_QUERY_RESULT; theme: ThemeName }) {
  if (projects.length === 0) return null

  const featured = theme === 'professional' ? projects.find((project) => project.featured) : undefined
  const rest = featured ? projects.filter((project) => project._id !== featured._id) : projects

  return (
    <section id="projects" className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="mb-10 text-sm font-semibold uppercase tracking-widest text-accent">Projects</h2>
      {featured && (
        <div className="mb-8">
          <FeaturedProjectCard project={featured} />
        </div>
      )}
      <div className="grid gap-6 sm:grid-cols-2">
        {rest.map((project) => (
          <ProjectCard key={project._id} project={project} />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 9: Update page.tsx's call site for the new required `theme` prop**

`Projects` now requires a `theme` prop, so its one call site needs updating. Modify `web/src/app/page.tsx` — change:

```tsx
        <Projects projects={projects} />
```

to:

```tsx
        <Projects projects={projects} theme="minimal" />
```

(This is a one-line edit — Task 4 replaces this entire file with the full theme-branching version anyway, so this edit is short-lived, but it keeps this task independently typechecking on its own rather than depending on Task 4 landing first.)

- [ ] **Step 10: Verify**

Run: `cd web && npx vitest run && npx tsc --noEmit`
Expected: PASS, no type errors, no test regressions (existing tests + this task's new tests all green).

- [ ] **Step 11: Commit**

```bash
git add web/src/lib/project-links.ts web/src/lib/project-links.test.ts web/src/lib/theme.ts web/src/components/sections/project-card.tsx web/src/components/sections/featured-project-card.tsx web/src/components/sections/projects.tsx web/src/app/page.tsx
git commit -m "Add featured-project spotlight layout for the Professional theme"
```

---

### Task 3: Professional sidebar and layout

**Files:**
- Create: `web/src/components/professional/professional-sidebar.tsx`
- Create: `web/src/components/professional/professional-layout.tsx`
- Modify: `web/src/app/globals.css`

**Interfaces:**
- Consumes: `SectionVisibility`, `getVisibleLinks` from `web/src/components/nav.tsx` (Task 1).
- Produces (used by Task 4): `ProfessionalLayout({ settings, visibility, children })` and `ProfessionalSidebar({ settings, visibility })`, both exported from `web/src/components/professional/`.

- [ ] **Step 1: Create the sidebar**

Create `web/src/components/professional/professional-sidebar.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { PortableText } from 'next-sanity'
import { SanityImage } from '@/components/ui/sanity-image'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ResumeDownloadLink } from '@/components/analytics/resume-download-link'
import { getVisibleLinks, type SectionVisibility } from '@/components/nav'
import type { SITE_SETTINGS_QUERY_RESULT } from '../../../sanity.types'

const SOCIAL_LABELS: Record<string, string> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  twitter: 'X / Twitter',
  email: 'Email',
  other: 'Link',
}

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
    <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:h-fit lg:w-64">
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
                className={`transition-colors hover:text-accent ${
                  activeHref === link.href ? 'font-semibold text-accent' : 'text-muted'
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {settings.socialLinks && settings.socialLinks.length > 0 && (
        <ul className="flex flex-wrap gap-4 text-sm">
          {settings.socialLinks.map((link) => (
            <li key={link._key}>
              <a href={link.url ?? undefined} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-accent">
                {SOCIAL_LABELS[link.platform ?? 'other'] ?? link.platform}
              </a>
            </li>
          ))}
        </ul>
      )}
      {resumeUrl && (
        <ResumeDownloadLink href={resumeUrl} fileName={resumeFileName} className="text-sm font-medium text-accent hover:underline">
          Download résumé
        </ResumeDownloadLink>
      )}
      <ThemeToggle />
    </aside>
  )
}
```

- [ ] **Step 2: Create the layout wrapper**

Create `web/src/components/professional/professional-layout.tsx`:

```tsx
import type { ReactNode } from 'react'
import { ProfessionalSidebar } from './professional-sidebar'
import type { SectionVisibility } from '@/components/nav'
import type { SITE_SETTINGS_QUERY_RESULT } from '../../../sanity.types'

export function ProfessionalLayout({
  settings,
  visibility,
  children,
}: {
  settings: NonNullable<SITE_SETTINGS_QUERY_RESULT>
  visibility: SectionVisibility
  children: ReactNode
}) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12 lg:flex-row lg:gap-16 lg:py-24">
      <ProfessionalSidebar settings={settings} visibility={visibility} />
      <main className="min-w-0 flex-1 lg:max-w-2xl">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Fix scroll offset for the sidebar layout**

The existing `html { scroll-padding-top: 5rem; }` in `web/src/app/globals.css` exists to clear the sticky top nav header. The Professional layout has no sticky top header (nav lives in the sidebar instead), so that offset no longer serves a purpose there and would leave unnecessary blank space above each section. Add this override — append to the end of `web/src/app/globals.css`:

```css
.theme-professional {
  scroll-padding-top: 0;
}
```

- [ ] **Step 4: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: no errors from the two new files (page.tsx doesn't reference `ProfessionalLayout` yet — that's Task 4 — so these two files are currently unused exports, which is not a type error).

Run: `cd web && npx eslint src/components/professional/professional-sidebar.tsx src/components/professional/professional-layout.tsx`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/professional/professional-sidebar.tsx web/src/components/professional/professional-layout.tsx web/src/app/globals.css
git commit -m "Add Professional theme sidebar layout with scroll-spy navigation"
```

---

### Task 4: Wire theme branching into the home page

**Files:**
- Modify: `web/src/app/page.tsx`

**Interfaces:**
- Consumes: `ProfessionalLayout` (Task 3), `Projects`'s `theme` prop (Task 2), `SectionVisibility`/`Nav` (Task 1).
- Produces: nothing consumed by later tasks — this is the final integration point.

- [ ] **Step 1: Branch page composition on the active theme**

Replace the full contents of `web/src/app/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { sanityFetch } from "@/sanity/live";
import {
  EXPERIENCE_QUERY,
  PROJECTS_QUERY,
  SITE_SETTINGS_QUERY,
} from "@/sanity/queries";
import { Nav, type SectionVisibility } from "@/components/nav";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Skills } from "@/components/sections/skills";
import { Projects } from "@/components/sections/projects";
import { Experience } from "@/components/sections/experience";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";
import { ProfessionalLayout } from "@/components/professional/professional-layout";

export default async function Home() {
  const [{ data: settings }, { data: projects }, { data: experience }] =
    await Promise.all([
      sanityFetch({ query: SITE_SETTINGS_QUERY, stega: false }),
      sanityFetch({ query: PROJECTS_QUERY, stega: false }),
      sanityFetch({ query: EXPERIENCE_QUERY, stega: false }),
    ]);

  if (!settings) return notFound();

  const visibility: SectionVisibility = {
    about: Boolean(settings.about),
    skills: (settings.skillCategories?.length ?? 0) > 0,
    projects: projects.length > 0,
    experience: experience.length > 0,
  };

  const activeTheme = settings.appearance?.activeTheme === "professional" ? "professional" : "minimal";

  if (activeTheme === "professional") {
    return (
      <ProfessionalLayout settings={settings} visibility={visibility}>
        <Skills settings={settings} />
        <Projects projects={projects} theme="professional" />
        <Experience items={experience} />
        <Contact settings={settings} />
        <Footer name={settings.name} />
      </ProfessionalLayout>
    );
  }

  return (
    <>
      <Nav visibility={visibility} />
      <main>
        <Hero settings={settings} />
        <About settings={settings} />
        <Skills settings={settings} />
        <Projects projects={projects} theme="minimal" />
        <Experience items={experience} />
        <Contact settings={settings} />
      </main>
      <Footer name={settings.name} />
    </>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd web && npx vitest run && npx tsc --noEmit && npx eslint src/app/page.tsx`
Expected: all green, no errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/page.tsx
git commit -m "Branch home page composition between Minimal and Professional layouts"
```

---

### Task 5: Numbered section headers (Professional)

**Files:**
- Modify: `web/src/app/globals.css`

**Interfaces:** none — purely additive CSS, no code interface.

- [ ] **Step 1: Add numbered headers**

Append to `web/src/app/globals.css` (after the existing `.theme-professional` rules from the prior theming work):

```css
.theme-professional #skills h2::before {
  content: '01 / ';
}

.theme-professional #projects h2::before {
  content: '02 / ';
}

.theme-professional #experience h2::before {
  content: '03 / ';
}

.theme-professional #contact h2::before {
  content: '04 / ';
}

.theme-professional #skills h2,
.theme-professional #projects h2,
.theme-professional #experience h2,
.theme-professional #contact h2 {
  font-family: 'Courier New', monospace;
  letter-spacing: 0.05em;
}
```

(These four sections' `<h2>` elements already exist unchanged in `skills.tsx`, `projects.tsx`, `experience.tsx`, and `contact.tsx` — this only adds CSS, no component edits.)

- [ ] **Step 2: Visually verify with Playwright**

Start the dev server and drive it (same approach used throughout this project — `chromium.launch({ channel: 'chrome' })` if the bundled Chromium isn't available):

```bash
cd web && lsof -ti:3000 -sTCP:LISTEN | xargs -r kill 2>/dev/null
(npm run dev > /tmp/professional-headers-dev.log 2>&1 &)
timeout 30 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done'
```

With Playwright: `page.goto('http://localhost:3000')`, `page.evaluate(() => document.documentElement.classList.add('theme-professional'))`, then read `getComputedStyle` or just check `document.querySelector('#skills h2').textContent` won't include the `::before` content (pseudo-elements aren't in `textContent`) — instead take a screenshot and visually confirm the "01 / " prefix renders before "Skills", and similarly for the other three sections. Confirm the un-prefixed Minimal render is unaffected (no class added).

Kill the dev server when done: `lsof -ti:3000 -sTCP:LISTEN | xargs -r kill`

- [ ] **Step 3: Commit**

```bash
git add web/src/app/globals.css
git commit -m "Add numbered monospace section headers to the Professional theme"
```

---

### Task 6: End-to-end verification

**Files:** none created or modified — this task only verifies Tasks 1-5 together.

- [ ] **Step 1: Verify Minimal is unaffected**

With real site content (or synthetic test data if live Sanity credentials aren't available in the environment), load the home page with no `theme-professional` class and confirm: Nav renders all 5 links when all sections have content, `Projects` renders its plain grid (no spotlight), page structure matches what existed before this plan.

- [ ] **Step 2: Verify nav-link hiding, both themes**

Test against a page render where `experience` and `projects` arrays are empty (e.g., temporarily mock/stub the fetched data in a scratch script, or use `page.evaluate` to hide the corresponding DOM nodes and confirm the nav/sidebar wouldn't have linked to them — whichever is more practical given available data). Confirm: no "Projects"/"Experience" link appears in either Nav (Minimal) or the Sidebar (Professional) when those sections have no data.

- [ ] **Step 3: Verify the Professional sidebar and scroll-spy**

With `activeTheme` set to `"professional"` (via live Sanity data if credentials allow, or by temporarily hardcoding the branch condition in a scratch copy for visual verification only — revert any such temporary edit before finishing), load the page and confirm with Playwright:
- The sidebar renders with profile photo, name, tagline, bio, nav links, social links, résumé link, theme toggle.
- Scrolling the content area updates which sidebar link is highlighted (check the `font-semibold text-accent` class lands on the link matching whichever section is currently in view).
- The numbered headers render (see Task 5, Step 2).
- If a project has `featured: true`, it renders via `FeaturedProjectCard`'s distinct layout, and does not also appear in the grid below.
- At a mobile viewport (e.g. `page.setViewportSize({ width: 390, height: 844 })`), the sidebar stacks above the content instead of sitting beside it (confirm via `getBoundingClientRect()` that the sidebar's and content's vertical ranges don't overlap, rather than sitting side-by-side).

- [ ] **Step 4: Run full cross-project verification**

```bash
cd web && npx vitest run && npx tsc --noEmit && npx eslint src
```
Expected: all green.

- [ ] **Step 5: Clean up**

```bash
lsof -ti:3000 -sTCP:LISTEN | xargs -r kill 2>/dev/null
```

No commit for this task — it verifies Tasks 1-5, which are already committed.
