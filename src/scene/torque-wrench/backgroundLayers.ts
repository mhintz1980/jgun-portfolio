export interface BackgroundLayerDefinition {
  readonly id: string
  /** Camera-facing plane distance in world metres. Larger values are farther away. */
  readonly depth: number
  /** Canonical-progress movement rate in world metres per unit narrative progress. */
  readonly parallaxRate: number
}

export const BACKGROUND_LAYERS: readonly BackgroundLayerDefinition[] = Object.freeze([
  Object.freeze({ id: 'cavern-far', depth: 24, parallaxRate: 0.16 }),
  Object.freeze({ id: 'cavern-middle', depth: 18, parallaxRate: 0.28 }),
  Object.freeze({ id: 'atmosphere-near', depth: 12, parallaxRate: 0.42 }),
])

export interface BackgroundLayerSample {
  offset: [number, number]
  opacity: number
  scale: number
  /** Linear RGB. Renderer-side output encoding owns the final gamma conversion. */
  color: [number, number, number]
}

export interface BackgroundSample {
  layers: [BackgroundLayerSample, BackgroundLayerSample, BackgroundLayerSample]
  active: boolean
  pointerWeight: number
}

function srgbToLinear(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4
}

function linearColor(r: number, g: number, b: number): [number, number, number] {
  return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)]
}

const STOPS = Object.freeze([0, 0.32, 0.46, 0.69, 0.835, 0.94, 1])

// Author colors in display sRGB, then convert once to the renderer's linear working space.
// The ordered planes rise from dark graphite into a warm near atmosphere. Their peaks remain
// below the parent-owned pit highlight in linear luminance. Pixel visibility is a runtime gate.
const LAYER_OPACITY = Object.freeze([
  Object.freeze([0.92, 0.94, 1, 0.96, 0.94, 0.92, 0.90]),
  Object.freeze([0.52, 0.56, 0.62, 0.56, 0.52, 0.48, 0.45]),
  Object.freeze([0.28, 0.30, 0.34, 0.31, 0.28, 0.25, 0.22]),
])

const LAYER_SCALE = Object.freeze([
  Object.freeze([1, 1.02, 1.07, 1.05, 1.03, 1.02, 1.01]),
  Object.freeze([0.98, 1, 1.05, 1.04, 1.02, 1.01, 1]),
  Object.freeze([0.96, 0.99, 1.04, 1.02, 1, 0.99, 0.98]),
])

const LAYER_COLOR = Object.freeze([
  Object.freeze([
    linearColor(0.126, 0.124, 0.121),
    linearColor(0.132, 0.130, 0.127),
    linearColor(0.130, 0.128, 0.125),
    linearColor(0.126, 0.124, 0.121),
    linearColor(0.128, 0.126, 0.123),
    linearColor(0.125, 0.123, 0.120),
    linearColor(0.122, 0.120, 0.117),
  ]),
  Object.freeze([
    linearColor(0.228, 0.222, 0.214),
    linearColor(0.236, 0.230, 0.222),
    linearColor(0.232, 0.226, 0.218),
    linearColor(0.226, 0.220, 0.212),
    linearColor(0.228, 0.222, 0.214),
    linearColor(0.225, 0.219, 0.211),
    linearColor(0.222, 0.216, 0.208),
  ]),
  Object.freeze([
    linearColor(0.362, 0.348, 0.332),
    linearColor(0.372, 0.358, 0.340),
    linearColor(0.366, 0.352, 0.335),
    linearColor(0.358, 0.344, 0.328),
    linearColor(0.356, 0.342, 0.326),
    linearColor(0.352, 0.338, 0.322),
    linearColor(0.348, 0.334, 0.318),
  ]),
])

function smoothStep(value: number): number {
  return value * value * (3 - 2 * value)
}

function stopIndex(progress: number): number {
  let index = STOPS.length - 2
  while (index > 0 && progress < STOPS[index]) index -= 1
  return index
}

function mix(a: number, b: number, amount: number): number {
  return a + (b - a) * amount
}

function requireFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${field} must be finite`)
}

function requireLayer(layer: BackgroundLayerSample, index: number): void {
  if (!layer || layer.offset.length !== 2 || layer.color.length !== 3) {
    throw new TypeError(`Background output layer ${index} is malformed`)
  }
  for (let channel = 0; channel < 2; channel += 1) requireFinite(layer.offset[channel], 'Layer offset')
  requireFinite(layer.opacity, 'Layer opacity')
  requireFinite(layer.scale, 'Layer scale')
  for (let channel = 0; channel < 3; channel += 1) requireFinite(layer.color[channel], 'Layer color')
}

export function createBackgroundSample(): BackgroundSample {
  return {
    layers: [
      { offset: [0, 0], opacity: LAYER_OPACITY[0][0], scale: LAYER_SCALE[0][0], color: [...LAYER_COLOR[0][0]] },
      { offset: [0, 0], opacity: LAYER_OPACITY[1][0], scale: LAYER_SCALE[1][0], color: [...LAYER_COLOR[1][0]] },
      { offset: [0, 0], opacity: LAYER_OPACITY[2][0], scale: LAYER_SCALE[2][0], color: [...LAYER_COLOR[2][0]] },
    ],
    active: true,
    pointerWeight: 0,
  }
}

export function sampleBackground(progress: number, out: BackgroundSample): BackgroundSample {
  requireFinite(progress, 'Narrative progress')
  if (!out || !Array.isArray(out.layers) || out.layers.length !== 3) {
    throw new TypeError('Background output requires exactly three layers')
  }
  for (let index = 0; index < 3; index += 1) requireLayer(out.layers[index], index)

  const canonicalProgress = Math.max(0, Math.min(1, progress))
  const stop = stopIndex(canonicalProgress)
  const rawLocal = (canonicalProgress - STOPS[stop]) / (STOPS[stop + 1] - STOPS[stop])
  const localProgress = smoothStep(Math.max(0, Math.min(1, rawLocal)))

  for (let layerIndex = 0; layerIndex < 3; layerIndex += 1) {
    const layer = out.layers[layerIndex]
    const definition = BACKGROUND_LAYERS[layerIndex]
    layer.offset[0] = canonicalProgress * definition.parallaxRate
    layer.offset[1] = canonicalProgress * definition.parallaxRate * 0.35
    layer.opacity = mix(LAYER_OPACITY[layerIndex][stop], LAYER_OPACITY[layerIndex][stop + 1], localProgress)
    layer.scale = mix(LAYER_SCALE[layerIndex][stop], LAYER_SCALE[layerIndex][stop + 1], localProgress)
    for (let channel = 0; channel < 3; channel += 1) {
      layer.color[channel] = mix(
        LAYER_COLOR[layerIndex][stop][channel],
        LAYER_COLOR[layerIndex][stop + 1][channel],
        localProgress,
      )
    }
  }

  out.active = true
  out.pointerWeight = 0
  return out
}
