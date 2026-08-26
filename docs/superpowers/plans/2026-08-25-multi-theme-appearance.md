# Multi-Theme Appearance System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the site owner pick between two visual themes (Minimal, Professional) and 3 brand colors per theme entirely from the Sanity Studio, with a live mockup preview and a non-blocking contrast warning — no code change or redeploy needed.

**Architecture:** Structure (typography/spacing/layout per theme) is ordinary CSS shipped in the codebase, gated by a `theme-professional` class on `<html>`. Only the 3 color values per theme (background/text/accent) are Studio-driven data, read via the existing `sanityFetch`/`siteSettings` pattern and injected as CSS custom properties in an inline `<style>` tag at request time. Everything else (surface/border/muted/accent-foreground, and each theme's dark-mode variant) is auto-derived from those 3 by pure color-math functions, shared in spirit (independently implemented, see Global Constraints) between the Next.js app and the Studio.

**Tech Stack:** Next.js 16 (App Router), Sanity Studio v6/`sanity` package, `@sanity/ui` (Studio component toolkit), Vitest (web only — Studio has no test runner), TypeScript throughout.

**Spec:** `docs/superpowers/specs/2026-08-25-multi-theme-appearance-design.md`

## Global Constraints

- Exactly 2 themes for now, named consistently as siblings: `minimal` and `professional` (internal slugs), "Minimal" and "Professional" (display titles).
- Exactly 3 owner-configurable colors per theme: background, text, accent. No other token is directly editable.
- Dark-mode colors are always auto-derived (invert lightness, preserve hue) — never separately picked.
- The contrast check warns below a 4.5:1 WCAG ratio (normal-text AA threshold) and never blocks saving.
- `studio/` and `web/` are separate npm projects with no shared package — color-math logic is independently implemented in each (`web/src/lib/color-math.ts`, `studio/src/lib/contrast.ts`), not imported across the boundary.
- The feature must be additive: if `siteSettings.appearance` is missing entirely, the site renders exactly as it does today (existing hardcoded `globals.css` colors), never a broken or blank page.
- No new runtime dependency on the Next.js app for color math — plain TypeScript, no color library.

---

## Task 1: Web color-math utilities

**Files:**
- Create: `web/src/lib/color-math.ts`
- Test: `web/src/lib/color-math.test.ts`

**Interfaces:**
- Produces (used by Task 4):
  ```ts
  export interface ThemeColorPicks { background: string; text: string; accent: string }
  export interface ThemeTokens {
    background: string
    foreground: string
    surface: string
    border: string
    muted: string
    accent: string
    accentForeground: string
  }
  export function computeThemeTokens(picks: ThemeColorPicks): ThemeTokens
  export function computeDarkThemeTokens(picks: ThemeColorPicks): ThemeTokens
  ```

- [ ] **Step 1: Write the failing tests**

Create `web/src/lib/color-math.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  hexToRgb,
  rgbToHsl,
  contrastRatio,
  deriveDarkVariant,
  deriveAccentForeground,
  computeThemeTokens,
} from './color-math'

describe('contrastRatio', () => {
  it('returns 21 for black vs white (WCAG max)', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
  })

  it('returns 1 for a color against itself', () => {
    expect(contrastRatio('#6366f1', '#6366f1')).toBeCloseTo(1, 5)
  })

  it('is order-independent', () => {
    expect(contrastRatio('#18181b', '#fafafa')).toBeCloseTo(contrastRatio('#fafafa', '#18181b'), 5)
  })

  it('returns a high ratio for the current default text/background pair', () => {
    expect(contrastRatio('#18181b', '#fafafa')).toBeGreaterThan(15)
  })
})

describe('deriveDarkVariant', () => {
  it('inverts white to black', () => {
    expect(deriveDarkVariant('#ffffff')).toBe('#000000')
  })

  it('inverts black to white', () => {
    expect(deriveDarkVariant('#000000')).toBe('#ffffff')
  })

  it('round-trips back to (approximately) the original color', () => {
    const original = hexToRgb('#6366f1')
    const roundTripped = hexToRgb(deriveDarkVariant(deriveDarkVariant('#6366f1')))
    original.forEach((channel, i) => {
      expect(Math.abs(channel - roundTripped[i])).toBeLessThanOrEqual(2)
    })
  })

  it('preserves hue', () => {
    const [hueBefore] = rgbToHsl(...hexToRgb('#6366f1'))
    const [hueAfter] = rgbToHsl(...hexToRgb(deriveDarkVariant('#6366f1')))
    expect(hueAfter).toBeCloseTo(hueBefore, 0)
  })
})

describe('deriveAccentForeground', () => {
  it('picks black text on a light, high-luminance accent', () => {
    expect(deriveAccentForeground('#ffff00')).toBe('#000000')
  })

  it('picks white text on a dark, low-luminance accent', () => {
    expect(deriveAccentForeground('#0a0a0b')).toBe('#ffffff')
  })
})

describe('computeThemeTokens', () => {
  it('passes background/text/accent straight through', () => {
    const tokens = computeThemeTokens({ background: '#fafafa', text: '#18181b', accent: '#6366f1' })
    expect(tokens.background).toBe('#fafafa')
    expect(tokens.foreground).toBe('#18181b')
    expect(tokens.accent).toBe('#6366f1')
  })

  it('derives a lighter surface than a near-white background, clamped to white', () => {
    const tokens = computeThemeTokens({ background: '#fafafa', text: '#18181b', accent: '#6366f1' })
    expect(tokens.surface).toBe('#ffffff')
  })

  it('derives a border between the background and middle gray', () => {
    const tokens = computeThemeTokens({ background: '#fafafa', text: '#18181b', accent: '#6366f1' })
    const [, , backgroundLightness] = rgbToHsl(...hexToRgb('#fafafa'))
    const [, , borderLightness] = rgbToHsl(...hexToRgb(tokens.border))
    expect(borderLightness).toBeLessThan(backgroundLightness)
    expect(borderLightness).toBeGreaterThan(0.5)
  })

  it('derives a muted tone between the text color and middle gray', () => {
    const tokens = computeThemeTokens({ background: '#fafafa', text: '#18181b', accent: '#6366f1' })
    const [, , textLightness] = rgbToHsl(...hexToRgb('#18181b'))
    const [, , mutedLightness] = rgbToHsl(...hexToRgb(tokens.muted))
    expect(mutedLightness).toBeGreaterThan(textLightness)
    expect(mutedLightness).toBeLessThan(0.5)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web && npx vitest run src/lib/color-math.test.ts`
Expected: FAIL with "Cannot find module './color-math'" (the file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `web/src/lib/color-math.ts`:

```ts
// Pure color math for the multi-theme appearance system. No dependency on
// any color library — small enough to own directly. Independently
// reimplemented (not imported) in studio/src/lib/contrast.ts, since studio/
// and web/ are separate npm projects with no shared package between them.

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return [r, g, b]
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** Returns [hue in [0,360), saturation in [0,1], lightness in [0,1]]. */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255
  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const l = (max + min) / 2
  const d = max - min

  if (d === 0) return [0, 0, l]

  const s = d / (1 - Math.abs(2 * l - 1))
  let h: number
  switch (max) {
    case rNorm:
      h = ((gNorm - bNorm) / d) % 6
      break
    case gNorm:
      h = (bNorm - rNorm) / d + 2
      break
    default:
      h = (rNorm - gNorm) / d + 4
  }
  h *= 60
  if (h < 0) h += 360
  return [h, s, l]
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let [r1, g1, b1] = [0, 0, 0]
  if (h < 60) [r1, g1, b1] = [c, x, 0]
  else if (h < 120) [r1, g1, b1] = [x, c, 0]
  else if (h < 180) [r1, g1, b1] = [0, c, x]
  else if (h < 240) [r1, g1, b1] = [0, x, c]
  else if (h < 300) [r1, g1, b1] = [x, 0, c]
  else [r1, g1, b1] = [c, 0, x]

  return [(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255]
}

function channelLuminance(channel8Bit: number): number {
  const c = channel8Bit / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b)
}

/** WCAG contrast ratio, from 1 (no contrast) to 21 (black vs white). */
export function contrastRatio(hexA: string, hexB: string): number {
  const luminanceA = relativeLuminance(hexA)
  const luminanceB = relativeLuminance(hexB)
  const lighter = Math.max(luminanceA, luminanceB)
  const darker = Math.min(luminanceA, luminanceB)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Inverts lightness, preserves hue and saturation — used for auto dark-mode colors. */
export function deriveDarkVariant(hex: string): string {
  const [h, s, l] = rgbToHsl(...hexToRgb(hex))
  return rgbToHex(...hslToRgb(h, s, 1 - l))
}

/** A "lifted" surface always reads lighter than its background, in both light and dark mode. */
export function deriveSurface(backgroundHex: string): string {
  const [h, s, l] = rgbToHsl(...hexToRgb(backgroundHex))
  return rgbToHex(...hslToRgb(h, s, Math.min(1, l + 0.06)))
}

/** A visible border nudges lightness toward middle gray, away from either extreme. */
export function deriveBorder(backgroundHex: string): string {
  const [h, s, l] = rgbToHsl(...hexToRgb(backgroundHex))
  const nudged = l < 0.5 ? Math.min(1, l + 0.1) : Math.max(0, l - 0.1)
  return rgbToHex(...hslToRgb(h, s, nudged))
}

/** Muted text pulls the main text color toward middle gray and desaturates it. */
export function deriveMuted(textHex: string): string {
  const [h, s, l] = rgbToHsl(...hexToRgb(textHex))
  const nudged = l < 0.5 ? l + 0.35 : l - 0.35
  const clamped = Math.min(0.92, Math.max(0.08, nudged))
  return rgbToHex(...hslToRgb(h, Math.min(s, 0.15), clamped))
}

/** Picks whichever of black/white contrasts more with the given color, for text drawn on it. */
export function deriveAccentForeground(accentHex: string): string {
  return contrastRatio(accentHex, '#ffffff') >= contrastRatio(accentHex, '#000000') ? '#ffffff' : '#000000'
}

export interface ThemeColorPicks {
  background: string
  text: string
  accent: string
}

export interface ThemeTokens {
  background: string
  foreground: string
  surface: string
  border: string
  muted: string
  accent: string
  accentForeground: string
}

export function computeThemeTokens(picks: ThemeColorPicks): ThemeTokens {
  return {
    background: picks.background,
    foreground: picks.text,
    surface: deriveSurface(picks.background),
    border: deriveBorder(picks.background),
    muted: deriveMuted(picks.text),
    accent: picks.accent,
    accentForeground: deriveAccentForeground(picks.accent),
  }
}

/** Same as computeThemeTokens, but auto-derives the dark-mode variant of each picked color first. */
export function computeDarkThemeTokens(picks: ThemeColorPicks): ThemeTokens {
  return computeThemeTokens({
    background: deriveDarkVariant(picks.background),
    text: deriveDarkVariant(picks.text),
    accent: deriveDarkVariant(picks.accent),
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd web && npx vitest run src/lib/color-math.test.ts`
Expected: PASS, all tests green.

- [ ] **Step 5: Run the full web test suite to confirm nothing else broke**

Run: `cd web && npx vitest run`
Expected: PASS, all test files green (this task adds tests but touches no existing file).

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/color-math.ts web/src/lib/color-math.test.ts
git commit -m "Add color-math utilities for the multi-theme appearance system"
```

---

## Task 2: Sanity schema for appearance

**Files:**
- Create: `studio/schemaTypes/objects/themeColors.ts`
- Create: `studio/schemaTypes/objects/appearance.ts`
- Modify: `studio/schemaTypes/index.ts`
- Modify: `studio/schemaTypes/documents/siteSettings.ts`

**Interfaces:**
- Produces (used by Task 3): the `appearance` schema type, referenced by name `'appearance'` when wiring `components.input` in Task 3 — no TypeScript interfaces cross this boundary, only the schema's field names: `activeTheme` (`'minimal' | 'professional'`), `minimal` and `professional` (each `{ background, text, accent }` hex strings).
- Produces (used by Task 4): the GROQ-queryable shape `appearance { activeTheme, minimal { background, text, accent }, professional { background, text, accent } }` on the `siteSettings` document.

- [ ] **Step 1: Create the themeColors object type**

Create `studio/schemaTypes/objects/themeColors.ts`:

```ts
// studio/schemaTypes/objects/themeColors.ts
import { defineField, defineType } from 'sanity'

export const themeColors = defineType({
  name: 'themeColors',
  title: 'Theme Colors',
  type: 'object',
  fields: [
    defineField({
      name: 'background',
      title: 'Background',
      type: 'string',
      validation: (rule) => rule.required().regex(/^#[0-9a-fA-F]{6}$/, { name: 'hex color' }),
    }),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'string',
      validation: (rule) => rule.required().regex(/^#[0-9a-fA-F]{6}$/, { name: 'hex color' }),
    }),
    defineField({
      name: 'accent',
      title: 'Accent',
      type: 'string',
      validation: (rule) => rule.required().regex(/^#[0-9a-fA-F]{6}$/, { name: 'hex color' }),
    }),
  ],
})
```

- [ ] **Step 2: Create the appearance object type**

Create `studio/schemaTypes/objects/appearance.ts`:

```ts
// studio/schemaTypes/objects/appearance.ts
import { defineField, defineType } from 'sanity'

export const appearance = defineType({
  name: 'appearance',
  title: 'Appearance',
  type: 'object',
  fields: [
    defineField({
      name: 'activeTheme',
      title: 'Active Theme',
      type: 'string',
      options: {
        list: [
          { title: 'Minimal', value: 'minimal' },
          { title: 'Professional', value: 'professional' },
        ],
      },
      initialValue: 'minimal',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'minimal',
      title: 'Minimal Theme Colors',
      type: 'themeColors',
      initialValue: { background: '#fafafa', text: '#18181b', accent: '#6366f1' },
    }),
    defineField({
      name: 'professional',
      title: 'Professional Theme Colors',
      type: 'themeColors',
      initialValue: { background: '#f8f7f4', text: '#1a1a1a', accent: '#0f4c3a' },
    }),
  ],
})
```

(The custom color-picker + live-preview UI is wired on top of this in Task 3 — this step alone renders with Sanity's default object-field UI, which is a valid, working, testable state.)

- [ ] **Step 3: Register both new types**

Modify `studio/schemaTypes/index.ts`:

```ts
import { socialLink } from './objects/socialLink'
import { skill } from './objects/skill'
import { skillCategory } from './objects/skillCategory'
import { themeColors } from './objects/themeColors'
import { appearance } from './objects/appearance'
import { siteSettings } from './documents/siteSettings'
import { project } from './documents/project'
import { experience } from './documents/experience'
import { contactSubmission } from './documents/contactSubmission'

export const schemaTypes = [
  // objects
  socialLink,
  skill,
  skillCategory,
  themeColors,
  appearance,
  // documents
  siteSettings,
  project,
  experience,
  contactSubmission,
]
```

- [ ] **Step 4: Add the field and group to siteSettings**

Modify `studio/schemaTypes/documents/siteSettings.ts` — add `'appearance'` to the `groups` array and add the field. The file's `groups` array becomes:

```ts
  groups: [
    { name: 'profile', title: 'Profile', default: true },
    { name: 'skills', title: 'Skills' },
    { name: 'appearance', title: 'Appearance' },
    { name: 'seo', title: 'SEO' },
  ],
```

And add this field to the `fields` array (position doesn't matter functionally; put it after `skillCategories` and before `seo` to match the groups order):

```ts
    defineField({
      name: 'appearance',
      title: 'Appearance',
      type: 'appearance',
      group: 'appearance',
    }),
```

- [ ] **Step 5: Verify the Studio starts and the new fields are visible**

Run: `cd studio && npm run dev`, then open `http://localhost:3333`, open the Site Settings document, and click the new "Appearance" tab.
Expected: an "Active Theme" dropdown (defaulting to Minimal) and two color-string groups (Minimal Theme Colors, Professional Theme Colors) each with background/text/accent fields, prefilled with the initial values. Stop the server (`Ctrl+C`) once confirmed.

- [ ] **Step 6: Commit**

```bash
git add studio/schemaTypes/objects/themeColors.ts studio/schemaTypes/objects/appearance.ts studio/schemaTypes/index.ts studio/schemaTypes/documents/siteSettings.ts
git commit -m "Add appearance schema (theme + colors) to Site Settings"
```

---

## Task 3: Studio custom color-picker component with live preview and contrast warning

**Files:**
- Create: `studio/src/lib/contrast.ts`
- Create: `studio/src/components/AppearanceInput.tsx`
- Modify: `studio/schemaTypes/objects/appearance.ts`
- Modify: `studio/package.json` (add explicit `@sanity/ui` dependency)

**Interfaces:**
- Consumes: the `appearance` schema type from Task 2 (fields `activeTheme`, `minimal`, `professional`, each `themeColors` = `{ background, text, accent }`).
- Produces: nothing consumed by later tasks — this is a leaf, Studio-only UI concern.

- [ ] **Step 1: Add @sanity/ui as an explicit dependency**

`@sanity/ui` currently resolves only transitively (via the `sanity` package). Pin it explicitly since this component imports from it directly:

```bash
cd studio && npm install @sanity/ui@^4.0.6
```

- [ ] **Step 2: Create the contrast-ratio helper**

Create `studio/src/lib/contrast.ts`:

```ts
// studio/src/lib/contrast.ts
// Independent port of the same WCAG formula in web/src/lib/color-math.ts.
// studio/ and web/ are separate npm projects with no shared package, and
// this is the only piece of that module the Studio actually needs (the
// live preview renders picked colors directly; it doesn't derive tokens).

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return [r, g, b]
}

function channelLuminance(channel8Bit: number): number {
  const c = channel8Bit / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b)
}

/** WCAG contrast ratio, from 1 (no contrast) to 21 (black vs white). */
export function contrastRatio(hexA: string, hexB: string): number {
  const luminanceA = relativeLuminance(hexA)
  const luminanceB = relativeLuminance(hexB)
  const lighter = Math.max(luminanceA, luminanceB)
  const darker = Math.min(luminanceA, luminanceB)
  return (lighter + 0.05) / (darker + 0.05)
}
```

- [ ] **Step 3: Create the custom input component**

Create `studio/src/components/AppearanceInput.tsx`:

```tsx
// studio/src/components/AppearanceInput.tsx
import { useCallback } from 'react'
import { Button, Card, Flex, Stack, Text, TextInput } from '@sanity/ui'
import { set, type ObjectInputProps } from 'sanity'
import { contrastRatio } from '../lib/contrast'

type ThemeKey = 'minimal' | 'professional'
type ThemeColorField = 'background' | 'text' | 'accent'
type ThemeColors = { background?: string; text?: string; accent?: string }
type AppearanceValue = {
  activeTheme?: ThemeKey
  minimal?: ThemeColors
  professional?: ThemeColors
}

const THEMES: { key: ThemeKey; title: string; headingFont: string }[] = [
  { key: 'minimal', title: 'Minimal', headingFont: 'system-ui, sans-serif' },
  { key: 'professional', title: 'Professional', headingFont: 'Georgia, serif' },
]

const DEFAULTS: Record<ThemeKey, Required<ThemeColors>> = {
  minimal: { background: '#fafafa', text: '#18181b', accent: '#6366f1' },
  professional: { background: '#f8f7f4', text: '#1a1a1a', accent: '#0f4c3a' },
}

const CONTRAST_WARNING_THRESHOLD = 4.5

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (hex: string) => void
}) {
  return (
    <Stack space={2}>
      <Text size={1} muted>
        {label}
      </Text>
      <Flex align="center" gap={2}>
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          style={{ width: 40, height: 32, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
        />
        <TextInput value={value} onChange={(event) => onChange(event.currentTarget.value)} style={{ width: 110 }} />
      </Flex>
    </Stack>
  )
}

export function AppearanceInput(props: ObjectInputProps) {
  const value = (props.value ?? {}) as AppearanceValue
  const activeTheme: ThemeKey = value.activeTheme ?? 'minimal'

  const handleActiveThemeChange = useCallback(
    (theme: ThemeKey) => props.onChange(set(theme, ['activeTheme'])),
    [props],
  )

  const handleColorChange = useCallback(
    (theme: ThemeKey, field: ThemeColorField, hex: string) => props.onChange(set(hex, [theme, field])),
    [props],
  )

  return (
    <Stack space={4}>
      <Card padding={3} radius={2} border>
        <Stack space={3}>
          <Text weight="semibold">Active theme (live for every visitor)</Text>
          <Flex gap={2}>
            {THEMES.map((theme) => (
              <Button
                key={theme.key}
                text={theme.title}
                mode={activeTheme === theme.key ? 'default' : 'ghost'}
                onClick={() => handleActiveThemeChange(theme.key)}
              />
            ))}
          </Flex>
        </Stack>
      </Card>

      {THEMES.map((theme) => {
        const colors = { ...DEFAULTS[theme.key], ...value[theme.key] }
        const textContrast = contrastRatio(colors.text, colors.background)
        const accentContrast = contrastRatio(colors.accent, colors.background)

        return (
          <Card key={theme.key} padding={3} radius={2} border>
            <Stack space={3}>
              <Text weight="semibold">{theme.title} colors</Text>
              <Flex gap={4} wrap="wrap">
                <ColorField
                  label="Background"
                  value={colors.background}
                  onChange={(hex) => handleColorChange(theme.key, 'background', hex)}
                />
                <ColorField
                  label="Text"
                  value={colors.text}
                  onChange={(hex) => handleColorChange(theme.key, 'text', hex)}
                />
                <ColorField
                  label="Accent"
                  value={colors.accent}
                  onChange={(hex) => handleColorChange(theme.key, 'accent', hex)}
                />
              </Flex>

              {textContrast < CONTRAST_WARNING_THRESHOLD && (
                <Card padding={2} radius={2} tone="caution">
                  <Text size={1}>
                    Low contrast between text and background ({textContrast.toFixed(2)}:1, WCAG recommends at least
                    4.5:1) — this text may be hard to read. You can still save this.
                  </Text>
                </Card>
              )}
              {accentContrast < CONTRAST_WARNING_THRESHOLD && (
                <Card padding={2} radius={2} tone="caution">
                  <Text size={1}>
                    Low contrast between accent and background ({accentContrast.toFixed(2)}:1) — accent elements may
                    be hard to see. You can still save this.
                  </Text>
                </Card>
              )}

              <div
                data-testid={`appearance-preview-${theme.key}`}
                style={{
                  background: colors.background,
                  color: colors.text,
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  fontFamily: theme.headingFont,
                }}
              >
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>Preview heading</h3>
                <p style={{ margin: '0 0 0.75rem', fontFamily: 'system-ui, sans-serif' }}>
                  This is how paragraph text will look with the colors you&apos;ve picked.
                </p>
                <a
                  href="#"
                  onClick={(event) => event.preventDefault()}
                  style={{ color: colors.accent, marginRight: '1rem' }}
                >
                  A sample link
                </a>
                <button
                  type="button"
                  style={{
                    background: colors.accent,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '0.5rem 1rem',
                    cursor: 'default',
                  }}
                >
                  Sample button
                </button>
              </div>
            </Stack>
          </Card>
        )
      })}
    </Stack>
  )
}
```

- [ ] **Step 4: Wire the component into the schema**

Modify `studio/schemaTypes/objects/appearance.ts` — add the `components` option to `defineType`:

```ts
// studio/schemaTypes/objects/appearance.ts
import { defineField, defineType } from 'sanity'
import { AppearanceInput } from '../../src/components/AppearanceInput'

export const appearance = defineType({
  name: 'appearance',
  title: 'Appearance',
  type: 'object',
  components: { input: AppearanceInput },
  fields: [
    // ...unchanged from Task 2
```

(Leave the three `defineField` entries exactly as Task 2 created them.)

- [ ] **Step 5: Smoke-test the component by actually driving it**

Start the Studio and confirm the custom UI renders and behaves, using the same headless-browser approach as the scroll-animation verification earlier in this project (Playwright driving a real browser against `sanity dev`, not a unit test — Studio has no test runner).

```bash
cd studio && npm run dev &
timeout 30 bash -c 'until curl -sf http://localhost:3333 >/dev/null; do sleep 1; done'
```

Then, with Playwright (see Task 6 for the full script pattern — reuse a scratch script here), navigate to the Site Settings document's Appearance tab and verify:
- Both theme cards render with 3 color inputs each.
- Changing a color input's value updates the live preview `div[data-testid="appearance-preview-minimal"]` (or `-professional`) background/color/text inline styles immediately (no save needed).
- Setting the Minimal theme's text color equal to its background color (e.g. both `#ffffff`) shows the low-contrast warning card.
- Setting them back to distinct, high-contrast values makes the warning disappear.

Stop the dev server (`lsof -ti:3333 -sTCP:LISTEN | xargs -r kill`) once confirmed.

- [ ] **Step 6: Commit**

```bash
git add studio/src/lib/contrast.ts studio/src/components/AppearanceInput.tsx studio/schemaTypes/objects/appearance.ts studio/package.json studio/package-lock.json
git commit -m "Add custom Studio color-picker component with live preview and contrast warning"
```

---

## Task 4: Frontend consumption — query, typegen, and RootLayout

**Files:**
- Modify: `web/src/sanity/queries.ts`
- Modify: `web/src/app/layout.tsx`
- Modify (generated): `web/sanity.types.ts`

**Interfaces:**
- Consumes: `computeThemeTokens`, `computeDarkThemeTokens`, `ThemeColorPicks`, `ThemeTokens` from `web/src/lib/color-math.ts` (Task 1).
- Produces: nothing consumed by later tasks except Task 6, which verifies this rendering end-to-end.

- [ ] **Step 1: Extend the site settings query**

Modify `web/src/sanity/queries.ts` — add an `appearance` projection to `SITE_SETTINGS_QUERY`. The query becomes:

```ts
export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_id == "siteSettings"][0]{
    name,
    title,
    about,
    profileImage{
      asset->{_id, url, metadata{lqip, dimensions{width, height}}},
      alt,
      hotspot,
      crop
    },
    resumeFile{
      asset->{_id, url, originalFilename}
    },
    socialLinks[]{_key, platform, url},
    skillCategories[]{
      _key,
      name,
      skills[]{
        _key,
        name,
        icon{asset->{_id, url}, alt}
      }
    },
    appearance{
      activeTheme,
      minimal{background, text, accent},
      professional{background, text, accent}
    },
    seo{
      title,
      description,
      ogImage{asset->{_id, url}}
    }
  }
`)
```

- [ ] **Step 2: Regenerate Sanity types**

Run: `cd /Users/bhrugu/React/Portfolio-Sentry && npm run typegen`
Expected: completes without error and `web/sanity.types.ts`'s `SITE_SETTINGS_QUERY_RESULT` type now includes an `appearance` field shaped `{ activeTheme: "minimal" | "professional" | null, minimal: {...} | null, professional: {...} | null } | null`.

- [ ] **Step 3: Update RootLayout to render the theme**

Modify `web/src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import { ThemeProvider } from '@/components/theme-provider'
import { env } from '@/lib/env'
import { computeThemeTokens, computeDarkThemeTokens, type ThemeColorPicks, type ThemeTokens } from '@/lib/color-math'
import { SanityLive, sanityFetch } from '@/sanity/live'
import { SITE_SETTINGS_QUERY } from '@/sanity/queries'
import { urlFor } from '@/sanity/image'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  const { data: settings } = await sanityFetch({ query: SITE_SETTINGS_QUERY, stega: false })

  const title = settings?.seo?.title || settings?.name || 'Portfolio'
  const description = settings?.seo?.description || settings?.title || ''
  const ogImage = settings?.seo?.ogImage ? urlFor(settings.seo.ogImage).width(1200).height(630).url() : undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
  }
}

function tokensToCssBlock(selector: string, tokens: ThemeTokens): string {
  return `${selector} {
    --background: ${tokens.background};
    --foreground: ${tokens.foreground};
    --surface: ${tokens.surface};
    --border: ${tokens.border};
    --muted: ${tokens.muted};
    --accent: ${tokens.accent};
    --accent-foreground: ${tokens.accentForeground};
  }`
}

function isCompletePicks(colors: Partial<ThemeColorPicks> | null | undefined): colors is ThemeColorPicks {
  return Boolean(colors?.background && colors?.text && colors?.accent)
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = env.gaMeasurementId
  const { data: settings } = await sanityFetch({ query: SITE_SETTINGS_QUERY, stega: false })

  const appearance = settings?.appearance
  const activeTheme = appearance?.activeTheme === 'professional' ? 'professional' : 'minimal'
  const picks = activeTheme === 'professional' ? appearance?.professional : appearance?.minimal

  // Additive by design: if appearance data isn't there yet, render nothing
  // extra and fall back to globals.css's existing hardcoded defaults.
  const themeCss = isCompletePicks(picks)
    ? `${tokensToCssBlock(':root', computeThemeTokens(picks))}\n${tokensToCssBlock('.dark', computeDarkThemeTokens(picks))}`
    : null
  const htmlClassName = activeTheme === 'professional' ? 'theme-professional' : undefined

  return (
    <html lang="en" suppressHydrationWarning className={htmlClassName}>
      <head>{themeCss && <style dangerouslySetInnerHTML={{ __html: themeCss }} />}</head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
        <SanityLive />
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Run the full web test suite and typecheck**

Run: `cd web && npx vitest run && npx tsc --noEmit`
Expected: PASS, no type errors. (No new tests in this step — Task 1 already covers the color math this task calls; this step is a regression check.)

- [ ] **Step 5: Commit**

```bash
git add web/src/sanity/queries.ts web/src/app/layout.tsx web/sanity.types.ts
git commit -m "Render Studio-configured theme colors as CSS custom properties in RootLayout"
```

---

## Task 5: Professional theme structural CSS

**Files:**
- Modify: `web/src/app/globals.css`

**Interfaces:**
- Consumes: the `theme-professional` class on `<html>`, set by Task 4.
- Produces: nothing consumed by later tasks except Task 6, which verifies this visually.

- [ ] **Step 1: Add the Professional theme's structural rules**

Modify `web/src/app/globals.css` — append this block after the existing `@media (prefers-reduced-motion: reduce)` block at the end of the file:

```css
/* Professional theme: same components/layout as Minimal, but a serif
   display font for headings, tighter section spacing, bordered project
   cards, and a de-timelined experience list. Colors are NOT set here —
   they come from the CSS custom properties RootLayout injects based on
   Studio data; this block is purely structural. */
.theme-professional h1,
.theme-professional h2,
.theme-professional h3 {
  font-family: Georgia, 'Times New Roman', serif;
}

.theme-professional section:not(#home) {
  padding-top: 3rem;
  padding-bottom: 3rem;
}

.theme-professional #projects .group {
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
}

.theme-professional #experience ol {
  border-left: none;
  padding-left: 0;
  gap: 1.5rem;
}

.theme-professional #experience li {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1.5rem;
}

.theme-professional #experience li:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.theme-professional #experience li > span:first-child {
  display: none;
}
```

- [ ] **Step 2: Visually verify both themes render correctly**

Start the dev server and drive it with Playwright (same pattern as the earlier scroll-animation verification in this project):

```bash
cd web && lsof -ti:3000 -sTCP:LISTEN | xargs -r kill 2>/dev/null
(npm run dev > /tmp/theme-dev.log 2>&1 &)
timeout 30 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done'
```

Take a screenshot of the homepage as-is (Minimal, unaffected by this task) to confirm no visual regression, then temporarily add `className="theme-professional"` to a local test — or, simpler, use the browser console via a Playwright `eval` to add the class at runtime and screenshot again:

```js
// in a Playwright script, after page.goto('http://localhost:3000')
await page.evaluate(() => document.documentElement.classList.add('theme-professional'))
await page.screenshot({ path: 'professional-preview.png', fullPage: true })
```

Expected: headings render in a serif font, sections are visibly tighter, project cards show a border, and the experience list shows bordered rows instead of a dotted timeline. Compare against the "before" screenshot to confirm Minimal (without the class) is pixel-identical to before this task.

Stop the dev server: `lsof -ti:3000 -sTCP:LISTEN | xargs -r kill`

- [ ] **Step 3: Commit**

```bash
git add web/src/app/globals.css
git commit -m "Add Professional theme structural styles"
```

---

## Task 6: End-to-end verification

**Files:** none created or modified — this task only verifies Tasks 1–5 together.

**Interfaces:** none produced — this is the final integration check.

- [ ] **Step 1: Verify the full loop with no redeploy, by patching Sanity data directly**

This proves the core promise of the feature: a change in Studio reflects on the live (locally running) site without touching code or rebuilding. Start both `studio` and `web` dev servers (root `npm run dev`, as documented in the repo's root README), then use a small one-off script with `next-sanity`'s write client (reuse `web/src/sanity/write-client.ts`'s pattern, or the Studio's own Vision plugin at `http://localhost:3333/vision`) to patch the live `siteSettings` document's `appearance.activeTheme` to `"professional"` and `appearance.professional.accent` to a distinctive test color (e.g. `#ff00ff`).

```bash
cd /Users/bhrugu/React/Portfolio-Sentry && npm run dev &
timeout 30 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done'
timeout 30 bash -c 'until curl -sf http://localhost:3333 >/dev/null; do sleep 1; done'
```

Using the Studio's Vision tool (`http://localhost:3333/vision`) or a direct authenticated `PATCH` via the Sanity API, set `appearance.activeTheme` to `"professional"`. Then, with Playwright:

```js
await page.goto('http://localhost:3000')
await page.waitForTimeout(2000) // allow the live-update subscription to push the change
const htmlClass = await page.evaluate(() => document.documentElement.className)
const accentVar = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent'))
console.log('html class:', htmlClass) // expect to include "theme-professional"
console.log('--accent:', accentVar) // expect the test accent color
await page.screenshot({ path: 'e2e-professional-live.png', fullPage: true })
```

Expected: without restarting the dev server or rebuilding, the live page reflects the new theme class and colors — confirming the "no code touch, no redeploy" promise holds.

**If `--accent` still shows the old hardcoded value instead of the test color:** the injected `<head><style>` and the framework's own compiled `globals.css` `:root`/`.dark` rules have equal CSS specificity, so whichever lands later in the final HTML `<head>` wins the cascade — and that order isn't something this plan can guarantee from reading the code alone. If this happens, raise the injected rule's specificity so it wins regardless of order, e.g. change `tokensToCssBlock`'s selector from `:root` to `html:root` (and `.dark` to `html.dark`) in `web/src/app/layout.tsx` — an extra type-selector on an already-matching element doesn't change what it matches, only its specificity weight.

Revert the test document changes back to the Minimal defaults afterward (`activeTheme: "minimal"`, restore the original accent) so the repo's demo content isn't left in a test state.

- [ ] **Step 2: Verify dark-mode auto-derivation**

With the Professional theme still active and its accent set to a known test color, use the existing dark/light toggle (`theme-toggle.tsx`) via Playwright (`page.click('button[aria-label*="dark mode"]')` or similar, matching its actual `aria-label`) and confirm `--accent` under `.dark` scope resolves to the auto-derived dark variant (a different, but related, hex value — verify it's not identical to the light value and not a fallback/unset color).

- [ ] **Step 3: Verify the additive fallback**

Temporarily comment out the `appearance{...}` block in `SITE_SETTINGS_QUERY` (or test against a duplicate document with `appearance` unset), reload the site, and confirm it renders with the original hardcoded `globals.css` colors and no console errors — proving the feature degrades safely when appearance data is absent. Revert the temporary query change afterward.

- [ ] **Step 4: Run full verification across both projects**

```bash
cd web && npx vitest run && npx tsc --noEmit && npm run lint
cd ../studio && npx tsc --noEmit
```

Expected: all green, no type errors, no new lint errors in files touched by this plan.

- [ ] **Step 5: Clean up dev servers**

```bash
lsof -ti:3000 -sTCP:LISTEN | xargs -r kill 2>/dev/null
lsof -ti:3333 -sTCP:LISTEN | xargs -r kill 2>/dev/null
```

No commit for this task — it verifies Tasks 1–5, which are already committed.
