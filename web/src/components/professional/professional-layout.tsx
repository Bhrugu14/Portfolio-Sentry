import { ProfessionalSidebar } from './professional-sidebar'
import { Skills } from '@/components/sections/skills'
import { Projects } from '@/components/sections/projects'
import { Experience } from '@/components/sections/experience'
import { Contact } from '@/components/sections/contact'
import { Footer } from '@/components/sections/footer'
import type { HomeLayoutProps } from '@/lib/theme'

export function ProfessionalLayout({ settings, visibility, projects, experience }: HomeLayoutProps) {
  return (
    <>
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12 lg:flex-row lg:gap-16 lg:py-24">
        <ProfessionalSidebar settings={settings} visibility={visibility} />
        <main id="main-content" className="min-w-0 flex-1 lg:max-w-2xl">
          <Skills settings={settings} />
          <Projects projects={projects} theme="professional" />
          <Experience items={experience} />
          <Contact settings={settings} showSocialLinks={false} />
        </main>
      </div>
      <Footer name={settings.name} />
    </>
  )
}
