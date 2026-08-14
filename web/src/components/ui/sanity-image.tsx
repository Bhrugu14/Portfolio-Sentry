import Image from 'next/image'
import { urlFor } from '@/sanity/image'

type SanityImageValue = {
  asset?:
    | {
        _id: string
        url?: string | null
        metadata?: { lqip?: string | null; dimensions?: { width: number | null; height: number | null } | null } | null
      }
    | null
  alt?: string | null
  hotspot?: unknown
  crop?: unknown
}

export function SanityImage({
  value,
  width = 800,
  height,
  className,
  priority,
  sizes,
}: {
  value: SanityImageValue | null | undefined
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
}) {
  if (!value?.asset) return null

  const aspectHeight = height ?? Math.round(width / 1.5)

  return (
    <Image
      className={className}
      src={urlFor(value).width(width).height(aspectHeight).fit('crop').url()}
      alt={value.alt || ''}
      width={width}
      height={aspectHeight}
      priority={priority}
      sizes={sizes}
      placeholder={value.asset.metadata?.lqip ? 'blur' : 'empty'}
      blurDataURL={value.asset.metadata?.lqip ?? undefined}
    />
  )
}
