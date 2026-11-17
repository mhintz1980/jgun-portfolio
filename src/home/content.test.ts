import { describe, expect, it } from 'vitest'
import * as content from './content'
import { CONTACT, CORE_PROJECTS, DRAWING_LAYERS, PLUS_ITEMS } from './content'

// Accuracy rules for homepage copy (docs/HANDOFF-homepage-path-a-2026-11-01.md). Every string
// exported by content.ts is scanned, so new copy is covered without editing this file.

function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) for (const item of value) strings(item, out)
  else if (value && typeof value === 'object') for (const item of Object.values(value)) strings(item, out)
  return out
}

const COPY = strings(Object.values(content)).filter((text) => !text.startsWith('/home/drawings/'))
const ALL = COPY.join('\n')

const BANNED: readonly [string, RegExp][] = [
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
  ['PDM compliance overclaim', /automated pdm compliance/i],
  ['migration tool origin story', /(because|after|when)\s+(we|i|the company)\b/i],
]

describe('homepage copy accuracy rules', () => {
  it.each(BANNED)('never says: %s', (_label, pattern) => {
    const hit = COPY.find((text) => pattern.test(text))
    expect(hit ?? null).toBeNull()
  })

  it('PumpTracker copy carries no hours-saved number', () => {
    const pump = PLUS_ITEMS.find((item) => item.id === 'pumptracker')
    expect(pump).toBeDefined()
    expect(`${pump?.line} ${pump?.stack}`).not.toMatch(/\d/)
  })

  it('the CAD/PDM tools card is labelled a prototype', () => {
    expect(PLUS_ITEMS.find((item) => item.id === 'cad-pdm-tools')?.status).toBe('Prototype')
  })

  it('the armament row links to its under-construction page', () => {
    const row = CORE_PROJECTS.find((project) => project.id === 'armament')
    expect(row?.href).toBe('/armament/')
    expect(row?.status).toBe('Under construction')
  })

  it('the renderings row is a gallery without a page', () => {
    expect(CORE_PROJECTS.find((project) => project.id === 'renderings')?.href).toBeNull()
  })

  it('the live rows link to the registered pages', () => {
    expect(CORE_PROJECTS.filter((project) => project.href).map((project) => project.href)).toEqual([
      '/torque-wrench/',
      '/quiet-machine/',
      '/armament/',
    ])
  })

  it('contact links are plain, absolute and complete', () => {
    expect(CONTACT.email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/)
    expect(CONTACT.linkedin).toMatch(/^https:\/\//)
    expect(CONTACT.github).toMatch(/^https:\/\//)
  })

  it('has copy to scan', () => {
    expect(ALL.length).toBeGreaterThan(500)
  })
})

describe('DRAWING_LAYERS', () => {
  it('has one primary layer per project and unique ids', () => {
    const ids = DRAWING_LAYERS.map((layer) => layer.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const project of ['torque-wrench', 'quiet-machine', 'armament'] as const) {
      expect(
        DRAWING_LAYERS.filter((layer) => layer.project === project && layer.primary),
        project,
      ).toHaveLength(1)
    }
  })

  it('points every layer at a mask under /home/drawings/', () => {
    for (const layer of DRAWING_LAYERS) expect(layer.src).toBe(`/home/drawings/${layer.id}.webp`)
  })
})

describe('STACKS', () => {
  it('every stack image exists, with its real pixel size', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { STACKS } = await import('./content')
    for (const images of Object.values(STACKS)) {
      for (const image of images ?? []) {
        const file = `public${image.src}`
        expect(existsSync(file), file).toBe(true)
        // WebP VP8/VP8L/VP8X headers carry the canvas size; read it to pin width/height.
        const buf = readFileSync(file)
        const chunk = buf.toString('ascii', 12, 16)
        let w = 0
        let h = 0
        if (chunk === 'VP8X') {
          w = 1 + buf.readUIntLE(24, 3)
          h = 1 + buf.readUIntLE(27, 3)
        } else if (chunk === 'VP8 ') {
          w = buf.readUInt16LE(26) & 0x3fff
          h = buf.readUInt16LE(28) & 0x3fff
        } else if (chunk === 'VP8L') {
          const bits = buf.readUInt32LE(21)
          w = (bits & 0x3fff) + 1
          h = ((bits >> 14) & 0x3fff) + 1
        }
        expect([w, h], file).toEqual([image.width, image.height])
      }
    }
  })

  it('stack files carry no company or product names', async () => {
    const { STACKS } = await import('./content')
    for (const images of Object.values(STACKS)) {
      for (const image of images ?? []) expect(image.src).toMatch(/^\/home\/stacks\/[a-z-]+\/\d\d\.webp$/)
    }
  })
})
