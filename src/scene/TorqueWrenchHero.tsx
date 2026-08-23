import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Group, MathUtils, MeshBasicMaterial, Object3D } from 'three'
import { createCadTransitionMaterial } from '../shaders/CadTransitionShader'
import { buildWrenchRig } from './rig/nodeRoles'
import { EXPLODE_OFFSETS } from '../data/caseStudies'
import { getScrollState } from '../state/scrollStore'
import { getQuality } from '../state/qualityStore'
import type { MaterialMode } from '../types/portfolio'
import { Hotspots } from './Hotspots'

gsap.registerPlugin(ScrollTrigger)

const MODEL_URL = '/models/Default.glb'
const GHOST_OPACITY = 0.15

/**
 * Module 2 — exploded torque wrench & planetary kinematic rig.
 *
 * Loads /models/Default.glb (jgun-full.glb renamed; the split
 * jgun-gearbox.glb / jgun-handle.glb derivatives live alongside it for a
 * future streaming pass). Node identity comes from buildWrenchRig — real
 * assembly names, never guessed mesh names.
 *
 * The GSAP ScrollTrigger timeline is scrubbed across chapter 2 and animates a
 * plain proxy object; useFrame applies the proxy each frame so GSAP never
 * fights the R3F render loop:
 *   1. spin    — initial lateral rotation (hover parallax layered in useFrame)
 *   2. ghost   — housing alpha fade to ghost wireframe territory (0.15)
 *   3. explode — multi-stage axial explosion (0.35 m total spread, see
 *                EXPLODE_OFFSETS: handle -0.175, stage1 +0.0875, stage2 +0.175)
 * The material mode switcher ([ SOLID PBR ] / [ BLUEPRINT WIREFRAME ] /
 * [ EXPLODED ASSEMBLY ]) is UI-driven via the scroll store.
 */
export function TorqueWrenchHero() {
  const { scene } = useGLTF(MODEL_URL)
  const group = useRef<Group>(null)
  const rig = useMemo(() => buildWrenchRig(scene), [scene])
  const anim = useRef({ spin: 0, ghost: 0, explode: 0 }).current
  const surface = useRef<'live' | 'cad' | 'fade'>('live')
  const lastMode = useRef<MaterialMode>('solid')

  const cadMaterial = useMemo(
    () => createCadTransitionMaterial({ sweepMin: rig.sweepMin, sweepMax: rig.sweepMax }),
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
      .to(anim, { spin: 1, duration: 0.3 }, 0)
      .to(anim, { ghost: 1, duration: 0.25 }, 0.25)
      .to(anim, { explode: 1, duration: 0.45 }, 0.55)

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

  const offsetZ = (node: Object3D, offset: number): void => {
    const base = rig.basePositions.get(node)
    if (base) node.position.z = base.z + offset
  }

  useFrame((state, delta) => {
    const { chapter, chapterProgress, materialMode } = getScrollState()
    const { tier, reducedMotion } = getQuality()

    // Reduced motion: hold the hero pose — no spin, no parallax, no ghost
    // fade, no explosion, no dissolve. The material-mode switcher (an explicit
    // user action, not motion) is the only thing that still mutates the scene.
    if (reducedMotion) {
      if (group.current) {
        group.current.rotation.y = 0
        group.current.rotation.x = 0
      }
      const explode = materialMode === 'exploded' ? 1 : 0
      if (rig.handleRoot) offsetZ(rig.handleRoot, EXPLODE_OFFSETS.handle * explode)
      for (const node of rig.stage1) offsetZ(node, EXPLODE_OFFSETS.stage1 * explode)
      for (const node of rig.stage2) offsetZ(node, EXPLODE_OFFSETS.stage2 * explode)
      if (surface.current !== 'live' || lastMode.current !== materialMode) {
        applyLiveMaterials(materialMode)
        surface.current = 'live'
      }
      lastMode.current = materialMode
      return
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
    for (const material of rig.ghostMaterials.values()) {
      material.opacity = MathUtils.lerp(1, GHOST_OPACITY, ghostAmount)
      material.depthWrite = material.opacity > 0.5
    }

    // 3. Multi-stage axial explosion (forced fully open in exploded mode).
    const explode = Math.max(anim.explode, materialMode === 'exploded' ? 1 : 0)
    if (rig.handleRoot) offsetZ(rig.handleRoot, EXPLODE_OFFSETS.handle * explode)
    for (const node of rig.stage1) offsetZ(node, EXPLODE_OFFSETS.stage1 * explode)
    for (const node of rig.stage2) offsetZ(node, EXPLODE_OFFSETS.stage2 * explode)

    // 4. Material surface management: CAD dissolve owns chapter 4, the mode
    //    switcher owns everything else. In the lite tier the dissolve shader
    //    is retired: chapter 4 falls back to a plain opacity ramp into the
    //    blueprint wireframe instead of the GLSL scanline dissolve.
    const wantCad = chapter === 3 && tier === 'full'
    const wantLiteFade = chapter === 3 && tier !== 'full'
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

    cadMaterial.uniforms.uTime.value += delta
    if (wantCad) {
      cadMaterial.uniforms.uProgress.value = chapterProgress
    }
  })

  // Recenter the wrench midpoint at the group origin so camera keyframes and
  // explosion offsets work in a clean local space.
  return (
    <group ref={group}>
      <group position={[-rig.center.x, -rig.center.y, -rig.center.z]}>
        <primitive object={scene} />
        <Hotspots />
      </group>
    </group>
  )
}

useGLTF.preload(MODEL_URL)
