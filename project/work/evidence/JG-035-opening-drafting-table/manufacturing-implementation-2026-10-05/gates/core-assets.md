# Gates: Core derived study assets

Scope: Prepare named compressed core CAD exports without accepting tooling or progressive machining before G0 review.

- [x] D1: Legacy and approved shaft, housing and support identities/transforms are preserved in named derived full/lite bundles; no second support shift.
  EVIDENCE: reconciled 2026-10-06 to the current eight-node v3 registry (the v2 figures
  above are superseded history). assets/acceptance-2026-10-06/draco-report.json decodes 8
  named parts in BOTH current runtime tiers (hashes 17f90d73 full / b38b91fa lite, equal to
  producer core-assets-report-v3.json and the camera blockout session inputs); support
  correspondence is exactly one +2.75 mm shaft-local +Y shift, bidirectional unmatched 0,
  max residual 9.46e-7 mm (bearing) / 1.5e-8 mm (ring); review support_vertex_checks pass
  with center deltas [0, 2.75, 0]; sole coordinate conversion exporter export_yup.
- [x] D2: Derived topology/normals fixes preserve measured silhouette, tooth profile, clocking and fits; source hashes stay unchanged.
  EVIDENCE: producer core-assets-report-v3.json fidelity re-verified by the independent
  execution review (assets/acceptance-2026-10-06/report.json, Blender 5.1.1): tooth count
  10 and clock delta 0.0 deg in both tiers; silhouette bounds max delta 3.2e-05 mm; runout
  floor radius max delta 0.00048 mm (full) / 0.00881 mm (lite) over 44 samples at 0.1 mm;
  section symmetric Hausdorff max 0.00653 mm (full) / 0.04486 mm at y=9.72 (lite);
  producer geometry hashes match the decoded runtime bundles; source_unchanged=true (all
  four source hashes re-read equal after review).
- [x] D3: Full/lite triangle/byte budgets, source/export hashes and geometric error are measured with reproducible export commands.
  EVIDENCE: reconciled 2026-10-06 to v3 (supersedes the v2 byte/call figures recorded
  earlier on this row). core-assets-report-v3.json + acceptance decode: full 678,008 bytes /
  95,183 triangles (approvedshaft 47,976 <= 50,000) / 8 primitive calls; lite 415,424 bytes /
  49,706 triangles (approvedshaft 14,499 <= 15,000) / 8 primitive calls; published=true with
  runtime GLB hashes equal to producer v3 (17f90d73... / b38b91fa...); two consecutive
  producer runs identical (logs core-assets-producer-v3.log / -rerun-v3.log); command
  Blender 5.1 -b --factory-startup --python-exit-code 1 --python
  scripts/manufacturing/export_study.py.
- [x] D4: Parent independently checks exports; different-provider review occurs before runtime/G2 acceptance.
  EVIDENCE: assets/acceptance-parent-2026-10-06/ contains fresh parent Node/draco3d and
  Blender 5.1 execution reports, both full/lite PASS and exactly equal as parsed JSON to
  the saved independent reports; four immutable source hashes unchanged. Fresh native
  OpenAI review.md gives SHIP for GLM core export acceptance. The 0.053195 mm lite shaft
  sampled-surface diagnostic exceeds 0.05 and remains a failed diagnostic flag; the
  approved leaf spec explicitly gates shafts on enumerated profile/clock/runout/silhouette
  checks, all passing. No threshold was waived. Runtime, overall G2 and owner acceptance
  remain separate.
- [x] D5: Legacy P000725 housing witness ships beside the approved housing in both core bundles, registered in the shaft-local frame; no other part changes.
  EVIDENCE: core-assets-report-v3.json — 8-node registry in both tiers (housing renamed approvedhousing, legacyhousing added, other six names unchanged); housing_registration decoded vertex proof: 0 unmatched both directions, non-seat vertices coincident within 0.005 mm (full 14,323 / lite 8,412) and seat vertices at +2.75 mm (+-0.005) along shaft-local +Y, exported glTF -Z (254 decoded seat vertex instances from 178 welded seat vertices, both tiers); housings 15,000 triangles each full / 9,000 lite with seat-section symmetric Hausdorff 0.001947 mm (full) / 0.003129 mm (lite) over 8 planes (bearing seat + shoulder, plus the same planes +2.75 mm through the approved shoulder), limits 0.025/0.05; bundles 678,008 bytes / 95,183 triangles and 415,424 bytes / 49,706 triangles, 8 draw calls each, published=true; decoded shaft geometry hashes equal the -v2 report in both tiers; source hashes unchanged; two consecutive runs give identical export SHA-256 (full 17f90d73a8312bb9..., lite b38b91fa4371a1f0...; logs assets/core-assets-producer-v3.log and assets/core-assets-producer-rerun-v3.log).
