import { expect, it } from 'vitest'
import { Vector2 } from 'three'
import { makePortal } from '../drawing/sheet/portal'
import { configurePrivatePitMaterial } from './privatePitMaterial'
import { PRIVATE_PIT_ANGULAR_CELLS, PRIVATE_PIT_STRATUM_M } from './PitGeometry'
import type { ShaderMaterial } from 'three'

const outline = Array.from({ length: 32 }, (_, i) => {
  const a = i / 32 * Math.PI * 2
  const r = .13 + .01 * Math.sin(a * 5)
  return [Math.cos(a) * r, Math.sin(a) * r]
})

const g = (v: number) => (Number.isInteger(v) ? v.toFixed(1) : String(v))
const declaredUniforms = (source: string) =>
  Array.from(source.matchAll(/uniform\s+\w+\s+(\w+);/g), m => m[1])

const build = () => makePortal(outline, -1, new Vector2(0, 0), { value: 0 }, undefined,
  { fissureEnergy: { value: 0 }, fissureGrowth: { value: 0 }, rocky: true })

it('selects wall vs closure fragments and wires every declared uniform', () => {
  const portal = build()
  const wall = portal.walls.material as ShaderMaterial
  const cap = portal.cap.material as ShaderMaterial
  configurePrivatePitMaterial(wall)
  configurePrivatePitMaterial(cap)

  // Only the rocky wall vertex shader provides vRockNormal; only it may reference it.
  expect(wall.vertexShader).toContain('varying vec3 vRockNormal')
  expect(wall.fragmentShader).toContain('vRockNormal')
  expect(cap.vertexShader).not.toContain('vRockNormal')
  expect(cap.fragmentShader).not.toContain('vRockNormal')
  // The flat closure stays derivative-free; the faceted wall uses screen-space derivatives.
  expect(wall.fragmentShader).toContain('dFdx(')
  expect(cap.fragmentShader).not.toContain('dFdx(')

  // Every uniform the fragments declare must exist on the material after configuration,
  // so the GLSL can never compile against a missing makePortal binding.
  for (const shader of [wall, cap]) {
    for (const name of declaredUniforms(shader.fragmentShader)) {
      expect(shader.uniforms, name).toHaveProperty(name)
    }
  }
  // The runtime drives these each frame; they must be shared bindings, not clones.
  for (const name of ['uPortalRockAlive', 'uPortalFissureEnergy', 'uPortalFissureGrowth']) {
    expect(wall.uniforms[name]).toBe(cap.uniforms[name])
  }
  expect(wall.uniforms.uPrivateSurroundings.value).toBe(1)
  expect(cap.uniforms.uPrivateSurroundings.value).toBe(1)
  // Fragment sources were replaced wholesale (the shared portal FRAGMENT has no
  // privateRockField); three's Material.needsUpdate has no getter, so version is implicit.
  expect(wall.fragmentShader).toContain('privateRockField')
  expect(cap.fragmentShader).toContain('privateRockField')
  portal.dispose()
})

it('matches the material fracture field to the geometry displacement cells', () => {
  const portal = build()
  const wall = portal.walls.material as ShaderMaterial
  configurePrivatePitMaterial(wall)
  expect(wall.fragmentShader).toContain('sector * ' + g(PRIVATE_PIT_ANGULAR_CELLS))
  expect(wall.fragmentShader).toContain('depth / ' + g(PRIVATE_PIT_STRATUM_M))
  portal.dispose()
})

it('keeps fissure emission blue-gated and the palette cool basalt with warm lip bounce', () => {
  const portal = build()
  const wall = portal.walls.material as ShaderMaterial
  const cap = portal.cap.material as ShaderMaterial
  configurePrivatePitMaterial(wall)
  configurePrivatePitMaterial(cap)

  // Emission is added exactly once, as uPortalFissure scaled and clamped below its ceiling,
  // so no term can whiten a vein core: #79CFFF components keep their ratios.
  const emissiveAdds = wall.fragmentShader.match(/c \+= uPortalFissure \* clamp\(/g) ?? []
  expect(emissiveAdds).toHaveLength(1)
  expect(wall.fragmentShader).toMatch(/clamp\(glow[\s\S]*?0\.0, 0\.82\)/)
  // Growth and energy gates stay wired to the shared electrical uniforms.
  expect(wall.fragmentShader).toContain('uPortalFissureEnergy * grown')
  expect(wall.fragmentShader).toContain('uPortalFissureGrowth * 0.9')

  const dark = wall.uniforms.uPortalRockDark.value
  const light = wall.uniforms.uPortalRockLight.value
  expect(dark.x).toBeCloseTo(0.018); expect(dark.y).toBeCloseTo(0.022)
  expect(dark.z).toBeCloseTo(0.030)
  expect(light.x).toBeCloseTo(0.135); expect(light.y).toBeCloseTo(0.156)
  expect(light.z).toBeCloseTo(0.184)
  // Cool basalt: blue channel dominates both endpoints; warm bounce is a separate lip term.
  expect(dark.z).toBeGreaterThan(dark.x)
  expect(light.z).toBeGreaterThan(light.x)
  expect(wall.fragmentShader).toMatch(/vec3\(0\.23, 0\.15, 0\.082\)[\s\S]*?uPortalLight/)
  expect(wall.uniforms.uPortalRockExtinction.value).toBeCloseTo(0.28)
  expect(wall.uniforms.uPortalHaze.value.z).toBeCloseTo(0.024)
  portal.dispose()
})

it('writes the surroundings-driven alpha on both surfaces', () => {
  const portal = build()
  const wall = portal.walls.material as ShaderMaterial
  const cap = portal.cap.material as ShaderMaterial
  configurePrivatePitMaterial(wall)
  configurePrivatePitMaterial(cap)
  for (const shader of [wall, cap]) {
    expect(shader.fragmentShader).toContain('clamp(uPrivateSurroundings, 0.0, 1.0)')
  }
  portal.dispose()
})
