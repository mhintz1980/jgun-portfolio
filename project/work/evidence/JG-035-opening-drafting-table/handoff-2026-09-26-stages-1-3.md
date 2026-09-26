# JG-035 stages 1-3 handoff — 2026-09-26 (opening rework, session continues)

Mission: implement sections 1-3 of the owner brief docs/jgun-animation-improvements.md
(drafting-sheet opening, paper flex before extraction, drawing-to-metal signature shot)
in the jgun-portfolio repo. The saved implementation plan with checkboxes is
docs/jgun-stages-1-3-implementation-plan.md - update its checkboxes as items are
verified. The 2026-09-25c handoff (project/work/evidence/JG-035-opening-drafting-table/
handoff-2026-09-25c-stations.md) is HISTORICAL CONTEXT ONLY: that session's facts are
stale (no tsconfig.app.json in this repo anymore; different layout; nothing committed).

## Where things are

- Real repo root: C:/Users/Markimus/.buzz/REPOS/jgun-portfolio
- C:/Projects/jgun-portfolio is a JUNCTION to it. npm/vite invoked from the junction
  path FAILS at build emit ("fileName ... must be strings that are neither absolute nor
  relative paths, received ../../Users/Markimus/.buzz/..."). Always cd to the realpath
  for npm run build. (typecheck/tests work from either, build does not.)
- Dev server used for verification: http://127.0.0.1:5198 (vite dev; was still alive at
  session end, PID 29872). Restart it after rebuilds; harness defaults to 5198.
- Evidence from this session:
  project/work/evidence/JG-035-opening-drafting-table/stages-1-3-2026-09-26/
    baseline-2026-09-26T05-58-08-786Z/  (summary.json + 64 checkpoints + 64 PNGs)

## Gate status at handoff (nothing committed)

| Gate | Status |
|---|---|
| npx tsc --noEmit (npm run typecheck) | PASS |
| npm test | PASS 106 tests / 10 files |
| npm run build (from realpath) | PASS (pre-existing >500kB chunk warnings only) |
| node scripts/check-b1b2-contract.mjs | PASS 24/24 (crossing .88884595, contact ~1.7e-14) |
| npm run check:station2 | PASS |
| node scripts/verify-jgun-opening.mjs | FAILED - see issues 1-4 |

git status: 14 modified + 10 untracked paths (list below). Do not commit until the
owner asks (standing rule from handoff C). Stage only JG-035 paths. The owner-supplied
brief docs/jgun-animation-improvements.md is untracked - ask before committing it.

## What changed (all uncommitted)

- Camera/opening (src/scene/drawing/sheetCamera.ts): 8-stop tour reduced to 4 moves
  (close on DETAIL D inset at [0.085,-0.165] -> traverse -> whole sheet -> square-on
  side view at pulseStart). Catmull-Rom replaced with bounded smoothstep easing (no
  overshoot). Registration hold is exact from t=0.40 to t=1 (sheetCamera.test.ts).
- Timing (src/scene/drawing/introTimeline.ts): orbitStart .52 -> .72 so the camera
  stays registered through metal emergence; departure begins at t=.72. New IntroState
  fields lightSweep + lightSweepPosition (single soft pass after the SOLVED separation,
  replaces the shockwave as the visual event). All scroll windows unchanged.
- SceneCanvas StudioRig: dedicated DirectionalLight name="intro-metal-sweep" driven by
  lightSweepPosition; key light no longer moves. CameraRig: 6-frame pulse camera shake
  removed; pointer parallax suppressed while introActive.
- HUD (src/components/TechnicalHUD.tsx): cyan chrome hidden until global progress 0.12
  (was 0.10). IntroTitles already end before the pulse - unchanged.
- Paper flex (src/scene/drawing/sheet/paperFlex.ts + .test.ts): deterministic
  profile-derived displacement field (max 0.003 m, 4 mm subdivision step), shared GLSL
  applied to paper, ink lines, fills and troika text so linework bends with the sheet.
  Pressure builds in the second half of the pulse window, releases with the solved
  crossing; lite x0.45; proof/reduced flat. Old wave fields kept in contract but
  suppressed in materials.
- Cache/startup (src/scene/drawing/sheet/drawingCache.ts, scripts/precompute-drawing.mjs):
  WeakMap memo + SHA-256(position bytes + layout) key, prepareDrawingCache() fetches
  /drawing/jgun-sheet-v1.json.gz and installs before compose/bake; DrawingLinework is
  async with cancellation and falls back to live bake (forcePoster on init error).
  profile.ts: fixed real bug - offscreen bake applied DPR twice via setViewport after
  setRenderTarget; now uses render-target pixels and try/finally state restore.
- Docs: project/README.md + project/context/architecture/animation-spec.md got a
  2026-09-26 revision note marking the pre-JG-035 narrative as historical (same-commit
  rule now satisfied when this work commits).

## Discovered issues for next session (in priority order)

1. Harness false positive (scripts/verify-jgun-opening.mjs line ~52): contextLosses
   counts the app's WebGL2 capability probe canvas - qualityStore.detectWebGL2()
   creates a 300x150 never-connected canvas and calls loseContext() deliberately.
   Baseline therefore failed "shader link failure or context loss" with zero actual
   shader failures. Fix: only count webglcontextlost when this.isConnected.
2. Harness reduced-motion assumption (same file, checkpoint loop ~line 92): reduced
   cases fail "scroll/camera did not settle" because Lenis/ScrollTrigger never mount
   under prefers-reduced-motion. Fix: skip the scroll sweep for reduced configs and
   assert the static frame instead (live draws advancing, tier full/lite, phase ~=0.4,
   focus=1, lineOpacity=1, pulse=0, flex=0, contextLosses=0 excluding probe canvas).
3. REAL product bug - reduced-motion park mismatch: CameraRig parks the camera at
   intro t=0.4 (CameraRig.tsx line ~206 and the 0.4 literal at ~431) but
   DrawingLinework.tsx:516 and TorqueWrenchHero.tsx:266 still park the drawing state
   at t=0.2. Result under reduced motion: half-focused, partially un-inked sheet.
   Fix: export REDUCED_MOTION_INTRO_T = 0.4 from introTimeline.ts, use it in all three
   places, add a test that drawingIntroState(0.4*releaseEnd) has focus 1, pulse 0,
   pbr 0, perspective 0, opacity 1.
4. Missing proof probes: harness records unavailable: capturePulseRegistration,
   captureTextBounds, captureTitleBounds. Without them stage-1 requirements (pulse
   aligned with the drawing; title-block text inside its boundaries) have NO runtime
   proof. Implement on the __drawingProof API in DrawingLinework: pulse registration =
   max/mean distance from baked profile points to nearest side-view ink segment
   (segs stride 9: x0,y0,x1,y1,w,group,key,dur,dash; group GROUP.side) - catches the
   DPR class of bug; text bounds = per-member troika textRenderInfo.blockBounds (local
   units, same space as position) vs the fit cell - record cell on InkText in
   fitTitleText (composeSheet.ts) and return both. Add a pure helper (e.g.
   sheet/registration.ts) with a unit test (shifted profile must grow the metric).
5. Precompute asset never generated: public/drawing/jgun-sheet-v1.json.gz MISSING, so
   every load takes the live bake. scripts/precompute-drawing.mjs needs: force a cache
   bypass when generating (else it re-exports stale), chrome channel fallback,
   waitForFunction(pageFn, arg, options) argument order, and honest cold-vs-warm
   measurement. Also verify drawingCacheKey covers index topology if the snapshot
   geometry is indexed (currently hashes position bytes + layout only). Then measure
   cold load with/without and record in the plan doc.
6. Registration anomaly to explain: baseline captureRegistration projectedFeatures
   errorPixels ~ output 110.9, bearing 51.4, chisel 34.2, handle 0.9 at progress 0.
   Suspect one-frame skew between drawingRuntime.sheetMatrix/modelMatrix updates
   (DrawingLinework useFrame priority -2) and probe reads, amplified by the close
   camera; re-measure on the registered hold (t 0.40-0.72) after fixes 1-4. If it
   persists at the hold, it is a real misregistration - chase it.
7. Flex coverage risks (verify, then fix): large fills come from ink.tri triangles -
   confirm they are subdivided (<= PAPER_FLEX_STEP) or they will tear while lines bend;
   confirm troika BatchedText flex injection order (transformed must exist before
   #include <project_vertex> in the derived material; batch space, not glyph space).
8. fitTitleText conservativeness: 0.7 em-width factor with size/0.7 troika font size
   may undersize title text. Verify blockBounds containment in the browser, relax the
   factor if text is visibly small.

## Suggested next-session order

1. Fix harness issues 1-2 (small, unblocks the gate).
2. Fix product bug 3 + test.
3. Add probes 4 + helper test; re-run node scripts/verify-jgun-opening.mjs against a
   fresh dev server; expect PASS desktop/narrow; reduced now meaningful.
4. Investigate 6 with the new probes; chase only if it persists at the hold.
5. Generate cache asset 5; record before/after cold-load in the plan doc.
6. Verify 7-8; fix what is real.
7. Update docs/jgun-stages-1-3-implementation-plan.md checkboxes with evidence paths.
8. Fresh read-only review (orchestration skill contract) before claiming done.
9. Commit only when the owner asks; stage JG-035 paths + the two doc revision notes.

## Environment cautions

- This workspace's sandbox currently restricts writes to other roots; jgun edits may
  need an approved escalation - the user has broadly authorized this work.
- Keep .scratch/ and docs/orzo-style-portfolio-implemetation-roadmap.md untouched.
- WebGL claims need runtime telemetry, never vision alone (repo rule). The harness
  already enforces live-canvas + fresh-context evidence; keep that property.
- The baseline run's "baseline" label means pre-fix state; do not treat it as the
  final verdict for stages 1-3.

## Suggested skills

- webgl-telemetry-verifier (C:/Users/Markimus/.codex/skills/webgl-telemetry-verifier/SKILL.md)
  - runtime probes, live-canvas gating, pixel-authoritative checks.
- r3f-scroll-performance-guard (C:/Users/Markimus/.codex/skills/r3f-scroll-performance-guard/SKILL.md)
  - zero-rerender invariants when touching DrawingLinework/StudioRig.
- orchestration (C:/Users/Markimus/.agents/skills/orchestration/SKILL.md) - fresh
  reviewer requirement before "done"; note its native-delegation tool contract.
- context-mode (r4) for large log/summary parsing (summary.json is 1 MB).
- handoff (C:/Users/Markimus/.codex/skills/handoff/SKILL.md) for the next pause.
