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
