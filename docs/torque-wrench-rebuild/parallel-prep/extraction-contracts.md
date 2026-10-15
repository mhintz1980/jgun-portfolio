# Stage 3 extraction and resource contracts — interface v1

> Status reconciliation2026-10-14: this is the historical interface contract. Stage2 exit and Stage3 extraction/integration/leaf exit have since been recorded; do not restart extraction from its old baseline. Use [current parallel handoff](../HANDOFF-2026-10-14-parallel-functional.md) and current source/evidence for new ownership, lifecycle and parity follow-ups. Interface history retained below.

Work: JG-038. Date: 2026-10-12 (America/New_York). Workspace:
`C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`, branch `torque-wrench/rebuild`.
Source baseline `dc44fb79ed43d6a62db47ae58900afb718ad15d1` (HEAD verified this session).
Concurrent dirty Stage 1/2 files are listed in §7 and were not touched.

**Disposition.** Contract document only: no product edits, tests, builds, browser/server/GPU
runs, Git operations, or protected-checkout access. This file fixes the minimal Stage 3
extraction interfaces, resource ownership, and wave allocation. The drawing renderer/bake
branch is the priority deliverable; mechanics runs as a parallel parent branch. Private
runtime-world implementation follows Stage 2 closure and is not dispatched here.

Inputs read this session: plan13 (working-tree 2026-10-12 skill/dispatch amendment),
evidence-07 `contract-v1.md` and `motion-baseline.md`, `smooth-scrolling.md`, audit16,
reconciliation17, the four named SKILL.md files, and the live sources cited below. Audit16 /
reconciliation17 claims are relied on only where re-verified against current source at the
cited anchors. Line numbers are snapshot anchors, not permanent.

## 0. Ground rules binding both extraction waves

- **Root exclusion (G2).** Extracted cores must not value-import `scrollStore`,
  `qualityStore`, `inspectionStore`, root `App`/`Chapters`/`SceneCanvas`/`ScrollRig`/
  `CameraRig`, `Hotspots`, `InspectionScene`, `RingInspection`, or any module with
  import-time loader preload / ScrollTrigger registration. Type-only edges are allowed.
  Importing a component module for one pure symbol is forbidden; its module effects load too
  (`TorqueWrenchHero.tsx:472` precedent).
- All extracted modules stay below the private `cadGate.ts`. Static, reduced-motion, poster,
  and WebGL-failure paths never import them.
- **Sampling vs mutation.** Directors compute plain samples from canonical progress;
  applicators and bake take explicit inputs. No elapsed-time accumulator inside narrative
  paths. Caller-owned transients (gear idle, lamp settle) are explicit inputs and freeze when
  progress freezes.
- One active writer per file; exact wave write sets in §6. Legacy callers keep
  source-compatible exports; parity at matched inputs is a G3 requirement to prove, not assume.
- Extracted cores write no browser globals. `window.__rig`, `window.__telemetry`,
  `window.__drawingProof` remain legacy-adapter-only.

## 1. Contract D1 — root-free pose core with explicit tier and caller flex

Files: **new** `src/scene/drawing/poseCore.ts`; adapter `src/scene/drawing/extractionPose.ts`;
one additive export in `src/scene/drawing/sheet/paperFlex.ts`.

Move verbatim from `extractionPose.ts` (root edges at :5 default-tier read :170 and
module-field read :172): type `Extraction`; functions `extractionLift`, `relativePose`,
`lowestVertex`, `solveExtraction`, `bindExtractionPressure`, plus an explicit-input
form of `applyExtraction`.

```ts
export interface ExtractionContext { modelMatrix: Matrix4; sheetMatrix: Matrix4 }
export function createExtractionContext(): ExtractionContext
export function extractionLift(t: number, travel: number, pressureTravel: number): number
export function relativePose(t, layout, travel, initialZ, out: Matrix4,
  clearanceTravel?: number, pressureTravel?: number): Matrix4
export function lowestVertex(data: DrawingGeometry, matrix: Matrix4): Vector3
export function solveExtraction(data: DrawingGeometry, layout: DrawingLayout): Extraction
export function bindExtractionPressure(extraction: Extraction, layout: DrawingLayout,
  field: PaperFlexField | null, tier: string): void
export function applyExtractionCore(t: number, layout: DrawingLayout, extraction: Extraction,
  field: PaperFlexField | null, tier: string, out: ExtractionContext): number
```

Rules:

- `poseCore.ts` imports only three, `drawingGeometry` types/constants, `introTimeline`
  clamp/smooth helpers, and paperFlex numeric helpers (`paperFlexTierScale`,
  `PAPER_FLEX_MAX`, type `PaperFlexField`). No stores, no module-singleton field read, no
  default tier. `tier` and `field` are always explicit; `field` may be `null` (the
  `pressureTravel = 0` path). Cross-field solved state on `Extraction` keeps the current
  per-field/tier rebind law inside `bindExtractionPressure`.
- Null-field rebinding is explicit in the private core: full field -> null resets
  `pressureTravel` to zero and analytically recomputes `crossing` using `restMin`,
  with no vertex scan; it invalidates the cached field/tier binding. A later field
  rebind recomputes the exact bound. Test full -> null -> full, lite -> null -> lite,
  same-field tier changes, and two independent contexts. The legacy adapter keeps
  its current `if (field)` behavior: a missing global field must not silently change
  the legacy call's previously bound extraction. Private null semantics and legacy
  matched-input parity are distinct checks.
- Scratch matrices/vectors become context-internal (or stay module-private); outputs write
  only into caller-owned context matrices. One context per drawing consumer; no shared
  mutable output objects across pages/directors.
- `extractionPose.ts` becomes the legacy adapter: keeps every current export
  name/signature and the `drawingRuntime` singleton for old callers.
  `applyExtraction(t, layout, extraction, modelMatrix, sheetMatrix, tier = getQuality().tier)`
  delegates to `applyExtractionCore(..., getPaperFlexField(), tier, ...)`. Legacy behavior
  is unchanged.
- `paperFlex.ts` adds identity-guarded publication control (additive, legacy untouched):
  `export function clearPaperFlexField(field: PaperFlexField | null): boolean` — clears
  `activeField` only when it is the same object; returns whether it cleared.
  `makePaperFlexField` (:63, publishes :129) keeps publishing for the legacy adapter;
  `poseCore` never reads it.

## 2. Contract D2 — smallest sheet bake boundary (priority)

Files: **new** `src/scene/drawing/sheet/sheetBake.ts`; additive optional `signal` on
`prepareDrawingCache`; later adapter swap inside `DrawingLinework.tsx` (§6). No other
DrawingLinework changes.

### 2.1 `bakeSheet` interface

```ts
export type SheetBakeTier = 'full' | 'lite'
export interface SheetBakeInput {
  gl: WebGLRenderer
  data: DrawingGeometry            // borrowed; never disposed by bakeSheet
  layout: DrawingLayout            // caller derives makeDrawingLayout(1, data.bounds)
  tier: SheetBakeTier              // explicit; never read from a store
  cacheUrl?: string                // default '/drawing/jgun-sheet-v2.bin.gz'
  signal?: AbortSignal             // cancel: no fallback, no partial apply
  onCleanupFailure(errors: readonly unknown[]): void // host-owned evidence collector
}
export interface SheetBakeResult {
  layout: DrawingLayout; extraction: Extraction; rendered: RenderedDrawing
  uniforms: SheetUniforms; lines: Mesh; fills: Mesh; text: SheetTextLayer
  flex: PaperFlexField
  fracture: ReturnType<typeof makeBreakthroughGeometry>
  barrierMask: ReturnType<typeof makeBarrierMask>
  fragmentPrint: ReturnType<typeof makeFragmentPrint>
  crackMask: ReturnType<typeof makeCrackMask>
  stats: Record<string, number>
  pulseRegistration(): ReturnType<typeof measureProfileRegistration>
  dispose(): void                  // install-once, idempotent
}
export async function bakeSheet(input: SheetBakeInput): Promise<SheetBakeResult>
```

### 2.2 Bake order — verbatim from `DrawingLinework.tsx:282–311`

1. `await prepareDrawingCache(data, layout, cacheUrl, signal)` — miss/stale/broken asset
   returns `false` and the bake continues to live CAD composition; abort rethrows (§2.3).
2. `solveExtraction(data, layout)`
3. `composeSheet(gl, data, layout)`
4. `bakeProfile(gl, data, layout)`
5. `makeBreakthroughGeometry(rendered.profilePoints, SHEET_WIDTH, SHEET_HEIGHT)`
6. `makeBarrierMask`, `makeFragmentPrint`, `makeCrackMask`
7. `makeSheetUniforms` plus the current barrier/portal-sheet-size/flex uniform wiring
8. `makePaperFlexField(rendered.profilePoints, SHEET_WIDTH, SHEET_HEIGHT)`
9. `bindExtractionPressure(extraction, layout, flex, tier)`
10. `makeInkLines`, `makeInkFills`, `makeSheetText`
11. stats assembly identical (cacheMs, precomputed, extractMs, bakeMs, flexFieldPeak, …)

### 2.3 Fault, cancellation, late results

- `bakeSheet` owns no React state, no `forcePoster`, no console policy, no telemetry
  globals. Rejections propagate to the caller **after** partial resources are disposed:
  wrap steps 2–10 in try/catch and run the disposer for everything constructed so far. This
  closes the observed mid-bake gap before the disposer is assigned
  (`DrawingLinework.tsx:313–331` installs it only at the end).
- `prepareDrawingCache` additive signature: `(data, layout, url = default, signal?)`.
  Network miss / internal 8s header and 30s body timeouts (:180,:185) / decode or validation
  failure → `false` (live-bake fallback unchanged). Caller `signal` abort → clear timers,
  throw `AbortError`. No-signal legacy callers are unchanged.
- Stale/late results: the caller supplies an epoch/signal; a bake resolving after cancel is
  disposed immediately and never installed (parse-after-cancel disposal precedent
  `shaftRuntime.ts:297–311`). Cache fetch abort does not silently swap into the heavier
  live bake.
- Check the caller signal before cache work, after each await/decode, before installing
  any cache entry, before every synchronous allocation step, and immediately before
  returning a bake result. Caller abort throws `AbortError`; internal cache timeouts
  retain the existing false/fallback behavior. Remove linked abort listeners and
  clear owned timers in `finally`. An abort after cache installation does not evict
  a valid shared cache entry; it prevents this caller from continuing/installing a
  bake. An abort after result delivery belongs to the host: dispose that result and
  reject any late install via its epoch guard.
- Every allocating factory must dispose allocations it made before throwing, because
  the outer bake cannot dispose an object it never received. The outer disposer
  records each returned resource immediately, attempts every cleanup even if one
  disposer throws, and is idempotent. Preserve the original factory/abort error,
  report cleanup failures separately, and leave borrowed `data` untouched. Required
  fault fixtures cover each construction boundary, cancellation after cache resolve,
  abort before final return, and a stale result disposed exactly once by the host.
- Cleanup reporting has an explicit host channel: required
  `SheetBakeInput.onCleanupFailure(errors)` receives one frozen failure list after
  all partial/final cleanup attempts complete. Repeated `dispose()` is a no-op
  and never repeats the callback. A reporting-callback exception must not replace
  the original factory/AbortError or interrupt the remaining cleanup. Hosts own
  collecting these failures and terminal fallback policy; bake code logs nothing.
- `dispose()` covers exactly the current list (:313–321) plus the flex-field fix:
  `flex.texture.dispose()` then `clearPaperFlexField(flex)`; `fracture.dispose()`;
  barrierMask, fragmentPrint, crackMask; `rendered.dispose()`; lines geometry+material;
  fills geometry+material; `text.dispose()`. `data` (the snapshot) is never disposed here.

### 2.4 Private frame application — interface fixed now, implemented after Stage 2 closure

The private sheet presentation receives explicit per-frame inputs and performs no root reads:

```ts
interface DrawingFrameInput {
  intro: IntroState                       // drawingIntroState on canonical-mapped intro time
  tier: SheetBakeTier
  reducedMotion: boolean
  proofMode: string                       // page-scoped verifier port; default 'normal'
  retirement: number                      // 0..1 sheet translation, canonical-mapped by director
  cameraLookTargetWorld: Vector3 | null   // replaces telemetry.camera.goal (:806–812)
  cameraSheetDistance: number
  delta: number                           // clamped by caller; current law caps at 0.1
}
```

- Reading-lamp settle stays inside the sheet component (transient, non-narrative;
  `1 - exp(-3 * min(delta, 0.1))` retained), seeded from the first explicit target. Frozen
  target + zero delta must produce zero drift.
- Fragment ballistic law (per-fragment delays, `event^0.72`), ink reveal, portal updates,
  and uniform channel application move as-is: they are functions of `intro`/explicit
  inputs, not of root scroll. Legacy retirement windows (paced `.18–.22`) are not imported;
  the private director computes `retirement` from canonical progress.
- Outputs (model/sheet matrices, stats, phase telemetry) write to a page-scoped probe object
  supplied by the scene owner. The module-singleton `drawingRuntime` (:195–203;
  written :466–469, cleared :667–668) is legacy-only and must not be imported by private code.
- Failure policy (quality degrade / poster fallback) is the page/cadGate owner's decision;
  `bakeSheet` never degrades quality or forces a tier itself.

## 3. Contract M1 — mechanical applicator (parallel parent branch)

Files: **new** `src/scene/rig/wrenchMechanics.ts`; adapter
`src/scene/TorqueWrenchHero.tsx`.

```ts
export interface WrenchMechanicsFrame {
  shift: number        // 0..1 clutch
  explode: number      // 0..1; 'exploded'-mode callers pass 1 — no hidden mode logic
  gearAngle: number    // proxy sweep angle in radians (legacy anim.gearRotation, 0..8π)
  idle: number         // caller-owned transient sweep addition; private canonical passes 0
}
export interface WrenchMechanicsProbe { /* plain numbers mirroring telemetry.rig fields */ }
export function applyWrenchMechanics(rig: WrenchRig, frame: WrenchMechanicsFrame): void
export function writeWrenchMechanicsProbe(rig: WrenchRig, frame: WrenchMechanicsFrame,
  ghostOpacity: number, probe: WrenchMechanicsProbe): void
```

Move the bodies verbatim: `offsetZ` (:171); `applyShift` (:184 — fork
`shift * CLUTCH_SHIFT_DISTANCE` toward −Z; ring switch `+RING_SWITCH_TRAVEL_Z` with
**positive** `+shift * RING_SWITCH_ROTATION`); `applyExplosion` (:199 — `EXPLODE_OFFSETS`
ladder, K000004 bearing ring, sliding `clutch*explode + shift*CLUTCH_SHIFT_DISTANCE`, ring
switch riding the clutch offset, radial fastener smoothstep pop `GB_FASTENER_POP_M` complete
at `GB_FASTENER_POP_COMPLETE`); `applyGearRotation` (:251 — `(sweep + idle) ×
ROTATION_TURNS × 2π`, planet `−carrierAngle × GEAR_RATIOS.planetMultiplier`). Imports are
limited to `nodeRoles` types and `caseStudies` constants plus three's `MathUtils`.

No loader, GSAP, store, telemetry, drawing, inspection, ghost/material, or mode-switch logic
in this module. Ghost opacity and material/mode switching stay in the host; the applicator
touches only the transforms listed. The `TorqueWrenchHero` adapter keeps its proxy `anim`
(:83), ScrollTrigger timeline, idle accumulation, `window.__rig` (:80), inspection source
pointer, and `useGLTF.preload` (:472), replacing the inline bodies with calls. Identical
inputs at identical call sites must produce identical transforms (G3 matched-sample check).

## 4. Contract C1 — camera single owner; subject-time vs camera-time

- The private page camera director is the **sole camera writer**. Root `CameraRig`, its
  multi-station path, rest orbit, damping, and telemetry are excluded. Reuse directly (both
  root-free today): `introCameraPose(layout, aspect, t, out)` (`sheetCamera.ts:114`) and
  `sampleShaftCamera(time, aspect, kinematics, out)` (`shaft/camera.ts:169`).
- Subject time and camera time are two independent **pure functions of canonical beat
  progress**:
  - Subject: beat-local → story/master seconds → `sampleShaftKinematics`. Rate law
    `kinematics.ts:91–101`: slow window `RATE_SLOW = 0.22` spans 7.2–9.6 s, recap rate 4,
    machining frozen 15–24.6 s, hob windows 24.6–32 s (`machiningTimeAt` :129 is the
    closed-form integral — no frame accumulation).
  - Camera: beat-local → authored arc seconds → position/target/up/fov. The current fixed
    machining azimuth (`camera.ts:61–65`; anchors 7.2/9.7 s share framing) does **not**
    satisfy bullet time. The private director adds a data-only `CutterCameraArc` (C1
    keyframes in director data: subjectTime-gated azimuth/elevation/distance/fov/target)
    with nonzero translation **and** orientation rate while subject rate ≤ 0.22, including
    entry, exit, and reverse continuity. Reverse retraces both clocks exactly.
- Inspection, if activated for this page, is a page-hosted session inside the same one
  scene. No legacy `InspectionScene` import/registration (:13–16); no root `ScrollState`
  snapshot/restore (`inspectionStore.ts:59,102`). One renderer/scene owner arbitrates
  camera/render writers. Explicit user playback is a bounded interaction: story time
  advances from exactly one source per frame (user play **or** canonical mapping,
  host-arbitrated). Enter/exit never mutates page scroll; focus returns to the recorded
  trigger control. Session epoch/abort/late-result laws mirror `createStorySession` /
  `createShaftRuntime` (`session.borrowShared` / `session.own` pattern:
  `shaftRuntime.ts:276,465`).

## 5. Resource ownership and lifecycle

| Resource | Producer | Owner (disposer) | Borrowed by | Rule |
|---|---|---|---|---|
| Parsed `Default.glb` scene | useGLTF cache | Private model owner | rig, sheet bake, inspection | Document lifetime. Remount reuses `root.userData.wrenchRig` (`nodeRoles.ts:191–195,638`); never re-run the merge; sheet/inspection never dispose it. |
| WrenchRig + role materials + intro uniform + LCD cluster | `buildWrenchRig` | Private model owner | mechanics, drawing, inspection | CPU-side; survives remount and context loss for the document. `window.__rig` stays legacy-only. |
| `DrawingGeometry` snapshot | `snapshotDrawing` (hero :84 today) | Drawing director (private page) | `bakeSheet` `data` input | Bake never disposes it. Dispose only after `SheetBakeResult.dispose()` **and** last frame use. Legacy hero adapter intentionally keeps current behavior in the M/D waves (parity first). |
| `SheetBakeResult` (flex, fracture, masks, prints, rendered, ink, text) | `bakeSheet` | Sheet director | sheet materials/uniforms | §2.3 dispose list; identity-guarded flex-field clear. |
| Print materials/meshes/portal/grain/desk geometry | private sheet component | Sheet component | — | Unmount disposal mirrors current `DrawingPrint` effects. |
| drawingCache entries / `latest` | drawingCache module | Cache module (document lifetime) | `bakeSheet` | WeakMap entries die with `data`; `latest` strong ref (:26) accepted for the document/tooling export; no eviction API in v1. |
| Camera | private camera director | Camera director | inspection via host arbitration | Only camera writer; no second renderer/camera. |
| Inspection runtime resources | shaft/ring factory | Story session | narrative geometry/textures | Runtime disposes owned sets; borrowed narrative resources released via `borrowShared`, never disposed (`shaftRuntime.ts:450–465`). |
| Telemetry / proof ports | Scene owner | Page verifier port | — | Page-scoped caller-supplied objects; private path never writes root `window.__telemetry`/`__drawingProof`. |

Lifecycle semantics:

- **Remount / StrictMode.** Reuse the cached rig (never re-merge); cancel in-flight bakes via
  signal; dispose partial results idempotently; never install a stale bake (epoch check).
- **Context loss.** Freeze narrative sampling (unchanged canonical progress → no state
  advance). Rig, cache entries, and snapshot are CPU-side and survive. GPU-backed bake
  outputs are disposed, then re-baked from the same `data`/`layout` on restored context
  (cache hit makes the repeat cheap). The verifier must show no disposed texture/material is
  sampled after loss/restore. Renderer re-init policy belongs to the scene owner behind
  `cadGate`.
- **Focus / visibility.** Hidden tab freezes story/lamp inputs (the conductor owns
  visibility return); on return, narrative samples recompute from progress with no elapsed
  catch-up. Inspection focus-return to the trigger control on exit is mandatory; no scroll
  mutation on enter/exit.
- **Abort / late results.** Every async seam (cache fetch, GLTF parse, `text.ready`
  :471, compile) carries the page epoch/signal; late resolves dispose instead of apply.

Runtime proof dependencies (not run here): G2 value-import closure plus built-chunk/network
evidence including zero-CAD static paths; G2 lifecycle remount/cancel/context-loss/hidden-tab;
G3 legacy matched-input parity (transforms, registration, annotations, ladder/signs, ring
+Z travel and positive rotation) and independent cutter camera-vs-subject measurements
(position/orientation rate vs machining rate through entry, slow window, arc, exit, reverse).
Nothing in this document closes a gate.

## 6. Wave allocation — next executable writes

| Wave | Owner | Exact write set | Dependency |
|---|---|---|---|
| D-core | Drawing compatibility worker | **new** `src/scene/drawing/poseCore.ts`; edit `extractionPose.ts`, `sheet/paperFlex.ts`, `sheet/drawingCache.ts` (signal param only) | This contract and Stage 2 exit under accepted ordered implementation; preparation may overlap, production extraction waits |
| D-bake | Same worker, sequential after D-core | **new** `src/scene/drawing/sheet/sheetBake.ts`; edit `DrawingLinework.tsx` adapter call only | D-core |
| M1 | Parent mechanics branch | **new** `src/scene/rig/wrenchMechanics.ts`; edit `TorqueWrenchHero.tsx` adapter only | This contract; parallel to D (disjoint files) |
| C1 / private runtime | Stage 3 runtime wave | director data + private scene files (after Stage 2 closure) | Stage 2 conductor/store interfaces (evidence-07 contract-v1) |

Disjointness: D writes only drawing-family files listed above; M writes only
`wrenchMechanics.ts` and `TorqueWrenchHero.tsx`. No overlap, no shared files, and neither
wave touches the current dirty Stage 1/2 set (§7). Any incompatible interface need is
reported to the parent before edits; write sets are not expanded unilaterally.

## 7. Checks, limitations, ownership

Source/contract checks performed (read-only; no tests/builds per scope):

- Baseline confirmed: HEAD `dc44fb79ed43d6a62db47ae58900afb718ad15d1`, branch
  `torque-wrench/rebuild`. Untouched concurrent work: `GATES.md`, plan13,
  `scripts/check-torque-stage1-boundary.mjs`,
  `src/scene/torque-wrench/{Scene,Story,TorqueWrenchPage,cadGate,torque-wrench.css}`, and
  the untracked `project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/`.
- Re-verified against live source (not audit memory): hero mechanics bodies/preload/proxy
  (:80–84,171–263,472); rig cache (:191–195,638); pose root edges and singleton
  (`extractionPose.ts:5,170,172,195–203`); flex active field (:16–17,129); bake
  order/dispose/failure path (`DrawingLinework.tsx:282–331`, frame reads :677,:806–812,
  runtime clears :667–668); cache timers/`latest` (:26,171–193); kinematics rate law
  (:75–101,129); camera fixed azimuth + sampler (:61–65,169); inspection registration and
  root-scroll snapshot (:13–16; store :59,102); shaft session ownership and late-parse
  disposal (:276,297–311,450–465).
- The import-closure statement for the proposed new files comes from direct inspection of the
  named modules, not a full AST walk or built-chunk proof; G2 runtime proof remains open.

Limitations and unsettled items — none blocks the D/M extraction waves:

- `CutterCameraArc` keyframes are authored Stage 3 director data; only the requirement
  (moving camera through the slow window, pure reverse) is fixed here.
- Embedded vs modal inspection hosting remains a Stage 3 director decision; C1's
  arbitration/focus/no-scroll-mutation rules are the fixed part.
- Context-restore re-bake ordering needs the verifier's actual restore sequence; dispose +
  re-bake from unchanged `data`/`layout` is the default policy.
- G3 matched-sample scripts and G2 chunk evidence belong to parent-owned resource windows
  (tests/builds are serialized by the parent).
- Private-page snapshot disposal is assigned to the drawing director; legacy hero disposal
  behavior is intentionally unchanged in these waves.

**Ownership release.** This document is stable for D/M dispatch. Its single path is released
at save; no other path was written by this task.
