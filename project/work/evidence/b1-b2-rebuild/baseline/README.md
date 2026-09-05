# Failed-attempt baseline

Frozen from commit `5dfd0aad3a31d71d16bbd585e0878965f7091156` before rebuild edits. These artifacts are evidence of the failed state and do not constitute visual approval.

- `build-output.txt`: actual successful typecheck/build output, before source edits.
- `desktop-*.png`, `mobile-*.png`: 1920×1080 and 390×844 phase-boundary captures at intro-normalized 0, .2, .4, .85, 1 plus downstream global .10, .30, .50, .65, .80, .95 (22 PNGs total).
- `telemetry.json`: 38 runtime samples, including forward/reverse checks and the release discontinuity. Captures came from a restarted repository-owned `:4173` preview with a live canvas in every sample. There were zero page-error events.
- `boundaries.md`, `main-versus-failed-boundary.diff`: numeric before/after boundary evidence from git main and the failed commit.
- `src__*.txt`: exact failed-commit source snapshots needed to interpret the baseline.
- `main-bundle.json`, `failed-bundle.json`, `bundle-comparison.json`: exact bundled asset byte counts; main also records gzip bytes. This measures Vite bundles, not separately hosted GLB files.
- `main-build-output.txt`: actual successful isolated-main build output using the same installed dependencies.

Runtime captured with Chrome headless, DPR 1, ANGLE D3D11 on AMD Radeon 780M Graphics. Native scroll positions round to document pixels; each sample records both requested and actual progress. For paired captures, use the actual progress from this file. Mobile requested .12 is just after the failed release snap; desktop requested .12 is just before it.

The broad capture-session rAF samples include screenshot encoding and cross-chapter first-render stalls: desktop p95 16.9 ms / max 5087.6 ms; mobile p95 16.8 ms / max 4603.8 ms. They are not a clean performance acceptance run. The old application exposes no PerformanceMonitor decline count, so zero declines cannot be certified from these artifacts. State-exact forward/reverse identity also fails in the old camera and animated stage/rig fields; see raw samples.

The isolated main build lives at `C:/Users/Markimus/.buzz/.scratch/b1-b2-main-baseline`. It has a node_modules junction to the repository and lacks ignored model assets, which are unnecessary for Vite bundle measurement. No application source, GLB, dependency, or branch was modified by this baseline task; only the capture script and this evidence directory were written in the shared working tree.
