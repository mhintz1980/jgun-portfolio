# QM9 lite GLB regeneration: scratch result (2026-10-11)

Nothing in `public/` or `dist/` was touched. Build, preview and captures ran in the session scratchpad.

## Why lite was stale
`scripts/build-jg033-lite.py` pins source `a48c12e5` (`fe8ca644`, 2026-09-22). `msp-enclosure.glb` became `c1c919ab` in `15fd4884` (2026-09-24): +5 nodes (`PUMP_HOUSING.001`, `PUMP_END_CASTSTEEL-1`, `PROPOSED_LOWER_INTAKE`, `PROPOSED_COLLECTOR_DUCT_OUTLET`, `V2RL300-SAF-1047-5_PROPOSED_LOUVERS`) and `DUCT_INTAKE_AIRWAY` 24 -> 28 triangles. The builder's hash guard therefore refused to run. Reassessment script: `lite-reassess.mjs`.

## Result of rebuilding from the current source (Blender 5.1, same glTF exporter v5.1.19 as the old lite)
| Check | Old lite | Regenerated |
|---|---|---|
| Triangles | 245,092 | 241,770 (< 248,000) |
| Bytes | 1,139,588 | 1,186,488 (< 4,000,000) |
| `verify-jg033-lite-asset.mjs` (pin swapped, scratch copy) | n/a | pass, 560 occurrences, max transform delta 4e-7 |
| Runtime cap triangles, lite vs full | 162,670 vs 152,008 | **152,008 vs 152,008** |
| Runtime source - kept, lite | 592 (108 + 24 + 460) | 596 (108 + 28 + 460) |
| Draw calls, lite at 390x844 (gate < 90) | 87 / 87 / 67 / 86 | 85 / 85 / 65 / 84 |
| Console errors | 0 | 0 |

Pixel change at 390x844 (u 0 / .2 / .51 / .8): 2.10% / 1.96% / 1.27% / 1.12% of pixels differ. Montage: `lite-before-after.png`.

## Not done (needs approval)
Copy GLB to `public/models/rl300-lite.glb` (force-add), re-pin the hash in the builder and `verify-jg033-lite-asset.mjs`, delete `KNOWN_STALE_LITE` and the two `warnStale` calls in `verify-jg033-preview.mjs`, then run the existing gates once.

## Addendum (advisor pass)
- Whole lite `counts` object, before -> after: only `sourceTriangles`, `keptTriangles`, `cappedTriangles`, `openSectionTriangles` (15751 -> 17882), `sourceMeshes` +1, `batches` +1, `materials` +1, `unmappedMultiSlot` +1, `skippedRoots` 0 -> 1 (`PROPOSED_LOWER_INTAKE`, same skip as full) moved. `mappedParts`, `mappedPrimitives`, `protectedPrimitives`, `v16Applied`, `removedTriangles` are unchanged: V16 material mapping did not change on lite.
- `lite-diff-crops.png`: before | after | changed mask. u .51: the lower-intake louver piece now has slits (the current full-tier design) instead of a solid yellow slab. u .8 (and .2): the pump end/housing right side changed; no overlap or z-fighting with the fused MAN mesh visible. u 0/.2: the roof panel and louver band show different highlights and a few edge pixels; not attributed to a named part.
- Pins that move with the swap: `v16Materials.test.ts:352` (`cappedTriangles: 162670` -> 152008, `batches: 42` -> 43, `unmappedMultiSlot: 47` -> 48); in `verify-jg033-preview.mjs`: lines 13, 17-19, 87, 118-128 (`KNOWN_STALE_LITE`, `warnStale`). `INTAKE_NDC.lite` (6.524) not re-measured.
- Ribbons: count is viewport-keyed (`RIBBON_COUNT` mobile 9 at 390 wide), inside the 6-10 spec on both tiers. Lite policy (DPR 1, no shadows, composer opt-in) already holds.
