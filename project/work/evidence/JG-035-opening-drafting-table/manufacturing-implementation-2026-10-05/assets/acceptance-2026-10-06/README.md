# Core asset acceptance 2026-10-06 (eight-node v3 reconciliation)

Completed 2026-10-06 after the earlier run was cut off (HTTP 429), which had left this
README and the gate updates unfinished. Scope: independent decode/hash check of the
current runtime bundles plus the recorded independent review execution. No CAD or source
mutations; immutable sources untouched.

## Inputs (current runtime artifacts)

- `public/models/manufacturing-core-full.glb` - 678,008 bytes, SHA-256
  `17f90d73a8312bb9...`
- `public/models/manufacturing-core-lite.glb` - 415,424 bytes, SHA-256
  `b38b91fa4371a1f0...`

Both equal the producer v3 export hashes (`../core-assets-report-v3.json`) and the
camera blockout session input hashes (`../../camera/blockout-2026-10-06/report.json`).

## Evidence

- `decode_independent.mjs` -> `draco-report.json`: independent draco3d decode of both
  tiers. 8 named parts per tier (legacyshaft, approvedshaft, approvedhousing,
  legacyhousing, legacybearing, legacyring, approvedbearing, approvedring); normals clean
  (max unit error 1.7e-7, zero nonfinite/zero normals); support correspondence exactly one
  +2.75 mm shaft-local +Y shift (unmatched 0; max residual 9.46e-7 mm bearing, 1.5e-8 mm
  ring); housing registration unmatched 0, max residual 2.79e-5 mm; PASS both tiers.
- `review_assets.py` (Blender 5.1.1) -> `report.json`: independent execution review
  that reuses the producer's pure measurement functions (script docstring: independent
  execution/provider, not an independent numerical algorithm). Asserts the runtime GLBs
  equal the producer v3 report hashes and the archived v3 exports; producer geometry
  hashes match; enumerated shaft fidelity PASS in both tiers (tooth 10/10, clock delta
  0.0 deg, silhouette max 3.2e-5 mm, runout max 4.8e-4 mm full / 8.8e-3 mm lite over 44
  samples at 0.1 mm, section Hausdorff max 0.00653 mm full / 0.04486 mm lite at y=9.72);
  support vertex checks pass bidirectionally (max 9.54e-7 mm); budgets pass; source hashes
  unchanged before/after; PASS. The report labels review_provider OpenAI vs producer GLM
  (PLAN/log attribution); this session found the artifacts on disk and cannot attest the
  executor independently of that label.
- `draco-run.log` / `run.log` - raw decoder and review logs.

## Recorded metric that needs reading care

lite approvedshaft sampled symmetric surface error max 0.0532 mm exceeds the 0.05 mm
sampled-surface tier figure. Shaft gating in the producer/review acceptance uses the
enumerated profile checks (all PASS above); the sampled-surface-within-limit check holds
for the full tier (0.0079 mm) and every non-shaft lite part (max 0.0107 mm). Recorded as
found; not reinterpreted.

## Boundaries

- D4 (parent independent check / different-provider review before runtime/G2 acceptance)
  remains the parent's gate; this packet reconciles D1-D3 evidence to the current
  eight-node v3 state.
- Blender/export/decode proof is not website-runtime or production-tooling certification.
