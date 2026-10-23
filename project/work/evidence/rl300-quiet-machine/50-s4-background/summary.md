# 50 S4 layered background (Job 2), 2026-10-12

Candidate 1 of 1, uncommitted. Baseline = scratch build of HEAD `9b6d1f52`; after = same + `BackgroundDirector.tsx` (new) + 3 lines in `QuietMachineScene.tsx`. Full tier only.

## What it is
One fullscreen triangle behind everything (`renderOrder -1000`, no depth test or write), one ShaderMaterial, no texture. In the one shader: a gamma-correct base gradient (mixed in linear, converted to sRGB), a far bloom layer and a nearer band layer, and a static interleaved-gradient dither. `BASE #101b24` is the page colour and the fog colour; the glow is masked to fade to exactly `BASE` at the canvas edge ellipse and at the floor's far-edge horizon (computed from the camera each frame), so there is no box and no new seam (the floor and sky boundary already exists at HEAD). Layer offsets come from the evaluated camera's yaw and pitch (portrait included), updated at `useFrame` priority 1 (after Driver sets the camera, before it renders). Per-beat looks are sampled at beat centres and smoothstep-blended: a pure function of `u` and the camera, no time term.

## Substitutions and omissions, named
- Dither: procedural interleaved-gradient noise, static, instead of the plan's 64x64 blue-noise texture (no texture memory, deterministic under `frameloop="demand"`).
- Parallax: the camera orbits a pivot, so the layers sit behind it and slide against the camera yaw and pitch by an angle that grows with depth (the far layer moves most). The first build had the yaw sign inverted (the layer drifted with the turn); a numeric sweep of the evaluated camera against a world-fixed far point showed 0 of 40 sign agreements, it was flipped, and the PNGs and clips are from the corrected build.
- Pointer layer: not built (demand frameloop and the determinism gate). It would cost 0 extra draw calls inside this pass as its own candidate; the `< 150` pin would not need to move.
- Offline still for poster and reduced motion: both paths are the S5 WebP posters and mount no canvas, so no live layer exists there.
- Lite: no layer, as ruled. Lite before/after: 0 changed pixels (2 frames).

## Cost (budget in parentheses)
| | before | after | budget |
|---|---|---|---|
| draw calls at u .34, full | 136 | 137 | <= +5 (worst sampled open frame 142 to 143) |
| triangles full | 1,202,864 | 1,202,865 | <= +100 |
| materials (prepared model counts) | 49 | 49, plus 1 ShaderMaterial by construction (BackgroundDirector.tsx) | <= +3 |
| geometries / textures | 74 / 4 | 75 / 4 | texture memory +0 (<= 8 MB) |
| lite draw calls / triangles | 91 / 569,519 | 91 / 569,519 | none |
| full p95, uncapped sweep, 6 interleaved base/after pairs | 10.2-11.4 ms | +0.8 ms median; per pair +1.1, +0.9, +0.1, +0.7, -0.1 and one disturbed pair (+10.8, lite control +3.8 in the same pair) | within +1.0 ms of same-session base |
Median p50 delta 0.0 ms. Lite carries no layer and is the noise control: median +0.25 ms, range -0.4 to +0.5 outside the disturbed pair. One pair sits at +1.1, so the margin to the +1.0 rule is thin; cause not measured. An earlier set of runs happened while the GPU was busy (base p95 about 18 ms) and is not used. Absolute p95 here is 10-11 ms, in line with the 11.6 ms of 47-gpu6-baseline.

## Evidence
`sheet-full.png` (7 u values incl. .825, the warm beat-06 look), `sheet-phone.png`, `strip-motion.png` (8 frames per clip, before and after), `frames/` (full 9 u, lite 2, phone 2, before and after), `diff/`, `motion/before.webm` and `after.webm` (1280x720, 40 wheel notches forward then 40 reverse, about 17 s), `bandcheck.png`. Banding (final build): across the glow at y 105/125/145 the longest run of identical colour is 4-11 px at 41-86 distinct values per row, with one 20 px run at the crest of u .43; the dither amplitude ramps in at a glow weight of .004 so the faint tails are dithered too (an earlier build ramped at .02 and left 1-level plateaus of up to 28 px in the tails; fixed). The flat BASE stays exactly BASE. Continuity: the look blend changes at most 7e-4 (linear) per 1/4000 of u.

## Gates
Run three times, not once: the tree changed after the first run (yaw sign fix, then the dither threshold). Final tree: typecheck 0; full vitest 50 files / **702** tests (+1 is the automatic `shellBoundary` case for the new file, no test written); build 0; check:station2 0; verify-jg033-preview 0 with errors []; ribbon-clipping 0; U.1 only `src/scene/rl300/`; U.2 index.html / quiet-machine-main / public/models / src/shared diff empty.
The layer is invisible at u .51 and .58 (0% and 0.3% of pixels changed): the camera there sees only the enclosure and floor. Changed pixels elsewhere: 2.5-6.7% of the frame, all in the sky region behind the enclosure; lite 0.

Timing was measured on the build before the dither-threshold change (one constant in the same shader pass); it was not re-measured. The draw call, triangle and texture counts are unchanged by it.

Ruling: Opus 5.5 in place of Astra (owner 2026-10-12): stills, motion and dither pass on full tier; phone stills see below. Three changes after the first build, all named above: yaw sign, dither threshold, and the capture scripts are the before+after originals.
