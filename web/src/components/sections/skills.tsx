'use client'

import { motion } from 'framer-motion'
import { SanityImage } from '@/components/ui/sanity-image'
import type { SITE_SETTINGS_QUERY_RESULT } from '../../../sanity.types'

export function Skills({ settings }: { settings: NonNullable<SITE_SETTINGS_QUERY_RESULT> }) {
  const categories = settings.skillCategories ?? []
  if (categories.length === 0) return null

  return (
    <section id="skills" className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="mb-10 text-sm font-semibold uppercase tracking-widest text-accent">Skills</h2>
      <div className="grid gap-10 sm:grid-cols-2">
        {categories.map((category, i) => (
          <motion.div
            key={category._key}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
          >
            <h3 className="mb-4 text-base font-medium">{category.name}</h3>
            <ul className="flex flex-wrap gap-2">
              {(category.skills ?? []).map((skill) => (
                <li
                  key={skill._key}
                  className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm"
                >
                  {skill.icon?.asset && (
                    <SanityImage value={skill.icon} width={16} height={16} className="rounded-sm" />
                  )}
                  {skill.name}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
