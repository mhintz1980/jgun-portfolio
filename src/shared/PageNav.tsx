// Generic page nav: one row per registered page, rendered from the registry.
// Class names are shell-* only. Styling belongs to the page that mounts the nav.
import type { ReactNode } from 'react'
import { pageHref, publicPages, type PageId, type TierParam } from './pages'

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
  /** Landmark name. Two navs on one page need two names. Default "Pages". */
  label?: string
  /** Prefix each row with its two-digit site-order number. */
  numbered?: boolean
  /** Render the current row as plain text (aria-current kept) instead of a link to itself. */
  currentAsText?: boolean
}

const VARIANT_CLASS = { header: 'shell-nav-header', endcard: 'shell-nav-endcard' } as const

export function PageNav({ current, tier, variant, label = 'Pages', numbered = false, currentAsText = false }: PageNavProps) {
  return (
    <nav className={`shell-nav ${VARIANT_CLASS[variant]}`} aria-label={label}>
      <ul className="shell-nav-list">
        {publicPages().map((page) => {
          const isCurrent = page.id === current
          const content = (
            <>
              {numbered && (
                <>
                  <span className="shell-nav-index">{String(page.index).padStart(2, '0')}</span>{' '}
                </>
              )}
              {page.label}
            </>
          )
          return (
            <li key={page.id} className="shell-nav-item">
              {currentAsText && isCurrent && pageHref(page.id, tier) !== null ? (
                <span className="shell-nav-current" aria-current="page">
                  {content}
                </span>
              ) : (
                <PageLink id={page.id} tier={tier} current={isCurrent}>
                  {content}
                </PageLink>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
