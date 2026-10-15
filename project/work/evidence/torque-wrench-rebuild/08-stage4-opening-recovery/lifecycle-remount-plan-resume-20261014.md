# JG-038 Lane A — StrictMode setup/cleanup/setup remount census plan (resume 2026-10-14)

Lane A lifecycle preparation, wave-ledger v2. Sole authorized write of this lane: **this file**.
Status: preparation only. No harness created, no product/source edits, no browser/build/GPU/test
launch, no commit/push/publish/cutover/archive by this lane. The existing lifecycle harness is
untouched. Ownership of this path is released to the parent on delivery.

## 1. Inputs and current-state observations (read-only)

| Input | Taken from it |
| --- | --- |
| docs/torque-wrench-rebuild/HANDOFF-2026-10-14-parallel-functional.md | Lane dispatch, boundaries, skill activation triggers |
| wave-ledger-20261014-resume.md | Lane A ownership v2; sole write path; done-when |
| lifecycle-functional-prep-20261014.md | Harness contract and case semantics; StrictMode integrated remount listed as explicitly unverified, requiring a dev harness |
| parallel-lifecycle-perf-prep-20261014.md | Expected StrictMode diagnostic end state (mountCount=2, disposeCount=1, activeConductors=1, current owned-resource counters at 1, cleanup failures 0, one Scene request); source posture table |
| scripts/verify-torque-lifecycle-functional.mjs | Guard/report conventions to mirror; DOM-churn-is-not-commit-proof posture |
| C:/Projects/skills-master/local/r3f-scroll-performance-guard/SKILL.md | Read before lifecycle interpretation: zero-rerender invariant (imperative progress reads in useFrame; no setState in useFrame or ScrollTrigger callbacks) |

Observations recorded by this lane (read-only inspection, 2026-10-14):

- **Harness hash lineage (parent owns reconciliation).** The prep doc recorded delivery-time
  harness SHA256 5e49aeae173add0d42d5e773d095838ce28a147be0b13cd044e52cc8f7ea5d5f; the live file
  scripts/verify-torque-lifecycle-functional.mjs hashes to
  a5b149a7fde7b132fe4780f6afb2e2bf2c0c3a2e965ae1243cc8c60e9128bbaf, which is exactly the SHA the
  wave ledger binds as independently reviewed. The bytes changed after delivery. Recorded as an
  observation only; this plan does not depend on the difference and modifies nothing.
- **StrictMode is already the root of the private entry.** src/torque-wrench-main.tsx wraps
  TorqueWrenchPage in <StrictMode> (import at line 1, root at lines 32-34) and creates the store
  once per document outside React; installPageFade is document-scoped and uninstalled only on HMR
  dispose. No entry change is needed to observe the StrictMode cycle.
- **StrictMode double behavior is development-only** (official docs, section 2), so the frozen
  production build s cannot exercise setup->cleanup->setup. Any remount census must run on vite
  dev as a separate dev-only document, never against the frozen build or its :5288 preview.
- **Concurrent-repair notice.** While this plan was written, another session is repairing
  Scene.tsx. This plan therefore cites Scene.tsx by symbol only (rendererSupported capability
  probe, __torqueNarrative effect, ScrollConductor, Canvas) and requires re-verification of live
  file hashes at implementation time (section 7, step 7). It does not touch code.

## 2. Installed-version evidence (observed from node_modules, 2026-10-14)

| Package | Installed | Evidence |
| --- | --- | --- |
| react / react-dom | 19.2.8 / 19.2.8 | node_modules/react/package.json, node_modules/react-dom/package.json |
| @react-three/fiber | 9.7.0 | Canvas root mounts in useIsomorphicLayoutEffect via createRoot(canvas) and cleans up via unmountComponentAtNode(canvas) (node_modules/@react-three/fiber/dist/react-three-fiber.esm.js:62-119), so the StrictMode setup->cleanup->setup cycle applies at the Canvas root |
| three / drei | 0.185.1 / 10.7.8 | node_modules/three/package.json, node_modules/@react-three/drei/package.json (useGLTF/Draco) |
| gsap / lenis | 3.15.0 / 1.3.26 | node_modules/gsap/package.json, node_modules/lenis/package.json |
| vite / playwright | 7.3.6 / 1.56.1 | node_modules/vite/package.json, node_modules/playwright/package.json; package.json "dev": "vite"; vite.config.ts appType:'mpa' |

Official behavior grounding: react.dev/reference/react/StrictMode (fetched 2026-10-14) —
development-only checks: components re-render an extra time, Effects re-run an extra time
(setup, cleanup, setup), ref callbacks re-run; no production-build impact. Docs page served as
react v19.3; installed is 19.2.8. The behavior applies across 19.x, and a cheap implementation-time
recheck against the installed sources is listed as prerequisite step 7.

## 3. Proposed files (exact paths; none created by this lane)

- **F1  lifecycle-census.html** (repo root). Dev-only document. vite dev with appType:'mpa'
  serves root-level HTML without any vite.config.ts change (the PAGES rollup input list,
  vite.config.ts + src/shared/pages.ts:71-77, affects build only).
- **F2  src/torque-wrench-lifecycle-census-main.tsx** (new dev-only entry). Mirrors
  src/torque-wrench-main.tsx — same StrictMode root, same createTorqueWrenchStore +
  TorqueWrenchPage — and adds census-only instrumentation that touches no existing file:
  - pre-React pass-through wrapper on HTMLCanvasElement.prototype.getContext recording
    {type, connected, ts} into window.__torqueCensus.contexts (same injection shape as the
    existing harness init-failure probe; no denial, no behavior change);
  - a store.subscribe recorder capturing the sceneStatus timeline into window.__torqueCensus.status;
  - CensusProbe components whose own useEffect pushes {name, phase: setup|cleanup, ts} events —
    React commit evidence (effects run after commit) — wrapped around the page from the census
    entry; per-resource counts inside existing components come from channels A/B, not probes;
  - end-of-run collection of window.__torqueCensus, window.__torqueNarrative.diagnostics(),
    window.__torqueWorld.snapshot(), and performance.getEntriesByType('resource') filtered to
    Default.glb, /draco/, the Scene module graph, and drawing/cache assets.
- **F3  project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/lifecycle-remount-census-runner-<date>.mjs**
  (new Playwright driver, evidence-dir harness precedent like continuity-harness-20261014.mjs).
  Output guards mirrored in kind from scripts/verify-torque-lifecycle-functional.mjs: report
  under project/work/evidence/torque-wrench-rebuild/, refuse an existing path, never inside
  .scratch or any build dir.
- **F4  Report path pattern:** lifecycle-remount-census-<UTCstamp>-<tag>.json in the same
  evidence dir; fresh unique path per run, overwrite refused.

## 4. Lifecycle evidence rule (DOM mutation is not React commit proof)

Effect events establish the observed probe's setup/cleanup sequence. Conductor diagnostics
and the store sceneStatus timeline establish their own lifecycle transitions. They do not count
every React commit, distinguish StrictMode effect replay from an additional commit, or establish
zero commits in sibling or descendant components. A future commit census needs React Profiler
instrumentation or an equally direct installed-version mechanism covering the target subtree;
its instrumentation overhead must be disclosed. DOM MutationObserver counts (as in churn-scroll)
remain a functional proxy. The census adds no per-scroll React state and no setState in
useFrame, preserving the skill's zero-rerender invariant and the store's deliberate no-emit
progress path (torqueWrenchStore.ts:123-147).

## 5. Expected one-owner/resource/request observations and counters

**Channel A — conductor diagnostics** via window.__torqueNarrative.diagnostics() (Scene.tsx
probe; store-backed, WeakMap-recorded). Expected steady state after the StrictMode cycle:

| Counter | Expected | Basis |
| --- | --- | --- |
| activeConductors | 1 | conductorRuntime.ts:136; WeakMap lease :117; duplicate owner rejected :109-117 |
| mountCount | 2 | :143; one per setup cycle |
| disposeCount | 1 | :228; StrictMode cleanup only |
| lenisInstances / lenisScrollHandlers / tickerCallbacks / scrollTriggers | 1 / 1 / 1 / 1 | owned sets; reverse-order release :159-219 |
| domListeners | 3 | resize, pageshow, visibilitychange |
| storeLifecycleSubscriptions | 1 | single store.subscribe in conductor |
| invalidProgressInputs / startupFailureCount / cleanupFailureCount | 0 / 0 / 0 | no defect permitted for PASS |
| lagSmoothingMode | 'already-configured' on the surviving cycle | module-level lagSmoothingConfiguredTickers WeakSet persists across remount; configured once per ticker by design and never restored — expected, not a defect |

**Channel B — world port** via window.__torqueWorld.snapshot() (RuntimeWorld.tsx:157 installs;
:158 guarded delete of a stale port). Expected final: ready=true; frames>8 and advancing;
hiddenFrames=0; sheet.baked=true; exactly one live port. renderer.calls/triangles/geometries/
textures, backend, effectiveDpr, drawingBuffer recorded as observations, not judged.

**Channel C — census effect events.** Each probe name expects exactly the sequence setup,
cleanup, setup, then silence; no HMR during the run (import.meta.hot recorded; restart the dev
server if any file changed mid-run).

**Channel D — context census.** Detached capability-probe getContext calls (Scene.tsx
rendererSupported useMemo; may run twice under double render) are recorded as observations and
never counted as a live context — the precheck must never be labeled construction evidence
(existing harness contract). Connected: exactly 1 canvas element and 1 live WebGL context at
steady state; the per-cycle construction pattern expected from the R3F root remount is
create=2 / dispose=1, recorded as observation only, PASS judged on steady state.

**Channel E — request census.** Record the actual Scene module, Default.glb, all /draco/
decoder resources and drawing/cache requests individually, including cache status. The
module-level cadGate promise predicts one load wave; a network resource count alone cannot prove
how often the import API was invoked. Do not require one decoder request: its JavaScript/WASM
roster may contain several resources. Establish exact request expectations from the installed
loader and cache condition before turning any count into a check; otherwise mark it UNVERIFIED.

**Channel F — status timeline** from the store recorder: idle -> loading -> ready; never
'failed'; no regression after ready.

Source-inferred expectations (not directly observable without touching sources; verified only
through their observable consequences):

- ResourceScope cycles create=2 / dispose=1 / live=1 (RuntimeWorld scope effect;
  resourceScope.ts own/defer reverse-order dispose). Consequence checked: ready=true, one live
  port, no cleanup-failure AggregateError, sceneStatus stays 'ready'.
- PrivateSheet presentation runtime create=2 / dispose=1 / live=1 (PrivateSheet.tsx:28-59
  allocate-after-commit useLayoutEffect with dispose on cleanup). Consequence checked:
  stats.shaderWarmReady=1 in the final snapshot.
- runSceneLifecycle handles 2 / disposed 1 (sceneLifecycle.ts dispose only sets live=false).
  Consequence checked: single import wave (E) and exact status timeline (F).
- matchMedia change-listener 2 / 1 (TorqueWrenchPage reduced-motion effect). Not externally
  countable without source edits; listed as inferred.

UNOBSERVED by design (recorded as UNOBSERVED, never upgraded to a pass): per-cycle bakeSheet
invocations; per-cycle PMREMGenerator/RoomEnvironment/environment-texture creations (steady state
covers their consequences); Story-chapter remount commit proof (Story exposes no census-visible
effect; only DOM-proxy level applies there); lagSmoothing restoration (never happens by design).

## 6. PASS / UNVERIFIED / FAIL semantics

- **PASS** for the bounded lifecycle observation requires: Channel A equals the inspected
  expectations, revalidated against the exact dev tree; Channel B equals its expected finals;
  Channel C sequences exact with no extra events; Channel D steady state (1 canvas, 1 live
  context) with zero page errors; Channel E records complete requests against independently
  established expectations; Channel F records the actual lifecycle timeline. Proposed exact
  event/status counts are predictions until the dev tree and asynchronous Canvas mounting are
  verified. Missing resource-create/dispose or React-commit observability remains UNVERIFIED
  even when this bounded observation passes.
- **FAIL** on any of: a second real import wave; more than one live canvas/port/probe;
  cleanupFailureCount>0 or startupFailureCount>0; sceneStatus 'failed'; a duplicate-owner
  rejection surfacing (conductorRuntime.ts:109-117 throws on a non-cleaned lease, including the
  poisoned-lease path at :217-219).
- **UNVERIFIED** otherwise, with the recorded reason. UNVERIFIED never silently upgrades; reports
  refuse overwrite, so every run is a fresh dated record.
- Acceptance boundary: a PASS is an observation record for the parent and reviewers. No gate
  closes; G0-G9 remain open; no Astra/owner verdict is inferred.

## 7. Serial run prerequisites (parent-owned runtime window)

1. Parent schedules the census as the only browser job in its window; frozen build s and the
   :5288 preview are untouched; no duplicate servers.
2. Start "npm run dev" (vite 7.3.6) fresh on a unique port; record command, PID, and actual node
   version (contract18 reference environment used Node 22.19.0 — record what actually runs).
3. Confirm GET /lifecycle-census.html returns 200 on that origin before recording anything
   (F1 prerequisite).
4. Run F3 once per window; no file edits or HMR during the run (Channel C requires event
   silence); restart the dev server if anything changed.
5. Headless chromium via Playwright 1.56.1. No wheel input is needed (mount-cycle census, no
   scroll); no store setters, no synthetic visibility, no playback clocks (contract18 section 3
   posture).
6. Budget about 90 s worst case (dev module graph first load plus bake readiness allowance).
7. Before recording, re-hash the lifecycle-relevant sources and installed packages and bind them
   into report provenance, as the other session may have landed the Scene.tsx repair between this
   plan and the run; the harness and census files themselves are also hashed.

## 8. What this census does not prove

- Production-build remount behavior (StrictMode checks are dev-only). The separate production
  lifecycle run recorded an initialization-fallback failure; its repair remains with the other
  execution and requires new-build proof.
- Zero-React-commit during scroll (the churn case remains a DOM proxy; commit-level scroll proof
  remains a separate pending G2 measurement).
- BFCache (persisted=false stays UNVERIFIED), context-loss fallback ownership, renderer-init
  failure repair, G8 performance budgets, or any acceptance. All G0-G9 remain open.

## 9. Ownership release

This file is Lane A's sole deliverable for the resume wave. On delivery, exclusive ownership of
this path returns to the parent. Implementation of F1-F4 requires an exact ownership assignment
and a serialized runtime window within the existing authorized work. No new user permission
gate is introduced by this preparation. No product/source edits were made by this lane, no browser/build/GPU/
test launch occurred, the existing lifecycle harness remains untouched at reviewed SHA
a5b149a7fde7b132fe4780f6afb2e2bf2c0c3a2e965ae1243cc8c60e9128bbaf, and the protected sibling
jgun-portfolio was never accessed.
