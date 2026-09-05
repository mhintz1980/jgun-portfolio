import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { EffectComposer, ChromaticAberration, Bloom, ToneMapping } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import type { ChromaticAberrationEffect, BloomEffect } from 'postprocessing'
import { Vector2 } from 'three'
import { useQuality } from '../state/qualityStore'
import { getScrollState, telemetry } from '../state/scrollStore'
import { STAGE_TRANSITIONS } from './stages/stageWindows'
import { DRAWING_INTRO_WINDOW } from './drawing/introTimeline'

/**
 * JG-017 — Post-Processing Composer.
 *
 * Adds restrained, tier-aware camera FX that reinforce cross-station
 * transitions without masking engineering content.
 *
 * Effect policy (from the JG-017 plan):
 *   full   — ChromaticAberration (velocity-driven offset) + Bloom
 *   lite   — Bloom only (cheaper; skips the multi-pass aberration)
 *   poster — null (no canvas; no post-processing)
 *   reducedMotion — null (static canvas pose; no motion effects)
 *
 * Intensity source: telemetry.stage.transitionIntensity (0..1), written by
 * SpatialRig each frame from the smoothed max cross-station alpha delta.
 * Reading it imperatively inside useFrame enforces zero React re-renders.
 *
 * Value ceilings (preserving CAD inspection legibility):
 *   ChromaticAberration offset: max 0.0018 UV — barely perceptible; well
 *     below the ~0.003 threshold that affects text readability.
 *   Bloom luminanceThreshold: 0.6 (only specular hot-spots bloom, not
 *     mid-tones). Rests at intensity 0.25 for PBR specular enhancement;
 *     peaks at 0.65 during transitions.
 *
 * Performance:
 *   - EffectComposer merges all passes into one GPU round-trip per frame.
 *   - No per-frame object allocations: offset is a module-level Vector2
 *     mutated in place inside useFrame.
 *   - EffectComposer disposes its render targets automatically on unmount.
 */

/** Max chromatic-aberration UV offset at full transition intensity. */
const MAX_ABERRATION = 0.0018

/** Bloom intensity at rest (PBR specular enhancement). */
const BLOOM_REST = 0.25

/** Bloom intensity ceiling during transitions. */
const BLOOM_PEAK = 0.65

/**
 * JG-021 glow experiment 3 (Mark-directed, 2026-08-30): the owner identified
 * the residual enclosure glow as bloom. The rest-bloom mute was measured a
 * visual no-op (halo persisted; clipped metrics barely moved) and the owner
 * ordered bloom restored once the analysis closed. The flag stays as the
 * documented revert switch; the committed behavior is bloom everywhere as
 * JG-017 shipped it.
 */
const BLOOM_MUTED_AT_STATION2 = false

/**
 * Extra bloom while the ordered excitation runs on the drawing (JG-026 Item 3). Held below
 * BLOOM_PEAK so the intro cannot outshine a station transition — the JG-021 light canon still
 * governs; the excitation's own peak linear luminance is reported in the evidence.
 */
const INTRO_PULSE_BLOOM = 0.3

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smooth01 = (x: number) => {
  const c = clamp01(x)
  return c * c * (3 - 2 * c)
}

/** Module-level scratch Vector2 — mutated in place; no per-frame alloc. */
const _offset = new Vector2(0, 0)

/**
 * Inner driver — runs the per-frame effect param update via refs to the
 * underlying postprocessing Effect class instances (not the React wrappers).
 */
function FxDriver({
  aberrationRef,
  bloomRef,
  enableAberration,
}: {
  aberrationRef: React.RefObject<ChromaticAberrationEffect | null>
  bloomRef: React.RefObject<BloomEffect | null>
  enableAberration: boolean
}) {
  useFrame(() => {
    const mode = (window as unknown as Record<string, string | undefined>).__drawingProofMode
    const proof = mode !== undefined && mode !== 'normal'
    // Station transition FX belong to the station transitions, not to the drawing intro.
    const introOwnsFrame = getScrollState().progress <= DRAWING_INTRO_WINDOW.releaseEnd
    const intensity = proof || introOwnsFrame ? 0 : telemetry.stage.transitionIntensity

    if (enableAberration && aberrationRef.current) {
      const offset = intensity * MAX_ABERRATION
      _offset.set(offset * 0.6, offset)
      aberrationRef.current.offset.copy(_offset)
    }

    if (bloomRef.current) {
      let rest = BLOOM_REST
      if (BLOOM_MUTED_AT_STATION2) {
        const { progress } = getScrollState()
        const down = smooth01(
          (progress - STAGE_TRANSITIONS.wrenchOut[0]) /
            (STAGE_TRANSITIONS.wrenchOut[1] - STAGE_TRANSITIONS.wrenchOut[0]),
        )
        const up = smooth01(
          (progress - STAGE_TRANSITIONS.enclosureOut[0]) /
            (STAGE_TRANSITIONS.enclosureOut[1] - STAGE_TRANSITIONS.enclosureOut[0]),
        )
        rest *= 1 - down * (1 - up)
      }
      // JG-026 Item 3: the ordered excitation is the only bright thing on the sheet, and it
      // was being rendered with bloom forced to zero — which is most of why nobody could see
      // it. During the intro, bloom follows the excitation instead of the station transitions.
      const pulseBoost = introOwnsFrame ? telemetry.drawing.pulse * INTRO_PULSE_BLOOM : 0
      bloomRef.current.intensity = proof
        ? 0
        : rest + (BLOOM_PEAK - BLOOM_REST) * intensity + pulseBoost
    }
  })

  return null
}

export function PostProcessingComposer() {
  const { tier, reducedMotion } = useQuality()

  const aberrationRef = useRef<ChromaticAberrationEffect | null>(null)
  const bloomRef = useRef<BloomEffect | null>(null)

  // Poster: canvas unmounted — component never reaches this anyway.
  // Reduced motion: static hero pose — no motion effects.
  if (tier === 'poster' || reducedMotion) return null

  const enableAberration = tier === 'full'

  return (
    <>
      <EffectComposer multisampling={0}>
        {enableAberration && (
          <ChromaticAberration
            ref={aberrationRef as React.RefObject<ChromaticAberrationEffect>}
            blendFunction={BlendFunction.NORMAL}
            offset={new Vector2(0, 0)}
          />
        )}
        <Bloom
          ref={bloomRef as React.RefObject<BloomEffect>}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.08}
          intensity={BLOOM_REST}
          mipmapBlur
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
      <FxDriver
        aberrationRef={aberrationRef}
        bloomRef={bloomRef}
        enableAberration={enableAberration}
      />
    </>
  )
}
