import type { ReactNode } from 'react'

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
      // Declarative Umami event tracking: if the analytics script never loaded
      // (unset env vars), these attributes just sit inert — nothing to break.
      data-umami-event="resume_download"
      data-umami-event-file-name={fileName}
    >
      {children}
    </a>
  )
}
