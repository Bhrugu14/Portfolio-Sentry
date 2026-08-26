import type { SITE_SETTINGS_QUERY_RESULT } from '../../../sanity.types'

const SOCIAL_LABELS: Record<string, string> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  twitter: 'X / Twitter',
  email: 'Email',
  other: 'Link',
}

export function SocialLinks({
  links,
  className,
}: {
  links: NonNullable<NonNullable<SITE_SETTINGS_QUERY_RESULT>['socialLinks']>
  className?: string
}) {
  return (
    <ul className={className}>
      {links.map((link) => (
        <li key={link._key}>
          <a href={link.url ?? undefined} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-accent">
            {SOCIAL_LABELS[link.platform ?? 'other'] ?? link.platform}
          </a>
        </li>
      ))}
    </ul>
  )
}
