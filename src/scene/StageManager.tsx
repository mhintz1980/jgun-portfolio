import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { getQuality } from '../state/qualityStore'
import { getScrollState, telemetry } from '../state/scrollStore'
import {
  stageEnvelope,
  STAGE_TRANSITIONS,
} from './stages/stageWindows'
import { AirflowField } from './stages/AirflowField'
import { M249Stage } from './stages/M249Stage'
import { Station2_AcousticEnclosure } from './stages/Station2_AcousticEnclosure'

/**
 * Module 5 — multi-chapter stage orchestrator.
 *
 * Three stages share the fixed canvas, keyed off GLOBAL scroll progress (not
 * DOM triggers — the mission's stage windows are progress-based):
 *
 *   Stage 1 (wrench)      CH.01+02 — the existing TorqueWrenchHero, passed in
 *                         as children so its rig, timeline and hotspots stay
 *                         untouched; exits by sinking after the explosion
 *                         ladder completes (no material fade — the ghost system
 *                         owns wrench opacity).
 *   Stage 2 (enclosure)   CH.03 — validated MSP/RL-300 GLB asset plus the
 *                         AirflowField particle system, cross-faded in/out.
 *   Stage 3 (M249)       CH.04 — M249/MK46 asset, cross-faded in, holding to the end.
 *
 * Contract (r3f-scroll-performance-guard): scroll state is read imperatively
 * via getScrollState() inside useFrame — zero React re-renders, zero props
 * beyond children. Reduced motion pins stage 1 alone (today's behavior);
 * poster tier never mounts a canvas at all.
 */

export function StageManager({ children }: { children: ReactNode }) {
  const wrenchStage = useRef<Group>(null)
  const enclosureStage = useRef<Group>(null)
  const cloudStage = useRef<Group>(null)

  useFrame(() => {
    const { progress } = getScrollState()
    const { reducedMotion } = getQuality()

    const wrench = reducedMotion
      ? { alpha: 1, y: 0, active: true }
      : stageEnvelope(progress, undefined, STAGE_TRANSITIONS.wrenchOut)
    const enclosure = reducedMotion
      ? { alpha: 0, y: 0, active: false }
      : stageEnvelope(progress, STAGE_TRANSITIONS.enclosureIn, STAGE_TRANSITIONS.enclosureOut)
    const cloud = reducedMotion
      ? { alpha: 0, y: 0, active: false }
      : stageEnvelope(progress, STAGE_TRANSITIONS.pointCloudIn, undefined)

    if (wrenchStage.current) {
      wrenchStage.current.visible = wrench.active
      wrenchStage.current.position.y = wrench.y
    }
    if (enclosureStage.current) {
      enclosureStage.current.visible = enclosure.active
      enclosureStage.current.position.y = enclosure.y
    }
    if (cloudStage.current) {
      cloudStage.current.visible = cloud.active
      cloudStage.current.position.y = cloud.y
    }

    const alphas: [number, number, number] = [wrench.alpha, enclosure.alpha, cloud.alpha]
    const dominant = alphas.indexOf(Math.max(...alphas))
    telemetry.stage.active = alphas[dominant] > 0.25 ? dominant : -1
    telemetry.stage.alpha = alphas
    telemetry.stage.y = [wrench.y, enclosure.y, cloud.y]
  })

  return (
    <group>
      {/* STAGE 1 — CH.01/02: RL-300 assembly + exploded reduction train */}
      <group ref={wrenchStage}>
        {children}
      </group>

      {/* STAGE 2 — CH.03: validated MSP/RL-300 assets + thermal airflow field. */}
      <group ref={enclosureStage} visible={false}>
        <Station2_AcousticEnclosure />
        <AirflowField />
      </group>

      {/* STAGE 3 — CH.04: Real M249/MK46 Draco GLB (CR-6, 2026-08-25).
          Replaced the rejection-sampled point-cloud placeholder. CadTransition-
          Shader dissolve is now bound to the model's actual Z bounds. */}
      <group ref={cloudStage} visible={false}>
        <M249Stage />
      </group>
    </group>
  )
}

