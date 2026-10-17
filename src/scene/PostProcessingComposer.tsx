import { useContext, useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, EffectComposerContext, ChromaticAberration, Bloom, DepthOfField, SMAA, ToneMapping } from '@react-three/postprocessing'
import { BlendFunction, EffectPass, ToneMappingMode } from 'postprocessing'
import type { ChromaticAberrationEffect, BloomEffect, DepthOfFieldEffect } from 'postprocessing'
import { Vector2, Vector3 } from 'three'
import type { WebGLRenderer } from 'three'
import { useQuality } from '../state/qualityStore'
import { getScrollState, telemetry } from '../state/scrollStore'
import { STAGE_TRANSITIONS } from './stages/stageWindows'
import { DRAWING_INTRO_WINDOW } from './drawing/introTimeline'
import { createSectionRenderPass } from './sectionRenderPass'
import { renderOwnership } from './inspection/renderLease'

/**
 * JG-017 — Post-Processing Composer.
 *
 * Adds restrained, tier-aware camera FX that reinforce cross-station
 * transitions without masking engineering content.
 *
 * Effect policy (from the JG-017 plan):
 *   full   — bounded 4x MSAA + ChromaticAberration + DepthOfField + Bloom
 *   lite   — SMAA + Bloom (skips aberration and the opening focus rack)
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

/** Only request a sample count actually supported by the HalfFloatType colour target. */
function rootMsaaSamples(gl: WebGLRenderer): number {
  const context = gl.getContext()
  if (!('getInternalformatParameter' in context)) return 0
  const supported = context.getInternalformatParameter(context.RENDERBUFFER, context.RGBA16F, context.SAMPLES) as Int32Array | null
  const limit = Math.min(4, gl.capabilities.maxSamples)
  let samples = 0
  for (const count of supported ?? []) {
    if (count <= limit && count > samples) samples = count
  }
  return samples
}

/** Repair the installed wrapper's CSS-only resize check and handle late pass registration. */
function ComposerBufferSync() {
  const { composer } = useContext(EffectComposerContext)
  const gl = useThree(state => state.gl)
  const size = useThree(state => state.size)
  const dpr = useThree(state => state.viewport.dpr)
  const drawingBufferSize = useMemo(() => new Vector2(), [])

  useEffect(() => {
    // postprocessing@6.39.4 reads the renderer's physical drawing buffer itself.
    // Its setSize arguments must remain CSS pixels, even when only DPR changed.
    composer.setSize(size.width, size.height)
  }, [composer, size.width, size.height, dpr])

  useFrame(() => {
    gl.getDrawingBufferSize(drawingBufferSize)
    if (composer.inputBuffer.width !== drawingBufferSize.x || composer.inputBuffer.height !== drawingBufferSize.y ||
        composer.outputBuffer.width !== drawingBufferSize.x || composer.outputBuffer.height !== drawingBufferSize.y) {
      const cssSize = gl.getSize(drawingBufferSize)
      composer.setSize(cssSize.x, cssSize.y)
    }
    // Effects are registered by the parent's layout effects, and can be rebuilt
    // without remounting this child. Run before the composer's priority-1 render.
    for (const pass of composer.passes) {
      if (pass instanceof EffectPass && !pass.dithering) pass.dithering = true
    }
  })
  return null
}

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
 * JG-035 opening focus rack. The drafting-table dolly opens low and tight on the sheet, where
 * a real lens at that distance holds only a sliver of paper sharp. Focus tracks the camera's
 * look-at point; the rack pulls in on load (time-based, so the first frame reads as a film
 * opening even before the visitor scrolls) and the depth of field relaxes to nothing before
 * the establishing frame, so the whole print is sharp when it is read.
 */
const DOF_TARGET = new Vector3()
const DOF_BOKEH = 5.5
const DOF_RACK_SECONDS = 2.4
let dofReadyAt = 0

/**
 * Inner driver — runs the per-frame effect param update via refs to the
 * underlying postprocessing Effect class instances (not the React wrappers).
 */
function FxDriver({
  aberrationRef,
  bloomRef,
  dofRef,
  enableAberration,
}: {
  aberrationRef: React.RefObject<ChromaticAberrationEffect | null>
  bloomRef: React.RefObject<BloomEffect | null>
  dofRef: React.RefObject<DepthOfFieldEffect | null>
  enableAberration: boolean
}) {
  useEffect(() => {
    const port = { bloom: bloomRef.current, aberration: aberrationRef.current, dof: dofRef.current }
    renderOwnership.post = port
    return () => { if (renderOwnership.post === port) renderOwnership.post = null }
  }, [bloomRef, aberrationRef, dofRef, enableAberration])
  useFrame(() => {
    if (renderOwnership.blocked) return
    const dof = dofRef.current
    if (dof) {
      const mode = (window as unknown as Record<string, string | undefined>).__drawingProofMode
      const t = getScrollState().progress / DRAWING_INTRO_WINDOW.releaseEnd
      const now = performance.now()
      if (!dofReadyAt && telemetry.drawing.annotationsReady) dofReadyAt = now
      const rack = dofReadyAt ? smooth01((now - dofReadyAt) / 1000 / DOF_RACK_SECONDS) : 0
      const goal = telemetry.camera.goal
      const distance = Math.hypot(
        goal.position[0] - goal.target[0],
        goal.position[1] - goal.target[1],
        goal.position[2] - goal.target[2],
      )
      // Rack: focus starts well past the paper and pulls onto the look-at point.
      const pull = 1 - rack
      DOF_TARGET.set(
        goal.target[0] + (goal.target[0] - goal.position[0]) * pull * 1.4,
        goal.target[1] + (goal.target[1] - goal.position[1]) * pull * 1.4,
        goal.target[2] + (goal.target[2] - goal.position[2]) * pull * 1.4,
      )
      dof.target = DOF_TARGET
      dof.cocMaterial.focusRange = Math.max(0.02, distance * 0.28)
      const amount = 1 - smooth01((t - 0.24) / 0.1)
      dof.bokehScale = mode !== undefined && mode !== 'normal' ? 0 : DOF_BOKEH * amount
    }

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
      // Bright vellum must never receive the electrical bloom boost. Keep the lit
      // drafting pass unbloomed; glow belongs solely to the trace in blackout.
      if (introOwnsFrame) rest = 0
      const pulseBoost = introOwnsFrame ? telemetry.drawing.pulse * telemetry.drawing.blackout * INTRO_PULSE_BLOOM : 0
      bloomRef.current.intensity = proof
        ? 0
        : rest + (BLOOM_PEAK - BLOOM_REST) * intensity + pulseBoost
    }
  })

  return null
}

export function PostProcessingComposer() {
  const { tier, reducedMotion } = useQuality()
  const gl = useThree(state => state.gl)
  const fullSamples = useMemo(() => rootMsaaSamples(gl), [gl])

  const aberrationRef = useRef<ChromaticAberrationEffect | null>(null)
  const bloomRef = useRef<BloomEffect | null>(null)
  const dofRef = useRef<DepthOfFieldEffect | null>(null)

  // Poster: canvas unmounted — component never reaches this anyway.
  // Reduced motion: static hero pose — no motion effects.
  if (tier === 'poster' || reducedMotion) return null

  const enableAberration = tier === 'full'

  return (
    <>
      <EffectComposer multisampling={tier === 'full' ? fullSamples : 0} stencilBuffer={false} renderPass={createSectionRenderPass}>
        <ComposerBufferSync />
        {enableAberration && (
          <ChromaticAberration
            ref={aberrationRef as React.RefObject<ChromaticAberrationEffect>}
            blendFunction={BlendFunction.NORMAL}
            offset={new Vector2(0, 0)}
          />
        )}
        {enableAberration && (
          <DepthOfField
            ref={dofRef as React.RefObject<DepthOfFieldEffect>}
            focusDistance={0.3}
            focusRange={0.08}
            bokehScale={0}
            resolutionScale={0.5}
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
        {tier === 'lite' && <SMAA />}
      </EffectComposer>
      <FxDriver
        aberrationRef={aberrationRef}
        bloomRef={bloomRef}
        dofRef={dofRef}
        enableAberration={enableAberration}
      />
    </>
  )
}
