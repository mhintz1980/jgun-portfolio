# JG-038 Stage 1 - runtime harness execution record (Session A)

Date: 2026-10-12 (America/New_York). Workspace: C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench;
branch torque-wrench/rebuild; HEAD 69ac760bf575f6d3d2c5fe63578bf423d94798db (coordinated
activation commit: source/shared 240/page 20/tsc/boundary/preflight all pass, per parent).
This record lives in Session A's owned runtime/ directory only. Parent disposition recorded
externally: independent runtime evidence Round1 PASS; exact Stage 1 static exit satisfied per
plan 13.

## Execution (single run; no other servers, builds, or process kills launched)

    node scripts/verify-torque-static.mjs --url=http://localhost:4193/torque-wrench/ --build-dir=.scratch/torque-stage1-integration/dist --out=project/work/evidence/torque-wrench-rebuild/05-stage1-integration/runtime/report-built-round1.json

Exit code: 0. RESULT: PASS - 14/14 cases, 396 assertions, 0 failed.

Harness identity: scripts/verify-torque-static.mjs SHA256
1d95755dc725c48705b535586854eab2ed2c300a956d54ce5a0f6ed00ee5de9f - unchanged before and after
the run; no harness edits were needed or made. Preparation document at execution time: SHA256
c667831ac20868304d18e0cef33a106d04112d342bb98b6ae51c44033603f62a. No product, shared, or
foundation files were edited by this execution.

## Report artifact

report-built-round1.json: 109,474 bytes, SHA256
c2d9ff9705676659942a7e971e94e89bf83b52f7974ffa17c41cf58c5983cfbf. Full per-assertion detail
and complete request/response/failure logs are inside the report.

## Measured environment

- Preview: parent-owned task preview at http://localhost:4193 (session 55228) against the
  scratch MPA build .scratch/torque-stage1-integration/dist; parent stopped it after the run
  with 10 served-hash matches confirmed.
- Browser: installed Chrome 154.0.8037.98, headless, via the shared launcher contract
  (scripts/lib/browser-launch.mjs). GL renderer unmeasured - no hardware or software rendering
  performance claim.
- Playwright 1.56.1 (installed package). Node: installed repo CLI; the exact engine version
  was not separately captured in-run.
- Resources: parent-granted bounded browser window, no concurrent heavy work (parent-measured
  ~8.04 GB free RAM, CPU 53%, scoped ports free at grant).
- Built-mode identity: manifest entry /assets/torque-wrench-BhvCqyvq.js and Scene chunk
  /assets/Scene-CYrsnGyK.js; both sha256-verified served vs scratch build output
  (report.assetIdentity servedShaVerified true for both). No generic assets accepted.

## Result summary

14/14 PASS at D (1440x900 DPR1 desktop) and N (390x844 DPR3 touch/mobile): static-full, lite,
poster-explicit, reduced-motion, scene-import-abort, scene-render-throw, scene-mql-downgrade.
Highlights: the lazy Scene module was requested exactly once in every live tier and never in
poster/reduced; zero narrative CAD/decoder requests, zero document canvas mounts or removals,
zero OffscreenCanvas constructions, zero Scene-shaped unidentified requests, zero HTTP >=400
responses, and zero uncaught page errors in every case. Injected import-abort and render-throw
both reached the terminal poster fallback with Story DOM identity, disclosure state, and focus
preserved; SceneBoundary caught the render throw (exactly one correlated console error per
injected case, per the allowlist policy). MQL downgrade stepped one-way to poster and held the
floor after motion preference was restored.

## Defects and deferred scope

No foundation or page-local defects and no harness defects were found; nothing was handed off
for repair. Actual WebGL initialization and runtime context-loss acceptance remain deferred
until the real narrative renderer replaces the zero-Canvas placeholder Scene (verified
zero-canvas in every case).
