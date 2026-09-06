import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Group, MathUtils, MeshBasicMaterial, Object3D } from 'three'
import { createCadTransitionMaterial } from '../shaders/CadTransitionShader'
import { buildWrenchRig } from './rig/nodeRoles'
import {
  CLUTCH_SHIFT_DISTANCE,
  EXPLODE_OFFSETS,
  GB_FASTENER_POP_COMPLETE,
  GB_FASTENER_POP_M,
  GEAR_RATIOS,
  RING_SWITCH_ROTATION,
  RING_SWITCH_TRAVEL_Z,
  ROTATION_TURNS,
  STAGE_IDS,
} from '../data/caseStudies'
import { getScrollState, telemetry } from '../state/scrollStore'
import { getQuality } from '../state/qualityStore'
import type { MaterialMode } from '../types/portfolio'
import { Hotspots } from './Hotspots'
import { DrawingLinework } from './drawing/DrawingLinework'
import { drawingIntroState, remapHeroProgress } from './drawing/introTimeline'

gsap.registerPlugin(ScrollTrigger)

const MODEL_URL = '/models/Default.glb'
const GHOST_OPACITY = 0.15
/** Total gearRotation proxy sweep across the gear-rotation window. The
 * per-carrier DISPLAY angles come from ROTATION_TURNS (pass 3): the sweep's
 * scroll-driven shape is kept, but each carrier completes its display turns
 * instead of its raw ratio fraction (0.32/0.088/0.024-turn tails would read
 * as frozen). */
const GEAR_ROTATION_SWEEP = Math.PI * 8

// Draco decoders are vendored with the site (public/draco, copied from
// three's examples) instead of drei's default gstatic CDN fetch — remote
// decoder fetches stall offline and headless loads. Module-scope, so it must
// run before useGLTF.preload at the bottom of this file.
useGLTF.setDecoderPath('/draco/')

/**
 * Module 2 — exploded torque wrench & planetary kinematic rig.
 *
 * Loads /models/Default.glb (jgun-full.glb renamed; the split
 * jgun-gearbox.glb / jgun-handle.glb derivatives live alongside it for a
 * future streaming pass). Node identity comes from buildWrenchRig — the
 * D1-AP 2-speed part-number table, never guessed mesh names.
 *
 * The GSAP ScrollTrigger timeline is scrubbed across chapter 2 and animates a
 * plain proxy object; useFrame applies the proxy each frame so GSAP never
 * fights the R3F render loop:
 *   1. shift        — two-speed clutch slide (ring switch / fork / cam / pins)
 *   2. spin         — initial lateral rotation (hover parallax layered in useFrame)
 *   3. gearRotation — epicyclic sweep: each carrier turns about the train axis
 *                     at its stage ratio while its planets counter-rotate on
 *                     their pins
 *   4. ghost        — housing alpha fade to ghost wireframe territory (0.15)
 *   5. explode      — rear extraction: all five stages + clutch pull out the
 *                     −Z bore (staggered; stage 1 travels furthest), only the
 *                     output spindle exits +Z through the snout, and the
 *                     handle backs off furthest (see EXPLODE_OFFSETS)
 * The material mode switcher ([ SOLID PBR ] / [ BLUEPRINT WIREFRAME ] /
 * [ EXPLODED ASSEMBLY ]) is UI-driven via the scroll store.
 */
export function TorqueWrenchHero() {
  const { scene } = useGLTF(MODEL_URL)
  const group = useRef<Group>(null)
  const inner = useRef<Group>(null)
  const modelRoot = useRef<Group>(null)
  const rig = useMemo(() => {
    const r = buildWrenchRig(scene)
    if (typeof window !== 'undefined') (window as unknown as Record<string, unknown>).__rig = r
    return r
  }, [scene])
  const anim = useRef({ spin: 0, ghost: 0, explode: 0, gearRotation: 0, shift: 0 }).current
  const idleAngle = useRef(0)
  const surface = useRef<'live' | 'cad' | 'fade'>('live')
  const lastMode = useRef<MaterialMode>('solid')

  // Sweep bounds are measured in the GLTF scene frame (nodeRoles), while the
  // shader evaluates the sweep inside the recentered inner group (scene
  // translated by -center) — shift the bounds into that frame to match.
  // uRootInv (that group's inverse world matrix) is refreshed every frame
  // below, so rotation/parallax never drift the scanline. Carrier rotation
  // is about Z, so it never shifts part Z out of the sweep either.
  const cadMaterial = useMemo(
    () =>
      createCadTransitionMaterial({
        sweepMin: rig.sweepMin - rig.center.z,
        sweepMax: rig.sweepMax - rig.center.z,
      }),
    [rig],
  )
  const blueprintMaterial = useMemo(
    () =>
      new MeshBasicMaterial({ color: '#38e8ff', wireframe: true, transparent: true, opacity: 0.35 }),
    [],
  )

  useLayoutEffect(() => {
    // Reduced motion: no scroll-driven timeline at all — the wrench holds its
    // hero pose and only the explicit material-mode switcher stays live.
    if (getQuality().reducedMotion) return

    const timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '[data-chapter="1"]',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.6,
      },
    })
    timeline
      // B1/B2 reserve the intro; retained B3 channels keep their order.
      .to(anim, { spin: 1, duration: 0.35 }, 0.12)
      // 2. Continuous gear sweep through the extraction
      .to(anim, { gearRotation: GEAR_ROTATION_SWEEP, duration: 0.9 }, 0.12)
      // 3. Housing ghost in: outer shell fades to transparent (0.15) to reveal internals
      .to(anim, { ghost: 1, duration: 0.20 }, 0.27)
      // 4. Rear extraction: reduction stages extract rearward out of the housing
      .to(anim, { explode: 1, duration: 0.50 }, 0.47)
      // 5. Housing ghost out: transitions back away from transparency to solid opaque
      //    around the ~40% global progress mark as components clear the shell.
      .to(anim, { ghost: 0, duration: 0.25 }, 0.54)

    return () => {
      timeline.scrollTrigger?.kill()
      timeline.kill()
    }
  }, [anim])

  const applyLiveMaterials = (mode: MaterialMode): void => {
    for (const mesh of rig.meshes) {
      const original = rig.originalMaterials.get(mesh)
      if (!original) continue
      mesh.material = mode === 'blueprint' ? blueprintMaterial : original
    }
  }

  const offsetZ = (node: Object3D | null, offset: number): void => {
    if (!node) return
    const base = rig.basePositions.get(node)
    if (base) node.position.z = base.z + offset
  }

  /**
   * Shift mechanism: the fork train (shifter fork P000724, shifter cam P000297)
   * slides −Z while the ring switch assembly (P003068 knurled ring, 3× P000464
   * pins, 3× K000156 ball plungers) follows the cam groove in P000420 — traveling
   * +Z (away from handle) and rotating +120° (CCW when viewed from rear).
   * Called every frame from useFrame with the current shift value (0→1).
   */
  const applyShift = (shift: number): void => {
    // Fork train — slides toward handle (−Z)
    offsetZ(rig.clutch.sliding, shift * CLUTCH_SHIFT_DISTANCE)
    // Ring switch — travels +Z along cam groove with simultaneous positive rotation
    const rs = rig.clutch.ringSwitch
    if (rs) {
      const base = rig.basePositions.get(rs)
      if (base) {
        rs.position.z = base.z + shift * RING_SWITCH_TRAVEL_Z
        rs.rotation.z = +shift * RING_SWITCH_ROTATION  // +Z travel = positive rotation
      }
    }
  }

  /** Rear extraction + snout exit, driven by the explode factor 0..1. */
  const applyExplosion = (explode: number, shift: number): void => {
    offsetZ(rig.outputShaft, EXPLODE_OFFSETS.output * explode)
    for (const id of STAGE_IDS) {
      offsetZ(rig.stages[id].carrier, EXPLODE_OFFSETS[id] * explode)
    }
    // K000004 bearing ring parks between A000606 (stage 5) and stage 2.
    offsetZ(rig.bearing, EXPLODE_OFFSETS.bearing * explode)
    offsetZ(rig.clutch.static, EXPLODE_OFFSETS.clutch * explode)
    // Fork train rides the clutch explosion offset plus its own shift travel
    offsetZ(rig.clutch.sliding, EXPLODE_OFFSETS.clutch * explode + shift * CLUTCH_SHIFT_DISTANCE)
    // Ring switch also rides the clutch explosion, plus its own cam travel
    const rs = rig.clutch.ringSwitch
    if (rs) {
      const base = rig.basePositions.get(rs)
      if (base) {
        rs.position.z = base.z + EXPLODE_OFFSETS.clutch * explode + shift * RING_SWITCH_TRAVEL_Z
        rs.rotation.z = +shift * RING_SWITCH_ROTATION
      }
    }
    offsetZ(rig.handleRoot, EXPLODE_OFFSETS.handle * explode)
    // Gearbox radial bolts (90910A815): pop outward along their own radial
    // axes on the explode's LEADING edge (fully out by
    // GB_FASTENER_POP_COMPLETE, ahead of the rear extraction), then ride the
    // clutch — their groups are clutch-static children, so the offsetZ above
    // already carries them.
    for (const f of rig.gbFasteners) {
      const base = rig.basePositions.get(f.group)
      if (!base) continue
      const t = MathUtils.clamp(explode / GB_FASTENER_POP_COMPLETE, 0, 1)
      const pop = GB_FASTENER_POP_M * t * t * (3 - 2 * t)
      f.group.position.set(base.x + f.dir.x * pop, base.y + f.dir.y * pop, base.z)
    }
  }

  /**
   * Epicyclic rotation: each carrier turns about the gear-train axis while
   * each planet counter-rotates on its own pin (planet groups are carrier
   * children, so they also revolve with it). Pass-3 display turns: the proxy
   * sweep is normalized 0..1 and remapped through ROTATION_TURNS so stage 1/2
   * spin exactly 2× their kinematic turns and the slow tail (0.32/0.088/0.024
   * turns at the true ratios) still reads as motion; GEAR_RATIOS keeps the
   * kinematic reference, and planets stay pegged to their carrier's display
   * angle via the multiplier.
  /**
   * Epicyclic rotation: each carrier turns about the gear-train axis while
   * each planet counter-rotates on its own pin (planet groups are carrier
   * children, so they also revolve with it). Pass-3 display turns: the proxy
   * sweep is normalized 0..1 and remapped through ROTATION_TURNS so stage 1/2
   * spin exactly 2× their kinematic turns and the slow tail (0.32/0.088/0.024
   * turns at the true ratios) still reads as motion; GEAR_RATIOS keeps the
   * kinematic reference, and planets stay pegged to their carrier's display
   * angle via the multiplier.
   *
   * Continuous Kinematic Idling (Milestone 4):
   * When scroll pauses during CH.02 explosion range, idle rotation accumulates
   * delta-time at a rate proportional to each stage's ROTATION_TURNS and blends
   * seamlessly with scroll-driven sweep without pops or jumps.
   */
  const applyGearRotation = (angle: number, idle: number = 0): void => {
    const sweep = angle / GEAR_ROTATION_SWEEP
    for (const id of STAGE_IDS) {
      const stage = rig.stages[id]
      const turns = ROTATION_TURNS[id]
      const carrierAngle = (sweep + idle) * turns * Math.PI * 2
      if (stage.carrier) stage.carrier.rotation.z = carrierAngle
      const planetAngle = -carrierAngle * GEAR_RATIOS.planetMultiplier
      for (const planet of stage.planets) planet.rotation.z = planetAngle
    }
  }

  const writeRigTelemetry = (explode: number, ghostOpacity: number, shift: number): void => {
    telemetry.rig.handleZ = rig.handleRoot?.position.z ?? 0
    telemetry.rig.outputZ = rig.outputShaft?.position.z ?? 0
    telemetry.rig.clutchZ = rig.clutch.static?.position.z ?? 0
    telemetry.rig.slidingZ = rig.clutch.sliding?.position.z ?? 0
    telemetry.rig.stageZ = STAGE_IDS.map((id) => rig.stages[id].carrier?.position.z ?? 0)
    telemetry.rig.stageRot = STAGE_IDS.map((id) => rig.stages[id].carrier?.rotation.z ?? 0)
    telemetry.rig.planetRot = rig.stages.stage1.planets[0]?.rotation.z ?? 0
    telemetry.rig.gearRotation = anim.gearRotation
    telemetry.rig.shift = shift
    telemetry.rig.ghostOpacity = ghostOpacity
    telemetry.rig.ghostCount = rig.ghostMaterials.size
    telemetry.rig.explodeFactor = explode
    // CR-1 ring-switch telemetry: verify +Z travel and rotation
    telemetry.rig.ringSwitchZ = rig.clutch.ringSwitch?.position.z ?? 0
    telemetry.rig.ringSwitchRotZ = rig.clutch.ringSwitch?.rotation.z ?? 0
  }

  useFrame((state, delta) => {
    const { progress, chapter, chapterProgress, materialMode } = getScrollState()
    const { tier, reducedMotion } = getQuality()

    // Reduced motion: hold the hero pose — no spin, no parallax, no ghost
    // fade, no gear rotation, no clutch shift, no scroll-driven explosion.
    // The material-mode switcher (an explicit user action, not motion) is the
    // only thing that still mutates the scene.
    if (reducedMotion) {
      if (modelRoot.current) modelRoot.current.visible = false
      if (group.current) {
        group.current.rotation.y = 0
        group.current.rotation.x = 0
      }
      applyGearRotation(0, 0)
      const explode = materialMode === 'exploded' ? 1 : 0
      applyExplosion(explode, 0)
      // Ghost never fades under reduced motion, so its commanded opacity is 1.
      writeRigTelemetry(explode, 1, 0)
      if (surface.current !== 'live' || lastMode.current !== materialMode) {
        applyLiveMaterials(materialMode)
        surface.current = 'live'
      }
      lastMode.current = materialMode
      return
    }

    // B2: the PBR model starts just below the live edge elevation and rises
    // into the exact same local frame. The linework is a clone of this GLB's
    // geometry, so at handoff=1 both representations have identical matrices.
    const intro = drawingIntroState(progress)
    if (modelRoot.current) {
      const proofMode = (window as unknown as Record<string, unknown>).__drawingProofMode
      const forceModel = proofMode === 'model' || proofMode === 'registered'
      modelRoot.current.visible = proofMode === 'lines' ? false : forceModel || intro.modelOpacity > 0.001
      modelRoot.current.position.y = forceModel ? 0 : (1 - intro.modelOpacity) * -0.045
    }

    // 1. Lateral rotation + hover parallax.
    if (group.current) {
      group.current.rotation.y = anim.spin * Math.PI * 0.85 + state.pointer.x * 0.08
      group.current.rotation.x = MathUtils.lerp(
        group.current.rotation.x,
        state.pointer.y * 0.05,
        0.1,
      )
    }

    // 2. Housing ghost fade (suppressed in blueprint mode — everything is wire).
    const ghostAmount = materialMode === 'blueprint' ? 0 : anim.ghost
    const ghostOpacity = MathUtils.lerp(1, GHOST_OPACITY, ghostAmount)
    for (const material of rig.ghostMaterials.values()) {
      material.opacity = ghostOpacity
      material.depthWrite = material.opacity > 0.5
    }

    // 3. Continuous Kinematic Idling & Epicyclic gear rotation:
    // When in CH.02 explosion range where gears are visible, accumulate delta-time
    // so all 5 stage carriers continuously rotate around their pitch circles during
    // scroll pauses. Blends seamlessly with scroll-driven rotation.
    const isExploded = anim.explode > 0.01 || (chapter === 1 && progress >= 0.22 && progress <= 0.55)
    if (isExploded && materialMode !== 'exploded') {
      const IDLE_BASE_SPEED = 0.25
      idleAngle.current += delta * IDLE_BASE_SPEED
    } else if (anim.explode === 0 && anim.gearRotation === 0) {
      idleAngle.current = 0
    }
    applyGearRotation(anim.gearRotation, idleAngle.current)

    // 4. Clutch shift window in CH.01:
    // B3 is remapped after B1/B2. Values preserve the old 0.05→0.17 local
    // order while giving the shared drawing/model handoff room to settle.
    let shiftAmount = 0
    const shiftInStart = remapHeroProgress(0.05)
    const shiftInEnd = remapHeroProgress(0.10)
    const shiftHoldEnd = remapHeroProgress(0.12)
    const shiftOutEnd = remapHeroProgress(0.17)
    if (progress >= shiftInStart && progress < shiftInEnd) {
      shiftAmount = MathUtils.smoothstep(progress, shiftInStart, shiftInEnd)
    } else if (progress >= shiftInEnd && progress <= shiftHoldEnd) {
      shiftAmount = 1
    } else if (progress > shiftHoldEnd && progress <= shiftOutEnd) {
      shiftAmount = 1 - MathUtils.smoothstep(progress, shiftHoldEnd, shiftOutEnd)
    }
    applyShift(shiftAmount)

    // 5. Rear extraction (forced fully open in exploded mode).
    const explode = Math.max(anim.explode, materialMode === 'exploded' ? 1 : 0)
    applyExplosion(explode, shiftAmount)
    writeRigTelemetry(explode, ghostOpacity, shiftAmount)

    // 5. Material surface management: CAD dissolve owns chapter 4, the mode
    //    switcher owns everything else. In the lite tier the dissolve shader
    //    is retired: chapter 4 falls back to a plain opacity ramp into the
    //    blueprint wireframe instead of the GLSL scanline dissolve.
    //    `chapter` is written by ScrollTrigger callbacks (ScrollRig) and can
    //    LAG progress on fast multi-chapter bounces — a stale chapter===3 at
    //    ~0.53 flashed the dissolve onto the visible exploded wrench (owner
    //    report 2026-08-30; housing rear + square drive = the sweep's Z
    //    ends). AND-gate both chapter-4 surfaces on raw progress (CH.04
    //    starts at 0.760; 0.755 tolerates entry-side lag invisibly) so a
    //    laggy chapter can never activate them outside the window.
    const wantCad = chapter === 3 && progress >= 0.775 && tier === 'full'
    const wantLiteFade = chapter === 3 && progress >= 0.775 && tier !== 'full'
    if (wantCad && surface.current !== 'cad') {
      for (const mesh of rig.meshes) mesh.material = cadMaterial
      surface.current = 'cad'
    } else if (wantLiteFade) {
      if (surface.current !== 'fade') {
        for (const mesh of rig.meshes) mesh.material = blueprintMaterial
        surface.current = 'fade'
      }
      blueprintMaterial.opacity = MathUtils.lerp(0.08, 0.35, chapterProgress)
    } else if (!wantCad && !wantLiteFade && (surface.current !== 'live' || lastMode.current !== materialMode)) {
      blueprintMaterial.opacity = 0.35
      applyLiveMaterials(materialMode)
      surface.current = 'live'
    }
    lastMode.current = materialMode

    if (inner.current) {
      cadMaterial.uniforms.uRootInv.value.copy(inner.current.matrixWorld).invert()
    }
    cadMaterial.uniforms.uTime.value += delta
    if (wantCad) {
      cadMaterial.uniforms.uProgress.value = chapterProgress
    }
  })

  // Recenter the wrench midpoint at the group origin so camera keyframes and
  // explosion offsets work in a clean local space.
  return (
      <group ref={group}>
      <group ref={inner} position={[-rig.center.x, -rig.center.y, -rig.center.z]}>
        <DrawingLinework />
        <group ref={modelRoot}>
          <primitive object={scene} />
          <Hotspots />
        </group>
      </group>
    </group>
  )
}

useGLTF.preload(MODEL_URL)
