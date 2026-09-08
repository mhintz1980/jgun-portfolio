---
id: JG-032
plan: ../plans/JG-032-station2-thermal-visualization.md
verified_on: 2026-09-08
verified_by: claude (machine gates); owner visual ruling PENDING
commit: 15dc719 (+ probe commit)
status: verified # machine gates green; TODO checkbox awaits owner visual ruling
---

# JG-032 — Verification Evidence

## Claimed Outcome

Station-2 (RL300) reads as a thermal-management cutaway: airway-box-driven
+Z→−Z airflow with a cool→hot ramp, baffle deflection, pump heat pulse, 6
acoustic rings retained + 5 thermal boundary shells (owner ruling
2026-09-08); owner-approved dark-blue recolor via per-mesh part-number
allow-list (supersedes JG-021 round 3); translucent panels restored; JGUN
lighting/shadow/grain additions all progress-gated and inert at CH.04. M249
untouched.

## Environment

| Field | Value |
|---|---|
| Branch / commit | `main` — behavior commits `3edecce` (airflow+rings), `7f7a0c2` (recolor), `abae74c` (panels flip), `15dc719` (JGUN gates); plan `477c9c3` |
| Build or preview URL | `http://localhost:4173/` (current) and `http://localhost:4174/` (baseline worktree `jgun-portfolio-jg032-base` @ `477c9c3`), both freshly restarted after rebuild |
| Quality tier / viewport | full tier, 1280×720 (headed Chrome d3d11, Radeon 780M — see probe notes), reduced-motion + lite tiers probed |
| Asset revision | `msp-enclosure.glb` 2,380,776 bytes (untouched); `Default.glb` 10.2 MB (untouched) |

**Probe environment note:** at 1920×1080 the sweep legitimately escalates the
one-way quality ladder to poster mid-run on this box (sustained <45 FPS under
the probe browser = the ladder working as designed). The probe runs headed,
on-screen (`--disable-backgrounding-occluded-windows`), at 1280×720. A
blank-page rAF control measured p50 16.7 ms (60 Hz) the same day.

## Evidence

| Acceptance criterion | Exact command, probe, or procedure | Result | Pass |
|---|---|---|---|
| Airway AABB uniforms resolved | `node scripts/verify-jg032-station2-thermal.mjs` step 1b | `uAirwayValid=1`, `uAirwayMin=[-0.6,1.2,0.431]`, `uAirwayMax=[0.6,1.855,1.3]` (±0.01); `uGrilleValid=1` `[-0.686,0.456,1.295]→[0.686,1.86,1.355]`; 12,000 particles full tier | [x] |
| Cool→hot ramp per spec | probe step 1b (GLSL source) + `airflowRoute.test.ts` (12 tests sample `heatRampColor` at t=0.1/0.375/0.6/0.75/0.9) | all 6 GLSL stops present (`#00e5ff→#38bdf8/#7dd3fc→#fbbf24→#f97316→#ef4444`); JS ramp samples match | [x] |
| Ring split 6 acoustic / 5 thermal | probe step 2b | acoustic pool 6 rings `#00e5ff` (behavior byte-identical); thermal pool 5 shells `#fbbf24,#f9991d,#f97316,#f26511,#ea580c`, all `BackSide` | [x] |
| A/B material census vs pre-change HEAD | probe step 3: live census of both builds (581 mesh entries, 557 unique root::part::mesh keys), per-mesh diff | delta set = **54 allow-listed recolors** (`MSP_BLACK_CHASSIS #272728` → `#0a1a3a` chassis / `#132a4a` panels) + **151 intended panel-flip flag changes** (`transparent false→true`, `depthWrite true→false`, `opacity 1→0.35`, COMPOSITE_PANELS only) + **0 unexpected**; no allow-listed part missed | [x] |
| Protected meshes unchanged | probe step 3 explicit pass | `MSP_YELLOW_PAINT` `#ffc500` everywhere (incl. `G2RL300-SAF-1003-2` grille), `MSP_AIRWAY_VOLUME` `#59c4f9`, PUMP_HOUSING, ISOLATION_MOUNTS, hardware — all unchanged; vertex counts identical on every mesh | [x] |
| Panels translucent restored, no glow | probe step 4 + in-page luminance decode of `jg032-panels-*.png` | opacity 0.35 assembled (p=0.575), y=0.55/opacity 0.18 at hold (p=0.65); blown-hot (L≥250) 0.021% assembled / 0.000% hold vs JG-021 accepted 0.57%/0.12%; no sorting artifacts in `jg032-hold-065-translucent.png` | [x] |
| JGUN gates inert at CH.04 | probe step 5 + `jgunVisualGates.test.ts` (12 tests at CH.04 progress values 0.72–1.0) | live: p=0.50 spot 1.4 @ y1.3, rim 0.8, shadow visible; p=0.47 rim 0.8 in LCD window; p=0.85 spot resting 1.1 @ y1.2, rim 0, shadow hidden | [x] |
| CH.04 telemetry vs baseline | probe step 6: deepDiff of full `window.__telemetry` at p=0.85 and p=0.90, numbers quantized to 1e-4, excluding time-integrating `rig.stageRot`/`rig.planetRot` and `performance.*` | **zero diffs at both stops**. Quantization note: the damped camera and `transitionIntensity` carry ≤2.6e-4 residue between ANY two runs (damping never fully converges); all non-numeric fields and all numerics ≥1e-4 are byte-identical | [x] |
| Telemetry slot constraint | code review + probe | `scrollStore.ts` untouched; thermal rides the existing `flow`/`acousticWave` fields (both live at 0.548 at p=0.65) | [x] |
| Aperture lattice matches real geometry | `.scratch/inspect-jg032-grille.mjs` + `.scratch/probe-jg032-grille-rays.mjs` (Draco decode + 64×64 ray grid through the grille volume) | grille mesh 188: 8,282 verts, closed manifold, **no hex perforations** → 8×4 slot lattice from the grille AABB (never an invented hex pattern); airway mesh 187: 48 verts / 1 prim volume block, AABB exactly as the brief states | [x] |
| Perf budget | probe perf block (180 rAF deltas at p=0.65) + decomposition at 0.575/0.65 on both builds | baseline p50 16.7/p95 18.7; current p50 21.3/p95 29.4/max 39.1 ms; decomposition: translucent-panel restore +3.9 p50 (owner-approved JG-021 treatment), pump pulse ≈ free; **0 PerformanceMonitor declines, tier stays `full` at all 9 stops** on both builds | [x] |
| Tiers | probe: `reducedMotion: 'reduce'` context + `__drawingProof.setTier('lite')` | reduced-motion mounts clean, 0 errors; lite = 3,600 particles; static acoustic/thermal contours render in static mode | [x] |
| Bundle hygiene (asset-and-bundle-hygiene) | inspect `dist/`: entry chunk, draco, favicon, modulepreload | entry `index-*.js` 71.6 kB gzip (≤ 75 kB, byte-identical to baseline); canvas chunk separate (482.8 kB, no modulepreload); `dist/draco/` decoders present and local; favicon present; 0 circular-dep warnings | [x] |
| Zero console errors | probe pageerror/console capture across the full sweep + tier contexts | 0 errors on every stop, both builds | [x] |

## Required Project Checks

- [x] `npm run typecheck` completed with no errors.
- [x] `npm run build` completed with no errors (8.8 s; entry chunk unchanged).
- [x] `npm test` — 48/48 PASS (12 new: airway derivation, ramp, ring split, lattice; 9 recolor allow-list incl. negatives; 12 JGUN gates; grain).
- [x] `npm run check:station2` PASS (2,380,776 bytes, 7 roots, 7 anchors, both field mounts).
- [x] The `:4173` preview was restarted after the current build (and `:4174` baseline freshly built+started).
- [x] Runtime telemetry was used for WebGL/scene claims; screenshots are supporting evidence only (`shot-p0_05/0_47/0_5/0_575/0_65/0_74.png` + `jg032-*.png` in this directory).
- [x] Reduced-motion and lite tiers checked (probe); poster untouched (no canvas-path edits).
- [x] No protected `.scratch/` or parallel-session file committed (`.scratch/` probes untracked; probe script, captures, and this record are the committed artifacts).

## Result

**verified** (machine gates). Per repo protocol the TODO checkbox flips only
after the owner's visual ruling at `:4173` — suggested stops: CH.03 cutaway
hold (`p ≈ 0.65`, airflow + thermal shells + translucent panels + navy
recolor), CH.02 explode hold (`p ≈ 0.50`, shadow + spot nudge), LCD dwell
(`p ≈ 0.47`, micro-rim), CH.01 intro (paper grain + registration crosses),
CH.04 (`p ≈ 0.85`, unchanged).

## Residual Risk and Follow-up

- Perf: +3.9 ms p50 at the hold vs the opaque-panels baseline — the cost of
  the owner-approved translucency restore, not the airflow work (pump pulse
  and new shaders measured ≈ free). Zero declines observed; within the
  max ≤ 50 ms budget.
- The census key (`root::part::meshName`) collapses duplicate mesh names
  within a part (581 entries → 557 unique keys); both builds collapse
  identically, so the diff is consistent, but per-instance deltas inside a
  same-named pair would be masked. No such pair exists among the 54 recolors
  (verified by the no-misses pass).
- `spatial-hotspot-a11y` was rostered conditionally; hotspots/callouts were
  not shifted by any change (probe confirms callout visibility windows
  unchanged), so the skill stayed unloaded per the plan's conditional.
