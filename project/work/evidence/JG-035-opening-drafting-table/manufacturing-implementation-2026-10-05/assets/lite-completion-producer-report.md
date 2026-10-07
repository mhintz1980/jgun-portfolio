The leaf spec is fully executed. Final report:

**Changed paths** (all within declared ownership):

- [scripts/manufacturing/export_study.py](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/scripts/manufacturing/export_study.py) — v2 rewrite: hard protection replaced with measured, regional, seam-free reduction; new fidelity suite; all evidence writes `-v2`
- `public/models/manufacturing-core-full.glb` (537,164 B) and `public/models/manufacturing-core-lite.glb` (384,232 B) — published; byte-equal to the evidence GLBs
- `assets/` (new only): `core-assets-report-v2.json`, `manufacturing-core-full-v2.glb`, `manufacturing-core-lite-v2.glb`, `selected-cleanup-v2.json`, `source-sections-v2.json`, `exporter-rna-v2.json`, `lite-completion-producer-v2.log`, `lite-completion-producer-rerun-v2.log` — every pre-existing file untouched (2:xx PM timestamps intact)
- `gates/core-assets.md` — D1–D3 checked with evidence lines; D4 left for parent

**Command**: `"C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" -b --factory-startup --python-exit-code 1 --python scripts/manufacturing/export_study.py` — exit 0 on three consecutive runs.

**Per-tier numbers** (decoded Draco artifact vs assembled source):

| | full (limit 0.025 mm) | lite (limit 0.05 mm) |
|---|---|---|
| approved shaft triangles | 47,976 / 50,000 | 14,499 / 15,000 |
| section Hausdorff max | 0.0065 mm (y=9.72) | 0.0449 mm (y=9.72); all others ≤0.009 |
| tooth count / clock | 10 / 0.0° | 10 / 0.0° |
| runout floor error (44 × 0.1 mm) | 0.00048 mm | 0.00881 mm |
| silhouette bounds | 3.2e-05 mm | 3.2e-05 mm |
| bundle bytes / draw calls | 537,164 / 7 | 384,232 / 7 |
| published | true | true |

Support shift verified +2.75 mm (bearing/ring, both tiers, ≤0.005 mm residual); source and topology SHA-256 unchanged after every run; three runs give identical export SHA-256 (full `4c47dab6…`, lite `374b0b7c…`) and identical per-part geometry hashes.

**Method findings worth the parent's attention**: the ramp region (9.6–14.1 mm) holds 113,937 of 139,886 source triangles — hob runout scallops of ~0.12 mm amplitude — so the lite budget only closes because position-preserving dissolve does the tooth-band work (13,538 → 4,603 at 0.02 rad) and collapse never touches teeth. Also, v1's `vertex_group_factor=1000` protection was inverted (Blender group members collapse *first*); it never executed in v1, so no published artifact was affected — the fix is documented in the report's `reduction.semantics`.

**Unresolved budget conflict (disclosed, not blocking)**: lite's dense sampled surface symmetric error is 0.0532 mm — 6% over 0.05 — in regions between the spec's section planes, while every spec-enumerated measurement passes with margin except y=9.72 (0.0449 of 0.05). Per the spec's method I gated publication on the enumerated suite and recorded the surface number in `bundles.lite.surface_error_disclosure` for the D4/parent review; tightening it to a hard gate would require a budget around 20k triangles (curve point measured at 20,001: sections 0.0157). One more thing outside my lane: `assets/lite-completion-producer.log`, 0 bytes at session start, is being written by a concurrent process (5.4 MB at 4:22 PM) — I never touched it.