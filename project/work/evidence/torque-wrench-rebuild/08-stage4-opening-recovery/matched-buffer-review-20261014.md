# Matched-buffer mechanical diagnostic review — 2026-10-14

Independent read-only reviewer: Banach, configured GLM-5.3/high. Parent authored `scripts/verify-torque-mechanical-matched-buffer.mjs`; original frozen parity harness remains unchanged. Two static rounds completed; no remaining blocker in round2. Runtime outcomes remain separate.

Original all-D/N full/lite report13275PASS/16FAIL/16UNVERIFIED has only render-buffer precondition failures. N/full actual private/legacy-A585x1266 versus later legacy-B780x1688; N/lite private390x844 versus legacy780x1688. `SceneCanvas.tsx` DPR staircase/PerformanceMonitor runs independently of `qualityLock`, which gates only quality-tier degradation. Private full cap1.5 and lite1 are intentional; no mechanical defect inferred.

Reviewed correction: separate diagnostic adjusts exposed legacy `__threeRenderer` pixel ratio/size to each actual private sample. Browser viewport/DPR3 and private natural tier remain untouched. Exact buffer/renderer/tier/viewport preconditions and mechanical tolerances retained; no PerformanceMonitor suppression. Record explicit renderer intervention. Missing/mismatched buffer or absent post-intervention draws/proof-frame advance makes the sample unsettled/UNVERIFIED.

Round1 findings fixed: require fresh live render after resize, save pre-intervention observation; use distinct output directory/filename. Round2 confirmed both fixes. Syntax and help passed. Unique schema `JG-038-matched-buffer-mechanical-diagnostic-v1` and default `runtime-mechanical-matched-buffer` distinguish reports from original parity.

Scope: matched-buffer transform diagnostic only, not natural legacy behavior, hardware capability, G8 performance, visibility, formal gate, Astra or owner acceptance. Runtime original failure preserved. Parent started N/full and N/lite serially against frozen s after review.

Runtime result: N/full and N/lite matched-buffer diagnostic completed6935 PASS/0 FAIL/0 UNVERIFIED. Report: `../07-autonomous-2026-10-12/runtime-mechanical-matched-buffer/functional-20261014-s-N/matched-buffer-diagnostic-2026-10-14T08-21-24-917Z-5516e7fa-81b5-4624-a9eb-93a5ad87bf4d.json`. This establishes matched-buffer/input mechanical transform observations under the disclosed comparator intervention; the original natural-control report remains failed on its buffer preconditions. No G8/performance or full gate conclusion.
