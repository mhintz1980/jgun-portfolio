export interface PostProfile {
  exposure: number
  saturation: number
  vignette: number
}

const STOPS = Object.freeze([0, 0.32, 0.46, 0.65, 0.835, 0.94, 1])
const EXPOSURE = Object.freeze([1, 1, 1, 1.015, 1.025, 1.01, 1])
const SATURATION = Object.freeze([1, 1, 1, 1.04, 1.08, 1.03, 0.98])
const VIGNETTE = Object.freeze([0, 0, 0, 0.18, 0.22, 0.18, 0.14])
const PROFILE_FIELDS = Object.freeze(['exposure', 'saturation', 'vignette'] as const)

function smoothStep(value: number): number {
  return value * value * (3 - 2 * value)
}

function mix(a: number, b: number, amount: number): number {
  return a + (b - a) * amount
}

function requireProfile(out: PostProfile): void {
  if (!out) throw new TypeError('Post-profile output is required')
  for (const field of PROFILE_FIELDS) {
    if (!Number.isFinite(out[field])) throw new TypeError(`Post-profile ${field} must be finite`)
  }
}

export function createPostProfile(): PostProfile {
  return { exposure: EXPOSURE[0], saturation: SATURATION[0], vignette: VIGNETTE[0] }
}

export function samplePostProfile(progress: number, out: PostProfile): PostProfile {
  if (!Number.isFinite(progress)) throw new RangeError('Narrative progress must be finite')
  requireProfile(out)

  const canonicalProgress = Math.max(0, Math.min(1, progress))
  let stop = STOPS.length - 2
  while (stop > 0 && canonicalProgress < STOPS[stop]) stop -= 1
  const rawLocal = (canonicalProgress - STOPS[stop]) / (STOPS[stop + 1] - STOPS[stop])
  const localProgress = smoothStep(Math.max(0, Math.min(1, rawLocal)))

  out.exposure = mix(EXPOSURE[stop], EXPOSURE[stop + 1], localProgress)
  out.saturation = mix(SATURATION[stop], SATURATION[stop + 1], localProgress)
  out.vignette = mix(VIGNETTE[stop], VIGNETTE[stop + 1], localProgress)
  return out
}
