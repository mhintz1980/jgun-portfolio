import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { Color, Mesh, PlaneGeometry, ShaderMaterial, Vector3 } from 'three'
import type { BackdropLayerHandle, BackdropLayerProps } from './types'

/**
 * JG-023 backdrop layer 2/2 — StaticPoster blueprint grid (48px design
 * language, src/components/StaticPoster.tsx:16) with sparse hash-noise dust,
 * on a camera-locked full-viewport plane. Render-static: no useFrame;
 * BackdropRig drives everything through the BackdropLayerHandle.
 *
 * Same material posture as the gradient layer (fog explicitly false — owner
 * decision 2026-08-31 — transparent, depthWrite false, depthTest true) at
 * renderOrder -999, so the grid draws over the gradient (-1000); depthTest
 * composites both behind opaque scene content (the gradient writes no depth,
 * so the grid still clears it). Lines and dust paint the accent color
 * only (rgb never accumulates) — painted luminance is bounded by the palette
 * peak (bloom constraint).
 *
 * The shader compiles as GLSL ES 3.00 under three r185 (WebGL2-only), so
 * fwidth is core; three prepends precision highp — never add one here.
 */

/** Perf fallback: flip to false to drop the dust specks (JG-023 plan revert
 * pattern; strips the dust GLSL from the compiled shader entirely). */
const BACKDROP_DUST = true

const LAYER_DEPTH = 55
const RENDER_ORDER = -999
const DEFAULT_SIZE = 240

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vLocal;

  void main() {
    vLocal = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uAccent;
  uniform float uAlpha;

  varying vec2 vLocal;

  // 48px-equivalent cell: visible height at depth 55 is ~42.2 world units at
  // the widest authored fov (42), so 48/1080 of frame height = ~1.9u, rounded
  // to 2.0. The plane is parallel to the screen, so cell scale is isotropic.
  const float CELL = 2.0;
  // x the rig's accentAlpha (0.08, CH.02 cyan) this lands the lines at the
  // StaticPoster weight rgba(56,232,255,0.05).
  const float LINE_GAIN = 0.6;
  const float DUST_THRESHOLD = 0.888; // ~1 speck per 9 cells
  const float DUST_RADIUS = 0.02;     // cell units; ~1 px radius at 1080p/fov 42
  const float DUST_GAIN = 0.85;

  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec2 g = vLocal / CELL;
    // Anti-aliased lines; the 1e-6 floor removes the degenerate
    // zero-derivative divide instead of relying on min(+inf, 1.0).
    vec2 fw = max(fwidth(g), vec2(1e-6));
    vec2 grid = abs(fract(g - 0.5) - 0.5) / fw;
    float line = 1.0 - min(min(grid.x, grid.y), 1.0);

    float a = line * LINE_GAIN;
${BACKDROP_DUST ? `
    // Static dust: presence and position are pure functions of the cell id —
    // no time input, deterministic frame to frame. Centers are inset 20% from
    // the cell edges so specks are never chord-clipped by the cell boundary.
    vec2 dustCell = floor(g);
    vec2 dustPos = vec2(0.2) + 0.6 * vec2(hash21(dustCell + 19.19), hash21(dustCell + 47.47));
    float dustDist = length(fract(g) - dustPos);
    float dustAA = max(fwidth(dustDist), 1e-6);
    float dust = step(DUST_THRESHOLD, hash21(dustCell))
      * (1.0 - smoothstep(DUST_RADIUS - dustAA, DUST_RADIUS + dustAA, dustDist));
    a = max(a, dust * DUST_GAIN);
` : ''}

    float alpha = clamp(a, 0.0, 1.0) * clamp(uAlpha, 0.0, 1.0);
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(uAccent, alpha);
  }
`

// Module-level scratch (r3f-scroll-performance-guard): syncToCamera runs every
// frame and must not allocate.
const _viewDir = new Vector3()

export const BackdropGridLayer = forwardRef<BackdropLayerHandle, BackdropLayerProps>(
  function BackdropGridLayer({ size = DEFAULT_SIZE }, ref) {
    const mesh = useRef<Mesh>(null)

    const geometry = useMemo(() => new PlaneGeometry(size, size), [size])

    const material = useMemo(
      () =>
        new ShaderMaterial({
          vertexShader: VERTEX_SHADER,
          fragmentShader: FRAGMENT_SHADER,
          uniforms: {
            uAccent: { value: new Color(0, 0, 0) },
            uAlpha: { value: 0 },
          },
          transparent: true,
          depthWrite: false,
          depthTest: true,
          fog: false,
        }),
      [],
    )

    useEffect(() => {
      return () => {
        geometry.dispose()
        material.dispose()
      }
    }, [geometry, material])

    // Handle identity is stable (material is memoized once); every method
    // mutates existing GPU-side objects in place.
    useImperativeHandle(
      ref,
      (): BackdropLayerHandle => ({
        setAlpha: (alpha) => {
          const a = Math.min(1, Math.max(0, alpha))
          material.uniforms.uAlpha.value = a
          if (mesh.current) mesh.current.visible = a > 0.001
        },
        setPalette: (_top, _bottom, accent) => {
          // Grid paints the accent only; the full palette arrives per
          // contract. The rig multiplies accentAlpha into accent upstream.
          material.uniforms.uAccent.value.copy(accent)
        },
        syncToCamera: (camera) => {
          const m = mesh.current
          if (!m) return
          // Canvas camera is root-level (SceneCanvas <Canvas camera>), so
          // local == world; the quaternion-derived view axis is fresh, while
          // matrixWorld (getWorldDirection) lags one frame.
          _viewDir.set(0, 0, -1).applyQuaternion(camera.quaternion)
          m.position.copy(camera.position).addScaledVector(_viewDir, LAYER_DEPTH)
          m.quaternion.copy(camera.quaternion)
        },
      }),
      [material],
    )

    return (
      <mesh
        ref={mesh}
        geometry={geometry}
        material={material}
        renderOrder={RENDER_ORDER}
        frustumCulled={false}
        visible={false}
      />
    )
  },
)
