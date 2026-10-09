# P1 opening quality collapse - source preparation report

Date: 2026-10-08. Diagnostic only. No root-cause claim, no behavior change,
no fix selected - chronology capture is the deliverable. Frozen build 5203
(owner-accepted 3 hotspots) contains an OLDER SceneCanvas; it stays frozen.

## What is applied (reviewable snapshot)

- src/scene/SceneCanvas.tsx - telemetry additions only, guard-wrapped.
  Record: SceneCanvas-quality-events.patch, regenerated after the query
  guard and the terminal warmcancel fix below; any earlier pre-guard
  snapshot is SUPERSEDED by the regenerated file.
- No scrollStore.ts change: events read existing telemetry.performance and
  getQuality().tier (standalone-guard preference honored).
- Query guard (parent review round 2): the diagnostic arms ONLY when the URL
  has the qualityDiagnostics search param. Default path: one URLSearchParams
  read at module load, pushQualityEvent returns immediately, and
  window.__qualityEvents is never defined. No default buffering, no window
  API, no per-frame work.
- Freeze (parent round 6): the SceneCanvas diff is under fresh review by
  Kuhn - NO source edits while diagnostic prep proceeds; round-6 work is
  helper-only plus .scratch build artifacts and this report.

## Event schema (one clock: performance.now(), same as drei sampling)

Each event: { t, type, tier, step, warmReady, fps?, flipped?, index? }.

- warmstart - WarmStationPrograms effect entry.
- warmcancel - station lookup miss / blocked / cancelled / lease abort / throw.
- cullrenderstart, cullrenderend - around each 1 px offscreen render, index 0..4.
- ondecline / onincline / onfallback - monitor callbacks, stamped at the real
  callback site with the monitor api fps and flipped count.
- dprstep - after setDprStep commits; step field is the new staircase index.
- degradequality - immediately before degradeQuality().
- warmReady flips to true only at the real completion site; the warmfinish
  event is stamped there. State semantics preserved, only observed.
- Terminal warm-loop else (parent review round 3): if the loop completes but
  cancellation landed first, a warmcancel event is stamped. Event only -
  warmReady state semantics unchanged.

Monitor facts (installed source, node_modules @react-three/drei/core/
PerformanceMonitor.js): fps over 250 ms windows; decline when more than 75%
of the last 10 averages sit below the 45 lower bound; fallback after
flipflops 3.

## Invariants (verified against the applied diff)

- Bounded ring, 256 entries, oldest dropped.
- Discrete moments only; zero per-frame writes or allocation; no new React
  state; component useState/useRef untouched.
- Thresholds and adaptation byte-for-byte unchanged: bounds [45,60],
  flipflops 3, one-way tier ratchet, DPR staircase, warmup timing, warmReady
  semantics, context-loss poster path. No qualityLock, no warmup gating.

## Capture plan (parent executes later; no GPU/build now)

1. Parent reviews this snapshot; fresh build later on a fresh port; restart
   the preview server after that rebuild (stale-server rule).
2. Serve the isolated dist on port 5204 (4174 is the frozen baseline in
   active use - never touch it); CPU static server, no browser:
   npx vite preview --outDir .scratch/quality-diagnostic-dist --port 5204 --host 127.0.0.1 --strictPort
3. Run the helper (desktop then narrow, in that order):
   node project/work/evidence/performance-diagnosis/helpers/capture-quality-events.mjs --url=http://127.0.0.1:5204/?qualityDiagnostics --label=desktop
   (again with --label=narrow --width=390 --height=844).
4. JSON timelines land in this folder; architect picks an evidence-based fix.

## Isolated diagnostic CPU build - EXECUTED (no browser/GPU at build time)

- Command: npm run build -- --outDir=.scratch/quality-diagnostic-dist --emptyOutDir
- Full log: .scratch/quality-diagnostic-build-logs/build-20261008-205052.log
  (vite 7.3.6, built in 16.04s, 62 output files).
- Main dist 5203 byte-check: SHA-256 manifest of all 62 files before/after
  (dist-5203-before-hashes.json / dist-5203-after-hashes.json):
  DIST5203_BYTE_IDENTICAL=True.
- Isolated output: quality-diagnostic-dist-manifest.json (per-file SHA-256);
  index.html 2116 bytes, SHA-256 592E9EE6289566A2B4E5A77326B445F08D336396085ABC7E263FFF97FF00F027;
  19 assets; instrumented chunk SceneCanvas-D3U1n6bS.js. Summary in
  build-record.json.
- Ownership: .scratch/ is never committed (AGENTS.md). Owned artifacts:
  the isolated dist, the build logs/manifests above, and the helper.
- Capture (later, on runtime release): desktop 1600x900 then narrow
  390x844, ?qualityDiagnostics, natural adaptation - no qualityLock, no
  forced tier; forced-lite is NOT used for the chronology run.
- Preview: port 5204 ONLY (4174 is the frozen baseline in active use -
  never touch it), --host 127.0.0.1 --strictPort.

## Preserved build artifacts (parent round 7)

- build-5204/ holds BYTE-EXACT copies of the .scratch build evidence
  (verified by SHA-256 equality per file) so the handoff does not rely on
  gitignored scratch: full build log + build-log-summary.txt,
  build-record.json, 5203 before/after hash manifests, isolated dist
  manifest, preview-5204 provenance, session stamp, and the detached
  preview starter script (start-preview-5204.ps1).
- The live preview server runs in-session, so its startup banner is not
  file-logged; runtime proof of what 5204 serves is carried by
  preview-5204-provenance.json (HTTP 200 + served-index SHA-256 equality).
- Helper review note: the helper changed after the fresh review (round-6
  evidence contract), so it needs independent runtime-evidence review
  AFTER the two captures. Captures remain: desktop 1600x900 then narrow
  390x844, ?qualityDiagnostics, no locks. No default monitor behavior fix.

## Verification performed

- Helper evidence contract (parent round 6): explicit fail (FAILED json +
  exit 1) on missing/unarmed __qualityEvents or null/empty final buffer;
  mounted-context build identity (index + loaded .js SHA-256 via
  crypto.subtle); renderer/vendor read from the EXISTING
  window.__threeRenderer context - no new WebGL probe; console/page errors
  captured; wall-clock start/end + per-sample stamps.
- npm run typecheck exit 0 (re-run after the guard).
- Helper import path smoke (no GPU): resolving scripts/lib/browser-launch.mjs
  from helpers/ with 5 parent steps hits the repo-root file (exists=true);
  4 steps land at project/scripts (exists=false), so the published 5-step
  specifier is correct and kept. Launch module imports clean:
  launchBrowser/describeLaunch both function.
  Parent round 4 retraction confirms the count: helpers/ is 5 segments under
  the repo root, so the 5-parent import is CORRECT; the off-by-one move
  request is withdrawn and no relocation was made. Re-smoked after the
  retraction: FIVE_PARENTS=true, import smoke clean, node --check exit 0.
- No GPU, browser, build, or runtime claims. Root cause remains OPEN until
  the probe runs on a fresh, instrumented build.
