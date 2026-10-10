// Generic page nav: one row per registered page, rendered from the registry.
// Class names are shell-* only. Styling belongs to the page that mounts the nav.
import type { ReactNode } from 'react'
import { PAGES, pageHref, type PageId, type TierParam } from './pages'

export interface PageLinkProps {
  id: PageId
  tier: TierParam
  children: ReactNode
  /** The row for the page being viewed. */
  current?: boolean
}

/**
 * A live page is an anchor the fade runtime intercepts (data-fade) and that carries the tier.
 * A reserved page is plain text, never a link.
 */
export function PageLink({ id, tier, children, current = false }: PageLinkProps) {
  const href = pageHref(id, tier)
  const ariaCurrent = current ? 'page' : undefined
  if (href === null) {
    return (
      <span className="shell-nav-reserved" aria-current={ariaCurrent}>
        {children}, in preparation
      </span>
    )
  }
  return (
    <a data-fade="" href={href} aria-current={ariaCurrent}>
      {children}
    </a>
  )
}

export interface PageNavProps {
  current: PageId
  tier: TierParam
  variant: 'header' | 'endcard'
}

const VARIANT_CLASS = { header: 'shell-nav-header', endcard: 'shell-nav-endcard' } as const

export function PageNav({ current, tier, variant }: PageNavProps) {
  return (
    <nav className={`shell-nav ${VARIANT_CLASS[variant]}`} aria-label="Pages">
      <ul className="shell-nav-list">
        {PAGES.map((page) => (
          <li key={page.id} className="shell-nav-item">
            <PageLink id={page.id} tier={tier} current={page.id === current}>
              {page.label}
            </PageLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
