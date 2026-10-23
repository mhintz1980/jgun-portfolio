# S3a: skip a ribbon bundle's draws while its alpha weight is exactly zero (2026-10-12)

Owner: "Go on S3" (2026-10-12), with the earlier ruling that S3 may change the look. This pass changes **no look**: pixel-identical by construction and by measurement. No choreography window was moved.

## Edit
`src/scene/rl300/AirRibbons.tsx` only (+13/-2). In the existing `useFrame`, each bundle's two meshes (visible and occluded-hidden) get `visible = flow.weight[bundle] > 0`. Keyed to the value that multiplies final alpha (`alpha *= uWeight; if (alpha < .003) discard`, all strip kinds, both materials), not to beat membership, so a bundle that is still fading is never cut. Reduced motion changes `uExtent` only, not weight, so the gate is unaffected.

## Proof
- `cross-head-vs-new.txt`: HEAD (`ebea2dec` source) build vs new build, threshold 0, 4 rows (desktop 1440x900, portrait 390x844, tablet 768x1024, lite 390x844) x 19 u (0 .07 .13 .2 .27 .28 .34 .43 .51 .52 .6 .685 .76 .77 .825 .9 .95 .99 1) = **76 compares, 0 changed pixels on all**. The u values include the instants a bundle's weight leaves zero (.27/.28 main, .43-.6 lower and merged, .76/.77 sound).
- `verify-jg033-preview.log`: exit 0, errors [] (draw-call pins `< 150` / `< 90` hold).
- B.1 typecheck exit 0. B.2 full `vitest run --testTimeout=60000`: **50 files, 701 tests passed**, exit 0 (the default 5 s timeout flakes under load, per handoff 12a). B.3 `vite build` exit 0 to a scratch outDir. B.4 `npm run check:station2` exit 0. U.1 clean (only `AirRibbons.tsx` plus docs/project); U.2 hunks=1 removed=0. `verify-jg033-ribbon-clipping.mjs` exit 0 against the new build (the existing gate that mutates ribbon materials; all assertions pass).
- Not run: U.4 (`check-qm-jgun-assets.mjs`, needs a base build); the change is inside `src/scene/rl300` and the compare is for the main page chunk. `App.tsx` lazy-imports the same `QuietMachinePreview`; the pixel compare covered `/quiet-machine/` only.
- No test added, no gate added, nothing removed.

## Baseline note
The baseline is a `git archive HEAD` tree taken during this session; the poster session committed to this branch meanwhile (`5a7d7a73`, `b1d4e41a`, `fc527e87`). Both builds therefore carry the same poster/caption source, which the 0-pixel result confirms: only `AirRibbons.tsx` differs between them.

## Payoff (draw calls HEAD > new; triangles move with them)
| frame | full (desktop) | lite |
|---|---|---|
| closed (u 0-.13, .99-1) | 119 > 111 | 61 > 53 |
| open, no bundle live (u .2, .27, .95) | 142 > 134 | 85 > 77 |
| open, main only (u .28-.34) | 142 > 136 | 84-85 > 78-79 |
| open, lower+merged (u .51-.52) | 119-121 > 115-117 | 65-67 > 61-63 |
| **worst sampled open frame (u .77, all four live)** | **142 > 142** | **84 > 84** |
Portrait 143 > 135 at u .2/.95 is the highest HEAD count; the highest after is 142 (u .77). So the **worst sampled draw count falls by only 1 (143 > 142 full, 85 > 84 lite)**: at u .77 every bundle is live and nothing is skipped. This is 19 sampled u values, not a sweep: an unsampled u between .77 and .9 with all four live could still read 143.

## S4 knock-on (recorded, S4 table not edited)
The approved S4 budget is "<= +5 over baseline, inside `< 150`" (full) and "<= +2, inside `< 90`" (lite). The binding frame is the all-bundles-live frame, which this change does not touch. Headroom there stays 7 (full, 149 - 142) and 5 (lite, 89 - 84) from the numbers above, one more than before. The saving is real at most other frames and on closed frames; whether it moves frame time is **not measured** (no device-named p95 exists).

## Freeze check
`grep` over `src/scene/rl300` (non-test) for `clock`, `elapsedTime`, `performance.now`, `Date.now`, `getDelta`: the only hits are the scene's own render-time telemetry (`QuietMachineScene.tsx:121,131`) and comments. `evaluateFlow`/`evaluateShot` take only `u`; the gate reads `flow.weight` and holds no state, so a stationary u freezes and forward, reverse and jump return the same visibility. Not run as a sampled script.

## Not done, and why
- `{ratio, isActive, local}` per beat and `fit()` windows: no caller would use them in a pixel-identical pass, `smoothWindow` rewrites would drift floats, and the GLSL bakes absolute-u windows. Recorded as: state is already a pure function of `u`.
- Index-sliced `soundFronts` generator: the windows are already data (S2b); `beats.ts` is left alone because the poster repoint writes it.
- Any look change: awaiting direction. See handoff.
