import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial } from 'three'
import { getQuality } from '../../state/qualityStore'
import { getScrollState, telemetry } from '../../state/scrollStore'
import { airflowIntensity, ENCLOSURE_HALF, stageEnvelope, STAGE_TRANSITIONS } from './stageWindows'

/**
 * CH.03 — MSP SAFE enclosure thermal airflow field.
 *
 * One draw call of shader-driven points (chosen over InstancedMesh: gas-phase
 * particles need no per-instance matrices, and a single attribute-seeded point
 * cloud is the cheapest pooling there is — attributes are allocated once and
 * every per-frame change is a uniform write). Each particle carries three
 * random seeds in its `position` attribute; the vertex shader advects it
 * along an intake → engine-compartment swirl → exhaust-dissipation route
 * around the enclosure bounding box, with curl-style turbulence, speed and
 * alpha all bound to CH.03 scroll progress:
 *
 *   uFlow   0..1  scroll-bound intensity (turbulence amplitude + advection
 *                  speed ramp; particles crawl at rest, stream at full flow)
 *   uAlpha  0..1  stage cross-fade (from stageEnvelope, StageManager-owned
 *                  window) × nothing else — lifecycle fade lives per particle
 *
 * Route colors run cool cyan (intake air) → warm amber (exhaust heat) to read
 * as CFM/FPM ventilation without a literal simulation. Lite tier drops the
 * particle count and the second turbulence octave; poster tier never mounts
 * (no canvas); reduced motion freezes the field hidden.
 */

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uFlow;
  uniform float uAlpha;
  uniform float uSize;
  uniform float uDetail;
  uniform vec3 uHalf;

  varying float vLife;
  varying vec3 vColor;

  // Particle route through the enclosure volume: intake duct (front-left,
  // low) → helical engine-compartment sweep → exhaust rise and dissipation
  // (upper-right, rear). Segment boundaries keep dwell inside the box.
  vec3 route(float t, float seed, float lane) {
    if (t < 0.30) {
      float k = smoothstep(0.0, 1.0, t / 0.30);
      vec3 from = vec3(
        -uHalf.x * (1.9 + 0.6 * lane),
        -uHalf.y * (0.55 - 0.25 * lane),
        uHalf.z * (0.55 + 0.20 * lane));
      vec3 to = vec3(-uHalf.x * 0.10, -uHalf.y * 0.05, uHalf.z * 0.10);
      return mix(from, to, k);
    } else if (t < 0.75) {
      float k = (t - 0.30) / (0.75 - 0.30);
      float angle = k * 5.5 + seed * 6.2831853 + lane * 2.1;
      float radius = mix(0.85, 0.35, 0.5 + 0.5 * sin(seed * 12.9));
      return vec3(
        cos(angle) * uHalf.x * radius,
        sin(angle) * uHalf.y * radius * 0.8,
        mix(uHalf.z * 0.10, -uHalf.z * 0.55, k));
    } else {
      float k = (t - 0.75) / 0.25;
      vec3 from = vec3(0.0, 0.0, -uHalf.z * 0.55);
      vec3 to = vec3(
        uHalf.x * (0.9 + 0.7 * lane),
        uHalf.y * (1.3 + 0.6 * lane),
        -uHalf.z * (1.3 + 0.4 * lane));
      return mix(from, to, k * k);
    }
  }

  void main() {
    // position.xyz = three independent per-particle seeds in 0..1.
    float seed = position.x;
    float lane = position.y;
    float speedSeed = position.z;

    float speed = (0.04 + 0.22 * uFlow) * (0.7 + 0.6 * speedSeed);
    float t = fract(uTime * speed + seed);

    vec3 pos = route(t, seed, lane);

    // Curl-style turbulence: amplitude ramps with scroll-bound flow and
    // widest in the exhaust plume (dissipation), tightest in the duct.
    float segmentTurb = t < 0.75 ? mix(0.35, 1.0, t / 0.75) : 2.2;
    float amp = (0.006 + 0.045 * uFlow) * segmentTurb;
    vec3 turb = vec3(
      sin(pos.y * 34.0 + uTime * 3.1 + seed * 17.0),
      sin(pos.z * 29.0 + uTime * 2.3 + seed * 23.0),
      sin(pos.x * 31.0 + uTime * 2.7 + seed * 19.0));
    if (uDetail > 0.5) {
      turb += 0.5 * vec3(
        sin(pos.y * 71.0 - uTime * 4.3 + seed * 31.0),
        sin(pos.z * 67.0 - uTime * 3.7 + seed * 37.0),
        sin(pos.x * 73.0 - uTime * 4.1 + seed * 41.0));
    }
    pos += turb * amp;

    // Cool intake air → hot exhaust: the thermal read.
    vColor = mix(
      vec3(0.24, 0.93, 1.0),
      vec3(1.0, 0.45, 0.12),
      smoothstep(0.50, 0.95, t));

    // Lifecycle: ease in at the intake, dissolve in the plume.
    vLife = smoothstep(0.0, 0.10, t) * (1.0 - smoothstep(0.85, 1.0, t));

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uSize * (0.55 + 0.9 * speedSeed) * clamp(0.16 / max(0.05, -mvPosition.z), 0.05, 3.0);
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uAlpha;

  varying float vLife;
  varying vec3 vColor;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d) * vLife * uAlpha;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vColor, a);
  }
`

/** Particle budget per quality tier — one draw call either way. */
function particleCount(tier: string): number {
  return tier === 'full' ? 12000 : 3600
}

export function AirflowField() {
  const flow = useRef(0)

  const tier = getQuality().tier
  const count = particleCount(tier)

  const geometry = useMemo(() => {
    const geo = new BufferGeometry()
    // Seeds double as the position attribute (three requires one for the
    // draw count); real positions are shader-generated, so culling is off.
    const seeds = new Float32Array(count * 3)
    for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random()
    geo.setAttribute('position', new BufferAttribute(seeds, 3))
    return geo
  }, [count])

  const shader = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms: {
          uTime: { value: 0 },
          uFlow: { value: 0 },
          uAlpha: { value: 0 },
          uSize: { value: 9 },
          uDetail: { value: tier === 'full' ? 1 : 0 },
          uHalf: { value: ENCLOSURE_HALF },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [tier],
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
      shader.dispose()
    }
  }, [geometry, shader])

  useFrame((_state, delta) => {
    const mat = shader
   
    const envelope = stageEnvelope(
      getScrollState().progress,
      STAGE_TRANSITIONS.enclosureIn,
      STAGE_TRANSITIONS.enclosureOut,
    )

    // Hidden stages freeze the whole field — no uniform churn, no GPU work.
    if (!envelope.active || getQuality().reducedMotion) {
      if (mat.uniforms.uAlpha.value !== 0) {
        mat.uniforms.uAlpha.value = 0
        telemetry.stage.flow = 0
      }
      return
    }

    const target = airflowIntensity(getScrollState().progress)
    const damp = 1 - Math.exp(-4 * Math.min(delta, 0.1))
    flow.current += (target - flow.current) * damp

    mat.uniforms.uTime.value += delta
    mat.uniforms.uFlow.value = flow.current
    mat.uniforms.uAlpha.value = envelope.alpha
    telemetry.stage.flow = flow.current
  })

  return <points geometry={geometry} material={shader} frustumCulled={false} />
}
