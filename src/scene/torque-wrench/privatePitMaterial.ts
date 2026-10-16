import type { ShaderMaterial } from 'three'

const TAU = Math.PI * 2

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
float triangle01(float x) {
  return abs(2.0 * fract(x) - 1.0);
}
float angularDistance(float a, float b) {
  return abs(fract(a - b + 0.5) - 0.5);
}
float privateRockField(float sector, float depth) {
  float stratum = floor(depth / 0.085);
  float column = floor(sector * 16.0 + stratum * 0.37);
  float cell = hash21(vec2(column, stratum));
  float edge = triangle01(sector * 16.0);
  float band = triangle01(depth / 0.085 + cell * 0.25);
  return clamp(0.20 + 0.38 * cell + 0.22 * edge + 0.20 * band, 0.0, 1.0);
}
`

const PRIVATE_PIT_WALL_FRAGMENT = /* glsl */ `
${PRIVATE_PIT_COMMON_GLSL}
varying vec3 vRockNormal;
void main() {
  float depth = max(0.0, uPortalMouthZ - vPortal.z);
  vec2 radial = vPortal.xy - uPortalCenter;
  float sector = fract(atan(radial.y, radial.x) / ${TAU} + 0.5);
  vec3 geometricNormal = normalize(cross(dFdx(vPortal), dFdy(vPortal)));
  if (dot(geometricNormal, vec3(normalize(radial + vec2(1e-7)), 0.0)) < 0.0) {
    geometricNormal = -geometricNormal;
  }
  vec3 lamp = normalize(vec3(-0.43, 0.55, 0.72));
  float incidence = 0.34 + 0.66 * abs(dot(geometricNormal, lamp));
  float faceShade = clamp(0.42 + 0.58 * incidence
    + 0.22 * dot(normalize(vRockNormal), lamp), 0.0, 1.0);
  float field = privateRockField(sector, depth);
  vec3 rock = mix(uPortalRockDark, uPortalRockLight, field * faceShade);
  vec3 c = rock * exp(-depth / uPortalRockExtinction);

  float lip = 1.0 - smoothstep(0.0, 0.045, depth);
  c += uPortalFissure * 0.045 * uPortalLight * lip * field;

  float branchGlow = 0.0;
  for (int index = 0; index < 12; index++) {
    float id = float(index);
    float selected = hash21(vec2(id, 7.13));
    float branchEnabled = step(0.63, selected);
    float path = 0.11 + 0.78 * hash21(vec2(id, 19.7));
    float wander = 0.040 * (hash21(vec2(id, 31.2)) - 0.5)
      * triangle01(depth * (3.0 + 5.0 * hash21(vec2(id, 41.9))));
    float trunkDistance = angularDistance(sector, path + wander);
    float trunkWidth = 0.0011 + 0.0008 * selected;
    float aa = max(fwidth(sector), 1e-5);
    float trunk = 1.0 - smoothstep(trunkWidth, trunkWidth + aa * 1.5, trunkDistance);

    float forkDepth = 0.14 + 0.44 * hash21(vec2(id, 53.6));
    float forkSide = mod(id, 2.0) * 2.0 - 1.0;
    float forkOffset = (0.028 + 0.035 * hash21(vec2(id, 67.4))) * forkSide;
    float branchDistance = angularDistance(sector, path + wander + forkOffset);
    float branchWidth = 0.00065 + 0.00045 * selected;
    float branch = (1.0 - smoothstep(branchWidth, branchWidth + aa, branchDistance))
      * smoothstep(forkDepth, forkDepth + 0.045, depth)
      * (1.0 - smoothstep(forkDepth + 0.30, forkDepth + 0.52, depth));
    branchGlow += branchEnabled * (trunk * (0.45 + 0.55 * selected) + branch * 0.72);
  }
  float descent = exp(-depth / 0.95);
  float shimmer = 1.0 + 0.07 * sin(uPortalTime * 0.9 + depth * 6.3) * (1.0 - uPortalLite);
  float grown = 1.0 - smoothstep(uPortalFissureGrowth * 0.9,
    uPortalFissureGrowth * 0.9 + 0.03, depth);
  c += uPortalFissure * clamp(branchGlow * descent * shimmer * uPortalFissureEnergy
    * grown, 0.0, 0.72);

  c *= mix(uPortalRockAlive, 1.0, clamp(uPortalLight, 0.0, 1.0));
  c += uPortalHaze * exp(-depth / uPortalHazeExtinction);
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
  c += uPortalHaze * exp(-depth / uPortalHazeExtinction);
  gl_FragColor = vec4(c, clamp(uPrivateSurroundings, 0.0, 1.0));
}
`

/**
 * Configure the private cavern palette without changing the shared portal vertex
 * shader, varyings, resource ownership, or surrounding-frame uniform binding.
 */
export function configurePrivatePitMaterial(shader: ShaderMaterial): void {
  const wall = Number(shader.uniforms.uPortalWall?.value ?? 0) > 0.5
  shader.fragmentShader = wall ? PRIVATE_PIT_WALL_FRAGMENT : PRIVATE_PIT_CLOSURE_FRAGMENT
  shader.uniforms.uPrivateSurroundings ??= { value: 1 }
  shader.uniforms.uPortalRockDark?.value.set(0.032, 0.043, 0.058)
  shader.uniforms.uPortalRockLight?.value.set(0.205, 0.252, 0.298)
  if (shader.uniforms.uPortalRockExtinction) shader.uniforms.uPortalRockExtinction.value = 0.48
  shader.uniforms.uPortalHaze?.value.set(0.014, 0.024, 0.042)
  shader.needsUpdate = true
}
