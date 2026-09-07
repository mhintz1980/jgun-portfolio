# JG-030 P001924 → Handle Anodized Finish — VERIFIED 2026-09-06

Owner ruling (screenshot at `:4173` rear panel): P001924 (LCD housing endcap)
must be identical in material, finish, and color to the Handle. The prior
glossy `shellBlack` (JG-025) showed distinct white specular highlights against
the satin handle body. Superseded.

## Change

`src/scene/rig/materials.ts` only — `/P001924/i` override and the
`lcd-housing` unit default re-pointed from `shellBlack` to `anodizedAluminum`
(the shared handle material instance). `shellBlack` remains in the finish
library, now unused by any part.

## Verification

- **A/B live census vs pre-fix HEAD `9b6444e`** (both freshly built, identical
  GLB): exactly ONE material delta — `P001924-1` 9,165 v `#0a0a0a`
  MeshPhysicalMaterial (clearcoat 1) → `#040404` MeshStandardMaterial. Zero
  other bucket changes (onlyIn both sides empty), mesh count 59 = 59, ghost 1
  = 1, 0 console errors; telemetry at 8 stops differs only by the known
  gear-integration residue.
- **Live material assertion** at `?dwell=lcd`: P001924 bucket = `#040404`,
  roughness 0.26, metalness 0.98, clearcoat null, MeshStandardMaterial — the
  exact handle anodized role instance.
- **Gates:** `verify-jg028-handle-realism.mjs` 5/5 PASS,
  `verify-jg027-lcd-cluster.mjs` PASS (red bezel / readout / button-symbol
  pixel gates unaffected), typecheck (via build) green, `npm test` 10/10,
  `check:station2` PASS.
- Rear-panel screenshot: `rear-panel-dwell-lcd.png` in this folder — endcap
  reads satin, matching the handle; no glossy highlight blob.

## Artifacts

`jg030-p001924-handle-finish/` beside this file: A/B census diff and the
rear-panel dwell capture.
