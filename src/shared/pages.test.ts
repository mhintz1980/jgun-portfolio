import { describe, expect, it } from 'vitest'
import { LEGACY_REDIRECTS, PAGES, pageHref, publicPages, readTierParam, resolveEntryTier } from './pages'
import type { PageId } from './pages'

const byId = (id: PageId) => {
  const row = PAGES.find((page) => page.id === id)
  if (!row) throw new Error(`PAGES has no row for ${id}`)
  return row
}

describe('PAGES registry', () => {
  it('lists the two public pages in owner order, then the private root shell', () => {
    expect(PAGES.map((page) => page.id)).toEqual(['torque-wrench', 'quiet-machine', 'jgun'])
  })

  it('publicPages drops exactly the private rows', () => {
    expect(publicPages().map((page) => page.id)).toEqual(['torque-wrench', 'quiet-machine'])
    expect(PAGES.filter((page) => page.private).map((page) => page.id)).toEqual(['jgun'])
  })

  it('registers no M249 page for the launch build', () => {
    for (const page of PAGES) {
      expect(JSON.stringify(page), page.id).not.toMatch(/m249/i)
    }
  })

  it('has unique ids', () => {
    const ids = PAGES.map((page) => page.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has unique, ascending indexes', () => {
    const indexes = PAGES.map((page) => page.index)
    expect(new Set(indexes).size).toBe(indexes.length)
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b))
    expect(indexes).toEqual([1, 2, 3])
  })

  it('marks a page reserved exactly when it has no href and no html entry', () => {
    for (const page of PAGES) {
      expect(page.reserved, `${page.id}: reserved vs href`).toBe(page.href === null)
      expect(page.reserved, `${page.id}: reserved vs htmlEntry`).toBe(page.htmlEntry === null)
    }
  })

  it('carries the nav label and a non-empty long name on every row', () => {
    expect(PAGES.map((page) => page.label)).toEqual(['TORQUE WRENCH', 'THE QUIET MACHINE', 'HOME'])
    for (const page of PAGES) expect(page.name.length, `${page.id}: name`).toBeGreaterThan(0)
  })

  it('pins the torque-wrench row as the first public page', () => {
    expect(byId('torque-wrench')).toMatchObject({
      index: 1,
      path: '/torque-wrench/',
      href: '/torque-wrench/',
      htmlEntry: 'torque-wrench/index.html',
      reserved: false,
      fadeIn: true,
      private: false,
    })
  })

  it('pins the quiet-machine row', () => {
    expect(byId('quiet-machine')).toMatchObject({
      path: '/quiet-machine/',
      href: '/quiet-machine/',
      htmlEntry: 'quiet-machine/index.html',
      reserved: false,
      fadeIn: true,
      private: false,
    })
  })

  it('pins the jgun row as the private root redirect shell', () => {
    expect(byId('jgun')).toMatchObject({
      path: '/',
      href: '/',
      htmlEntry: 'index.html',
      reserved: false,
      fadeIn: false,
      private: true,
    })
  })
})

describe('pageHref', () => {
  it('appends ?quality= for a non-full tier', () => {
    expect(pageHref('quiet-machine', 'lite')).toBe('/quiet-machine/?quality=lite')
    expect(pageHref('quiet-machine', 'poster')).toBe('/quiet-machine/?quality=poster')
  })

  it('returns the bare href for the full tier and when the tier is omitted', () => {
    expect(pageHref('jgun')).toBe('/')
    expect(pageHref('jgun', 'full')).toBe('/')
    expect(pageHref('quiet-machine')).toBe('/quiet-machine/')
    expect(pageHref('quiet-machine', 'full')).toBe('/quiet-machine/')
  })

  it('carries the tier on the jgun href', () => {
    expect(pageHref('jgun', 'poster')).toBe('/?quality=poster')
  })

  it('returns null for an unregistered page at every tier', () => {
    const unknown = 'm249' as PageId
    for (const tier of ['full', 'lite', 'poster'] as const) expect(pageHref(unknown, tier), tier).toBeNull()
  })

  // Holds before and after activation: null while the row is reserved, the tiered path once it is live.
  it('the torque page resolves to null while reserved and to its tiered path once live', () => {
    const row = byId('torque-wrench')
    const base = row.href
    for (const tier of ['full', 'lite', 'poster'] as const) {
      const href = pageHref('torque-wrench', tier)
      if (row.reserved) expect(href, tier).toBeNull()
      else expect(href, tier).toBe(tier === 'full' ? base : `${base}?quality=${tier}`)
    }
  })
})

describe('readTierParam', () => {
  it('returns each valid tier, with or without the leading question mark', () => {
    expect(readTierParam('?quality=full')).toBe('full')
    expect(readTierParam('?quality=lite')).toBe('lite')
    expect(readTierParam('?quality=poster')).toBe('poster')
    expect(readTierParam('quality=lite')).toBe('lite')
  })

  it('finds the param among others', () => {
    expect(readTierParam('?study=rl300&quality=poster&x=1')).toBe('poster')
  })

  it('returns null for an unknown value', () => {
    expect(readTierParam('?quality=ultra')).toBeNull()
    expect(readTierParam('?quality=')).toBeNull()
    expect(readTierParam('?quality=LITE')).toBeNull()
  })

  it('returns null when the param is missing', () => {
    expect(readTierParam('')).toBeNull()
    expect(readTierParam('?')).toBeNull()
    expect(readTierParam('?study=rl300')).toBeNull()
  })

  it('does not read the jgun-only qualityLock param', () => {
    expect(readTierParam('?qualityLock=lite')).toBeNull()
  })
})

describe('resolveEntryTier truth table', () => {
  it('reduced motion with no param gives poster', () => {
    expect(resolveEntryTier('', true)).toBe('poster')
  })

  it('reduced motion wins over an explicit tier', () => {
    expect(resolveEntryTier('?quality=full', true)).toBe('poster')
    expect(resolveEntryTier('?quality=lite', true)).toBe('poster')
  })

  it('without reduced motion, a valid param is honoured', () => {
    expect(resolveEntryTier('?quality=lite', false)).toBe('lite')
    expect(resolveEntryTier('?quality=poster', false)).toBe('poster')
  })

  it('without reduced motion and without a usable param, the tier is full', () => {
    expect(resolveEntryTier('', false)).toBe('full')
    expect(resolveEntryTier('?quality=ultra', false)).toBe('full')
  })
})

describe('LEGACY_REDIRECTS', () => {
  it('points every row at a PAGES id', () => {
    const ids = new Set<string>(PAGES.map((page) => page.id))
    for (const row of LEGACY_REDIRECTS) expect(ids.has(row.to), `${row.param}=${row.values.join('|')}`).toBe(true)
  })

  it('has no row without values', () => {
    for (const row of LEGACY_REDIRECTS) expect(row.values.length).toBeGreaterThan(0)
  })

  it('encodes the Q5 default statuses', () => {
    expect(LEGACY_REDIRECTS.map((row) => [row.param, [...row.values], row.to, row.keepParams, row.status])).toEqual([
      ['study', ['rl300'], 'quiet-machine', true, 'active'],
      ['station', ['2', 'enclosure', 'safe-enclosure'], 'quiet-machine', false, 'cutover'],
      ['chapter', ['2'], 'quiet-machine', false, 'cutover'],
    ])
  })
})
