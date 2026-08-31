import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { Color, Mesh, PlaneGeometry, ShaderMaterial, Vector3 } from 'three'
import type { BackdropLayerHandle, BackdropLayerProps } from './types'

/**
 * JG-023 backdrop layer 1/2 — vertical two-stop gradient with a soft radial
 * accent pool, on a camera-locked full-viewport plane. Render-static: the
 * component has no useFrame; BackdropRig drives everything per frame through
 * the BackdropLayerHandle.
 *
 * fog is explicitly false (owner decision 2026-08-31): scene fog's 25 m near
 * can never reach a plane held at depth 60 from the camera, so the depth ramp
 * is authored in the shader instead. Raw unlit ShaderMaterial, transparent,
 * depthWrite false, depthTest true — depthTest composites the wash behind
 * opaque scene content (three's transparent pass draws after it); renderOrder
 * -1000 sits under the grid layer (-999).
 *
 * All shader math is linear: uniforms arrive already converted (the rig builds
 * Colors from sRGB hex — ColorManagement converts on construction; the numeric
 * (r,g,b) constructor here skips conversion on purpose). Output luminance is
 * bounded by the palette peak: the accent blend is a convex mix, never
 * additive (bloom constraint — authored peak < 0.45 linear vs the 0.6 bloom
 * threshold, PostProcessingComposer).
 */

const LAYER_DEPTH = 60
const RENDER_ORDER = -1000
const DEFAULT_SIZE = 240

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uBottom;
  uniform vec3 uAccent;
  uniform float uAlpha;

  varying vec2 vUv;

  // Ramp half-extent in uv: the widest authored fov (42) sees vUv.y within
  // 0.5 +/- ~0.10 of the 240u plane, so both stops and the clamp edge stay
  // just off-screen at every keyframe.
  const float RAMP_HALF = 0.12;
  const vec2 POOL_CENTER = vec2(0.5, 0.44);
  const float POOL_RADIUS = 0.18;

  void main() {
    // Two-stop vertical ramp, bottom stop low in frame.
    vec3 color = mix(uBottom, uTop, clamp((vUv.y - 0.5) / RAMP_HALF + 0.5, 0.0, 1.0));

    // Soft accent pool low in frame. Convex mix only — uAccent already
    // carries accentAlpha (the rig multiplies it in before setPalette), and
    // mix() cannot push luminance past max(uniform luminances).
    float pool = 1.0 - smoothstep(0.0, POOL_RADIUS, distance(vUv, POOL_CENTER));
    color = mix(color, uAccent, pool);

    float alpha = clamp(uAlpha, 0.0, 1.0);
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color, alpha);
  }
`

// Module-level scratch (r3f-scroll-performance-guard): syncToCamera runs every
// frame and must not allocate.
const _viewDir = new Vector3()

export const BackdropGradientLayer = forwardRef<BackdropLayerHandle, BackdropLayerProps>(
  function BackdropGradientLayer({ size = DEFAULT_SIZE }, ref) {
    const mesh = useRef<Mesh>(null)

    const geometry = useMemo(() => new PlaneGeometry(size, size), [size])

    const material = useMemo(
      () =>
        new ShaderMaterial({
          vertexShader: VERTEX_SHADER,
          fragmentShader: FRAGMENT_SHADER,
          uniforms: {
            uTop: { value: new Color(0, 0, 0) },
            uBottom: { value: new Color(0, 0, 0) },
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
        setPalette: (top, bottom, accent) => {
          material.uniforms.uTop.value.copy(top)
          material.uniforms.uBottom.value.copy(bottom)
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
