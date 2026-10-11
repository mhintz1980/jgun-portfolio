import { describe, expect, it } from 'vitest'
import { POSTER_NARROW_MEDIA, posterFor, validatePosterMap, type PosterEntry } from './poster'

const entry = (over: Partial<PosterEntry> = {}): PosterEntry => ({
  id: 'opening',
  alt: 'Registered drawing of the wrench on the drafting table.',
  desktop: { src: '/torque-wrench/posters/opening-desktop.webp', width: 1920, height: 1080 },
  narrow: { src: '/torque-wrench/posters/opening-narrow.webp', width: 828, height: 1472 },
  status: 'temporary',
  provenance: null,
  ...over,
})

const provenance = {
  origin: 'offline-render' as const,
  sourceScene: 'torque-wrench-opening.blend',
  settings: 'Cycles 512 spp, 1920x1080, filmic',
  assetVersions: { 'JGUN-1.glb': 'e5bff994' },
}

describe('validatePosterMap', () => {
  it('accepts a temporary entry without provenance and a final entry with it', () => {
    expect(validatePosterMap([entry()])).toEqual([])
    expect(validatePosterMap([entry({ status: 'final', provenance })])).toEqual([])
  })

  it('accepts the Quiet Machine shape: three frames, a desktop file only', () => {
    const frame = (id: string): PosterEntry => ({
      id,
      alt: `RL300 ${id}`,
      desktop: { src: `/images/rl300-${id}-preview.png`, width: 1600, height: 900 },
      status: 'temporary',
      provenance: null,
    })
    expect(validatePosterMap(['exterior', 'section', 'intake'].map(frame), ['exterior', 'section', 'intake'])).toEqual([])
  })

  it('reports each class of problem', () => {
    const cases: [string, PosterEntry[], RegExp][] = [
      ['empty alt', [entry({ alt: '  ' })], /alt text is empty/],
      ['duplicate id', [entry(), entry()], /duplicate id/],
      ['not root relative', [entry({ desktop: { src: 'a.webp', width: 1, height: 1 } })], /root-relative/],
      ['not a raster', [entry({ desktop: { src: '/a.svg', width: 1, height: 1 } })], /raster/],
      ['a CAD path', [entry({ desktop: { src: '/models/a.glb', width: 1, height: 1 } })], /CAD asset/],
      ['bad dimensions', [entry({ desktop: { src: '/a.png', width: 0, height: 1.5 } })], /positive integers/],
      ['final without provenance', [entry({ status: 'final' })], /needs provenance/],
      ['final with empty versions', [entry({ status: 'final', provenance: { ...provenance, assetVersions: {} } })], /assetVersions is empty/],
      ['bad narrow', [entry({ narrow: { src: '/n.gif', width: 1, height: 1 } })], /narrow: src must be a raster/],
    ]
    for (const [name, map, pattern] of cases) {
      expect(validatePosterMap(map).join('\n'), name).toMatch(pattern)
    }
  })

  it('reports an expected id with no still', () => {
    expect(validatePosterMap([entry()], ['opening', 'pit'])).toEqual(['no poster for "pit"'])
  })
})

describe('posterFor', () => {
  it('finds an entry and returns null for an unknown id', () => {
    const map = [entry()]
    expect(posterFor(map, 'opening')).toBe(map[0])
    expect(posterFor(map, 'nope')).toBeNull()
  })
})

describe('POSTER_NARROW_MEDIA', () => {
  it('matches the StaticShaftStory convention', () => {
    expect(POSTER_NARROW_MEDIA).toBe('(max-width: 600px)')
  })
})
