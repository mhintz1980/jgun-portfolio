VERDICT: fix-first

**Deciding risk:** the effects imply an engineering path the visible geometry does not support. Reversibility passes; louver traversal, connected merging, heat carry-through, and acoustic interaction do not. Keep the rendering approach, correct the story. Mark retains the visual acceptance gate.

Reviewed uncommitted tree on `codex/jg033-signature-shot`, HEAD `df122b1`. Live direct preview matched local bundle `QuietMachineScene-D5_hasPJ.js`, SHA-256 `9c616e51deaa61556a3ac850ed5f9ae82006cd45b3a33584361a6a0b3d03bb27`. Source inspection, instrumented Chrome/Radeon 780M captures, and no-emit typecheck; no rebuild or source edits. Graph tools unavailable. Composer variants and real-phone performance remain unverified.

## 1. Binding-plan compliance

Partial. Shot ordering, Y-up coordinates, illustrative labeling, bloom-independent cores, sound handoff, and flow-state zero at `.90` are present. No unsupported flow/temperature/dB figures were introduced. However, 18/8 ribbons are created **per bundle**: 54/24 authored strips at convergence, exceeding the section's literal 12–24/6–10 total. Tests check constants, not instantiated totals. Both supplies precede discharge, but the lower supply never gets an isolated presentation: main remains fully weighted. Existing static lower-route tubes also remain visible outside the flow windows.

I agree with **all five prior direction constraints**: scroll-only determinism, merged view-aligned strips, beat mapping, source-driven two-stop heat, and discharge beyond the envelope. The implementation departs from several of them; no return to ambient motion, tubes, or particle density is required.

## 2. Determinism

Pass for the tested fixed configuration. Geometry is deterministically constructed; extent, opacity, phase, heat, camera, and cut derive from `u`. No rendering quantity accumulates time/frames/randomness. `performance.now()` and frame increments in `QuietMachineScene.tsx:80` are telemetry only.

Forward/reverse canvas captures at `.38/.51/.60/.72/.84` had zero differing pixels, including zero comparison tolerance. Desktop→390px→desktop at `.72` also returned identically; idle produced no frames. Existing verifier anchors miss heat/sound, and `preview.test.ts:147` only repeats the evaluator. Separate portability defect: reversed-edge GLSL `smoothstep(.68,.02,...)` has undefined results; local identity does not establish cross-GPU correctness.

## 3. Does it read as air?

Not convincingly enough. Machine visual judgment, supported by geometry/shader inspection: tightly packed, similarly routed cyan strands read as cables. Stable nonuniform offsets and alpha tapers help, but **air has no dash tracers**: the dash branch selects `kind=0` (sound); air is `-1`.

The lower spine's highest sampled Y over the louver footprint is approximately `.083`, below the liner at `.153`: it bypasses the required opening. Supply endpoints miss the merged start by approximately `.102` and `.189` metres before tapering, so the nominal junction is disconnected. Two old bright schematic tubes compete with the new bundle and already show the full lower route before its reveal.

## 4. Heat language

Genuinely spatial, not an arc-position rainbow, but **not accumulated heat**. `localHeat` measures current distance to the pump; downstream exhaust returns to cool. The shader's `.22` baseline also warms source-adjacent vertices before the scheduled heat onset. Runtime maximum authored heat was below `.43`, with zero at the exhaust end: the orange destination is never approached. Implement source-triggered downstream heat retention, not a proximity halo.

## 5. Sound beat

Not concentric bubbles, but also not wave fronts: four longitudinal source-to-target curves grow along their paths. Generic endpoint narrowing does not demonstrate interaction with baffles; no authored contact event, deflection, or contact-local attenuation exists. Six grounded orange chevrons are semantically distinct from airborne sound, though their simultaneous reveal does not demonstrate isolation behavior. Preserve that distinction while making the acoustic relationship visible.

## 6. Performance and correctness

Four merged meshes/materials; Three r185 `ShaderMaterial` defaults to single-pass, yielding four effect draws when submitted, even at zero opacity. Geometry is static; each frame evaluates small state objects and updates uniforms, without geometry rebuilds or React state updates. No FPS claim.

Normal blending, depth testing, and disabled depth writes are appropriate, but merged transparent strands cannot individually depth-sort. Disposal exists; its combined effect disposes still-shared materials when responsive geometry changes. Mobile selects eight strips **per bundle**. Reduced motion holds `.52` against scrolling and suppresses draw-on/dashes; preference is sampled only at mount.

Main/merged clipping is **nonfunctional**: material flags cannot replace missing shader clipping chunks. Forcing both planes to exclude everything changed zero pixels.

## 7. Lower intake/cut-face issue

Confirmed visible, not hypothetical. In an isolated review browser, applying a diagnostic cut only to the lower ribbon removed 403/605/257 visible pixels at `.51/.60/.72` (RGB threshold 8). The unsectioned duct and legacy tubes also project forward of the cut. **Blocks this beat** because the route already bypasses its liner; it is not merely decorative overlap. Main/merged currently are not actually sectioned either.

## Required fixes, in order

1. `flow.ts:21`, `LowerIntake.tsx:15`, `LowerIntake.tsx:31`: route through louvers, connect the junction, resolve cut-side presentation, remove/gate legacy tubes.
2. `AirRibbons.tsx:23`: implement actual main/merged shader clipping.
3. `AirRibbons.tsx:85`, `AirRibbons.tsx:275`, `flow.ts:65`: air tracers, defined smoothstep, total ribbon budget, independent supply emphasis.
4. `AirRibbons.tsx:194`, `AirRibbons.tsx:103`: accumulated source heating without premature baseline warmth.
5. `AirRibbons.tsx:238`: directional fronts with visible authored baffle interaction.
6. `preview.test.ts:147`, `preview.test.ts:186`, `scripts/verify-jg033-preview.mjs:91`: verify actual geometry/material contracts and heat/sound reverse captures after fixes.
