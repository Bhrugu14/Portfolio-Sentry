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
