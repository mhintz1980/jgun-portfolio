# JG-038 AC final checkpoint — 2026-10-16

Final summary: `ac-final-summary-20261016-f.json`. Phase roster: `../../08-stage4-opening-recovery/ac-performance-20261016-f-v2/roster-progress.json`. Corrected startup: `ac-startup-20261016-f-R2.json`.

## Result

The phase roster completed 20 primary cells plus 33 required repeats, 53 attempts total, and finished **MEASURED_WITH_FAILURES**. The pure roster validator is false with 32 errors and 106 unverified entries. The 106 unverified entries are the two permanently unavailable observables—physical texture/render-target residency and total observer overhead—across every retained report; no repetition erased them.

Governing failures:

- Desktop-full breakthrough exceeds frame-tail limits in both its primary and required repeat. Worst p95 is 33.7 ms, p99 34.2 ms, and tail 6.4699%; the repeat still reached p99 34.0 ms and 2.80% tails.
- Lite mechanism draws 1,564,759 triangles, over its 1.5 M ceiling, in both viewports and every repeat.
- Lite close draws 929,253 triangles, over its 750 k ceiling, in both viewports and every repeat.
- Inspection creates new warm programs and long intervals in the failing cases: desktop-lite worst 117.0 ms with two programs; narrow-full worst 317.7 ms with six; narrow-lite worst 284.0 ms with six. Desktop-full inspection was clean in its primary.

All runs used the observed Radeon 780M / ANGLE D3D11 backend at about 59.88 Hz. No GPU execution-time or driver-residency claim is made.

## Startup

The corrected three-condition startup roster finished **FAIL**. The valid-cache primary reached fully ready in 10.6158 s, over its 10 s ceiling; its required repeat was 8.9694 s. Missing-cache reached ready in 11.2280 s and stale-cache in 11.2075 s, both within the 15 s fallback ceiling.

Observed bake spans were 1.4782 s (valid primary), 1.3020 s (valid retry), 3.5772 s (missing), and 3.6458 s (stale), within their observed ceilings. Every trial hit its intended cache route once, used hardware GL, stayed full tier, and matched served/build identity. Exact initial shader completion, internal rig/cache/font/upload spans, and exact inspection decode/parse spans remain **UNVERIFIED**; the reports retain trigger-to-ready and body-complete-to-ready upper bounds instead of substituting proxies.

## Preservation and gates


Candidate-f product inputs are unchanged; all 1,473 baseline files are present and all 1,456 protected files are unchanged. Branch and HEAD remain `torque-wrench/rebuild` / `315052e1ff7f309770e47647a7606ae95d161a2f`, with an empty index. Only measurement-harness and evidence files changed after candidate f.

Measurement review state: independent R2 PASS_TO_RUN; separate Astra R2 FIX_FIRST; the owner-authorized one-review correction scope returned SHIP. The measurement review budget is exhausted. Source fitness does not overturn these measured failures.

Remaining gates: G8 correction or owner decision, real-device hidden-start proof, all five owner decisions, final 2× crack viewing, full-motion/owner acceptance. No commit, push, deployment, cutover, archival, or inferred acceptance occurred. The task-owned candidate-f preview remains on port 5288 as PID 47448; verify its command before reuse or stopping.
