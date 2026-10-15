# JG-038 lane C - clearance report coverage and input evidence plan, resume 2026-10-14

Status: REPORT COVERAGE + INPUT EVIDENCE PLAN ONLY. This lane launched no browser, build,
GPU, test or other runtime job, made no product/source edits, and performed no commit, push,
publish, cutover or archive. Sole write: this file, verified absent before creation. All other
work is read-only. Per owner coordination update 2026-10-14, a separate top-level chat owns
clearance applicability fixes and runtime; product repair belongs there. No product defect is
inferred anywhere in this file. Observations are marked; interpretation is separated from
acceptance, and no acceptance is claimed.

## 1. Byte bindings (observed)

sha256 values computed by this lane at inspection time, read-only. Concurrent verifier repairs
may supersede the script hash; the retained report/frame bindings remain capture-time evidence:

| Artifact | Bytes | sha256 |
| --- | --- | --- |
| continuous-clearance-20261014-s-D-full-retry/report.json | 108744 | acd435f00c9f6de082753ad3b75becafdf22835ff743c873f9ee72deea9699d5 |
| continuous-clearance-20261014-s-D-full-retry/D-full-frames.json | 3946161 | 7d6209ad0e4df425153f4e3552aa052c81c8b73e0841124195e46d066fc13376 |
| scripts/verify-torque-continuous-clearance.mjs | 33942 | 4c851dcb11b1b08a7d2f8d8929c976e50485ca344bf72e816dfc764f606a3d63 |

- Verifier disk hash equals the prep-doc binding and the report's own
  provenance.sourceAtRun self-hash: harness identity is bound end to end.
- Independent build-aggregate recompute over .scratch/jg038-stage4-20261013-s: 77 files,
  aggregate 7ea2ce826ad0c905e2a7186f96492140805d505767e2162d5e5414329cc951d4, equal to the
  report provenance. This closes the failed one-liner limitation recorded in
  continuous-clearance-prep-20261014.md (same walk/serialization as the harness).
- Served binding at run time: torque-wrench/index.html, assets/torque-wrench-DzCqm0A7.js,
  assets/Scene-DLot1vMW.js each HTTP 200 with local==served sha256 (report.served).
- sourceAtRun additionally binds scripts/lib/browser-launch.mjs, RuntimeWorld.tsx,
  inspectionProof.ts, InspectionDirector.ts, beats.ts, Scene.tsx (hashes in report provenance;
  the harness itself qualifies these as observations, not build-from-source proof).
- Run identity: 2026-10-14T14:07:52.492Z to 14:08:38.446Z, Chrome 154.0.8037.98,
  http://localhost:5288/torque-wrench/, environmentError null.

## 2. Report totals from bytes (observed)

- Exactly one case ran: D-full. D-lite, N-full and N-lite were never run by this harness.
- report.pass = false. Case D-full: 14 assertions, 11 pass / 3 fail:
  1. "reverse end matches forward start at same canonical progress" - actual: every numeric
     pose delta is 0 (camera position/target/angle, fov, subject/camera time, cutter
     stroke/infeed/angle all 0), but subjectsValid=false with subjectTransforms=null.
  2. "forward: every recorded frame passes existing clearance/framing gates".
  3. "reverse: every recorded frame passes existing clearance/framing gates".
- Zero console/page errors, zero failed requests, no case exception.
- effectiveEnvironment: requested=observed tier full (tierFromDOM=sheetTier=full),
  effectiveDpr 1, drawingBuffer 1440x900, hardware-reported, Direct3D11.
- Window: canonical [0.735, 0.94), maxY 39468, startY 29009, endY 37099, holdProgress 0.815,
  holdY 32166, traverseFrames 600.
- Tolerances in force (report.tolerances, the contract18/cutter numbers, unchanged):
  position 1e-4 m, angle 0.01 deg, fov 0.01 deg, channels 1e-4, progress 1e-9,
  settle 3000 ms, stable 500 ms, hold 5000 ms.

## 3. Independent re-audit of frame bytes (observed)

Recomputed from D-full-frames.json with a from-scratch reimplementation of the harness
auditRows/coverage semantics; every count reproduced report.json exactly:

| Phase | rows | presentedFrames | violations |
| --- | --- | --- | --- |
| forward | 601 | 601 | cutterInvisible 333, missingWitnesses 333, clearanceAtOrBelowNear 333, studyClearanceAtOrBelowNear 12, discOutOfFrame 448, contactOutOfFrame 333, discDomOverflow 448, contactDomOverflow 333, paintOverDisc 3, paintOverContact 0, inspError 0, notInspectionBeat 0 |
| reverse | 601 | 601 | identical to forward |
| hold | 301 | 301 | all zero |

Forward and reverse violation counts are identical per class, consistent with deterministic
position-driven gate state (same progress, same result) rather than intermittent failure.

## 4. Recorded world-frame coverage of the window

Observed:

- Frame counters are strictly consecutive inside each phase: maximum consecutive frames delta
  1, interior missed 0, duplicate-sampled 0; rows == presentedFrames == 601/601/301;
  hiddenFramesDelta 0 and zero hidden rows. rows[0].frames..rows[last].frames spans the full
  world-update delta (forward 56..656, reverse 748..1348, hold 1462..1762): every counted world
  update inside each phase was sampled exactly once. The JSON field `presentedFrames` is the
  harness's label; matching the world counter does not independently prove GPU presentation or
  display scanout, nor continuous collision freedom between recorded samples.
- Progress is monotone: forward 0.7350005067396371 -> 0.9399766899766899 (per-frame delta
  +3.294e-4..+3.547e-4, zero backward steps); reverse 0.9399766899766899 -> 0.7350005067396371
  (deltas -3.547e-4..-3.294e-4, zero forward steps); hold constant 0.8149893584676193. The full
  sampled interior window is traversed in both directions at startY/maxY and endY/maxY; exact
  mathematical endpoints are not reached because native scroll positions are quantized. No
  non-numeric progress values were observed.
- Input witness: abs(scrollY - targetY) = 0 on every row of every phase.
- rAF pacing observations (report-only; no gate exists): forward has 8 intervals >100 ms:
  250 ms @851 ms, 217 ms @1385 ms, 134 ms @1701 ms, 267 ms @6889 ms, 134 ms @7473 ms,
  150 ms @7640 ms, 567 ms @9792 ms, 334 ms @10409 ms. Across every one of these intervals the
  world frame counter advanced by exactly 1 (e.g. 580->581 across the 567 ms gap): the stall
  contains only one counted world update; no world-counter increment was skipped by the recorder.
  This does not establish what the compositor displayed during the gap. Reverse
  and hold: zero >100 ms intervals. Durations: forward 11943 ms, reverse 10081 ms,
  hold 5006 ms (covers the required 5000 ms window; assertion passed).
- Hold drift recomputed from bytes against the baseline row: camera position 0, target 0,
  camera angle 1.71e-6 deg, fov 0, subject/camera time 0, cutter stroke/infeed/rotation 0,
  progress 0, subject transforms 0/0 - all within TOL, matching the harness's passed hold
  assertion.

Classification (interpretation, not acceptance):

- Within each phase the record covers each counted world update: 1:1 sampling, monotone
  progress and no skipped world-counter increments. It supports sampled clearance analysis
  after applicability correction. It does not prove mathematical continuity between samples,
  GPU presentation or collision freedom during the eight forward wall-clock gaps.
- Between phases the harness intentionally uses native-scroll seeks with settle gates (forward
  exit, reverse entry/exit, hold seek). Those transitions are outside the recorded phases by
  design and are not covered by this record.
- This record does not establish C1 camera continuity, pacing acceptance, or any G5
  acceptance. The harness invents no pacing/C1 tolerance (its scope line and the prep doc say
  so) and none is invented here; pacing and gaps are data for the parent and independent
  reviewers.

## 5. Failure classification (observations; applicability owned elsewhere)

- Endpoint subject equality: at the reverse-end sample (window start, progress 0.735)
  inspection() returned no active subjectTransforms (subjectsValid=false, null), so the reused
  cutter equalPose gate cannot complete even though every measured numeric delta is 0. This is
  a gate-applicability limitation at the window edge where no machining subjects are active,
  matching wave-ledger-20261014-functional.md ("failed endpoint subject equality (inactive
  subjects)... no product defect inferred from blanket gates"). The fix and its runtime belong
  to the clearance-owning chat.
- Blanket cutter gates over the full window: the cutter is intentionally hidden outside the
  machining portion, so cutterInvisible/missingWitnesses/clearanceAtOrBelowNear (333/601) and
  discOutOfFrame/discDomOverflow (448/601) fire wherever the subject is outside its machining
  state. Identical forward/reverse counts support deterministic position-driven behavior.
  Gate scoping to the machining portion is pending elsewhere; the original failed report is
  preserved unmodified.
- Parent follow-up extracted the remaining exact positions from the retained frame JSON.
  All 12 studyClearanceAtOrBelowNear rows are `inspection-shaping`, progress
  0.7350005067396371–0.7387503800547279, forward frames56–67 / reverse1337–1348:
  visible=false, visibleMeshes=0, studyClearanceLowerBound="Infinity", machiningRate=0.
  This is an inactive/absent-study prerequisite, not a measured negative clearance.
- The three paintOverDisc rows differ: forward390–392 / reverse1012–1014 at progress
  0.8490929360494578, 0.8494476537954799 and 0.8497770345596433, all
  `inspection-materials`, cutter visible=true and visibleMeshes=5. `paintsAboveCanvas=false`
  but `uncertainPaintOrder=true`; selectors include `.torque-chapter__body`, and at the last
  two positions `#torque-chapter-inspection-title` / `.torque-chapter__lede`.
  Actual occlusion is UNVERIFIED, not proved: the flags are paint-order uncertainty with
  geometric DOM overlap. Do not suppress these active-subject samples as hidden-cutter noise;
  resolve their actual paint order under the existing applicable visibility contract.

## 6. Input/pacing/continuity evidence map (gap analysis)

Covered now (D/full only):

- Record of every counted world update during forward/reverse/hold with existing thresholds;
  exact input witness on every row; monotone progress both directions; hold drift within
  existing tolerances on every presented frame; zero console/page/request errors; served-byte
  and build-aggregate binding.

Still missing for the lane's stated goal, in dependency order:

1. Matrix cells D-lite, N-full, N-lite (3 of 4) - never run.
2. Applicability-scoped gate revision (machining-portion scoping plus endpoint inactive-subject
   handling), owned by the clearance chat, then a fresh uniquely named D/full re-run so totals
   are readable without blanket failures. Only a scoped run yields interpretable per-frame
   clearance totals.
3. Pacing/C1 interpretation - recorded observations only; no tolerance exists in any harness
   and none may be invented (prep doc and handoff boundary); acceptance interpretation belongs
   to the parent and independent motion review.
4. G5 roster items outside this recorder: wheel/touch/keyboard/scrollbar input modes, abrupt
   stop/reverse stress, low-FPS/tab resume - owned by the timeline/lifecycle harnesses (desktop
   timeline 9/9 and narrow 8/8 already recorded); this recorder adds none of them.
5. Physical mobile device - contract18 names none; N remains emulated 390x844 DPR3.
6. G8 performance, mechanical parity, lifecycle, owner/Astra acceptance - explicitly NOT TESTED
   by this harness (scope line in the report).

## 7. Next serial runtime commands (parent/runtime owner; not run by this lane)

Preflight (read-only): confirm the live listener still serves frozen build s; the recorder
re-binds served bytes itself and exits 11 BLOCKED on a stale preview before any browser case.
Restart the preview only after any rebuild per AGENTS; no rebuild is needed for the unchanged
harness. Run sequentially, one case at a time, each with a NEW output directory (the recorder
refuses an existing --out; verify the names are absent first).

Unchanged-harness completion of the matrix (preserves blanket-gate semantics, so the same
applicability failures are expected in machining-hidden spans; run only if the parent wants the
unchanged-harness comparison):

    node scripts/verify-torque-continuous-clearance.mjs --url=http://localhost:5288/torque-wrench/ --build-dir=.scratch/jg038-stage4-20261013-s --viewport=D --tier=lite --out=project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/continuous-clearance-20261014-s-D-lite
    node scripts/verify-torque-continuous-clearance.mjs --url=http://localhost:5288/torque-wrench/ --build-dir=.scratch/jg038-stage4-20261013-s --viewport=N --tier=full --out=project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/continuous-clearance-20261014-s-N-full
    node scripts/verify-torque-continuous-clearance.mjs --url=http://localhost:5288/torque-wrench/ --build-dir=.scratch/jg038-stage4-20261013-s --viewport=N --tier=lite --out=project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/continuous-clearance-20261014-s-N-lite

After the clearance-owning chat delivers an applicability-scoped harness revision (their file;
its new self-hash binds itself at run time): re-run all four cells under NEW uniquely named
directories, e.g. continuous-clearance-20261015-s-D-full-scope and siblings; exact naming and
scheduling are the runtime owner's. Scope corrections must disclose evaluated and inapplicable
checks; do not target a predetermined passing total. Never overwrite or delete continuous-clearance-20261014-s-D-full-retry; it is the
preserved original attempt bound above.

## 8. Limitations

- Single case attempted (D/full); 3 of 4 matrix cells absent.
- N is emulated (390x844 DPR3 touch); no physical mobile device is named.
- Between-phase seeks/settles are outside the recorded phases by design.
- The forward stalls are wall-clock pacing observations; the recorder cannot identify their
  cause and no pacing gate exists.
- Exact remaining study/paint row positions were extracted by the parent in section5; the
  active-subject paint-order uncertainty still requires the runtime owner's verification.
- The re-audit reproduces the harness's own gate set (exact existing thresholds), not a new
  standard.
- Report-only scope: G8 performance, mechanical parity, lifecycle, owner/Astra acceptance NOT
  TESTED; G3/G5 remain open per task-local GATES.

## 9. Source references

- continuous-clearance-prep-20261014.md - harness design, bindings, scope, parent commands.
- scripts/verify-torque-continuous-clearance.mjs (4c851dcb...) - TOL, per-frame gates,
  coverage semantics, exit codes.
- continuous-clearance-20261014-s-D-full-retry/report.json + D-full-frames.json - bytes bound
  in section 1.
- wave-ledger-20261014-functional.md - retry context: 11/14, endpoint inactive-subject and
  blanket-gate classification, preservation of the original report.
- wave-ledger-20261014-resume.md - lane C ownership and done-when.
- docs/torque-wrench-rebuild/HANDOFF-2026-10-14-parallel-functional.md - lane C row and
  boundaries.
- 07-autonomous-2026-10-12/GATES.md - G3: continuous clearance still open for closure; G5:
  full input/pacing/stress roster and C1/full-motion acceptance open.
- docs/torque-wrench-rebuild/13-implementation-plan.md - G3/G5 gate definitions and exit
  criteria.
- Skills read before interpretation: C:/Projects/skills-master/local/webgl-telemetry-verifier/SKILL.md
  (telemetry over vision; observations labeled, never acceptance) and
  C:/Projects/skills-master/local/cad-scene-graph-rigging/SKILL.md (geometry read from
  inspection-probe fields only; no transform reinterpretation).

## 10. Ownership release

This lane wrote only this file (verified absent before creation). All other activity was
read-only: no runtime, build, browser, GPU or test launch, no product or source modification,
no commit/push/publish/cutover/archive, no sibling-checkout access. Ownership of this file is
released to the parent. Clearance applicability fixes, harness revisions and all runtime
scheduling belong to the parent and the clearance-owning chat. No acceptance is claimed or
implied; G0-G9 remain open.
