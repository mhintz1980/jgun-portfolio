import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Color, Float32BufferAttribute, PerspectiveCamera, ShaderMaterial, Vector3, Vector4 } from 'three'
import { SHOTS, clamp01, smooth } from './shot'
import type { PreviewControl } from './QuietMachineScene'

/** S4 layered background, full tier only. One fullscreen triangle behind everything: a
 *  gamma-correct base gradient plus two atmospheric depth layers composed in the one
 *  shader (1 draw call, 1 triangle, 1 material, no texture). The page behind the canvas and
 *  the floor's fogged far edge are both `BASE`, so the glow fades to exactly `BASE` at the
 *  canvas edges and at the floor's horizon: no box, no seam. Everything is a pure function of
 *  `u` and the evaluated camera; there is no time term and the dither is static, so a
 *  stationary `u` is a frozen frame. */
export const BASE = '#101b24'

interface Look { a: string; b: string; lift: number }
/** One look per beat, sampled at the beat centres and blended with smoothstep between
 *  them: no snaps at beat edges, and it follows the beat records if they re-space. */
const LOOKS: Look[] = [
  { a: '#2d5568', b: '#3a6a80', lift: .55 }, // the object
  { a: '#2d5a70', b: '#40758c', lift: .6 },  // the incision
  { a: '#2a5f84', b: '#3f7fa8', lift: .65 }, // the main intake
  { a: '#2b6b78', b: '#44909a', lift: .65 }, // a second breath
  { a: '#34637f', b: '#4c88a4', lift: .6 },  // two feeds, one exit
  { a: '#4d5560', b: '#7a6a58', lift: .55 }, // control the noise
  { a: '#2d5568', b: '#3a6a80', lift: .5 },  // resolve
]
const LINEAR = LOOKS.map(l => ({ a: new Color(l.a), b: new Color(l.b), lift: l.lift }))

/** Blend of the looks at `u`. Writes into `out`; allocation-free. */
export function lookAt(u: number, out: { a: Color; b: Color; lift: number }) {
  const x = clamp01(u), n = SHOTS.length
  const at = (i: number) => (SHOTS[i].from + SHOTS[i].to) / 2
  let i = 0
  while (i < n - 1 && x >= at(i + 1)) i++
  const j = Math.min(i + 1, n - 1)
  const t = j === i ? 0 : smooth(at(i), at(j), x)
  const A = LINEAR[Math.min(i, LINEAR.length - 1)], B = LINEAR[Math.min(j, LINEAR.length - 1)]
  out.a.copy(A.a).lerp(B.a, t); out.b.copy(A.b).lerp(B.b, t)
  out.lift = A.lift + (B.lift - A.lift) * t
  return out
}

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * .5 + .5;
  gl_Position = vec4(position.xy, 1., 1.);
}`

const fragmentShader = /* glsl */ `
varying vec2 vUv;
uniform vec3 uBase, uA, uB;
uniform float uLift, uAspect, uHorizon;
uniform vec4 uOff; // far.xy, near.xy in uv
void main() {
  vec2 p = vUv;
  // Glow lives inside the canvas ellipse and above the floor's far edge; both fade to BASE.
  float ring = length((p - .5) * 2.);
  float edge = 1. - smoothstep(.5, 1., ring);
  float sky = smoothstep(uHorizon, uHorizon + .34, p.y);
  float mask = edge * sky * uLift;
  vec2 q = vec2((p.x - .5) * uAspect, p.y - .5);
  // Far layer: a wide soft bloom high in the frame. Near layer: a thinner band lower down.
  vec2 d = q - vec2(.12 * uAspect, .32) - uOff.xy * vec2(uAspect, 1.);
  float far = exp(-dot(d / vec2(.78 * uAspect, .36), d / vec2(.78 * uAspect, .36)) * 1.6);
  vec2 e = q - vec2(-.02 * uAspect, .12) - uOff.zw * vec2(uAspect, 1.);
  float near = exp(-(e.y * e.y) / (.07 * .07)) * (1. - smoothstep(.15 * uAspect, .62 * uAspect, abs(e.x)));
  vec3 c = uBase;
  c = mix(c, uA, clamp(far * 1.1 * mask, 0., 1.));
  c = mix(c, uB, clamp(near * .55 * mask, 0., 1.));
  gl_FragColor = vec4(c, 1.);
  #include <colorspace_fragment>
  // Static interleaved-gradient dither, only where the glow is, so the flat BASE stays flat.
  float n = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(.06711056, .00583715))));
  gl_FragColor.rgb += (n - .5) / 255. * smoothstep(0., .004, max(far, near) * mask);
}`

const look = { a: new Color(), b: new Color(), lift: 0 }
const dir = new Vector3(), ahead = new Vector3()
const FLOOR_Y = -.22, FLOOR_EDGE = 60
const wrap = (a: number) => ((a + Math.PI * 3) % (Math.PI * 2)) - Math.PI

export function BackgroundDirector({ control }: { control: PreviewControl }) {
  const geometry = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3))
    return g
  }, [])
  const material = useMemo(() => new ShaderMaterial({
    vertexShader, fragmentShader, depthTest: false, depthWrite: false, toneMapped: false, fog: false,
    uniforms: {
      uBase: { value: new Color(BASE) }, uA: { value: new Color() }, uB: { value: new Color() },
      uLift: { value: 0 }, uAspect: { value: 1.6 }, uHorizon: { value: .5 }, uOff: { value: new Vector4() },
    },
  }), [])
  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])
  // After Driver has set the camera (priority -1) and before it renders (2): no one-frame lag.
  useFrame(({ camera, size }) => {
    const cam = camera as PerspectiveCamera
    const u = material.uniforms
    lookAt(control.u, look)
    u.uA.value.copy(look.a); u.uB.value.copy(look.b); u.uLift.value = look.lift
    u.uAspect.value = size.width / Math.max(1, size.height)
    // The layers sit behind the orbit pivot, so they slide against the camera yaw and pitch
    // by an angle-based amount that grows with depth (the far layer moves most).
    cam.getWorldDirection(dir)
    const yaw = wrap(Math.atan2(dir.x, dir.z) + Math.PI / 2), pitch = Math.asin(Math.max(-1, Math.min(1, dir.y)))
    const vfov = (cam.fov * Math.PI) / 180, hfov = 2 * Math.atan(Math.tan(vfov / 2) * u.uAspect.value)
    u.uOff.value.set(yaw / hfov * .34, -pitch / vfov * .22, yaw / hfov * .16, -pitch / vfov * .1)
    // Screen height of the floor's far edge along the view azimuth: the glow is BASE there.
    const len = Math.hypot(dir.x, dir.z)
    if (len > 1e-4) {
      ahead.set(cam.position.x + dir.x / len * FLOOR_EDGE, FLOOR_Y, cam.position.z + dir.z / len * FLOOR_EDGE).project(cam)
      u.uHorizon.value = Math.min(.95, Math.max(0, ahead.y * .5 + .5))
    }
  }, 1)
  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={-1000} />
}
