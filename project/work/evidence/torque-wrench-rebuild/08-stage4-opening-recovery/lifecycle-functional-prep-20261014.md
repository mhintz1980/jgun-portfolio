# JG-038 Lane A lifecycle/failure prep — 2026-10-14

Lane A delivered scripts/verify-torque-lifecycle-functional.mjs (harness-only; no product,
source, or existing-script changes; no browser, build, GPU, commit, or push by this lane).
Author did not run any browser case; parent owns all runtime scheduling after independent review.

## Provenance (recorded separately, per wave-ledger requirement)

| Artifact | SHA256 |
| --- | --- |
| Harness scripts/verify-torque-lifecycle-functional.mjs (as delivered) | 5e49aeae173add0d42d5e773d095838ce28a147be0b13cd044e52cc8f7ea5d5f |
| Frozen source manifest review-manifest-20261013-s.json | dd0a90ee7d652ea9fe777d52d7d3c5cc51ce7609d81638128177ee003ccf4828 |
| Observed build assets | bound per runtime report: served /torque-wrench/ HTML plus same-origin js/css hashed as served over HTTP (provenance.observedBuildAssets), never assumed from disk |

## Verification performed (no browser)

- node --check exit 0.
- --help prints full usage, options, case durations, exit-code contract; exit 0.
- --self-check (pure, no network/browser): harness hash, manifest hash, and output-guard
  behavior — 6/6 ok, exit 0. Guards verified: refusal outside project/work/evidence/torque-wrench-rebuild/,
  refusal inside .scratch paths / the frozen build, refusal to overwrite an existing report,
  acceptance of a fresh owned path.

## Harness contract

- CLI: --url= (required for runtime cases), --build-dir= (identity guard only),
  --out= (default: dated name in the owned evidence dir), --source-manifest=,
  --only=init-failure,churn-scroll,low-rate,hidden-resume, --self-check, --help.
- Exit codes: 0 = no FAIL (UNVERIFIED does not fail), 1 = any FAIL, 2 = usage/guard error.
- Injection is addInitScript-only on the private namespace window.__torqueLifecycleProbe;
  native input only (page.mouse.wheel); no store setters, no synthetic visibility, no
  playback clocks (contract18 section 3); no qualityLock or tier forcing.

## Cases (bounded --only for parent scheduling)

| Case | Observes | Status semantics | Bound |
| --- | --- | --- | --- |
| init-failure | Actual renderer-construction failure: getContext gate on CONNECTED canvases only, after the detached capability-probe canvas (Scene.tsx precheck) succeeds. Route classified from probe call log + captured errors; poster fallback asserted (data-torque-stage="poster", story intact, zero live world probe). | PASS = precheck passed THEN connected-canvas context denied at construction AND poster fallback intact. FAIL if the gate reached the precheck (must never be labeled construction evidence). UNVERIFIED if the scene booted live (injection did not intersect construction — R3F may construct pre-attachment). | ~35 s worst case |
| churn-scroll | MutationObserver over .torque-page during same-beat native wheel (beat-bounded via __torqueNarrative beats), plus contract18 abrupt-reversal roster (4x-1200 px @100 ms). | PASS = zero same-beat mutations + real displacement + zero page errors. UNVERIFIED if the beat changed mid-window. Explicitly a DOM-mutation proxy, NOT React-commit proof. | ~15 s + readiness waits |
| low-rate | Controlled 30 Hz (30x240 px) then 15 Hz (15x240 px) wheel delivery; actual gap medians/maxima, displacement, frame advance. | PASS = delivery completed, world still ready, zero page errors. Observations only; excluded from performance distributions. | ~8 s |
| hidden-resume | Real second-tab activation (bringToFront); requires observed document.hidden === true; then 5 s hold, close, resume. | PASS only with a genuinely hidden document + ready resume. UNVERIFIED with observed states when headless Chrome stays visible. Visibility is never faked. | ~3 s (UNVERIFIED path) / ~12 s |

## Explicitly unverified (do not infer from this harness)

- React-commit absence: DOM churn proxy only; no React-commit claim.
- StrictMode integrated remount: needs a dev harness; separate lane, not attempted here.
- BFCache: not attempted; persisted=false stays UNVERIFIED (drawing-integration E remains the honest record).
- Runtime behavior of all four cases: author ran no browser; first execution is parent-run and may
  surface the documented UNVERIFIED routes (notably init-failure construction timing and headless
  hidden-state availability).

## Parent runtime examples (after review; serial scheduling; unique --out each run)

    node scripts/verify-torque-lifecycle-functional.mjs --url=http://localhost:5288/torque-wrench/ --build-dir=.scratch/jg038-stage4-20261013-s --only=init-failure --out=project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/lifecycle-init-20261014-TAG.json
    node scripts/verify-torque-lifecycle-functional.mjs --url=http://localhost:5288/torque-wrench/ --build-dir=.scratch/jg038-stage4-20261013-s --only=churn-scroll,low-rate,hidden-resume --out=project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/lifecycle-live-20261014-TAG.json

Reports refuse overwrite and are path-guarded to the task-owned evidence root; nothing is ever
written inside the frozen build. This file is released to the parent; the harness is ready for
independent review (reviewer distinct from author) before any browser run.
