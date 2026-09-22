import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  AlwaysStencilFunc,
  EqualStencilFunc,
  GreaterDepth,
  KeepStencilOp,
  LessEqualDepth,
  NormalBlending,
  Plane,
  ShaderMaterial,
  Vector3,
} from 'three'
import type { PreviewControl } from './QuietMachineScene'
import { evaluateFlow, HEAT_RAMP, RIBBON_COUNT, SOUND_FRONTS, SOUND_ORIGIN, SPINES, type Bundle, type Vec3 } from './flow'
import * as flowConfig from './flow'

const AIR_SAMPLES = 72
const SOUND_SAMPLES = 28
const HOTSPOT = new Vector3(.022, .943, -.055)
const AIR_BUNDLES: readonly Exclude<Bundle, 'sound'>[] = ['main', 'lower', 'merged']
const BUNDLES: readonly Bundle[] = [...AIR_BUNDLES, 'sound']
const BAFFLE_MIN_Y = 1.319
const BAFFLE_MAX_Y = 1.862
const BAFFLE_MIN_Z = .385
const BAFFLE_MAX_Z = 1.352
const BAFFLE_CONTACT_MARGIN = .085

// Section caps use stencil ref 0; equipment owns ref 1 for the ribbon reveal.
export const EQUIPMENT_MASK_STENCIL_REF = 1

type AirBundle = Exclude<Bundle, 'sound'>
type RibbonSplit = Record<AirBundle, number>
type LegacyRibbonCount = { desktop: number; mobile: number }
type FlowRibbonConfig = typeof flowConfig & {
  ribbonSplit?: (total: number) => RibbonSplit
}

const configuredFlow = flowConfig as FlowRibbonConfig

const VERTEX_SHADER = /* glsl */ `
  #include <clipping_planes_pars_vertex>

  attribute float aT;
  attribute float aSide;
  attribute float aWidth;
  attribute float aHeat;
  attribute float aKind;
  attribute float aContact;
  attribute float aTracerPhase;
  attribute vec3 aTangent;

  uniform float uExtent;

  varying float vT;
  varying float vSide;
  varying float vHeat;
  varying float vKind;
  varying float vContact;
  varying float vTracerPhase;

  void main() {
    vT = aT;
    vSide = aSide;
    vHeat = aHeat;
    vKind = aKind;
    vContact = aContact;
    vTracerPhase = aTracerPhase;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vec4 viewPosition = mvPosition;
    vec3 viewTangent = normalize(mat3(modelViewMatrix) * aTangent);
    vec3 viewDirection = normalize(-viewPosition.xyz);
    vec3 viewSide = cross(viewTangent, viewDirection);
    float sideLength = length(viewSide);
    viewSide = sideLength > 0.0001 ? viewSide / sideLength : vec3(0.0, 1.0, 0.0);

    // Sound fronts widen as their directional radius grows; baffle contact
    // locally thins them at the authored face interaction.
    float soundRadius = aKind >= 0.0 ? mix(0.35, 1.0, uExtent) : 1.0;
    float contactTaper = aKind == 0.0 ? mix(1.0, 0.38, aContact) : 1.0;
    viewPosition.xyz += viewSide * aSide * aWidth * soundRadius * contactTaper;
    gl_Position = projectionMatrix * viewPosition;
    #include <clipping_planes_vertex>
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  #include <clipping_planes_pars_fragment>

  uniform float uExtent;
  uniform float uWeight;
  uniform float uPhase;
  uniform float uHeat;
  uniform float uReducedMotion;
  uniform vec3 uCool;
  uniform vec3 uWarm;
  uniform float uAlphaCap;

  varying float vT;
  varying float vSide;
  varying float vHeat;
  varying float vKind;
  varying float vContact;
  varying float vTracerPhase;

  float namedEase(float edge0, float edge1, float value) {
    return smoothstep(edge0, edge1, value);
  }

  void main() {
    #include <clipping_planes_fragment>

    if (vT > uExtent) discard;

    float startTaper = namedEase(0.0, 0.055, vT);
    float headStart = max(0.0, uExtent - 0.04);
    float headTaper = 1.0 - namedEase(headStart, max(headStart + 0.0001, uExtent), vT);
    float edgeTaper = 1.0 - namedEase(0.70, 1.0, abs(vSide));

    // Directional tracers retain a deterministic strand offset when motion is reduced.
    float tracerMask = 0.0;
    if (vKind < -0.5) {
      float spacing = 3.0 + floor(vTracerPhase * 3.0);
      float phase = vTracerPhase + (uReducedMotion < 0.5 ? uPhase * 0.45 : 0.0);
      float tracer = fract(vT * spacing - phase);
      tracerMask = 1.0 - namedEase(0.24, 0.27, tracer);
    }

    vec3 color;
    float alpha;
    if (vKind > -0.5 && vKind < 0.5) {
      // Sound fronts are a violet-to-rose directional cue, separate from the
      // cool-to-warm air ramp. They thin into the acoustic baffle faces.
      color = mix(vec3(0.48, 0.68, 1.0), vec3(1.0, 0.48, 0.68), uHeat);
      float baffleAttenuation = mix(1.0, 0.46, vContact);
      alpha = 0.72 * startTaper * headTaper * edgeTaper * baffleAttenuation;
    } else if (vKind > 0.5) {
      // Isolation-mount chevrons are a warm, grounded cue rather than an arc
      // or a concentric bubble.
      color = vec3(1.0, 0.56, 0.24);
      alpha = 0.88 * startTaper * headTaper * edgeTaper;
    } else {
      float authoredHeat = clamp(vHeat * uHeat, 0.0, 1.0);
      color = mix(uCool, uWarm, smoothstep(0.25, 0.75, authoredHeat));
      float coreAlpha = 0.90 * startTaper * headTaper * edgeTaper;
      float tracerAlpha = 0.98 * startTaper * headTaper * edgeTaper;
      alpha = mix(coreAlpha, tracerAlpha, tracerMask);
    }

    alpha *= uAlphaCap;
    alpha *= uWeight;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

interface StripPath {
  points: readonly Vector3[]
  kind: number
  width: (t: number) => number
  heat: readonly number[]
  contact: readonly number[]
  tracerPhase: number
}

interface FlowGeometries {
  geometries: Record<Bundle, BufferGeometry>
}

interface FlowMaterials {
  materials: Record<Bundle, ShaderMaterial>
  hiddenMaterials: Record<Bundle, ShaderMaterial>
}

const fract = (value: number) => value - Math.floor(value)

function vector(point: Vec3) {
  return new Vector3(point[0], point[1], point[2])
}

function tangentAt(points: readonly Vector3[], index: number) {
  const previous = points[Math.max(0, index - 1)]
  const next = points[Math.min(points.length - 1, index + 1)]
  return next.clone().sub(previous).normalize()
}

function buildStripGeometry(paths: readonly StripPath[]): BufferGeometry {
  const positions: number[] = []
  const arc: number[] = []
  const sides: number[] = []
  const widths: number[] = []
  const heats: number[] = []
  const kinds: number[] = []
  const contacts: number[] = []
  const tracerPhases: number[] = []
  const tangents: number[] = []
  const indices: number[] = []

  let vertexBase = 0
  for (const path of paths) {
    for (let i = 0; i < path.points.length; i++) {
      const t = path.points.length === 1 ? 0 : i / (path.points.length - 1)
      const point = path.points[i]
      const tangent = tangentAt(path.points, i)
      const heat = path.heat[i]
      const contact = path.contact[i]
      const width = path.width(t)
      for (const side of [-1, 1]) {
        positions.push(point.x, point.y, point.z)
        arc.push(t)
        sides.push(side)
        widths.push(width)
        heats.push(heat)
        kinds.push(path.kind)
        contacts.push(contact)
        tracerPhases.push(path.tracerPhase)
        tangents.push(tangent.x, tangent.y, tangent.z)
      }
    }
    for (let i = 0; i < path.points.length - 1; i++) {
      const a = vertexBase + i * 2
      const b = a + 1
      const c = a + 2
      const d = a + 3
      indices.push(a, c, b, b, c, d)
    }
    vertexBase += path.points.length * 2
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('aT', new BufferAttribute(new Float32Array(arc), 1))
  geometry.setAttribute('aSide', new BufferAttribute(new Float32Array(sides), 1))
  geometry.setAttribute('aWidth', new BufferAttribute(new Float32Array(widths), 1))
  geometry.setAttribute('aHeat', new BufferAttribute(new Float32Array(heats), 1))
  geometry.setAttribute('aKind', new BufferAttribute(new Float32Array(kinds), 1))
  geometry.setAttribute('aContact', new BufferAttribute(new Float32Array(contacts), 1))
  geometry.setAttribute('aTracerPhase', new BufferAttribute(new Float32Array(tracerPhases), 1))
  geometry.setAttribute('aTangent', new BufferAttribute(new Float32Array(tangents), 3))
  geometry.setIndex(indices)
  geometry.computeBoundingSphere()
  return geometry
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

function sourceInfluence(point: Vector3) {
  const distance = point.distanceTo(HOTSPOT)
  return clamp01(1 - distance / .52)
}

function intervalGap(value: number, minimum: number, maximum: number) {
  return value < minimum ? minimum - value : value > maximum ? value - maximum : 0
}

function baffleContact(point: Vector3) {
  const yGap = intervalGap(point.y, BAFFLE_MIN_Y, BAFFLE_MAX_Y)
  const zGap = intervalGap(point.z, BAFFLE_MIN_Z, BAFFLE_MAX_Z)
  return clamp01(1 - Math.hypot(yGap, zGap) / BAFFLE_CONTACT_MARGIN)
}

function accumulatedHeat(points: readonly Vector3[], initialHeat: number, terminalHeat = initialHeat) {
  if (points.length === 0) return []

  const sourceValues = points.map(sourceInfluence)
  let sourceIndex = 0
  for (let i = 1; i < sourceValues.length; i++) {
    if (sourceValues[i] > sourceValues[sourceIndex]) sourceIndex = i
  }

  const distanceAfterSource = new Array<number>(points.length).fill(0)
  let postSourceLength = 0
  for (let i = sourceIndex + 1; i < points.length; i++) {
    postSourceLength += points[i].distanceTo(points[i - 1])
    distanceAfterSource[i] = postSourceLength
  }

  let carried = clamp01(initialHeat)
  const authored: number[] = []
  for (let i = 0; i < points.length; i++) {
    carried = Math.max(carried, sourceValues[i])
    if (i >= sourceIndex && postSourceLength > 0) {
      const downstreamProgress = distanceAfterSource[i] / postSourceLength
      const transportedHeat = initialHeat + (terminalHeat - initialHeat) * downstreamProgress
      carried = Math.max(carried, transportedHeat)
    }
    authored.push(clamp01(carried))
  }
  return authored
}

function airPaths(bundle: AirBundle, ribbonCount: number, carriedHeat = 0): StripPath[] {
  const curve = new CatmullRomCurve3(SPINES[bundle].map(vector), false, 'centripetal', .5)
  const spine = curve.getPoints(AIR_SAMPLES)
  const paths: StripPath[] = []

  for (let ribbon = 0; ribbon < ribbonCount; ribbon++) {
    // Irrational multipliers provide stable, deliberately non-uniform fanning
    // and widths without Math.random() or a hidden build-time seed.
    const radialPhase = fract((ribbon + 1) * .61803398875)
    const radialScale = .006 + .042 * Math.sqrt(fract((ribbon + 1) * .75487766625))
    const width = .014 + .008 * fract((ribbon + 1) * .569840296)
    const tracerPhase = fract((ribbon + 1) * .41421356237)
    const angle = radialPhase * Math.PI * 2
    const points = spine.map((point, i) => {
      const tangent = tangentAt(spine, i)
      const up = Math.abs(tangent.y) < .92 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0)
      const sideA = tangent.clone().cross(up).normalize()
      const sideB = tangent.clone().cross(sideA).normalize()
      const offset = sideA.multiplyScalar(Math.cos(angle) * radialScale)
        .add(sideB.multiplyScalar(Math.sin(angle) * radialScale))
      return point.clone().add(offset)
    })
    paths.push({
      points,
      kind: -1,
      width: () => width,
      heat: accumulatedHeat(points, carriedHeat, bundle === 'merged' ? 1 : carriedHeat),
      contact: points.map(() => 0),
      tracerPhase,
    })
  }
  return paths
}

const SOUND_TARGETS: readonly Vec3[] = [
  [-.22, 1.38, .42],
  [-.18, 1.58, .68],
  [-.22, 1.78, .98],
  [-.27, 1.48, 1.30],
]

const ISOLATION_MOUNTS: readonly Vec3[] = [
  [-.53, .025, -1.355051], [.53, .025, -1.355051],
  [-.53, .025, -.055051], [.53, .025, -.055051],
  [-.53, .025, 1.244949], [.53, .025, 1.244949],
]

function soundPaths(): StripPath[] {
  const origin = vector(SOUND_ORIGIN)
  const paths: StripPath[] = []
  for (let i = 0; i < SOUND_FRONTS; i++) {
    const target = vector(SOUND_TARGETS[i])
    const control = origin.clone().lerp(target, .52)
    control.x += (i - 1.5) * .028
    control.z += (i % 2 ? -.045 : .055)
    const curve = new CatmullRomCurve3([origin.clone(), control, target], false, 'centripetal', .5)
    const points = curve.getPoints(SOUND_SAMPLES)
    paths.push({
      points,
      kind: 0,
      width: () => .0075,
      heat: points.map(() => 0),
      contact: points.map(baffleContact),
      tracerPhase: fract((i + 1) * .41421356237),
    })
  }

  // A six-point family of small V/chevron marks at the isolation mounts is a
  // grounded sound cue, intentionally unlike the airborne directional arcs.
  for (let i = 0; i < ISOLATION_MOUNTS.length; i++) {
    const [x, y, z] = ISOLATION_MOUNTS[i]
    const flip = i % 2 === 0 ? 1 : -1
    const points = [
      new Vector3(x - .055 * flip, y, z + .035),
      new Vector3(x, .046, z - .045),
      new Vector3(x + .055 * flip, y, z + .035),
    ]
    paths.push({
      points,
      kind: 1,
      width: () => .0105,
      heat: points.map(() => 0),
      contact: points.map(() => 0),
      tracerPhase: 0,
    })
  }
  return paths
}

function maxTerminalHeat(paths: readonly StripPath[]) {
  return paths.reduce((maximum, path) => Math.max(maximum, path.heat[path.heat.length - 1] ?? 0), 0)
}

function createGeometries(ribbonCounts: RibbonSplit): FlowGeometries {
  const mainPaths = airPaths('main', ribbonCounts.main)
  const lowerPaths = airPaths('lower', ribbonCounts.lower)
  const carriedHeat = Math.max(maxTerminalHeat(mainPaths), maxTerminalHeat(lowerPaths))
  const mergedPaths = airPaths('merged', ribbonCounts.merged, carriedHeat)

  return {
    geometries: {
      main: buildStripGeometry(mainPaths),
      lower: buildStripGeometry(lowerPaths),
      merged: buildStripGeometry(mergedPaths),
      sound: buildStripGeometry(soundPaths()),
    },
  }
}

function viewportRibbonTotal(viewportWidth: number) {
  const configuredCount = RIBBON_COUNT as number | LegacyRibbonCount
  if (typeof configuredCount === 'number') return configuredCount
  return viewportWidth < 600 ? configuredCount.mobile : configuredCount.desktop
}

function ribbonCountsForViewport(viewportWidth: number): RibbonSplit {
  const total = viewportRibbonTotal(viewportWidth)
  if (typeof configuredFlow.ribbonSplit === 'function') {
    return configuredFlow.ribbonSplit(total)
  }

  // Compatibility with the in-flight pre-split export: preserve its existing
  // per-bundle behavior until flow.ts provides the documented splitter.
  return { main: total, lower: total, merged: total }
}

function createMaterial(plane: Plane | null, clipped: boolean, hidden = false): ShaderMaterial {
  const material = new ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: {
      uExtent: { value: 0 },
      uWeight: { value: 0 },
      uPhase: { value: 0 },
      uHeat: { value: 0 },
      uReducedMotion: { value: 0 },
      uCool: { value: new Color(HEAT_RAMP[0]) },
      uWarm: { value: new Color(HEAT_RAMP[1]) },
      uAlphaCap: { value: hidden ? .40 : 1 },
    },
    transparent: true,
    blending: NormalBlending,
    depthTest: true,
    depthFunc: hidden ? GreaterDepth : LessEqualDepth,
    depthWrite: false,
    side: DoubleSide,
    stencilWrite: hidden,
    stencilRef: EQUIPMENT_MASK_STENCIL_REF,
    stencilFunc: hidden ? EqualStencilFunc : AlwaysStencilFunc,
    stencilFail: KeepStencilOp,
    stencilZFail: KeepStencilOp,
    stencilZPass: KeepStencilOp,
    toneMapped: true,
    clipping: clipped,
    clippingPlanes: clipped && plane ? [plane] : [],
  })
  return material
}

function createMaterials(plane: Plane): FlowMaterials {
  const materials = {
    main: createMaterial(plane, true),
    lower: createMaterial(null, false),
    merged: createMaterial(plane, true),
    sound: createMaterial(null, false),
  }
  return {
    materials,
    hiddenMaterials: {
      main: createMaterial(plane, true, true),
      lower: createMaterial(null, false, true),
      merged: createMaterial(plane, true, true),
      sound: createMaterial(null, false, true),
    },
  }
}

function readReducedMotion() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function AirRibbons({ control, plane }: { control: PreviewControl; plane: Plane }) {
  const width = useThree(state => state.size.width)
  const [reducedMotion, setReducedMotion] = useState(readReducedMotion)
  const ribbonPlane = useMemo(() => new Plane().copy(plane), [plane])
  const clipOverride = useRef<number | null>(null)
  const ribbonCounts = useMemo(() => ribbonCountsForViewport(width), [width])
  const geometries = useMemo(() => createGeometries(ribbonCounts), [ribbonCounts.main, ribbonCounts.lower, ribbonCounts.merged])
  const materials = useMemo(() => createMaterials(ribbonPlane), [ribbonPlane])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const quietMachine = (window as any).__quietMachine
    if (!quietMachine) return
    const ribbons: Record<string, unknown> = {
      render: quietMachine.render,
      setClipOverride: (constant: number) => { clipOverride.current = constant },
      clearClipOverride: () => { clipOverride.current = null },
    }
    for (const bundle of BUNDLES) {
      const material = materials.materials[bundle]
      if (material) ribbons[bundle] = {
        clipping: material.clipping,
        clippingPlanes: material.clippingPlanes,
        uuid: material.uuid,
      }
    }
    quietMachine.ribbons = ribbons
    return () => {
      clipOverride.current = null
      if (quietMachine.ribbons === ribbons) delete quietMachine.ribbons
    }
  }, [materials])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateReducedMotion = () => setReducedMotion(mediaQuery.matches)
    updateReducedMotion()
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateReducedMotion)
    } else {
      mediaQuery.addListener(updateReducedMotion)
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateReducedMotion)
      } else {
        mediaQuery.removeListener(updateReducedMotion)
      }
    }
  }, [])

  useEffect(() => () => {
    Object.values(geometries.geometries).forEach(geometry => geometry.dispose())
  }, [geometries])

  useEffect(() => () => {
    Object.values(materials.materials).forEach(material => material.dispose())
    Object.values(materials.hiddenMaterials).forEach(material => material.dispose())
  }, [materials])

  useFrame(() => {
    ribbonPlane.normal.copy(plane.normal)
    const override = clipOverride.current
    ribbonPlane.constant = override === null ? plane.constant : override

    const flow = evaluateFlow(control.u)
    for (const bundle of BUNDLES) {
      // Reduced motion removes the temporal draw-on/dash motion while retaining
      // authored opacity handoffs and the tapered directional heads.
      for (const material of [materials.materials[bundle], materials.hiddenMaterials[bundle]]) {
        const uniforms = material.uniforms
        uniforms.uExtent.value = reducedMotion ? 1 : flow.extent[bundle]
        uniforms.uWeight.value = flow.weight[bundle]
        uniforms.uPhase.value = flow.phase
        uniforms.uHeat.value = flow.heat
        uniforms.uReducedMotion.value = reducedMotion ? 1 : 0
      }
    }
  })

  return <group name="RL300_FLOW_RIBBONS">
    {BUNDLES.map(bundle => <mesh key={`${bundle}-hidden`} geometry={geometries.geometries[bundle]}
      material={materials.hiddenMaterials[bundle]} renderOrder={20} dispose={null} />)}
    {BUNDLES.map(bundle => <mesh key={bundle} geometry={geometries.geometries[bundle]}
      material={materials.materials[bundle]} renderOrder={21} dispose={null} />)}
  </group>
}
