# JG-027 — LCD Cluster Restoration & Illumination — Verification

**Status: machine-verified 2026-09-06 (branch `zcode/jg-027-lcd-cluster`) — owner visual ruling PENDING at `http://localhost:4173/?dwell=lcd`.**

**Revision 1 (owner defect report + ruling, 2026-09-06):** owner observed the endcap window reads **portrait** from the dwell camera while the bezel/readout dressing was world-up-based **landscape** — only the middle slice of the readout (",250") showed through the window. Ruling: rotate the LCD dressing **90° clockwise** from the viewer; button symbols are correct as-is. Implemented as a −90° right-handed rotation about the screen normal applied to the bezel + readout basis (`lcdCluster.ts` `READOUT_BASIS`). New probe gates: bezel/readout long axis vertical on screen (`longAxisUpDot` = 1.0, threshold 0.8) and text baseline flowing **top-to-bottom** (`readsTopToBottom: true`); symbol gates unchanged (horizontal, untouched). Re-run PASS: facing 0.924–0.973 all surfaces, readout 1,734 white px in its (now portrait) rect, symbols 459–604 white px each, zero failures, both viewports + `?dwell=lcd` (paced 0.47299) + reduced-motion green.

Probe: `scripts/verify-jg027-lcd-cluster.mjs` (assert pass `report.json`, pre-fix reference `report-before.json`, both in this directory, PNGs alongside). All runs against a fresh `npm run build` + restarted `:4173` preview; `npm run typecheck` PASS; `npm run check:station2` PASS (2,380,776 B, 7 roots, 7 anchors).

## Root cause + record correction

The cluster dressing (bezel ring, readout, 3 button symbols) had **never been visible**. `findPartMesh` measured primitive 0 of each part's multi-primitive GLTF mesh (screen P002115 = 22 prims; prim 0 is a zero-thickness edge sliver) → degenerate center/axis math → decals mounted inside the handle facing down, occluded by the panel (P002115) and endcap (P001924). JG-026 is exonerated: JG-025's work commit `4e2b51a` was developed on top of the JG-026 rebuild and `src/` is byte-identical since; the JG-025 owner-approved frames already show the blank LCD. Fix: union-bounds measurement over all mesh descendants (`Box3` node-local union, child-order independent, pre/post consolidation) + button cap axis chosen by max |dot| with the resolved screen normal + degenerate-extent guard.

**Erratum for JG-025 evidence:** its dwell-direction note ("scroll ≈ 47% or `?chapter=2`") is stale — post-JG-026 the dwell is **paced** 0.473 = raw ≈ 0.58 (document fraction ≠ camera progress). Its material-identity and button de-stack assertions were accurate but did not include decal visibility; the blank readout/bezel/symbols in its PNGs went unnoticed. This probe's visibility gates (below) are the class of check that was missing.

## Pre-fix reference (BEFORE run, same probe, old build)

| surface | facingDot | red px in rect | white px in rect |
|---|---|---|---|
| bezel | −0.308 | 0 | 0 |
| readout | −0.309 (texture drawn: 10,638 bright px) | 0 | 0 |
| symbols ×3 | +0.22 / −0.26 / −0.30 (dark decals, 0 white px) | 0 | 0 |

Zero cluster pixels in every projected rect (~60–80 k px sampled each) — the dressing contributed nothing to the frame.

## Assert pass (AFTER run)

Dwell: natural scroll to paced 0.473 via `__drawingProof.scrollToProgress`, settle-gated (quiet-frame discipline from the JG-026 harness); `explodeFactor` 1.0; zero page errors.

| gate | desktop 1920×1080 | mobile 390×844 |
|---|---|---|
| facingDot > 0.5 (all 5 surfaces) | 0.924 bezel/readout, 0.956–0.973 symbols | identical (same scene pose) |
| readout texture bright px | 11,857 | 11,857 |
| symbol texture white px (each) | 9,860 / 9,860 / 9,861 | same |
| bezel red px in rect | **927** (was 0) | 573 |
| readout white px in rect | **1,507** (was 0) | 926 |
| symbol white px in rect | 604 / 459 / 558 (was 0) | 363 / 281 / 346 |

Button symbols de-stacked: rect centers 60 px apart vertically, ▲ top / ⏎ middle / ▼ bottom. Orientation check: each decal's local +Y maps 14.4–15.1 px UP on screen with ~0 tilt (text upright). Readout content per owner ruling 2026-09-06: `1,250 N·m` primary, `PEAK`/`CAL OK` status row, `STAGE 5` mode, `922 FT-LB` secondary, 4/4 battery bars; symbols are luminous white (`#ffffff` fill, 0.45-alpha stroke, radial aura) per ruling 2.

**Method note (deviation from plan wording):** occlusion is asserted via the per-decal pixel gates rather than "zero occluding meshes" — the decals sit sub-millimetre from their host panels, whose bounding spheres always intersect the sight line, so a sphere-based ray test false-positives on correct placements. Pixels present in the decal's own projected rect are the authoritative visibility proof (they were 0 before the fix, hundreds-to-thousands after).

## `?dwell=lcd` deep-link

`scrollStore.initialScrollProgress()` returns the paced dwell midpoint; landed paced **0.47299** (window 0.458–0.488) via natural scroll through `rawScrollFor`, viewport-independent, zero page errors. (Never the `__drawingProof` pin — it drives the camera but not GSAP, so `explodeFactor` would stay 0.)

## Tiers

- Reduced-motion (emulated `prefers-reduced-motion`, reload): zero page errors, rig + cluster built (`hasCluster: true`).
- Poster: covered by the standing SSR fallback check (`scripts/check-fallback.tsx`, no-WebGL path unchanged by this task — no new WebGL entry points added).

## Ruling requested

Owner visual ruling at **`http://localhost:4173/?dwell=lcd`** — bezel ring, readout content, and lit button symbols in one framed stop.
