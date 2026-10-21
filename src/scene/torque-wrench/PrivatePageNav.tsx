// Private-local page navigation. The shared public registry stays untouched: this adapter only
// substitutes the private torque-wrench row for the public jgun row while preserving siblings.
import { PageLink } from '../../shared/PageNav'
import { publicPages, type PageId, type TierParam } from '../../shared/pages'

export interface PrivatePageNavProps {
  tier: TierParam
  variant: 'header' | 'endcard'
}

interface PrivateNavRow {
  id: PageId
  label: string
}

const VARIANT_CLASS = { header: 'shell-nav-header', endcard: 'shell-nav-endcard' } as const
const VARIANT_LABEL = { header: 'Pages', endcard: 'More pages' } as const

function privateNavPages(): readonly PrivateNavRow[] {
  return publicPages().map((page) => ({
    id: page.id === 'jgun' ? ('torque-wrench' as const) : page.id,
    label: page.label,
  }))
}

export function PrivatePageNav({ tier, variant }: PrivatePageNavProps) {
  return (
    <nav className={`shell-nav ${VARIANT_CLASS[variant]}`} aria-label={VARIANT_LABEL[variant]}>
      <ul className="shell-nav-list">
        {privateNavPages().map((page) => (
          <li key={page.id} className="shell-nav-item">
            <PageLink id={page.id} tier={tier} current={page.id === 'torque-wrench'}>
              {page.label}
            </PageLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
