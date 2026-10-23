# S3b candidate: airflow draw-on (2026-10-12)

Owner direction: "air flow draw on". No repo source was changed; the variants are scratch builds from `git archive` of HEAD `f5e8ac79`, desktop 1440x900, full tier, `.qm-stage` screenshots.

| id | change | where |
|---|---|---|
| V0 current | smoothstep over the named window | none |
| V1 ease-out | `1 - (1 - t)^3` over the same windows, so the leading edge is visible from the first moment and arrives gently | `flow.ts` `evaluateFlow`: the four `smoothWindow(WINDOWS.*Extent, u)` calls |
| V2 earlier | smoothstep kept, windows ~25% shorter: main `[0,130]`->`[0,100]`, lower `[0,190]`->`[0,140]`, merged `[0,70]`->`[0,50]`, sound `[0,100]`->`[0,75]` (ticks) | `beats.ts` window data (beat-local ticks) |

Why these two (current numbers, smoothstep): only 3% of the path is drawn at 10% of the window and 16% at 25%; the main and lower bundles finish with 7% and 5% of their beat left, so there is almost no dwell on the finished path before the next camera move. Merged (53% dwell) and sound (23%) already have room.

Sheets (rows V0/V1/V2, columns u): `sheet-1-main-intake-beat3.png`, `sheet-2-second-breath-beat4.png`, `sheet-3-merged-beat5.png`. Single frames in `frames/` (39 PNGs).

Not measured: frame time. Draw-on only changes a uniform; draw calls and triangles do not change.
Not decided: V1, V2, a mix, or neither. Astra not yet consulted (S3b is a visual change).

## Ruling and applied change (2026-10-12)

- **G9 reviewer:** "Opus 5.5 advisor in place of Astra, owner 2026-10-12, S3b draw-on only." Verdict: **V1 ease-out for the three air bundles (main, lower, merged); not V2, not V1+V2.** The owner's PNG and motion approvals still stand and are not given yet.
- **Scope correction by the ruling:** `soundExtent` stays on smoothstep with its window unchanged. Sound strips draw on from their own `vWindow` in the shader, and `extent.sound` drives opacity and front widening; the scratch variants above had changed it, the applied change does not.
- **Applied (working tree, uncommitted):** `src/scene/rl300/flow.ts`, a `drawOnWindow` helper (`1 - (1 - t)^3` over the same window) used for `main`, `lower` and `merged` extents. `beats.ts` untouched. Existing pins (`preview.test.ts` 204-230: bounded, exact zero at closed boundaries, bundle order) do not move; none edited.
- **Gates (once each):** typecheck 0; full vitest 701/50 (`--testTimeout=60000`); `vite build` 0; `check:station2` 0; `verify-jg033-preview` exit 0 errors [] (against a fresh repo `dist`; it hashes `dist/quiet-machine/index.html`); ribbon-clipping exit 0; U.1 clean. S3a gate unchanged: weight is 0 only when extent is 0.
- **Final sheets (real build, CURRENT vs NEW):** `final-1-main-intake-beat3.png`, `final-2-second-breath-beat4.png`, `final-3-merged-beat5.png`. Motion clips: `motion/current.webm`, `motion/new.webm` (1280x720, 25 wheel notches of 100 px from u .26 to .70, 70 ms apart).
- **Per-notch cost of the faster start** (100 px notch = about 17 ticks at 900vh; path fraction drawn after notch 1..6):

| bundle | window (ticks) | NOW | WAS |
|---|---|---|---|
| main | 130 | .35 .61 .78 .90 .96 .99 | .05 .18 .35 .55 .74 .90 |
| lower | 190 | .25 .45 .62 .74 .84 .91 | .02 .09 .18 .30 .44 .57 |
| merged | 70 | .57 .87 .98 1.0 | .15 .49 .84 1.0 |

  Merged is the fastest (57% in the first notch). The ruling's fallback if it reads as a pop in the clip: lengthen the merged window from `[0,70]` to about `[0,100]` (it has 53% dwell to spare), not a different curve. Not applied; the clip has not been judged by me.
