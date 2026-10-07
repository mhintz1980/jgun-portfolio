# Production setup failure and atomic restoration repair

The first production attempt (`runtime/shaft/final-run-1/report.json`) reached no shaft entry: desktop S1 failed because the verifier required 30 constant camera frames at 1e-12 before entry. The fallback entry hit the same timeout. The attempt was stopped before spending more GPU time on this known setup error; its saved JSON remains untouched and contains no app defects or machining/render acceptance.

Direct source evidence: `src/scene/CameraRig.tsx:530–539` intentionally advances a 0.3-degree/second narrative rest orbit whenever progress is after the drafting release and before .545. Thus the pre-entry stability condition is impossible for this legitimate narrative state. A post-restore settled read would likewise inspect the resumed orbit, rather than the promised restored pose.

The repair captures `browserSnapshot()` and clicks the shaft trigger in one synchronous browser task. `CameraRig.tsx:194–200` saves this exact camera before further narrative writes. On exit, the renderer wrapper captures the snapshot in a microtask after the `restoreObserved` render stack (`CameraRig.tsx:226–237` returns without narrative writes), after temporary render leases are restored. This matches the established atomic-entry/exact-restore-frame pattern in `scripts/verify-manufacturing-inspection.mjs:270–275,300–337,725–745`.

The repair removes the impossible narrative-camera stability precondition. It changes no camera/projection/state/stock/timing/render tolerance and preserves the separate three-frame paused machining-camera stability checks. S7's matrix limit remains 1e-6; exact projection/state restoration telemetry remains required. This supersedes the earlier readiness note's assumption that narrative settled-to-settled snapshots are obtainable.

`node --check scripts/verify-shaft-inspection.mjs` exits 0. Repaired verifier SHA256: `9f68f4502271281be1a059bef53a3bd5565d155d2e6f174125c0b53a54023e84`.

Both agreeing production passes must use this repaired hash and separate new output directories (`final-corrected-run-1`, `final-corrected-run-2`). No app source, server or build change was made.
