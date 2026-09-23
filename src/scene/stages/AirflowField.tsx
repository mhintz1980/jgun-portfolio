import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
  Box3,
  BufferAttribute,
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  Plane,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { getQuality } from '../../state/qualityStore'
import { getScrollState, telemetry } from '../../state/scrollStore'
import { airflowIntensity, stageEnvelope, STAGE_TRANSITIONS, STATION2_CAD_ANCHORS } from './stageWindows'
import {
  APERTURE_COLS,
  APERTURE_INSET,
  APERTURE_ROWS,
  airwayRouteParams,
} from './airflowRoute'

/**
 * JG-018 → JG-032 — CH.03 RL-300 / MSP SAFE Enclosure Thermal Airflow Field.
 *
 * One draw call of shader-driven points seeded once into GPU attributes,
 * re-authored (JG-032) as a thermal-management diagnostic along the CAD axes:
 *   1. Intake aperture (t < 0.20): spawn above the +Z grille face, snapped to
 *      a slot lattice derived from the G2RL300-SAF-1003-2 AABB (ray-grid probe
 *      2026-09-08: no hex perforations on the real plate). #00e5ff
 *   2. Plenum transit (0.20 ≤ t < 0.45): traverse the measured
 *      DUCT_INTAKE_AIRWAY box (uAirwayMin/uAirwayMax — a 42-vert volume block,
 *      no centerline exists). #38bdf8 → #7dd3fc
 *   3. Engine heat pickup (0.45 ≤ t < 0.75): swirl around uPump; heat
 *      accumulator localizes on distance to the airway exit plane + uPump.
 *      #fbbf24 → #f97316. Particles within 0.25 m of uBaffles deflect and
 *      calm (streamlines bend around ACOUSTIC_BAFFLES instead of ghosting).
 *   4. Exhaust (0.75 ≤ t < 1.0): −Z exit, thermal buoyancy, exponential
 *      spread. #f97316 → #ef4444, fading out.
 * - Fallback: if the airway/grille nodes are missing (future GLB re-export),
 *   uAirwayValid/uGrilleValid = 0 keeps the legacy JG-018 guessed arc — never
 *   a degenerate box at the origin.
 * - Restrained CFD layer (Option A — zero extra draw calls): vHeat varying,
 *   velocity-oriented streak in the fragment shader, heat-boosted point size.
 * - Pump heat emphasis: low-opacity additive wireframe clone of PUMP_HOUSING
 *   pulsing sin(uTime * 1.5) in #f97316, visible only inside the [0.610, 0.700]
 *   internals window.
 * - Pointer / Touch aerodynamic deflection (JG-018, retained).
 * - Zero per-frame memory allocation (module-level scratch). Full tier:
 *   12,000 particles; Lite: 3,600; Reduced motion: frozen.
 */

const MSP_ENCLOSURE_URL = '/models/msp-enclosure.glb'

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
  uniform vec3 uAirwayMin;
  uniform vec3 uAirwayMax;
  uniform float uAirwayValid;
  uniform vec3 uGrilleMin;
  uniform vec3 uGrilleMax;
  uniform float uGrilleValid;
  uniform vec2 uViewport;

  varying float vLife;
  varying float vHeat;
  varying vec3 vColor;
  varying vec2 vDir;

  // Cool→hot thermal ramp (mirrors heatRampColor in airflowRoute.ts)
  vec3 heatRamp(float t) {
    vec3 c1 = vec3(0.0, 0.898, 1.0);     // #00e5ff intake
    vec3 c2 = vec3(0.220, 0.742, 0.973); // #38bdf8 plenum
    vec3 c3 = vec3(0.490, 0.827, 0.988); // #7dd3fc plenum exit
    vec3 c4 = vec3(0.984, 0.749, 0.141); // #fbbf24 heat pickup
    vec3 c5 = vec3(0.976, 0.451, 0.086); // #f97316 hot
    vec3 c6 = vec3(0.937, 0.267, 0.267); // #ef4444 exhaust
    vec3 col = c1;
    col = mix(col, c2, smoothstep(0.20, 0.30, t));
    col = mix(col, c3, smoothstep(0.30, 0.45, t));
    col = mix(col, c4, smoothstep(0.45, 0.60, t));
    col = mix(col, c5, smoothstep(0.60, 0.75, t));
    col = mix(col, c6, smoothstep(0.75, 0.90, t));
    return col;
  }

  // JG-032 thermal route through the measured airway box + CAD anchors
  vec3 route(float t, float seed, float lane) {
    if (t < 0.20) {
      // 1. Intake aperture: slot lattice on the +Z grille face (uGrilleValid)
      float k = smoothstep(0.0, 1.0, t / 0.20);
      float col = floor(seed * ${APERTURE_COLS}.0);
      float row = floor(lane * ${APERTURE_ROWS}.0);
      float slotX = mix(uGrilleMin.x + ${APERTURE_INSET.toFixed(2)}, uGrilleMax.x - ${APERTURE_INSET.toFixed(2)}, (col + 0.5) / ${APERTURE_COLS}.0);
      float slotY = mix(uGrilleMin.y + ${APERTURE_INSET.toFixed(2)}, uGrilleMax.y - ${APERTURE_INSET.toFixed(2)}, (row + 0.5) / ${APERTURE_ROWS}.0);
      vec3 spawn = vec3(
        slotX + (seed - 0.5) * 0.06,
        slotY + (lane - 0.5) * 0.06,
        uGrilleMax.z + 0.35
      );
      // Land on the airway entry plane (z = uAirwayMax.z), clamped into the box
      vec3 entry = vec3(
        clamp(slotX, uAirwayMin.x + 0.05, uAirwayMax.x - 0.05),
        clamp(slotY, uAirwayMin.y + 0.05, uAirwayMax.y - 0.05),
        uAirwayMax.z
      );
      return mix(spawn, entry, k);
    } else if (t < 0.45) {
      // 2. Plenum transit through the DUCT_INTAKE_AIRWAY box (+Z entry → interior exit)
      float k = smoothstep(0.0, 1.0, (t - 0.20) / 0.25);
      float col = floor(seed * ${APERTURE_COLS}.0);
      float row = floor(lane * ${APERTURE_ROWS}.0);
      float slotX = mix(uGrilleMin.x + ${APERTURE_INSET.toFixed(2)}, uGrilleMax.x - ${APERTURE_INSET.toFixed(2)}, (col + 0.5) / ${APERTURE_COLS}.0);
      float slotY = mix(uGrilleMin.y + ${APERTURE_INSET.toFixed(2)}, uGrilleMax.y - ${APERTURE_INSET.toFixed(2)}, (row + 0.5) / ${APERTURE_ROWS}.0);
      vec3 entry = vec3(
        clamp(slotX, uAirwayMin.x + 0.05, uAirwayMax.x - 0.05),
        clamp(slotY, uAirwayMin.y + 0.05, uAirwayMax.y - 0.05),
        uAirwayMax.z
      );
      vec3 boxCenter = vec3(
        (uAirwayMin.x + uAirwayMax.x) * 0.5,
        (uAirwayMin.y + uAirwayMax.y) * 0.5,
        uAirwayMin.z
      );
      // Mild inward contraction while crossing the plenum
      vec3 exit = mix(entry, boxCenter, 0.55);
      exit.z = uAirwayMin.z;
      return mix(entry, exit, k);
    } else if (t < 0.75) {
      // 3. Engine heat pickup: vorticity swirl around PUMP_HOUSING
      float k = (t - 0.45) / 0.30;
      float angle = k * 5.2 + seed * 6.2831853 + lane * 2.0;
      float radiusX = mix(0.95, 0.45, 0.5 + 0.5 * sin(seed * 11.7));
      float radiusY = mix(0.55, 0.30, 0.5 + 0.5 * cos(lane * 9.3));

      // Stream passes near the acoustic baffle wall on the −X side
      float baffleBias = (1.0 - k) * sin(k * 3.14159) * -0.45;

      return vec3(
        uPump.x + cos(angle) * radiusX + baffleBias,
        uPump.y + sin(angle) * radiusY + (seed - 0.5) * 0.4,
        mix(uAirwayMin.z, uExhaust.z + 0.25, k)
      );
    } else {
      // 4. Exhaust: −Z exit, thermal buoyancy, exponential spread
      float k = (t - 0.75) / 0.25;
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

  // Legacy JG-018 guessed arc — used only when the airway/grille nodes are absent
  vec3 legacyRoute(float t, float seed, float lane) {
    if (t < 0.28) {
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
      float k = (t - 0.28) / (0.72 - 0.28);
      float angle = k * 5.2 + seed * 6.2831853 + lane * 2.0;
      float radiusX = mix(0.95, 0.45, 0.5 + 0.5 * sin(seed * 11.7));
      float radiusY = mix(0.55, 0.30, 0.5 + 0.5 * cos(lane * 9.3));
      float baffleBias = (1.0 - k) * sin(k * 3.14159) * -0.45;
      return vec3(
        uPump.x + cos(angle) * radiusX + baffleBias,
        uPump.y + sin(angle) * radiusY + (seed - 0.5) * 0.4,
        mix(uIntake.z - 0.35, uExhaust.z + 0.25, k)
      );
    } else {
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

    bool measured = uAirwayValid > 0.5 && uGrilleValid > 0.5;
    vec3 pos = measured ? route(t, seed, lane) : legacyRoute(t, seed, lane);

    // Aerodynamic pointer deflection around cursor (JG-018, retained)
    if (uMouseActive > 0.01) {
      vec3 toMouse = pos - uMouse;
      float dist = length(vec3(toMouse.x, toMouse.y * 1.5, toMouse.z));
      float radius = 0.95;
      if (dist < radius && dist > 0.01) {
        float force = (radius - dist) / radius;
        vec3 deflect = normalize(toMouse) * (force * force * 0.42 * uMouseActive);
        pos += deflect;
      }
    }

    // Baffle interaction: within 0.25 m of ACOUSTIC_BAFFLES the streamline
    // deflects around the wall and calms (velocity loss → damped turbulence)
    float baffleCalm = 1.0;
    if (measured && t > 0.45 && t < 0.75) {
      vec3 toBaffle = pos - uBaffles;
      float dB = length(toBaffle);
      if (dB < 0.25 && dB > 0.001) {
        pos += normalize(toBaffle) * (0.25 - dB) * 0.6;
        baffleCalm = 0.35;
      }
    }

    // Curl-style turbulence (calmed inside the baffle zone)
    float segmentTurb = t < 0.75 ? mix(0.4, 1.1, t / 0.75) : 2.4;
    float amp = (0.008 + 0.048 * uFlow) * segmentTurb * baffleCalm;
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

    // Heat accumulator: localizes on distance to the airway exit plane + pump
    float dPump = length(pos - uPump);
    float dExit = measured ? abs(pos.z - uAirwayMin.z) : 1.0;
    float heat = smoothstep(1.2, 0.3, dPump) * 0.7 + smoothstep(0.6, 0.0, dExit) * 0.3;
    vHeat = clamp(heat, 0.0, 1.0) * smoothstep(0.40, 0.55, t) * (1.0 - smoothstep(0.85, 1.0, t));

    vColor = heatRamp(t);

    // Lifecycle ease at intake, dissolve at exhaust plume
    vLife = smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.86, 1.0, t));

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Velocity-oriented streak direction (screen space) for the CFD layer
    vec3 posAhead = (measured ? route(min(t + 0.02, 1.0), seed, lane) : legacyRoute(min(t + 0.02, 1.0), seed, lane));
    vec4 clipAhead = projectionMatrix * modelViewMatrix * vec4(posAhead, 1.0);
    vDir = (clipAhead.xy / clipAhead.w - gl_Position.xy / gl_Position.w) * uViewport;

    gl_PointSize = uSize * (0.6 + 0.8 * speedSeed) * (1.0 + 0.3 * vHeat) * clamp(0.20 / max(0.05, -mvPosition.z), 0.05, 3.5);
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uAlpha;

  varying float vLife;
  varying float vHeat;
  varying vec3 vColor;
  varying vec2 vDir;

  void main() {
    // Velocity-oriented streak (Option A CFD layer): stretch the point sprite
    // along its screen-space velocity instead of drawing a round dot
    vec2 pc = gl_PointCoord - 0.5;
    float speed2d = length(vDir);
    vec2 nd = speed2d > 1e-4 ? vDir / speed2d : vec2(1.0, 0.0);
    vec2 perp = vec2(-nd.y, nd.x);
    float along = dot(pc, nd);
    float across = dot(pc, perp);
    float stretch = mix(1.4, 2.6, clamp(speed2d * 0.5, 0.0, 1.0));
    float d = length(vec2(along / stretch, across * stretch)) * 2.0;
    float a = smoothstep(0.5, 0.05, d) * vLife * uAlpha;
    // Hot core: slight alpha lift on heated particles
    a *= 1.0 + 0.35 * vHeat;
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
const _unitBox = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))

/** Internals window during the panel-lift hold (Station-2 choreography). */
const INTERNALS_WINDOW: readonly [number, number] = [0.61, 0.7]

export function AirflowField() {
  const flow = useRef(0)
  const mouseActive = useRef(0)
  const elapsed = useRef(0)

  const { pointer, camera, raycaster } = useThree()
  const tier = getQuality().tier
  const count = particleCount(tier)

  // JG-032: resolve the measured route volumes from the GLB itself (never via
  // props — the Station-2 contract string-matches the field mounts). The
  // loader cache is shared with Station2_AcousticEnclosure (same URL), so
  // this costs no extra parse.
  const gltf = useLoader(GLTFLoader, MSP_ENCLOSURE_URL, (loader) => {
    const draco = new DRACOLoader()
    draco.setDecoderPath('/draco/')
    loader.setDRACOLoader(draco)
  })

  const routeVolumes = useMemo(() => {
    gltf.scene.updateMatrixWorld(true)
    const airwayNode = gltf.scene.getObjectByName('DUCT_INTAKE_AIRWAY')
    const airwayBox = airwayNode ? new Box3().setFromObject(airwayNode) : null
    const airway = airwayRouteParams(airwayBox)

    let grilleNode = gltf.scene.getObjectByName('G2RL300-SAF-1003-2') ?? null
    if (!grilleNode) {
      // GLTFLoader prim-uniquification trap (cad-scene-graph-rigging §8):
      // multi-primitive parts arrive as <name>_1, <name>_2…
      gltf.scene.traverse((object) => {
        if (!grilleNode && object.name.startsWith('G2RL300-SAF-1003-2')) grilleNode = object
      })
    }
    const grilleBox = grilleNode ? new Box3().setFromObject(grilleNode) : null
    const grilleValid =
      grilleBox &&
      grilleBox.max.x > grilleBox.min.x &&
      grilleBox.max.y > grilleBox.min.y &&
      grilleBox.max.z >= grilleBox.min.z

    return { airway, airwayBox, grilleBox, grilleValid: Boolean(grilleValid) }
  }, [gltf])

  // Pump heat emphasis: additive wireframe clone of PUMP_HOUSING (internals window only)
  const pumpPulse = useMemo(() => {
    const pump = gltf.scene.getObjectByName('PUMP_HOUSING')
    if (!pump) return null
    const material = new MeshBasicMaterial({
      color: '#f97316',
      wireframe: true,
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
    })
    const clone = pump.clone(true)
    clone.traverse((object) => {
      if (object instanceof Mesh) object.material = material
    })
    clone.visible = false
    return { clone, material }
  }, [gltf])

  const geometry = useMemo(() => {
    const geo = new BufferGeometry()
    const seeds = new Float32Array(count * 3)
    for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random()
    geo.setAttribute('position', new BufferAttribute(seeds, 3))
    return geo
  }, [count])

  const shader = useMemo(() => {
    const { airway, airwayBox, grilleBox, grilleValid } = routeVolumes
    return new ShaderMaterial({
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
        uAirwayMin: { value: airwayBox ? airwayBox.min.clone() : _unitBox.min.clone() },
        uAirwayMax: { value: airwayBox ? airwayBox.max.clone() : _unitBox.max.clone() },
        uAirwayValid: { value: airway.valid ? 1 : 0 },
        uGrilleMin: { value: grilleBox ? grilleBox.min.clone() : _unitBox.min.clone() },
        uGrilleMax: { value: grilleBox ? grilleBox.max.clone() : _unitBox.max.clone() },
        uGrilleValid: { value: grilleValid ? 1 : 0 },
        uViewport: { value: new Vector2(1280, 720) },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })
  }, [tier, routeVolumes])

  useEffect(() => {
    return () => {
      geometry.dispose()
      shader.dispose()
      pumpPulse?.material.dispose()
    }
  }, [geometry, shader, pumpPulse])

  useFrame((state, delta) => {
    const mat = shader
    const safeDelta = Math.min(delta, 0.1)
    const { progress } = getScrollState()

    const envelope = stageEnvelope(
      progress,
      STAGE_TRANSITIONS.enclosureIn,
      STAGE_TRANSITIONS.enclosureOut,
    )

    // Pump pulse: visible only inside the [0.610, 0.700] internals window
    if (pumpPulse) {
      const inWindow =
        envelope.active &&
        !getQuality().reducedMotion &&
        progress >= INTERNALS_WINDOW[0] &&
        progress <= INTERNALS_WINDOW[1]
      pumpPulse.clone.visible = inWindow
      if (inWindow) {
        const pulse = 0.5 + 0.5 * Math.sin(elapsed.current * 1.5)
        pumpPulse.material.opacity = (0.08 + 0.04 * pulse) * envelope.alpha
      }
    }

    // Hidden stages freeze the whole field — zero uniform churn, zero GPU work
    if (!envelope.active || getQuality().reducedMotion) {
      if (mat.uniforms.uAlpha.value !== 0) {
        mat.uniforms.uAlpha.value = 0
        mat.uniforms.uMouseActive.value = 0
        telemetry.stage.flow = 0
      }
      return
    }

    const targetFlow = airflowIntensity(progress)
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

    elapsed.current += delta
    mat.uniforms.uTime.value += delta
    mat.uniforms.uFlow.value = flow.current
    mat.uniforms.uAlpha.value = envelope.alpha
    mat.uniforms.uMouseActive.value = mouseActive.current
    ;(mat.uniforms.uViewport.value as Vector2).set(
      state.size.width,
      state.size.height,
    )
    telemetry.stage.flow = flow.current
  })

  return (
    <>
      <points geometry={geometry} material={shader} frustumCulled={false} />
      {pumpPulse && <primitive object={pumpPulse.clone} dispose={null} />}
    </>
  )
}
