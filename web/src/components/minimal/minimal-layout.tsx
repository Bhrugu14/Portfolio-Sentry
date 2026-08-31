import { Nav } from '@/components/nav'
import { Hero } from '@/components/sections/hero'
import { About } from '@/components/sections/about'
import { Skills } from '@/components/sections/skills'
import { Projects } from '@/components/sections/projects'
import { Experience } from '@/components/sections/experience'
import { Contact } from '@/components/sections/contact'
import { Footer } from '@/components/sections/footer'
import type { HomeLayoutProps } from '@/lib/theme'

export function MinimalLayout({ settings, visibility, projects, experience }: HomeLayoutProps) {
  return (
    <>
      <Nav visibility={visibility} name={settings.name} />
      <main id="main-content">
        <Hero settings={settings} />
        <About settings={settings} />
        <Skills settings={settings} />
        <Projects projects={projects} theme="minimal" />
        <Experience items={experience} />
        <Contact settings={settings} />
      </main>
      <Footer name={settings.name} />
    </>
  )
}
