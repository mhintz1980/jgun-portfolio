import { describe, expect, it } from 'vitest'
import { MeshPhysicalMaterial, RepeatWrapping } from 'three'
import { createDiamondKnurlNormalMap, roleMaterial } from './materials'

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
})
