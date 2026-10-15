# JG-038 lane C — continuous clearance verifier preparation, 2026-10-14

Status: PREPARED, NOT EXECUTED. No browser, build or GPU job was run by this lane.
Checks completed: node --check (exit 0), --help roster (no browser launch), bounded-selector
usage rejection (--viewport=X exits 2 with USAGE before any required-argument or browser work).

## Ownership and delivery

Exclusive writes by this lane (both newly created; no overwrite permitted by design):

- scripts/verify-torque-continuous-clearance.mjs — 33,942 bytes,
  sha256 4c851dcb11b1b08a7d2f8d8929c976e50485ca344bf72e816dfc764f606a3d63
- project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/continuous-clearance-prep-20261014.md (this file)

No product source, existing helper, frozen build, frozen347 source byte, sibling checkout,
root GATES/REA/TODO, or shared index/ledger was touched. Ownership of both files is released
to the parent for review and scheduling.

## Frozen identity binding

- Harness sha256 recorded above; the verifier also self-hashes at run time
  (provenance.sourceAtRun includes its own sha256).
- Frozen build s .scratch/jg038-stage4-20261013-s recorded binding, read from
  functional-cutter-20261014-s/report.json provenance: aggregateSha256
  7ea2ce826ad0c905e2a7186f96492140805d505767e2162d5e5414329cc951d4,
  entry assets/torque-wrench-DzCqm0A7.js, scene assets/Scene-DLot1vMW.js.
  An independent aggregate recompute one-liner failed on shell regex escaping and was not
  retried (limitation, non-blocking): the verifier recomputes the full build aggregate
  (buildProvenance, same walk/serialization as verify-torque-cutter.mjs) and binds served
  bytes of index.html + entry + scene (verifyServed) at run time; any drift exits 11
  BLOCKED before a browser case starts.

## What the recorder does

Per case (viewport D/N x tier full/lite, bounded --viewport/--tier selectors, default all):

1. Navigates ?quality=<tier>; settles native scroll at the window start; waits study readiness.
2. Records EVERY presented frame via one in-page rAF sampler while native scroll drives the
   complete canonical inspection window [0.735, 0.94) forward (600 presented frames),
   reverse (600), then holds canonical .815 for the existing 5000 ms hold window.
   Sample-first, command-next: targetY is stored per row as the input witness.
3. Per-frame record: progress, scrollY, beatId, frames, subject/camera time, machiningRate,
   camera pose, renderer calls/triangles/effectiveDpr, and window.__torqueWorld.inspection()
   geometry (cameraClearance, near, studyClearanceLowerBound, visibleMeshes, contactVertices,
   rect, discRect, contactRect, subjectTransforms, telemetry cutter stroke/infeed/rotation),
   plus measured DOM rectangles (canvas-normalized disc/contact regions and visible
   inspection/panel/toggle/text/header/footer elements) with per-frame geometric overlap and
   elementsFromPoint paint order.
4. Per-frame gates = exact existing sampled thresholds from verify-torque-cutter.mjs applied
   to every recorded frame: cutter visible + vertices/triangles + rect/discRect valid;
   cameraClearance finite and >= near; studyClearanceLowerBound > near with visibleMeshes > 0;
   contact witnesses present; disc and contact rects inside viewport/depth clip (inFrame);
   DOM containment of both regions; no DOM paint over disc/contact (paintsAboveCanvas or
   uncertainPaintOrder counts); narrative beat startsWith inspection-; no inspection() error.
5. Sampled gates unchanged: settle gates at window start/forward exit/reverse exit/hold seek;
   observed tier equals requested tier; reverse end matches forward start via the existing
   equalPose + progress 1e-9 matched-progress comparison; hold drift within the existing
   tolerances (0.0001 m / 0.01 deg / 0.01 deg FOV / 1e-4 channels / progress 1e-9) on every
   presented frame vs the hold baseline; presentation frames continue during freeze (+5);
   hold recorder covers the full 5000 ms; zero console/page/request errors.

## Report-only observations (explicitly not gates)

Traversal pacing and per-frame progress deltas (no pacing or C1 tolerance exists anywhere in
this harness), rAF gaps > 100 ms (count + list), coverage (recorded rows vs world.frames delta
and hiddenFrames delta, with a note that missed presented frames are reported, never pooled),
effectiveDpr/drawingBuffer/renderer classification/backend/launch description, phase durations,
and window/hold Y constants. Scope line in every report: G8 performance, mechanical parity,
lifecycle and owner/Astra acceptance NOT TESTED.

## Outputs and uniqueness

--out must be a NEW directory inside project/work/evidence/torque-wrench-rebuild (exclusive
mkdir; refuses existing paths; realpath-constrained to the task evidence tree). report.json and
per-case <id>-frames.json are written with exclusive 'wx'; exit codes 0/1/2/11/12 match the
cutter contract. Non-finite values are serialized as strings, never silent nulls.

## Parent run commands (D/full first per scheduling)

    node scripts/verify-torque-continuous-clearance.mjs --url=http://localhost:5288/torque-wrench/ --build-dir=.scratch/jg038-stage4-20261013-s --viewport=D --tier=full --out=project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/continuous-clearance-20261014-s-D-full

Then remaining cases with NEW dated directories, e.g. continuous-clearance-20261014-s-D-lite,
-N-full, -N-lite, or a single --viewport=all --tier=all run in one directory. Restart the
preview after any rebuild per AGENTS; the served-hash binding fails loudly on stale preview.

## Limitations

- Not executed: no runtime clearance evidence exists yet; this file prepares, it does not verify.
- N is emulated (390x844 DPR3 touch); physical mobile remains unnamed per contract 18.
- Response census is limited to page/console/request failures plus served binding of
  index/entry/scene; the cutter roster's full unmapped-response census is not duplicated here.
- Window end uses endY = round(max*0.94) - 1 to stay strictly below the 0.94 studyVisible
  boundary; boundary rounding behavior is recorded, not assumed.
- Hold is at canonical .815 only (the existing cutter canonical hold point); other holds are
  out of scope for this minimum.
- 600 presented frames per traversal is a harness fixture; if rAF starvation drops presented
  frames below the fixture the shortfall is visible in coverage rows-vs-frames and gap lists.
- No pacing, C1, or continuity PASS/FAIL semantics are invented anywhere; observed pacing and
  gaps are data for the parent and independent reviewers to interpret.

## Revision 2 — independent-review corrections (2026-10-14, this lane; corrections only, no run)

Directive: the revision-1 harness gated cutter geometry and viewport/depth/DOM paint on
EVERY recorded row and compared the traversal endpoint at inactive .735. Corrected per the
independent review. This lane ran no browser, build or GPU job; checks were syntax/help/usage
only.

Revised harness binding (supersedes the revision-1 binding above; the original failed report
stays frozen and untouched):

- scripts/verify-torque-continuous-clearance.mjs — 45,043 bytes,
  sha256 0d90d43aaa3e02a9da884c98551b490eb925c007d73b093cf1f03abbcf1d7ab0

Corrected gate structure:

1. Whole study [0.735,0.94) gates on EVERY row: finite progress/input; mapped input within
   one commanded scroll step plus the existing 1e-9 mapping tolerance (step derived per row
   from the recorded targetY witness; exact 1e-9 at hold); strict frame-ID advancement;
   rows == world.frames delta; zero hiddenFrames delta; live renderer/context/draw
   (calls finite >0, triangles finite >=0, context not lost); inspection- beat; live/ready/
   inspection-ready/sheet-baked.
2. Cutter-present rows only (runtime telemetry shaft cutter.visible === true, cross-gated to
   subjectTime in (2,15) with ease fades): actual cutter visible, vertices/triangles/
   rect/discRect, cameraClearance >= near, studyClearanceLowerBound > near with
   visibleMeshes > 0, contact witnesses, discBounds finite, contactMethod present.
3. arcWeight > 0 rows only (runtime snapshot arcWeight; cross-gated to subjectTime in
   (6.5,10.3)): discRect/contactRect in viewport/depth frame, DOM containment, no DOM paint
   over disc/contact (existing paintOverDisc/paintOverContact keys).
4. Endpoint full-pose equality moved to active framed .815: an anchor row is sampled at .815
   before the traversals and compared (equalPose + progress 1e-9) against the hold baseline
   after the round trip. The inactive .735 compare (subjectsValid=false by construction
   there) is removed.
5. New per-row runtime record, never inferred from canonical progress alone: runtime phase
   (telemetry phase), actual cutter scheduled visible, arcWeight, discBounds, contactMethod,
   GL backend, drawingBuffer, contextLost, ready/inspectionReady/sheetBaked/mode.
6. Fail closed: missing/non-finite evidence is a violation; probes that cannot be read at
   all (inspection() error, context unavailable, WEBGL_debug_renderer_info absent, telemetry
   phase/cutter visibility absent) are listed per phase as UNVERIFIED and the case cannot
   PASS.

Supplemental retained-row corrections (independent second round, 2026-10-14):

- The 12 studyClearanceAtOrBelowNear rows per traversal (inspection-shaping, progress
  0.7350005067396371–0.7387503800547279, forward frames 56–67 / reverse 1337–1348,
  visible=false, visibleMeshes=0, studyClearanceLowerBound "Infinity", machiningRate 0;
  clearance-input-plan-resume-20261014.md section 5) are inactive/absent-study transition
  rows, not product. Cutter-absent rows showing visibleMeshes 0 or non-finite
  studyClearanceLowerBound are now recorded in each phase audit as retained observations
  (kind studyTransition) — never discarded as hidden noise, never counted as violations,
  never presented as clearance evidence.
- The three paintOverDisc rows (forward 390–392 / reverse 1012–1014, progress
  0.8490929360494578, 0.8494476537954799, 0.8497770345596433, inspection-materials,
  cutter visible=true, visibleMeshes=5, paintsAboveCanvas=false but uncertainPaintOrder=true,
  overlap .torque-chapter__body / #torque-chapter-inspection-title / .torque-chapter__lede)
  are active-cutter ambiguity, not hidden-cutter noise and not proved occlusion. Outside the
  arc (arcWeight <= 0 there, subjectTime ≈14.5–14.9) they are now recorded as UNVERIFIED
  with the exact overlap; the case cannot PASS while they persist. Inside the arc
  (arcWeight > 0) paint ambiguity remains a paintOverDisc/paintOverContact violation.

Evaluated vs inapplicable (disclosure per clearance-input-plan-resume-20261014.md section 7;
no predetermined passing total is targeted):

- Evaluated always: whole-study row gates on all 601/601/301 rows, anchor/hold settle gates,
  tier equality, zero console/page/request errors, served-byte + build-aggregate binding,
  hold drift/duration gates.
- Evaluated in-window only: cutter geometry/clearance/contact gates on cutter-present rows;
  viewport/depth/DOM gates on arcWeight>0 rows. Inapplicable elsewhere by design (cutter
  scheduled hidden; camera arc inactive) — disclosed via per-audit cutterPresentRows/arcRows
  counts plus retained/unverified rows, never silently pooled.
- Never gated (no tolerance exists anywhere in any harness): pacing, per-frame progress
  deltas, rAF gaps, draw-count variation (drawRange recorded). No C1 or continuous proof is
  claimed.

Unchanged: TOL (1e-4 m / 0.01 deg / 0.01 deg FOV / 1e-4 channels / 1e-9 progress / settle
3000 / stable 500 / hold 5000), 600-frame traversal fixture, .815 canonical hold, D/N
viewport table, DOM selector, exit codes 0/1/2/11/12, exclusive-out, report-only
observations, NOT TESTED scope line. Provenance now also hashes schedule.ts, shaftRuntime.ts
and story.ts.

Checks after revision (this lane; no browser, build or GPU):

- node --check scripts/verify-torque-continuous-clearance.mjs → exit 0.
- node scripts/verify-torque-continuous-clearance.mjs --help → exit 0, no browser launch,
  corrected roster printed.
- node scripts/verify-torque-continuous-clearance.mjs --viewport=X → node exit 2 with USAGE
  before any required-argument or browser work (the PowerShell wrapper reports 1; node
  $LASTEXITCODE is 2).

Parent runtime context (recorded, not verified by this lane): fresh build t
(.scratch/jg038-functional-20261014-t, renderer repair passed init) full lifecycle 3 PASS /
0 FAIL / 1 UNVERIFIED, hidden page stayed visible. The next corrected clearance run belongs
to the parent once the independent read-only review finishes: pass --build-dir pointing at
the fresh t build, keep all s frozen evidence untouched, use NEW dated output directories
(suggested continuous-clearance-20261014-t-D-full and siblings), restart the preview after
any rebuild per AGENTS; the served-hash binding exits 11 BLOCKED on a stale preview.

Ownership of both files remains released to the parent for the independent second round and
the corrected clearance run.
