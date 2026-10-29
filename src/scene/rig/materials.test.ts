import { describe, expect, it } from 'vitest'
import { MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping } from 'three'
import { createDiamondKnurlNormalMap, materialRoleFor, roleMaterial, RING_SWITCH_OD_RADIUS, RING_SWITCH_OD_MASK_START, RING_SWITCH_OD_MASK_FULL } from './materials'

describe('P003068 heavy knurled black anodize', () => {
  it('matches the handle finish while retaining the OD normal map', () => {
    const ring = roleMaterial('ringSwitch') as MeshPhysicalMaterial
    const handle = roleMaterial('anodizedAluminum') as MeshPhysicalMaterial
    expect(ring.color.equals(handle.color)).toBe(true)
    for (const key of ['roughness', 'metalness', 'envMapIntensity'] as const) expect(ring[key]).toBe(handle[key])
    expect(ring.clearcoat).toBe(handle.clearcoat ?? 0)
    expect(ring.normalMap).toBeTruthy()
    expect(ring.normalScale.x).toBe(1.25)
  })
  it('encodes valid unit normals with heavy seamless cylindrical pitch', () => {
    const map = createDiamondKnurlNormalMap()
    expect(map.repeat.toArray()).toEqual([96, 9])
    expect(map.wrapS).toBe(RepeatWrapping)
    expect(map.wrapT).toBe(RepeatWrapping)
    const pixels = map.image.data as Uint8Array
    let worst = 0, slopes = 0
    for (let i = 0; i < pixels.length; i += 4) {
      const x = pixels[i] / 255 * 2 - 1, y = pixels[i + 1] / 255 * 2 - 1, z = pixels[i + 2] / 255 * 2 - 1
      worst = Math.max(worst, Math.abs(Math.hypot(x, y, z) - 1))
      if (Math.hypot(x, y) > 0.2) slopes++
    }
    expect(worst).toBeLessThan(0.012)
    expect(slopes).toBeGreaterThan(pixels.length / 16)
    map.dispose()
  })
  it('preserves the measured 37.722 mm OD while keeping bore and axial faces smooth', () => {
    const ring = roleMaterial('ringSwitch') as MeshPhysicalMaterial
    const shader = {
      uniforms: {} as Record<string, unknown>,
      vertexShader: '#include <beginnormal_vertex>',
      fragmentShader: '#include <normal_fragment_maps>',
    }
    ring.onBeforeCompile(shader as never, {} as never)
    expect(shader.vertexShader).toContain('vRingSwitchObjectPos = position;')
    expect(shader.fragmentShader).toContain('dot(ringSwitchRadialPos, ringSwitchRadialNormal)')
    const radii = shader.fragmentShader.match(/smoothstep\(([\d.]+), ([\d.]+), length\(ringSwitchRadialPos\)\)/)!
    expect(radii).toBeTruthy()
    expect(Number(radii[1])).toBeCloseTo(RING_SWITCH_OD_MASK_START, 10)
    expect(Number(radii[2])).toBeCloseTo(RING_SWITCH_OD_MASK_FULL, 10)
    const mask = (radius: number, outward: number, axial: number) => {
      const u = Math.max(0, Math.min(1, (radius - Number(radii[1])) / (Number(radii[2]) - Number(radii[1]))))
      return u * u * (3 - 2 * u) * Number(outward >= .5) * Number(Math.abs(axial) < .20)
    }
    expect(mask(RING_SWITCH_OD_RADIUS, 1, 0)).toBe(1)
    expect(mask(.03175, -1, 0)).toBe(0)
    expect(mask(RING_SWITCH_OD_RADIUS, -1, 0)).toBe(0)
    expect(mask(RING_SWITCH_OD_RADIUS, 0, 1)).toBe(0)
    expect(mask(RING_SWITCH_OD_RADIUS, 1, .2)).toBe(0)
    expect(shader.fragmentShader).toContain('ringSwitchOutward * ringSwitchOuterRadius * ringSwitchSide')
    expect(shader.fragmentShader).toContain('max(length(ringSwitchRadialPos) * length(ringSwitchRadialNormal), 1e-8)')
    expect(shader.fragmentShader).toContain('1.0 - step(0.20, abs(normalize(vRingSwitchObjectNormal).z))')
  })
})

describe('smooth black-oxide housings (P000245 gearbox, P000420 clutch)', () => {
  const compileShader = () => ({
    uniforms: {} as Record<string, unknown>,
    vertexShader: '#include <begin_vertex>',
    fragmentShader: '#include <roughnessmap_fragment>',
  })

  it('routes both housings to blackOxideSteel without the lathe band injection', () => {
    // Part-number override and unit-default paths both land on the role.
    expect(materialRoleFor('housing', 'occurrence_of_P000245-1')).toBe('blackOxideSteel')
    expect(materialRoleFor('housing', 'GEARBOX_ASSY_SHELL')).toBe('blackOxideSteel')
    expect(materialRoleFor('clutch-static', 'occurrence_of_P000420-1')).toBe('blackOxideSteel')
    const housing = roleMaterial('blackOxideSteel') as MeshStandardMaterial
    const shader = compileShader()
    housing.onBeforeCompile(shader as never, {} as never)
    expect(shader.vertexShader).not.toContain('vMachinedZ')
    expect(shader.fragmentShader).not.toContain('vMachinedZ')
    expect(shader.fragmentShader).not.toContain('vec2( 2800.0, 7900.0 )')
    expect(housing.customProgramCacheKey()).not.toContain('lathe-v1')
  })

  it('retains the lathe detail on exposed bright machined steels', () => {
    for (const role of ['toolSteel', 'cageSteel', 'planetSteel', 'clutchSteel', 'rotorSteel', 'stainlessSteel'] as const) {
      const turned = roleMaterial(role) as MeshStandardMaterial
      const shader = compileShader()
      turned.onBeforeCompile(shader as never, {} as never)
      expect(shader.vertexShader).toContain('vMachinedZ = position.z;')
      expect(shader.fragmentShader).toContain('vMachinedZ * vec2( 2800.0, 7900.0 )')
      expect(turned.customProgramCacheKey()).toContain('lathe-v1')
    }
  })

  it('keeps the shader cache identity through ghost/fade clones', () => {
    const housing = roleMaterial('blackOxideSteel') as MeshStandardMaterial
    const ghost = housing.clone()
    expect(ghost.customProgramCacheKey).toBe(housing.customProgramCacheKey)
    expect(ghost.customProgramCacheKey()).toBe(housing.customProgramCacheKey())
    const shader = compileShader()
    ghost.onBeforeCompile(shader as never, {} as never)
    expect(shader.fragmentShader).not.toContain('vMachinedZ')
    expect(ghost.clone().customProgramCacheKey()).toBe(housing.customProgramCacheKey())
  })

  it('leaves the painted indicator grooves on their own finishes', () => {
    for (const role of ['grooveRed', 'grooveBlue'] as const) {
      const painted = roleMaterial(role) as MeshStandardMaterial
      const shader = compileShader()
      painted.onBeforeCompile(shader as never, {} as never)
      expect(shader.fragmentShader).not.toContain('vMachinedZ')
      expect(painted.customProgramCacheKey()).not.toContain('lathe-v1')
    }
  })
})
