# JG-040 Stage 3 — owner corrections, 2026-11-04

Changes after base `f14ee2a066ba9cf8f9ec77dd2157952f0ad0ccc4` in
`C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`. Mark approved these corrections and
explicitly authorized commit, push and deployment on 2026-11-04. Release verification is
in progress; the checks below record the reviewed local build before that release.

## Corrections

1. Caption/cue/technical evidence/cutter controls follow effective runtime `studyVisible`.
   Mechanism stays visible through `.56–.62`, including a cold-seek asset-loading hold at
   effective `.60`; Inspection appears in `[.62,.845)` once ready, then returns to
   Mechanism at the source handoff. Rail semantics retain the broader Inspection chapter.
   Inspection keyboard/click seek targets `.621` (`.62` + existing `.001` epsilon).
2. Desktop chapters form a centered horizontal bottom rail. Narrow Chapters disclosure,
   five labels/indices, `aria-current="step"`, focus and keyboard activation are retained.
3. Only `.torque-hud__fos-scale` height changes `.6rem → .9rem`. The marker stays 2 px wide;
   title, live value, ticks, rows, padding and note styles retain their prior sizes.
4. Removed HUD leader SVG, drawing/measurement loop, CSS, `studyAnchor` producer and type.
   Existing unrelated semantic hotspot anchors remain.

## Verification

Final verification is complete against the isolated build below. The initial
30/30 desktop+narrow and 66/66 smoke run preceded the independent review's cold-load
finding; its captures/JSON in this directory are superseded evidence, retained as history.

- Final source: typecheck PASS; 56 focused files / **503 tests PASS**, including cold/direct
  seeks and forward/reverse/random Inspection-window cases.
- Verifier pure Node suites: **30/30 PASS**. Page topology: **58/58 PASS**.
- Production build PASS (existing large-chunk warning only).
- Final owner smoke: **68/68 PASS**, zero browser errors on installed Chrome ANGLE/D3D11.
  Both aspects deliberately hold the manufacturing-core download at `.62` and verify
  `inspection.ready=false`, `studyVisible=false`, Mechanism caption, no cue/tech/cutter.
  After release, effective study visibility owns the Inspection chrome.
- [Final owner gallery](final/index.html): all six requested states on desktop 1440×900 and
  narrow 390×844, plus reverse `.6199/.62/.845` checks and keyboard Inspection seek.
  [Measured review JSON](final/review.json) records all 18 sampled states and both cold holds.
- FOS colored bar: **14.390625 CSS px** (`.9rem`, nominal 14.4 px) on both aspects;
  temporary `.6rem` comparison confirms sibling width/height/font/margin/padding unchanged,
  excluding the marker's deliberately bar-relative height. Marker width remains **2 px**.
- Desktop rail: x **468.55–971.45**, y **819.22–836** at 1440×900; tech panel x
  **1094.41–1398.41**, y **582.80–810.41**. Clear of tech, caption and Free Look.
  Narrow disclosure x **16–374**, y **709–748** remains unchanged.
- Launch/route/asset gate PASS: **112 files**, 53 required assets present, held-back model
  absent. Topology and protected-file checks preserve the root, private armament and redactions.
- Independent source review identified a cold-load gap in the initial threshold-only
  implementation; corrected with effective runtime visibility and regression coverage.
  Follow-up review confirmed that finding addressed, no further findings on the narrow fix.
  The reviewer did not independently run browsers/tests; runtime results above are parent-run.
- Final full `verify-torque-camera-hud.mjs`: **desktop 30/30 PASS + narrow 30/30 PASS**,
  **zero browser errors** in each run. [Desktop JSON](final/camera-desktop.json) and
  [narrow JSON](final/camera-narrow.json) contain the measured HUD rectangles and unchanged
  assertions, including reverse camera and subject replay. No `--quick` was used.
- Technical Stage 3 verification is complete. **Mark approved Stage 3 and authorized release.**
  The broader cinematic/deferred gates remain separate from this approval.

## Isolated review build

Preview: `http://localhost:5418/torque-wrench/`.
Build directory: `output/playwright/jg040-stage3-20261104/final/dist`.
The shared `dist/` was never rebuilt. Browser runs are serialized; the final owner harness
checks that the isolated asset hashes stay unchanged throughout its probes.

Final build identity (SHA-256):

| Asset | SHA-256 |
|---|---|
| `Scene-CgT8NRm_.js` | `504ce68129d1ad32a9da1115b024d24ef6d34e0ba27b03a15b617486d09ee706` |
| `torque-wrench-BsY9og6w.js` | `fee2ae69e07a4219ddb92fd39b1f5a68e91bc3e54e1dfb3f83c0abfb98065eeb` |
| `torque-wrench-rn0DKxeB.css` | `75fe6f100df87f6c03faa0480fca9343552a33b2a5f7fb2de0b1f90a0d3fc393` |

Reproduction:

```powershell
npm run typecheck
npm test -- src/scene/torque-wrench src/state/torqueWrenchStore.test.ts
node --test scripts/verify-torque-camera-hud.node-test.mjs scripts/verify-page-cinematography.node-test.mjs
npx vitest run src/shared/pageTopology.test.ts
npm run build -- --outDir output/playwright/jg040-stage3-20261104/final/dist
node node_modules/vite/bin/vite.js preview --outDir output/playwright/jg040-stage3-20261104/final/dist --host localhost --port 5418 --strictPort
node scripts/verify-jg040-stage3.mjs http://localhost:5418
node scripts/verify-torque-camera-hud.mjs --url=http://localhost:5418/torque-wrench/ --out=output/playwright/jg040-stage3-20261104/final/camera-desktop
node scripts/verify-torque-camera-hud.mjs --url=http://localhost:5418/torque-wrench/ --width=390 --height=844 --out=output/playwright/jg040-stage3-20261104/final/camera-narrow
node scripts/verify-launch-dist.mjs --dist=output/playwright/jg040-stage3-20261104/final/dist
```

Use new output paths for a future run and restart its preview after rebuilding.

## Boundaries

Public root-to-`/home/`, private armament topology, redactions, assets, mechanical clocks,
camera paths and Evidence 73 history are untouched. The strict six-case page-cinematography
roster is not rerun or declared PASS here: its existing framing/HUD/alias FAIL/deferred
results retain their status. Both verifiers measure the actual bottom rail, without
threshold changes. These Stage 3 checks do not constitute broader cinematic completion
or Mark's final visual acceptance.
