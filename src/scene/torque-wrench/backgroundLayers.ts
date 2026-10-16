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
  Object.freeze([0.9, 0.92, 1, 0.96, 0.92, 0.9, 0.88]),
  Object.freeze([0.56, 0.6, 0.68, 0.6, 0.54, 0.48, 0.44]),
  Object.freeze([0.42, 0.45, 0.52, 0.45, 0.39, 0.33, 0.28]),
])

const LAYER_SCALE = Object.freeze([
  Object.freeze([1, 1.02, 1.07, 1.05, 1.03, 1.02, 1.01]),
  Object.freeze([0.98, 1, 1.05, 1.04, 1.02, 1.01, 1]),
  Object.freeze([0.96, 0.99, 1.04, 1.02, 1, 0.99, 0.98]),
])

const LAYER_COLOR = Object.freeze([
  Object.freeze([
    linearColor(0.09, 0.10, 0.13),
    linearColor(0.095, 0.11, 0.14),
    linearColor(0.09, 0.10, 0.13),
    linearColor(0.085, 0.095, 0.12),
    linearColor(0.09, 0.10, 0.13),
    linearColor(0.085, 0.095, 0.12),
    linearColor(0.08, 0.09, 0.115),
  ]),
  Object.freeze([
    linearColor(0.22, 0.21, 0.20),
    linearColor(0.23, 0.22, 0.21),
    linearColor(0.22, 0.21, 0.20),
    linearColor(0.21, 0.20, 0.19),
    linearColor(0.22, 0.21, 0.20),
    linearColor(0.22, 0.21, 0.20),
    linearColor(0.225, 0.215, 0.205),
  ]),
  Object.freeze([
    linearColor(0.45, 0.42, 0.38),
    linearColor(0.46, 0.43, 0.39),
    linearColor(0.45, 0.42, 0.38),
    linearColor(0.44, 0.415, 0.375),
    linearColor(0.43, 0.405, 0.37),
    linearColor(0.425, 0.40, 0.365),
    linearColor(0.42, 0.395, 0.36),
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
