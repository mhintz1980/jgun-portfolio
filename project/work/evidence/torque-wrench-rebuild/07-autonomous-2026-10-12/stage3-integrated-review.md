# JG-038 Stage 3 integrated source review — initial bounded review, 2026-10-13

**Verdict: NOT PASS — FIX FIRST.** This is an independent source/contract review of the integrated Stage 3 working tree. It does not close Stage 3, G0–G9, runtime verification, Astra review, or owner acceptance.

## Review snapshot and method

- Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`; branch `torque-wrench/rebuild`; commit HEAD `4e620d48b4eb45a1e940f6b4684cf5e492fd6ab0`.
- Other writers were active. The review intentionally reads the current working tree, not only HEAD. At the final pre-save check, the reviewed source itself had uncommitted changes in `TorqueWrenchHero.tsx`, `InspectionDirector.ts`, `RuntimeWorld.tsx`, and new `inspectionProof.ts`; line references below are against that live state.
- Inputs read first and used as contracts: `HANDOFF-2026-10-13-stage3.md`, `stage3-integration-checkpoint.md`, task-local `GATES.md`, plan 13's 2026-10-12 skill/model amendment and Stage 3 section, `stage3-runtime-contract.md`, and extraction contracts D1/D2/M1/C1/resource ownership.
- Domain skills read before source review: `C:/Projects/skills-master/local/cad-scene-graph-rigging/SKILL.md` and `C:/Projects/skills-master/local/webgl-telemetry-verifier/SKILL.md`.
- Source inspected: private `Scene`/`RuntimeWorld`/`SceneBoundary`, page-local store and conductor host, `Story`/inspection playback, opening/mechanism/inspection directors, beat/timeline/registry, resource scope; M1 mechanics and the legacy hero adapter; shaft runtime/tool factories; ring runtime core/factory/legacy adapter; pose core/legacy pose adapter, sheet bake/cache/flex, private sheet presentation/runtime and legacy `DrawingLinework` adapter; and the new installed-inspection measurement/capture port. Direct source searches covered forbidden root-store/component value edges.
- The opt-in legacy mechanical-proof hook added in `TorqueWrenchHero.tsx` was reviewed at source level for boundary, not accepted as parity evidence. It remains root-page-only and does not add a private-tree root import.
- Not done and not inferred: tests, builds, browser/GPU execution, performance profiling, full lifecycle stress, verifier-script review, Stage 4 effects review, or full G0–G9 audit. The codebase graph was not used, and the protected sibling checkout was not accessed.

## FIX FIRST findings

### 1. P1 — the private shaft host disconnects every shaft cleanup-failure report

`src/scene/torque-wrench/RuntimeWorld.tsx:242-245` constructs the shaft session and calls `createShaftRuntime(session, ctx)` with no third argument. `src/scene/inspection/shaft/shaftRuntime.ts:105-109` accepts optional `ShaftLifecycleOptions`, and its all-attempt disposer at `shaftRuntime.ts:120-142` invokes `options.onCleanupFailure` only through that omitted option.

Result: synchronous construction-cleanup failures and final disposal failures can be collected locally but never reach `RuntimeWorld`'s `onFailure`/cleanup evidence path. This directly contradicts `stage3-runtime-contract.md:5,25`, which requires page-owned inspection resources to have explicit cleanup reporting and says the trailing `onCleanupFailure` carries the frozen all-attempt failure list.

Required resolution: pass a host-owned cleanup reporter from `RuntimeWorld` into `createShaftRuntime`. Preserve the original construction/disposal error and report cleanup failures separately; do not let a reporter throw interrupt cleanup or replace a primary error.

### 2. P1 — shaft tool-factory construction cleanup reports are also unwired

`src/scene/inspection/shaft/shaftRuntime.ts:161,163` calls `buildShaperCutter(shaperMaterial)` and `buildHob(hobMaterial)` without forwarding the runtime's `options`. Both factories explicitly accept `ShaftLifecycleOptions` and register their disposers with it (`tools.ts:97-100,172-175`); their disposer attempts every owned instance/geometry and reports through that option (`tools.ts:295-308`).

Once finding 1 is fixed, final tool disposal can reach the runtime reporter through `ownedDisposers`, but a construction fault inside either builder still cannot: the tool factory catches, attempts partial cleanup, and rethrows, while its cleanup failures are swallowed by the default empty options. This violates the reviewed factory amendment at `stage3-runtime-contract.md:25`.

Required resolution: forward the same lifecycle reporter from `createShaftRuntime` into both tool factories. Construction fixtures should prove a primary tool error plus separately reported cleanup failures, with every sibling resource still attempted.

### 3. P1 — the ring factory's new partial-construction cleanup sink is not connected

`src/scene/inspection/ringRuntimeCore.ts:212` calls `createInspectionRing(inputs.source, [...inputs.meshes])` without the optional cleanup callback. `src/scene/inspection/ringGeometry.ts:191-197` now creates the exception-safe ownership registry, disposes every partial allocation on construction failure, and reports through that callback.

`ringRuntimeCore` correctly disposes a successfully returned ring on a later construction error, but if the factory itself throws, its internal cleanup failures have no route to `inputs.onCleanupError`. This is precisely the unresolved cross-file obligation recorded at `stage3-runtime-contract.md:27`: the parent would wire the released `ringGeometry` sink into `ringRuntimeCore`.

Required resolution: adapt and forward `inputs.onCleanupError` into `createInspectionRing` (including its more specific construction resource/phase reports), while retaining the core's completed-ring cleanup and original factory error. A reporting exception must not interrupt sibling cleanup.

### 4. P1 — a held opening frame can retain the fallback sheet crossing after the real bake installs

`src/scene/torque-wrench/RuntimeWorld.tsx:59-62` seeds `sheetFrame.intro` with `sampleOpening(0)`, whose default crossing is `0.9`. The frame update at `RuntimeWorld.tsx:189-190` resamples only when canonical progress changes or `intro.t` differs from `openingTimeAt(progress)`. It does not resample when `sheetBake` first supplies the measured `extraction.crossing`.

Therefore, if canonical progress is already held in the opening while the bake is in flight, installation of the real bake changes neither progress nor `intro.t`; the first private-sheet frames continue using the `0.9` fallback sample until scroll moves. This is not merely cosmetic: `drawingIntroState` uses crossing to derive `waveStart`, `waveTime`, `waveActive`, and `lightSweep` (`src/scene/drawing/introTimeline.ts:334-370`). It contradicts extraction contract D2 §2.4, which requires the private `DrawingFrameInput.intro` to be the canonical-time `drawingIntroState` result with the actual solved crossing.

Required resolution: track the last crossing/bake identity and resample `sheetFrame.intro` when the installed bake supplies a different crossing, including at held progress. A focused fixture should cover fallback frame -> real-bake installation at unchanged progress -> movement only after the actual crossing is consumed.

## Source observations that are not Stage 3 blockers

- **Boundary and camera host:** direct import review found no private runtime value edge to the excluded root stores/components or legacy inspection scene; `cadGate` remains the sole lazy Scene entry in the recorded boundary evidence. Source has one R3F Canvas and one actual camera writer in `RuntimeWorld`. R3F's DOM `fallback` is not used as an initialization-failure callback.
- **M1 mechanics:** against parent `4e620d48^`, `wrenchMechanics.ts` is a verbatim move of the legacy transform laws and the hero adapter retains its loader/store/GSAP/material/idle behavior. Part-number-keyed ladder, rear extraction, K000004 placement, positive ring-switch rotation, carrier/planet laws, and cached-rig reuse are preserved in source. Matched-input runtime parity remains open.
- **Updated cutter arc:** the new target/FOV crop is data-only, retains the existing root-free sampler outside the arc, preserves baseline up/follow fields, and still authors nonzero position/orientation change through the slow window. The comment at `InspectionDirector.ts:55-58` is now stale because these values no longer "retain the baseline" target/FOV; correct it with the eventual cleanup. Actual desktop/narrow framing, occlusion, clearance, subject transforms, and controls remain unproved.
- **Inspection measurement/capture port:** `inspectionProof.ts` reads only the installed runtime/camera, introduces no second narrative clock, restores cutter visibility in `finally`, and rejects a non-presentation render target. Projected rect math can be inflated by geometry behind the camera, so browser proof must still check depth bounds; that is a verifier requirement, not a source blocker.
- **Private sheet ownership:** bake/cancellation and private presentation ownership otherwise follow the reviewed D2 structure, including caller-owned contexts, borrowed bake resources, identity-guarded flex publication, explicit presentation cleanup, and stale-result disposal. Finding 4 is the integrated-frame defect; it is not a reason to reject the extraction design.
- **Legacy adapters:** the pose and ring adapters retain their root/global behavior in adapter-only modules; the core modules remain root-free. Legacy behavior parity is a runtime gate, not assumed here.

## Explicitly open runtime/gate work

The following remain open and are not converted into source blockers by this review:

- real installed cutter framing, subject/camera transforms, occlusion/beauty-pixel A/B, and camera/scene clearance across required tiers/viewports and forward/reverse/hold/entry/exit;
- real explicit open/play/pause/seek/close/Escape operation, focus restoration, and arbitration against canonical narrative;
- matched-input legacy/private mechanical parity on the exact production build, including the new opt-in proof hook and census;
- StrictMode/remount/cancel/context-loss/hidden-tab stress, zero-frame React churn, and BFCache;
- hardware/adapter coverage, performance budgets, final art/effects, Astra technical/effects review, and owner visual/full-motion acceptance.

No G0–G9 gate is closed or waived by this initial review. Stage 3 exit remains blocked until every FIX FIRST above is resolved and independently re-reviewed, followed by the separate runtime proofs listed here.
