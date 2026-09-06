# TODO — JGUN Portfolio

> **Canonical approved task queue.** Every new task has a stable `JG-###` ID and links to an accepted plan. Change a checkbox to `[x]` only after the matching verification record exists in [`project/work/evidence/`](project/work/evidence/) and the plan status is `verified`.

Start every task by reading [`AGENTS.md`](AGENTS.md), [`project/README.md`](project/README.md), and the linked plan. The registry at [`project/work/INDEX.md`](project/work/INDEX.md) is the complete map of task state, dependencies, plans, and evidence.

## Active

- [ ] **JG-026 — Rebuild B1/B2 engineering drawing → 3D extraction** · [plan](project/work/plans/JG-026-b1-b2-engineering-drawing.md)
  - Owner-authorized 2026-09-03; owner pacing/realism rulings 2026-09-05. Branch `codex/b1-b2-engineering-drawing`. Hidden-line ANSI C third-angle print, projected GD&T, ordered excitation, vertex-solved detachment and single shockwave pass, owner-paced intro (document 2020vh → 3120vh with no downstream chapter losing distance).
  - **Machine gates complete** ([evidence](project/work/evidence/JG-026-b1-b2-verification.md)); **Mark's `?chapter=0` visual ruling is still required** and the mobile arrangement is provisional pending it.

- [x] **JG-014 — Opening sequence, print-authentic GD&T annotations, and rear-LCD reveal** · [plan](project/work/plans/JG-014-opening-gdt-lcd-repair.md)
  - Correct tilted and duplicated opening callouts, replace opaque narrative cards with non-occluding beat copy, use the supplied gearbox drawings for datum/feature-control language, and add a real rear-LCD/buttons reveal before the JGun exit.
  - **Required proof:** fresh `:4173` telemetry, full/reduced-motion/poster behavior, accessibility checks, `npm run typecheck`, and `npm run build`.

- [x] **JG-015 — RL-300 / MSP Acoustic SAFE asset ingestion** · [plan](project/work/plans/JG-015-msp-acoustic-safe-asset-ingestion.md)
  - Replace the Stage 2 placeholder with a measured, named, source-registered, web-ready CAD asset (`public/models/msp-enclosure.glb` with 7 named roots) in `Station2_AcousticEnclosure.tsx`.
  - **Required proof:** fresh `:4173` telemetry, contract check, full/reduced-motion/poster behavior, `npm run typecheck`, and `npm run build`.

- [x] **JG-016 — Multi-station spatial world and navigation rig** · [plan](project/work/plans/JG-016-multi-station-spatial-world.md)
  - Replace implicit sequential stage placement with a measured three-station world: JGun Torque Multiplier (`[0, 0, 0]`), RL-300 Acoustic Enclosure (`[28, 0, -6]`), and M249 Parametric Platform (`[56, 0, -12]`), with seamless camera navigation, deep linking, and telemetry synchronization.
  - **Required proof:** fresh `:4173` telemetry, contract check, full/reduced-motion/poster behavior, `npm run typecheck`, and `npm run build`.

- [x] **JG-020 — Multi-station subassembly inspection, spatial hotspots, and interactive CAD anchors** · [plan](project/work/plans/JG-020-multi-station-hotspots-inspection.md)
  - Expand subassembly inspection, spatial datum annotations, and camera dollying across all 3 stations (JGun, RL-300 SAFE Enclosure, and M249 Receiver Platform) with interactive hovering, rich engineering HUD cards, and continuous scroll release ([evidence](project/work/evidence/JG-020-multi-station-hotspots-inspection-verification.md)).

- [ ] **JG-025 — Handle-rear realism pass: red button/LCD cluster, rendered screen, reveal-beat framing** · [plan](project/work/plans/JG-025-handle-rear-realism.md)
  - Make the JG-014 rear-LCD reveal the most realistic portion of the assembly per the owner's
    reference render ([reference image](project/context/references/media/handle-rear/handle-rear-owner-reference.png)):
    red buttons + red LCD bezel + glossy black cap (code-side material swap on the live
    `lcd-buttons`/`lcd-housing`/`lcd-screen` unit roles), data readout on the LCD, button
    symbols, reveal-beat framing vs reference, fill-light retune. No GLB re-export.
  - **Required proof:** telemetry material identity at the reveal dwell, same-frame before/after
    pairs, reduced-motion/poster tiers, `npm run typecheck`, `npm run build`,
    `scripts/check-station2-contract.mjs`, owner visual ruling at the stop point.
  - **Active 2026-09-05** — built on `zcode/jg-025-handle-rear` (worktree `jgun-portfolio-jg025`);
    **merged into `main` with JG-026 and pushed 2026-09-05 per Mark's order** (rebase clean,
    integrated re-verification in the [evidence addendum](project/work/evidence/JG-025-handle-rear-verification.md)).
    Checkbox awaits Mark's visual ruling at the `:4174` dwell (scroll ≈47% logical; raw offset
    18,990 px under the JG-026 scroll mapping).

## Queued

- [x] **JG-024 — Fine-tessellation JGun re-export with missing fasteners** · [plan](project/work/plans/JG-024-fine-jgun-fastener-reswap.md) · [evidence](project/work/evidence/JG-024-fine-jgun-fastener-reswap-verification.md)
  - Replace `Default.glb` with the Fine-tessellation Onshape re-export (`C:\Projects\CAD\JGUN.glb`, 10.95 M tris) carrying the 9 missing screws (5 handle back-plate + 4 radial `91251A344`): quadric-simplify back to the ~333 K-triangle approved baseline density + Draco via gltf-transform, hierarchy/names/world-transforms preserved (forensics in the plan), one `blackOxideSteel` role-override line for the fastener names.
  - **Required proof:** processed-GLB parity probes, role-map occurrence resolution, fresh `:4173` telemetry (planet counts, screw unit membership, ghost count, perf), same-frame old-vs-new captures at the back plate + Ring-Switch zoom, `npm run typecheck`, `npm run build`, source-register update.
  - **Implemented + machine-verified 2026-09-02** (evidence): 13.73 MB Draco / 1.29 M tris (handle retained more density than target — prim fragmentation + lock-border; perf flat at the 16.8 ms quantum); tree diff = exactly the 9 screws + a world-identical K000004 reparent; explode ladder byte-identical old↔new; screws consolidated as a `fastener` rig unit (`#0d0d0d`, 383 K tris); CH.04 pixel-diff localized ~21.7 K px at the back plate. **Checkbox awaits Mark's visual ruling** at the preview stop points. Side-finding filed to inbox: dead `ROLE_OVERRIDES` (generic mesh names — pre-existing).
  - **Gearbox bolts (owner spec 09-02, evidence §7–§8):** stopgap quartet superseded — **FINISH 2026-09-02 `c9c2097`: Default.glb rebuilt from `C:\Projects\CAD\JGUN-1.glb`** (Fine+Draco, 4 top-level `90910A815` bolts with CAD-true transforms: az 0°/90°/180°/−90°, r 32.3, z −69.6, shanks radial); `GB_FASTENER_RE` retargeted (+occurrence/HANDLE disambiguation + bolt-GROUP tagging — GLTFLoader expands multi-prim defs into Groups); telemetry exact (ladder byte-identical, pop 45 + clutch ride −291, perf 16.8). **CLOSED 2026-09-02 — owner visual ruling PASS ("looks good") at `?chapter=2`; pushed.**

- [x] **JG-023 — Scroll-scrubbed procedural backdrop layers** · [plan](project/work/plans/JG-023-scrubbed-backgrounds.md) · [skill roster](project/work/plans/JG-023-scrubbed-backgrounds-skill-roster.md) · [evidence](project/work/evidence/JG-023-scrubbed-backgrounds-verification.md)
  - Per-chapter procedural GL backdrop layers that scrub reversibly with scroll behind all three stations (camera-locked moving-skybox fiction), replacing the flat `#05070a` background behind the flagged pilot chapter — zero media payload, no new dependencies, `SCRUBBED_BACKGROUNDS` module-scope const; remaining chapters gate per-chapter const after the pilot ruling.
  - **Built + verified 2026-08-31** (orchestrated /unlazy, tree 4, six leaves + adversarial layer; merge `4cffd36`): AC 1-8 green — flag-off parity pixel-equivalent, determinism state-exact with backdrop rows bit-identical, `backdropAlpha` envelope err 0.000000, perf delta vs flag-off ≈ 0 with zero declines (p95 16.8 ms = display vsync quantum, disclosed), backdrop peak linear luminance 0.032433 (18.5× under the 0.6 bloom gate), tier matrix verified incl. authentic-reduced A/B, bundle +6,285 B min JS / media sha1-identical. **AC 9 RESOLVED same day: Mark accepted CH.01** and ordered CH.02 + CH.04 armed.
  - **X1 extension verified 2026-08-31** (solo /unlazy + adversarial subagent; flags `[true,true,false,true]`, CH.03 held until JG-021 closes): all live-chapter gates re-measured — envelope err 0.000000 at 9 checkpoints incl. blend midpoints; perf ON−OFF **+0.002 ms** mean with the wash live for most of the page (0 declines); bloom: pre-tonemap uniform bound ≤ 0.0545 (11× margin, under the 0.45 design bound), 0 backdrop px >204, method validated by reproducing the pilot's 0.0324 @0.10; CH.03 proven bit-dark; tiers re-verified at CH.02/CH.04; bundle +18 B (minifier codegen, no new code); adversary 6/6 could-not-refute, 8/8 re-measures exact. Follow-up: arm CH.03 (one-const flip + rebuild + `?chapter=2` smoke + uniform re-probe) after JG-021's Station-2 ruling.
  - **X2 — CH.03 ARMED 2026-09-01** (JG-021 closed verified same day → follow-up executed with owner authorization; evidence **§X2** + 2 PNGs): flags now `[true,true,true,true]` — **all four chapters live**. Gates re-measured: alpha 1.00000 at all 9 checkpoints (CH.03 set live vs bit-dark before); worst uniform luminance 0.054543 unchanged (CH.03 teal palette 0.0360 @0.65 = 16.7× margin); fwd↔rev state identity exact; perf 16.672/16.8, max 17.3, 0 declines; bundle **+10 B**. `?chapter=2` visual check rides Mark's next look at the preview. **Commits pushed 2026-09-01 per Mark's order.**
  - **Required proof:** `npm run typecheck`, `npm run build`, `scripts/check-station2-contract.mjs` green; flag-off same-frame pixel parity vs main; forward/reverse determinism at checkpoints 0.10/0.30/0.50/0.65/0.80/0.95 (settle-gated capture harness); `telemetry.stage.backdropAlpha` ±0.02 of stageEnvelope; perf p95 ≤ 16.7 ms / max ≤ 50 ms / zero PerformanceMonitor declines; backdrop peak linear luminance < 0.6 measured at every checkpoint (bloom gate); full/lite/reduced/poster tier parity with full-vs-reduced A/B; bundle ≤ +10 KB min JS and +0 media bytes; owner visual ruling at `?chapter=` stop points (same-frame pairs).

- [x] **JG-021 — Sequence re-choreography: camera continuity, enclosure material & animation, callout safe-area placement** · [plan](project/work/plans/JG-021-sequence-rechoreography.md) · [evidence](project/work/evidence/JG-021-sequence-rechoreography-verification.md)
  - Content-aligned camera segments with runtime-derived orbit continuity and framing bias vs. left text; CAD-authentic enclosure materials + ACES tone mapping; scroll-driven panel reveal + Station 2 camera arc; projection-based safe-area datum callouts (GD&T-styled per `project/context/references/media/gdt/`). Fixes the Critique-B HUD clipping/collision issues.
  - **Required proof:** fresh `:4173` telemetry (camera goal delta < ~0.8 m through 0.30→0.60; badge DOM rects vs safe area and vs each other at desktop + 390×844; panel checkpoints at 0.56/0.62/0.70 with post-reveal restore; material identities via `__threeScene`; ToneMapping present), full/reduced-motion/poster tiers, `npm run typecheck`, `npm run build`, `scripts/check-station2-contract.mjs`.
  - **Reopened 2026-08-29 (remediation):** owner visual pass FAILED framing (enclosure/M249 under the left text during [0.60, 0.72]), material look (blown-out, wrong tints on black parts), and GD&T styling (words instead of characteristic symbols). Collisions/safe-area and scroll smoothness pass. Remediation requires subject-bbox projection probes (not lookAt-target), committed screenshot artifacts, and badges styled from the registered `media/gdt/` references.
  - **Remediation implemented 2026-08-29** (bias sign fix + arc/CH.04 re-author + portrait composition; dark `MSP_FINISH_OVERRIDES` material matrix; Y14.5 SVG symbols in FCFs/HUD; badge stacking fix): all probes/screenshots/suite recorded in evidence §9 — **checkbox stays unchecked pending Mark's owner re-review; pushed to origin 2026-08-30 (`2755c8b..287bf05`).**
  - **Owner re-review 2026-08-30 (evidence §10):** runout glyph PASS; framing no complaints; materials PARTIAL FAIL round 2 — blowout fixed but color assignment still wrong (white/grey panels, cyan camera-facing panel; panels are *meant* to be mostly transparent). Handle-rear detail pass filed to inbox as future work.
  - **Materials round 3 implemented 2026-08-30 (evidence §11):** reconciliation proved the lerp repaint (not the airway) made the cyan wall; per owner's "retain colors" ruling all 7 roots now keep the baked GLB palette (no overrides, no lerp), panels mostly transparent (0.35 assembled / 0.18 revealed), and a Station-2-scoped studio crossfade (SceneCanvas `StudioRig`) floors the IBL (the measured blowout driver) — blown-hot 0.57%/0.12%, hero/Station 3 untouched, full suite green. **Checkbox stays unchecked pending Mark's visual ruling; commits pushed to origin 2026-08-30 (`2755c8b..287bf05`).**
  - **Owner final ruling 2026-09-01: PASS (evidence §13).** "The lighting and the glowing effect are gone from station 2. It's good to go." Cumulative glow-arc end-state approved (panels opaque, light trim, dim badges, bloom + fields live, hardened dissolve). Closed as the visual **baseline record**; the planned enclosure recolor (dark blue) is beat C1 of the [animation-redo owner spec](project/work/inbox/animation-redo.md), not a JG-021 reopen. Unblocks the JG-023 CH.03 backdrop arm and the five-plans-synthesis Gate 0.

- [x] **JG-022 — Reduced-motion chapter stranding fix** · [plan](project/work/plans/JG-022-reduced-motion-chapter-stranding.md) · [evidence](project/work/evidence/JG-022-reduced-motion-chapter-stranding-verification.md)
  - The reduced-motion tier unmounts `ScrollRig` but the static chapter renderer depends on it, stranding visitors on CH.01; fixed with a tier-only native-scroll listener in `Chapters.tsx` deriving the active chapter from `CHAPTER_RANGES` (local state, no store writes — the 3D world stays pinned to Station 1; no file overlap with JG-021).
  - **Required proof:** DevTools reduced-motion emulation DOM probes (all four chapters render and advance), full-motion/lite/poster regression, keyboard pass, `npm run typecheck`, `npm run build`. — **Verified 2026-08-30** (poster verified live via `--disable-webgl2`; pushed to origin 2026-08-30 with the JG-021 round).

- [x] **JG-017 — Post-processing and whip-pan camera effects** · [plan](project/work/plans/JG-017-whip-pan-camera-fx.md)
  - Added restrained velocity-driven chromatic aberration (full tier) and bloom (full + lite) during station transitions. Quality tiers and reduced motion have safe fallbacks. `transitionIntensity` telemetry field confirmed live via DevTools probes.
  - **Required proof:** `:4173` telemetry at both transition zones (intensity 0.491/0.493 during active scroll, near-zero at rest), canvas liveness, console clean, `npm run typecheck`, and `npm run build` ([evidence](project/work/evidence/JG-017-whip-pan-camera-fx-verification.md)).

- [x] **JG-018 — Interactive airflow and acoustic-wave systems** · [plan](project/work/plans/JG-018-airflow-and-acoustic-interaction.md)
  - **Depends on:** JG-015 and JG-016. Bound airflow and acoustic-wave interactions to verified Station 2 CAD geometry (`DUCT_INTAKE`, `PUMP_HOUSING`, `ACOUSTIC_BAFFLES`, `DUCT_EXHAUST`, `ISOLATION_MOUNTS`) with aerodynamic cursor deflection, restrained soundwave dissipation, accessible alternatives, and zero per-frame allocation ([evidence](project/work/evidence/JG-018-airflow-and-acoustic-interaction-verification.md)).

- [x] **JG-019 — Deployment readiness and studiomark.dev hosting** · [plan](project/work/plans/JG-019-deployment-and-hosting.md)
  - **Depends on:** JG-014. Publish only after build, asset, fallback, metadata, and production telemetry checks are recorded.
  - **Verified 2026-08-27:** clean-install build, all tier/fallback telemetry, asset/network audit, metadata + 404/cache policy recorded ([evidence](project/work/evidence/JG-019-deployment-and-hosting-verification.md)). Final publish awaits Mark's one-time `npx wrangler login` + Porkbun DNS records — exact steps in [project/context/deployment.md](project/context/deployment.md).

## Task Intake

New ideas, reviews, and plan drafts belong in [`project/work/inbox/`](project/work/inbox/). During triage, either reject/merge the proposal or assign the next stable ID, move it into [`project/work/plans/`](project/work/plans/), add it to the registry, and add an unchecked entry here in the same change.

## Verified Legacy Work

The work below predates the stable-ID system. Its detailed record is preserved in [`project/archive/superseded/TODO-pre-work-index-migration-2026-08-26.md`](project/archive/superseded/TODO-pre-work-index-migration-2026-08-26.md). Create stable-ID plan/evidence records only when legacy work is revised or re-verified; do not fabricate backfilled evidence.

- [x] P000420 speed-indicator grooves and P003068 ring-switch motion.
- [x] K000004 bearing extraction and display rotation turns.
- [x] Spatial leader lines and click-to-inspect interaction.
- [x] PBR material pass, rear-LCD capability, and M249 CAD dissolve.
- [x] Continuous kinematic idling and P000245 outer-shell ghost-fade fix.

## Operating Constraints

- Use part numbers as stable identity keys. Do not reorder D1-AP behavior based only on ambiguous stage names.
- Verify scene claims through runtime telemetry after restarting the `:4173` preview server; screenshots are supporting context only.
- Do not commit `.scratch/` or modify protected parallel-session material, including `docs/orzo-style-portfolio-implemetation-roadmap.md`, without explicit release.
- Never bare-regenerate `public/models/m249-transformed.glb`; follow the protected export procedure in [`project/context/constraints.md`](project/context/constraints.md).
