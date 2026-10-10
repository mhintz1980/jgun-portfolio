// Page registry: the public shell interface shared by every page of the site.
// Zero imports by design. It carries no scroll length and never reads page progress.

export type PageId = 'jgun' | 'quiet-machine' | 'm249'

export type TierParam = 'full' | 'lite' | 'poster'

export interface PageEntry {
  id: PageId
  /** 1-based position in the site order. */
  index: number
  /** Nav text. */
  label: string
  /** Long name. */
  name: string
  path: string
  /** Null while the page is reserved. */
  href: string | null
  /** HTML entry for the build input; null while the page is reserved. */
  htmlEntry: string | null
  reserved: boolean
  /** The entry fades in from the previous page's fade flag. */
  fadeIn: boolean
}

export const PAGES: readonly PageEntry[] = [
  {
    id: 'jgun',
    index: 1,
    label: 'TORQUE GUN',
    name: 'JGUN Pneumatic Torque Gun',
    path: '/',
    href: '/',
    htmlEntry: 'index.html',
    reserved: false,
    fadeIn: false,
  },
  {
    id: 'quiet-machine',
    index: 2,
    label: 'THE QUIET MACHINE',
    name: 'The Quiet Machine: RL300',
    path: '/quiet-machine/',
    href: '/quiet-machine/',
    htmlEntry: 'quiet-machine/index.html',
    reserved: false,
    fadeIn: true,
  },
  {
    id: 'm249',
    index: 3,
    label: 'M249',
    name: 'M249 (in preparation)',
    path: '/m249/',
    href: null,
    htmlEntry: null,
    reserved: true,
    fadeIn: false,
  },
]

const TIERS: readonly TierParam[] = ['full', 'lite', 'poster']

/** Link target for a page at a quality tier. Null for a reserved page. */
export function pageHref(id: PageId, tier: TierParam = 'full'): string | null {
  const page = PAGES.find((entry) => entry.id === id)
  if (!page || page.reserved || page.href === null) return null
  return tier === 'full' ? page.href : `${page.href}?quality=${tier}`
}

/** The `quality` search param when it names one of the three tiers, else null. */
export function readTierParam(search: string): TierParam | null {
  const value = new URLSearchParams(search).get('quality')
  return TIERS.find((tier) => tier === value) ?? null
}

/** Reduced motion means poster. Otherwise the search param, defaulting to full. */
export function resolveEntryTier(search: string, reducedMotion: boolean): TierParam {
  if (reducedMotion) return 'poster'
  return readTierParam(search) ?? 'full'
}

export type RedirectStatus = 'active' | 'cutover' | 'jg-037'

export interface LegacyRedirect {
  param: string
  values: readonly string[]
  to: PageId
  /** Carry the other query params across the redirect. */
  keepParams: boolean
  status: RedirectStatus
}

export const LEGACY_REDIRECTS: readonly LegacyRedirect[] = [
  { param: 'study', values: ['rl300'], to: 'quiet-machine', keepParams: true, status: 'active' },
  { param: 'station', values: ['2', 'enclosure', 'safe-enclosure'], to: 'quiet-machine', keepParams: false, status: 'cutover' },
  { param: 'chapter', values: ['2'], to: 'quiet-machine', keepParams: false, status: 'cutover' },
  { param: 'station', values: ['3', 'm249'], to: 'm249', keepParams: false, status: 'jg-037' },
  { param: 'chapter', values: ['3'], to: 'm249', keepParams: false, status: 'jg-037' },
]
