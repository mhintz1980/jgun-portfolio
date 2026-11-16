import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs helper without type declarations
import { footprintViolations } from '../../../scripts/lib/metrology-footprint-audit.mjs'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')
const runtime = read('./privateSheetRuntime.ts')
const linework = read('../drawing/DrawingLinework.tsx')

describe('granite-only surface plate port', () => {
  it.each([['privateSheetRuntime', runtime], ['DrawingLinework', linework]])('%s carries the granite desk fragment and 9.6 x 7.6 plane', (_name, src) => {
    expect(src).toContain('sdGranite')
    expect(src).toContain('vec2(0.68, 0.45)')
    expect(src).toContain('uReadingPool')
    expect(src).toContain('uLamp')
    expect(src).toMatch(/9\.6,\s*7\.6|width: 9\.6, height: 7\.6/)
    expect(src).not.toMatch(/PlaneGeometry\(3\.4,\s*2\.4/)
  })
  it.each([['privateSheetRuntime', runtime], ['DrawingLinework', linework]])('%s has no portalLightning mixing', (_name, src) => {
    expect(src).not.toMatch(/portalLightning|jumpingArc|modelContactPoints|lightningSnapshot/)
  })
})

const rect = (x: number, y: number, hx: number, hy: number) => [[x - hx, y - hy], [x + hx, y - hy], [x + hx, y + hy], [x - hx, y + hy]]
describe('verify-metrology-workbench footprintViolations', () => {
  const box = (id: string, x: number, y: number, hx = 0.01, hy = 0.01, minZ = 0) => ({ id, footprint: rect(x, y, hx, hy), localBounds: { min: [-hx, -hy, minZ], max: [hx, hy, 0.02] } })
  it('accepts tools resting on the granite outside the drawing keep-out', () => {
    expect(footprintViolations([box('a', 0.5, 0), box('b', 0.5, 0.05), box('c', 0, -0.3)])).toEqual([])
  })
  it('allows an edge that only touches the keep-out boundary', () => {
    expect(footprintViolations([box('edge', 0, -0.264)])).toEqual([])
  })
  it('flags keep-out penetration by a corner of a rotated footprint', () => {
    const diamond = { id: 'rot', footprint: [[0, -0.24], [0.02, -0.27], [0, -0.3], [-0.02, -0.27]], localBounds: null }
    expect(footprintViolations([diamond])).toEqual(['rot:drawing'])
  })
  it('flags off-plate, neighbour overlap and below-table asset', () => {
    expect(footprintViolations([box('off', 0.69, 0.3)])).toEqual(['off:plate'])
    expect(footprintViolations([box('a', 0.5, 0), box('b', 0.505, 0.005)])).toEqual(['b:a'])
    expect(footprintViolations([box('sunk', 0.5, 0, 0.01, 0.01, -0.002)])).toEqual(['sunk:z'])
  })
  it('flags a missing footprint', () => {
    expect(footprintViolations([{ id: 'x', footprint: [], localBounds: null }])).toEqual(['x:footprint-missing'])
  })
})
