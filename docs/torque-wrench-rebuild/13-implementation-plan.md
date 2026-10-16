# Torque wrench rebuild — implementation plan

## JG-038-LEAN-V1 — owner-selected verification amendment (2026-10-14)

The owner selected the lean policy in the integration/runtime handoff on 2026-10-14. [Contract18 §8](18-stage0-verification-contract-proposal.md#8-jg-038-lean-v1--owner-selected-verification-amendment-2026-10-14) supersedes only primary repetition counts: **20 phase measurements** (D/N × full/lite × five phases × one independent run) and **three fresh-context startup trials** (valid/missing/stale cache, one each). Numerical ceilings, hardware/natural-tier requirements, readiness fields, all functional coverage, and 60s phase windows (20s forward/20s reverse/20s holds) remain unchanged.

Repeat failed/incomplete/inconsistent observations. Positive ceilings other than refresh-bound p50 trigger two additional independent runs at 90–100% of the ceiling; zero ceilings repeat on failure. Preserve every attempt and worst governing value; missing observables remain UNVERIFIED. This is lean validation, not original 60-run/15-trial stability evidence. One [current checklist](../../project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/lean-verification-checklist-20261014-V1.md) binds source/build/harness/served identity and all attempts. No gate or owner/Astra decision closes through this amendment. Dev StrictMode, actual hidden/resume, capture-free performance and visual recordings use separate environments. Run full repository checks on stable final delivery, repeating affected checks after fixes; retain independent review for substantial changes, measurement correctness, shared boundaries, cleanup and effects.

**Current execution frontier (2026-10-14):** Stages0–2 are closed; Stage3 leaf exit is recorded; Stage4 attribution, private pit relief/electricity and opening handoff are implemented, with current-build review evidence prepared. Functional verification is partial: frozen s effects D/N70/70, clean opening D/N sweeps, cutter/control4×258/258, static14/14, desktop timeline9/9. Next: narrow timeline, all-tier mechanical parity and lifecycle/device checks through the [parallel handoff](HANDOFF-2026-10-14-parallel-functional.md); Stage5/6 remain pending. G0–G9 and Astra/owner acceptance stay open. Shared writes require explicit ownership and, for shared-shell paths, a new named window.

**Status (2026-10-14):** Owner accepted ordered implementation on2026-10-11 and autonomous orchestration on2026-10-12. [Stage0](../../project/work/evidence/torque-wrench-rebuild/03-stage0-readiness/README.md), [Stage1](../../project/work/evidence/torque-wrench-rebuild/05-stage1-integration/stage1-closure.md), [Stage2](../../project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/stage2-closure.md) closures and [Stage3 leaf exit](../../project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/stage3-exit-2026-10-13.md) are recorded. [Stage4 current evidence](../../project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/README.md) supports prepared review, not Stage4/G4/G5/G9 exit. Shared ownership, approved matrix/budgets and separate acceptance remain in effect.

**Work ID:** [JG-038](../../project/work/plans/JG-038-torque-wrench-rebuild.md). [Stage 0 evidence](../../project/work/evidence/torque-wrench-rebuild/03-stage0-readiness/README.md).

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

The original planning turn created only this artifact, without product code, builds, captures, servers, GPU work, commits, pushes, PRs, deployments, publication, cutover, or archival operations. Owner acceptance and implementation authorization were subsequently recorded on 2026-10-11 in the owner rulings. Product work still requires demonstrated shared-shell readiness. Coordinate resource availability before authorized builds/captures; the earlier research release is not a current reservation.

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

### Skill activation and autonomous dispatch amendment — 2026-10-12

Owner authorized autonomous orchestration of the remaining G0–G9 work after adding this roster. Use GLM-5.3-Flash/High for bounded implementation and GLM-5.3/High for contracts and independent review; either may increase to Max when warranted. GPT-6.1-Sol/High and Opus-5.5/High are authorized when greater capability is needed. The live native tool exposes Sol through fixed `tier-worker`/High; Opus-5.5 is not exposed, so it must not be silently substituted. Earlier seat recommendations are historical, not new launch authorization. Final Astra/effects and owner visual/motion requirements remain separate. No new Git delivery, publication, shared-shell ownership, or cross-chat messaging follows.

MasterSkillLibrary is reference-only. Every path below was verified on disk. Read each named SKILL.md **when entering its domain**, not all of them at child startup. Each child brief includes its applicable complete paths, read timing, accepted source contracts, exact write ownership, and observable checks. Do not install/deactivate plugins or edit global configuration. Project facts and owner instructions override a skill's legacy root-store, reduced-motion canvas, mechanical constants, or generic implementation examples. Static private paths retain zero narrative CAD/canvas.

| Agent / responsibility | Full skill path | WHEN to read / apply |
| --- | --- | --- |
| Parent: decomposition, ownership, integration | `C:/Users/Markimus/.codex/skills/parallel-workstreams/SKILL.md`; `C:/Users/Markimus/.codex/skills/codex-tiers/SKILL.md` | Before wave decomposition/dispatch; reuse accepted model authorization. Maintain one writer per file, stage order and independent review. |
| Parent: completion tracking | `C:/Users/Markimus/.agents/skills/unlazy/SKILL.md` | Before product work; use the existing accepted plan plus task evidence `07-autonomous-2026-10-12/GATES.md` and wave evidence, without replacing inherited root `GATES.md`, adding another orchestration authority or weakening gates. |
| Every agent using third-party APIs | `C:/Projects/skills-master/local/read-the-damn-docs/SKILL.md` | Before implementing unfamiliar React/Lenis/GSAP/Three/R3F/Playwright behavior. Read installed types/source and official docs for the actual version; no dependency upgrades by inference. |
| Timeline/conductor workers | `C:/Projects/skills-master/local/r3f-scroll-performance-guard/SKILL.md` | Before progress/store/clock/lifecycle edits, Stages 2–5: imperative frame reads, no per-frame React notifications, single conductor, clamped frame delta. |
| Conductor worker | `C:/Projects/skills-master/local/gsap-scrolltrigger/SKILL.md` | Before Lenis/GSAP integration or ScrollTrigger changes, Stage 2/G2/G5. Preserve 1.1s starting duration and avoid stacked scrub delay. |
| Motion author / camera director | `C:/Projects/skills-master/local/cinematic-gsap-lenis-motion-system/SKILL.md` | After baseline and interfaces are fixed, before authored pacing/camera paths in Stages 2–5/G1/G4/G5. Apply relevant pacing/clock guidance; live Three world follows build-threejs-scroll-worlds, not generic DOM demos. |
| Conditional image/video sequence author | `C:/Projects/skills-master/local/scroll-scrubbed-visual-sequence/SKILL.md` | Only if an authorized image/video sequence is actually introduced. Not required for the pure beat resolver or live Three world; current scope uses offline static posters, not a scrubbed film. |
| Motion author | `C:/Projects/skills-master/local/animate/SKILL.md` | Before authoring transitions/easing in Stages 2–5; use deliberate anticipation/impact/reading holds and reduced-motion equivalents. |
| CAD compatibility/mechanism worker | `C:/Projects/skills-master/local/cad-scene-graph-rigging/SKILL.md` | At Stage 3 before rig/applicator extraction. Preserve part keys, measured ladder, positive ring rotation, gear laws, cache and borrowed resources. |
| Drawing/opening/pit/scene worker | `C:/Projects/skills-master/local/build-threejs-scroll-worlds/SKILL.md` | Before scene composition/resource ownership and director integration, Stages 3–5. Adapt to one document-local world behind `cadGate`; do not create a second scroll spine. |
| Shader/rendering worker | `C:/Projects/skills-master/local/glsl-transition-shader-pipeline/SKILL.md` | Only before GLSL/material/shader/tier changes in Stages 3–5/G4/G6. Do not add deferred mask scanning. |
| Story/inspection/accessibility worker | `C:/Projects/skills-master/local/spatial-hotspot-a11y/SKILL.md` | Before inspection controls, projected callouts, keyboard/focus or equivalent DOM interactions, Stages 3/6/G7. |
| Verification worker | `C:/Projects/skills-master/local/playwright/SKILL.md` | Before creating/adapting browser verifiers; browser execution waits for parent-owned stable build and resource window. Reuse existing static verifier. |
| Verification / rendering / compatibility | `C:/Projects/skills-master/local/webgl-telemetry-verifier/SKILL.md` | Before camera/mechanics/shader/clearance/performance claims or runtime PNG collection, G2–G8. Actual telemetry and provenance accompany unaltered captures. |
| Build/asset validation / poster producer | `C:/Projects/skills-master/local/asset-and-bundle-hygiene/SKILL.md` | Before validating import chunks, Draco/assets, poster mapping and production build, G0/G2/G7/G8. No cleanup, publication or worktree pruning is implied. |
| Independent animation reviewer | `C:/Projects/skills-master/local/review-animations/SKILL.md` | After a stable motion delivery, before G5/G9 acceptance; read-only critique independent of author. |
| Motion correction worker | `C:/Projects/skills-master/local/improve-animations/SKILL.md` | Only after a concrete review/measurement defect warrants a correction pass; no speculative expansion. |
| Optional page-load investigator | `C:/Projects/skills-master/local/web-perf/SKILL.md` | Only if startup/load results fail approved budgets; supplemental to device-named GPU/frame measurements, not a replacement. |
| Agents processing large output | `C:/Users/Markimus/.codex/plugins/cache/context-mode/context-mode/1.0.169/skills/context-mode/SKILL.md` | Before bulk logs/source/browser analysis; use exposed context-mode tools and return derived findings. No plugin repair/install. |
| Offline poster producer | Plan Stage 6, approved scene sources and repository offline-render procedures | At Stage 6 after representative compositions settle. No dedicated still-render/provenance skill was found. Do not use mesh-generation or cloud media skills as substitutes. Preserve immutable source scenes, record settings/assets/hashes and desktop/narrow art provenance. |

Before **every** scrolling/cinematic edit, also read `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/docs/torque-wrench-rebuild/smooth-scrolling.md`. Domain readers use this worktree's live source, not the graph index for the protected sibling checkout. Wave ownership/contracts/results are recorded in `project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/README.md` and linked leaf records. Final owner/Astra acceptance is not inferred from autonomous implementation authority.

### Stage 0 — Authorization and integration readiness

- [x] Record owner acceptance of this plan and implementation authorization. Owner answered “yes” to the explicit combined approval request on 2026-10-11; see owner rulings.
- [x] Confirm shared-shell delivery, exact exports, lifecycle, fade/navigation behavior, poster interface, and private-entry integration contract. Confirmed in `6f4ee77f` source and delivered by merge `92bafba5`; local shared tests 8 files / 233 pass and tsc clean. File:line evidence is in the linked Stage 0 delivery report. Fresh QM-side transitions are separately recorded at `efea0537` (external evidence `0c345b70`, 7/7 both viewports); they do not prove torque-entry or shared-poster runtime behavior or close G0.
- [x] Confirm authorized resource use and current availability for the bounded readiness build/browser/capture/preview window; record ownership and release. Completed local 2026-10-11 run on port 4193; future runs recheck availability and performance-load suitability.
- [x] Record live worktree baseline and protected changes without resetting, cleaning, or switching branches. See Stage 0 evidence.
- [x] Register the approved work through `project/README.md`'s work-ID protocol, linking this plan rather than inventing or duplicating approval. JG-038 registration, registry row, and unchecked TODO entry added together.
- [ ] Continuing obligation at implementation-domain entry: read applicable skills through `project/context/agent-skills.md`; read `smooth-scrolling.md` before every scrolling/cinematic-motion edit. This remains active for future work, not an outstanding Stage 0 readiness blocker.
- [x] Establish verification devices, viewport matrix, baseline provenance, and approved phase-specific numerical budgets. Owner approved [contract 18](18-stage0-verification-contract-proposal.md) on 2026-10-11 after current local readiness/provenance checks and independent review. Approval is not numerical runtime acceptance; physical-mobile performance remains supplemental until a device is named.

**Exit — satisfied 2026-10-11:** Recorded implementation authorization, demonstrated delivered-shell readiness, bounded resource coordination and owner-approved device/matrix/provenance/numerical-budget contract. Domain skills continue to be read at each domain entry. Stage 1 creates the private entry; G0 verifies its integration afterward. Private-page performance, technical/effects/visual acceptance and all G0–G9 checks remain separate and open.

### Stage 1 — Private document and static foundation

- [x] Add the separate HTML/JS entry and consume shared fade/navigation primitives; keep the page private and avoid public navigation/cutover changes.
- [x] Establish ordered Drafting, Breakthrough, Mechanism, Inspection, and Close DOM chapters, controls, headings, and reachable footer.
- [x] Implement tier selection before evaluating narrative CAD/WebGL imports.
- [x] Implement poster/reduced-motion paths and WebGL-failure transition using the same semantic story.
- [x] Establish page-local store and cleanup for listeners, animation scheduling, Lenis, ScrollTrigger, and GPU resources.
- [x] Verify private topology, shared-shell parity, and existing-entry preservation.

**Exit:** Correct document boundaries and complete static interaction path. Temporary art cannot pass final poster acceptance.

**Static-foundation exit recorded 2026-10-12:** [Stage 1 closure](../../project/work/evidence/torque-wrench-rebuild/05-stage1-integration/stage1-closure.md), coordinated activation `69ac760b`, shared240/page-local20 tests, TypeScript/build/topology checks and14/14 real browser static/JavaScript-fallback cases (396 assertions). Actual renderer initialization/context loss, future Lenis/ScrollTrigger/GPU cleanup, final posters and all G0–G9 acceptance remain unverified. No Stage 2/3 work is advanced by this record.

### Stage 2 — Beat data and conductor

**Checklist reconciliation2026-10-14:** completed infrastructure items below are reconciled to `motion-baseline.md`, `contract-v1.md`, `stage2-gates.md` and `stage2-closure.md`. Remaining unchecked physical-range/composition/GPU-channel bullets are continuing later-stage obligations, not an unsatisfied Stage2 leaf exit. Final physical range/pacing and Stage3+ GPU application/acceptance remain distinct.

- [x] Audit existing Lenis, GSAP, progress mappings, `ScrollRig`, and `CameraRig` before constructing/tuning the replacement conductor or changing parameters; retain measured baseline evidence. (`motion-baseline.md`, Stage2 leaf ledger.)
- [x] Carry structure §2's beat contract: stable `id`, normalized `start`/`end`, optional title/copy, camera/scene/director IDs, interaction metadata, and poster reference. (`contract-v1.md`, pure timeline/registry tests.)
- [x] Resolve active beat, local progress, previous/next IDs, entering/active/exiting windows, and stable state key purely from canonical progress. These states must not depend on traversal history. (Stage2 pure tests and exact-build input/equality roster.)
- [x] Specify endpoint ownership and overlap handling; reject invalid windows and unknown director IDs. (Stage2 invalid-window/registry fixtures.)
- [ ] Keep physical scroll extent separate from beat semantics. Start near twice the measured JGUN-only distance; final distance remains unlocked.
- [ ] Use approximately 150–250vh per major cinematic beat and 60–120vh reading holds as provisional composition targets; reconcile them through review rather than fixing either as a budget.
- [ ] Drive camera, model, paper, pit, lightning, background, and DOM activation from one canonical progress value, without accumulated narrative clocks or per-scroll React rerenders.
- [x] Retain Lenis's 1.1s starting baseline. Correct motion paths and coordination before response tuning; no additional 1.0s GSAP scrub delay without demonstrated benefit. (Stage2 conductor contract/closure; final G5 response acceptance remains separate.)
- [x] Prove that adding a fixture beat/director changes only beat data, director, and registry entry, not the conductor, root page, shared shell, or `Scene.tsx` composition. (Stage2 pure extension fixture, checked leaf ledger.)

**Exit:** Forward, reverse, jump, reload, hold, and boundary sampling resolve consistently.

**Stage2 leaf exit recorded 2026-10-12:** [closure](../../project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/stage2-closure.md), current import-boundary/TypeScript/build topology, independent two-round source review, final-build17/17 timeline cases373 assertions and14/14 static/failure cases396 assertions. Canonical channels are exposed; GPU/director application enters Stage3. Provisional physical range and final pacing remain subject to later review. D-core/D-bake external extraction and parallel M1/private runtime work may begin under the saved contracts. This exit closes no later GPU/effects/performance/owner requirement.

### Stage 3 — Page-safe reuse and mechanical story

- [x] Prefer validated lower-level `sheetCamera` pose math, `introTimeline`, `paperFlex`, `breakthrough`, `breakthroughGeometry`, `portal`, `portalGeometry`, `electricalScore`, drawing geometry, and CAD/inspection primitives.
- [x] Extract page-safe primitives only where needed, preserving existing caller behavior. Do not mount `TorqueWrenchHero` or `DrawingLinework` unchanged.
- [x] Trace imports transitively to exclude root stores, chapter selectors, extra conductors/triggers, eager CAD loading, and hidden frame-accumulated narrative state.
- [x] Drive mechanism channels from canonical progress while preserving part-number identity, extraction order/offsets, gear relationships, clutch behavior, and inspection content.
- [x] Complete cutter camera arcs and subject-time mapping, including entry, exit, reverse, and accessible DOM controls. Measure subject slowing and camera motion independently. (exit-recorded 2026-10-13: four-case cutter roster 258/258 each measures installed subject transforms and camera pose/arc weight separately across entry/slow/exit/reverse; DOM controls keyboard/K range seek, Play/Pause freeze, native-scroll independence, Escape/close focus return. Arc framing was corrected after the first measurement showed the active disc crossing the desktop right edge.)
- [x] Keep optional transient pointer state outside canonical narrative state. (exit-recorded 2026-10-13: private host reads canonical progress imperatively per frame; the only transient state is the page-local `createInspectionPlayback` handle and the opening-sampler cache, neither of which enters the store or narrative sample.)

**Exit:** Compatible reuse and mechanical parity without root-runtime coupling. If a mechanical behavior change becomes necessary, update the spec §5 tables, README ladder, and required rig-skill tables together under coordinated scope before delivery; this plan does not authorize external skill-file or protected-checkout edits. Preserve the ladder by default.

**Stage3 integration checkpoint recorded 2026-10-13:** [checkpoint](../../project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/stage3-integration-checkpoint.md). Final current source has TypeScript exit0, full suite947 pass/4 skip, one lazy CAD gate, production build, real-browser static/fallback14/14, timeline17/17, and drawing integration5 PASS/1 BFCache-unverified. M1, D-core/D-bake, ring/shaft extraction and private sheet are integrated. The leaf exit remains open pending independent integrated review plus real cutter framing/clearance/control and matched mechanical-parity proof; Stage4 effects recovery has not begun.

**Stage3 leaf exit recorded 2026-10-13:** [exit](../../project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/stage3-exit-2026-10-13.md). Initial integrated review raised four FIX FIRST findings (shaft host cleanup reporting, shaft tool-factory cleanup forwarding, ring factory cleanup sink, held-opening resample on install); a round-2 review then required primary-before-cleanup ordering, which is now handled by a phase-aware collector in `inspectionFailure.ts`. On production build `.scratch/jg038-stage3-20261013-h` (aggregate `88e8038e…`), one task-owned preview: TypeScript exit0, boundary PASS (one lazy `cadGate→Scene` edge), final full CPU75files/950PASS/4skip (verified `.scratch/jg038-stage3-final4-tests.log`; earlier74/948 was intermediate), real cutter/controls roster4/4 at258/258 each, matched mechanical parity desktop/full3493PASS/0FAIL/0UNVERIFIED, static/fallback14/14(396/396), timeline17/17(382/382). This exit closes no G0–G9 gate and no Astra or owner acceptance; narrow/lite parity, BFCache, lifecycle stress, cold-bake responsiveness and performance budgets remain open. Stage4 opening/pit recovery subsequently proceeded; use the current checkpoint below.

### Stage 4 — Opening recovery and pit

**Implementation versus acceptance reconciliation2026-10-14:** completed work includes controlled camera/remap and pit-only attribution, private pit relief/depth/hidden closure, unified intermittent electrical score, opaque-pressure/lit-metal/aperture/desk null-render checks, and quintic opening→overview handoff. Final s effects D/N70/70 and clean opening sweeps support prepared review; this does not establish visual resemblance, continuous clearance, full G5/C1 or Astra/owner acceptance. The unchecked bullets below contain those combined acceptance requirements; they do not mean the implementation is absent. See the current evidence index and handoff for exact completed/pending separation.

**Stage4 in progress 2026-10-13:** [evidence](../../project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/README.md). Camera-law A/B differs by up to 0.490962 m position, 0.217352 m target and 2.0560 deg FOV. Pit-only attribution now passes15/15 at both observed viewports on build m; wall-position swaps change aperture pixels with zero control/restoration noise. Both contributions are measured without claiming a dominant aesthetic cause. Earlier opening captures labeled desktop/narrow actually used1280×720 and do not establish two-viewport proof. Private pit relief, intermittent unified electricity and quintic opening→overview handoff are implemented. Fresh build p hardware/full effects D/N each pass69/69 with one continuity limitation;108 unaltered PNG hashes/dimensions verified. Opening native-scroll diagnostics preserve a cold desktop1084ms rupture frame gap. Exact source/build/served-byte provenance and original failed effects run are preserved. Full G5/continuous clearance and Astra/owner review remain open.

- [ ] Compare current camera/remap behavior with the recovery candidate under matching assets, progress samples, renderer, tier, viewport, and lighting. Isolate camera/remap changes from pit geometry changes before attributing cause.
- [ ] Recover September 27 camera-rake intent, October 1 printed shatter, and October 2 model-driven pressure/continuous emergence without reverting approved handwriting or annotations.
- [x] Have `OpeningDirector` return plain state from canonical progress; keep scroll mapping, DOM copy, and accessibility outside it. (Pure sampler/cache tests and desktop runtime hold/reverse/seek proof; this does not close full G5.)
- [ ] Keep paper opaque during the model-driven bulge; measure transformed-vertex pressure and clearance.
- [ ] Reveal the already-lit wrench through first rupture and maintain continuous emergence.
- [ ] Make drawing paper and underlying wooden desktop give way in the model's wake. No separate pre-emergence cavern preview.
- [ ] Let `PitDirector` own irregular rock relief, steep near-vertical walls, depth, occlusion, and fissure propagation. Replace circular-hole/splined-collar appearance; no visible floor, bottom, or far closure.
- [ ] Preserve thin, irregular, branching light-blue electricity and accelerating burst/hold rhythm across profile trace, interior shard-defining fractures, and exposed pit fissures. These stages overlap; seams must not glow permanently.
- [ ] Verify lit metal, aperture occlusion, no desk exposed through rupture gaps, depth beyond sight, and continuous camera handoffs.

**Exit:** Hardware/full telemetry and unaltered runtime PNGs support independent Astra effects review and owner review. Recovery resemblance alone does not close acceptance.

**Stage4 review preparation checkpoint refreshed2026-10-14:** [prepared packet](../../project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/review-packet-20261013.md). Fresh build s D/N each70/70 hardware/full effects;71/71 served assets plus HTML match, including copied public CAD/drawing inputs. Source347 inputs and verifier/harness revisions bound. Synchronous whole-scene precompile moves hidden effects compilation before first reveal. Final `continuity-20261014-s3-D/N` each1083 observations,zero errors/failed requests,no>100ms gap,max17.1/16.9ms; join PNGs retained. Generated review manifest verifies347source/6preserved/4reports/116unalteredPNGs. Earlier timeout and s2 fetch failures remain preserved, cause unresolved. Final TypeScript and focused45 tests pass. Owner/Astra reviews have not run; full G5 input/pacing/stress, continuous-clearance and later gates remain open. Parallel compatibility and lifecycle/performance preparation is tracked in [parallel wave](../../project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/parallel-wave-20261014.md). Implementation and preparation do not mark visual recovery accepted.

### Stage 5 — Layered background and rendering

**Stage4 parent technical checkpoint2026-10-15 recorded:** [checkpoint](../../project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/stage4-integration-checkpoint-20261015.md). Independent camera sourceSHIP,affected64/64clearance,four259/259cutter/controlcases,16inputfunctionalcategorycellsPASS,192pointerassertionsPASS,actual30/15updateholds and currentnear-limitresponse repeats are bound there. This permits the dependency-ordered Stage5 implementation under existing authority; it is not owner visual/full-motion acceptance or G0–G9 closure. Originalfailures/UNVERIFIEDobservations remain explicit; final integrated validation still belongs to Package5.

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

All gates remain unchecked. These are local plan identifiers, not closure of inherited JG-035 G0–G6. Evidence belongs under `project/work/evidence/torque-wrench-rebuild/`, indexed by gate and exact source/build provenance. This section originated as planning; current partial executed evidence is recorded in task-local `07-autonomous-2026-10-12/GATES.md` and the dated leaf/effects records.

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

Those steps do not authorize publication, live cutover, archival, or Git delivery. Owner accepted this saved plan and authorized implementation on2026-10-11. Current action is the parallel functional-readiness wave and Stage4 review preparation from the2026-10-14 handoff, then ordered Stage5/6 implementation and current evidence. Stage0–2 closures and Stage3 leaf exit are retained; all formal technical/effects/visual/motion/publication gates remain separate.
