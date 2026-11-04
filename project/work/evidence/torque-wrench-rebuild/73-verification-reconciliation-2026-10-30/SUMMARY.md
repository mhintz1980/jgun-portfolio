# Verification reconciliation — 2026-10-30

Baseline: pushed `ccb215b2`, branch `torque-wrench/rebuild`. Mark authorized
continuing after the approved checkpoint. Owner approval is preserved; technical
gate failures are reported independently.

## Corrections

- Main authenticated feature measurements now use the same patched shader for
  empty-band/removal and black/white comparisons, switching only uniforms. Each
  feature records its empty-baseline checks, original-versus-patched difference
  and matching beauty A. Invalid baselines fail the capture. Controls use this
  same implementation. No feature bounds, geometry or exact-zero thresholds change.
- The cascade distance assertion now checks approved proposal 66: early
  44.4–52.2 s windows receive 35% of their previous budget, savings transfer to
  53.1–64.65 s, and total continuation distance remains 1.5x its old baseline.
  The old uniform-per-window 1.5x assertion was stale. Four mutation/coverage
  tests preserve strict local allocation and total-distance checks.
- Camera/HUD assertions now check the existing solver-authored ring contact
  framing, uninterrupted isolation fade, opaque/depth-writing explosion housing,
  enabled LCD interaction and hidden suspended callouts. Reverse thresholds and
  valid contact/geometry checks remain intact.
- The reading lamp now samples the current authored sheet-local camera aim and
  reach directly. Delta-based easing previously froze a history-dependent light
  pool at zero delta. Null input uses the original centered pool. Applied lamp
  uniforms are exposed and included in page settling/replay checks.
- Shaper witnesses select the real near-side rake/engagement sector and the
  authenticated shaped workpiece band. Full cutter matrices/hulls remain context
  and mechanical evidence. Selection has no camera/projection input.
- Page opening checkpoints invert the current private opening clock at camera
  reads, registration, lighting, pressure and rupture boundaries. Legacy native
  constants no longer stand in for those intro times. Full vertex evidence stays
  in case `samples.jsonl` journals; report checkpoints reference/count those arrays.

## Completed intermediate runtime evidence

These runs precede the lamp/contact integration build; final campaigns must name
their own build identity.

`output/high-low-feature-proof/73-same-program/report.json`: installed Chrome,
ANGLE/D3D11, desktop 1440x900 and narrow 390x844. Both contexts completed forward
and reverse, with zero browser errors and passing camera/subject reverse checks.
Every positive full-band and negative null control passes; every measured feature
baseline is stable. Diagnostic `aliasAccepted` remains false by design.

- Desktop at 40.200608 s: offscreen sixfold now has identity/beauty 0/0 pixels;
  the old unpatched beauty comparison falsely counted six pixels.
- At the sampled over-limit times near 55.84, 56.25 and 59.6 s, the shared
  functional ten-tooth face has identity/beauty 0/0 on both aspects.
- Variant-full study lead-out remains visible, as accepted by Mark. Near 55.84 s
  it contributes 806 identity pixels desktop and 276 narrow; near 56.25 s,
  599 desktop and 234 narrow. Narrow retains 57 at 59.6 s. Strict failures remain.
- Desktop sixfold still contributes one identity/beauty pixel near 56.249315 s
  at 0.370576 periods/frame, above the 0.35 gate. This is not waived or rounded to zero.

Full camera/HUD assertion runs on both 1440x900 and 390x844 PASS with 29 samples
each and zero browser errors. Reports:
`output/playwright/torque-camera-hud-2026-10-21/after/runtime.json` and
`after-narrow/runtime.json`. These are full assertions, not quick captures.

## Terminal continuity

Camera leaf, installed journey and source-visibility takeover tangents are smooth
on desktop, narrow and intermediate aspect. Mechanical/master-clock continuity
was separate: before correction, incoming master-clock derivative at native .825 was
70.0663144357 seconds per unit progress, outgoing derivative 0. The authored drive
law at 66.9 s remains 17.4532925199 rad/master-second. The source and study share
phase but both entered a hard hold; phase matching alone did not establish C1.

Mark answered: "Add a short smooth deceleration (recommended)." The final
65.4–66.9 s window now has a 20% physical-distance exit shoulder and zero endpoint
rate. Its analytic interior rate compensates the integral, keeping all boundary
times/distances, final phase and master-time gear laws fixed. Earlier windows are
unchanged. Installed camera/source/study continuity and replay are regression-tested;
nominal master-time drive rate is kept distinct from actual progress-composed speed.

The initial `73-reconciliation` page run was stopped when this approval arrived,
before editing its imported clock source. Its partial results are not full-roster
evidence. The final run uses a fresh build and a separate output directory.

## Final verification — completed 2026-10-31

Integrated final checks: 1,398/1,398 unit tests across 119 files PASS with
`npm test -- --maxWorkers=1`; 36/36 verifier Node tests PASS; production build
(including TypeScript) PASS. Earlier higher-concurrency suite attempts hit the
existing CAD module-import timeout; assertions/timeouts were not relaxed.

Six-case coverage is complete using the original report plus an explicit
same-build narrow-lite recovery. See `runtime-summary.json` for the checked
case/report mapping and build SHA-256. Original report:
`output/playwright/page-cinematography/73-reconciliation-final/report.json`.
Recovery: `output/playwright/page-cinematography/73-narrow-lite-recovery/report.json`.
All four global build/source/contract gates PASS in both reports.

Each of four animated cases completed 105 forward, 105 reverse and 105 random
poses; each reduced-motion case completed five static native-scroll poses.
Across these 1,270 canonical checkpoints, all 840 decoded beauty replay hashes
match exactly, with zero camera/subject/lighting replay error and zero browser
errors in the completed cases. Physical/rate/sweep/replay assertions all pass.
All 11 shaper bullet-time contact poses pass framing and HUD clearance in every
animated case (44 total). The lamp-dependent opening beauty mismatch is resolved.
An
independent all-selected-vertices reprojection (597–650 real tool vertices per
pose, not just the exported hull) confirms tool maxima 0.070–0.207 NDC.

| Case | Result | Framing failures | HUD failures |
|---|---|---:|---:|
| Desktop full | FAIL | 27 | 11 |
| Desktop lite | FAIL | 27 | 11 |
| Desktop reduced | PASS | 0 | 0 |
| Narrow full | FAIL | 36 | 3 |
| Narrow lite (recovery) | FAIL | 36 | 3 |
| Narrow reduced | PASS | 0 | 0 |

There are no other failed gates in these completed cases. Remaining framing/HUD
failures concern broad opening/group/context/exploded witnesses, the terminal
shaft context, and the recorded runout subject selection. They remain failures;
the approved camera composition and strict .84 NDC / 8 px limits were preserved.

The original narrow-lite attempt stopped after 45 forward samples: its seek
recorded a 10,753,859 ms gap (almost three hours) at requested .495. It remains
failed/incomplete in the original report. The separate recovery completed that
case on the identical production build without changing timeout thresholds.
Checkpoint writes were restored to phase changes/every 11 samples; full raw
vertex evidence still appends for every pose. No interrupted result was relabeled.

Final camera/HUD assertions PASS on both aspects: 29 samples and 30 gates each,
zero browser errors, zero camera/subject reverse error. Reports are under
`output/playwright/torque-camera-hud-73-final/{desktop,narrow}/runtime.json`.
Terminal native-seek diagnostic `output/high-low-feature-proof/73-terminal-final/report.json`
also completed 16 forward/reverse samples per aspect with zero browser errors
and zero camera/subject reverse error. It does not claim dense alias acceptance.

Overall cinematic verification remains **FAIL**, despite replay correctness.
Dense alias acceptance (including the accepted lead-out and actual sixfold
residual), compatible legacy opening-specific semantic proof, and final visual
acceptance of this continuation remain separate open gates. No deployment.

Two fresh independent review attempts failed before returning findings because
the configured subagent provider could not resolve/reach `chatgpt.com` (502).
The parent inspected the full change set; that does not substitute for a completed
independent review. Independent review remains an explicitly open gate.

## Next action and delivery

**Owner update, 2026-10-31:** The [evolving-site and visual-review policy](../../../../context/owner-specs/evolving-portfolio-and-visual-review-2026-10-31.md)
supersedes the next-action priority and delivery restriction below. Publish useful
unfinished work with proportional checks; next creative priority is HUD concepts.
Current HUD/design-framing failures and dense alias closure are deferred; show
readability issues before more resources are spent and allow slight camera-angle
refinements. Opening semantic proof and independent final review remain follow-ups.
All results above remain unchanged. The following paragraphs record the session's
original handoff and local/uncommitted delivery state, not a new deployment result.

Define the mandatory readable/contact subject for the remaining opening,
emergence, runout, terminal-shaft and exploded-detail checks from approved authored
content and depth-aware visibility. Retain full geometry/matrices as context;
never choose witnesses because they fit or relax limits to erase a failure.
Then rerun affected proof and resolve strict alias acceptance explicitly.

This continuation is local and uncommitted. Last pushed checkpoint remains
`ccb215b2`; no additional commit, push or deployment was made in this continuation.
