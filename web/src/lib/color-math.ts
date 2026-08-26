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

/** WCAG AA threshold for normal text/UI elements. */
const MIN_CONTRAST = 4.5

/**
 * If `hex` doesn't have enough contrast against `backgroundHex`, pushes its
 * lightness away from the background (preserving hue/saturation) via binary
 * search until it clears MIN_CONTRAST. A no-op if already sufficient. Used
 * to fix up accent colors after dark-mode inversion, since pure lightness
 * inversion is only correct for colors already near a lightness extreme.
 */
function ensureContrast(hex: string, backgroundHex: string): string {
  if (contrastRatio(hex, backgroundHex) >= MIN_CONTRAST) return hex

  const [h, s, l] = rgbToHsl(...hexToRgb(hex))
  const backgroundIsDark = relativeLuminance(backgroundHex) < 0.5
  let lo = backgroundIsDark ? l : 0
  let hi = backgroundIsDark ? 1 : l

  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2
    const candidate = rgbToHex(...hslToRgb(h, s, mid))
    const meetsThreshold = contrastRatio(candidate, backgroundHex) >= MIN_CONTRAST
    if (backgroundIsDark) {
      if (meetsThreshold) hi = mid
      else lo = mid
    } else {
      if (meetsThreshold) lo = mid
      else hi = mid
    }
  }

  return rgbToHex(...hslToRgb(h, s, backgroundIsDark ? hi : lo))
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
  const darkBackground = deriveDarkVariant(picks.background)
  const darkText = deriveDarkVariant(picks.text)
  const darkAccent = ensureContrast(deriveDarkVariant(picks.accent), darkBackground)
  return computeThemeTokens({
    background: darkBackground,
    text: darkText,
    accent: darkAccent,
  })
}
