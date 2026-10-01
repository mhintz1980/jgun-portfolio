import { BufferGeometry, Float32BufferAttribute } from 'three'

/** A single baked strip on the measured profile; no geometry churn while scrolling. */
export function makeLightningRibbon(points: number[][]): BufferGeometry {
  const positions: number[] = [], arcs: number[] = [], sides: number[] = [], normals: number[] = []
  const distances = [0]
  for (let i = 1; i < points.length; i += 1) {
    distances.push(distances[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]))
  }
  const total = distances.at(-1) || 1
  const indices: number[] = []
  let previousPair = -1
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1], b = points[i]
    const length = distances[i] - distances[i - 1]
    if (length < 1e-9) continue
    const nx = -(b[1] - a[1]) / length, ny = (b[0] - a[0]) / length
    const steps = Math.max(1, Math.ceil(length / 0.0006))
    // Include both ends: neighbouring segments share their centre, but retain their own
    // normals. Degenerate joins are harmless and prevent gaps at sharp CAD corners.
    for (let j = 0; j <= steps; j += 1) {
      const u = j / steps, x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u
      const arc = (distances[i - 1] + length * u) / total
      const pair = positions.length / 3
      for (const side of [-1, 1]) {
        positions.push(x + nx * 0.0022 * side, y + ny * 0.0022 * side, 0.00045)
        arcs.push(arc); sides.push(side); normals.push(nx, ny)
      }
      if (previousPair >= 0) indices.push(previousPair, previousPair + 1, pair, previousPair + 1, pair + 1, pair)
      previousPair = pair
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('arcLength', new Float32BufferAttribute(arcs, 1))
  geometry.setAttribute('ribbonSide', new Float32BufferAttribute(sides, 1))
  geometry.setAttribute('ribbonNormal', new Float32BufferAttribute(normals, 2))
  geometry.setIndex(indices)
  return geometry
}

/** Shared displacement keeps the electrical contour attached to the vellum. */
export const LIGHTNING_VERTEX = /* glsl */ `
attribute float arcLength; attribute float ribbonSide; attribute vec2 ribbonNormal;
uniform float uPulseHead;
varying float vArc; varying float vAcross;
void main() {
  vArc = arcLength; vAcross = ribbonSide;
  vec3 p = position;
  // An irregular, bounded crack along the real contour, never a free-floating halo.
  float cell = floor(arcLength * 310.0);
  float next = fract(sin((cell + 1.0) * 127.1) * 43758.5453) - 0.5;
  float here = fract(sin(cell * 127.1) * 43758.5453) - 0.5;
  float jag = mix(here, next, fract(arcLength * 310.0));
  p.xy += ribbonNormal * jag * 0.00065;
  p.z += paperDisplacement(p.xy);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`

export const LIGHTNING_FRAGMENT = /* glsl */ `
uniform float uPulseHead; uniform float uPulse; uniform float uLampPower;
varying float vArc; varying float vAcross;
void main() {
  float d = vArc - uPulseHead;
  float head = exp(-pow(d / 0.022, 2.0));
  float trail = step(d, 0.0) * exp(d / 0.09);
  float charged = step(d, 0.0) * 0.20;
  // Two local ionised knots follow the head; no whole-screen flash or elapsed clock.
  float crack = 0.65 + 0.35 * pow(0.5 + 0.5 * sin(vArc * 1850.0 + uPulseHead * 145.0), 3.0);
  float spark = pow(0.5 + 0.5 * sin(uPulseHead * 96.0), 8.0);
  float energy = head * (1.0 + 0.45 * spark) + 0.65 * trail * crack + charged * crack;
  float across = abs(vAcross);
  float aa = max(fwidth(vAcross), 0.02);
  float core = 1.0 - smoothstep(0.14 - aa, 0.14 + aa, across);
  float glow = exp(-across * across * 5.5) * 0.40;
  float envelope = smoothstep(0.0, 0.035, uPulseHead) * (1.0 - smoothstep(0.94, 1.0, uPulseHead));
  float alpha = clamp(energy * (core + glow), 0.0, 1.0) * uPulse * envelope * (1.0 - uLampPower);
  gl_FragColor = vec4(mix(vec3(0.30, 0.48, 0.70), vec3(1.0), core), alpha);
}`
