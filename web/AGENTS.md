<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Portfolio site (web/)

Next.js 16 (App Router, Turbopack) + Sanity CMS. Repo root also has `studio/`
(the Sanity Studio) and a root `package.json` that's just a `concurrently`
wrapper to run both together (`npm run dev` from repo root).

## Non-negotiable rules

- **Never run `git add` or `git commit`.** The user commits everything
  themselves, always — this applies even mid-task, even when executing a
  multi-step plan, even via subagents (their dispatch instructions must
  say so explicitly too). If you think a commit is warranted, say so and
  wait to be asked.
- **This repo has three separate npm projects**: repo root, `web/`,
  `studio/`. Always confirm your actual `pwd` before `npm install` —
  running it from the wrong directory silently pollutes the wrong
  `package.json`/lockfile (this happened once: `@sanity/ui` ended up at
  the repo root instead of `studio/`).

## Environment / config

- **Every env var flows through `src/lib/env.ts`** — nothing else reads
  `process.env` directly. Required vars fail fast at import time; optional
  ones degrade their feature gracefully when unset (see the table in
  `README.md`).
- **`NEXT_PUBLIC_*` vars must be accessed as a literal**
  (`process.env.NEXT_PUBLIC_X`), never dynamically
  (`process.env[name]`). Next.js's build-time inlining only recognizes the
  literal form — a dynamic lookup silently becomes `undefined` in any
  client-bundled code path. This caused a real production bug once
  (`isCompletePicks`/`required()` in `env.ts` and `layout.tsx`).
- `next.config.ts`'s `output: 'standalone'` is conditionally **disabled**
  when `process.env.VERCEL` is set — Vercel's own build pipeline does its
  own tracing and conflicts with standalone mode. Don't remove this
  condition without re-testing an actual Vercel deploy.

## Theming system

Sanity-driven, two themes today (`minimal`, `professional`) via an
`appearance` object on the `siteSettings` singleton (edited in Studio via
a fully custom input component, `studio/src/components/AppearanceInput.tsx`
— the default object UI is entirely replaced, so a new field on
`studio/schemaTypes/objects/appearance.ts` needs a matching control added
there or it won't be editable).

- Theme **dispatch** (which layout renders) is a registry, not
  if/else: `src/lib/theme-registry.ts` (`THEME_REGISTRY`,
  `resolveThemeName()`, `THEME_LAYOUTS`). Adding a theme = one registry
  entry + one new `HomeLayoutProps`-shaped layout component (see
  `src/components/minimal/minimal-layout.tsx` and
  `src/components/professional/professional-layout.tsx` for the pattern).
  Nothing in `page.tsx` should ever branch on theme name again.
- Theme **colors**: only 3 per theme are owner-picked (background/text/accent);
  everything else (surface/border/muted/accent-foreground, and each
  theme's dark-mode variant) is auto-derived by `src/lib/color-math.ts`.
  `ensureContrast()` there exists specifically because naive lightness
  inversion breaks contrast for mid-lightness accent colors in dark mode —
  don't remove it without re-adding an equivalent contrast floor.
- Theme **structure** (fonts/spacing/layout differences) is plain CSS in
  `globals.css`, scoped under `.theme-{key}` class selectors — there is
  **no** Tailwind custom variant for this (only `.dark` has one, via
  `@custom-variant`). Don't assume a `theme-professional:` utility prefix
  exists; it doesn't.
- Nav/sidebar links are filtered by `getVisibleLinks()`/`SectionVisibility`
  (`src/components/nav.tsx`) so a section with no content never gets a
  dead link — both `Nav` (Minimal) and `ProfessionalSidebar` share this,
  don't reimplement the filter.
- Minimal's top nav brand label comes from `settings.name` via `Nav`'s
  optional `name` prop, with `'Portfolio'` as the fallback. Keep passing
  the Sanity site name from `MinimalLayout` so the header matches the
  owner's configured identity.

## Sanity conventions

- All GROQ lives in `src/sanity/queries.ts` — no inline queries elsewhere.
- The frontend reads **published** content only. Studio autosaves edits as
  drafts; nothing shows on the live site until Published.
- Boolean visibility fields (`showOnSite` on Project) are filtered with
  `!= false` in GROQ, not `== true` — this treats pre-existing documents
  that predate the field (where it's `null`/unset) as visible by default,
  matching the schema's `initialValue: true` without needing a data
  migration.
- Sanity's CORS Origins list needs **both** the web app's deployed origin
  and the Studio's deployed origin registered separately — they're
  different URLs; adding only one is a common mistake that manifests as a
  browser CORS error on the *other* app.
- `sanity dev` runs with auto-updates enabled and can rewrite
  `studio/package.json`/`package-lock.json` on its own — don't assume an
  unexpected diff there is something you caused.

## Testing & verification

- **TDD is mandatory for anything with real logic** — functions, data
  transforms, validation, dedup, event-handling: write the failing test
  first (watch it fail), then the minimal code to pass, per Kent Beck's
  Red-Green-Refactor cycle (this repo follows the Classicist/Chicago
  style — real behavior, no mocking framework). Exempt: trivial prop
  wiring, JSX-only changes, config values, docs — there's nothing
  meaningful to assert on. When in doubt whether something counts as
  "real logic," ask.
- Vitest (`environment: 'node'`) — pure-function unit tests only, no
  component-rendering test infra (no React Testing Library/jsdom) exists
  in this repo. Don't add one without discussing it; it's a deliberate gap.
- UI/visual behavior (animations, hover states, layout, theme switching)
  is verified with a real headless browser (Playwright), not component
  tests. This machine's Playwright-bundled Chromium isn't installed —
  launch with `chromium.launch({ channel: 'chrome' })` to use system
  Chrome instead.
- Before claiming a fix/feature works: run the actual verification
  (typecheck, tests, lint, and for UI changes a real browser check of
  computed styles or a screenshot) — not just "the code looks right."
  This has caught several real bugs in this project that looked correct
  on inspection (e.g. a `process.env[name]` inlining bug, a CSS selector
  that leaked into nested content, a sticky sidebar that could clip its
  own content on a longer bio).

## Docker

`Dockerfile` + `docker-compose.yml` in `web/`: `app` (production, default)
and `app-dev` (hot-reload dev, `--profile dev`). `app-dev` sets
`WATCHPACK_POLLING=true` — needed for reliable hot reload through Docker
Desktop's bind mounts on macOS.

## Pre-commit hook

Husky, installed at the repo root (`.husky/pre-commit`) since git hooks
are always repo-wide. Runs against `web/`: lockfile-sync check
(self-correcting — regenerates the lockfile in place if stale), `npm
audit --audit-level=high`, and `npm test`. **Everything is informational
only** — the hook always exits 0, by design, and must keep doing so if
it's ever edited.

## Known pre-existing issues (not this project's introduced bugs)

- `src/components/ui/theme-toggle.tsx` has a pre-existing
  `react-hooks/set-state-in-effect` ESLint error (calling `setState`
  synchronously in a `useEffect`). Known, not yet fixed, out of scope
  unless explicitly asked.
- `npm audit` in `web/` currently reports vulnerabilities transitively via
  `@sanity/cli-build`/`@sanity/workbench-cli` (old `uuid`). Fixing requires
  a breaking `next-sanity` major version bump — deliberate, not urgent.
