import type { SectionVisibility } from '@/components/nav'
import type { EXPERIENCE_QUERY_RESULT, PROJECTS_QUERY_RESULT, SITE_SETTINGS_QUERY_RESULT } from '../../sanity.types'

export type ThemeName = 'minimal' | 'professional'

/** The shape every theme's top-level layout component receives — one theme, one component, same props. */
export interface HomeLayoutProps {
  settings: NonNullable<SITE_SETTINGS_QUERY_RESULT>
  visibility: SectionVisibility
  projects: PROJECTS_QUERY_RESULT
  experience: EXPERIENCE_QUERY_RESULT
}
