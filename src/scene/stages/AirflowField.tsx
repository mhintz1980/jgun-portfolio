import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Plane, ShaderMaterial, Vector3 } from 'three'
import { getQuality } from '../../state/qualityStore'
import { getScrollState, telemetry } from '../../state/scrollStore'
import { airflowIntensity, stageEnvelope, STAGE_TRANSITIONS, STATION2_CAD_ANCHORS } from './stageWindows'

/**
 * JG-018 — CH.03 RL-300 / MSP SAFE Enclosure Interactive Airflow Field.
 *
 * One draw call of shader-driven points seeded once into GPU attributes:
 * - Particles advect along the measured CAD ventilation route:
 *     1. Intake Duct (`[0.0, 1.158, 0.893]`) — cool laminar stream (cyan #00e5ff)
 *     2. Pump Housing (`[0.022, 0.943, -0.055]`) & Acoustic Baffles (`[-1.319, 1.590, -0.433]`) — internal equipment swirl & heat pickup
 *     3. Exhaust Duct (`[-0.101, 1.282, -1.225]`) — rising thermal dissipation (warm amber #f97316)
 * - Pointer / Touch aerodynamic deflection:
 *     In useFrame, the cursor ray is projected onto the bounded horizontal plane (y = 1.15 m)
 *     in Station 2 local space. Nearby streamlines deflect smoothly around the cursor,
 *     giving intuitive fluid dynamics feedback.
 * - Zero per-frame memory allocation (reusable module-level scratch vectors).
 * - Full tier: 12,000 particles; Lite tier: 3,600 particles; Reduced motion: frozen.
 */

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uFlow;
  uniform float uAlpha;
  uniform float uSize;
  uniform float uDetail;
  uniform vec3 uIntake;
  uniform vec3 uPump;
  uniform vec3 uBaffles;
  uniform vec3 uExhaust;
  uniform vec3 uMouse;
  uniform float uMouseActive;

  varying float vLife;
  varying vec3 vColor;

  // Particle route through verified CAD coordinates
  vec3 route(float t, float seed, float lane) {
    if (t < 0.28) {
      // 1. Laminar intake through DUCT_INTAKE (+Z)
      float k = smoothstep(0.0, 1.0, t / 0.28);
      vec3 from = vec3(
        uIntake.x + (lane - 0.5) * 1.1,
        uIntake.y + (seed - 0.5) * 0.7,
        uIntake.z + 0.65
      );
      vec3 to = vec3(
        uIntake.x + (lane - 0.5) * 0.6,
        uIntake.y + (seed - 0.5) * 0.4,
        uIntake.z - 0.35
      );
      return mix(from, to, k);
    } else if (t < 0.72) {
      // 2. Swirling circulation around PUMP_HOUSING and through ACOUSTIC_BAFFLES
      float k = (t - 0.28) / (0.72 - 0.28);
      float angle = k * 5.2 + seed * 6.2831853 + lane * 2.0;
      float radiusX = mix(0.95, 0.45, 0.5 + 0.5 * sin(seed * 11.7));
      float radiusY = mix(0.55, 0.30, 0.5 + 0.5 * cos(lane * 9.3));
      
      // Arc passes near acoustic baffle wall on -X side
      float baffleBias = (1.0 - k) * sin(k * 3.14159) * -0.45;

      return vec3(
        uPump.x + cos(angle) * radiusX + baffleBias,
        uPump.y + sin(angle) * radiusY + (seed - 0.5) * 0.4,
        mix(uIntake.z - 0.35, uExhaust.z + 0.25, k)
      );
    } else {
      // 3. Exhaust rise and plume dissipation through DUCT_EXHAUST (-Z)
      float k = (t - 0.72) / 0.28;
      vec3 from = vec3(
        uExhaust.x + (lane - 0.5) * 0.4,
        uExhaust.y + (seed - 0.5) * 0.3,
        uExhaust.z + 0.25
      );
      vec3 to = vec3(
        uExhaust.x + (lane - 0.5) * 1.3,
        uExhaust.y + 0.85 + (seed - 0.5) * 0.6,
        uExhaust.z - 1.15
      );
      return mix(from, to, k * k);
    }
  }

  void main() {
    float seed = position.x;
    float lane = position.y;
    float speedSeed = position.z;

    float speed = (0.05 + 0.24 * uFlow) * (0.75 + 0.5 * speedSeed);
    float t = fract(uTime * speed + seed);

    vec3 pos = route(t, seed, lane);

    // Aerodynamic pointer deflection around cursor
    if (uMouseActive > 0.01) {
      vec3 toMouse = pos - uMouse;
      // Evaluate distance in XZ plane with Y weighting
      float dist = length(vec3(toMouse.x, toMouse.y * 1.5, toMouse.z));
      float radius = 0.95;
      if (dist < radius && dist > 0.01) {
        float force = (radius - dist) / radius;
        vec3 deflect = normalize(toMouse) * (force * force * 0.42 * uMouseActive);
        pos += deflect;
      }
    }

    // Curl-style turbulence
    float segmentTurb = t < 0.72 ? mix(0.4, 1.1, t / 0.72) : 2.4;
    float amp = (0.008 + 0.048 * uFlow) * segmentTurb;
    vec3 turb = vec3(
      sin(pos.y * 28.0 + uTime * 2.8 + seed * 17.0),
      sin(pos.z * 24.0 + uTime * 2.1 + seed * 23.0),
      sin(pos.x * 26.0 + uTime * 2.5 + seed * 19.0)
    );
    if (uDetail > 0.5) {
      turb += 0.5 * vec3(
        sin(pos.y * 62.0 - uTime * 4.1 + seed * 31.0),
        sin(pos.z * 58.0 - uTime * 3.5 + seed * 37.0),
        sin(pos.x * 64.0 - uTime * 3.9 + seed * 41.0)
      );
    }
    pos += turb * amp;

    // Cool intake (cyan #00e5ff) -> Warm exhaust (#f97316)
    vColor = mix(
      vec3(0.0, 0.9, 1.0),
      vec3(1.0, 0.45, 0.08),
      smoothstep(0.45, 0.92, t)
    );

    // Lifecycle ease at intake, dissolve at exhaust plume
    vLife = smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.86, 1.0, t));

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uSize * (0.6 + 0.8 * speedSeed) * clamp(0.20 / max(0.05, -mvPosition.z), 0.05, 3.5);
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

function particleCount(tier: string): number {
  return tier === 'full' ? 12000 : 3600
}

// Module-level reusable math scratchpads (r3f-scroll-performance-guard)
const _interactionPlane = new Plane(new Vector3(0, 1, 0), -1.15) // World plane at y = 1.15 m
const _worldHit = new Vector3()
const _stationOrigin = new Vector3(28, 0, -6)

export function AirflowField() {
  const flow = useRef(0)
  const mouseActive = useRef(0)

  const { pointer, camera, raycaster } = useThree()
  const tier = getQuality().tier
  const count = particleCount(tier)

  const geometry = useMemo(() => {
    const geo = new BufferGeometry()
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
          uIntake: { value: new Vector3(...STATION2_CAD_ANCHORS.ductIntake) },
          uPump: { value: new Vector3(...STATION2_CAD_ANCHORS.pumpHousing) },
          uBaffles: { value: new Vector3(...STATION2_CAD_ANCHORS.acousticBaffles) },
          uExhaust: { value: new Vector3(...STATION2_CAD_ANCHORS.ductExhaust) },
          uMouse: { value: new Vector3(0, 1.15, 0) },
          uMouseActive: { value: 0 },
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
    const safeDelta = Math.min(delta, 0.1)

    const envelope = stageEnvelope(
      getScrollState().progress,
      STAGE_TRANSITIONS.enclosureIn,
      STAGE_TRANSITIONS.enclosureOut,
    )

    // Hidden stages freeze the whole field — zero uniform churn, zero GPU work
    if (!envelope.active || getQuality().reducedMotion) {
      if (mat.uniforms.uAlpha.value !== 0) {
        mat.uniforms.uAlpha.value = 0
        mat.uniforms.uMouseActive.value = 0
        telemetry.stage.flow = 0
      }
      return
    }

    const targetFlow = airflowIntensity(getScrollState().progress)
    const dampFlow = 1 - Math.exp(-4 * safeDelta)
    flow.current += (targetFlow - flow.current) * dampFlow

    // Raycast pointer onto interaction plane in Station 2 local space
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.ray.intersectPlane(_interactionPlane, _worldHit)
    let hasTarget = false

    if (hit) {
      // Local coordinates relative to Station 2 origin [28, 0, -6]
      const localX = _worldHit.x - _stationOrigin.x
      const localY = _worldHit.y - _stationOrigin.y
      const localZ = _worldHit.z - _stationOrigin.z

      // Only engage within Station 2 interaction bounds
      if (Math.abs(localX) < 3.2 && Math.abs(localZ) < 3.2) {
        mat.uniforms.uMouse.value.set(localX, localY, localZ)
        hasTarget = true
      }
    }

    const targetMouseActive = hasTarget ? 1.0 : 0.0
    const dampMouse = 1 - Math.exp(-6 * safeDelta)
    mouseActive.current += (targetMouseActive - mouseActive.current) * dampMouse

    mat.uniforms.uTime.value += delta
    mat.uniforms.uFlow.value = flow.current
    mat.uniforms.uAlpha.value = envelope.alpha
    mat.uniforms.uMouseActive.value = mouseActive.current
    telemetry.stage.flow = flow.current
  })

  return <points geometry={geometry} material={shader} frustumCulled={false} />
}
