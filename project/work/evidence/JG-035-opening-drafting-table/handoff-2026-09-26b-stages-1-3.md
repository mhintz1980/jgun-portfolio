# JG-035 stages 1-3 handoff — 2026-09-26b (same-day continuation)

Mission unchanged: implement sections 1-3 of `docs/jgun-animation-improvements.md`.
This session integrated the second half of the pre-commit work: reduced-motion parity,
runtime proof probes, fills/flex coverage, the precompute pipeline, and the verifier
false positives. Nothing is committed. The saved plan is
`docs/jgun-stages-1-3-implementation-plan.md` — update its checkboxes as items verify.

Read `handoff-2026-09-26-stages-1-3.md` first (mission, environment, prior changes).
`handoff-2026-09-25c-stations.md` stays historical context only.

## Where things are

- Real repo root: `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio`
  (`C:/Projects/jgun-portfolio` is a junction; `npm run build` FAILS from the junction
  path at emit. Typecheck/tests work from either. Always build from the realpath.)
- Dev server: running at `http://127.0.0.1:5198` (vite dev, started this session with
  `npm run dev -- --host 127.0.0.1 --port 5198 --strictPort`; npm PID 29752, vite PID
  30216 at handoff). Vite re-optimized deps on start. Keep using 5198; restart after
  rebuilds.
- Sandbox now runs workspace-write with restricted network; localhost 5198 is reachable.
  Some process-inspection commands (`tasklist`, `Get-CimInstance Win32_Process`) are
  denied now — use `Get-NetTCPConnection -LocalPort 5198` instead.

## Gate status at handoff (verified this session, all uncommitted)

| Gate | Command | Status |
|---|---|---|
| TypeScript | `npm run typecheck` | PASS (exit 0) |
| Unit tests | `npm test` | PASS 120 tests / 13 files |
| Drawing contract | `node scripts/check-b1b2-contract.mjs` | PASS 24/24 |
| Station 2 | `npm run check:station2` | PASS (2,671,600 bytes, 7 roots, 7 anchors) |
| Browser opening harness | `node scripts/verify-jgun-opening.mjs` | NOT RE-RUN since the fixes; next session |
| Production build | `npm run build` (realpath) | NOT re-run this session; last known PASS (pre-existing >500kB chunk warnings) |
| Precompute asset | `node scripts/precompute-drawing.mjs` | FAILED verification — root cause pinned below |

## What changed this session

- **Reduced-motion parity (product bug 3)**: new `REDUCED_MOTION_INTRO_T = 0.4` in
  `src/scene/drawing/introTimeline.ts` is now the single source of truth. `CameraRig.tsx`
  (damp goal + `introCameraPose`), `TorqueWrenchHero.tsx` and `DrawingLinework.tsx` all
  park at `releaseEnd * REDUCED_MOTION_INTRO_T`. Previously the camera parked at t=0.4
  while the drawing/model parked at t=0.2, giving a half-focused, partially inked sheet.
  New test asserts focus 1 / pulse 0 / pbr 0 / perspective 0 / drawingOpacity 1 at the
  parked frame (`introTimeline.test.ts`, 13 tests).
- **Pulse registration probe (missing proof 4, half)**: new
  `src/scene/drawing/sheet/registration.ts` + test. Distances from every baked profile
  point to the nearest `GROUP.side` ink segment, in sheet metres, independent of
  viewport/DPR; fails closed on empty/non-finite input. A shifted profile grows the metric
  (unit-tested). Exposed as `__drawingProof.capturePulseRegistration()` returning
  `{ready, pointCount, segmentCount, maxDistance, meanDistance, units:'metres'}`.
  Computed lazily (memoised) so startup cost is unchanged.
- **Title/text bounds probe (missing proof 4, other half)**: `sheetText.captureBounds(group?)`
  returns `{ready, count, violations, items[{text, group, bounds, fitCell, contained}]}`
  using live troika `textRenderInfo.blockBounds` transformed by the member matrix; fit cells
  are authored in `composeSheet.ts` (`item.fitCell`). Exposed as `captureTextBounds()` and
  `captureTitleBounds()`. Troika flex injection order was re-checked: the derived material's
  `onBeforeCompile` runs after BatchedText's rewrites and injects after the member transform,
  so `transformed` is sheet/batch space; runtime evidence is available via
  `captureShaderEvidence()`.
- **Fills subdivision (flex risk 7)**: `makeInkFills` now subdivides every triangle edge to
  `<= PAPER_FLEX_STEP`, conserving area, winding and per-vertex reveal values
  (`sheetInkRuntime.test.js`, 5 tests). Line pieces already split at the same step.
- **Cache/precompute pipeline (issue 5)**: `drawingCache.ts` v2 with a SHA-256 key over
  position bytes + index bytes + layout JSON, `?drawingCache=bypass` (cache-owned, no
  tooling branch in `DrawingLinework`), `exportDrawingPrecompute` / `installDrawingPrecompute`
  / `valid`, `drawingPrecomputeSource()` for tooling, and a stale re-export guard
  (`drawingCache.test.ts`, 6 tests). `scripts/precompute-drawing.mjs` rewritten: chrome
  fallback, correct `waitForFunction(fn, arg, options)` order, live-bypass cold vs
  precomputed cold vs warm reload, exact roundtrip comparison, evidence written
  `pending` then `verified` (a failed run can never write success evidence).
- **Verifier false positives (issues 1-2)**: `scripts/verify-jgun-opening.mjs` now counts
  `webglcontextlost` only when `this.isConnected` (the app's WebGL2 capability probe canvas
  is never connected), and reduced-motion configs verify a static live frame (two samples,
  GL draws advancing, tier full/lite, phase 0.4, focus 1, lineOpacity 1, pulse/pbr/wave 0,
  flex 0, probes ready) instead of the impossible scroll settle. `.048` hold checkpoint
  added; probes are gate-checked while the sheet is present.

## Precompute failure — root cause verified

`node scripts/precompute-drawing.mjs http://127.0.0.1:5198` generated the asset, published
it, then failed the cold precomputed measurement:

```
Error: Expected precomputed=1, got 0; check server asset freshness
    at measure (scripts/precompute-drawing.mjs:47)
```

Probed directly: `GET /drawing/jgun-sheet-v1.json.gz` returns **HTTP 200 with
`Content-Encoding: gzip` and `Content-Type: application/json`**. The browser therefore
receives the already-decompressed payload — 25,065,603 raw JSON bytes, first bytes `7b22`
(`{"`) — and the app then pipes that through `DecompressionStream('gzip')`, which throws,
is caught by `prepareDrawingCache`, and falls back to the live bake (`precomputed: 0`).
The `.gz` extension makes vite/sirv set the encoding header. The asset itself is valid
(6,110,044 gzip bytes, decompresses and parses; version 2, key prefix `ab313a48`).

Current on-disk state: `public/drawing/jgun-sheet-v1.json.gz` (never installed) and
`public/drawing/jgun-sheet-v1.evidence.json` with `status: "pending"` — both by design,
neither is usable evidence. **Do not commit `public/drawing/` until the loader works.**

Fix options, in order of robustness:

1. Make the loader sniff the payload: accept plain JSON (first non-whitespace byte `{`) and
   only gunzip otherwise. Works on any host, dev or production, regardless of
   Content-Encoding. Keep the 4s timeout (consider 8s for a 6 MB body on slow links).
2. Rename the payload so the static server cannot set the header (e.g. `.json.gz.bin` or an
   extensionless name) and point the loader at it. Host-dependent if a CDN re-encodes.
3. Force `Content-Encoding: identity` via Vite config for that path. Dev-only; production
   hosts may still auto-encode.

Also: `DRAWING_CACHE_VERSION` must be bumped whenever `composeSheet`/`ink`/profile logic
changes, otherwise an older accepted asset can outlive the code that produced it. The
current asset was regenerated after the latest ink change, so no bump is needed for it,
but the next content change needs one.

## Registration anomaly (old issue 6) — answered

Baseline `captureRegistration.projectedFeatures` showed ~110.9 px (output), 51.4 px
(bearing), 34.2 px (chisel) error at progress 0 and ~1e-7 px at 0.06 / ~1e-11 px at 0.072.
The error is perspective/depth parallax from the close detail camera while the sheet is not
yet square-on, not a misregistration: the printed feature sits on the sheet plane while the
actual feature point is lifted along the view depth, and the wide-angle close view
exaggerates the screen delta. From the start of the registered hold the projection matches
to floating-point. Next session: gate `captureRegistration` at `.06`/`.072` after settle
(suggest `<= 0.1 px`) and record the values; do not gate progress 0.

## Startup numbers (baseline, live bake, pre-fix harness run)

From `stages-1-3-2026-09-26/baseline-2026-09-26T05-58-08-786Z/summary.json` (each case's
progress-0 checkpoint):

| Case | coldLoadReadyMs | bakeMs | precomputed |
|---|---:|---:|---:|
| desktop | 36,322 | 1,050.6 | 0 |
| narrow | 6,617 | 566.5 | 0 |
| desktop-reduced | 16,241 | 586.1 | 0 |
| narrow-reduced | 7,705 | 4,550.0 | 0 |

These are dev-server numbers (`coldLoadReadyMs` includes module graph compile); the 36 s
desktop figure is dominated by first-visit dev transform, not the drawing bake. The
precompute comparison (cold live vs cold precomputed vs warm reload) still has no verified
data — the generator failed before writing timings. The "4.3-5.6 s" figure in older notes is
from the 09-25c session and is not reproduced here.

## Suggested next-session order

1. Fix the precompute delivery contract (option 1 above), then regenerate:
   `node scripts/precompute-drawing.mjs http://127.0.0.1:5198` from the realpath, and confirm
   `jgun-sheet-v1.evidence.json` flips to `status: "verified"` with exact roundtrip true.
   Record cold-live / cold-precomputed / warm-reload in the plan doc.
2. Run `node scripts/verify-jgun-opening.mjs --label=integration` against the running 5198
   server (desktop + narrow; reduced configs now take the static path). Expect PASS with
   the context-loss false positive gone and the three new probes present.
3. Extend the harness (a subagent task was requested but did not land — verify by grepping
   for `0.066` and `setTier`): forced-lite variants via `__drawingProof.setTier('lite')`
   after load, a peak-flex checkpoint at p=.066 (t=.55) comparing
   `sheetStats.flexAmplitude`/`flexPeakDisplacement` forward/reverse (full > 0 and <= 0.003,
   lite > 0, reduced 0), and the registered-hold gate from the section above.
4. Re-run the full gate set plus `npm run build` from the realpath.
5. `fitTitleText` conservativeness (old issue 8): `captureTextBounds` now measures real
   containment. If browser values show violations or obviously undersized titles, relax the
   0.7 em factor in `composeSheet.ts` and re-run.
6. Update `docs/jgun-stages-1-3-implementation-plan.md` checkboxes with evidence paths.
   The README and animation-spec revision notes are already in the diff.
7. Fresh read-only review (orchestration skill contract) before claiming done; commit only
   when the owner asks. Stage only JG-035 paths. `docs/jgun-animation-improvements.md` is
   the owner-supplied brief and is still untracked — ask before committing it.

## Uncommitted paths at handoff

Modified (15): `project/README.md`, `project/context/architecture/animation-spec.md`,
`src/components/TechnicalHUD.tsx`, `src/scene/CameraRig.tsx`, `src/scene/SceneCanvas.tsx`,
`src/scene/TorqueWrenchHero.tsx`, `src/scene/drawing/DrawingLinework.tsx`,
`src/scene/drawing/introTimeline.ts`, `src/scene/drawing/introTimeline.test.ts`,
`src/scene/drawing/sheet/composeSheet.ts`, `src/scene/drawing/sheet/edgeExtract.ts`,
`src/scene/drawing/sheet/ink.ts`, `src/scene/drawing/sheet/profile.ts`,
`src/scene/drawing/sheet/sheetText.ts`, `src/scene/drawing/sheetCamera.ts`.

New: `docs/jgun-animation-improvements.md` (owner brief, ask first),
`docs/jgun-stages-1-3-implementation-plan.md`,
`project/work/evidence/JG-035-opening-drafting-table/stages-1-3-2026-09-26/`,
`public/drawing/` (blocked, see above), `scripts/precompute-drawing.mjs`,
`scripts/verify-jgun-opening.mjs`, `src/scene/drawing/sheet/drawingCache.ts` + test,
`src/scene/drawing/sheet/paperFlex.ts` + test, `src/scene/drawing/sheet/registration.ts` +
test, `src/scene/drawing/sheet/sheetInkRuntime.test.js`,
`src/scene/drawing/sheetCamera.test.ts`, and this handoff pair.

## Environment cautions

- Keep `.scratch/` and `docs/orzo-style-portfolio-implemetation-roadmap.md` untouched.
- WebGL claims need runtime telemetry, never vision alone (repo rule).
- Restart the 5198 dev server after any rebuild; vite serves `public/` from disk, so a new
  asset is picked up without a restart, but module graph changes are not.
- `sheetInkRuntime.test.js` is a plain-JS test file (added by a subagent) that imports
  source modules and runs under vitest; keep it that way.

## Suggested skills

- `webgl-telemetry-verifier` — probes, live-canvas gating, pixel authority.
- `r3f-scroll-performance-guard` — zero-rerender invariants when touching DrawingLinework/StudioRig.
- `orchestration` — fresh reviewer before "done"; native subagent contract.
- `context-mode` — large summary.json parsing (baseline summary is ~1 MB).
- `handoff` — for the next pause.
