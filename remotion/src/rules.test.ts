import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import * as copy from './copy'
import { FILM_ARMAMENT, showcase } from './armament'

// The showreel's hard rules (owner rulings), checked in the root `npm test` gate.
// Copy rules mirror src/home/content.test.ts and add the showreel brief's walls.

const HERE = path.dirname(new URL(import.meta.url).pathname)

function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) for (const item of value) strings(item, out)
  else if (value && typeof value === 'object') for (const item of Object.values(value)) strings(item, out)
  return out
}

function sources(dir = HERE): { file: string; text: string }[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return sources(full)
    if (!/\.(ts|tsx)$/.test(name) || name.endsWith('.test.ts')) return []
    return [{ file: path.relative(HERE, full), text: readFileSync(full, 'utf8') }]
  })
}

const COPY = strings(Object.values(copy))
const SRC = sources()

const BANNED: readonly [string, RegExp][] = [
  // Homepage accuracy rules (src/home/content.test.ts)
  ['Systems Architect', /systems architect/i],
  ['CATIA', /catia/i],
  ['Creo', /\bcreo\b/i],
  ['Fusion 360', /fusion\s*360/i],
  ['PE stamp', /\bP\.?E\.?\b/],
  ['M249', /m249/i],
  ['employer Myers', /myers/i],
  ['employer Seth', /\bseth\b/i],
  ['employer MSP', /\bmsp\b/i],
  ['product RL300', /rl\s*-?300/i],
  ['brand Torque Gun', /torque\s*gun/i],
  ['product JGUN', /j-?gun/i],
  ['unverified headline', /built from the shop floor up/i],
  ['v2 22% claim', /22\s*%/],
  ['v2 hours claim', /\d+\+?\s*(hrs|hours)/i],
  ['v2 47 components', /\b47\b/],
  ['v2 tolerance', /0005/],
  ['v2 15 years', /\b15\s*(yrs|years)/i],
  ['v2 7-axis', /7-axis/i],
  // Showreel brief: no dimensions, GD&T or part numbers anywhere on screen
  ['GD&T', /gd\s*&\s*t/i],
  ['part number', /\b[PKA]\d{6}\b/],
  ['dimension', /\d+(\.\d+)?\s*(mm|cm|in\b|inch|"|°|deg)/i],
  ['tolerance', /±/],
  // No third-party firearm brands (copy says "AR-15-pattern")
  ['firearm brand', /\b(colt|fn\b|fnh|daniel defense|bravo company|bcm|aero precision|magpul|knight'?s|lmt|sig\s*sauer|heckler|h&k|ruger|smith\s*&\s*wesson|armalite|springfield|palmetto|psa\b|geissele|noveske|larue)\b/i],
]

describe('showreel on-screen copy', () => {
  it('has copy to scan', () => {
    expect(COPY.join(' ').length).toBeGreaterThan(400)
  })
  it.each(BANNED)('never says: %s', (_label, pattern) => {
    expect(COPY.find((text) => pattern.test(text)) ?? null).toBeNull()
  })
  it('names the platform the owner way', () => {
    expect(copy.ARMAMENT.line).toMatch(/AR-15-pattern/)
  })
})

describe('showreel armament imagery', () => {
  it('uses only images from public/home/armament-showcase/', () => {
    for (const file of FILM_ARMAMENT) expect(() => showcase(file)).not.toThrow()
    for (const { file, text } of SRC) {
      for (const m of text.matchAll(/ar-\d\d\.webp/g)) expect(FILM_ARMAMENT, `${file}: ${m[0]}`).toContain(m[0])
    }
  })
  it('draws representative images only through the labelled card', () => {
    // showcase(...).src is the only way to an <Img> outside ShowcaseCard; it may only be used on "mine".
    for (const { file, text } of SRC) {
      if (file === path.join('ui', 'ShowcaseCard.tsx')) continue
      for (const m of text.matchAll(/showcase\(\s*['"](ar-\d\d\.webp)['"]\s*\)/g)) {
        expect(showcase(m[1]).label, `${file} uses ${m[1]} without its label`).toBe('mine')
      }
    }
    expect(copy.ARMAMENT.representativeLabel).toMatch(/^Representative model/)
    const card = SRC.find((s) => s.file === path.join('ui', 'ShowcaseCard.tsx'))!.text
    expect(card).toMatch(/label === 'representative'/)
    expect(card).toMatch(/ARMAMENT\.representativeLabel/)
  })
  it('includes at least one representative image, so the label path is exercised', () => {
    expect(FILM_ARMAMENT.some((f) => showcase(f).label === 'representative')).toBe(true)
  })
})

describe('showreel sources', () => {
  it('never loads the third-party M249 models', () => {
    for (const { file, text } of SRC) expect(text, file).not.toMatch(/m249/i)
  })
  it('never puts engineering drawings on screen', () => {
    for (const { file, text } of SRC) expect(text, file).not.toMatch(/home\/drawings\/|home\/stacks\/|['"`/]drawing\//)
  })
})
