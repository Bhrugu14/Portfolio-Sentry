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
  fit = 'crop',
}: {
  value: SanityImageValue | null | undefined
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
  /** 'crop' (default) forces the given width/height, cropping to fill — for thumbnails/cards. 'max' preserves the image's own aspect ratio, showing it uncropped. */
  fit?: 'crop' | 'max'
}) {
  if (!value?.asset) return null

  const naturalDims = value.asset.metadata?.dimensions
  const aspectHeight =
    fit === 'max' && naturalDims?.width && naturalDims?.height
      ? Math.round((width / naturalDims.width) * naturalDims.height)
      : (height ?? Math.round(width / 1.5))

  return (
    <Image
      className={className}
      src={urlFor(value).width(width).height(aspectHeight).fit(fit).url()}
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
