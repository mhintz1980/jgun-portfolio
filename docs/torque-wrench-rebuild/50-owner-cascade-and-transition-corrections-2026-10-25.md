# Owner corrections: drivetrain continuation and page transitions

Date: 2026-10-25. Status: **documented for the next implementation session; not implemented by this handoff session.**

Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`
Branch inspected: `torque-wrench/rebuild`
HEAD inspected: `57e903d6f9f4578916b1271cfb818cc19aef0a9e`

This is Mark's new direction after reviewing the plan-47 implementation. It supersedes the old post-Stage-1 cascade pacing and any earlier camera hold that conflicts with the requirements below. Keep the existing input-shaft engagement and initial Stage 1 rotation: Mark says that part looks good. This is not acceptance of the later cascade, the four reported page defects, or the whole page.

The repeated input-shaft paragraph in Mark's message is one request, recorded once here. Image annotations are reference evidence interpreted alongside his written request, not independent instructions to execute.

## 1. Read first and preserve the working tree

Read these in the intended workspace, in order:

1. `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/AGENTS.md`
2. `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/TODO.md`
3. `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/project/README.md`
4. This document, then `project/context/architecture/animation-spec.md` sections 5–5.4 and `project/context/agent-skills.md` under the same workspace.
5. Prior implementation/evidence documents, all under `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/docs/torque-wrench-rebuild/`:
   - `46-three-owner-corrections-2026-10-25.md`: existing opening, housing-finish and FOS work; preserve it.
   - `47-plan-stage1-axial-cascade-engagement.md`: original implementation contract; its later cascade timing is now superseded by this owner request.
   - `48-stage1-cascade-execution.md`: changes, model roles, asset hashes, tests, interpretation decisions and historical proof.
   - `49-stage1-critical-review.md`: first critical review failed the macro, DOM overlap and stills; second review passed the corrected baseline for owner review. That verdict does not approve this new sequence.

The current implementation and earlier owner corrections are **uncommitted**. Nothing was staged when this handoff was prepared. Refresh `git status --short --branch`, staged/unstaged diffs, HEAD and active ownership before touching code. All existing source changes predate this documentation session. Do not reset, clean, replace the checkout with HEAD, or overwrite untracked work. `.scratch/` must never be committed. No commit, push, deployment, publishing or broader G0–G9 closure is authorized by this handoff.

The source inspection below was read-only. No new browser reproduction, implementation, build or test run was performed for these new requests. Historical checks are identified separately.

## 2. Exact screenshot inventory

All eight files were found on disk. Keep the originals unchanged in `C:/Users/Markimus/Pictures/Screenshots/`.

| Reference | Absolute file | What it establishes |
|---|---|---|
| R1 framing | `C:/Users/Markimus/Pictures/Screenshots/continue-rotation.png` | Preserve approximately this close scale while continuing the counterclockwise orbit after the successful input-sun/Stage-1 engagement. |
| F1 fade-out | `C:/Users/Markimus/Pictures/Screenshots/i1.png` | Red/yellow numbered planet occurrences and missing cage/planet visibility; handle internals do not reveal gradually with the gearbox. |
| F2 completed knurl | `C:/Users/Markimus/Pictures/Screenshots/knurling -completed.png` | Ring has left the composition while the tool remains dominant. **There is a space before the hyphen.** |
| F2 empty transition | `C:/Users/Markimus/Pictures/Screenshots/knurling-tool-fadeOut.png` | Nearly empty frame after tool withdrawal while zooming out. |
| F2 late return | `C:/Users/Markimus/Pictures/Screenshots/knurled-ring-switch-inView.png` | Ring returns low/partly clipped after the empty interval; subject tracking has failed. |
| F3 restore start | `C:/Users/Markimus/Pictures/Screenshots/fadeIn-start.png` | Earlier restoration state with handle/gearbox internals visible. |
| F3 restore defect | `C:/Users/Markimus/Pictures/Screenshots/fadeIn-issue_finalCageAndPlanets-Handle-bgAndDesk.png` | Inverse of F1: uneven cage/planet/handle reveal during restoration. Include desk/background continuity in the inspection, without inventing a new background redesign. |
| F4 orbit endpoint | `C:/Users/Markimus/Pictures/Screenshots/keep-camera-moving.png` | Approximate shaft framing the continuous approach should reach when the other components have just fully disappeared. This eighth image was explicitly opened and inspected from disk. |

The prose aliases `knurling-completed.png` and `knurling-to-fadeOut.png` were **not** found as exact filenames. They refer to the completed-knurl and empty-transition files listed above. Screenshots have browser chrome and different viewport crops; do not infer exact FOV, world coordinates, progress, frame number or part identity from them. Reproduce each point and record live telemetry.

## 3. R1 — replace the rushed post-Stage-1 continuation

### Owner requirements, in order

1. Retain the successful approach: the input shaft engages the first-stage planets, drives their rotation, and the first-stage cage begins rotating.
2. Continue the **counterclockwise camera orbit around the input shaft**, at or near the zoom shown in `continue-rotation.png`. Do not immediately pull far away to fit the entire assembly.
3. As that orbit exposes the **integral sun on the first-stage cage**, fade in the **second-stage planets first**. They must already rotate in response to that sun.
4. Then fade the **second-stage cage into place on those planets while it is spinning**. The planet reveal and cage reveal are distinct, readable events. A whole-stage opacity ramp cannot express this request.
5. Continue the orbit to roughly **180 degrees around from the reference image**, stopping **before** a dead-on axial view looking back toward the handle, which is still absent. The image-relative composition controls the result; 180 degrees is approximate, not a command to blindly add 180 to one Euler field.
6. From there, **dolly away from the handle along a near-axial linear path**, establishing the drivetrain from input end toward output. Keep a slight off-axis view for depth and meshing visibility rather than looking exactly down the rotation axis.
7. Reveal the remaining cages in physical drivetrain order while the camera advances. The sequence ends with the drive/output shaft visibly rotating. Give the viewer time to follow the torque path instead of having all stages fall into line together.
8. **After the output shaft is rotating**, fade in the remaining gearbox, external components and handle.
9. Throughout that near-axial move, **the majority of the useful screen area should stay filled with drivetrain components appearing, turning and meshing**. Avoid a tiny gearbox surrounded by black. The camera is establishing the next part of the mechanism, not abandoning the subject during a wide pullback.

Only Stage 2's explicit planets-then-cage split is mandatory as stated. Repeating a similarly readable sun → planets → cage rhythm downstream is a sensible implementation option, not an additional owner instruction. Do not introduce large explosion/slide motions merely because the old schedule contained axial offsets; Mark is now asking for staged fades in a moving, tightly framed composition.

### Implementation assessment

- The old downstream entrance windows are packed into `40.2–43.0` study seconds. Simply offsetting a few start times inside the same small scroll interval is unlikely to solve the pacing. Establish explicit sub-beats and a larger usable **scroll budget** before writing the new camera path.
- Increasing the numeric duration from 43 seconds without increasing or redistributing scroll travel does not automatically give the viewer more time. Coordinate study seconds, private inspection progress, page progress and scroll pacing as one contract. Exact new durations and camera coordinates have not been prescribed by Mark.
- Current `cloneNeighbours()` clones each carrier with its planet children and collects one material list per complete stage. It correctly isolates materials between stages, but cannot fade a stage's planets separately from that stage's cage. Add independently owned **planet materials/opacity and carrier-only materials/opacity**. Separate material maps may be needed within a stage because role materials can otherwise be shared between its reveal groups.
- Keep the invisible carrier **pivot group active** so planets can orbit on it before the carrier's physical meshes appear. Setting the parent group invisible would incorrectly hide the planets. Preserve their local pin transforms and spin/orbit hierarchy; do not duplicate planets into the wrong frame to make the fade convenient.
- The forward sun belongs to the first-stage carrier, not to another copy of the input shaft. Target and validate that sun explicitly as the orbit reveals it.
- Main physical stage order remains **Stage 1 / A000591 / P001836 → Stage 2 / A000592 / P001837 → Stage 5 / A000606 / P001849 → K000004 support interval → Stage 3 / A000860 / P003045 → Stage 4 / A000861 / P003047 → output cluster P000095/P000207/K000001/K000074**. Names alone cannot reorder the rig.
- Preserve the input sun/carrier/local-planet conjugacy already established: 5.2 : 1 : −3.5 and the post-hob whole-tooth home index. The existing main-world display ladder is 8 / 5.2 / 3.38 / 2.20 / 1.43 in physical stage order. Those numbers are display-sweep turns/relative rates, not the number of turns completed in the short private finale. Do not blindly impose the input's 5.2 ratio on every downstream gear pair; inspect their actual teeth, pivots and phase.
- Author the orbit and dolly in a single understood registration frame. Main-model/study +Z points toward the snout/output; shaft-local +Y points toward the handle and maps to study −Z. World-space travel must pass through the current registration transform. Derive the near-axial endpoint from the actual model, with a small transverse offset and stable up vector; avoid a camera-pole/roll singularity.
- Use a straight or nearly straight **camera-position path** for the requested dolly, with the target advancing along the next torque-transfer region. Replacing it with another large orbit would change the request. Preserve continuous position, target, up and lens behavior at the orbit-to-dolly seam.
- The current private pool has eight downstream units and **does not include the complete handle/external assembly**. Closing the new sequence therefore needs either authenticated clones of the remaining units or a carefully matched handoff back to the source rig. The old context retirement/phase correction/source restore cannot simply run unchanged underneath the new ending. Avoid double geometry, phase jumps and a second unwanted fade cycle.
- Composition needs both contact legibility and screen occupancy. A safe but distant whole-model camera previously failed critical review. Track the active mesh/meshing region and rendered foreground coverage, not just a huge bounding box that encloses black space. Quantitative occupancy targets should be recorded in the next plan as implementation criteria, with owner comparison to the reference image; they have not yet been calibrated.

## 4. F1 and F3 — synchronized fades around Ring Switch isolation

### Owner-reported behavior

**F1, fade-out:** `i1.png` shows the final cage and some planets missing while other numbered planets remain. The preceding cage also has two remaining visible planets. The handle stays visually opaque too long, with no gradual reveal of its internals, then becomes transparent and reveals them in a single noticeable flicker.

**F3, fade-in:** `fadeIn-start.png` and `fadeIn-issue_finalCageAndPlanets-Handle-bgAndDesk.png` show the same inconsistency in reverse while the gearbox and handle return.

Desired result: smooth, coordinated transparency across the surrounding assemblies in both directions, gradual interior reveal, all expected cage/planet occurrences accounted for, and no single-frame switch. Use the numbered screenshot occurrences to identify the affected units; do not infer their stage IDs from appearance. Actual planet counts are dynamic; the rig historically has 4/4/4/5/4, so a screenshot pair is not a count specification.

### Source-based leads, not a reproduced root cause

- `RuntimeWorld.tsx` first applies mechanics, writes housing ghost opacity, then applies the isolation fade through cloned materials. Inspect **the effective product of those channels**, the original/clone associations and any second writer; one smooth commanded alpha is not proof of smooth effective visibility.
- `copyMaterialFade()` currently computes `clone.opacity = source.opacity * fade`, preserves source transparency, and changes depth writing at `fade > 0.5`. The housing ghost loop has its own `ghostOpacity > 0.5` depth-write switch. These threshold changes are strong candidates for a sudden reveal of previously depth-occluded internals. They are not yet proven to be the screenshot defect.
- Trace handle exterior versus handle internals, housing shells versus carriers, and each planet occurrence. Check per-material arrays, source opacity/depth state, group visibility, material sharing, transparent sort order and occlusion. Missing rendered planets can be a depth/sorting problem even when the scene graph still contains them.
- Define one stable, explicit fade/depth policy for the transition. For example, test whether disabling depth writing for fading exterior shells throughout their transparent interval avoids the interior pop, while restoring opaque behavior at the endpoint. Do not apply a global transparency workaround without checking its effects on internal gears and the Ring Switch.
- Add a per-occurrence census and pixel/occlusion evidence at dense samples across fade-out **and** fade-in. Check forward and reverse seeks, not just endpoints. Preserve the isolated Ring Switch as the subject and keep desk/background treatment continuous.

## 5. F2 — keep the Ring Switch in view through tool exit

Owner sequence: knurl finishes/tool disengages → ring drops from view while the tool dominates (`knurling -completed.png`) → empty frame during the pullback (`knurling-tool-fadeOut.png`) → ring returns clipped near the lower edge (`knurled-ring-switch-inView.png`).

Required correction: the Ring Switch remains the subject throughout completion, tool withdrawal, tool fade and the return to a useful whole-ring composition. No empty interval and no losing the ring while tracking the departing tool.

Source-based assessment:

- The private camera can lean toward `KT_UPPER_KNURL_WHEEL_RH`. `RuntimeWorld.tsx` supplies a die-derived focus to `samplePrivateRingCamera()` around the close-up. The camera table has close-up rows around page progress `.481–.4905` and whole-ring recovery at `.4945`, followed by restoration toward `.505`.
- Blend focus **back to the Ring Switch's measured center/contact region before the tool travels out of the useful composition**. Limit the die's influence by the ring's projected bounds. Do not fix the empty frame by hiding the ring earlier or delaying its reappearance until the camera catches up.
- Inspect sampling order and spaces: tool animation, current root/world matrices, current ring anchor, die focus conversion, camera pose and source/clone visibility must agree for the same sample. A stale matrix or a focus tied to a retracting die is a lead to verify, not a confirmed diagnosis.
- Validate clone/source handoff registration and readiness too. The host already has a readiness fallback intended to avoid blank direct seeks; determine whether the failure is camera composition, subject visibility, or both.
- Sweep the complete completion/withdrawal/restore interval, not only a still at the knurl endpoint. Measure on-screen ring size, clipping, occlusion and occupied pixels, and capture a continuous forward/reverse sequence.

## 6. F4 — keep the camera moving into shaft isolation

Mark sees a complete camera stop just before the fade-out into the input-shaft sequence. It reads as a frozen or lagging page. Continue the orbit toward the framing in `keep-camera-moving.png`; **the other components should have just fully disappeared when the camera reaches approximately that pose**.

The motion rule is: **while the scroll storyline advances, if geometry and opacity are unchanged, the camera must visibly move.** This does not require a new wall-clock idle wobble when the user has stopped scrolling, and such a wobble is not a substitute for a progressing authored path.

There is a concrete source lead: `createJourneyCameraSampler()` explicitly returns the same isolation pose across page progress `.590–.600`. `sampleJourney()` holds surrounding opacity at `.275` over approximately `.590–.596`, and freezes the source mechanism over a larger interval. That overlap can produce a motionless segment. This is confirmed source behavior; the exact screenshot progress still needs live reproduction.

Replace/retime that fixed interval as part of a continuous Ring Switch exit → orbiting isolation → shaft-entry path. Coordinate fade completion with the referenced shaft pose rather than inserting a hold before the camera starts the next leg. Preserve readiness and source/study registration safeguards. Check motion over **interior samples** as well as C0/C1 seams; a C1 curve can still have a visibly dead interval.

## 7. Important implementation files

All paths below are absolute. Read exact source before acting; line numbers drift and the graph is stale for changed files.

| Concern | Files |
|---|---|
| Clone pool, independent planets/cage reveal, shaft conjugacy, support policy, resources and telemetry | `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/src/scene/inspection/shaft/shaftRuntime.ts` and `shaftRuntime.test.ts` in the same folder |
| Current rushed stage timings, preallocated state, angle integral and story metadata | `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/src/scene/inspection/shaft/schedule.ts`, `schedule.test.ts`, `story.ts`, `kinematics.ts`, `kinematics.test.ts`, `frame.ts` |
| Macro, orbit, dolly and camera projection tests | `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/src/scene/inspection/shaft/camera.ts`, `camera.test.ts` |
| Private subject/camera clocks, ring camera/focus, ring time knots | `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/src/scene/torque-wrench/InspectionDirector.ts`, `InspectionDirector.test.ts` |
| Isolation orbit/hold and source/study handoff | `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/src/scene/torque-wrench/JourneyCamera.ts`, `JourneyCamera.test.ts`, `JourneyDirector.ts`, `JourneyDirector.test.ts`, `inspectionIsolation.ts` |
| Material clone/fade application, ring anchor/focus, scene ownership and browser probe | `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/src/scene/torque-wrench/RuntimeWorld.tsx` |
| Rig identity/material roles and source mechanical opacity/pose | `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/src/scene/rig/nodeRoles.ts`, `materials.ts`, `wrenchMechanics.ts`; `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/src/data/caseStudies.ts` |
| Private ring retiming/tool withdrawal and shared mechanical leaf | `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/src/scene/torque-wrench/RingInspection.ts`, `MechanismDirector.ts`; `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/src/scene/inspection/ringRuntimeCore.ts`, `timeline.ts` |
| Scroll pacing, native-scroll mapping and beat boundaries | `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/src/scene/torque-wrench/scrollPacing.ts`, `scrollPacing.test.ts`, `Scene.tsx`, `ScrollConductor.tsx`, `beats.ts`, `beatTimeline.ts`, `torque-wrench.css` |
| Actual vertex projection, flank visibility and occlusion | `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/src/scene/torque-wrench/inspectionProof.ts`, `inspectionProof.test.ts` |
| Narrative, transcript, static fallback and responsive clearance | `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/src/scene/inspection/shaft/script.ts`; `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/src/components/ShaftStoryLayer.tsx`, `StaticShaftStory.tsx`, `staticChapter.test.tsx`; `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/src/scene/torque-wrench/Story.tsx`, `torque-inspection-overlay.css` |
| Existing verifier and browser launch contract | `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/scripts/verify-stage1-cascade.mjs`, `verify-torque-owner-three-fixes.mjs`, `lib/browser-launch.mjs` |
| Models and new static image baseline | `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/public/models/Default.glb`, `manufacturing-core-full.glb`, `manufacturing-core-lite.glb`, `knurling-tool.glb`; `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/public/inspection/shaft/` |

First reproduction should map the eight screenshot states to live page progress. Use `window.__torqueNarrative.scrollFraction(p)` to drive native scroll and `window.__torqueWorld.snapshot()` for the applied state. Additional diagnostics include `__torqueWorld.inspection()` (actual cascade rectangles and shaft contact visibility) and `__torqueWorld.contactCapture()` (real glint pixel A/B). Extend those observables for planet-versus-cage fades, per-occurrence effective opacity, handle internals, ring framing and scene occupancy.

## 8. Gotchas and verification contract

- **Do not regress what Mark likes.** Preserve the cutter/material/hob story, input tooth engagement, initial Stage 1 torque transfer, and prior opening/FOS/smooth-black-housing fixes while replacing the continuation.
- Zero-allocation frame functions are AST-guarded in `shaftRuntime.test.ts`: preallocate new opacity/probe tuples at construction and mutate by index. Closed-form sampling must reproduce forward, reverse and shuffled seeks.
- Keep one writer per file. `RuntimeWorld.tsx` is shared by fades, ring camera and shaft restoration; `InspectionDirector.ts` is shared by ring camera and shaft clocks. Separate function blocks in the same file do not make concurrent writers safe. Settle interfaces first; parent integrates those shared files.
- Use part numbers, actual pin pivots and union bounds. Study millimetres, study metres, gearbox-local, ring-local, registered world space and the three progress/time domains are different. Do not reuse the same camera interpolation across them without conversion.
- The existing shaft story ends at 43 s, private inspection progress ends at `.940`, and the page maps this to approximately `.825`; context retires over `.825–.830`, phase correction runs `.830–.845`, and source surroundings return `.845–.855`. Retiming requires a coordinated update of duration, knots, journey handoff, manual seek, captions, tests and verifier oracle. The old verifier special-cases 43 s; its assertions are not timeless requirements for the new ending.
- Earlier critical review caught the failure of fitting the entire shaft/housing inside a macro: it made contact illegible. Keep a close active subject and let nonessential extremities crop intentionally. During the dolly, also avoid the opposite failure of a tiny drivetrain surrounded by black.
- The HUD is rendered in a portal. Narrow clearance fixes use a `body:has(.torque-inspection-overlay [data-shaft-cascade])` selector; scoping the rule only inside `.torque-page` did not reach it. Maintain actual DOM-versus-subject clearance, not just a CSS assumption.
- Static fallback images must be separate **UI-hidden, subject-cropped** captures, not re-encoded screenshots containing page text, browser chrome or controls. The baseline uses 8:5 desktop and 1:1 narrow. Regenerate captions/stills only after the revised story passes its actual proof.
- Protect `Default.glb`, `m249-transformed.glb` and `msp-enclosure.glb` hashes. Never run bare `gltfjsx --transform` on either protected textured/enclosure model. No asset regeneration is implied by these requests.
- The codebase graph reports generation `2026-10-25T07:41:36Z`, is not watching this checkout, and is stale for the changed runtime/camera files. `JourneyCamera.ts` has recorded parse gaps at old lines 85 and 87. Live source was read for the assessments above. Refresh/check graph coverage before structural claims; scripts/docs can be coverage gaps.
- Restart the task-owned preview after **every rebuild**; stale rotated bundle hashes can prevent the canvas mounting. Prior endpoint: `http://localhost:5281/torque-wrench/`; check its process and ownership rather than assuming it remains alive or stopping someone else's server.
- Test the actual scroll page, not only the manual modal or synthetic sampler. Dense temporal samples and continuous forward/reverse screen capture are required for the flicker and empty-frame complaints. Numeric opacity equality, mesh presence or pitch-circle math alone does not prove rendered visibility or collision freedom.

Suggested acceptance evidence for the next session:

1. R1: clear Stage 1 sun reveal; Stage 2 planets visible/spinning while its cage is still absent; then a separately visible, already-spinning Stage 2 cage. Record actual mesh/material membership and transforms, not only schedule booleans.
2. R1: correct counterclockwise orbit from the reference, near-axial endpoint short of dead-on, then a linear dolly toward output. Record position, target, up, FOV, signed travel, active-stage projection and usable-frame foreground coverage throughout; show that downstream reveals are readable and the screen stays filled.
3. R1: output already rotating before remaining shell/external/handle reveal; clean source/clone ownership and phase across the final handoff; no duplicate planets or new stop/pop.
4. F1/F3: all affected real occurrences accounted for, coherent effective opacity, smooth handle-interior reveal, and no abrupt depth/sort-driven disappearance across dense fade-out and restore samples, forward and backward.
5. F2: the ring stays visible and usefully framed throughout tool exit, with no empty interval, hard target jump or clipped late return.
6. F4: every progressing interior interval has visible geometry, opacity or camera change, and surrounding components are fully gone at the approximate `keep-camera-moving.png` shaft pose. Check the former `.590–.596` overlap explicitly.
7. Desktop and narrow, appropriate full/lite checks, HUD clearance, clean responsive stills, reduced-motion transcript parity, source/static tests, typecheck and production build. Keep exact checks/results and limitations in new evidence; don't relabel an old PASS as proof of the revision.

Historical baseline only: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/output/playwright/stage1-cascade-r3/report.json` passed 72 samples per viewport, ten mechanical and fourteen additional checks per viewport, with zero errors/context losses and six clean stills. Prior final build passed. The last broad source run had 580/581 tests pass with one 15 s cold scene-import timeout; the focused `cadGate.test.ts` rerun passed 2/2 in 4.94 s with one worker and a 30 s timeout. These facts are recorded in document 48; they do **not** validate R1/F1–F4.

## 9. Suggested skills and model/effort routing

Load only the phase-relevant SKILL.md, using the repository's skill map. These paths were checked as present:

| Need | Exact skill path |
|---|---|
| Model selection/role pins | `C:/Users/Markimus/.codex/skills/codex-tiers/SKILL.md` |
| Dependencies, disjoint ownership, integration | `C:/Users/Markimus/.codex/skills/parallel-workstreams/SKILL.md` |
| CAD identity, carrier/planet pivots and clone ownership | `C:/Users/Markimus/.codex/skills/cad-scene-graph-rigging/SKILL.md` |
| Cinematic mechanical staging | `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/.agents/skills/r3f-cad-cinematography/SKILL.md` |
| Material/depth/transparency behavior | `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/.agents/skills/threejs-materials/SKILL.md` |
| Deterministic scroll/R3F clocks and allocation constraints | `C:/Users/Markimus/.codex/skills/r3f-scroll-performance-guard/SKILL.md` |
| Continuous camera/scroll composition | `C:/Users/Markimus/.agents/skills/build-threejs-scroll-worlds/SKILL.md`; `C:/Users/Markimus/.agents/skills/cinematic-gsap-lenis-motion-system/SKILL.md` |
| ScrollTrigger API reference when relevant | `C:/Users/Markimus/.codex/skills/gsap-scrolltrigger/SKILL.md` |
| Runtime/pixel/mesh proof | `C:/Users/Markimus/.codex/skills/webgl-telemetry-verifier/SKILL.md` |
| Projected DOM clearance/accessibility | `C:/Users/Markimus/.codex/skills/spatial-hotspot-a11y/SKILL.md` |
| Build/static asset integrity | `C:/Users/Markimus/.codex/skills/asset-and-bundle-hygiene/SKILL.md` |

Use the installed `codebase-memory` skill before structural graph exploration. If another specialized skill is needed and not auto-listed, use `skill-find "<plain-language task>"`, choose one or none from the top three, and read its SKILL.md. A skill's generic animation recipe must not override the owner's choreography or this project's closed-form scroll contract.

Carry forward Mark's model instructions exactly:

| Role | Authorized models | Effort | Use |
|---|---|---|---|
| Implementation worker | GPT-6.1-Sol (`gpt-6.1-sol`) | Medium or high | Bounded implementation and focused checks. |
| Reading/basic tasks | GLM-5.3-Flash (`zai/glm-5.3-flash`) | Medium or high **when supported** | Source/image inventory, evidence extraction, bounded mechanical tasks. |
| Reading/basic alternative | GPT-6-Luna (`gpt-6-luna`) | High | Bounded gathering/basic work. |
| Adjudicator/final approval judge | GPT-6-Astra (`gpt-6-astra`) or Gemini-4-Argon (`google/gemini-4-argon`) | Medium or high | Resolve critical disputes and independently judge final evidence. |

**Only conduct adversarial reviews for critical tasks.** Shared material/depth policy, timeline/pose handoffs and final integrated acceptance are critical; routine reading, wording and ordinary reversible chores do not need an adversarial-review ceremony. Keep the final judge independent of implementation authors. Cap review at two rounds per piece and report any unresolved findings honestly.

Previous live native pins: `tier-worker` = Sol/high, `tier-reader` = Luna/high, `tier-reviewer` = Astra/medium. Previous routed GLM-5.3-Flash did **not** support medium, so high is the valid authorized option; do not round an unsupported setting silently. Gemini-4-Argon was not exposed in that direct subagent override roster. Refresh the **current delegation tool's** roster and efforts; sidebar availability is not subagent availability. Use Gemini only through a genuinely callable authorized route. Do not change fixed role pins, global configuration or the parent's model to manufacture availability. These authorized model ranges need no fresh selection unless the proposed dispatch falls outside them.

## 10. Exact next action

In the next implementation session: read this brief and the referenced repository rules/evidence, refresh dirty state/ownership, reproduce and map all image states to live progress, then save a checked execution plan covering **R1 and F1–F4**. Settle the new timeline, planet-versus-cage reveal interface, shared fade ownership and final source/private handoff before parallel writes. Begin the authorized fixes from that contract, preserving the successful first engagement and all unrelated work. Integrate, collect the acceptance evidence above, and use the authorized independent final judge on the critical integrated result. Do not implement only R1 and silently drop the four existing defects.

Saved receiving-session handoff and ready-to-paste prompt:
`C:/Users/Markimus/AppData/Local/Temp/jgun-torque-wrench-owner-corrections-handoff-2026-10-25.md`

Handoff validation: all eight screenshot paths and every standalone absolute reference in this brief resolved on disk. The tracked HEAD-diff SHA-256 was identical before and after writing these documents (`493fc0054fbcead87b08fdfd080ebd948571720f809e126778b33db59d324bc5`). This documentation session created only this owner brief and the temporary receiving-session handoff; it did not modify the existing code, assets, index or runtime.
