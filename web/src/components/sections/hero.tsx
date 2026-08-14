'use client'

import { motion } from 'framer-motion'
import { SanityImage } from '@/components/ui/sanity-image'
import { ResumeDownloadLink } from '@/components/analytics/resume-download-link'
import type { SITE_SETTINGS_QUERY_RESULT } from '../../../sanity.types'

export function Hero({ settings }: { settings: NonNullable<SITE_SETTINGS_QUERY_RESULT> }) {
  const resumeUrl = settings.resumeFile?.asset?.url
  const resumeFileName = settings.resumeFile?.asset?.originalFilename || 'resume.pdf'

  return (
    <section id="home" className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-6 py-24 text-center sm:py-32">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SanityImage
          value={settings.profileImage}
          width={144}
          height={144}
          priority
          className="mx-auto rounded-full border border-border object-cover"
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col gap-4"
      >
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{settings.name}</h1>
        <p className="text-lg text-muted sm:text-xl">{settings.title}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-wrap items-center justify-center gap-4"
      >
        <a
          href="#contact"
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          Get in touch
        </a>
        {resumeUrl && (
          <ResumeDownloadLink
            href={resumeUrl}
            fileName={resumeFileName}
            className="rounded-full border border-border px-6 py-2.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
          >
            Download résumé
          </ResumeDownloadLink>
        )}
      </motion.div>
    </section>
  )
}
