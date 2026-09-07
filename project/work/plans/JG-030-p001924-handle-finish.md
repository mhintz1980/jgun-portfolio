# JG-030 — P001924 LCD housing → handle anodized finish

## Owner ruling (2026-09-06, screenshot at `:4173` rear panel)

P001924 (LCD housing endcap) must be **identical in material, finish, and
color to the Handle** — the deep satin anodized aluminum (`#040404`,
roughness 0.26, metalness 0.98, zero clearcoat). The previous glossy
`shellBlack` (#0a0a0a, clearcoat 1.0 — JG-025 ruling) shows distinct white
specular highlights against the handle body and is superseded.

## Change

`src/scene/rig/materials.ts` only:
- `ROLE_OVERRIDES`: `[/P001924/i, 'shellBlack']` → `'anodizedAluminum'`.
- `unitDefaultRole('lcd-housing')`: `'shellBlack'` → `'anodizedAluminum'`
  (override and fallback stay identical, as they were before).
- Comments updated to record the ruling. The `shellBlack` case remains in the
  finish library (unused by any part after this change).

The anodized role is a shared material instance, so P001924 gets the exact
handle finish by construction. Bucket stays separate (own animation unit),
now `lcd-housing|anodizedAluminum|s` at 9,165 v.

## Out of scope

- Red bezel ring, LCD readout decal, button symbols (JG-025/JG-027 cluster)
  untouched. No geometry/GLB change, no animation change.

## Required proof

- A/B live census vs pre-fix HEAD `9b6444e`: exactly one bucket delta —
  P001924-1 9,165 v `shellBlack` → `anodizedAluminum`; nothing else changes.
- Live assertions: P001924 bucket `#040404` / r0.26 / m0.98 / clearcoat null.
- Gates: `verify-jg028-handle-realism.mjs`, `verify-jg027-lcd-cluster.mjs`
  (bezel/readout/symbol pixel gates), typecheck (build), `npm test`,
  `check:station2` — green, 0 console errors.
- Owner visual ruling at `:4173` rear panel.
