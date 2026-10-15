# JG-038 G2/G8 lifecycle/performance preparation — 2026-10-14

Parent closeout update: N static also passed7/7; desktop timeline now9/9. Current full Stage4/review/functional evidence and next-wave ownership are in `docs/torque-wrench-rebuild/HANDOFF-2026-10-14-parallel-functional.md`. Delivery-time descriptions below retain historical status. Approved G8 roster count corrected to60; no budgets or gate acceptance changed. TODO's later authorized documentation delta is recorded separately in `doc-refresh-provenance-20261014.json`.

Lane scope: read-only preparation against frozen production build
.scratch/jg038-stage4-20261013-s served at http://localhost:5288/torque-wrench/.
This lane ran no browser, build, GPU, test, commit, push, publication, cutover, or
acceptance action. No gate is closed or waived.

Parent status incorporated at delivery: opening diagnostics
continuity-20261014-s3-D/N each completed 1083 observations with zero errors and
failed requests, zero intervals over 100 ms, and maxima 17.1/16.9 ms. All four
cutter/control lanes passed 258/258. D static passed 7/7; N static was running.
review-manifest-20261013-s.json binds 347 source inputs, 6 preserved files, 4
reports, and 116 unaltered PNGs. Full G5, continuous clearance, G8, Astra, and owner
acceptance remain open.

## Existing lifecycle evidence and source posture

| Surface | Existing evidence / source control | Remaining lifecycle gap |
| --- | --- | --- |
| Lazy import and failure seal | src/scene/torque-wrench/cadGate.ts:25-51 caches one real import and seals every later call after failure. Static verifiers prove import abort/render throw reaches the semantic poster without a second narrative request. | Current build should retain this behavior through the pending static D/N roster; no new lifecycle action is needed before those results. |
| Conductor ownership | src/scene/torque-wrench/conductorRuntime.ts:109-153 rejects a duplicate store owner; :159-235 releases ticker, listeners, Lenis handlers, trigger, and lease in reverse order and poisons the lease on cleanup failure. Timeline evidence checks one active owner and stable mount/dispose/input diagnostics during native input and holds. | Formal StrictMode setup/cleanup/setup is not exercised by the production verifier. A dev-only D/full diagnostic should end with mountCount=2, disposeCount=1, activeConductors=1, current owned-resource counters at 1, cleanup failures 0, and one Scene request. This needs a parent-approved tiny scratch harness; the production result must not be relabeled. |
| Frame-path React churn | src/state/torqueWrenchStore.ts:123-147 deliberately emits no lifecycle notification for progress; src/scene/torque-wrench/Scene.tsx:34-49 updates story only on beat identity; src/scene/torque-wrench/RuntimeWorld.tsx:216-345 performs frame work in useFrame. | Existing conductor-stability checks do not count React commits. A small non-invasive MutationObserver over .torque-page during same-beat native scroll can establish a functional zero-DOM-churn proxy, but not formal zero-React-commit proof. |
| Resource cleanup | src/scene/torque-wrench/RuntimeWorld.tsx:92-210 owns abort/reverse-order disposal, deletes __torqueWorld, and treats context loss as terminal. src/scene/torque-wrench/PrivateSheet.tsx:29-59 allocates after commit, synchronously precompiles with restore-in-finally, and disposes on cleanup. Unit tests cover remount/recreate and partial cleanup. | An integrated current-build cleanup/remount census is still absent. The StrictMode diagnostic above is the smallest useful check; no source change is recommended from reading alone. |
| BFCache | src/shared/pageFade.ts:232-247 clears fade state on pageshow.persisted; src/scene/torque-wrench/conductorRuntime.ts:281-325 resamples on every pageshow. Unit tests cover persisted/non-persisted events. | The real integration attempt observed pageshow.persisted=false and correctly recorded BFCache UNVERIFIED. Browser-controlled availability remains the prerequisite; a reload is never a BFCache pass. |
| Context/init failure | Real WEBGL_lose_context fallback passed on the Stage 3 build: poster mode, zero live canvases, world probe removed, DOM story intact. src/scene/torque-wrench/Scene.tsx:10-17,55-67 routes unavailable WebGL to failure; src/scene/torque-wrench/SceneBoundary.tsx:16-29 catches render errors. | Stage 4 added precompile/private presentation ownership, so context loss should be re-recorded on build s. Actual R3F renderer construction failure still has no current small tool; existing route injection does not substitute for it. |
| Hidden/low-rate stress | src/scene/torque-wrench/RuntimeWorld.tsx:216-220 skips narrative work while hidden; conductor visibility return refresh/resamples. | Contract 18's controlled 30 Hz/15 Hz delivery, abrupt reversal, and 5 s hidden-tab resume roster is not covered by the current small verifiers. Keep it after the pilot below. |

## Exact approved G8 budgets and prerequisites

Source: owner-approved contract 18,
docs/torque-wrench-rebuild/18-stage0-verification-contract-proposal.md:19-115.

Reference device and environment:

- Nimo Direct Inc. N177L, AMD Radeon 780M, driver 32.0.31041.1004, 30,936,129,536
  bytes RAM, Windows 11 build 26340; Node 22.19.0, Vite 7.3.6, Playwright 1.56.1.
- AC power, installed Chrome, observed 60 Hz presentation where available, no primary
  artificial CPU/network throttling. Record actual refresh, power, and backend every run.
  Hardware full-tier acceptance requires a reported hardware GL renderer; software GL is
  diagnostic only.
- D = 1440x900/DPR1 desktop; N = 390x844/emulated DPR3 touch. N is not physical-mobile
  acceptance. H = 2560x1440/DPR2 is supplemental. Physical narrow hardware is unnamed;
  that prerequisite remains unavailable.
- Natural runs have no qualityLock; requested tier must equal effective tier. Full-to-lite
  cannot satisfy a full-tier expectation.

Rendering ceilings:

| Limit | Full | Lite |
| --- | ---: | ---: |
| Maximum effective DPR | 1.5 | 1 |
| Maximum drawing-buffer pixels | 3,686,400 | 2,073,600 |
| Warm frame p50 | <=17.2 ms | <=17.2 ms |
| Warm frame p95 | <=20 ms | <=22.2 ms |
| Warm frame p99 | <=33.4 ms | <=33.4 ms |
| Intervals >33.4 ms | <=1% | <=1% |
| Maximum warm frame | <=100 ms | <=100 ms |

Peak totals per presented frame, summed across all passes:

| Phase | Full calls / triangles | Lite calls / triangles | Texture+target MiB full/lite |
| --- | ---: | ---: | ---: |
| Drafting/read holds | 350 / 2.0M | 250 / 1.5M | 192 / 128 |
| Pressure/rupture/pit/emergence | 500 / 3.0M | 350 / 2.0M | 256 / 160 |
| Mechanism/explosion | 300 / 2.0M | 220 / 1.5M | 192 / 128 |
| Inspection/cutter | 400 / 2.5M | 280 / 1.75M | 256 / 160 |
| Close | 200 / 1.0M | 150 / .75M | 192 / 128 |

Measurement/startup requirements:

- Three independent runs for every D/N × full/lite case. Each phase is 60 s: 20 s forward,
  20 s reverse, 20 s hold. Retain all runs and judge the worst; never pool.
- Prewarm forward/reverse, wait for CAD/drawing/fonts/compilation readiness plus 5 s;
  readiness timeout at 30 s is a failure. Measure presented rAF intervals. GPU timing is
  separate and valid only when supported.
- Startup maxima: valid cache ready 10 s; stale/missing fallback 15 s; cached bake 4 s;
  live extraction/bake 8 s; selected inspection decode 3 s; initial shader preparation 3 s;
  first selected inspection shader 1.5 s; new warm programs 0.
- Five fresh-context trials per valid/missing/stale cache condition. Record every value and
  maximum. Zero new warm programs requires program creation/link identity observability;
  net program-count growth alone is insufficient. Memory claims require dimensions,
  formats, mipmaps, faces, depth, and MSAA, not texture count alone.
- Response/state tolerances: Lenis starts at 1.1 s; scroll rest <=1.2 s, defined as native
  displacement <=0.5 px/frame for 300 ms; holds <=0.1 mm position, <=0.01 degree
  quaternion/FOV, shader/lamp drift <=1e-4. Optional pointer displacement <=1% shorter
  viewport dimension, angular offset <=0.5 degree, center return <=0.8 s, suppression
  residual <=0.25 CSS px.

The pure validator enforces complete fields and rejects missing observables
(scripts/lib/torque-verification-contract.mjs:20-100). The complete formal roster is 60
phase reports: D/N × full/lite × 3 runs × 5 phases. The current s3 reports do not satisfy
that schema.

## Minimal parent-owned next checks

Run only after the serialized static/cutter work completes. Keep browser/GPU jobs serial
and task-owned. Preserve the frozen build directory: outputs belong in separate task-owned scratch/evidence paths, never inside `.scratch/jg038-stage4-20261013-s`.

1. Current-build BFCache attempt. Browser-controlled; persisted=false stays UNVERIFIED.

   node scripts/verify-torque-drawing-integration.mjs --url=http://localhost:5288/torque-wrench/ --build-dir=.scratch/jg038-stage4-20261013-s --only=E --out=project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/bfcache-20261014-s-E.json

2. Current-build context-loss fallback. Run separately because case F terminalizes the page.

   node scripts/verify-torque-drawing-integration.mjs --url=http://localhost:5288/torque-wrench/ --build-dir=.scratch/jg038-stage4-20261013-s --only=F --out=project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/context-loss-20261014-s-D.json

3. Current-build conductor/churn spot check.

   node scripts/verify-torque-timeline.mjs --url=http://localhost:5288/torque-wrench/ --build-dir=.scratch/jg038-stage4-20261013-s --viewport=D --only=D-live-conductor-forward --out=project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/runtime-timeline/pilot-20261014-s-D-live-forward.json

4. One D/full breakthrough G8 pilot, only if the above pass and instrumentation
   prerequisites are recorded: natural full tier, capture-free/unthrottled, hardware GL,
   observed refresh/power, 60 s with 20/20/20 input portions, all-pass render totals,
   memory method, and program-link observability. Judge p50<=17.2 ms, p95<=20 ms,
   p99<=33.4 ms, >33.4 ms<=1%, max<=100 ms, DPR<=1.5, pixels<=3,686,400, calls<=500,
   triangles<=3.0M, and texture+target<=256 MiB. This pilot materially checks usability in
   the prior cold-stall region but closes no G8 roster; 59 phase reports remain.

Unknown/unavailable prerequisites, explicitly not inferred:

- No physical narrow device is named.
- The H/pixel-cap case is supplemental and not yet measured.
- No current report producer emits the complete 60-report G8 schema.
- Actual renderer-initialization failure needs a new harness-only case within the existing authorized verification scope;
  import/render-throw injection and later context loss do not prove it.
- BFCache restore cannot be forced; absence is a limitation, not a fallback pass.

## Boundary

The clean s3 maxima and four clean cutter lanes support functional usability but do not
waive G2 StrictMode/churn, BFCache, G5 stress/continuous clearance, G7 complete failure
roster, G8 budgets, Astra review, or owner acceptance. This lane relinquishes exclusive
ownership of this file to the parent on delivery.
