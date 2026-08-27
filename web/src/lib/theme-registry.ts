import type { ComponentType } from 'react'
import { MinimalLayout } from '@/components/minimal/minimal-layout'
import { ProfessionalLayout } from '@/components/professional/professional-layout'
import type { HomeLayoutProps, ThemeName } from './theme'

export interface ThemeDefinition {
  key: ThemeName
  title: string
}

/**
 * Single source of truth for which themes exist. Adding a theme means
 * adding one entry here plus one entry in THEME_LAYOUTS below — nothing
 * else in the app branches on theme name.
 */
export const THEME_REGISTRY: ThemeDefinition[] = [
  { key: 'minimal', title: 'Minimal' },
  { key: 'professional', title: 'Professional' },
]

const DEFAULT_THEME: ThemeName = THEME_REGISTRY[0].key

/** Normalizes a raw (possibly missing/invalid) Sanity value to a known theme, defaulting safely. */
export function resolveThemeName(value: string | null | undefined): ThemeName {
  const match = THEME_REGISTRY.find((theme) => theme.key === value)
  return match ? match.key : DEFAULT_THEME
}

/** Which top-level layout component renders the whole page for a given theme. */
export const THEME_LAYOUTS: Record<ThemeName, ComponentType<HomeLayoutProps>> = {
  minimal: MinimalLayout,
  professional: ProfessionalLayout,
}
