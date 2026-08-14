import { notFound } from 'next/navigation'
import { sanityFetch } from '@/sanity/live'
import { EXPERIENCE_QUERY, PROJECTS_QUERY, SITE_SETTINGS_QUERY } from '@/sanity/queries'
import { Nav } from '@/components/nav'
import { Hero } from '@/components/sections/hero'
import { About } from '@/components/sections/about'
import { Skills } from '@/components/sections/skills'
import { Projects } from '@/components/sections/projects'
import { Experience } from '@/components/sections/experience'
import { Contact } from '@/components/sections/contact'
import { Footer } from '@/components/sections/footer'

export default async function Home() {
  const [{ data: settings }, { data: projects }, { data: experience }] = await Promise.all([
    sanityFetch({ query: SITE_SETTINGS_QUERY, stega: false }),
    sanityFetch({ query: PROJECTS_QUERY, stega: false }),
    sanityFetch({ query: EXPERIENCE_QUERY, stega: false }),
  ])

  if (!settings) return notFound()

  return (
    <>
      <Nav />
      <main>
        <Hero settings={settings} />
        <About settings={settings} />
        <Skills settings={settings} />
        <Projects projects={projects} />
        <Experience items={experience} />
        <Contact settings={settings} />
      </main>
      <Footer name={settings.name} />
    </>
  )
}
