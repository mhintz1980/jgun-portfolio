import { DataTexture, NearestFilter, RedFormat, RepeatWrapping, UnsignedByteType } from 'three'

/** Deterministic periodic Gaussian void ranking, generated once per owned texture.
 * Greedily fill the least dense location, then update its periodic density field.
 * The ranked pattern suppresses low-frequency clusters without a changing clock.
 */
export function createBlueNoiseTexture() {
  const size = 32, count = size * size
  const density = new Float64Array(count), kernel = new Float64Array(count)
  const occupied = new Uint8Array(count), bytes = new Uint8Array(count)
  let seed = 0x38a5f12d
  for (let i = 0; i < count; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    density[i] = seed / 0x100000000 * 1e-7
    const x = Math.min(i % size, size - i % size), y = Math.min(Math.floor(i / size), size - Math.floor(i / size))
    kernel[i] = Math.exp(-(x * x + y * y) / (2 * 1.5 * 1.5))
  }
  for (let rank = 0; rank < count; rank++) {
    let selected = -1, least = Infinity
    for (let i = 0; i < count; i++) if (!occupied[i] && density[i] < least) { selected = i; least = density[i] }
    occupied[selected] = 1; bytes[selected] = Math.floor(rank * 256 / count)
    const sx = selected % size, sy = Math.floor(selected / size)
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      density[y * size + x] += kernel[((y - sy + size) % size) * size + (x - sx + size) % size]
    }
  }
  const texture = new DataTexture(bytes, size, size, RedFormat, UnsignedByteType)
  texture.name = 'torque-private-static-blue-noise'
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.minFilter = texture.magFilter = NearestFilter
  texture.generateMipmaps = false; texture.needsUpdate = true
  return texture
}
