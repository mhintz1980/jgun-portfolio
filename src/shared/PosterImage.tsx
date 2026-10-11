// Generic poster image: one authored still, a narrow crop below POSTER_NARROW_MEDIA, no canvas and
// no CAD import. Class names are shell-* only; the page that mounts it owns the styling.
import type { ReactNode } from 'react'
import { POSTER_NARROW_MEDIA, type PosterEntry } from './poster'

export interface PosterImageProps {
  entry: PosterEntry
  className?: string
  /** `eager` for the first paint of a poster path, `lazy` for stills below it. */
  loading?: 'eager' | 'lazy'
  /** Rendered after the picture, inside the figure (a caption, for one). */
  children?: ReactNode
}

export function PosterImage({ entry, className = 'shell-poster', loading = 'lazy', children }: PosterImageProps) {
  const { desktop, narrow } = entry
  return (
    <figure className={className} data-poster={entry.id} data-poster-status={entry.status}>
      <picture>
        {narrow && (
          <source media={POSTER_NARROW_MEDIA} srcSet={narrow.src} width={narrow.width} height={narrow.height} />
        )}
        <img src={desktop.src} alt={entry.alt} loading={loading} decoding="async" width={desktop.width} height={desktop.height} />
      </picture>
      {children}
    </figure>
  )
}
