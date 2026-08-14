'use client'

import { motion } from 'framer-motion'
import { PortableText } from 'next-sanity'
import type { SITE_SETTINGS_QUERY_RESULT } from '../../../sanity.types'

export function About({ settings }: { settings: NonNullable<SITE_SETTINGS_QUERY_RESULT> }) {
  if (!settings.about) return null

  return (
    <section id="about" className="mx-auto max-w-3xl px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-accent">About</h2>
        <div className="prose prose-neutral max-w-none text-foreground dark:prose-invert">
          <PortableText value={settings.about} />
        </div>
      </motion.div>
    </section>
  )
}
