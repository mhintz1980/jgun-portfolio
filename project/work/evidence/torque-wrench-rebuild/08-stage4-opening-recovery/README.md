# Stage 4 — opening/pit recovery evidence

Opened 2026-10-13 immediately after the Stage 3 leaf exit (`../07-autonomous-2026-10-12/stage3-exit-2026-10-13.md`). Stage 4 is **in progress**. Nothing here closes G4, G5, G6, G9, Astra effects review, or owner acceptance.

## Step 1 — controlled camera/remap A/B (measured)

Harness: `scripts/verify-torque-opening-ab.mjs` (new, task-owned). Two matched-input measurements in one run:

1. **Camera-law A/B (offline, isolated).** The working-tree `src/scene/drawing/sheetCamera.ts` and the recovered pre-close-reading-rework version (`git show 8988c2da^:src/scene/drawing/sheetCamera.ts`) are each bundled with the *current* sibling modules and evaluated over one shared layout, at both viewports' aspects, across twelve intro times. Because only the sheetCamera law differs, this separates the camera/remap change from pit-geometry changes before any cause is attributed.
2. **Live runtime capture.** The real private page is walked across the drafting → pressure → rupture → emergence → close handoff, recording canonical opening telemetry and capturing unaltered PNGs.

### Measured result (build `.scratch/jg038-stage4-20261013-j`)

- Camera-law differences between current and recovered law: max **0.490962 m** position, **0.217352 m** look-target, **2.0560°** FOV. The two laws are not identical, so the close-reading rework did change the authored opening camera and remains a live contributor.
- Current sheetCamera SHA-256 `2ea85552d011926f…`; candidate SHA-256 `cbf7cd4edf97df81…` at revision `8988c2da^`.
- Live runtime captures: **desktop 11/11 PASS**, **narrow 11/11 PASS** on the same build and preview.
- Reports: `ab-20261013-j2/opening-ab-report.json` (desktop), `ab-20261013-j2-narrow/opening-ab-report.json` (narrow).

### Live opening telemetry actually observed (desktop)

| Canonical progress | intro t | pressure | fracture | openingClear |
| --- | --- | --- | --- | --- |
| 0.15 | 0.227 | 0 | 0 | 0 |
| 0.395 | 0.790 | 0 | 0 | 0 |
| 0.408 | 0.817 | 0.546 | 0 | 0 |
| 0.415 | 0.835 | 0.970 | 0 | 0 |
| 0.420 | 0.840 | ~1.0 | 0 | 0 |
| 0.428 | 0.873 | 1 | 0.919 | 0 |
| 0.435 | 0.900 | 1 | 1 | 1 |
| 0.460 | 1 | 1 | 1 | 1 |

The solved bake crossing installed at `0.73`. Paper stays opaque (`openingClear === 0`) part-way through the bulge, the opening completes at the emergence handoff, and pressure is monotone non-decreasing across the walk.

## Defect found and fixed during this step

The new opening telemetry initially reported `bakeInstalled: false` and `crossing: null` at every sample. Cause: the world probe's `snapshot` closure is created in an effect that does not depend on the bake state, so it captured a permanently-null `sheetBake` binding. It now reads the existing `bakedSheet` ref. This was a defect in the telemetry added here, not in the opening behaviour.

## Still open in Stage 4

- Attribute cause: separate the camera/remap contribution (now measured) from the pit-geometry contribution before concluding which regressed the opening.
- Recover the September 27 camera-rake intent; confirm the October 1 printed shatter and October 2 model-driven pressure/continuous emergence still read correctly, without reverting approved handwriting or annotations.
- `PitDirector`: irregular rock relief, steep near-vertical walls, depth and occlusion, fissure propagation; replace the circular-hole/splined-collar read; no visible floor, bottom, or far closure.
- Unified light-blue branching electricity across profile trace, interior fractures, and exposed pit fissures, with the accelerating burst/hold rhythm and no permanently glowing seams.
- Verify lit metal, aperture occlusion, no desk exposed through rupture gaps, depth beyond sight, and continuous camera handoffs.
- Astra effects review and owner unaltered-PNG / full-motion acceptance remain separate and unrequested.

## Boundaries

No commit, push, publication, cutover, archive, or protected-sibling access. Heavy jobs were serialized; the preview was restarted after every rebuild. All figures above come from the recorded reports in this folder.
