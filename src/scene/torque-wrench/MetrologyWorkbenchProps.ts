import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Raycaster,
  RingGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
  type Camera,
  type Material,
} from 'three'
import { PORTAL_DESK_Z } from '../drawing/sheet/portal'
import type { ExtractionContext } from '../drawing/poseCore'
import type { DrawingFrameInput } from './privateSheetRuntime'

export interface InteractivePropState {
  readonly id: string
  readonly kind: 'roller' | 'slider' | 'fixture'
  readonly root: Group
  readonly rollerMesh?: Group
  readonly homeX: number
  readonly homeY: number
  readonly homeTheta: number
  readonly radius: number
  readonly interactionRadius: number
  readonly mass: number
  readonly maxOffset: number
  x: number
  y: number
  theta: number
  vx: number
  vy: number
  vTheta: number
  rollAngle: number
  lastShockFracture: number
}

export interface MetrologyWorkbenchTelemetry {
  visible: boolean
  lastCursorLocal: [number, number] | null
  interactionCount: number
  props: Array<{
    id: string
    kind: 'roller' | 'slider' | 'fixture'
    position: [number, number, number]
    rotationZ: number
    rollAngle: number
    displacedMm: number
  }>
}

export interface MetrologyWorkbenchPropsRuntime {
  readonly group: Group
  readonly props: readonly InteractivePropState[]
  onPointerMove(ndcX: number, ndcY: number): void
  nudgeProp(id: string, impulseX: number, impulseY: number, impulseTheta?: number): boolean
  update(frame: DrawingFrameInput, context: ExtractionContext, camera: Camera): void
  snapshot(): MetrologyWorkbenchTelemetry
  dispose(): void
}

declare global {
  interface Window {
    __metrologyWorkbench?: {
      snapshot: () => MetrologyWorkbenchTelemetry
      nudgeProp: (id: string, impulseX: number, impulseY: number, impulseTheta?: number) => boolean
      moveCursorNdc: (ndcX: number, ndcY: number) => void
    }
  }
}

const SHEET_KEEP_OUT_HALF_X = 0.404
const SHEET_KEEP_OUT_HALF_Y = 0.254
const GRANITE_KEEP_IN_HALF_X = 0.675
const GRANITE_KEEP_IN_HALF_Y = 0.435

export function createMetrologyWorkbenchProps(): MetrologyWorkbenchPropsRuntime {
  const group = new Group()
  group.name = 'metrology-workbench-props'
  group.matrixAutoUpdate = false
  group.visible = false

  const geometries = new Set<BufferGeometry>()
  const materials = new Set<Material>()
  const ownGeo = <T extends BufferGeometry>(g: T): T => {
    geometries.add(g)
    return g
  }
  const ownMat = <T extends Material>(m: T): T => {
    materials.add(m)
    return m
  }

  // Shared daytime metrology PBR materials
  const lappedSteel = ownMat(new MeshStandardMaterial({
    color: 0xd8dee6,
    metalness: 0.92,
    roughness: 0.11,
  }))
  const satinChrome = ownMat(new MeshStandardMaterial({
    color: 0xc5ccd4,
    metalness: 0.84,
    roughness: 0.24,
  }))
  const brushedSteel = ownMat(new MeshStandardMaterial({
    color: 0x9aa3ae,
    metalness: 0.80,
    roughness: 0.32,
  }))
  const darkAnodized = ownMat(new MeshStandardMaterial({
    color: 0x1c2026,
    metalness: 0.55,
    roughness: 0.38,
  }))
  const hammertoneFrame = ownMat(new MeshStandardMaterial({
    color: 0x262d36,
    metalness: 0.62,
    roughness: 0.44,
  }))
  const knurledBrass = ownMat(new MeshStandardMaterial({
    color: 0xd4a84f,
    metalness: 0.88,
    roughness: 0.26,
  }))
  const carbideTip = ownMat(new MeshStandardMaterial({
    color: 0x565d66,
    metalness: 0.90,
    roughness: 0.16,
  }))
  const goGreenAnodized = ownMat(new MeshStandardMaterial({
    color: 0x1e824c,
    metalness: 0.68,
    roughness: 0.28,
  }))
  const noGoRedAnodized = ownMat(new MeshStandardMaterial({
    color: 0xb82828,
    metalness: 0.68,
    roughness: 0.28,
  }))
  const lcdScreenMat = ownMat(new MeshStandardMaterial({
    color: 0x7b8c76,
    metalness: 0.12,
    roughness: 0.18,
  }))
  const yellowButtonMat = ownMat(new MeshStandardMaterial({
    color: 0xe2b42b,
    metalness: 0.15,
    roughness: 0.42,
  }))
  const blueButtonMat = ownMat(new MeshStandardMaterial({
    color: 0x2978b5,
    metalness: 0.20,
    roughness: 0.40,
  }))
  const dialFaceMat = ownMat(new MeshStandardMaterial({
    color: 0xf4f2eb,
    metalness: 0.06,
    roughness: 0.22,
  }))
  const rubyStylusMat = ownMat(new MeshStandardMaterial({
    color: 0xd91e36,
    metalness: 0.25,
    roughness: 0.12,
  }))
  const shadowMat = ownMat(new MeshStandardMaterial({
    color: 0x05070a,
    metalness: 0.0,
    roughness: 0.95,
    transparent: true,
    opacity: 0.46,
    depthWrite: false,
  }))

  const props: InteractivePropState[] = []
  const deskZ = PORTAL_DESK_Z + 0.00015

  const addContactPad = (parent: Group, lengthX: number, widthY: number) => {
    const pad = new Mesh(ownGeo(new BoxGeometry(lengthX, widthY, 0.0002)), shadowMat)
    pad.position.set(0, 0, 0.0001)
    pad.renderOrder = 0
    parent.add(pad)
  }

  // 1. Mechanical Drafting Pencil (Rotring 600 style) — rolls on the granite slab
  {
    const root = new Group()
    root.name = 'prop-pencil-rotring-600'
    const roller = new Group()
    const radius = 0.0042
    roller.position.set(0, 0, radius)
    addContactPad(root, 0.138, 0.011)

    // Hexagonal matte-black barrel (aligned along X axis)
    const barrelGeo = ownGeo(new CylinderGeometry(radius, radius, 0.092, 6))
    barrelGeo.rotateZ(Math.PI / 2)
    const barrel = new Mesh(barrelGeo, darkAnodized)
    barrel.position.set(0.012, 0, 0)

    // Knurled metal grip section
    const gripGeo = ownGeo(new CylinderGeometry(radius * 1.02, radius * 1.02, 0.032, 16))
    gripGeo.rotateZ(Math.PI / 2)
    const grip = new Mesh(gripGeo, satinChrome)
    grip.position.set(-0.049, 0, 0)

    // Brass ring & tapered nose cone
    const brassRingGeo = ownGeo(new CylinderGeometry(radius * 0.96, radius * 0.96, 0.003, 14))
    brassRingGeo.rotateZ(Math.PI / 2)
    const brassRing = new Mesh(brassRingGeo, knurledBrass)
    brassRing.position.set(-0.032, 0, 0)

    const coneGeo = ownGeo(new CylinderGeometry(0.0011, radius * 0.94, 0.013, 14))
    coneGeo.rotateZ(Math.PI / 2)
    const cone = new Mesh(coneGeo, satinChrome)
    cone.position.set(-0.0715, 0, 0)

    // 4mm stainless lead sleeve + graphite tip
    const sleeveGeo = ownGeo(new CylinderGeometry(0.00045, 0.00065, 0.0045, 10))
    sleeveGeo.rotateZ(Math.PI / 2)
    const sleeve = new Mesh(sleeveGeo, lappedSteel)
    sleeve.position.set(-0.080, 0, 0)

    const leadGeo = ownGeo(new CylinderGeometry(0.0001, 0.0004, 0.0018, 8))
    leadGeo.rotateZ(Math.PI / 2)
    const lead = new Mesh(leadGeo, carbideTip)
    lead.position.set(-0.083, 0, 0)

    // Red indicator ring + tail eraser cap + pocket clip
    const redBandGeo = ownGeo(new CylinderGeometry(radius * 1.03, radius * 1.03, 0.0022, 12))
    redBandGeo.rotateZ(Math.PI / 2)
    const redBand = new Mesh(redBandGeo, noGoRedAnodized)
    redBand.position.set(0.056, 0, 0)

    const capGeo = ownGeo(new CylinderGeometry(radius * 0.88, radius * 0.88, 0.014, 14))
    capGeo.rotateZ(Math.PI / 2)
    const cap = new Mesh(capGeo, satinChrome)
    cap.position.set(0.065, 0, 0)

    const clip = new Mesh(ownGeo(new BoxGeometry(0.036, 0.0022, 0.0016)), lappedSteel)
    clip.position.set(0.032, 0, radius + 0.0011)

    roller.add(barrel, grip, brassRing, cone, sleeve, lead, redBand, cap, clip)
    root.add(roller)
    group.add(root)

    const homeX = 0.432
    const homeY = -0.145
    const homeTheta = 1.38
    props.push({
      id: 'pencil-rotring-600',
      kind: 'roller',
      root,
      rollerMesh: roller,
      homeX,
      homeY,
      homeTheta,
      radius,
      interactionRadius: 0.088,
      mass: 0.45,
      maxOffset: 0.065,
      x: homeX,
      y: homeY,
      theta: homeTheta,
      vx: 0,
      vy: 0,
      vTheta: 0,
      rollAngle: 0.35,
      lastShockFracture: 0,
    })
  }

  // 2. Digital Calipers (150 mm Mitutoyo Absolute style) — scoots & pivots on granite
  {
    const root = new Group()
    root.name = 'prop-digital-calipers-150mm'
    addContactPad(root, 0.215, 0.062)

    const beamZ = 0.0024
    // Main hardened stainless scale beam
    const beam = new Mesh(ownGeo(new BoxGeometry(0.215, 0.015, 0.0032)), satinChrome)
    beam.position.set(0, 0.008, beamZ)
    const scaleStrip = new Mesh(ownGeo(new BoxGeometry(0.195, 0.0055, 0.0035)), darkAnodized)
    scaleStrip.position.set(0.006, 0.008, beamZ + 0.0002)

    // Fixed left external jaw + top internal nib
    const fixedOuterJaw = new Mesh(ownGeo(new BoxGeometry(0.013, 0.044, 0.0032)), lappedSteel)
    fixedOuterJaw.position.set(-0.101, -0.014, beamZ)
    const fixedJawTip = new Mesh(ownGeo(new BoxGeometry(0.005, 0.016, 0.0032)), carbideTip)
    fixedJawTip.position.set(-0.097, -0.032, beamZ)
    const fixedInnerJaw = new Mesh(ownGeo(new BoxGeometry(0.008, 0.018, 0.0032)), lappedSteel)
    fixedInnerJaw.position.set(-0.103, 0.022, beamZ)

    // Movable jaw carriage (open ~24 mm to show an active measurement gap)
    const jawGap = 0.024
    const movableOuterJaw = new Mesh(ownGeo(new BoxGeometry(0.013, 0.044, 0.0032)), lappedSteel)
    movableOuterJaw.position.set(-0.101 + jawGap + 0.013, -0.014, beamZ)
    const movableInnerJaw = new Mesh(ownGeo(new BoxGeometry(0.008, 0.018, 0.0032)), lappedSteel)
    movableInnerJaw.position.set(-0.103 + jawGap + 0.009, 0.022, beamZ)

    // Digital LCD housing
    const sliderBody = new Mesh(ownGeo(new BoxGeometry(0.062, 0.027, 0.0076)), darkAnodized)
    sliderBody.position.set(-0.048, 0.006, beamZ + 0.0032)
    const lcdBezel = new Mesh(ownGeo(new BoxGeometry(0.042, 0.015, 0.0080)), lcdScreenMat)
    lcdBezel.position.set(-0.052, 0.007, beamZ + 0.0034)
    const originBtn = new Mesh(ownGeo(new CylinderGeometry(0.0024, 0.0024, 0.0084, 12)), yellowButtonMat)
    originBtn.rotation.x = Math.PI / 2
    originBtn.position.set(-0.025, 0.010, beamZ + 0.0035)
    const zeroBtn = new Mesh(ownGeo(new CylinderGeometry(0.0026, 0.0026, 0.0084, 12)), blueButtonMat)
    zeroBtn.rotation.x = Math.PI / 2
    zeroBtn.position.set(-0.025, 0.002, beamZ + 0.0035)

    // Thumb roller & locking screw
    const thumbRoller = new Mesh(ownGeo(new CylinderGeometry(0.0055, 0.0055, 0.0036, 16)), knurledBrass)
    thumbRoller.rotation.x = Math.PI / 2
    thumbRoller.position.set(-0.014, -0.004, beamZ + 0.001)
    const lockScrew = new Mesh(ownGeo(new CylinderGeometry(0.003, 0.003, 0.005, 12)), satinChrome)
    lockScrew.position.set(-0.045, 0.021, beamZ + 0.003)

    // Protruding depth rod at the right tail
    const depthRod = new Mesh(ownGeo(new BoxGeometry(0.028, 0.0022, 0.0015)), lappedSteel)
    depthRod.position.set(0.118, 0.008, beamZ)

    root.add(
      beam,
      scaleStrip,
      fixedOuterJaw,
      fixedJawTip,
      fixedInnerJaw,
      movableOuterJaw,
      movableInnerJaw,
      sliderBody,
      lcdBezel,
      originBtn,
      zeroBtn,
      thumbRoller,
      lockScrew,
      depthRod,
    )
    group.add(root)

    const homeX = 0.452
    const homeY = 0.048
    const homeTheta = -1.36
    props.push({
      id: 'digital-calipers-150mm',
      kind: 'slider',
      root,
      homeX,
      homeY,
      homeTheta,
      radius: 0.045,
      interactionRadius: 0.095,
      mass: 1.35,
      maxOffset: 0.048,
      x: homeX,
      y: homeY,
      theta: homeTheta,
      vx: 0,
      vy: 0,
      vTheta: 0,
      rollAngle: 0,
      lastShockFracture: 0,
    })
  }

  // 3. Outside Micrometer (0-25 mm Mitutoyo style) — scoots & pivots on granite
  {
    const root = new Group()
    root.name = 'prop-micrometer-0-25mm'
    addContactPad(root, 0.148, 0.056)

    const midZ = 0.0075
    // Bowed C-frame (half-torus arch)
    const cFrameGeo = ownGeo(new TorusGeometry(0.026, 0.0058, 12, 24, Math.PI))
    cFrameGeo.rotateZ(Math.PI)
    const cFrame = new Mesh(cFrameGeo, hammertoneFrame)
    cFrame.position.set(-0.038, 0.002, midZ)

    // Thermal insulating pad on C-frame
    const framePadGeo = ownGeo(new TorusGeometry(0.026, 0.0063, 8, 16, Math.PI * 0.65))
    framePadGeo.rotateZ(Math.PI * 1.18)
    const framePad = new Mesh(framePadGeo, darkAnodized)
    framePad.position.set(-0.038, 0.002, midZ)

    // Anvil & Spindle
    const anvilGeo = ownGeo(new CylinderGeometry(0.0034, 0.0034, 0.007, 14))
    anvilGeo.rotateZ(Math.PI / 2)
    const anvil = new Mesh(anvilGeo, carbideTip)
    anvil.position.set(-0.060, 0.004, midZ)

    const spindleGeo = ownGeo(new CylinderGeometry(0.0033, 0.0033, 0.024, 14))
    spindleGeo.rotateZ(Math.PI / 2)
    const spindle = new Mesh(spindleGeo, lappedSteel)
    spindle.position.set(-0.030, 0.004, midZ)

    // Graduated barrel sleeve + knurled thimble + ratchet stop
    const sleeveGeo = ownGeo(new CylinderGeometry(0.0078, 0.0078, 0.036, 18))
    sleeveGeo.rotateZ(Math.PI / 2)
    const sleeve = new Mesh(sleeveGeo, satinChrome)
    sleeve.position.set(0.0, 0.004, midZ)

    const thimbleConeGeo = ownGeo(new CylinderGeometry(0.0094, 0.0079, 0.009, 18))
    thimbleConeGeo.rotateZ(Math.PI / 2)
    const thimbleCone = new Mesh(thimbleConeGeo, satinChrome)
    thimbleCone.position.set(0.016, 0.004, midZ)

    const thimbleGeo = ownGeo(new CylinderGeometry(0.0095, 0.0095, 0.034, 20))
    thimbleGeo.rotateZ(Math.PI / 2)
    const thimble = new Mesh(thimbleGeo, brushedSteel)
    thimble.position.set(0.037, 0.004, midZ)

    const ratchetGeo = ownGeo(new CylinderGeometry(0.0056, 0.0056, 0.015, 16))
    ratchetGeo.rotateZ(Math.PI / 2)
    const ratchet = new Mesh(ratchetGeo, darkAnodized)
    ratchet.position.set(0.061, 0.004, midZ)

    root.add(cFrame, framePad, anvil, spindle, sleeve, thimbleCone, thimble, ratchet)
    group.add(root)

    const homeX = -0.452
    const homeY = -0.135
    const homeTheta = 1.18
    props.push({
      id: 'micrometer-0-25mm',
      kind: 'slider',
      root,
      homeX,
      homeY,
      homeTheta,
      radius: 0.038,
      interactionRadius: 0.088,
      mass: 1.25,
      maxOffset: 0.045,
      x: homeX,
      y: homeY,
      theta: homeTheta,
      vx: 0,
      vy: 0,
      vTheta: 0,
      rollAngle: 0,
      lastShockFracture: 0,
    })
  }

  // 4. Five Precision Jo Gauge Blocks — scootable lapped steel blocks
  const gaugeBlockConfigs = [
    { id: 'gauge-block-20mm', x: 0.205, y: -0.268, theta: 0.22, length: 0.032, width: 0.014, height: 0.0085 },
    { id: 'gauge-block-10mm', x: 0.422, y: -0.228, theta: -0.34, length: 0.024, width: 0.013, height: 0.0085 },
    { id: 'gauge-block-50mm', x: 0.428, y: -0.042, theta: 0.19, length: 0.052, width: 0.016, height: 0.0095 },
    { id: 'gauge-block-25mm', x: -0.432, y: -0.022, theta: -0.27, length: 0.036, width: 0.015, height: 0.0090 },
    { id: 'gauge-block-30mm', x: 0.436, y: 0.195, theta: 0.42, length: 0.040, width: 0.015, height: 0.0090 },
  ]
  for (const cfg of gaugeBlockConfigs) {
    const root = new Group()
    root.name = 'prop-' + cfg.id
    addContactPad(root, cfg.length + 0.004, cfg.width + 0.004)

    const core = new Mesh(ownGeo(new BoxGeometry(cfg.length, cfg.width, cfg.height)), satinChrome)
    core.position.set(0, 0, cfg.height * 0.5)

    // Mirror-lapped top measuring face + laser-etched nominal stripe
    const topMirror = new Mesh(ownGeo(new BoxGeometry(cfg.length * 0.96, cfg.width * 0.92, 0.0006)), lappedSteel)
    topMirror.position.set(0, 0, cfg.height + 0.0002)

    const etchPlate = new Mesh(ownGeo(new BoxGeometry(cfg.length * 0.42, cfg.width * 0.36, 0.0008)), darkAnodized)
    etchPlate.position.set(0, 0, cfg.height + 0.0003)

    root.add(core, topMirror, etchPlate)
    group.add(root)

    props.push({
      id: cfg.id,
      kind: 'slider',
      root,
      homeX: cfg.x,
      homeY: cfg.y,
      homeTheta: cfg.theta,
      radius: cfg.length * 0.55,
      interactionRadius: 0.072,
      mass: 0.65,
      maxOffset: 0.055,
      x: cfg.x,
      y: cfg.y,
      theta: cfg.theta,
      vx: 0,
      vy: 0,
      vTheta: 0,
      rollAngle: 0,
      lastShockFracture: 0,
    })
  }

  // 5. Loose Cylindrical Plug Pins & Double-Ended Go/No-Go Pin Gauge — roll & scoot on granite
  const plugPinConfigs = [
    { id: 'pin-gauge-6mm', x: 0.105, y: -0.268, theta: -0.08, radius: 0.0036, length: 0.048, doubleEnded: false },
    { id: 'pin-gauge-8mm', x: 0.468, y: -0.165, theta: 0.92, radius: 0.0042, length: 0.052, doubleEnded: false },
    { id: 'pin-gauge-10mm', x: -0.195, y: -0.270, theta: 0.19, radius: 0.0048, length: 0.054, doubleEnded: false },
    { id: 'plug-gauge-gonogo', x: -0.448, y: 0.062, theta: -0.21, radius: 0.0062, length: 0.112, doubleEnded: true },
  ]
  for (const cfg of plugPinConfigs) {
    const root = new Group()
    root.name = 'prop-' + cfg.id
    const roller = new Group()
    roller.position.set(0, 0, cfg.radius)
    addContactPad(root, cfg.length, cfg.radius * 2.4)

    if (cfg.doubleEnded) {
      // Hexagonal dark handle + green GO collet + red NO-GO collet + 2 lapped steel gauge pins
      const handleGeo = ownGeo(new CylinderGeometry(cfg.radius, cfg.radius, 0.048, 6))
      handleGeo.rotateZ(Math.PI / 2)
      const handle = new Mesh(handleGeo, darkAnodized)

      const goColletGeo = ownGeo(new CylinderGeometry(cfg.radius * 0.94, cfg.radius * 0.94, 0.011, 14))
      goColletGeo.rotateZ(Math.PI / 2)
      const goCollet = new Mesh(goColletGeo, goGreenAnodized)
      goCollet.position.set(-0.029, 0, 0)

      const noGoColletGeo = ownGeo(new CylinderGeometry(cfg.radius * 0.94, cfg.radius * 0.94, 0.011, 14))
      noGoColletGeo.rotateZ(Math.PI / 2)
      const noGoCollet = new Mesh(noGoColletGeo, noGoRedAnodized)
      noGoCollet.position.set(0.029, 0, 0)

      const goPinGeo = ownGeo(new CylinderGeometry(0.0042, 0.0042, 0.024, 18))
      goPinGeo.rotateZ(Math.PI / 2)
      const goPin = new Mesh(goPinGeo, lappedSteel)
      goPin.position.set(-0.046, 0, 0)

      const noGoPinGeo = ownGeo(new CylinderGeometry(0.0043, 0.0043, 0.020, 18))
      noGoPinGeo.rotateZ(Math.PI / 2)
      const noGoPin = new Mesh(noGoPinGeo, lappedSteel)
      noGoPin.position.set(0.044, 0, 0)

      roller.add(handle, goCollet, noGoCollet, goPin, noGoPin)
    } else {
      const pinGeo = ownGeo(new CylinderGeometry(cfg.radius, cfg.radius, cfg.length, 18))
      pinGeo.rotateZ(Math.PI / 2)
      const pin = new Mesh(pinGeo, lappedSteel)

      const collarGeo = ownGeo(new CylinderGeometry(cfg.radius * 1.02, cfg.radius * 1.02, 0.006, 16))
      collarGeo.rotateZ(Math.PI / 2)
      const collar = new Mesh(collarGeo, carbideTip)
      collar.position.set(-cfg.length * 0.24, 0, 0)

      roller.add(pin, collar)
    }

    root.add(roller)
    group.add(root)

    props.push({
      id: cfg.id,
      kind: 'roller',
      root,
      rollerMesh: roller,
      homeX: cfg.x,
      homeY: cfg.y,
      homeTheta: cfg.theta,
      radius: cfg.radius,
      interactionRadius: 0.075,
      mass: cfg.doubleEnded ? 0.72 : 0.38,
      maxOffset: 0.062,
      x: cfg.x,
      y: cfg.y,
      theta: cfg.theta,
      vx: 0,
      vy: 0,
      vTheta: 0,
      rollAngle: 0.2,
      lastShockFracture: 0,
    })
  }

  // 6. Machined V-Block with Clamp & Reference Shaft (upper-left granite inspection setup)
  {
    const root = new Group()
    root.name = 'prop-v-block-clamp'
    addContactPad(root, 0.068, 0.056)

    // Left and right V-block cheeks forming the 90-degree V-cradle
    const baseBlock = new Mesh(ownGeo(new BoxGeometry(0.058, 0.048, 0.022)), brushedSteel)
    baseBlock.position.set(0, 0, 0.011)

    const leftCheek = new Mesh(ownGeo(new BoxGeometry(0.058, 0.015, 0.022)), satinChrome)
    leftCheek.position.set(0, -0.0165, 0.031)
    const rightCheek = new Mesh(ownGeo(new BoxGeometry(0.058, 0.015, 0.022)), satinChrome)
    rightCheek.position.set(0, 0.0165, 0.031)

    // Precision ground steel test shaft resting in the V-groove
    const testShaftGeo = ownGeo(new CylinderGeometry(0.0085, 0.0085, 0.082, 20))
    testShaftGeo.rotateZ(Math.PI / 2)
    const testShaft = new Mesh(testShaftGeo, lappedSteel)
    testShaft.position.set(0.006, 0, 0.034)

    // U-clamp bridge + knurled thumbscrew holding the shaft
    const clampBridge = new Mesh(ownGeo(new BoxGeometry(0.014, 0.054, 0.005)), darkAnodized)
    clampBridge.position.set(-0.004, 0, 0.052)
    const clampLeftLeg = new Mesh(ownGeo(new BoxGeometry(0.014, 0.005, 0.030)), darkAnodized)
    clampLeftLeg.position.set(-0.004, -0.025, 0.037)
    const clampRightLeg = new Mesh(ownGeo(new BoxGeometry(0.014, 0.005, 0.030)), darkAnodized)
    clampRightLeg.position.set(-0.004, 0.025, 0.037)

    const clampScrewGeo = ownGeo(new CylinderGeometry(0.0045, 0.0045, 0.022, 14))
    clampScrewGeo.rotateX(Math.PI / 2)
    const clampScrew = new Mesh(clampScrewGeo, knurledBrass)
    clampScrew.position.set(-0.004, 0, 0.058)

    root.add(baseBlock, leftCheek, rightCheek, testShaft, clampBridge, clampLeftLeg, clampRightLeg, clampScrew)
    group.add(root)

    const homeX = -0.445
    const homeY = 0.168
    const homeTheta = 0.24
    props.push({
      id: 'v-block-clamp',
      kind: 'fixture',
      root,
      homeX,
      homeY,
      homeTheta,
      radius: 0.036,
      interactionRadius: 0.075,
      mass: 2.2,
      maxOffset: 0.024,
      x: homeX,
      y: homeY,
      theta: homeTheta,
      vx: 0,
      vy: 0,
      vTheta: 0,
      rollAngle: 0,
      lastShockFracture: 0,
    })
  }

  // 7. Height Gauge with Dial Test Indicator (standing on upper-left granite slab, indicating the V-block shaft)
  {
    const root = new Group()
    root.name = 'prop-height-gauge-dial'
    addContactPad(root, 0.092, 0.068)

    // Stepped cast-iron/granite-matched base
    const baseLower = new Mesh(ownGeo(new BoxGeometry(0.086, 0.062, 0.016)), hammertoneFrame)
    baseLower.position.set(0, 0, 0.008)
    const baseUpper = new Mesh(ownGeo(new BoxGeometry(0.068, 0.048, 0.014)), darkAnodized)
    baseUpper.position.set(-0.006, 0, 0.023)

    // Twin vertical stainless steel columns + top bridge
    const colGeo = ownGeo(new CylinderGeometry(0.0052, 0.0052, 0.210, 18))
    colGeo.rotateX(Math.PI / 2)
    const colA = new Mesh(colGeo, lappedSteel)
    colA.position.set(-0.012, -0.012, 0.125)
    const colB = new Mesh(colGeo, lappedSteel)
    colB.position.set(-0.012, 0.012, 0.125)

    const topCap = new Mesh(ownGeo(new BoxGeometry(0.024, 0.042, 0.012)), darkAnodized)
    topCap.position.set(-0.012, 0, 0.232)

    // Sliding elevation carriage + handwheel at z = 0.062 m
    const carriageZ = 0.062
    const carriage = new Mesh(ownGeo(new BoxGeometry(0.032, 0.046, 0.028)), hammertoneFrame)
    carriage.position.set(-0.008, 0, carriageZ)

    const wheelGeo = ownGeo(new CylinderGeometry(0.011, 0.011, 0.008, 18))
    const handwheel = new Mesh(wheelGeo, knurledBrass)
    handwheel.position.set(-0.008, -0.027, carriageZ)

    // Horizontal indicator extension arm reaching toward the V-block
    const armBar = new Mesh(ownGeo(new BoxGeometry(0.088, 0.008, 0.009)), satinChrome)
    armBar.position.set(0.038, 0.008, carriageZ + 0.002)

    const swivelClamp = new Mesh(ownGeo(new BoxGeometry(0.014, 0.016, 0.016)), darkAnodized)
    swivelClamp.position.set(0.072, 0.008, carriageZ + 0.002)

    // Dial Test Indicator (bezel + white dial face + needle + ruby stylus tip)
    const dialGroup = new Group()
    dialGroup.position.set(0.084, 0.008, carriageZ - 0.008)
    dialGroup.rotation.y = 0.32

    const dialBody = new Mesh(ownGeo(new CylinderGeometry(0.0165, 0.0165, 0.009, 24)), knurledBrass)
    dialBody.rotation.x = Math.PI / 2

    const dialFace = new Mesh(ownGeo(new CylinderGeometry(0.0142, 0.0142, 0.0096, 24)), dialFaceMat)
    dialFace.rotation.x = Math.PI / 2

    const dialRim = new Mesh(ownGeo(new RingGeometry(0.0138, 0.0166, 24)), satinChrome)
    dialRim.position.set(0, 0, 0.005)

    const dialNeedle = new Mesh(ownGeo(new BoxGeometry(0.011, 0.0014, 0.001)), noGoRedAnodized)
    dialNeedle.position.set(0.003, 0.002, 0.0054)
    dialNeedle.rotation.z = 0.45

    const stylusStemGeo = ownGeo(new CylinderGeometry(0.0012, 0.0008, 0.024, 10))
    stylusStemGeo.rotateZ(Math.PI / 2)
    const stylusStem = new Mesh(stylusStemGeo, lappedSteel)
    stylusStem.position.set(0.022, -0.008, -0.006)
    stylusStem.rotation.y = 0.38

    const rubyBall = new Mesh(ownGeo(new CylinderGeometry(0.0018, 0.0018, 0.0028, 12)), rubyStylusMat)
    rubyBall.position.set(0.032, -0.008, -0.011)

    dialGroup.add(dialBody, dialFace, dialRim, dialNeedle, stylusStem, rubyBall)
    root.add(baseLower, baseUpper, colA, colB, topCap, carriage, handwheel, armBar, swivelClamp, dialGroup)
    group.add(root)

    const homeX = -0.542
    const homeY = 0.215
    const homeTheta = -0.36
    props.push({
      id: 'height-gauge-dial',
      kind: 'fixture',
      root,
      homeX,
      homeY,
      homeTheta,
      radius: 0.048,
      interactionRadius: 0.075,
      mass: 3.5,
      maxOffset: 0.016,
      x: homeX,
      y: homeY,
      theta: homeTheta,
      vx: 0,
      vy: 0,
      vTheta: 0,
      rollAngle: 0,
      lastShockFracture: 0,
    })
  }

  // Initialize transforms at home positions
  const syncPropTransform = (p: InteractivePropState) => {
    p.root.position.set(p.x, p.y, deskZ)
    p.root.rotation.set(0, 0, p.theta)
    if (p.rollerMesh) {
      p.rollerMesh.rotation.set(p.rollAngle, 0, 0)
    }
  }
  for (const p of props) syncPropTransform(p)

  // Pointer & raycast state
  const pointerNdc = new Vector2(99, 99)
  let pointerPending = false
  let hasPrevCursor = false
  const prevCursorLocal = new Vector2()
  const currCursorLocal = new Vector2()
  let lastCursorReport: [number, number] | null = null
  let interactionCount = 0

  const raycaster = new Raycaster()
  const inverseSheet = new Matrix4()
  const localRayOrigin = new Vector3()
  const localRayDir = new Vector3()

  const applyPropImpulse = (p: InteractivePropState, ix: number, iy: number, iTheta = 0) => {
    const invMass = 1 / Math.max(0.25, p.mass)
    p.vx += ix * invMass
    p.vy += iy * invMass
    p.vTheta += iTheta * invMass
    interactionCount++
  }

  const onPointerMove = (ndcX: number, ndcY: number) => {
    if (!Number.isFinite(ndcX) || !Number.isFinite(ndcY)) return
    pointerNdc.set(ndcX, ndcY)
    pointerPending = true
  }

  const nudgeProp = (id: string, impulseX: number, impulseY: number, impulseTheta = 0): boolean => {
    const target = props.find(p => p.id === id)
    if (!target) return false
    applyPropImpulse(target, impulseX, impulseY, impulseTheta)
    const dt = 1 / 60
    stepPhysics(dt)
    return true
  }

  const stepPhysics = (dt: number) => {
    const clampedDt = Math.min(0.033, Math.max(0.001, dt > 0 ? dt : 1 / 60))

    // Pairwise soft repulsion between nearby movable props
    for (let i = 0; i < props.length; i++) {
      const a = props[i]
      for (let j = i + 1; j < props.length; j++) {
        const b = props[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const minDist = (a.radius + b.radius) * 0.78
        const dist = Math.hypot(dx, dy)
        if (dist > 1e-5 && dist < minDist) {
          const push = (minDist - dist) * 4.5 * clampedDt
          const nx = dx / dist
          const ny = dy / dist
          if (a.kind !== 'fixture') {
            a.vx -= nx * push / a.mass
            a.vy -= ny * push / a.mass
          }
          if (b.kind !== 'fixture') {
            b.vx += nx * push / b.mass
            b.vy += ny * push / b.mass
          }
        }
      }
    }

    for (const p of props) {
      // Gentle return spring toward a bounded neighborhood around home so pieces never drift off the slab
      const offsetX = p.x - p.homeX
      const offsetY = p.y - p.homeY
      const springK = p.kind === 'roller' ? 1.35 : p.kind === 'slider' ? 1.85 : 6.0
      p.vx -= offsetX * springK * clampedDt
      p.vy -= offsetY * springK * clampedDt
      p.vTheta -= (p.theta - p.homeTheta) * (springK * 1.4) * clampedDt

      // Surface damping (rolling resistance is lower than lapped steel sliding friction)
      const linearDamping = p.kind === 'roller' ? 3.4 : p.kind === 'slider' ? 7.2 : 12.0
      const angularDamping = p.kind === 'roller' ? 5.2 : 8.5
      const linFactor = Math.exp(-linearDamping * clampedDt)
      const angFactor = Math.exp(-angularDamping * clampedDt)
      p.vx *= linFactor
      p.vy *= linFactor
      p.vTheta *= angFactor

      const stepX = p.vx * clampedDt
      const stepY = p.vy * clampedDt
      p.x += stepX
      p.y += stepY
      p.theta += p.vTheta * clampedDt

      // Soft max-offset leash around home
      const newOffsetX = p.x - p.homeX
      const newOffsetY = p.y - p.homeY
      const newDist = Math.hypot(newOffsetX, newOffsetY)
      if (newDist > p.maxOffset) {
        const scale = p.maxOffset / newDist
        p.x = p.homeX + newOffsetX * scale
        p.y = p.homeY + newOffsetY * scale
        p.vx *= 0.4
        p.vy *= 0.4
      }

      // Keep outside the vellum drawing frame so props never cover the blueprint views
      if (Math.abs(p.x) < SHEET_KEEP_OUT_HALF_X && Math.abs(p.y) < SHEET_KEEP_OUT_HALF_Y) {
        const penX = SHEET_KEEP_OUT_HALF_X - Math.abs(p.x)
        const penY = SHEET_KEEP_OUT_HALF_Y - Math.abs(p.y)
        if (penX < penY) {
          p.x = Math.sign(p.x || p.homeX || 1) * SHEET_KEEP_OUT_HALF_X
          p.vx *= -0.35
        } else {
          p.y = Math.sign(p.y || p.homeY || -1) * SHEET_KEEP_OUT_HALF_Y
          p.vy *= -0.35
        }
      }

      // Keep inside the granite surface plate perimeter
      p.x = Math.max(-GRANITE_KEEP_IN_HALF_X, Math.min(GRANITE_KEEP_IN_HALF_X, p.x))
      p.y = Math.max(-GRANITE_KEEP_IN_HALF_Y, Math.min(GRANITE_KEEP_IN_HALF_Y, p.y))

      // Couple cylindrical roller spin to transverse displacement (ds / radius)
      if (p.kind === 'roller' && p.rollerMesh) {
        const normalX = -Math.sin(p.theta)
        const normalY = Math.cos(p.theta)
        const transverseDisp = stepX * normalX + stepY * normalY
        p.rollAngle -= transverseDisp / Math.max(0.002, p.radius)
      }

      syncPropTransform(p)
    }
  }

  const update = (frame: DrawingFrameInput, context: ExtractionContext, camera: Camera) => {
    const proof = frame.proofMode === 'drawing-edges'
    const retirement = proof || frame.reducedMotion ? 0 : Math.max(0, Math.min(1, frame.retirement))
    const surroundings = Math.max(0, Math.min(1, frame.surroundingsOpacity ?? 1)) * (1 - retirement)
    const stockVisible = (retirement < 1 || frame.reducedMotion) && !proof && surroundings > 0.01

    group.matrix.copy(context.sheetMatrix)
    group.matrixWorldNeedsUpdate = true
    group.visible = stockVisible
    if (!stockVisible) return

    // Modulate metallic sheen slightly with lampPower so daytime is bright & crisp
    const lampPower = frame.reducedMotion ? 1 : frame.intro.lampPower
    const envIntensity = 0.38 + 0.82 * lampPower
    for (const mat of materials) {
      if (mat instanceof MeshStandardMaterial && mat !== shadowMat) {
        mat.envMapIntensity = envIntensity
      }
    }

    // Breakthrough shockwave physical jolt on the loose pencil, plug pins, and gauge blocks
    const fracture = frame.reducedMotion ? 0 : frame.intro.fracture
    for (const p of props) {
      if (fracture > 0.04 && p.lastShockFracture <= 0.04 && !frame.reducedMotion) {
        const rx = p.homeX + 0.119
        const ry = p.homeY + 0.038
        const rLen = Math.max(0.1, Math.hypot(rx, ry))
        const blast = p.kind === 'roller' ? 0.042 : p.kind === 'slider' ? 0.026 : 0.006
        applyPropImpulse(p, (rx / rLen) * blast, (ry / rLen) * blast, (rx > 0 ? 1 : -1) * 0.18)
      }
      p.lastShockFracture = fracture
    }

    // Raycast cursor onto the sheet/granite plane z = 0 when pointer moves
    if (pointerPending) {
      pointerPending = false
      raycaster.setFromCamera(pointerNdc, camera)
      inverseSheet.copy(context.sheetMatrix).invert()
      localRayOrigin.copy(raycaster.ray.origin).applyMatrix4(inverseSheet)
      localRayDir.copy(raycaster.ray.direction).transformDirection(inverseSheet).normalize()

      if (Math.abs(localRayDir.z) > 1e-4) {
        const tHit = (deskZ - localRayOrigin.z) / localRayDir.z
        if (tHit > 0 && tHit < 8.0) {
          const hitX = localRayOrigin.x + localRayDir.x * tHit
          const hitY = localRayOrigin.y + localRayDir.y * tHit
          currCursorLocal.set(hitX, hitY)
          lastCursorReport = [hitX, hitY]

          const cursorVx = hasPrevCursor ? (currCursorLocal.x - prevCursorLocal.x) : 0
          const cursorVy = hasPrevCursor ? (currCursorLocal.y - prevCursorLocal.y) : 0
          prevCursorLocal.copy(currCursorLocal)
          hasPrevCursor = true

          const cursorSpeed = Math.hypot(cursorVx, cursorVy)
          for (const p of props) {
            const dx = p.x - hitX
            const dy = p.y - hitY
            const dist = Math.hypot(dx, dy)
            if (dist < p.interactionRadius) {
              const falloff = Math.pow(1 - dist / p.interactionRadius, 1.45)
              const nx = dist > 1e-5 ? dx / dist : Math.cos(p.theta + Math.PI / 2)
              const ny = dist > 1e-5 ? dy / dist : Math.sin(p.theta + Math.PI / 2)
              // Combine cursor velocity drag + gentle radial scoot away from cursor tip
              const dragGain = p.kind === 'roller' ? 1.65 : p.kind === 'slider' ? 1.25 : 0.35
              const radialPush = p.kind === 'roller' ? 0.022 : p.kind === 'slider' ? 0.015 : 0.004
              const ix = (cursorVx * dragGain + nx * radialPush * (0.35 + Math.min(1.5, cursorSpeed * 18))) * falloff
              const iy = (cursorVy * dragGain + ny * radialPush * (0.35 + Math.min(1.5, cursorSpeed * 18))) * falloff
              // Torque from off-center cursor push
              const relX = hitX - p.x
              const relY = hitY - p.y
              const torque = (relX * iy - relY * ix) * 18.0
              applyPropImpulse(p, ix, iy, torque)
            }
          }
        }
      }
    }

    stepPhysics(frame.delta)
  }

  const snapshot = (): MetrologyWorkbenchTelemetry => ({
    visible: group.visible,
    lastCursorLocal: lastCursorReport,
    interactionCount,
    props: props.map(p => ({
      id: p.id,
      kind: p.kind,
      position: [
        Number(p.x.toFixed(5)),
        Number(p.y.toFixed(5)),
        Number(deskZ.toFixed(5)),
      ],
      rotationZ: Number(p.theta.toFixed(4)),
      rollAngle: Number(p.rollAngle.toFixed(4)),
      displacedMm: Number((Math.hypot(p.x - p.homeX, p.y - p.homeY) * 1000).toFixed(2)),
    })),
  })

  const dispose = () => {
    group.removeFromParent()
    group.clear()
    for (const g of geometries) g.dispose()
    for (const m of materials) m.dispose()
    geometries.clear()
    materials.clear()
  }

  return { group, props, onPointerMove, nudgeProp, update, snapshot, dispose }
}

