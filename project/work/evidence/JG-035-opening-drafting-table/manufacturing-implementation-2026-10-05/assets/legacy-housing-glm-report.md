Done — the leaf spec is fully executed. Summary of what shipped:

**Changed paths (all within the spec's file ownership):**

- `scripts/manufacturing/export_study.py` — v3: 8-part registry (`housing` → `approvedhousing`, new `legacyhousing` from `HOUSING_P000725_ORIG`), seat-protected housing reduction with the legacy export derived from the same reduction via per-vertex source deltas (measured fact: the housings differ only at the bore-shoulder seat, +2.75 mm shaft-local +Y), 8 seat-section planes, decoded registration proof, v2 shaft-hash equality gate, rerun-determinism tracking
- `public/models/manufacturing-core-full.glb` — republished (SHA-256 `17f90d73a8312bb9…`)
- `public/models/manufacturing-core-lite.glb` — republished (SHA-256 `b38b91fa4371a1f0…`)
- New `-v3` evidence only: `core-assets-report-v3.json`, `core-assets-producer-v3.log`, `core-assets-producer-rerun-v3.log`, `selected-cleanup-v3.json`, `source-sections-v3.json`, `exporter-rna-v3.json`, `manufacturing-core-full/lite-v3.glb` (all `-v2` files untouched)
- `gates/core-assets.md` — appended checked D5; D1–D4 lines untouched

**Command (both runs):** `"C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" -b --factory-startup --python-exit-code 1 --python scripts/manufacturing/export_study.py` — second run identical export SHA-256 (`rerun_determinism.identical=true`).

**Per-tier numbers:** full 678,008 bytes / 95,183 tris / 8 draw calls / published; lite 415,424 bytes / 49,706 tris / 8 draw calls / published. Housings: 15,000 tris each (full), 9,000 each (lite); seat-section Hausdorff 0.001947 mm (full) / 0.003129 mm (lite) vs limits 0.025/0.05; surface error 0.0133 / 0.0107 mm. Decoded shaft geometry hashes equal the v2 report in both tiers; source blend hashes unchanged.

**Registration proof (decoded, both tiers):** zero unmatched vertices in both directions; non-seat vertices coincident within 0.005 mm (14,323 full / 8,412 lite); seat vertices at +2.75 mm ±0.005 along shaft-local +Y, glTF −Z (254 decoded seat vertex instances from 178 welded seat vertices — the count is higher after export because sharp-edge shading splits vertices in place; positions, not indices, are what the proof counts). The source blend held `HOUSING_P000725_ORIG`, so `Default.glb` was never imported; its hash still reads `8b07246c…` unchanged.

**Unresolved:** nothing for this leaf. Two things belong to the parent/other agents: the node rename `housing` → `approvedhousing` is breaking for any existing consumer of the old name, and D4 (independent parent check) remains the acceptance gate.