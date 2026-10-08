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
  Vector4,
} from 'three'
import { INK } from '../drawingGeometry'
import { PAPER_FLEX_GLSL, PAPER_FLEX_STEP } from './paperFlex'
import { PAPER_BARRIER_GLSL } from './breakthrough'

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

/** Red pen for the crossed-off failed alloys (the only coloured ink on the sheet). */
export const INK_RED = '#a3201c'

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
  /** JG-035 owner revisions: handwritten margin notes (input shaft beside Detail B, output spindle beside A-A). */
  noteInput: 16,
  noteOutput: 17,
  /** The clutch-shift (fork) detail, relocated from the old Detail B slot. */
  detailE: 18,
} as const
export const GROUP_COUNT = 19

/**
 * Per-stroke pen colour rides in the dash field (no stride change): `dash = style + 10 * colour`.
 * Colour 0 = the sheet's navy ink; 1 = red, used only for the crossed-off failed alloys.
 */
export const PEN_COLOR = { ink: 0, red: 1 } as const
export const withPenColor = (dash: number, color: number): number => dash + 10 * color

export interface TextCell { x: number; y: number; w: number; h: number }

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
  /** Authored fit target in sheet metres; retained for runtime Troika bounds proof. */
  fitCell?: TextCell
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

/** Compatibility export: legacy wave uniforms are inert; only physical pressure displaces. */
export const WAVE_GLSL = PAPER_FLEX_GLSL

export interface SheetUniforms {
  uReveal: { value: number[] }
  uViewport: { value: Vector2 }
  uInk: { value: Color }
  uInkRed: { value: Color }
  uOpacity: { value: number }
  uWaveTime: { value: number }
  uWaveEnabled: { value: number }
  uOrigin: { value: Vector2 }
  uLamp: { value: Vector3 }
  uFlexAmplitude: { value: number }
  [key: string]: { value: unknown }
}

export function makeSheetUniforms(): SheetUniforms {
  return {
    uReveal: { value: new Array(GROUP_COUNT).fill(1) },
    uViewport: { value: new Vector2(1, 1) },
    uInk: { value: new Color(INK) },
    uInkRed: { value: new Color(INK_RED) },
    uOpacity: { value: 1 },
    uFlexAmplitude: { value: 0 },
    uFlexField: { value: null },
    uFlexRect: { value: new Vector4(-0.4, -0.25, 0.8, 0.5) },
    uContact: { value: new Vector2() },
    uVellum: { value: 0 },
    uBarrierMask: { value: null },
    uFracture: { value: 0 },
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
attribute vec2 aRange;
attribute vec4 aStyle;
attribute float aDash;
varying float vAcross; varying float vAlongM; varying float vLen; varying float vDraw;
varying float vPx; varying float vHW; varying float vCov; varying float vDash; varying vec2 vPlane; varying float vPen;
void main() {
  float along = mix(aRange.x, aRange.y, corner.x);
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
  vec2 p = mix(a - t * hwEff, b + t * hwEff, along) + n * corner.y * ext;
  float r = uReveal[int(aStyle.y + 0.5)];
  vDraw = clamp((r - aStyle.z) / max(aStyle.w, 1e-4), 0.0, 1.0);
  vAlongM = along * (len + 2.0 * hwEff) - hwEff;
  vLen = len; vAcross = corner.y * ext; vPx = px; vHW = hwEff; vCov = pow(min(1.0, hw / minHW), 0.6); vPen = floor(aDash / 10.0 + 0.5); vDash = aDash - 10.0 * vPen;
  vPlane = p;
  vec3 pos = vec3(p, 0.0003);
  pos.z += paperDisplacement(p);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`

const lineFragment = /* glsl */ `
${PAPER_BARRIER_GLSL}
uniform vec3 uInk; uniform vec3 uInkRed; uniform float uOpacity;
varying float vAcross; varying float vAlongM; varying float vLen; varying float vDraw;
varying float vPx; varying float vHW; varying float vCov; varying float vDash; varying vec2 vPlane; varying float vPen;
void main() {
  cutPrintedStock(vPlane);
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
  // Failure strikes: red pen, lit by the same lamp as the navy ink (uInk carries the lamp factor).
  vec3 pen = vPen > 0.5 ? uInkRed : uInk;
  gl_FragColor = vec4(pen * (1.0 - wet), alpha * uOpacity);
}`

export function makeInkLines(builder: InkBuilder, uniforms: SheetUniforms): Mesh {
  // Split long strokes without resetting dash phase, reveal timing or end caps.
  const pieces: { source: number; lo: number; hi: number }[] = []
  for (let i = 0; i < builder.segs.length / 9; i += 1) {
    const s = builder.segs, j = i * 9
    const n = Math.max(1, Math.ceil(Math.hypot(s[j + 2] - s[j], s[j + 3] - s[j + 1]) / PAPER_FLEX_STEP))
    for (let k = 0; k < n; k += 1) pieces.push({ source: i, lo: k / n, hi: (k + 1) / n })
  }
  const count = pieces.length
  const geometry = new InstancedBufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0], 3))
  geometry.setAttribute('corner', new Float32BufferAttribute([0, -1, 1, -1, 1, 1, 0, 1], 2))
  geometry.setIndex([0, 1, 2, 0, 2, 3])
  const seg = new Float32Array(count * 4)
  const style = new Float32Array(count * 4)
  const dash = new Float32Array(count)
  const range = new Float32Array(count * 2)
  const s = builder.segs
  for (let i = 0; i < count; i += 1) {
    const j = pieces[i].source
    range.set([pieces[i].lo, pieces[i].hi], i * 2)
    seg.set([s[j * 9], s[j * 9 + 1], s[j * 9 + 2], s[j * 9 + 3]], i * 4)
    style.set([s[j * 9 + 4], s[j * 9 + 5], s[j * 9 + 6], s[j * 9 + 7]], i * 4)
    dash[i] = s[j * 9 + 8]
  }
  geometry.setAttribute('aSeg', new InstancedBufferAttribute(seg, 4))
  geometry.setAttribute('aStyle', new InstancedBufferAttribute(style, 4))
  geometry.setAttribute('aRange', new InstancedBufferAttribute(range, 2))
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
varying float vDraw; varying vec2 vPlane;
void main() {
  vPlane = position.xy;
  float r = uReveal[int(aStyle.x + 0.5)];
  vDraw = clamp((r - aStyle.y) / max(aStyle.z, 1e-4), 0.0, 1.0);
  vec3 pos = vec3(position.xy, 0.00032);
  pos.z += paperDisplacement(position.xy);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`

const fillFragment = /* glsl */ `
${PAPER_BARRIER_GLSL}
uniform vec3 uInk; uniform float uOpacity;
varying float vDraw; varying vec2 vPlane;
void main() {
  cutPrintedStock(vPlane);
  if (vDraw <= 0.0) discard;
  gl_FragColor = vec4(uInk, vDraw * uOpacity);
}`

export function makeInkFills(builder: InkBuilder, uniforms: SheetUniforms): Mesh {
  // Four-way midpoint subdivision preserves winding, area and the original reveal
  // style. Bound every edge (including diagonals), not just a triangle's X/Y span.
  const f: number[] = []
  const split = (a: number[], b: number[], c: number[]) => {
    const edge = (u: number[], v: number[]) => Math.hypot(u[0] - v[0], u[1] - v[1])
    if (Math.max(edge(a, b), edge(b, c), edge(c, a)) <= PAPER_FLEX_STEP) {
      f.push(...a, ...b, ...c)
      return
    }
    const midpoint = (u: number[], v: number[]) => u.map((value, i) => (value + v[i]) / 2)
    const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a)
    split(a, ab, ca); split(ab, b, bc); split(ca, bc, c); split(ab, bc, ca)
  }
  for (let i = 0; i < builder.fills.length; i += 15) {
    split(builder.fills.slice(i, i + 5), builder.fills.slice(i + 5, i + 10), builder.fills.slice(i + 10, i + 15))
  }
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
