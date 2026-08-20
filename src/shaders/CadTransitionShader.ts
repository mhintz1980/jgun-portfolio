import { Color, DoubleSide, ShaderMaterial } from 'three'

/**
 * Module 3 — CAD-to-Code dissolve shader.
 *
 * A world-space planar sweep travels along the model's long (Z) axis. Ahead of
 * the sweep the mesh shades as physical metal (half-lambert + fresnel); behind
 * it the surface dissolves into an emissive digital wireframe/point cloud with
 * dynamic noise. The sweep edge itself is an emissive laser/scanline.
 *
 * Uniforms:
 *  - uProgress  0..1, driven by scroll (chapter 4 progress)
 *  - uScanColor cyan/blue neon edge + digital tint
 *  - uEdgeWidth width of the scanline edge in sweep space
 *  - uNoiseFreq spatial frequency of the dissolve noise
 *  - uTime      seconds, advanced from the frame loop
 *  - uSweepMin / uSweepMax  world-space Z bounds of the model (sweep range)
 */

export interface CadTransitionOptions {
  scanColor?: string
  baseColor?: string
  edgeWidth?: number
  noiseFreq?: number
  sweepMin?: number
  sweepMax?: number
}

export const CAD_TRANSITION_VERTEX = /* glsl */ `
uniform float uProgress;
uniform float uEdgeWidth;
uniform float uNoiseFreq;
uniform float uTime;
uniform float uSweepMin;
uniform float uSweepMax;

varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;

float hash3(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldNormal = normalize(mat3(modelMatrix) * normal);

  // World-space planar sweep coordinate along the model's long axis.
  float sweep = clamp((worldPos.z - uSweepMin) / (uSweepMax - uSweepMin), 0.0, 1.0);
  float edge = 1.0 - smoothstep(0.0, max(uEdgeWidth, 1e-4), abs(sweep - uProgress));

  // Vertices near the scan edge jitter along their normals — the surface
  // "boils" as the laser passes through it.
  float n = hash3(floor(position * uNoiseFreq * 40.0) + floor(uTime * 3.0));
  vec3 displaced = position + normal * edge * n * 0.004;

  vec4 displacedWorld = modelMatrix * vec4(displaced, 1.0);
  vWorldPos = displacedWorld.xyz;
  vViewDir = normalize(cameraPosition - displacedWorld.xyz);

  gl_Position = projectionMatrix * viewMatrix * displacedWorld;
}
`

export const CAD_TRANSITION_FRAGMENT = /* glsl */ `
precision highp float;

uniform float uProgress;
uniform float uEdgeWidth;
uniform float uNoiseFreq;
uniform float uTime;
uniform float uSweepMin;
uniform float uSweepMax;
uniform vec3 uScanColor;
uniform vec3 uBaseColor;

varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;

float hash3(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

void main() {
  float sweep = clamp((vWorldPos.z - uSweepMin) / (uSweepMax - uSweepMin), 0.0, 1.0);
  // d > 0: still physical. d < 0: already scanned / digital.
  float d = sweep - uProgress;

  // -- Physical side: stylized metal (half-lambert + fresnel rim) ----------
  vec3 N = normalize(vWorldNormal);
  vec3 L = normalize(vec3(0.5, 0.8, 0.4));
  float diffuse = clamp(dot(N, L) * 0.5 + 0.5, 0.0, 1.0);
  float fresnel = pow(1.0 - abs(dot(N, normalize(vViewDir))), 2.0);
  vec3 metal = uBaseColor * (0.22 + 0.78 * diffuse) + vec3(fresnel * 0.22);

  // -- Digital side: emissive grid wireframe + point-cloud dither ----------
  vec3 g = abs(fract(vWorldPos * 90.0) - 0.5);
  float grid = 1.0 - smoothstep(0.0, 0.09, min(min(g.x, g.y), g.z));
  float cloud = step(0.78, hash3(floor(vWorldPos * uNoiseFreq * 60.0) + vec3(floor(uTime * 8.0))));
  float pulse = 0.6 + 0.4 * sin(uTime * 3.0 + vWorldPos.z * 40.0);
  vec3 digital = uScanColor * (grid * 0.9 + cloud * 1.5) * pulse;

  float digitalMix = smoothstep(0.0, max(uEdgeWidth, 1e-4) * 2.0, -d);

  // Deep inside the digital zone, drop sparse fragments so the surface reads
  // as a point cloud rather than a solid shell.
  if (digitalMix > 0.5 && grid < 0.15 && cloud < 0.5) discard;

  // Emissive laser scanline at the sweep edge.
  float edge = 1.0 - smoothstep(0.0, max(uEdgeWidth, 1e-4), abs(d));
  vec3 color = mix(metal, digital, digitalMix) + uScanColor * edge * 2.5;

  gl_FragColor = vec4(color, 1.0);
}
`

export function createCadTransitionMaterial(options: CadTransitionOptions = {}): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: CAD_TRANSITION_VERTEX,
    fragmentShader: CAD_TRANSITION_FRAGMENT,
    uniforms: {
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uScanColor: { value: new Color(options.scanColor ?? '#38e8ff') },
      uBaseColor: { value: new Color(options.baseColor ?? '#8a93a3') },
      uEdgeWidth: { value: options.edgeWidth ?? 0.06 },
      uNoiseFreq: { value: options.noiseFreq ?? 24 },
      uSweepMin: { value: options.sweepMin ?? -0.25 },
      uSweepMax: { value: options.sweepMax ?? 0.05 },
    },
    side: DoubleSide,
  })
}
