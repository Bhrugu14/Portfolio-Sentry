# Professional Theme Redesign + Conditional Nav Visibility — Design

## Goal

The current "Professional" theme (serif headings, tighter spacing, bordered
cards, de-timelined experience list — all CSS-only overrides on the same
shared components as Minimal) doesn't read as a genuinely different look.
This redesign gives Professional a real structural transformation — a
fixed-sidebar layout with numbered section headers, inspired by the
well-established "developer resume site" pattern (e.g.
brittanychiang.com) — adapted to this project's actual sections and data,
not a copy of anyone's specific branding or colors (colors stay
Studio-configured, as already built).

Bundled in: both themes should only show nav links for sections that
actually have content — e.g., no "Projects" link when there are no
projects. This was already a known gap (each section component already
returns `null` when empty; only the nav links never accounted for that).

## Scope

**Professional theme:**
- Two-column layout: a fixed left sidebar (profile photo, name, tagline,
  a short bio absorbing today's separate About section, nav links with
  scroll-spy highlighting, social links, résumé download) and a scrolling
  right column with the remaining sections.
- Numbered, monospace, accent-colored section headers: `01 / Skills`,
  `02 / Projects`, `03 / Experience`, `04 / Contact`.
- Projects section gets a real layout change: the `featured` project
  (field already exists on the schema) renders as a large spotlight card;
  the rest render as a tighter grid.
- Experience stays a chronological list (no tabs — explicitly out of
  scope per your choice), restyled to match the numbered-header treatment.
- On mobile, the sidebar collapses to a stacked header above the content
  (same responsive approach as today's nav).

**Both themes:**
- Nav (Minimal) and the new Sidebar (Professional) only render a link for
  a section if that section actually has content, using the same
  emptiness rules each section component already enforces.

## Out of scope

- Any change to Minimal's existing visual design — it keeps working
  exactly as it does today, only gaining conditional nav filtering.
- Experience-as-tabs interactivity (explicitly declined).
- Any Sanity schema change — this is 100% frontend; no new fields needed.
- Copying any specific site's exact colors/branding — only the structural
  *pattern* (sidebar + numbered sections + scroll-spy) is being adapted.

## Architecture

`web/src/app/page.tsx` already fetches everything a template needs
(`settings`, `projects`, `experience`) before rendering. It gains one new
read: `settings.appearance?.activeTheme`, already fetched by the existing
`SITE_SETTINGS_QUERY` (no query change needed — the field exists from the
multi-theme feature). Based on that value, `page.tsx` branches between two
top-level compositions:

- **`activeTheme === 'professional'`**: renders `<ProfessionalLayout>`
  (new), which internally arranges `<ProfessionalSidebar>` (new) beside a
  `<main>` containing the (mostly-shared) Skills/Projects/Experience/Contact
  sections.
- **Anything else (Minimal, or missing data — additive fallback)**:
  renders exactly what exists today — `<Nav>` + `<Hero>` + `<About>` +
  `<Skills>` + `<Projects>` + `<Experience>` + `<Contact>` + `<Footer>`.

This mirrors the same "structure is code, color is data" split the
multi-theme system already established, extended one level further:
now *layout composition* also branches on the theme (a plain `if` in a
Server Component, no new data dependency), while which *components* are
shared vs theme-specific is decided per-component based on how different
their presentation actually needs to be:

| Component | Approach |
|---|---|
| Skills, Experience, Contact | **Shared**, restyled via plain CSS rules scoped under `.theme-professional` in `globals.css` — the same pattern the existing structural rules already use (descendant/ID selectors, not a Tailwind variant: there is no `theme-professional:` Tailwind variant defined in this codebase, only `.dark` has a `@custom-variant`). Numbered header, spacing — no structural/JSX change. |
| Hero, About | **Not reused for Professional** — their content (photo, name, tagline, bio) is absorbed into the new `ProfessionalSidebar`, which is its own component built for that layout. Minimal keeps using `Hero`/`About` exactly as today. |
| Projects | **Shared data-fetching, branching presentation.** `Projects` takes the already-fetched `projects` array and an theme flag; renders today's grid for Minimal, or delegates the featured item to a new `FeaturedProjectCard` (spotlight treatment) plus the rest to the existing grid for Professional. |
| Nav | **Shared component, gains props.** Filters its link list using the new visibility flags (see below); unchanged visually for Minimal. |

## Conditional nav/sidebar visibility

`page.tsx` computes one small object, using each section's own existing
emptiness rule (not new logic — just surfacing what each component
already checks internally):

```ts
const sectionVisibility = {
  about: Boolean(settings.about),
  skills: (settings.skillCategories?.length ?? 0) > 0,
  projects: projects.length > 0,
  experience: experience.length > 0,
  // contact has no empty state — always visible, not part of this object
}
```

Passed as a prop to `Nav` (Minimal) and `ProfessionalSidebar`
(Professional). Both filter their respective link lists against it before
rendering — Home and Contact are never filtered (always shown).

## Scroll-spy (Professional sidebar only)

The sidebar's nav links highlight whichever section is currently in the
viewport as the user scrolls the right column. Implemented as a small
client component (`'use client'`) using `IntersectionObserver` on each
visible section's DOM node (no new library — this is a well-understood,
small pattern: observe each `<section>`, track which one has the largest
visible intersection ratio, highlight that section's link). Minimal's nav
is unaffected — it has no scroll-spy today and isn't gaining one.

## New files

- `web/src/components/professional/professional-layout.tsx` — the
  sidebar + content wrapper, branched to from `page.tsx`.
- `web/src/components/professional/professional-sidebar.tsx` — profile
  block, nav with scroll-spy, social links, résumé link.
- `web/src/components/sections/featured-project-card.tsx` — the spotlight
  treatment for one project; `project-card.tsx` (existing) stays as the
  grid-item treatment, used by both themes for non-featured projects.

## Modified files

- `web/src/app/page.tsx` — reads `activeTheme`, computes
  `sectionVisibility`, branches composition.
- `web/src/components/nav.tsx` — accepts and filters on visibility props.
- `web/src/components/sections/projects.tsx` — accepts a theme flag,
  delegates the featured item to `FeaturedProjectCard` when Professional.
- `web/src/app/globals.css` — new `.theme-professional` rules for all four
  numbered headers, uniformly, via CSS `::before` content injection keyed
  to each section's existing `id` selector (e.g.
  `.theme-professional #projects h2::before { content: "02 / "; }`) — this
  applies the same way regardless of whether a section's body content is
  shared-CSS-only (Skills/Experience/Contact) or branches in code
  (Projects's spotlight/grid split); the heading and its body are
  independent concerns.

## Testing

- Any new pure logic (e.g., a `getVisibleLinks(flags)`-style filter
  function, if extracted rather than inlined) gets Vitest unit tests —
  matches existing project convention.
- Visual verification via Playwright (same approach used throughout this
  project): screenshot both themes; verify the sidebar renders and
  scroll-spy updates the active link on scroll; verify nav/sidebar links
  correctly hide when a section's data is empty (test against a
  synthetic empty-projects case, the same way earlier verifications in
  this project injected test data rather than depending on live content).
- Manual/E2E check: existing site content (which currently has projects,
  experience, skills, about) should show all nav links in both themes;
  no regression to Minimal's current appearance.

## Migration

None needed — no schema change, and the theme branch in `page.tsx`
defaults to Minimal's existing composition for anyone who hasn't set
`activeTheme` to `'professional'`, identical to today's behavior.
