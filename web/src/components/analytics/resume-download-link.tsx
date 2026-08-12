'use client'

import type { ReactNode } from 'react'
import { sendGAEvent } from '@next/third-parties/google'
import { buildResumeDownloadEvent } from '@/lib/analytics-events'

export function ResumeDownloadLink({
  href,
  fileName,
  className,
  children,
}: {
  href: string
  fileName: string
  className?: string
  children: ReactNode
}) {
  return (
    <a
      href={href}
      download
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        const event = buildResumeDownloadEvent(fileName, href)
        sendGAEvent('event', event.name, event.params)
      }}
    >
      {children}
    </a>
  )
}
