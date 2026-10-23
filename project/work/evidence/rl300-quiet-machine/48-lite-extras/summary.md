# Lite tier loads the extras (2026-10-12)

Owner 2026-10-12: "lite tier's missing extras ... approved", then "raise the lite pin" (and "Desktop only is enough" for GPU-6). Owner approved the PNGs and said "Opus stands in, Yes" (Opus 5.5 advisor in place of Astra, lite extras only), 2026-10-12.

## Edits (uncommitted)
- `src/scene/rl300/QuietMachineScene.tsx`: the extras GLB now loads on lite too (the `lite ? null :` branch removed; comment updated).
- `scripts/verify-jg033-preview.mjs` (existing asserts, no new ones): lite draw calls `< 90` > `< 95`; lite `keptTriangles < 248000` > `< 260000`; the omitted-triangle identity counts `replacedTriangles` on both tiers (it excluded lite).
- No test added or removed. `v16Materials.test.ts` "lite tier: same map, no extras" calls `prepareModel` without extras, so it is unaffected (its title is now about that call, not the page policy).

## Measured
| | lite before | lite after |
|---|---:|---:|
| draw calls at u .825 (verifier anchors) | 81 | 88 |
| max draw calls, 600-step sweep (scratch, `47-gpu6-baseline`) | 84 | 91 |
| triangles at u .825 | 556,716 | 569,327 |
| `extraParts` / `extraTriangles` | 0 / 0 | 19 / 13,411 |
| download | | +387,588 bytes |
| S4 lite background budget | <= +2 draw calls | **none left under the old pin; S4 lite gets no background layers unless the pin moves again** |

## Checked after review
- Lite MAN is replaced, not doubled: lite `replacedTriangles` 800 (full 4,000). Both tiers carry the same extras: 19 parts, 13,411 triangles. Lite `keptTriangles` **253,533** (was 241,770): the old "lite CAD under 250k" design bound is passed, hence the second assert moved (248,000 > 260,000). Both moves are the owner's pin raise and are listed in the plan, section 8 item 8.
- Exhaust connector: `prepareModel.ts:378` applies `EXHAUST_STACK_OFFSET` to the pipe node on both tiers ("Both tiers carry the same node"). `lite-vs-full-crops.png` shows the stack, connector and gauge dials at the same place on lite and full (u .34 and .58); the remaining differences are tier materials (radiator black vs silver), not the extras.

## What changes on screen (`lite-before-after.png`, 1440x900 lite, 8 u values)
The exhaust connector pipe now stands taller on the engine side, and the gauge dials appear on the black control panel (u .58 and later). Nothing else moves; ribbons are identical in both rows (the baseline is a build of HEAD without this edit).

## Gates (once each)
typecheck 0; full vitest 701/701; build 0; `check:station2` 0; `verify-jg033-preview` exit 0 errors []; ribbon-clipping exit 0; U.1 clean. `verify-page-transition` not run (nav and fade untouched).
