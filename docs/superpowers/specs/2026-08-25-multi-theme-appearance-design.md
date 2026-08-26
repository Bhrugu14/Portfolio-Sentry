# Multi-Theme Appearance System — Design

## Goal

This repo is meant to be cloned by people who aren't developers. Today,
changing the site's look means editing CSS and redeploying. This feature
lets the site owner pick a visual theme and brand colors entirely from the
Sanity Studio they're already using for their content — deploy once, then
configure everything (content, and now appearance) from Studio, no code
touch, no redeploy.

## Scope

- Two themes, named consistently as siblings: **Minimal** (`minimal`,
  today's existing look, renamed for consistency — no visual change) and
  **Professional** (`professional`, new).
- Each theme exposes exactly 3 owner-configurable colors: **background**,
  **text**, **accent**. Everything else (surface, border, muted,
  accent-foreground) is auto-derived from those 3, and the dark-mode variant
  of each theme is auto-derived from its light colors (inverted lightness,
  same hue) — no separate dark pickers.
- The owner picks the **active theme** (one of the two, live for every
  visitor) and each theme's 3 colors, from a custom field in Sanity Studio
  that shows a **live mockup preview** and a **non-blocking WCAG contrast
  warning** as they pick.
- The existing visitor-facing light/dark toggle (`next-themes`) is untouched
  and orthogonal to theme selection — whichever theme is active, visitors
  can still flip light/dark within it.
- Two named fields (`minimal`, `professional`), not a generic array of
  themes — simplest thing that works for "two now, maybe more later."
  Adding a third theme later means adding one more named field + component
  entry following the same pattern, not a redesign — a deliberate YAGNI
  choice over building generic N-theme infrastructure for a hypothetical
  future need.

## Out of scope (this pass)

- A visitor-facing theme switcher (Minimal vs Professional stays owner-set).
- More than 2 themes shipped now.
- Full 7-token color control — deferred; 3 tokens + auto-derive only.
- Blocking invalid color choices — the contrast check is advisory only.

## Data model (Sanity schema)

New object types in `studio/schemaTypes/objects/`:

```ts
// themeColors.ts — the 3 colors for one theme
{
  name: 'themeColors',
  type: 'object',
  fields: [
    { name: 'background', type: 'string' }, // hex, e.g. "#fafafa"
    { name: 'text', type: 'string' },
    { name: 'accent', type: 'string' },
  ],
}

// appearance.ts — the whole appearance setting
{
  name: 'appearance',
  type: 'object',
  components: { input: AppearanceInput }, // custom Studio component, see below
  fields: [
    {
      name: 'activeTheme',
      type: 'string',
      options: { list: [{ title: 'Minimal', value: 'minimal' }, { title: 'Professional', value: 'professional' }] },
      initialValue: 'minimal',
    },
    { name: 'minimal', type: 'themeColors', initialValue: { background: '#fafafa', text: '#18181b', accent: '#6366f1' } },
    { name: 'professional', type: 'themeColors', initialValue: { background: '#f8f7f4', text: '#1a1a1a', accent: '#0f4c3a' } },
  ],
}
```

`siteSettings.ts` gains one field: `{ name: 'appearance', type: 'appearance', group: 'appearance' }`, plus a new
`{ name: 'appearance', title: 'Appearance' }` group alongside the existing
Profile/Skills/SEO tabs. Colors are plain hex strings, not Sanity's `color`
type — avoids adding the `@sanity/color-input` plugin dependency, since the
custom component (below) already needs to own the whole object's UI anyway.

Initial values match today's actual on-site colors exactly, so every
existing/new deploy looks unchanged until the owner opens this tab.

## Studio UX — custom input component

One custom object-level input component (`studio/src/components/AppearanceInput.tsx`)
replaces the default object-field UI for `appearance`. Per theme, it renders:

- A theme-select control (which one is active).
- 3 native `<input type="color">` pickers (background/text/accent) — browsers'
  built-in color picker, no extra picker library needed.
- A **live mockup panel**: a small self-contained sample (heading, paragraph,
  a link, a button) styled inline with exactly the picked 3 colors (and, for
  the Professional tab, the serif heading font — see below) — updates as
  you drag/type, so "how will this look" is answered before saving.
- A **contrast warning**, computed live: WCAG relative-luminance contrast
  ratio between text/background and between accent/background. Below 4.5:1
  (WCAG AA for normal text), an inline warning appears next to the mockup.
  Non-blocking — the value still saves if the owner wants it anyway.

## Frontend consumption

`SITE_SETTINGS_QUERY` (`web/src/sanity/queries.ts`) grows to include
`appearance { activeTheme, minimal { background, text, accent }, professional { background, text, accent } }`.

`RootLayout` (`web/src/app/layout.tsx`), which already fetches `siteSettings`
for SEO:
- Sets `class="theme-professional"` on `<html>` when `activeTheme ===
  'professional'` (next-themes keeps managing its own `dark` class
  independently, as today).
- Renders an inline `<style>` tag defining the CSS custom properties
  (`--background`, `--foreground`, `--accent`, etc.) for the active theme's
  light colors under `:root`-equivalent scope, and the auto-derived dark
  variant under `.dark`.
- **Falls back to the existing hardcoded defaults in `globals.css`** if
  `siteSettings.appearance` is missing entirely (e.g. content not yet
  migrated) — the feature is additive, never a hard dependency for the site
  to render correctly.

Two new pure, unit-testable functions in `web/src/lib/`:
- `deriveDarkVariant(hex): string` — inverts lightness, preserves hue, for
  the auto dark-mode colors. Frontend-only; the Studio preview only needs to
  show the light colors being edited, not the derived dark variant.
- `contrastRatio(hexA, hexB): number` — WCAG relative-luminance formula,
  testable in isolation with known reference values (black/white = 21, same
  color = 1). `studio/` and `web/` are separate npm projects with no shared
  package between them, so the Studio's copy (`studio/src/lib/contrast.ts`)
  is a small, independent port of the same ~15-line formula rather than a
  shared import — not worth introducing cross-package tooling for one pure
  function this size and this stable.

`globals.css` keeps its current `:root`/`.dark` blocks as the fallback
default, and gains a `.theme-professional` block with the structural
(non-color) differences: serif font for headings, tighter section spacing,
bordered card treatment for project/experience entries, reduced motion.
These are ordinary CSS rules, not data-driven.

## Testing

- Vitest, TDD: `deriveDarkVariant` and `contrastRatio` — pure functions,
  straightforward unit tests with known-good reference values.
- `RootLayout`'s fallback behavior (renders correctly with `appearance`
  missing) covered by a unit/integration test if practical, or a manual
  check if `layout.tsx`'s existing test coverage doesn't already support it.
- The Studio custom component is smoke-tested by actually driving it
  (Playwright against `sanity dev`, same approach as the scroll-animation
  verification) to confirm the mockup preview and contrast warning really
  render — not just that the code looks plausible.
- Manual check on the deployed site: switching `activeTheme` in Studio
  changes the live site without a redeploy (proves the "no code touch"
  promise actually holds).

## Migration

Sanity's `initialValue`s only populate in the Studio form when a field is
first touched — they don't retroactively patch existing documents in the
dataset just because the schema changed. So existing deployments keep
rendering via the frontend fallback (existing hardcoded `globals.css`
colors) until the owner opens Site Settings → Appearance and saves once,
at which point `appearance` is written to their document with the
prefilled defaults (identical to what's already on screen) or whatever
they changed it to.
