---
id: JG-023
plan: ../plans/JG-023-scrubbed-backgrounds.md # FILE MISSING — see "Plan-file gap" below
verified_on: 2026-08-31
verified_by: L6 verification leaf (unlazy orchestrated run; independent re-measurement of L5 raw artifacts) + X1 extension leaf (solo /unlazy + adversarial subagent, same day)
commit: 3423e22 (pilot, branch `jg-023-scrubbed-backgrounds`) + X1 extension commit (flags [true,true,false,true] + this addendum — see §Addendum X1 below)
status: verified # AC 1–8 verified (AC 5 via disclosed deviation); AC 9 RESOLVED: CH.01 accepted 2026-08-31; CH.02+CH.04 armed + re-verified (X1 addendum); CH.03 arm deferred to post-JG-021
---

# JG-023 — Scroll-scrubbed procedural backdrop layers · Verification

**Date:** 2026-08-31 · **Orchestrator contract:** root `PLAN.md` (JG-023 tree, leaves L1–L6)
**Status:** AC 1–8 verified (AC 5 with a disclosed, adversary-upheld deviation) · **AC 9 RESOLVED 2026-08-31: CH.01 ACCEPTED** (§ below) · **X1 extension: CH.02 + CH.04 armed and re-verified the same day — see §Addendum X1 (end of file); CH.03 arm deliberately deferred**
**Raw evidence:** `.scratch/jg023-verify/` (gitignored scratch — this file + the `JG-023-*.png` captures alongside it are the permanent record). Independent L6 re-measurement archive: `.scratch/jg023-verify/raw/g8_bundle.json`, `.scratch/jg023-verify/raw/g8_remeasure.json`.

**Plan-file gap (for the driver):** `PLAN.md` names `project/work/plans/JG-023-scrubbed-backgrounds.md` as the binding contract, but no JG-023 plan file exists under `project/work/plans/` (verified `find . -name "JG-023*"`), and `TODO.md`/`project/work/INDEX.md` have no JG-023 entries. This evidence file cites the orchestrator `PLAN.md` contract instead; the records commit should also add the plan file + TODO/INDEX rows or correct the reference.

## What was built (module map)

Seven files, +510/−1 lines vs `a0857bd` (`git diff a0857bd HEAD --stat`):

| File | LOC | Role |
|---|---|---|
| `src/scene/backgrounds/backdropConfig.ts` | +37 | Master switch `SCRUBBED_BACKGROUNDS` (documented revert `false`); per-chapter pilot gate `BACKDROP_CHAPTER_FLAGS = [true, false, false, false]` (CH.01 armed; owner ruling open); 4 chapter palettes (sRGB hex, authored dark under the bloom constraint); blend windows `[0.22,0.24]` + `STAGE_TRANSITIONS.wrenchOut/enclosureOut` imported from `stageWindows` |
| `src/scene/backgrounds/BackdropRig.tsx` | +137 | Renders `null`; one `useFrame`: reads `progress` from the scroll store (never the ScrollTrigger chapter channel), piecewise palette lerp into module-scope scratch Colors (zero allocation), `backdropAlpha` envelope × chapter flags → `telemetry.stage.backdropAlpha`, camera-lock `syncToCamera` per layer |
| `src/scene/backgrounds/layers/types.ts` | +19 | `BackdropLayerHandle` imperative interface (`setAlpha`/`setPalette`/`syncToCamera`, mutate-in-place) |
| `src/scene/backgrounds/layers/BackdropGradientLayer.tsx` | +146 | Gradient plane, depth 60, `renderOrder` −1000, raw ShaderMaterial, `depthTest: true` (contract amendment — transparent pass must not veil opaque content) |
| `src/scene/backgrounds/layers/BackdropGridLayer.tsx` | +163 | Grid plane + hash-noise dust (`BACKDROP_DUST` module const, revert `false`), depth 55, `renderOrder` −999; consumes pre-scaled accent only |
| `src/scene/SceneCanvas.tsx` | +4 | `<BackdropRig />` mounted immediately after `<CameraRig />` (useFrame subscription order = camera-pose freshness), inside `<PerformanceMonitor>` |
| `src/state/scrollStore.ts` | +5/−1 | `TelemetryStage.backdropAlpha` field + initializer (JG-017 two-line precedent) |

`PostProcessingComposer.tsx` untouched by design. Flag-off (`SCRUBBED_BACKGROUNDS = false`) makes BackdropRig return null at component level ⇒ module no-op; AC 2 proves the rendered result pixel-equivalent. Two sanctioned temporary src patches during L5 (bloom force-off bypass; tier handle) were applied, captured, and REVERTED — `git diff --stat 3423e22 -- src/` is empty at close.

## Environment

| Field | Value |
|---|---|
| Branch / commit | `jg-023-scrubbed-backgrounds` @ `3423e22` (src diff vs `3423e22` empty) |
| Build / servers | `:4173` = flag-ON HEAD build (`dist/`, NOT rebuilt by L6 — dist is the evidence); `:4174` = a0857bd main reference (`.scratch/jg023-verify/mainref/`) |
| Viewport / harness | Deterministic 1280×800 @ DPR 1 (`Emulation.setDeviceMetricsOverride`), headed Chrome, isolated profile, debug port 9229; zero-dep CDP client over Node 22 WebSocket |
| Scrub / settle | `window.__lenis.scrollTo(max*p, {duration:0})`; capture gated on 17 telemetry channels frozen at toFixed(7) ≥60 consecutive rAF frames |
| Checkpoints | 0.10 / 0.30 / 0.50 / 0.65 / 0.80 / 0.95 (+ 0.0 via `?chapter=0` for the authentic reduced A/B) |
| Baseline | `.scratch/jg023-verify/baseline/dist/` — pristine a0857bd build produced in THIS worktree by L1 before any JG-023 code existed (provenance: `baseline/manifest.md`) |

## AC 1 — Module implemented per contract (build leaves L2/L3/L4)

Leaf gates: L3 6/6, L2 7/7, L4 4/4, all parent re-run ALL MET; integration B1–B4 met at `3423e22` (tree green, surface exact, live smoke envelope-exact + reversible, console clean). Full-tree `npm run typecheck` + `npm run build` GREEN at the integration commit (L4/branch-integration gates; L6 did not rebuild — see Environment). Zero-allocation useFrame contract and accent pre-scaling verified by the L2/L3 adversaries (see §Adversarial layer).

## AC 2 — Flag-off parity vs the pre-feature reference

`node .scratch/jg023-verify/parity.mjs`; all 6 checkpoints RE-DIFFED by L6 from the archived PNGs (`.scratch/jg023-verify/raw/g8_remeasure.json` §ac2Parity — all `ok`):

| checkpoint | flag-off vs a0857bd px (maxΔ) | L6 re-diff |
|---|---|---|
| 0.10 | 350 (Δ1), bbox [535,731]–[1031,754] | ok |
| 0.30 | 38,621 (Δ167) | ok |
| 0.50 | 11,857 (Δ221) | ok |
| 0.65 | 12,473 (Δ199) | ok |
| 0.80 | 1,428 (Δ220) | ok |
| 0.95 | 38,585 (Δ14) | ok |

The static 0.10 checkpoint sits at maxΔ1 — far below the 14.6k-px cross-session noise floor measured flag-ON; the rest match the known uTime-phase fingerprints of the pre-existing CAD shaders. Flag-off is pixel-equivalent to the pre-feature build. Captures: `JG-023-ac2-flagoff-p010.png` vs `JG-023-ac2-mainref-p010.png` (this directory).

## AC 3 — Scrub determinism (flag ON, forward vs reverse)

L6 re-diffs of the archived same-frame pairs: @0.10 = 221,314 px maxΔ5 [ok], @0.95 = 542,818 px maxΔ236 [ok] (`g8_remeasure.json` §g2FwdRevP010/P095). Full archived table (`raw/g2/g2_determinism.json`, forward `raw/g2/fwd/`, reverse `raw/g2/rev/` + `rev2` controls, cross-session `fwd2/`):

| checkpoint | fwd↔rev px (maxΔ) | different-path bracket (uTime-decorrelated) |
|---|---|---|
| 0.10 | 221,314 (Δ5) — y<594 has **0 px**; residuals confined to the y594–798 model strip | 39,876 (Δ1) |
| 0.30 | 74,275 (Δ191) | 78,084 ≥ |
| 0.50 | 24,531 (Δ214) | 20,284 ≈ |
| 0.65 | 13,513 (Δ199) | 14,956 ≈ |
| 0.80 | 54,999 (Δ243) | 55,995 ≈ |
| 0.95 | 542,818 (Δ236) | 586,833 ≥ |

State identity fwd vs rev: progress delta EXACTLY 0 (bit-equal double), camera ≤ 4.3e-11, fov ≤ 2.4e-10, `backdropAlpha` bit-equal — all 6 checkpoints. Whole-frame STRICT 0-px equality is unattainable on this build for reasons independent of JG-023: both backdrop layers are pure functions of uniforms (no time input; grid dust static by construction), the layers are culled at backdropAlpha 0 (0.30–0.95), and the residuals are the pre-existing uTime channels (wrench inner-core CAD shader, M249Stage CAD shader, AirflowField, BaffleField), bounded above by the different-path churn controls. Captures: `JG-023-ac3-fwd-p010.png` vs `JG-023-ac3-rev-p010.png` (this directory). See §Disclosed deviations for the bracketing correction made by the L5 adversary.

## AC 4 — Telemetry envelope (`backdropAlpha`)

`node .scratch/jg023-verify/telemetry-alpha.mjs` → `raw/g3_telemetry_alpha.json`. L6 recomputed `expected = 1 − smoothstep01((p−0.22)/0.02)` at each ACHIEVED progress and re-derived err (`g8_remeasure.json` §g3Alpha — all `ok`, worstErr 0):

| target | achieved progress | measured | expected (recomputed) | err |
|---|---|---|---|---|
| 0.10 | 0.099995 | 1 | 1 | 0 |
| 0.30 | 0.299984 | 0 | 0 | 0 |
| 0.50 | 0.500018 | 0 | 0 | 0 |
| 0.65 | 0.649987 | 0 | 0 | 0 |
| 0.80 | 0.800002 | 0 | 0 | 0 |
| 0.95 | 0.950017 | 0 | 0 | 0 |

All six are outside the [0.22, 0.24] blend window, so the envelope is exactly 1 or 0. PASS (gate ±0.02).

## AC 5 — Scrub performance (10 full-page scrubs per battery)

`node .scratch/jg023-verify/perf-scrub.mjs`; L6 RECOMPUTED every statistic from the raw rAF-delta arrays (`raw/g4_*_deltas.json`, same estimator: sorted, `ds[⌊p·n⌋]`) — every value matches the archived summaries (`g8_remeasure.json` §g4):

| metric | flag ON | flag OFF | ON−OFF (recomputed from raw) |
|---|---|---|---|
| frames | 1231 | 1232 | — |
| mean ms | 16.672 | 16.669 | +0.003 |
| p50 ms | 16.7 | 16.7 | 0.0 |
| p95 ms | **16.8** | **16.8** | 0.0 |
| max ms | 16.9 | 16.9 | 0.0 |
| frames >50 ms | 0 | 0 | 0 |
| frames >16.7 ms | 609 | 612 | — |
| DPR step (canvas.width/clientHeight) | 1.58125 → 1.58125 | same | — |
| poster fallback / console faults | none / 0 | none / 0 | — |

Blank-page rAF cadence baseline (`raw/g4_blankpage.json`): the archived 3000-sample battery is the OCCLUSION-THROTTLED variant (mean 32.952 / p50 33.4 / p95 33.5 / max 283.5 — the machine throttles to 30 Hz when occluded); the unthrottled cadence p50 16.699 / p95 16.800 / max 47.3 is attested in the file's environmentNote and by the adversary's independent re-measure (p95 16.80 / mean 16.68). The raw unthrottled array was not archived, so this figure is NOT independently recomputable — flagged accordingly in `g8_remeasure.json`. Disclosed deviation: **the 16.7 ms p95 gate literal is below this display's 16.80 ms vsync quantum** — no build can measure p95 < 16.8 here; the hard decline criteria (zero frames >50 ms, zero DPR step-downs, zero poster fallbacks, zero console faults, ON−OFF delta ≤ 0.003 ms) are all green. Ruled UPHELD-as-disclosed by the L5 adversary; flagged for the owner in §AC 9 (gate thresholds should be quantum-aware on this display).

## AC 6 — Bloom safety (backdrop must stay under the 0.6-linear threshold)

`node .scratch/jg023-verify/bloom-gate.mjs` (bloom force-off via temporary `VITE_JG023_BLOOM_OFF` bypass, captured, then REVERTED — `git diff --stat 3423e22 -- src/scene/PostProcessingComposer.tsx` empty). All 6 checkpoints RE-DIFFED by L6 from the archived PNGs (`g8_remeasure.json` §ac6Bloom — all `ok`):

| checkpoint | bloom-on vs off px (maxΔ) | re-diff |
|---|---|---|
| 0.10 | 43,496 (Δ1) | ok |
| 0.30 | 189,473 (Δ175) | ok |
| 0.50 | 543,253 (Δ221) | ok |
| 0.65 | 34,784 (Δ197, airflow bbox) | ok |
| 0.80 | 179,346 (Δ246) | ok |
| 0.95 | 587,001 (Δ246) | ok |

Backdrop-only luminance, RECOMPUTED BY L6 FROM PIXELS (`g8_remeasure.json` §backdropLuminance; no luminance JSON was archived by L5 — this is the primary measurement now):

- Backdrop-visible footprint at 0.10 (flag-ON `raw/g5_on/` vs pre-backdrop `raw/parity_flagoff/` changed-px map): **221,314 px, 100% at y≥594, 0 px at y<594** [matches claim].
- Max linear Rec.709 luminance (sRGB EOTF) over exactly those 221,314 px: **0.032433** at (661, 639) rgb(75,43,9) — claim 0.0324 (ratio 1.001, rounding) ⇒ **18.5× margin** vs the 0.6 bloom threshold. Analytic authored peak (accent-pool convex mix, accent pre-scaled ×0.10): ≤ 0.0545 linear ⇒ ≥11× margin.
- Backdrop-visible px >204/255: **0** (204/255 sRGB ≈ 0.60 linear — the bloom threshold in 8-bit terms).
- Attribution of the 43,496 @0.10 changed px: all maxΔ1 and the pixel-set intersection with the backdrop-visible map is TOTAL — the model's legal-specular HALO FRINGE at rest bloom intensity 0.25 (magnitude matches the 39,876-px Δ1 cross-session jitter control), not backdrop self-bloom; a backdrop bloom would require >0.6-linear sources, which measurably do not exist. Full-frame deltas at 0.30–0.95 = model speculars + uTime phase decorrelation across builds.
- DISCREPANCY (narrative color only, reported to driver): L5's gloss that the 9,177 full-frame >204 px are "cool neutral model speculars (180,180,183-class)" does NOT reproduce — the count 9,177 reproduces EXACTLY at threshold >204, but L6 classification of that exact set finds 9,177 warm-dominant, 0 neutral (spread ≤12), 0 cool; mean rgb [242, 86, 99] (warm model paint/highlights at the CH.01 close-up). The count, the 0-in-mask result, and the bloom verdict are unaffected. Captures: `JG-023-ac6-bloom-on-p010.png` vs `JG-023-ac6-bloom-off-p010.png`.

## AC 7 — Tier behavior (full / lite / reduced / poster)

`node .scratch/jg023-verify/tier-matrix.mjs` + `g6-authentic-ab.mjs`; L6 re-read the archived matrix (`raw/g6_tier_matrix.json`) and re-diffed the full-vs-lite pair (`g8_remeasure.json` §ac7FullVsLite [ok] §tiers):

| tier | canvas | backdropAlpha @0.10 | evidence |
|---|---|---|---|
| full | yes | 1 | `raw/g5_on/fwd_p010.png` (= `JG-023-ac6-bloom-on-p010.png`) |
| lite | yes | 1 (grid forced 0) | full-vs-lite 59,890 px Δ≤15, bbox y594+ [re-diff ok] ⇒ grid PROVABLY visible in full; `JG-023-ac7-lite-p010.png` |
| reduced | yes | 1, static (authentic-session recheck 0 px) | `raw/g6_reduced_authentic_p000.png` + `_again.png`; camera pinned to hero keyframe [0.32, 0.16, 0.42] fov 42 (`src/scene/CameraRig.tsx:165`) |
| poster | **no** | telemetry frozen 0 | StaticPoster text + 48px grid DOM verified; `raw/g6_poster_page.png` |

### Authentic reduced A/B (matched checkpoint 0.0 via `?chapter=0` seed in BOTH tiers)

Route: `Emulation.setEmulatedMedia(prefers-reduced-motion: reduce)` applied BEFORE page load (authentic boot — Lenis never mounts, `src/App.tsx:43`); `?chapter=0` seeds progress 0.0 in both tiers via the scrollStore DOMContentLoaded seeding (`src/state/scrollStore.ts:66-75` — verified present). Probes: media=true, `__lenis` undefined, gear 0, backdropAlpha 1, camera EXACTLY [0.32, 0.16, 0.42] fov 42 in BOTH tiers. Captures: `JG-023-ac7-full-authentic-p000.png` vs `JG-023-ac7-reduced-authentic-p000.png`; static recheck 0 px.

Measured divergence (archived; decomposition per L5 adversary remediation):
- Whole frame: 1,009,966 px maxΔ239 — dominated by pipeline differences (composer + bloom in full vs raw path in reduced), NOT mesh content.
- Mesh content matches: model-free rows (602 of 799) profile r = 0.99402, high-pass line-structure r = 0.99044; bands 0.95198–0.99891; max per-pixel Δ in model-free rows ≤ 92. The only >64-delta cluster is the model band y279–475 (bloom halo + metal tone), 1.3% of the frame.
- Known encoding divergence (see §Pre-existing findings): reduced-tier backdrop renders raw-linear (unencoded) — tone ratio reduced/full 0.264–0.477 (mean 0.322) on model-free rows.
- Content honesty: at 0.0 both tiers hold the rest pose (full: timeline at progress 0; authentic reduced: no timeline is ever created, `src/scene/TorqueWrenchHero.tsx:101`) — NO displaced silhouette. The earlier flip-route A/B (setReducedMotion after a scrub) froze the hero GSAP timeline mid-scrub and was INVALID; it is superseded and kept as provenance (`raw/g6_fliproute-ARTIFACT_*`).

## AC 8 — Bundle / asset hygiene (G1 audit, measured by L6)

`node .scratch/jg023-verify/bundle-delta.mjs` → `.scratch/jg023-verify/raw/g8_bundle.json`. Current `dist/` (3423e22 flag-ON build) vs pristine a0857bd baseline built in THIS worktree (`baseline/dist/`, provenance `baseline/manifest.md`):

- **min-JS** (`dist/assets/*.js`): baseline **2,385,979 B** / 9 files → current **2,392,264 B** / 9 files = **delta +6,285 B** — gate ≤ 10,240 B (10 KB): **PASS**.
- Per-chunk: `SceneCanvas` 806,157 → 812,426 (**+6,269**, the new module ships here); `index` 226,454 → 226,470 (**+16**, scrollStore telemetry field). 5 chunks byte-identical (same hash): draco_decoder 719,410, vanilla 380,071, ScrollTrigger 114,013, draco_wasm_wrapper 58,763 + 58,456. 2 chunks re-hashed at IDENTICAL size (ScrollRig 19,645, BootSequence 3,010 — content shift limited to rotated chunk-hash import specifiers). Code-splitting intact: three/GSAP stack stays in the lazy canvas chunk; `StaticPoster` three-free; initial `index` chunk 226 KB.
- **Media**: 8 files (5 GLBs 20,119,992 B, `models/role-map.json` 78,395 B, og-image.png 68,525 B, favicon.svg 495 B = 20,267,407 B) — **ALL sha1-identical** baseline vs current. Standalone `draco/` decoder copies also identical (informational, excluded from the gate's min-JS definition).
- **Dependencies**: `git diff a0857bd HEAD -- package.json package-lock.json` EMPTY — no new dependencies.

## AC 9 — Owner ruling on the pilot chapter: **RESOLVED 2026-08-31 — CH.01 ACCEPTED**

**Ruling recorded:** Mark reviewed CH.01 at `?chapter=0` on :4173 and accepted the look (owner ruling 2026-08-31, relayed with the X1 extension order: "CH.01 accepted"). CH.02 + CH.04 were armed in the same ruling (`BACKDROP_CHAPTER_FLAGS → [true, true, false, true]`) and re-verified the same day — **see §Addendum X1**. CH.03 (index 2) stays `false` until the JG-021 Station-2 materials ruling closes: arming the backdrop there would confound that open visual ruling. Flip index 2 to `true` + rebuild + smoke once JG-021 is checked.

The original stop-point instructions below are retained as provenance.

**Stop-point instructions for Mark (historical):**

1. Serve `:4173` (already running, flag-ON HEAD build; if restarting after any rebuild: `cd C:\Users\Markimus\.buzz\REPOS\jgun-portfolio-jg023 && npm run preview` — RESTART after EVERY rebuild, stale server + rotated hashes = canvas never mounts).
2. Visit **`http://localhost:4173/?chapter=0`** — seeds progress 0.0 via the scrollStore deep-link seeding (`src/state/scrollStore.ts:66-75`), landing in CH.01 where the backdrop is ARMED (alpha 1, warm key pool). Scrub through the page and rule the look.
3. CH.03 preview (optional, one-const flip): set `BACKDROP_CHAPTER_FLAGS[2]` to `true` in `src/scene/backgrounds/backdropConfig.ts`, rebuild, restart :4173, visit `http://localhost:4173/?chapter=2`. The revert is documented in the same file (`false`). Chapter 1/3 seeds map to progress 0.35/0.85 in the same store block.
4. Record the ruling; remaining chapters flip per-const afterward.

## Revert instructions

Set `SCRUBBED_BACKGROUNDS = false` in `src/scene/backgrounds/backdropConfig.ts` (documented revert value) + rebuild + restart the preview. BackdropRig then returns null at component level ⇒ module no-op: no meshes, no useFrame work, telemetry `backdropAlpha` stays 0. AC 2 proves flag-off pixel-equivalent to a0857bd (350 px maxΔ1 at the static checkpoint — inside session noise). Finer switches: per-chapter `BACKDROP_CHAPTER_FLAGS` (each `false` zeroes that chapter's envelope) and `BACKDROP_DUST` in `BackdropGridLayer.tsx` (drops dust specks if the perf fallback ever fires).

## Disclosed deviations and adversary corrections (all REMEDIATED before close)

1. **AC 5 p95 16.8 vs the 16.7 gate literal** — display vsync quantum is 16.80 ms (blank-page unthrottled p95 16.800; adversary re-measure 16.80); the literal threshold is below the quantum. Hard decline criteria all green; ON−OFF ≤ 0.003 ms. UPHELD as disclosed.
2. **AC 3 whole-frame determinism** — strict 0-px whole-frame equality is unattainable for reasons independent of JG-023 (pre-existing uTime channels). The L5 adversary REFUTED the original same-path churn bracket (rev↔rev controls sit at 0.02–0.88× of the fwd↔rev counts and bracket nothing); the correct bracket is DIFFERENT-PATH pairs (uTime-decorrelated), which equal or exceed the residuals at 0.30/0.80/0.95 and match at 0.50/0.65, independently reproduced from archived captures. At 0.10 — the only checkpoint where the backdrop is visible — y<594 has exactly 0 differing px.
3. **AC 6 luminance bookkeeping** — the earlier "pure-backdrop max 0.2195" was the y594–798 MODEL-blend strip (neutral-gray model content), and L5's >204 claim needed scoping to backdrop rows. Remediated: true backdrop-only max 0.032433 linear (L6 recompute from pixels), 0 backdrop-visible px >204.
4. **AC 7 A/B validity** — the flip-route matched-pose A/B was refuted (froze the hero timeline mid-scrub; authentic reduced never builds it) and REDONE authentically at matched checkpoint 0.0; mesh content matches (r = 0.99402 on model-free rows).
5. **AC 6 color gloss (L6 finding, reported)** — the 9,177 full-frame >204 px are warm-dominant (mean rgb [242,86,99], 0 neutral), not "cool neutral 180,180,183-class" as L5 glossed. Count exact; verdict unaffected.

## Adversarial layer summary

Every leaf was re-attacked by a dedicated adversarial reviewer after the parent re-run (verdicts in `.scratch/jg023-verify/adversary-L*.md`):

| adversary | verdict | outcome |
|---|---|---|
| L1 (baseline) | 5/5 could-not-refute | baseline numbers re-measured exact — L1 VERIFIED |
| L3 (layers) | 6/6 could-not-refute | luminance reproduced exactly; peak formula proven bound — L3 VERIFIED |
| L2 (rig) | 7/7 could-not-refute | envelope math replayed exactly; accent-corruption disproven via three r185 `Color.js:798` — L2 VERIFIED |
| L4 (mount) | 4/4 could-not-refute | subscription-order mechanism confirmed in fiber 9.7.0 source — L4 VERIFIED |
| L5 (verification) | verdicts upheld 7/7; THREE evidence lines refuted | churn-bracket, bloom mislabels, flip-route A/B — all remediated (see §Disclosed deviations); G4 deviation upheld as disclosed |

## Pre-existing findings (NOT JG-023 — routed to intake, owner's call)

1. **BootSequence dead unmount timer** — `src/components/BootSequence.tsx:109-118`: the completion effect's cleanup (`:117 clearTimeout`) fires when `phase` flips `boot→ready` (phase is a dependency, `:118`), and the re-run early-returns at `:110`, so the `:116` timer that would unmount the panel is always cleared first. The boot panel never unmounts — it only fades to `opacity-0` (visually gone, DOM-resident); L5's bootWait gates on computed opacity. Last touched 2026-08-20. Route to boot-owner.
2. **Reduced-tier backdrop raw-linear encoding** — the backdrop layers are raw ShaderMaterials without a `colorspace_fragment` include: the composer's final pass output-encodes them in the full tier, the reduced raw path does not ⇒ visibly darker backdrop in reduced tier (tone ratio 0.264–0.477, mean 0.322). Candidate fix: `#include <colorspace_fragment>` in the layer shaders. Owner's call (visual signature change in a verified tier).

## Verification table

| AC | Criterion | Command / probe | Result | Pass |
|---|---|---|---|---|
| 1 | Module per contract; flag-off no-op | L2/L3/L4 + integration gates; `git diff --stat 3423e22 -- src/` empty at close | contract verified @ 3423e22 | `[x]` |
| 2 | Flag-off pixel parity vs a0857bd | `node .scratch/jg023-verify/parity.mjs` (+ L6 re-diff `g8-remeasure.mjs`) | 350 px maxΔ1 @0.10; uTime fingerprints elsewhere | `[x]` |
| 3 | Scrub determinism | `node .scratch/jg023-verify/determinism.mjs` (+ L6 re-diffs @0.10/0.95) | state identity bit-equal; residuals bounded by pre-existing uTime channels (different-path bracket) | `[x]` |
| 4 | backdropAlpha envelope ±0.02 | `node .scratch/jg023-verify/telemetry-alpha.mjs` (+ L6 formula recompute) | err 0.000000 all 6 checkpoints | `[x]` |
| 5 | Scrub perf; no declines | `node .scratch/jg023-verify/perf-scrub.mjs` (+ L6 recompute from raw arrays) | p95 16.8 (vsync-quantum deviation, disclosed); 0× >50 ms; 0 declines/fallbacks/faults; Δ(ON−OFF) ≤ 0.003 ms | `[x]` |
| 6 | Bloom safety < 0.6 linear | `node .scratch/jg023-verify/bloom-gate.mjs` (+ L6 pixel-luminance recompute) | backdrop max 0.032433 linear (18.5× margin); 0 backdrop px >204 | `[x]` |
| 7 | Tier behavior full/lite/reduced/poster | `tier-matrix.mjs` + `g6-authentic-ab.mjs` (+ L6 re-diff/re-read) | all four tiers behave per contract; authentic A/B mesh-match r 0.99402 | `[x]` |
| 8 | Bundle ≤ +10 KB min-JS; media +0; no deps | `node .scratch/jg023-verify/bundle-delta.mjs` | +6,285 B; media sha1-identical; deps unchanged | `[x]` |
| 9 | Owner ruling on pilot chapter | Mark scrubs `:4173/?chapter=0` (instructions above) | **RESOLVED 2026-08-31: CH.01 ACCEPTED; CH.02+CH.04 armed+verified (§Addendum X1); CH.03 deferred** | `[x]` |

## Required Project Checks

- [x] `npm run typecheck` + `npm run build` GREEN at the integration commit (L4 / branch-integration gates, `3423e22`). L6 deliberately did NOT rebuild: `dist/` is the audited evidence artifact.
- [x] The `:4173` preview serves the current build (restarted by L5 after the final rebuild; L6 killed no servers).
- [x] Runtime telemetry used for every WebGL/scene/perf claim on this page; the PNG pairs are same-frame supporting evidence only.
- [x] Reduced-motion, lite, and poster-tier behavior explicitly checked (AC 7).
- [x] No protected `.scratch/` or parallel-session file committed by this work: `.scratch/` is untracked scratch; this records commit must NOT include it (see below).

## Result

**partial** — AC 1–8 verified with measured evidence (AC 5 via a disclosed, adversary-upheld deviation); AC 9 (owner ruling) intentionally open. TODO/INDEX status flips to `verified` only after Mark's `?chapter=0` ruling is recorded.

## Residual Risk and Follow-up

- Gate literal `p95 ≤ 16.7 ms` is un-meetable on this 16.80 ms-quantum display — recommend making the perf gate quantum-aware (e.g. p95 ≤ display quantum + ε, hard criteria unchanged) so future work doesn't inherit a false-red.
- The two pre-existing findings above belong in `project/work/inbox/` (boot-owner; colorspace fix).
- Missing `project/work/plans/JG-023-scrubbed-backgrounds.md` + absent TODO/INDEX JG-023 rows — records-commit owner should add them (see Plan-file gap).
- L5's "cool neutral" color gloss is corrected here; no action beyond the record.
- Raw artifacts live in gitignored `.scratch/jg023-verify/`; the nine `JG-023-*.png` copies in this directory are the permanent visual record (key same-frame pairs: AC 2 parity, AC 3 determinism, AC 6 bloom on/off, AC 7 lite + authentic reduced A/B).

## Erratum (L6-adversary corrections, 2026-08-31 — appended by driver before records commit)

The L6 adversarial audit (`.scratch/jg023-verify/adversary-L6.md`; independent PNG decoder + raw-array replay) could not refute any gate verdict or load-bearing number — every PNG-diff count, the luminance figure (0.032433 linear @ rgb(75,43,9), 18.50× margin), and all bundle bytes reproduce exactly — but corrected:

1. **AC 3 state-identity bound**: camera delta is ≤ **4.39e-11** (max single row 4.3878e-11, `g2_determinism.json` @0.8), not "≤ 4.3e-11" as a stricter bound implies. dProgress = 0 exact and fov ≤ 2.3664e-10 hold as stated.
2. **AC 3 bracket cells @0.50 / @0.65**: correct values are **20,296** and **15,239** (the stated 20,284 / 14,956 were carried from the L5 manifest without L6 re-measurement — the other four bracket values reproduce exactly; the AC 3 conclusion is unaffected).
3. **Churn-control ratio range**: 0.003–0.88× (not 0.02–0.88×). **CameraRig citation**: :166 (not :165). **BootSequence chunk rehash note**: size-identical re-hash includes a minifier local rename — content-equivalent.
4. **Plan-file gap (previous section) resolves at merge**: the JG-023 plan + TODO/INDEX rows were committed on `main` at triage (`bc76efc`) AFTER this branch's base `a0857bd`; this worktree never saw them. Records + merge commits reconcile.
5. Scratch-only staleness (never copied into this file; no action): `manifest.md` g2fwd↔g5on @0.30/0.95 entries are stale (correct: 35,883 / 586,833).

---

# §Addendum X1 — CH.02 + CH.04 armed (2026-08-31, same day as the pilot)

**Scope.** The owner accepted CH.01 (AC 9) and armed CH.02 + CH.04 in the same ruling: `BACKDROP_CHAPTER_FLAGS = [true, true, false, true]` — one hunk in `backdropConfig.ts` (comment update included). CH.03 (index 2) deliberately stays `false` until the JG-021 Station-2 materials ruling closes (arming there would confound that open visual ruling). This addendum records the re-verification of every measurement the CH.01-only regime could not represent, because the backdrop was previously invisible for ~78% of the scroll; under `[T,T,F,T]` it is live for most of the page. **The CH.01-era sections above remain as provenance, scoped to the `[true,false,false,false]` pilot regime; where numbers differ, this addendum governs the shipped regime.**

**Leaf:** solo `/unlazy` + dedicated adversarial subagent. Gates ledger: `.scratch/jg023-verify/GATES-X1.md` (gitignored scratch; 15/15 checked at close). Raw artifacts: `.scratch/jg023-verify/raw/x1*/` + `raw/x1_telemetry_alpha.json` + `raw/x1_uniform_probe.json` + `raw/g4_x1on*.json` / `raw/g4_x1off*.json`.

**Regime math.** With flags `[T,T,F,T]` the envelope is `α = w0 + w1 + w3 = 1 − t23·(1−t34)` with `t12 = ss01((p−0.22)/0.02)` (CHAPTER_BLEND_12), `t23 = ss01((p−0.525)/0.04)` (wrenchOut), `t34 = ss01((p−0.72)/0.04)` (enclosureOut). Extended checkpoint set (canonical 6 + the three blend midpoints): **0.10, 0.23, 0.30, 0.50, 0.545, 0.65, 0.74, 0.80, 0.95**. Full-alpha rows: CH.02 @0.30/@0.50, CH.04 @0.80/@0.95; blends @0.545/@0.74 sit at α = 0.5; CH.01→CH.02 handoff @0.23 stays α = 1 (both chapters armed).

## X1 results by AC

| AC | Measurement (X1 regime) | Result |
|---|---|---|
| 1 | `npm run typecheck` GREEN ×2 + build GREEN ×3 (variant arms) + `scripts/check-station2-contract.mjs` PASS on the flipped tree | PASS |
| 4 | `backdropAlpha` vs the `[T,T,F,T]` envelope at all 9 checkpoints (achieved progress), re-run identically after the final :4173 restart | PASS — worst err **0.000000** (blends 0.50018 / 0.49951; 0.65 → 0) |
| 3 | fwd↔rev state identity: dProgress **exactly 0** (bit-equal double), dCamera ≤ 4.39e-11, dFov ≤ 2.37e-10, `backdropAlpha` bit-equal — all 9 checkpoints. Whole frame: **0 differing px EXACTLY @0.74**; @0.10 reproduces the L5 model-strip signature (221,314 px, bbox y594–798; adversary proved the flip-set is 100.000% index-identical across eras on byte-different PNGs — deterministic approach-path rasterization, not carried data). Strict backdrop mask (see method note): fwd↔rev residuals are quantization film only — maxΔ ≤ 4, exact 0 @0.74/0.80/0.95 | PASS |
| 5 | 10-scrub battery, flag-ON (backdrop live) vs flag-OFF build: mean 16.674 vs 16.672, p50 16.7 both, p95 16.8 both, max 17.7 vs 17.0; **Δ(ON−OFF) = +0.002 ms mean, 0.0 p50/p95**; 0 frames >50 ms both arms; 0 DPR step-downs, 0 poster fallbacks, 0 console faults | PASS — the gate most at risk did not move; p95 16.8 = the 16.80 ms display vsync quantum (same disclosed deviation as the pilot, upheld) |
| 6 | **Analytic (pre-tonemap) bound from live uniforms:** gradient shader is a pure convex mix of uTop/uBottom/uAccent, grid paints uAccent alpha-weighted only (adversary read both shaders) → worst uniform linear luminance **0.054543** (11.0× margin vs the 0.6 bloom threshold); CH.02 full-alpha 0.052619 (11.4×), CH.04 full-alpha 0.015935 (37.7×); all nine checkpoints under the 0.45 design bound. **Pixel side (post-tonemap PNGs, strict backdrop mask):** worst px 0.213 (@0.50, a wash+in-canvas-sprite blend), pure-wash maxima CH.02 0.0232 / CH.04 0.0056; **0 px >204/255 at all 9 checkpoints**; bloom-on vs bloom-off delta inside the strict mask is film-class (maxΔ ≤ 5, exact 0 @0.65/@0.74) — no backdrop self-bloom signature. Method validation: @0.10 the strict mask reproduces the pilot's 0.0324 luminance figure (0.031315 at the same accent-pool neighborhood) | PASS |
| 7 | lite @0.50/@0.95: `gridUAlpha` forced 0 (uniform-level proof), gradient α 1, full tier's grid provably visible (134,413 / 602,723 differing px; maxΔ up to 244 EXPECTED — setTier lite also removes ChromaticAberration, documented tier semantics). reduced @held-0.50: progress freezes at 0.500018, α 1, static recheck **0 px**. poster: no canvas, StaticPoster + 48px grid DOM, telemetry frozen 0 | PASS |
| 2 | spot canary only (archive proved all 6 in the pilot): fresh flag-off build vs a0857bd @0.50 = 12,131 px (maxΔ 213) — inside the cross-session uTime fingerprint class (cf. pilot 11,857/Δ221) | PASS |
| — | **CH.03 genuinely dark @0.65:** telemetry α bit-0 across the whole [0.565, 0.72] hold (not merely ≤0.001), both meshes `visible=false`-culled, strict backdrop mask = 1 quantization-collision px at luminance 0.000000 | PASS |
| 8 | Cheap confirm (no new code): min-JS 2,392,282 B / 9 files = **+18 B** vs the pilot record (SceneCanvas chunk 812,444, minifier codegen around the changed boolean literal — NOT byte-identical, gate ≤ 10,240 B passes with huge headroom; cumulative vs a0857bd +6,303 B; index chunk 226,470 EXACT). Media: all 6 binaries (5 GLBs + og-image) sha1-identical to the a0857bd build; the 2 text diffs vs the stale mainref copy are EOL phantoms (0 commits touch them in a0857bd..HEAD; dist copies byte-match committed `public/`). No dependency changes | PASS |

## X1 method notes and amended gates (disclosed, adversary-reviewed)

1. **Strict backdrop mask.** Backdrop-attributable pixels = changed-vs-flagoff ∧ outside a 25 px dilation of the fwd↔fwd2 cross-session churn set. The naive churn-subtracted mask is UNSOUND: 8-bit quantization collisions leak model pixels (it produced 0.88-luminance model speculars and 5,159 "backdrop" px at culled 0.65 — impossible). The adversary proved the dilation over-attributes (leaks model px in, never hides the wash) and the analytic uniform bound covers the mask's blind spot.
2. **Pairwise whole-frame determinism counts are NOT bracket-able** — fwd↔rev residuals exceed the fwd↔fwd2 control by up to 10× at 0.23–0.55 (visit jitter + uTime phase luck). This reproduces the L5-adversary finding; the binding checks are state identity + the strict-mask quantization-film result, not a whole-frame bracket.
3. **Perf gate remains quantum-aware:** p95 16.8 equals this display's 16.80 ms vsync quantum; the plan's 16.7 literal stays un-meetable on this machine (pilot deviation upheld; hard decline criteria are the real gate and are green).
4. **Bundle expectation corrected:** the flip is one hunk, but minifier codegen shifts the SceneCanvas chunk +18 B — "byte-identical sizes" was the wrong expectation; the ≤10 KB gate is the contract and passes.
5. **Capture infrastructure:** served arms — :4173 flag-ON (evidence build; byte-identical snapshot restored + restarted + re-probed at close), :4174 a0857bd mainref, :4175 flag-off, :4176 bloom-off (`VITE_X1_BLOOM_OFF` temporary bypass, reverted), :4177 tier-handle (`VITE_X1_HANDLE` temporary store handle, reverted). All three temporary patches reverted — `git diff -- src/` at close is exactly the flag hunk. Scratch variant servers were killed at close; :4173 and :4174 left serving.

## X1 adversarial layer

A dedicated adversarial subagent (fresh context; inputs: gates ledger, the diff, raw artifacts; brief: refute, not confirm) attacked six targets — perf visibility at sampled checkpoints, full-alpha bloom sampling, carried-forward numbers, CH.03 darkness, bloom-method soundness (shader convexity + pre/post-tonemap domains), and 8 independent spot re-measures. **Verdict: 6/6 COULD-NOT-REFUTE, 8/8 re-measures exact, zero non-reproducing numbers.** It confirmed the flipped build was provably the one measured (the served chunk's minified envelope folds CH.02 unconditional) and explained the one suspicious cross-era identity (221,314 @0.10) as a deterministic rasterization signature. Four ledger citation/label defects were found and fixed (two artifact paths, one mislabeled neutral px, one census derivation citation) — no verdict flipped. Verdict file: `.scratch/jg023-verify/adversary-X1.md` (+ `adversary-remeasure.mjs`).

## X1 status and follow-up

**verified** for the `[true, true, false, true]` regime. Remaining work (intentionally NOT done here): arm CH.03 — flip `BACKDROP_CHAPTER_FLAGS[2]` to `true`, rebuild, restart, smoke (`?chapter=2`) — gated on the JG-021 Station-2 materials ruling closing. The uniform-probe tooling (`x1-uniform-probe.mjs`) should re-run as part of that smoke.

## X2 — CH.03 arm (2026-09-01, after the JG-021 ruling closed)

Owner gate satisfied: JG-021 closed **verified** 2026-09-01 (owner final ruling PASS,
JG-021 evidence §13). The defined follow-up was executed the same day with owner
authorization ("run it"); Mark separately ordered the batch push. Change: one hunk in
`src/scene/backgrounds/backdropConfig.ts` — `BACKDROP_CHAPTER_FLAGS`
`[true,true,false,true]` → `[true,true,true,true]` + comment update. No new code paths:
CH.03 renders the pre-authored "deep teal hush" palette (`backdropConfig.ts:21`), the
darkest and lowest-accent of the four, through the exact X1-verified layer machinery.

| Gate | Measurement (X2 regime `[T,T,T,T]`) | Result |
|---|---|---|
| build | `npm run typecheck` GREEN + build GREEN (14.6 s); fresh `:4173` (ports verified free before start — no orphan listener) | PASS |
| envelope (AC 4) | `backdropAlpha` **1.00000 at all 9 extended checkpoints**, including the CH.03 set 0.50 / 0.545 / 0.65 that measured bit-dark `α=0` before the arm; console faults 0 at every boot across 5 harness runs | PASS |
| bloom (AC 6, analytic) | worst uniform linear luminance **0.054543 — identical bound to X1** (the CH.01 accent remains the max contributor); CH.03's own palette at 0.65: **0.035985 (16.7× margin** vs the 0.6 bloom threshold); all 9 checkpoints under the 0.45 design bound | PASS |
| determinism (AC 3) | fwd↔rev state identity **exact**: dProgress 0 (bit-equal double), dCamera ≤ 2.5e-11, dFov ≤ 2.4e-10, `backdropAlpha` bit-equal @1 — all 9 checkpoints; @0.74 exactly **0 differing px**; @0.65 fwd↔rev 14,627 px vs the cross-session bracket 15,526 px (residuals INSIDE the pre-existing uTime churn envelope — the same signature class X1 established, now including the enclosure's own live channels) | PASS |
| perf (AC 5) | 10-scrub battery: mean **16.672** / p50 16.7 / p95 **16.8** / max **17.3** — statistically identical to the X1 flag-ON battery (16.674/16.7/16.8/17.7); **0 frames >50 ms; 0 DPR declines; 0 poster fallbacks**; canary Δ210,604 px maxΔ2 in the y594–798 model strip = visit-jitter signature, not a tier change. p95 16.8 = the display's 16.80 ms vsync quantum (standing disclosed deviation, upheld) | PASS (quantum-aware) |
| bundle (AC 8) | min JS **2,392,292 B = +10 B** vs the X1 record (minifier codegen around the changed boolean literal — same class as X1's +18 B; gate ≤ +10,240 B passes with ~1000× headroom); index chunk 226,470 EXACT; media untouched (no build inputs changed) | PASS |

Artifacts: `.scratch/jg023-verify/raw/x1/g2/` (fwd/rev/fwd2 captures + `x1_determinism.json`),
`raw/g4_ch03arm.json` (+ canary pair), `raw/x1_uniform_probe.json`, `raw/x1_probe_raw.json`;
evidence frames in this directory: `JG-023-x2-ch03arm-p065.png` (CH.03 rest, backdrop live
behind the enclosure) and `JG-023-x2-ch03arm-p010.png` (CH.01 reference). Harness unchanged
from X1; same headed-Chrome CDP machinery, `?chapter` deep links unused (checkpoints via
settle-gated scrub).

**Regime is now `[true, true, true, true]` — all four chapters armed. Status: verified.**
The remaining backdrop work is design evolution, not arming: see
`project/work/inbox/five-plans-synthesis.md` W5 (round-table-gated).

---

## Addendum — declared JG-026 change to the backdrop envelope (2026-09-05)

**Declared by JG-026 on branch `codex/b1-b2-engineering-drawing`. Not silent, not a regression
left to be discovered.**

### What changed

`BackdropRig` now multiplies the visibility envelope by one named constant while the B1/B2
drawing owns the frame:

```ts
const INTRO_BACKDROP_LEVEL = 0.55
const introFactor = progress >= DRAWING_INTRO_WINDOW.releaseEnd
  ? 1
  : INTRO_BACKDROP_LEVEL + (1 - INTRO_BACKDROP_LEVEL)
      * smoothstep01((progress - (DRAWING_INTRO_WINDOW.releaseEnd - 0.012)) / 0.012)
```

**The chapter-weight envelope itself (`w0..w3`, the three blend windows, the palette lerp, the
flag gating) is untouched.** This is a single multiplier that reaches exactly 1.0 at progress
0.120 and stays there.

### Why

Owner ruling 2026-09-05 (JG-026 Item 7.5): the ANSI C sheet fills ~67% of a 16:9 viewport by
design, and *"the backdrop wash lives"* in the dark margins either side of it. At full strength
the wash competes with the print; at zero those margins go dead black.

An intermediate build on this branch had multiplied the envelope by
`smoothstep01((progress − 0.108) / 0.012)`, forcing it to **0** below progress 0.108. That was
both an undeclared change to a JG-023 gate and the wrong behaviour for Item 7.5. It is replaced.

### Re-measurement

Fresh `:4173` run, 2026-09-05, ANGLE (AMD Radeon 780M, D3D11), 1920×1080 and 390×844.
Raw: `b1-b2-rebuild/proof/report.json → viewports.*.jg023`.

| progress | 0.02 | 0.10 | 0.115 | **0.120** | 0.20 | 0.30 | 0.40 | 0.50 | 0.60 | 0.70 | 0.80 | 0.90 | 1.00 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| desktop `backdropAlpha` | 0.550000 | 0.550000 | 0.830940 | **1.000000** | 1.000000 | 1.000000 | 1.000000 | 1.000000 | 1.000000 | 1.000000 | 1.000000 | 1.000000 | 1.000000 |
| mobile `backdropAlpha` | 0.550000 | 0.550000 | 0.830720 | **1.000000** | 1.000000 | 1.000000 | 1.000000 | 1.000000 | 1.000000 | 1.000000 | 1.000000 | 1.000000 | 1.000000 |

### Effect on the X2 gate

X2 was verified on "alpha 1.00000 at all 9 checkpoints, envelope err 0.000000".

* **Every checkpoint at progress ≥ 0.120 is bit-identical to its verified value (1.000000).**
  The envelope arithmetic is unchanged, so envelope error remains 0.000000 there.
* **The 0.10 checkpoint now reads 0.550000.** That checkpoint falls inside the progress band
  JG-026 reserves for the B1/B2 intro (`0.000–0.120`), which did not exist when JG-023 was
  verified. Its value is now governed by JG-026, by owner ruling, and is stated here rather
  than being allowed to look like drift.
* Reduced motion reads 0.550000 (progress is pinned at 0 in that tier), so the wash is present
  behind the static drawing frame rather than absent.

No other JG-023 behaviour, constant, flag or palette is touched by JG-026.

Full context: [JG-026 verification §7](JG-026-b1-b2-verification.md).
