import type { ShaderMaterial } from 'three'
import { PRIVATE_PIT_ANGULAR_CELLS, PRIVATE_PIT_STRATUM_M } from './PitGeometry'

const TAU = Math.PI * 2
const g = (v: number) => (Number.isInteger(v) ? v.toFixed(1) : String(v))
const CELLS = g(PRIVATE_PIT_ANGULAR_CELLS)
const STRATUM = g(PRIVATE_PIT_STRATUM_M)

const PRIVATE_PIT_COMMON_GLSL = /* glsl */ `
uniform float uPortalLight;
uniform float uPortalFissureEnergy;
uniform float uPortalFissureGrowth;
uniform float uPortalTime;
uniform float uPortalLite;
uniform float uPortalWall;
uniform float uPortalMouthZ;
uniform float uPortalRockExtinction;
uniform float uPortalHazeExtinction;
uniform float uPortalRelief;
uniform float uPortalRockAlive;
uniform float uPrivateSurroundings;
uniform vec2 uPortalCenter;
uniform vec3 uPortalFissure;
uniform vec3 uPortalRockDark;
uniform vec3 uPortalRockLight;
uniform vec3 uPortalHaze;
varying vec3 vPortal;
float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float hash31(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float vnoise(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash31(i), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
}
float fbm3(vec3 q) {
  float sum = vnoise(q);
  sum += 0.5 * vnoise(q * 2.03 + vec3(11.3, 5.1, 7.7));
  sum += 0.25 * vnoise(q * 4.07 + vec3(23.1, 17.9, 3.3));
  return sum / 1.75;
}
float fbm2(vec3 q) {
  return (vnoise(q) + 0.5 * vnoise(q * 2.03 + vec3(11.3, 5.1, 7.7))) / 1.5;
}
float triangle01(float x) {
  return abs(2.0 * fract(x) - 1.0);
}
float angularDistance(float a, float b) {
  return abs(fract(a - b + 0.5) - 0.5);
}
float privateRockField(float sector, float depth) {
  float stratum = floor(depth / ${STRATUM});
  float column = floor(sector * ${CELLS} + stratum * 0.37);
  float cell = hash21(vec2(column, stratum));
  float edge = triangle01(sector * ${CELLS});
  float band = triangle01(depth / ${STRATUM} + cell * 0.25);
  return clamp(0.22 + 0.36 * cell + 0.22 * edge + 0.20 * band, 0.0, 1.0);
}
`

const PRIVATE_PIT_WALL_FRAGMENT = /* glsl */ `
${PRIVATE_PIT_COMMON_GLSL}
varying vec3 vRockNormal;
void main() {
  float depth = max(0.0, uPortalMouthZ - vPortal.z);
  vec2 radial = vPortal.xy - uPortalCenter;
  float sector = fract(atan(radial.y, radial.x) / ${TAU} + 0.5);

  // Facet normal: derivative flatness gives cliff faces; the vertex normal rounds crest edges.
  vec3 n = normalize(cross(dFdx(vPortal), dFdy(vPortal)));
  if (dot(n, vRockNormal) < 0.0) n = -n;
  n = normalize(n + 0.28 * normalize(vRockNormal));

  // Metric sheet-space rock coordinates prevent polar stretching in the elongated left
  // gearbox bore while staggering strata beds and vertical shear joints across the shaft.
  float metricWall = (vPortal.x * 0.80 + vPortal.y * 0.60) * 54.0
    + (vPortal.y * 0.80 - vPortal.x * 0.60) * 38.0 + sector * 5.0;
  float stratumBed = floor(depth / 0.021);
  float warpBreak = fbm3(vPortal * 52.0 + vec3(3.1, 7.4, 1.9));
  vec2 q = vec2(metricWall + stratumBed * 0.67 + (warpBreak - 0.5) * 3.4,
    depth * 44.0 + (warpBreak - 0.5) * 2.8);
  q += vec2(vnoise(vPortal * 145.0), vnoise(vPortal * 113.0 + 7.0)) * 0.48;
  vec2 cellBase = floor(q), local = fract(q);
  float first = 100.0, second = 100.0, rockId = 0.0;
  vec2 nearest = vec2(0.0);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 cell = cellBase + vec2(float(x), float(y));
    vec2 seed = vec2(hash21(cell), hash21(cell + 29.7));
    vec2 delta = vec2(float(x), float(y)) + seed * 0.76 + 0.12 - local;
    float d = dot(delta, delta);
    if (d < first) { second = first; first = d; nearest = delta; rockId = hash21(cell + 71.3); }
    else second = min(second, d);
  }
  float joint = sqrt(second) - sqrt(first);
  float cragField = fbm3(vPortal * 115.0 + vec3(5.2, 1.7, 9.3));
  float chip = fbm3(vPortal * 420.0);
  float grain = fbm2(vPortal * 1700.0);
  // Break horizontal bedding with 3D crag warp so rock faces read as fractured blocks, not bands.
  float strataCrease = smoothstep(0.0, 0.22, triangle01(depth * 36.0 + (warpBreak - 0.5) * 1.45 + 0.35 * rockId));
  float height = smoothstep(0.0, 0.24, joint) * (0.45 + 0.55 * strataCrease) * (0.45 + 0.55 * rockId)
    + 0.38 * cragField + 0.20 * chip + 0.06 * grain;
  vec3 dpdx = dFdx(vPortal), dpdy = dFdy(vPortal);
  vec3 r1 = cross(dpdy, n), r2 = cross(n, dpdx);
  float det = dot(dpdx, r1);
  vec3 bump = (dFdx(height) * r1 + dFdy(height) * r2) / max(abs(det), 1e-10) * sign(det);
  n = normalize(n - bump * 0.00115);
  vec3 lamp = normalize(vec3(-0.28, 0.44, 0.85));
  float shelfCatch = max(0.0, n.z);
  float overhangShade = smoothstep(-0.35, 0.12, n.z);
  float blockTilt = clamp(dot(normalize(vec3(nearest, 0.35)), lamp) * 0.5 + 0.5, 0.0, 1.0);
  float facet = clamp(0.14 + 0.44 * rockId + 0.26 * blockTilt + 0.24 * shelfCatch + 0.32 * (cragField - 0.5), 0.0, 1.0);
  vec3 rock = mix(uPortalRockDark, uPortalRockLight, facet);
  rock = mix(rock, rock * vec3(1.19, 1.03, 0.83), step(0.92, rockId));
  float cavity = mix(0.08, 1.0, smoothstep(0.008, 0.18, joint))
    * mix(0.18, 1.0, strataCrease) * (0.26 + 0.74 * overhangShade);
  float occlusion = exp(-depth / 0.105) * cavity;
  float raking = 0.08 + 1.22 * max(0.0, dot(n, lamp)) + 0.62 * pow(shelfCatch, 1.3);
  vec3 c = rock * raking * occlusion;
  c *= 0.64 + 0.56 * chip + 0.14 * grain;
  // Paper bounce only on the shallowest rocks, retaining warm facets at the mouth.
  c += vec3(0.23, 0.15, 0.082) * exp(-depth / 0.022)
    * (0.22 + 0.78 * max(n.z, 0.0)) * uPortalLight;

  // Blue fissure bolts (R4): screen-pixel width stabilized via fwidth so every trunk,
  // fork and twig renders as a crisp ~2px bolt with a tight blue crevice halo and never
  // smears into wide bands on grazing or tangent walls.
  float glow = 0.0;
  for (int index = 0; index < 18; index++) {
    float id = float(index);
    float selected = hash21(vec2(id, 7.13));
    float enabled = step(0.14, selected);
    float path = fract((id + 0.35 * hash21(vec2(id, 19.7))) / 18.0);
    float jag1 = (triangle01(depth * (14.0 + 8.0 * hash21(vec2(id, 41.9))) + id * 0.37) - 0.5) * 0.014;
    float jag2 = (triangle01(depth * (42.0 + 17.0 * hash21(vec2(id, 23.4))) + id * 0.71) - 0.5) * 0.0055;
    float jag3 = (triangle01(depth * 105.0 + id * 1.13) - 0.5) * 0.0022;
    float wander = jag1 + jag2 + jag3;
    float signedTrunk = fract(sector - (path + wander) + 0.5) - 0.5;
    float trunkFW = clamp(fwidth(sector), 1.5e-4, 0.015);
    float pxTrunk = abs(signedTrunk) / trunkFW;
    float trunk = 1.0 - smoothstep(0.35, 1.05, pxTrunk);
    float halo = exp(-pxTrunk * pxTrunk / 5.5) * 0.12;

    // Branching forks placed inside the visible 0.006..0.14 m cliff wall depth range.
    float forkDepth = 0.007 + 0.048 * hash21(vec2(id, 53.6));
    float forkSide = mod(id, 2.0) * 2.0 - 1.0;
    float forkSlope = (0.12 + 0.14 * hash21(vec2(id, 67.4))) * forkSide;
    float forkSpan = max(0.0, depth - forkDepth);
    float forkJag = (triangle01(depth * 53.0 + id * 2.1) - 0.5) * 0.005;
    float forkPos = path + wander + forkSpan * forkSlope + forkJag;
    float signedFork = fract(sector - forkPos + 0.5) - 0.5;
    float pxFork = abs(signedFork) / trunkFW;
    float fork = 1.0 - smoothstep(0.30, 0.95, pxFork);
    float forkHalo = exp(-pxFork * pxFork / 4.5) * 0.09;
    float forkWindow = smoothstep(forkDepth, forkDepth + 0.006, depth)
      * (1.0 - smoothstep(forkDepth + 0.055, forkDepth + 0.095, depth));

    float twigDepth = forkDepth + 0.014 + 0.026 * hash21(vec2(id, 83.1));
    float twigSpan = max(0.0, depth - twigDepth);
    float twigPos = forkPos - forkSide * twigSpan * (0.16 + 0.12 * hash21(vec2(id, 97.7)))
      + (triangle01(depth * 89.0 + id) - 0.5) * 0.003;
    float signedTwig = fract(sector - twigPos + 0.5) - 0.5;
    float pxTwig = abs(signedTwig) / trunkFW;
    float twig = 1.0 - smoothstep(0.25, 0.85, pxTwig);
    float twigWindow = smoothstep(twigDepth, twigDepth + 0.004, depth)
      * (1.0 - smoothstep(twigDepth + 0.032, twigDepth + 0.058, depth));

    glow += enabled * (trunk * (0.82 + 0.18 * selected) + halo
      + (fork * 0.88 + forkHalo) * forkWindow + twig * 0.72 * twigWindow);
  }
  // Metric x-axis bolts for the horizontal left gearbox & clutch walls (x < 0.02),
  // measured against horizontal screen pixel derivative fwidth(gx) with tight ~1.8px core.
  float gearboxGate = 1.0 - smoothstep(-0.04, 0.01, vPortal.x);
  if (gearboxGate > 0.001) {
    float gx = vPortal.x * 26.0 + step(0.0, vPortal.y - uPortalCenter.y) * 0.41;
    float gId = floor(gx);
    float gActive = step(0.28, hash21(vec2(gId, 17.3)));
    float gJag = 0.5 + (triangle01(depth * 17.0 + gId * 0.43) - 0.5) * 0.14
      + (triangle01(depth * 53.0 + gId * 1.19) - 0.5) * 0.05;
    float gCurve = (gx - gId) - gJag;
    float gFW = clamp(fwidth(gx), 0.006, 0.05);
    float pxG = abs(gCurve) / gFW;
    float gCore = 1.0 - smoothstep(0.35, 1.05, pxG);
    float gHalo = exp(-pxG * pxG / 5.0) * 0.11;
    float gForkD = 0.010 + 0.042 * hash21(vec2(gId, 37.9));
    float gForkDir = mod(gId, 2.0) * 2.0 - 1.0;
    float gForkCurve = (gx - gId) - (gJag + gForkDir * max(0.0, depth - gForkD) * 2.1);
    float pxGFork = abs(gForkCurve) / gFW;
    float gFork = (1.0 - smoothstep(0.30, 0.90, pxGFork))
      * smoothstep(gForkD, gForkD + 0.005, depth)
      * (1.0 - smoothstep(gForkD + 0.048, gForkD + 0.078, depth));
    glow += gearboxGate * gActive * (gCore + gHalo + gFork * 0.85);
  }

  float descent = exp(-depth / 0.18);
  float shimmer = 1.0 + 0.08 * sin(uPortalTime * 0.9 + depth * 6.3) * (1.0 - uPortalLite);
  float grown = 1.0 - smoothstep(uPortalFissureGrowth * 0.9,
    uPortalFissureGrowth * 0.9 + 0.03, depth);
  c += uPortalFissure * clamp(glow * descent * shimmer * 2.35 * uPortalFissureEnergy * grown,
    0.0, 0.82);

  c *= mix(uPortalRockAlive, 1.0, clamp(uPortalLight, 0.0, 1.0));
  c += uPortalHaze * 0.18 * exp(-depth / 0.13);
  gl_FragColor = vec4(c, clamp(uPrivateSurroundings, 0.0, 1.0));
}
`

const PRIVATE_PIT_CLOSURE_FRAGMENT = /* glsl */ `
${PRIVATE_PIT_COMMON_GLSL}
void main() {
  float depth = max(0.0, uPortalMouthZ - vPortal.z);
  vec2 radial = vPortal.xy - uPortalCenter;
  float sector = fract(atan(radial.y, radial.x) / ${TAU} + 0.5);
  float field = privateRockField(sector, depth);
  vec3 c = mix(uPortalRockDark, uPortalRockLight, field * 0.34)
    * exp(-depth / uPortalRockExtinction);
  c *= mix(uPortalRockAlive, 1.0, clamp(uPortalLight, 0.0, 1.0));
  c += uPortalHaze * 0.18 * exp(-depth / 0.13);
  gl_FragColor = vec4(c, clamp(uPrivateSurroundings, 0.0, 1.0));
}
`

/**
 * Configure the private cavern palette without changing the shared portal vertex
 * shader, varyings, resource ownership, or surrounding-frame uniform binding.
 * Only the wall vertex shader (rocky portal path) provides vRockNormal, so only the
 * wall fragment may reference it; the closure fragment stays derivative-free.
 */
export function configurePrivatePitMaterial(shader: ShaderMaterial): void {
  const wall = Number(shader.uniforms.uPortalWall?.value ?? 0) > 0.5
  shader.fragmentShader = wall ? PRIVATE_PIT_WALL_FRAGMENT : PRIVATE_PIT_CLOSURE_FRAGMENT
  shader.uniforms.uPrivateSurroundings ??= { value: 1 }
  shader.uniforms.uPortalFissure?.value.set(0.579, 0.923, 1.12)
  shader.uniforms.uPortalRockDark?.value.set(0.018, 0.022, 0.030)
  shader.uniforms.uPortalRockLight?.value.set(0.135, 0.156, 0.184)
  if (shader.uniforms.uPortalRockExtinction) shader.uniforms.uPortalRockExtinction.value = 0.28
  shader.uniforms.uPortalHaze?.value.set(0.008, 0.014, 0.024)
  shader.needsUpdate = true
}
