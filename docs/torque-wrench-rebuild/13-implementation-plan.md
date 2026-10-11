# Torque wrench rebuild — implementation plan

**Decision needed:** Owner acceptance of this plan before implementation.

**Status:** Planning authorized; plan artifact pending owner approval. Design and structure are accepted. Implementation is not authorized. Every unchecked item below is future work.

**Date:** 2026-10-11 (America/New_York).

**Workspace:** `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`

**Branch:** `torque-wrench/rebuild`
**Planning baseline:** `1b414948cafbf635ff3bb56c367c8a4651f30a7f`, with existing modified and untracked documents/evidence preserved.

**Planning review:** An Astra planning seat authored the proposed sequence; an independent `tier-reviewer` (configured `gpt-6-astra`, medium) approved the saved artifact for owner review with no blocking findings. Its ordering clarification is incorporated below: audit existing motion before conductor tuning. This is document review, not implementation or owner acceptance.

## 1. Authority and boundaries

This plan carries the accepted [design](09-design.md) and [structure](10-structure.md) into an executable sequence, subject to [owner rulings](00-owner-rulings.md) and the revisable [motion standard](smooth-scrolling.md). The [design review](09-design-review.md), [structure review](10-structure-review.md), and [handoff](12-next-session-handoff.md) establish document readiness and phase boundaries; they do not prove runtime behavior.

Execution requirements inherited from those sources:

- **Shared shell is a blocking implementation dependency.** Structure §§1, 3, and 8 require the parallel track's HTML entry, fade, navigation, and poster primitives. Demonstrate readiness before implementation; consume delivered interfaces rather than duplicate them.
- **Isolation is transitive.** Structure §3 prohibits mounting `TorqueWrenchHero` or `DrawingLinework` as-is. Reuse lower-level primitives or extract page-safe primitives that preserve existing callers. A wrapper around root-store or chapter-trigger coupling does not satisfy the boundary.
- **Recovery remains comparative.** Design's recovery baseline requires controlled A/B evidence. October 2 is a recovery candidate, and the camera/remap changes are not an established sole cause.
- **Budgets precede verification.** Approve numerical performance budgets before performance verification. Candidate DPR, pixel caps, and smoothing values are not accepted budgets or results.
- **Acceptance is separate at each layer.** Technical verification, Astra effects review, owner visual/motion acceptance, and publication authorization remain distinct.

All work stays in this worktree. Never edit, switch, build from, or otherwise alter the protected `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio` checkout. Preserve existing dirty/untracked work and `.scratch/`; never commit scratch material.

This planning turn creates only this artifact. No product code, builds, captures, servers, GPU work, commits, pushes, PRs, deployments, publication, cutover, or archival operations. Future implementation needs owner plan acceptance, implementation authorization, and shared-shell readiness. Coordinate resource availability before authorized builds/captures; the earlier research release is not a current reservation.

**Documentation checkpoint authorization:** After the planning turn, the owner requested a saved next-session prompt followed by a commit of this session's changes. That authorizes a scoped documentation commit of this plan and `14-next-session-prompt.md`; it does not accept the plan or authorize implementation, other sessions' changes, push, or publication.

## 2. Deliverable and scope

Build a fresh, private `/torque-wrench/` document containing the existing JGUN story, recovered opening, completed Input Shaft cutter bullet time, and explicit layered background. Keep the current live page intact until replacement acceptance and separately authorized publication.

The page has one page-local scroll conductor, one canonical narrative progress value, declarative beats independent of physical scroll distance, and one Three.js world persisting only within this document. Shared hard navigation fades through dark, with no cross-document canvas or scroll-state persistence. The complete semantic DOM story and accessible interaction equivalents serve both canvas and high-quality offline-rendered poster paths.

Preserve approved Ac Fast Reference handwriting, owner annotations, validated CAD/drawing mechanics, part-number identities, measured mechanical ladder, and existing inspection content. Mechanical invariants remain protected; the withdrawn rule that JGUN timings must stay unchanged does not freeze the new page's choreography or scroll distance.

Complete cutter bullet time: subjects stop or become extremely slow while the camera moves at normal speed around them, with controlled entry/exit. Existing slow motion alone is insufficient.

Defer planet inspection, H7/g6 additions, AI HDRI, depth-map debris, and GLSL mask scanning. Keep later bullet-time and mini-animation additions easy. Quiet Machine decisions remain final and belong to its owner; this track does not reopen its geometry, hotspot, or performance decisions. Reserve M249's future slot without activating its page or `m249-trunnion` hotspot. Preserve the owner's JG-037 condition on publishing the split.

## 3. Ownership, dispatch, and file boundaries

Each file has one active writer. Parallel tasks may proceed only after their dependency contracts are fixed and their write paths are disjoint; overlapping shared-file work stays sequential. All paths in the following table are relative to the workspace above. Director/helper paths are under `src/scene/torque-wrench/` unless stated otherwise.

| Owner | Files/surface | Responsibility |
| --- | --- | --- |
| Parallel shell owner | Generic HTML, fade, navigation, poster primitives | Deliver shared interfaces and readiness evidence; no torque choreography |
| Torque integrator | `torque-wrench/index.html`, `src/torque-wrench-main.tsx`, `vite.config.ts` | Consume shell and add second private document input while preserving existing entry |
| Runtime implementer | `TorqueWrenchPage.tsx`, `ScrollConductor.tsx`, `Scene.tsx`, `Story.tsx`, `Poster.tsx`, `cadGate.ts`, `src/state/torqueWrenchStore.ts` | Lifecycle, canonical progress, tier selection, semantic story, lazy loading |
| Timeline/director implementer | `beats.ts`, `beatTimeline.ts`, `directorRegistry.ts`, `OpeningDirector.ts`, `PitDirector.ts`, page-local mechanism/inspection/close directors | Pure narrative sampling and coordinated scene state |
| Rendering implementer | `BackgroundDirector.ts`, `backgroundLayers.ts`, `postProfile.ts`, `renderBudget.ts`; optional `pointerDynamics.ts` | Explicit background, continuous grade, bounded rendering |
| Asset producer | `public/torque-wrench/posters/`, `posterMap.ts` | Offline poster production, variants, provenance, semantic mapping |
| Compatibility owner | Necessary lower-level extraction from existing drawing/rig/inspection modules | Preserve existing callers and prove isolation; no root choreography rewrite |
| Verification owner | Page-specific tests and `scripts/` helpers; `project/work/evidence/torque-wrench-rebuild/` | Reproducible gates and evidence index |
| Astra / owner | Reviews and acceptance records | Technical/effects judgment / visual, motion, and phase acceptance |

Future tier dispatch uses configured roles; verify routing when launched rather than treating a seat name as backend proof. No worker is launched by this artifact.

| Subtask | Seat / configured model | Launch mode | Effort | Reason | Dependency |
| --- | --- | --- | --- | --- | --- |
| Inventories and evidence indexing | `tier-reader` / `gpt-6-luna` | Native, behaviorally read-only | High | Bounded mechanical gathering | Exact read scope and gate definitions |
| Scoped implementation | `tier-worker` / `gpt-6.1-sol` | Native with exact write ownership | High | Implement decided contracts | Owner approval, shell readiness, prior stage exits |
| Critical source/effects and final review | `tier-reviewer` / `gpt-6-astra` | Independent native, behaviorally read-only | Medium | Independent judgment against accepted sources | Concrete artifact and current evidence |
| Integration and acceptance tracking | Parent | Current session | Current setting | Resolve dependencies and verify claims | Worker artifacts and independent review |

Native children inherit permissions and MCP exposure; these roles do not impose filesystem isolation. If a separate read-only boundary or MCP exclusion is required, use the codex-tiers isolated launcher with a self-contained spec. Estimate expensive runs before launch and offer the cheapest useful variant; escalate only when justified by unresolved findings.

Page-local runtime must not import root `App`, `Chapters`, `SceneCanvas`, or `ScrollRig`, nor their scroll store transitively. Page state must not import React components or contain Three.js objects. The conductor is the only scroll-progress owner; reused/extracted primitives add no chapter ScrollTriggers.

`cadGate.ts` is the sole page entry boundary to lazy CAD/WebGL-loading dependency trees. Static story, poster mapping, and registry metadata must not eagerly import those trees. CAD-dependent directors load behind that gate. Shared-file edits require coordination with their owner; exact shell import paths come from delivered interfaces, not assumptions.

## 4. Ordered implementation work

### Stage 0 — Authorization and integration readiness

- [ ] Record owner acceptance of this plan and implementation authorization.
- [ ] Confirm shared-shell delivery, exact exports, lifecycle, fade/navigation behavior, poster interface, and private-entry integration contract.
- [ ] Confirm authorized resource use and current availability for builds, GPU, captures, and ports.
- [ ] Record live worktree baseline and protected changes without resetting, cleaning, or switching branches.
- [ ] Register the approved work through `project/README.md`'s work-ID protocol, linking this plan rather than inventing or duplicating approval.
- [ ] Read applicable domain skills through `project/context/agent-skills.md` when entering each implementation domain; read `smooth-scrolling.md` before every scrolling/cinematic-motion edit.
- [ ] Establish verification devices, viewport matrix, baseline provenance, and approved phase-specific numerical budgets.

**Exit:** Recorded implementation authorization and demonstrated shell readiness. If either is absent, implementation remains blocked.

### Stage 1 — Private document and static foundation

- [ ] Add the separate HTML/JS entry and consume shared fade/navigation primitives; keep the page private and avoid public navigation/cutover changes.
- [ ] Establish ordered Drafting, Breakthrough, Mechanism, Inspection, and Close DOM chapters, controls, headings, and reachable footer.
- [ ] Implement tier selection before evaluating narrative CAD/WebGL imports.
- [ ] Implement poster/reduced-motion paths and WebGL-failure transition using the same semantic story.
- [ ] Establish page-local store and cleanup for listeners, animation scheduling, Lenis, ScrollTrigger, and GPU resources.
- [ ] Verify private topology, shared-shell parity, and existing-entry preservation.

**Exit:** Correct document boundaries and complete static interaction path. Temporary art cannot pass final poster acceptance.

### Stage 2 — Beat data and conductor

- [ ] Audit existing Lenis, GSAP, progress mappings, `ScrollRig`, and `CameraRig` before constructing/tuning the replacement conductor or changing parameters; retain measured baseline evidence.
- [ ] Carry structure §2's beat contract: stable `id`, normalized `start`/`end`, optional title/copy, camera/scene/director IDs, interaction metadata, and poster reference.
- [ ] Resolve active beat, local progress, previous/next IDs, entering/active/exiting windows, and stable state key purely from canonical progress. These states must not depend on traversal history.
- [ ] Specify endpoint ownership and overlap handling; reject invalid windows and unknown director IDs.
- [ ] Keep physical scroll extent separate from beat semantics. Start near twice the measured JGUN-only distance; final distance remains unlocked.
- [ ] Use approximately 150–250vh per major cinematic beat and 60–120vh reading holds as provisional composition targets; reconcile them through review rather than fixing either as a budget.
- [ ] Drive camera, model, paper, pit, lightning, background, and DOM activation from one canonical progress value, without accumulated narrative clocks or per-scroll React rerenders.
- [ ] Retain Lenis's 1.1s starting baseline. Correct motion paths and coordination before response tuning; no additional 1.0s GSAP scrub delay without demonstrated benefit.
- [ ] Prove that adding a fixture beat/director changes only beat data, director, and registry entry, not the conductor, root page, shared shell, or `Scene.tsx` composition.

**Exit:** Forward, reverse, jump, reload, hold, and boundary sampling resolve consistently.

### Stage 3 — Page-safe reuse and mechanical story

- [ ] Prefer validated lower-level `sheetCamera` pose math, `introTimeline`, `paperFlex`, `breakthrough`, `breakthroughGeometry`, `portal`, `portalGeometry`, `electricalScore`, drawing geometry, and CAD/inspection primitives.
- [ ] Extract page-safe primitives only where needed, preserving existing caller behavior. Do not mount `TorqueWrenchHero` or `DrawingLinework` unchanged.
- [ ] Trace imports transitively to exclude root stores, chapter selectors, extra conductors/triggers, eager CAD loading, and hidden frame-accumulated narrative state.
- [ ] Drive mechanism channels from canonical progress while preserving part-number identity, extraction order/offsets, gear relationships, clutch behavior, and inspection content.
- [ ] Complete cutter camera arcs and subject-time mapping, including entry, exit, reverse, and accessible DOM controls. Measure subject slowing and camera motion independently.
- [ ] Keep optional transient pointer state outside canonical narrative state.

**Exit:** Compatible reuse and mechanical parity without root-runtime coupling. If a mechanical behavior change becomes necessary, update the spec §5 tables, README ladder, and required rig-skill tables together under coordinated scope before delivery; this plan does not authorize external skill-file or protected-checkout edits. Preserve the ladder by default.

### Stage 4 — Opening recovery and pit

- [ ] Compare current camera/remap behavior with the recovery candidate under matching assets, progress samples, renderer, tier, viewport, and lighting. Isolate camera/remap changes from pit geometry changes before attributing cause.
- [ ] Recover September 27 camera-rake intent, October 1 printed shatter, and October 2 model-driven pressure/continuous emergence without reverting approved handwriting or annotations.
- [ ] Have `OpeningDirector` return plain state from canonical progress; keep scroll mapping, DOM copy, and accessibility outside it.
- [ ] Keep paper opaque during the model-driven bulge; measure transformed-vertex pressure and clearance.
- [ ] Reveal the already-lit wrench through first rupture and maintain continuous emergence.
- [ ] Make drawing paper and underlying wooden desktop give way in the model's wake. No separate pre-emergence cavern preview.
- [ ] Let `PitDirector` own irregular rock relief, steep near-vertical walls, depth, occlusion, and fissure propagation. Replace circular-hole/splined-collar appearance; no visible floor, bottom, or far closure.
- [ ] Preserve thin, irregular, branching light-blue electricity and accelerating burst/hold rhythm across profile trace, interior shard-defining fractures, and exposed pit fissures. These stages overlap; seams must not glow permanently.
- [ ] Verify lit metal, aperture occlusion, no desk exposed through rupture gaps, depth beyond sight, and continuous camera handoffs.

**Exit:** Hardware/full telemetry and unaltered runtime PNGs support independent Astra effects review and owner review. Recovery resemblance alone does not close acceptance.

### Stage 5 — Layered background and rendering

- [ ] Implement two or three explicit depth layers with different progress-driven movement rates through `backgroundLayers.ts` and `BackgroundDirector.ts`.
- [ ] Use a gamma-correct radial base gradient with blue-noise dither and restrained atmospheric separation from subject and cavern depth.
- [ ] Continuously blend layer opacity, offset, color, and post profile across beats; avoid boundary snaps.
- [ ] Keep background ownership separate from camera, pit geometry, and post-processing. Pointer influence is subtle/additive and suppressed during precise reading and fracture.
- [ ] Evaluate optional pointer dynamics, exponential input response, DPR/pixel caps, multisampling/SMAA, shader precompilation, and offscreen gating against measured baselines.
- [ ] Keep teardown values provisional: `1 - exp(-12*dt)`, pointer `f=1.35 / z=0.5 / r=1.25`, DPR 1.5, and 2,560×1,440-equivalent pixel cap preserving aspect ratio.
- [ ] Evaluate section `ratio`, `screenY`, `isActive`, and show/hide state from canonical progress; prefer explicit per-frame fit windows and index-sliced staggering over distributed scroll timelines.
- [ ] Check normalized wheel clamping and any frame-delta clamp under low FPS and tab resume.
- [ ] Ensure stationary canonical progress freezes narrative state; do not improve smoothness by increasing lag.

**Exit:** Visible depth without competing with wrench, shards, or lightning; continuous boundaries and acceptable measured cost.

### Stage 6 — Offline posters and accessibility

- [ ] Produce high-quality offline renders for the ordered story, background still, and essential inspection equivalents; no runtime-canvas captures as poster art.
- [ ] Record source scene, settings, asset versions, output dimensions, and `posterMap.ts` mapping to beat/chapter and alt text.
- [ ] Supply desktop/narrow crops, readable DOM context, and complete ordered story.
- [ ] Verify reduced-motion/poster cold loads mount zero narrative WebGL canvases and request zero narrative CAD assets; do not evaluate live background layers.
- [ ] Verify WebGL initialization and runtime failure unmount the canvas and preserve semantic story, focus, reachable controls, and footer.
- [ ] Distinguish runtime-failure evidence from static cold loading: earlier CAD downloads cannot be retroactively counted as zero; confirm no further narrative CAD loading after fallback.
- [ ] Review offline art separately from unaltered live-effects PNGs.

**Exit:** Complete semantic/interaction equivalence using final offline-rendered art. Asset production may run independently once representative compositions are settled; final mappings require the completed beat inventory.

## 5. Verification gates and evidence

All gates remain unchecked. These are local plan identifiers, not closure of inherited JG-035 G0–G6. Evidence belongs under `project/work/evidence/torque-wrench-rebuild/`, indexed by gate and exact source/build provenance. No verification below is executed in this planning turn.

| Gate | Required evidence / pass condition |
| --- | --- |
| G0 — Authority and shell | Owner plan/implementation approval; delivered shell contract; separate HTML entry; shared fade/navigation parity; no cross-document canvas/state |
| G1 — Pure timeline | Endpoints/invalid data; pure progress mapping; forward/reverse equality; direct seek/reload; hold stability; deterministic director states; added-beat fixture without spine edits |
| G2 — Import/lifecycle isolation | Transitive root-runtime exclusion; lazy CAD/WebGL gate; StrictMode/remount cleanup; one conductor; no duplicate triggers/loops; no per-frame React state churn |
| G3 — Compatibility and cutter | Drawing registration/annotations; measured mechanical identity/ladder; inspection/DOM controls; slowed subjects with normal-speed camera; existing-entry behavior after extraction |
| G4 — Recovery/opening | Controlled A/B; camera, pressure, shatter, emergence, paper/desktop replacement, pit depth, electrical overlap, clearance/occlusion telemetry and unaltered PNGs |
| G5 — Motion | Separate pacing, input-response, and cinematic-continuity assessments; slow/fast scroll; abrupt stop/reverse; wheel/touch/keyboard/scrollbar; jump/reload; low FPS/tab resume; no discontinuity or excessive residual lag |
| G6 — Oryzo/background | Full-motion reference comparison; activation/offscreen gating; post-profile continuity; pointer suppression; render caps; distinct layer parallax; gradient banding/dither; beat-boundary continuity; offline fallback stills |
| G7 — Tiers/accessibility/failure | Desktop/narrow full/lite, reduced-motion, poster, WebGL initialization/runtime failure; keyboard order/visible focus/footer; equivalent DOM interactions; correct poster mapping/provenance; zero CAD/zero canvas static cases |
| G8 — Performance | Device-named frame-time distributions, draw calls, triangles, texture memory, shader compilation, DPR/pixel counts, requested/effective tier against preapproved phase-specific budgets |
| G9 — Review | Independent Astra source/evidence review; Astra effects approval; owner unaltered PNG acceptance; owner full-motion acceptance; remaining limitations recorded |

- [ ] G0 closed with recorded evidence.
- [ ] G1 closed with recorded evidence.
- [ ] G2 closed with recorded evidence.
- [ ] G3 closed with recorded evidence.
- [ ] G4 closed with recorded evidence.
- [ ] G5 closed with recorded evidence.
- [ ] G6 closed with recorded evidence.
- [ ] G7 closed with recorded evidence.
- [ ] G8 closed with recorded evidence.
- [ ] G9 closed with recorded evidence.

For G5, record camera position/orientation, look target, FOV/zoom, roll, velocity, and frame-to-frame composition around beat boundaries. Require at least C¹ continuity and target C² in ordinary transitions, stable quaternion interpolation when needed, and controlled acceleration/deceleration for intentional rapid moves. Pause freezes narrative state; reverse retraces it. Parameter matching or screenshots alone do not establish Oryzo motion parity.

For G8, target stable 60 FPS on capable desktop hardware; establish adaptive-tier/device targets and phase-specific numerical thresholds before verification. Do not import Quiet Machine's budgets as torque budgets. Record renderer/backend, hardware versus software GL, requested/effective tier, viewport, input script, source/asset hashes, run identity, and fresh server/build identity. A quality lock or software GL does not prove natural hardware/full performance. Never relabel a failed full expectation as lite success.

Use focused tests and quick iteration first, then the complete applicable roster for completion: desktop full/lite, narrow full/lite, and desktop/narrow reduced motion, plus explicit poster and failure cases. Adapt page-specific verifiers deliberately; do not silently retarget legacy progress expectations or claim an unadapted legacy verifier proves the new page. `node scripts/verify-jgun-opening.mjs --url=http://localhost:5199 --quick` is the existing iteration protocol only; full six-case coverage is completion evidence. When authorized, restart the `:4173` preview after every rebuild. Collect fresh private-page telemetry alongside unaltered captures; runtime vision alone is insufficient.

The evidence index must distinguish current verification from historical lineage, record failures rather than omit them, map each artifact to a gate, and identify any remaining owner decision. Independent review is capped at two rounds per piece; unresolved findings remain visible for owner disposition.

## 6. Acceptance and unresolved determinations

Owner PNG review covers registered drawing, pressure, rupture, emergence, paper-plus-desktop replacement, exposed pit, profile/interior/fissure lightning, mechanism, cutter bullet time, layered background, and final offline posters. Runtime visual-review PNGs stay unaltered; poster renders are a separate artifact class. Technical tests cannot override visual rejection.

Exact camera rake/timing, pit relief balance, final scroll distance, validated tuning constants, shared-shell exports, extraction compatibility, and numerical performance budgets remain implementation-stage determinations within the accepted design. They require measured evidence, not assumed acceptance from old packets.

- [ ] Close technical gates with current evidence.
- [ ] Obtain independent Astra critical/effects approval.
- [ ] Obtain owner visual and motion acceptance.
- [ ] Record remaining limitations and any explicit owner exceptions without weakening inherited failures silently.

Those steps do not authorize publication, live cutover, archival, or Git delivery. The immediate next action is owner review of this saved plan. Stop here; implementation remains blocked until plan acceptance, implementation authorization, and shared-shell readiness.
