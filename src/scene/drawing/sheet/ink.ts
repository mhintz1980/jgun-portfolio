import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three'
import { INK } from '../drawingGeometry'

/**
 * INK — resolution-independent drafting linework for the intro sheet.
 *
 * Every line on the sheet is an instanced quad expanded in the vertex shader to a real pen
 * width in sheet metres, with an analytic 1-px anti-aliased edge. Lines thinner than a pixel
 * stay one pixel wide and fade by coverage instead of shimmering, so the same print reads
 * correctly from a 10 cm close-up of the title block to the whole sheet.
 *
 * Each segment carries (group, key, duration). `uReveal[group]` is the scroll-driven pen
 * position for that group: a segment inks itself from its start point to its end point while
 * the group's reveal sweeps from `key` to `key + duration`, which is what makes the sheet draw
 * itself as the camera passes. Scroll back and the ink retracts along the same path.
 */

/**
 * Pen half-widths in sheet metres. Real ISO pen sets are 0.7 / 0.5 / 0.35 / 0.25 / 0.18 mm; these
 * run ~1.3x heavier because the sheet is read on a screen, not at arm's length.
 */
export const PEN = {
  border: 0.00048,
  outline: 0.00034,
  edge: 0.00021,
  thin: 0.00014,
  fine: 0.0001,
} as const

export const DASH = { solid: 0, hidden: 1, center: 2, phantom: 3 } as const

/**
 * Reveal groups. Group 0 is the pre-printed sheet furniture (always fully drawn); every other
 * group is driven by the intro timeline.
 */
export const GROUP = {
  printed: 0,
  titleBlock: 1,
  notes: 2,
  top: 3,
  section: 4,
  hatch: 5,
  front: 6,
  rear: 7,
  bottom: 8,
  detailB: 9,
  detailC: 10,
  detailD: 11,
  side: 12,
  sideDims: 13,
  sideLabels: 14,
  gdt: 15,
} as const
export const GROUP_COUNT = 16

export interface InkText {
  text: string
  x: number
  y: number
  /** Cap height-ish font size in sheet metres. */
  size: number
  anchorX?: 'left' | 'center' | 'right'
  anchorY?: 'top' | 'middle' | 'bottom' | 'baseline'
  rotation?: number
  weight?: 'medium' | 'semibold'
  letterSpacing?: number
  group: number
  key: number
  dur?: number
  opacity?: number
  maxWidth?: number
  lineHeight?: number
}

export class InkBuilder {
  /** x1 y1 x2 y2 halfWidth group key dur dash */
  readonly segs: number[] = []
  /** Filled triangles: x y per vertex, plus group/key/dur per vertex. */
  readonly fills: number[] = []
  readonly texts: InkText[] = []

  line(x1: number, y1: number, x2: number, y2: number, pen: number, group: number, key = 0, dur = 0.08, dash = 0): this {
    this.segs.push(x1, y1, x2, y2, pen, group, key, dur, dash)
    return this
  }

  /** Polyline whose pen travels continuously: each piece gets its own slice of [key, key+dur]. */
  path(points: number[][], pen: number, group: number, key = 0, dur = 0.08, dash = 0): this {
    let total = 0
    for (let i = 1; i < points.length; i += 1) total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1])
    let walked = 0
    for (let i = 1; i < points.length; i += 1) {
      const len = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1])
      const k = key + (total > 0 ? (walked / total) * dur : 0)
      const d = total > 0 ? Math.max(1e-4, (len / total) * dur) : dur
      this.line(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1], pen, group, k, d, dash)
      walked += len
    }
    return this
  }

  rect(x: number, y: number, w: number, h: number, pen: number, group: number, key = 0, dur = 0.08): this {
    return this.path([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], pen, group, key, dur)
  }

  circle(cx: number, cy: number, r: number, pen: number, group: number, key = 0, dur = 0.08, dash = 0, start = 0, sweep = Math.PI * 2): this {
    const n = Math.max(24, Math.ceil((r * sweep) / 0.0015))
    const points: number[][] = []
    for (let i = 0; i <= n; i += 1) {
      const a = start + (sweep * i) / n
      points.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
    }
    return this.path(points, pen, group, key, dur, dash)
  }

  tri(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, group: number, key = 0, dur = 0.02): this {
    this.fills.push(ax, ay, group, key, dur, bx, by, group, key, dur, cx, cy, group, key, dur)
    return this
  }

  /** Drafting arrowhead: filled, 3:1, tip at (x, y) pointing along (dx, dy). */
  arrow(x: number, y: number, dx: number, dy: number, group: number, key = 0, size = 0.0032): this {
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len
    const uy = dy / len
    const bx = x - ux * size
    const by = y - uy * size
    const w = size / 3 / 2
    return this.tri(x, y, bx - uy * w, by + ux * w, bx + uy * w, by - ux * w, group, key, 0.02)
  }

  text(item: InkText): this {
    this.texts.push(item)
    return this
  }

  /** Append raw 4-float segments (model linework) with one pen, ordered by a sweep. */
  segments(
    data: Float32Array,
    pen: number,
    group: number,
    order: (x: number, y: number) => number,
    dur = 0.06,
    dash = 0,
  ): this {
    for (let i = 0; i < data.length; i += 4) {
      const k = order((data[i] + data[i + 2]) / 2, (data[i + 1] + data[i + 3]) / 2)
      this.line(data[i], data[i + 1], data[i + 2], data[i + 3], pen, group, k, dur, dash)
    }
    return this
  }
}

/** Shared shockwave displacement — the same function the paper uses, so ink rides the paper. */
export const WAVE_GLSL = /* glsl */ `
uniform float uWaveTime; uniform float uWaveEnabled; uniform vec2 uOrigin;
float waveFront(vec2 p) {
  float r = length(p - uOrigin);
  return exp(-pow((r - (0.04 + uWaveTime * 0.52)) / 0.05, 2.0)) * exp(-1.6 * r) * exp(-1.4 * uWaveTime);
}
float waveDisplacement(vec2 p) {
  float r = length(p - uOrigin);
  return uWaveEnabled * 0.016 * sin(150.0 * r - 34.0 * uWaveTime) * waveFront(p);
}`

export interface SheetUniforms {
  uReveal: { value: number[] }
  uViewport: { value: Vector2 }
  uInk: { value: Color }
  uOpacity: { value: number }
  uWaveTime: { value: number }
  uWaveEnabled: { value: number }
  uOrigin: { value: Vector2 }
  uLamp: { value: Vector3 }
  [key: string]: { value: unknown }
}

export function makeSheetUniforms(): SheetUniforms {
  return {
    uReveal: { value: new Array(GROUP_COUNT).fill(1) },
    uViewport: { value: new Vector2(1, 1) },
    uInk: { value: new Color(INK) },
    uOpacity: { value: 1 },
    uWaveTime: { value: 0 },
    uWaveEnabled: { value: 0 },
    uOrigin: { value: new Vector2() },
    uLamp: { value: new Vector3(0, 0, 0.4) },
  }
}

const lineVertex = /* glsl */ `
${WAVE_GLSL}
uniform float uReveal[${GROUP_COUNT}];
uniform vec2 uViewport;
attribute vec2 corner;
attribute vec4 aSeg;
attribute vec4 aStyle;
attribute float aDash;
varying float vAcross; varying float vAlongM; varying float vLen; varying float vDraw;
varying float vPx; varying float vHW; varying float vCov; varying float vDash; varying vec2 vPlane;
void main() {
  vec2 a = aSeg.xy; vec2 b = aSeg.zw;
  vec2 d = b - a; float len = length(d);
  vec2 t = len > 1e-9 ? d / len : vec2(1.0, 0.0);
  vec2 n = vec2(-t.y, t.x);
  vec4 cm = projectionMatrix * modelViewMatrix * vec4(mix(a, b, 0.5), 0.0, 1.0);
  float px = 0.5 * uViewport.y * abs(projectionMatrix[1][1]) / max(cm.w, 1e-6);
  float hw = aStyle.x;
  float minHW = 0.5 / px;
  float hwEff = max(hw, minHW);
  float ext = hwEff + 1.0 / px;
  vec2 p = mix(a - t * hwEff, b + t * hwEff, corner.x) + n * corner.y * ext;
  float r = uReveal[int(aStyle.y + 0.5)];
  vDraw = clamp((r - aStyle.z) / max(aStyle.w, 1e-4), 0.0, 1.0);
  vAlongM = corner.x * (len + 2.0 * hwEff) - hwEff;
  vLen = len; vAcross = corner.y * ext; vPx = px; vHW = hwEff; vCov = pow(min(1.0, hw / minHW), 0.6); vDash = aDash;
  vPlane = p;
  vec3 pos = vec3(p, 0.0003);
  pos.z += waveDisplacement(p);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`

const lineFragment = /* glsl */ `
uniform vec3 uInk; uniform float uOpacity;
varying float vAcross; varying float vAlongM; varying float vLen; varying float vDraw;
varying float vPx; varying float vHW; varying float vCov; varying float vDash; varying vec2 vPlane;
void main() {
  if (vDraw <= 0.0) discard;
  float head = vDraw * vLen;
  if (vAlongM > head + (vDraw >= 1.0 ? vHW : 0.0)) discard;
  float dpx = abs(vAcross) * vPx;
  float alpha = clamp(vHW * vPx + 0.5 - dpx, 0.0, 1.0) * vCov;
  if (vDash > 0.5) {
    float m = vAlongM;
    float on = 1.0;
    if (vDash < 1.5) { on = step(mod(m, 0.0045), 0.003); }
    else if (vDash < 2.5) { float q = mod(m, 0.0225); on = step(q, 0.015) + step(0.0175, q) * step(q, 0.0195); }
    else { float q = mod(m, 0.03); on = step(q, 0.018) + step(0.02, q) * step(q, 0.022) + step(0.025, q) * step(q, 0.027); }
    alpha *= on;
  }
  // Wet ink: the last millimetre behind the pen reads a touch heavier while it is moving.
  float wet = (vDraw < 1.0) ? smoothstep(0.002, 0.0, head - vAlongM) * 0.35 : 0.0;
  gl_FragColor = vec4(uInk * (1.0 - wet), alpha * uOpacity);
}`

export function makeInkLines(builder: InkBuilder, uniforms: SheetUniforms): Mesh {
  const count = builder.segs.length / 9
  const geometry = new InstancedBufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0], 3))
  geometry.setAttribute('corner', new Float32BufferAttribute([0, -1, 1, -1, 1, 1, 0, 1], 2))
  geometry.setIndex([0, 1, 2, 0, 2, 3])
  const seg = new Float32Array(count * 4)
  const style = new Float32Array(count * 4)
  const dash = new Float32Array(count)
  const s = builder.segs
  for (let i = 0; i < count; i += 1) {
    seg.set([s[i * 9], s[i * 9 + 1], s[i * 9 + 2], s[i * 9 + 3]], i * 4)
    style.set([s[i * 9 + 4], s[i * 9 + 5], s[i * 9 + 6], s[i * 9 + 7]], i * 4)
    dash[i] = s[i * 9 + 8]
  }
  geometry.setAttribute('aSeg', new InstancedBufferAttribute(seg, 4))
  geometry.setAttribute('aStyle', new InstancedBufferAttribute(style, 4))
  geometry.setAttribute('aDash', new InstancedBufferAttribute(dash, 1))
  geometry.instanceCount = count
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: lineVertex,
    fragmentShader: lineFragment,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    toneMapped: false,
  })
  const mesh = new Mesh(geometry, material)
  mesh.frustumCulled = false
  mesh.renderOrder = 2
  mesh.name = 'sheet-ink-lines'
  return mesh
}

const fillVertex = /* glsl */ `
${WAVE_GLSL}
uniform float uReveal[${GROUP_COUNT}];
attribute vec3 aStyle;
varying float vDraw;
void main() {
  float r = uReveal[int(aStyle.x + 0.5)];
  vDraw = clamp((r - aStyle.y) / max(aStyle.z, 1e-4), 0.0, 1.0);
  vec3 pos = vec3(position.xy, 0.00032);
  pos.z += waveDisplacement(position.xy);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`

const fillFragment = /* glsl */ `
uniform vec3 uInk; uniform float uOpacity;
varying float vDraw;
void main() {
  if (vDraw <= 0.0) discard;
  gl_FragColor = vec4(uInk, vDraw * uOpacity);
}`

export function makeInkFills(builder: InkBuilder, uniforms: SheetUniforms): Mesh {
  const f = builder.fills
  const count = f.length / 5
  const position = new Float32Array(count * 3)
  const style = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    position.set([f[i * 5], f[i * 5 + 1], 0], i * 3)
    style.set([f[i * 5 + 2], f[i * 5 + 3], f[i * 5 + 4]], i * 3)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
  geometry.setAttribute('aStyle', new Float32BufferAttribute(style, 3))
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: fillVertex,
    fragmentShader: fillFragment,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    toneMapped: false,
  })
  const mesh = new Mesh(geometry, material)
  mesh.frustumCulled = false
  mesh.renderOrder = 2
  mesh.name = 'sheet-ink-fills'
  return mesh
}
