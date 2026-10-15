# Static-functional bounded correction — 2026-10-14

Status: PREPARED; runtime NOT RUN. Ownership released to parent for independent review.
Only this new document and scripts/verify-torque-static-functional.mjs were written.
No browser, build, GPU, child agent, commit, product edit, or original-script edit.
GLMFlash high was requested; no callable subagent capability was available in this session.
Implementation was completed locally; no GLM model execution or independent approval is claimed.

## Source and identity

- Copied original: scripts/verify-torque-static.mjs.
- Original SHA256 before and after: 794cb9a92590ed9c99c2374999f05a74fa5e2ffc61eb17dc30a1d5ccf76a6e1d.
- New script SHA256: 289c32a77fcc96d6cf780aa3efa62027ae10c93e4e79634e3a52e6a3f69aca98.
- New harness identity: verify-torque-static-functional.
- Report family: JG-038-static-functional. Report records its own SHA256, copied-source
  SHA256 at copy, and original-source SHA256 observed at runtime.
- Default reports: evidence08/static-functional-report-<timestamp>.json; explicit --out
  remains realpath-confined to evidence08, requires an absent file, and writes with wx.
  Existing evidence cannot be overwritten.

## Exact correction

The original removedLive branch required zero CAD/decoder requests from initialization,
even when a legitimate ready live world had initialized CAD before stepping down.
Only the new family corrects that boundary; the frozen original is preserved.

Before MQL downgrade, require actual snapshot.ready, sheet.baked, finite positive world
frames, finite positive renderer.calls, a live scene canvas, and scene stage. Awaiting
scene stage alone is insufficient. Re-observe immediately before downgrade; fail closed
and do not downgrade if the ready-live prerequisite is absent.

Immediately before emulateMedia(reduce), snapshot Scene/CAD/decoder/unidentified-Scene
request counts and retain their complete initialization lists. New requests are defined
by collector request-event position, not response-completion time, so requests initiated
before transition remain initialization traffic even if their response finishes later.

Require zero NEW exact Scene, Scene-shaped unidentified, and CAD/decoder requests from
that boundary through downgrade plus the existing 750 ms poster seal window, and again
through restore-motion plus a 750 ms seal window. The latter audit is cumulative from
the original transition boundary. Existing exact Scene identity and exactly-one-Scene
request gate remain. Record beforeTransition, afterDowngrade, afterRestore, ready-live
observation, seal duration and action-window timestamps in observations.mqlTransition.

removedLive retains exact one canvas mount / one removal and now requires the ready-live
prerequisite plus zero NEW CAD/decoder requests. Poster-explicit and reduced-motion cases
retain zero Scene and zero CAD/decoder requests FROM INITIALIZATION. Injected failure,
DOM identity, disclosure, keyboard focus, poster slots, one-way floor, OffscreenCanvas,
HTTP/console/page-error, served identity, timeouts, roster and exit gates are preserved.
No request classification regex or numeric gate was relaxed.

## Checks (no runtime)

- node --check scripts/verify-torque-static-functional.mjs: node exit 0.
- node scripts/verify-torque-static-functional.mjs --help: node exit 0, distinct family
  name and original case roster printed; no browser launch.
- node scripts/verify-torque-static-functional.mjs --viewport=X --url=http://localhost:5288/torque-wrench/:
  node exit 2 with bad-viewport usage before preflight/network/browser work.
- Original source hash rechecked unchanged after creation.

## Parent next action

Read-only independent review first, then run this new family against the parent's currently
served frozen build in a NEW evidence08 output file. Runtime remains the parent's lane.
Example (confirm current port/build first):

    node scripts/verify-torque-static-functional.mjs --url=http://localhost:5288/torque-wrench/ --build-dir=.scratch/jg038-functional-20261014-t --only=D-scene-mql-downgrade --viewport=D --out=project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/static-functional-20261014-t-D-mql.json

Use distinct new output paths for N and the static-poster controls. No runtime PASS or
acceptance is inferred from syntax/help checks. All unrelated edits and frozen reports
remain their existing owners' work.
