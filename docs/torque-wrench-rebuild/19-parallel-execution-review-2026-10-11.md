# JG-038 remaining work and parallel execution review

Date: 2026-10-11, America/New_York. Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`; branch: `torque-wrench/rebuild`. Observed HEAD: `8945fa95`. This is a review and proposed dispatch guide, not a replacement for the accepted ordered implementation plan or an instruction sent to another session.

## Recommendation

Keep the running Stage 1 session as the integration owner. Add three independent assignments now: motion/timeline baseline, extraction/resource contracts, and standalone verification tooling (with its evidence plan). Poster production planning or M249 page planning is another useful assignment if capacity permits. Once the current stage exits and contracts are fixed, turn the preparation assignments into disjoint implementation lanes within each subsequent stage.

The current authorization is ordered implementation. Preparation can overlap later-stage dependencies; production implementation and gate closure continue in the accepted order. This review does not authorize silently launching Stages 2–6 together. A revised execution order would need to be recorded separately. Parallelism within a stage is already supported by plan 13 §3 when contracts are fixed and files have one writer.

Start with the existing implementation session plus three lightweight lanes. The observed Stage 1 resource snapshot had high CPU load and limited free RAM. CPU-only source work can overlap; builds, browser verification, Blender rendering, and performance measurements need explicit resource ownership and should run one heavy job at a time on this laptop until a fresh check supports more.

## Current work: already assigned, do not duplicate

I inspected the active chat `Use $codex-tiers. Use GLM-5.3-Flash with High or Max effort…` (ID `01a12d12-b828-7880-9359-89608727eb11`), its actual subagent assignments, current files, and its Stage 1 evidence record.

| Existing owner | Reserved work | Observed state |
|---|---|---|
| Stage 1 GLM-5.3-Flash worker | `src/torque-wrench-main.tsx`; `src/state/torqueWrenchStore.ts`; `TorqueWrenchPage.tsx`, `Story.tsx`, `Poster.tsx`, `posterMap.ts`, `cadGate.ts`, `Scene.tsx`, `tier.ts`, `torque-wrench.css`, and scoped tests under `src/scene/torque-wrench/` | Assigned and still in progress at inspection; no completed foundation or G0 pass established |
| Stage 1 GLM-5.3 interface seat | `project/work/evidence/torque-wrench-rebuild/04-stage1-foundation/shell-activation-packet.md` | Packet delivered; actual activation remains unapplied |
| Stage 1 parent | `scripts/check-torque-stage1-boundary.mjs`, Stage 1 evidence, preservation checks, validation/integration | Checker written; implementation-dependent checks remain pending |
| Shell owner, coordinated with integrator | Private HTML and shared registry/topology activation | Coordination remains a dependency; delivered shell primitives themselves are ready |

At the final progress refresh, the new private entry, scene directory and store/tests had appeared in Git's untracked listing. The parent reported preparing a scratch-only diagnostic build of the JS entry. The chat remained active; no finished foundation, successful diagnostic build, activated HTML topology or G0 pass is inferred from that update.

The activation packet proposes exactly `torque-wrench/index.html`, `src/shared/pages.ts`, `src/shared/pages.test.ts`, and `src/shared/pageTopology.test.ts`. It reports that Vite already derives HTML inputs from the registry, so no `vite.config.ts` edit is needed. The entry must exist and its source boundary check pass before activation. Do not create another activation packet or implement those shared changes from an unrelated session.

The running chat has reported slow GLM seats. Adding a second writer to the same foundation would increase coordination and duplication. If the parent chooses to subdivide its unfinished assignment, it must first have the original worker surrender exact files, then hand those files to a new worker. The story/static surfaces could be separated from entry/store/lazy lifecycle in that explicit handover; they are currently reserved.

Stage 0 is closed. G0–G9 remain open. Historical Stage 0/budget statements in reconciliation 17 are superseded by the latest owner ruling, contract 18, Stage 0 closure, and the supplied handoff. Retain document 17's technical mappings and ownership findings, but do not use its older status banner to reopen approval.

## Assignments that can start beside Stage 1

All proposed new documentation below is under `docs/torque-wrench-rebuild/parallel-prep/`. These paths are proposed dispatch outputs, not files already produced by this review. Give each assignment its own file. They do not modify the current session's evidence or accepted plan.

| Assignment | Can do now | Exact proposed write ownership | Dependency before implementation |
|---|---|---|---|
| A. Motion baseline and timeline contract | Refresh the existing raw-scroll → paced → intro/pose mappings, GSAP proxy units, camera endpoints, idle/settle behavior, and shaft subject/camera time. Specify endpoint/overlap rules and progress-axis conversions. Retain earlier distance evidence with its provenance limitations. | `motion-baseline.md` | Stage 1 exit; integrator accepts resolver/store/director interfaces. No conductor tuning now. Fresh runtime distance measurements need a resource window and defined torque endpoint. |
| B. Extraction and resource contracts | Refresh only the relevant seams from audits 16/17. Decide the smallest extraction scopes, retained legacy adapters, borrowed/owned resources, cache/remount/context-loss/cancellation behavior, and source-level import boundaries. Name exact files for each future patch. | `extraction-contracts.md` | Stage 2 contracts and Stage 3 entry; exact writer assignments. Do not perform legacy code extraction now. |
| C. Verification preparation | Translate approved contract 18 and G0–G9 into assertions, telemetry requirements, test fixtures, failure injection, and evidence/provenance outputs. Reuse existing harnesses; mark which cases need the future scene. | `verification-plan.md` | Coordinates with the existing checker owner. New executable helpers only after exact names/API are agreed; runtime tests require activated entry and implemented features. |
| D. Offline poster planning | Inventory source scenes, asset versions and available stills. Specify Drafting, Breakthrough, Mechanism, Inspection, Close and background coverage, desktop/narrow framing, inspection equivalents, alt text and render provenance. | `poster-production-manifest.md` | Final art depends on accepted upstream visuals and Stage 6. No `posterMap.ts` changes while Stage 1 owns it; renders need a separate resource reservation. |

A and B must not repeat the entire existing audit. A owns mapping and sampling rules; B owns import/extraction/lifetime seams. C consumes both and owns evidence requirements rather than making product policy. D inventories and specifies art rather than claiming provisional art satisfies the poster gate.

Read-only accessibility review of the foundation can run once the worker provides a stable file set: semantics, focus order, reachable footer, equivalent inspection controls, and fallback behavior. Fixes to `Story.tsx`, `Poster.tsx`, CSS, and page composition go back to their existing owner until ownership transfers.

### Useful verification code that does not wait for the visual scene

There are also concrete standalone tooling assignments, rather than only more analysis documents:

| Tooling assignment | Proposed disjoint files, absent at inspection | Work that can proceed before later visual stages |
|---|---|---|
| Approved-contract report validator | `scripts/lib/torque-verification-contract.mjs` and its own uniquely named fixture test | Encode contract 18's requested/effective tiers, device/viewport configurations, phase budgets, deterministic tolerances and required observables. Validate synthetic reports; missing data must remain unverified. Define the input report schema before runtime integration. Do not edit product `renderBudget.ts`. |
| Offline poster asset validator | `scripts/check-torque-poster-assets.mjs` and its own uniquely named fixture test | Validate decoded dimensions, IDs, variants, alt text and offline provenance against supplied fixtures/shared poster types. Missing real art remains pending. Do not edit `posterMap.ts`, `Poster.tsx`, or produce final art. |
| Static/failure browser harness | Proposed `scripts/verify-torque-static.mjs` | Prepare its cases now; implement after Stage 1 publishes selectors, tier/failure ports and control behavior. Runs wait for the activated entry and a reserved browser window. |

Give one verification worker ownership of the first two standalone helpers, or split them into two disjoint workers if capacity allows. Combine C's documentation and E's tooling in one verification assignment if using the recommended four total sessions; their scopes are additive and do not require two sessions. CPU-only fixture checks can run in a coordinated validation window. No product-stage advancement or runtime pass is implied. The current Stage 1 owner continues to own its import checker: during this review it changed to traverse the lazy `./Scene` target. An earlier sidecar observation that it stopped at the lazy edge is stale. Reuse and review the live checker before commissioning complementary coverage; do not create a duplicate import checker based on that old observation.

## Implementation parallelism after each stage is ready

### Stage 2: pure timeline, conductor, and contract tests

First freeze the beat/resolver output, director interface, canonical store write port, and extension mechanism. Then split:

- Timeline owner: `beats.ts`, `beatTimeline.ts`, `directorRegistry.ts`, and their pure tests.
- Runtime owner: `ScrollConductor.tsx`, `src/state/torqueWrenchStore.ts`, and integration changes to private page/scene. One owner for canonical progress and lifecycle.
- Verification owner: independent fixtures/assertions for boundaries, invalid data, forward/reverse equality, direct seek, holds, and adding a beat without editing the scene/conductor spine.

The conductor can be built against a fixed resolver contract while the resolver is implemented. Actual integration waits for the implementation and tests. Do not tune response before mapping analysis; preserve the 1.1s Lenis starting baseline and avoid adding an unproven extra scrub delay.

### Stage 3: separate compatibility branches

This stage offers the largest implementation split, provided exact legacy adapters are allocated first:

| Lane | Existing source boundaries to inspect/modify only if required | Collision/dependency rule |
|---|---|---|
| Mechanical application | `src/scene/TorqueWrenchHero.tsx`; new explicit-input applicator selected in the extraction contract | Own the legacy hero adapter. Preserve part keys, measured ladder, positive ring rotation, clutch and gear laws. Loader-cache consolidation remains model-owner responsibility. |
| Pose and drawing context | `src/scene/drawing/extractionPose.ts`, `src/scene/drawing/sheet/paperFlex.ts`; new explicit-input pose/context seam | Requires explicit tier AND flex field. Core must not import the legacy adapter/root-quality store. |
| Drawing renderer/bake | `src/scene/drawing/DrawingLinework.tsx` and only selected sheet/cache modules | Starts after the pose/context and resource interfaces are fixed. May overlap mechanical work; serial with pose work if exact files intersect. Do not transplant the whole drawing stack. |
| Inspection and cutter mapping | Page-local inspection host/director; shaft `camera.ts`, `kinematics.ts`, `shaftRuntime.ts` as reuse sources; ring adapter only if needed | Fix playback arbitration, session cancellation, borrowed resources, focus/return behavior, and separate subject time from moving-camera time first. One camera/render owner. |
| Hotspot presentation, if needed | `src/scene/Hotspots.tsx`; callback/portal presentation seam | Only if required for the new page. Preserve keyboard/focus behavior and reserve this file to one compatibility owner. |

New helper names in these lanes are to be specified before dispatch; they are not existing exports or permission for broad refactors. Mechanical and drawing branches are good parallel workers. Inspection can be a third branch after its host/lease contract is fixed. Scene composition, CAD gate, store, and registry wiring remain with one integrator.

Compatibility verification can examine stable patches in parallel, but legacy runtime proof must bind the unchanged baseline and adapted source. Passing the historical portfolio roster does not verify the private page.

### Stage 4: opening and pit

Separate `OpeningDirector.ts` from `PitDirector.ts` after freezing their rupture/emergence state, coordinate basis, aperture/occlusion inputs, and allocation ownership. Opening owns camera rake, opaque paper pressure, printed shatter, continuous lit emergence, and coordinated electricity. Pit owns rock relief, steep walls, depth/no-bottom treatment and fissure propagation.

They can implement independently against that interface. One scene integrator applies their outputs. The controlled recovery comparison and final clearance/occlusion proof are integrated checks: do not mix camera/remap and new pit geometry changes in the same causal A/B comparison.

### Stage 5: background/rendering and verification

One rendering lane owns `BackgroundDirector.ts`, `backgroundLayers.ts`, `postProfile.ts`, `renderBudget.ts`, and optional `pointerDynamics.ts`; it consumes fixed canonical progress and scene/post ports. Background ownership stays separate from opening camera and pit geometry.

A verifier can prepare continuity, stationary-progress, low-FPS/tab-resume, input response, layer parallax, dither/banding, pointer suppression, and cap checks concurrently. Measurements run against a stable integrated build. Optional pointer work is a candidate evaluation, not a new mandatory feature.

### Stage 6: offline art and accessibility

Asset production can split by disjoint output subdirectories: ordered opening stills, mechanism/inspection equivalents, and background/crops. Use distinct derived scene/output files and preserve source scenes. One mapping owner reconciles approved outputs into `posterMap.ts`; one UI owner handles `Poster.tsx`/`Story.tsx` integration.

Accessibility/failure verification can run while offline art is being produced, but the final equivalent story, crops, mapping and provenance checks need the actual art. Runtime-canvas captures are effects evidence, not poster art. Static cold loads need zero narrative CAD requests and zero canvas mounts; runtime fallback must stop further loads but cannot erase prior downloads.

## Dependencies that remain serial

1. Current Stage 1 files → source checks/review → coordinated private HTML/registry activation → G0 integration proof.
2. Motion baseline and fixed contracts → Stage 2 implementation → compatible Stage 3 seams/director integration.
3. Pose/context/resource seams → drawing renderer integration; exact shared legacy file edits stay sequential.
4. Fixed opening/pit interface → separate implementations → integrated controlled recovery/occlusion evidence.
5. Stable integrated source/build/asset hashes → browser/performance/effects evidence → independent review and owner acceptance.
6. Replacement acceptance and JG-037 publishing condition → separately authorized publication/cutover. No delivery/publication authorization follows from this review.

Never give multiple sessions write access to `Scene.tsx`, `TorqueWrenchPage.tsx`, `torqueWrenchStore.ts`, `directorRegistry.ts`, shared shell files, the same legacy adapter, or the same evidence aggregate. A worker can request an integration edit; the assigned owner applies it.

## Remaining gates and suggested evidence owners

| Gates | Parallel work that helps | Final dependency |
|---|---|---|
| G0 shell/topology | Existing activation packet and independent review | Real private entry, coordinated activation, transitions and isolation |
| G1 pure timeline | Timeline tests alongside conductor implementation | Stable resolver/directors and extension fixture |
| G2 isolation/lifecycle | Import checker and cleanup/remount/failure fixtures | Real lazy scene, conductor and resource lifetime |
| G3 mechanics/cutter | Compatibility review per extraction branch | Integrated part/ladder proof, moving-camera cutter arc and DOM controls |
| G4 opening/recovery | Comparison specification and telemetry preparation | Controlled A/B, current geometry, clearance, depth and unaltered PNGs |
| G5 motion | Input/capture matrix preparation | Stable full sequence, wheel/touch/keyboard/scrollbar, seek/reverse/resume |
| G6 background/effects | Rendering lane plus independent effects review | Stable background/post integration and full-motion comparison |
| G7 static/accessibility/failure | UI review and offline asset production | Actual art, full/lite/narrow/static/failure roster and complete semantic story |
| G8 performance | Budget/report tooling | Device/GL provenance and uncontended stable-build measurements |
| G9 acceptance | Independent source/evidence review of completed packets | Astra technical/effects approval and owner PNG/full-motion acceptance |

## Safe execution across sessions

Use one integration owner and explicit file lists. For preparation, the current workspace is suitable with disjoint documentation paths. For implementation, subagents controlled by the integration session offer simpler ownership transfers. Separate sessions/worktrees can work after a usable source/contract snapshot is available; a new worktree at current HEAD alone omits the many uncommitted/untracked approved documents and the Stage 1 work. Supply those exact inputs deliberately and verify provenance before coding. Do not assume creating a worktree copies dirty state.

Use unique evidence directories and output names. Assign ports and browser contexts explicitly. Do not share a live browser/CDP session, overwrite a preview build's hashes while it is under test, or run competing GPU jobs during performance capture. Restart the applicable preview after a rebuild. Recheck resources; the Stage 0 release and Stage 1 resource snapshot are not reservations.

The active Stage 1 chat explicitly uses GLM-5.3-Flash/GLM-5.3 and prohibits Codex-native subagents in that chat without approval. Preserve that restriction there; role names in older documents do not override it. Final Astra/owner acceptance remains separate. This review did not send messages, launch implementation sessions, activate the page, mutate existing source, run builds/tests/GPU jobs, or perform Git delivery.

## Other task-queue work: avoid multiplying historical tasks

The independent queue review checked the local TODO, work registry and linked plans. These are recorded dispositions in this checkout, not a live source/runtime audit of other worktrees.

| Task | Remaining work and parallel suitability |
|---|---|
| JG-032 | Partially superseded by JG-033. Preserve necessary legacy Station 2 behavior; do not restart obsolete panel-lift/color work. Not a useful new standalone implementation lane from its unchecked box alone. |
| JG-033 / Quiet Machine | Independent page program in `C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine`, with its own owner. Product work can overlap torque work. Local amendment supersedes shared-progress migration/timing correction assumptions. Refresh that owner's actual progress before dispatch; this review did not inspect its checkout or identify a current QM chat in the recent listing. |
| JG-034 | Registry records the resize/refit fix landed with 6/6 cold-load proof; owner look remains pending. Acceptance/reproduction follow-up, not another greenfield fix. |
| JG-035 | Legacy implementation exists; remaining integrated owner-animation/hardware proof, the inherited full-tier opening failure and full visual acceptance belong with its existing integrator. Handwriting redo and cache regeneration are recorded complete in the newer handwriting gates (cache v8); older TODO v7/redo text is historical. Do not repeat manufacturing G0–G5 or undo approved Ac Fast handwriting. Legacy runtime work competes for the same laptop resources. |
| JG-036 | Registry and TODO record owner manual acceptance plus final native runtime PASS. The unchecked box is a closeout inconsistency; preserve existing hotspot behavior. No new feature lane follows from that box. |
| JG-037 / M249 | Genuine independent planning opportunity: define its separate-page import/runtime/fallback/hotspot boundary and implementation scope. The slot is reserved, not an approved implementation plan. Save a proposal under `project/work/inbox/JG-037-m249-page-proposal.md`; promote/register only through the work-ID protocol after acceptance. M249 completion remains a page-split publication dependency. |
| Queued section | JG-024/023/021/022/017/018/019 are checked records. Do not count them as seven remaining implementation tasks. Historical publishing/DNS text does not authorize current publication. |

Potential Quiet Machine sublanes from its accepted plan are product/preview work, transition verifier work, and render-pass attribution tooling. They are candidates to reconcile with the QM owner, not freshly established unfinished tasks: shell transition evidence already exists. `QuietMachinePreview.tsx`, `quiet-machine.css` and `preview.test.ts` are shared by multiple QM milestones and need one writer. Separate `scripts/verify-page-transition.mjs` and `scripts/measure-qm-render-passes.mjs` can have different owners only if they are not already assigned/completed. Performance attribution must precede speculative geometry optimization. Shared shell/registry changes remain coordinated with the shell owner.

A single documentation-closeout worker can reconcile stale TODO/INDEX wording after the current owners supply final evidence. That worker must own both files in a reserved window; this review leaves them untouched. This is a small administrative lane, not a reason to redo accepted implementation.

## Ready-to-paste preparation briefs

These are proposed new scoped assignments, not continuations of the Stage 1 worker. If dispatched by the owner, A–D and F authorize documentation preparation only; E authorizes the scoped standalone verification helpers and fixture checks. Combining C and E combines those scopes. Product implementation and gate closure remain subject to the accepted stage order. Each receiving session starts in `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench` on `torque-wrench/rebuild`, reads this absolute review path, AGENTS.md and the accepted plan, then refreshes live ownership/status. Do not access the protected sibling `jgun-portfolio` checkout.

### A — motion/timeline preparation

```text
Work in C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench on torque-wrench/rebuild. Read C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/docs/torque-wrench-rebuild/19-parallel-execution-review-2026-10-11.md, plan 13, structure 10, motion standard and audits 16/17. Stage 0 is closed; another session owns Stage 1. Prepare the Stage 2 motion baseline and resolver/director contract from current local source. Own only docs/torque-wrench-rebuild/parallel-prep/motion-baseline.md. Refresh raw/paced/intro/proxy/camera/story mappings, endpoints, overlaps, hold/transient behavior and separate cutter subject/camera time. Preserve earlier distance evidence and its limitations; specify fresh runtime proof without running it. No product edits, tuning, builds, servers, GPU, Git delivery, protected-checkout access or cross-chat messages. Return source citations, concrete interfaces, prerequisites and exact next action.
```

### B — extraction/resource preparation

```text
Work in C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench on torque-wrench/rebuild. Read C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/docs/torque-wrench-rebuild/19-parallel-execution-review-2026-10-11.md, plan 13, structure 10 and audits 16/17. Another session owns Stage 1. Refresh the smallest mechanical, pose/drawing, inspection and hotspot seams and their resource/import boundaries. Own only docs/torque-wrench-rebuild/parallel-prep/extraction-contracts.md. Specify exact future files/legacy adapters, inputs/outputs, borrowed vs owned resources, loader-cache/remount/context-loss/cancellation rules, dependencies and compatibility checks. Do not duplicate motion-baseline work or perform extraction. No product edits, builds, servers, GPU, Git delivery, protected-checkout access or cross-chat messages. Preserve dirty work; return a disjoint Stage 3 dispatch proposal with source citations.
```

### C — verification preparation

```text
Work in C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench on torque-wrench/rebuild. Read C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/docs/torque-wrench-rebuild/19-parallel-execution-review-2026-10-11.md, approved contract 18, plan 13 and current Stage 1 evidence. Own only docs/torque-wrench-rebuild/parallel-prep/verification-plan.md. Map G0–G9 to actual assertions, telemetry APIs, provenance, failure injection, stable-build prerequisites and evidence outputs. Reuse harnesses and do not rewrite the active owner's scripts/check-torque-stage1-boundary.mjs. Mark unavailable-feature cases honestly. No product/scripts edits, test/build/browser/server/GPU runs, Git delivery, protected-checkout access or cross-chat messages. Do not reopen approved budgets or claim any gate passed. Return exact proposed helper ownership and the next runnable checks once prerequisites exist.
```

### D — optional poster preparation

```text
Work in C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench on torque-wrench/rebuild. Read C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/docs/torque-wrench-rebuild/19-parallel-execution-review-2026-10-11.md, accepted design/structure and contract 18. Own only docs/torque-wrench-rebuild/parallel-prep/poster-production-manifest.md. Inventory approved source assets and specify offline-render coverage, desktop/narrow crops, essential inspection equivalents, alt text, provenance, output folders and upstream visual dependencies. Stage 1 owns posterMap.ts and Poster.tsx. Plan only: no art generation/rendering, CAD edits, product edits, servers, Git delivery, protected-checkout access or cross-chat messages. Final art remains Stage 6 acceptance work. Return a concrete production manifest and resource prerequisites.
```

### E — standalone verification tooling implementation

```text
Work in C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench on torque-wrench/rebuild. Read C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/docs/torque-wrench-rebuild/19-parallel-execution-review-2026-10-11.md, approved contract 18 and shared poster types. Another session owns Stage 1. Confirm ownership and that the proposed files remain absent. Implement only scripts/lib/torque-verification-contract.mjs, scripts/check-torque-poster-assets.mjs and uniquely named tests for these helpers. Own those exact new paths; preserve all other work. Validate supplied reports against the approved limits, distinguishing requested/effective tier and marking absent observables unverified. Define a documented fixture input schema; integrate with runtime telemetry later. Validate fixture poster files/IDs/variants/alt text/offline provenance without touching product mappings or generating art. Reuse the current import checker; do not create a competing one. Coordinate lightweight CPU fixture checks; no product edits, build/browser/server/GPU runs, Git delivery, protected-checkout access or cross-chat messages. Return exact changed paths, passing/negative fixture evidence, integration API and remaining prerequisites. This tooling does not close any runtime gate.
```

### F — independent M249 page planning

```text
Work in C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench on torque-wrench/rebuild. Read C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/docs/torque-wrench-rebuild/19-parallel-execution-review-2026-10-11.md, TODO's JG-037 reservation, project/README.md and page-split design/structure. Own only a new project/work/inbox/JG-037-m249-page-proposal.md; confirm it is unowned/absent. Plan a separate private M249 page, transitive import isolation, retained hotspot/inspection behavior, static/failure paths, shared-shell integration, exact proposed ownership and publication dependencies. The reserved slot does not authorize implementation. Preserve the textured m249-transformed.glb and its documented export protections. Do not edit product/shared files, start servers/builds/GPU, touch protected sibling checkouts, mutate Git or message other chats. Return an acceptance-ready proposal and exact next action.
```

## Evidence used and review limits

- Supplied temporary Stage 1 handoff and durable prompt 14; current accepted plan 13, design 09, structure 10, approved verification contract 18 and Stage 0 evidence.
- Audits 16/17 for source seams and mapping/lifetime dependencies; historical readiness claims treated as superseded.
- Active Stage 1 chat, actual reserved write scopes, Stage 1 README/activation packet and live Git state. Running state is a snapshot; refresh before dispatch.
- TODO.md, project/README.md, work registry, current handwriting gates, JG-033 page-split amendment/integration plan, JG-036 scope and page-split structure for other remaining work. Separate-worktree execution state remains unverified.

This review assesses scope, dependencies and ownership. It is not fresh runtime, performance, visual, or gate evidence.

Independent read-only final review found one scope-language conflict in the briefs' introduction; it is corrected above. No other blocking corrections were reported. Document structure/paired code fences and whitespace were checked; no builds, runtime tests or product acceptance were performed for this planning review.
