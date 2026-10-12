# Torque wrench rebuild — design phase

## Decision frame

This design recovers the remembered opening and turns it into the first authored sequence of the private `/torque-wrench/` page. It is deliberately extensible: bullet time and later mini-animations are expected additions, not reasons to lock the beat spine. The current live page remains untouched until the replacement is accepted and publication is explicitly authorized.

The design preserves:

- The approved Ac Fast Reference handwriting and current owner annotations.
- Existing JGUN mechanical content and the completed Input Shaft cutter bullet-time goal.
- Data-authored beats on a scroll-length-independent timeline.
- The provisional starting scroll distance of roughly twice the current JGUN-only distance.
- Reduced-motion, poster, accessibility, and shared-shell requirements.
- The owner motion standard in `smooth-scrolling.md`.

This artifact does not approve structure, implementation planning, or code changes.

## Recovery baseline

The best found recovery baseline is the October 2 portal-correction behavior, with two inherited strengths:

- September 27 `camera-pressure-2026-09-27/first-rake/` supplies the remembered angled camera rake.
- October 1 `paper-breakthrough-2026-10-01/verified-capture/desktop/` supplies the physical printed-shard shatter.
- October 2 `portal-correction-2026-10-02/production-capture/desktop/` supplies model-driven opaque-paper pressure, rupture, and continuous wrench emergence.

Owner visual acceptance is still open. October 2 is a recovery candidate, not a locked visual answer.

Current source already retains the October 2 pressure and shatter geometry:

- `src/scene/drawing/sheet/paperFlex.ts`
- `src/scene/drawing/sheet/breakthrough.ts`
- `src/scene/drawing/sheet/breakthroughGeometry.ts`

The likely camera regression is the close-reading retiming in `src/scene/drawing/sheetCamera.ts` from commits `8988c2da` and `2021816e`, coupled with the C1 scroll remap in `524bdb4e`. A controlled A/B comparison is required before treating that retiming as the sole cause.

`src/scene/drawing/sheet/portalGeometry.ts` changed in `4035be9d`, but hardware/full-tier evidence shows the unwanted pit look persists. That commit is a separate unresolved contributor, not a proven root cause.

## Opening sequence

| Beat | Owner-visible result | Camera and scene intent |
| --- | --- | --- |
| 1. Registered drawing | Intact paper, approved handwriting, stable composition | Near-registered view, no parallax distraction |
| 2. Model push | Opaque paper bulges upward from actual model vertices | Recover the remembered angled rake so the bulge reads in perspective |
| 3. Fracture | Printed shards split along the enclosed profile | Keep the physical shatter lineage from October 1 |
| 4. Emergence | Wrench rises continuously through the opening | Preserve October 2 causal model push and continuous rise |
| 5. Pit reveal | Drawing paper and underlying wooden desktop give way to rocky, near-vertical cavernous walls with no visible floor | Remove circular hole and splined collar; depth reads beyond sight |
| 6. Unified lightning | Light-blue branching bursts across profile, interior cracks, pit fissures | One electrical language, same canonical progress |

The cavern is revealed by the model's passage. There is no separate pre-emergence preview.
Unified lightning overlaps the earlier beats rather than starting only after emergence: the same branching language traces the profile, defines the shattering pieces, and then propagates through the exposed pit fissures.

## Pit and electrical design

The pit is a rocky, cavernous volume with steep, near-vertical fractured walls and no visible bottom. It replaces the circular hole and splined collar with irregular rock masses that read as depth and relief. Lighting should reveal local rock structure without exposing a floor.

Electrical treatment is one system across three stages:

- Profile tracing crack.
- Interior fracture network that defines shattering pieces.
- Pit fissures exposed after rupture.

Use thin, irregular, branching light-blue paths with localized glow and distinct intermittent bursts. Preserve the existing accelerating burst/hold rhythm in `src/scene/drawing/electricalScore.ts`. Do not replace it with permanently glowing seams.

## Page and world design

The private `/torque-wrench/` page uses one persistent Three.js world and one canonical scroll conductor. The DOM story remains semantic and readable above or beside the canvas.

| Chapter | Story role | Camera intent | World focus |
| --- | --- | --- | --- |
| 01 Drafting | Intact drawing and owner notes | Registered, readable, calm | Paper, handwriting, profile trace |
| 02 Breakthrough | Model push, shatter, emergence | Recovered angled rake, continuous rise | Paper shards, model, pit mouth |
| 03 Mechanism | Existing JGUN mechanical story | Preserve current valid camera language | Gears, clutch, extraction |
| 04 Inspection | Cutter bullet time and later mini-animations | Normal-speed camera around slowed subjects | Input Shaft, future planet/H7-g6 additions |
| 05 Close | Ownership and next action | Settle to a composed final view | Wrench, pit depth, unified lightning |

Beat data remains independent of scroll length. Adding bullet time or another mini-animation must not require editing the scroll spine.

## Motion design

- One canonical progress value drives paper, model, pit, lightning, camera, and DOM beats.
- The same scroll position must reproduce the same state forward, backward, after a fast jump, and after reload.
- Assess three properties separately and together: narrative pacing, input response, and cinematic continuity.
- Start from approximately 150–250vh per major cinematic beat and 60–120vh reading holds, then tune to the composed sequence.
- Start from Lenis duration 1.1s, then evaluate the teardown-derived frame-rate-independent exponential response candidate of approximately `1 - exp(-12·dt)` from [oryzo-lusion-teardown.md](C:/vaults/markimus-SecondBrain/04-Projects/Portfolio-Site/oryzo-lusion-teardown.md); tune the existing response rather than adding another smoothing layer.
- Do not stack another 1.0s GSAP scrub delay without demonstrated benefit.
- Camera paths maintain at least C1 continuity and target C2 where ordinary transitions allow it.
- Position, target, FOV, and roll changes use controlled acceleration and deceleration.
- Pointer parallax is additive and suppressed during precise reading or fracture beats.
- A teardown-derived second-order pointer candidate (`f = 1.35`, `z = 0.5`, `r = 1.25`) may be evaluated in a later phase; transient pointer state is excluded from canonical narrative state.
- Pausing must freeze narrative animation; reverse must retrace without discontinuity.
- Verify wheel, touch, keyboard, and scrollbar input separately.
- Record boundary telemetry at beat transitions and compare full-motion playback with Oryzo.
- Target stable 60 FPS on capable desktop hardware, with adaptive quality elsewhere.
- Start from the provisional 2× JGUN-only scroll distance, then tune after beat composition is established.

## Oryzo/Lusion-derived candidates to validate

The supplied teardown of `oryzo.ai` identifies transferable patterns; these are design candidates for structure and planning validation, not locked implementation requirements. The goal is the feel, not a wholesale stack replacement.

- Derive one per-section state object from canonical progress: `ratio`, `screenY`, `isActive`, and show/hide offsets. Gate offscreen sections and effects from `isActive`.
- Prefer per-frame `fit()`-style state functions with explicit easing windows over additional distributed GSAP scroll timelines. Stagger is an index-sliced window of the same ratio, not a separate timeline.
- Use a continuous post-profile parameter blob so grade, bloom, vignette, and contrast morph between chapters instead of switching at boundaries.
- Cap canvas DPR at 1.5 and total pixel count at 2,560×1,440 equivalent, preserving aspect ratio.
- Use multisampling or SMAA rather than raw canvas antialiasing, and add blue-noise dither to gradient shaders to prevent banding.
- Precompile narrative shaders before first reveal to avoid first-paint stutter.
- Wheel clamping applies to normalized input. Frame-delta clamping requires low-FPS and tab-resume checks because it changes elapsed-time response.

### Layered background

The background is a separate authored system, not an afterthought of post-processing:

- Two or three depth layers move at different rates from canonical progress and, if validated, the second-order pointer candidate.
- The base layer uses a gamma-correct radial gradient with blue-noise dither to avoid banding.
- Atmospheric layers separate the subject from the pit and cavern depth without competing with the wrench, shards, or lightning.
- Layer opacity, offset, and color blend continuously with the post profile; they do not snap at beat boundaries.
- Pointer influence is subtle, additive, and suppressed during precise reading or fracture beats.
- Reduced motion and poster paths use a high-quality offline-rendered background still, not a live parallax layer.

## Accessibility, poster, and shell

- Semantic headings, copy, controls, and footer remain real DOM.
- Every essential 3D interaction has a DOM equivalent with visible focus.
- Reduced motion and poster modes use high-quality offline renders as their source, delivered as authored static DOM posters or inspection rasters; they are not stills captured from the runtime canvas.
- WebGL failure falls back to a designed poster and ordered DOM story.
- The persistent Three.js world is scoped to this document. Cross-document navigation uses hard navigation through dark with no persistent canvas.
- The page consumes the parallel session's generic HTML entry, fade, navigation, and poster primitives; that readiness is a blocking implementation dependency, not a design assumption.

## Future verification under separately approved phases

These gates define future evidence requirements. Completing this design review does not authorize structure, planning, or implementation.

| Gate | Required evidence |
| --- | --- |
| Recovery A/B | Controlled comparison of current camera/remap versus recovered October 2 behavior |
| Owner visual review | Unaltered PNGs of pressure, rupture, emergence, paper-plus-desktop replacement, exposed pit, and profile/interior lightning |
| Astra technical review | Independent source and evidence review before implementation approval |
| Motion proof | Slow, fast, stop, and reverse recordings; no discontinuity or lag masking |
| Oryzo parity | Comparative motion evidence and acceptance criteria across scroll response, section activation, offscreen gating, post-profile continuity, pointer dynamics, and canvas DPR/pixel caps; matching parameters alone is not parity |
| Tier proof | Full, lite, narrow, reduced-motion, and poster checks |
| Reduced-motion/poster policy | Zero narrative CAD downloads and zero narrative WebGL mounts; high-quality offline-rendered posters or inspection rasters |
| Performance | Establish phase-specific budgets for frame time, draw calls, triangles, texture memory, and shader compilation, then verify against the approved numbers |
| Accessibility | Keyboard order, focus, reduced motion, WebGL failure, and readable DOM |

## Open design questions

1. Exact camera rake angle and scroll timing after the A/B comparison.
2. Pit wall silhouette and rock relief balance between geometry, shading, and lighting.
3. Final scroll distance after beat composition and motion review.
4. Whether any later bullet-time beat needs a dedicated camera override or can reuse the standard beat data.

## Evidence

- September 27 rake: `project/work/evidence/JG-035-opening-drafting-table/camera-pressure-2026-09-27/first-rake/`
- October 1 shatter: `project/work/evidence/JG-035-opening-drafting-table/paper-breakthrough-2026-10-01/verified-capture/desktop/`
- October 2 baseline: `project/work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/production-capture/desktop/`
- Pit target: `project/work/evidence/JG-035-opening-drafting-table/blue-trace-tunnel-2026-10-03/concept-media/03-deep-tunnel-feedback.png`
